/* =========================================================
   sound.js
   All sound on the site: background music, menu sounds,
   claw machine sounds and the desk scene, using the Web Audio API.

   The "Sound" button in the header is the master switch.
   It is ON by default and turns everything on or off together.
   The choice is remembered with localStorage.

   Browsers only allow sound after the visitor clicks, taps or presses
   a key, so the music starts on their first interaction.

   SOUND FILES
   Each sound below plays its file. If a file is missing or can't be
   read, a simple generated sound plays instead.
   volume goes from 0 (silent) to 1 (full).
   Files only load when the site runs from a server (Live Server or
   the live site), not when index.html is opened by double-click.
   ========================================================= */

const SOUND_FILES = {
  select: { src: "sounds/select.wav", volume: 0.19 }, // hovering anything
  click:  { src: "sounds/click.wav",  volume: 0.17 }, // clicking anything
  move:   { src: "sounds/move.wav",   volume: 0.57 }, // claw sliding along the rail
  claw:   { src: "sounds/claw.wav",   volume: 0.9 },  // claw grabbing a crate
  pop:    { src: "sounds/pop.wav",    volume: 0.7 },  // crate opening, cartridges coming out
  pack:   { src: "sounds/pack.wav",   volume: 0.46 }, // cartridges going back into a crate

  // Desk scene: generated for now. Add your own files here if you like.
  // key:      { src: "sounds/key.mp3",      volume: 0.2 },
  // work:     { src: "sounds/work.mp3",     volume: 0.5 },
  // personal: { src: "sounds/personal.mp3", volume: 0.5 },
  // school:   { src: "sounds/school.mp3",   volume: 0.5 },
};

// Background music: loops forever while sound is on
const MUSIC = {
  src: "sounds/music.mp3",
  volume: 0.12,
  loopSeconds: 22.5 // exactly 9 bars at 96 BPM, so the loop lands on the beat
};

const Sound = (function () {
  const SETTING_KEY = "cu-audio";
  const UI_VOLUME = 0.06;    // generated menu blips (only used if a file is missing)
  const KEY_VOLUME = 0.035;  // keyboard clicks: kept low on purpose
  const NOTE_VOLUME = 0.08;  // notification sounds

  let audioCtx = null;
  let noiseBuffer = null;
  let on = readSetting();
  const fileBuffers = {}; // decoded sounds, by name

  function readSetting() {
    try {
      return localStorage.getItem(SETTING_KEY) !== "off"; // on unless turned off
    } catch (error) {
      return true;
    }
  }

  function saveSetting(value) {
    try {
      localStorage.setItem(SETTING_KEY, value ? "on" : "off");
    } catch (error) {
      /* ignore: the setting just won't be remembered */
    }
  }

  /* --- Download and decode every file as soon as the page loads ---
     An offline audio context can decode before any click (it never plays
     anything), and the decoded sounds work in the real audio context later. */
  const OfflineContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const decoder = OfflineContext ? new OfflineContext(2, 1, 44100) : null;

  function download(src) {
    return fetch(src).then(function (response) {
      if (!response.ok) throw new Error("Sound file not found: " + src);
      return response.arrayBuffer();
    });
  }

  function decodeWith(ctx, data) {
    return ctx.decodeAudioData(data);
  }

  const downloads = {};
  Object.keys(SOUND_FILES).forEach(function (name) {
    downloads[name] = download(SOUND_FILES[name].src);
  });
  const musicDownload = download(MUSIC.src);

  // Without an offline decoder (very old browsers) decoding waits for the real context
  function decodeAll(ctx) {
    Object.keys(downloads).forEach(function (name) {
      downloads[name]
        .then(function (data) { return decodeWith(ctx, data); })
        .then(function (buffer) { fileBuffers[name] = buffer; })
        .catch(function (error) { console.warn(error.message || error); });
    });
  }
  if (decoder) decodeAll(decoder);

  let musicBufferPromise = null;
  function getMusicBuffer(ctx) {
    if (!musicBufferPromise) {
      musicBufferPromise = musicDownload.then(function (data) {
        return decodeWith(decoder || ctx, data);
      });
      musicBufferPromise.catch(function (error) { console.warn(error.message || error); });
    }
    return musicBufferPromise;
  }
  if (decoder) getMusicBuffer(null); // decode the music at page load, so it starts instantly

  /* --- The audio context (created on the first interaction) --- */
  function getContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null; // very old browser: stay silent
      audioCtx = new AudioContextClass();

      // Half a second of random noise, reused for every keyboard click
      noiseBuffer = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate / 2), audioCtx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      if (!decoder) decodeAll(audioCtx);
    }
    if (audioCtx.state === "suspended" && !document.hidden) {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function isRunning() {
    return audioCtx !== null && audioCtx.state === "running";
  }

  // The first click, tap or key press anywhere starts audio and the music.
  // Browsers only allow this from certain events. On phones the start of a
  // touch (pointerdown) doesn't count, only the end of it (pointerup, touchend),
  // so listen for all of them and keep listening until audio is really running.
  const UNLOCK_EVENTS = ["pointerdown", "pointerup", "touchend", "click", "keydown"];
  const LISTEN = { capture: true, passive: true };

  function stopListening() {
    UNLOCK_EVENTS.forEach(function (type) {
      window.removeEventListener(type, unlock, LISTEN);
    });
  }

  function unlock() {
    const ctx = getContext(); // creates the context and asks it to resume
    if (!ctx) {
      stopListening(); // very old browser: nothing to unlock
      return;
    }
    if (on) startMusic();
    if (ctx.state === "running") stopListening();
  }

  UNLOCK_EVENTS.forEach(function (type) {
    window.addEventListener(type, unlock, LISTEN);
  });

  // Pause everything while the tab is in the background
  document.addEventListener("visibilitychange", function () {
    if (!audioCtx) return;
    if (document.hidden) {
      audioCtx.suspend();
    } else {
      audioCtx.resume();
    }
  });

  /* --- Background music --- */
  let musicSource = null;
  let musicGain = null;
  let musicStartedOnce = false;
  let musicWanted = false;

  // MP3 files start with a few milliseconds of silence. Finding the first real
  // sample lets the loop skip it, so there's no gap each time the music repeats.
  function firstSoundAt(buffer) {
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      if (Math.abs(data[i]) > 0.0001) return i / buffer.sampleRate;
    }
    return 0;
  }

  function startMusic() {
    musicWanted = true;
    const ctx = getContext();
    if (!ctx || musicSource) return;

    getMusicBuffer(ctx).then(function (buffer) {
      // Sound may have been switched off while the music was loading
      if (!musicWanted || musicSource) return;

      const start = firstSoundAt(buffer);
      musicSource = ctx.createBufferSource();
      musicSource.buffer = buffer;
      musicSource.loop = true;
      musicSource.loopStart = start;
      musicSource.loopEnd = Math.min(buffer.duration, start + MUSIC.loopSeconds);

      // Fade in over a second instead of starting abruptly
      musicGain = ctx.createGain();
      musicGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      musicGain.gain.exponentialRampToValueAtTime(MUSIC.volume, ctx.currentTime + 1);

      musicSource.connect(musicGain);
      musicGain.connect(ctx.destination);
      musicSource.start(0, start);

      if (!musicStartedOnce) {
        musicStartedOnce = true;
        document.dispatchEvent(new CustomEvent("music-started"));
      }
    }).catch(function () { /* already reported */ });
  }

  function stopMusic() {
    musicWanted = false;
    if (!musicSource || !audioCtx) return;
    const source = musicSource;
    const gain = musicGain;
    musicSource = null;
    musicGain = null;
    // Quick fade out so it doesn't cut off with a click
    gain.gain.setValueAtTime(gain.gain.value, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.25);
    source.stop(audioCtx.currentTime + 0.3);
  }

  /* --- Building blocks for the generated sounds --- */

  // One note. wave: "square" | "triangle" | "sawtooth" | "sine".
  // endFrequency (optional) slides the pitch.
  function tone(frequency, startDelay, duration, wave, volume, endFrequency) {
    const ctx = getContext();
    if (!ctx) return;

    const start = ctx.currentTime + startDelay;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (endFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
    }

    // Quick fade out so notes end with no click
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + duration);
  }

  // A soft bell: a sine note with a quieter note an octave up
  function bell(frequency, startDelay, volume) {
    tone(frequency, startDelay, 0.35, "sine", volume);
    tone(frequency * 2, startDelay, 0.2, "sine", volume * 0.3);
  }

  // A short burst of filtered noise: sounds like a key being pressed
  function click(volume, filterFrequency) {
    const ctx = getContext();
    if (!ctx) return;

    const start = ctx.currentTime;
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    const offset = Math.random() * 0.4; // a different slice of noise every time

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = filterFrequency;
    filter.Q.value = 1.2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.035);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(start, offset, 0.04);
  }

  // Plays a sound file if one is loaded for this name. Returns true if it played.
  function playFile(name) {
    const buffer = fileBuffers[name];
    if (!buffer || !audioCtx) return false;

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    if (name === "key") {
      source.playbackRate.value = 0.94 + Math.random() * 0.12; // so repeated keys differ
    }

    const gain = audioCtx.createGain();
    const volume = SOUND_FILES[name].volume;
    gain.gain.value = typeof volume === "number" ? volume : 0.5;
    source.connect(gain);
    gain.connect(audioCtx.destination);
    source.start();
    return true;
  }

  /* --- Generated stand-ins, used only if a sound file is missing --- */
  const effects = {
    select: function () { tone(660, 0, 0.04, "square", UI_VOLUME); },
    click: function () {
      tone(523, 0, 0.06, "square", UI_VOLUME);
      tone(784, 0.06, 0.08, "square", UI_VOLUME);
    },
    move: function () {
      tone(196, 0, 0.05, "square", UI_VOLUME);
      tone(196, 0.1, 0.05, "square", UI_VOLUME);
      tone(196, 0.2, 0.05, "square", UI_VOLUME);
    },
    claw: function () {
      tone(147, 0, 0.08, "sawtooth", UI_VOLUME);
      tone(110, 0.08, 0.1, "sawtooth", UI_VOLUME);
    },
    pop: function () {
      tone(587, 0, 0.05, "square", UI_VOLUME);
      tone(880, 0.05, 0.07, "square", UI_VOLUME);
    },
    pack: function () {
      tone(880, 0, 0.05, "square", UI_VOLUME);
      tone(587, 0.05, 0.07, "square", UI_VOLUME);
    },
    achievement: function () { // C, E, G, high C
      tone(523, 0, 0.08, "square", UI_VOLUME);
      tone(659, 0.08, 0.08, "square", UI_VOLUME);
      tone(784, 0.16, 0.08, "square", UI_VOLUME);
      tone(1047, 0.24, 0.16, "square", UI_VOLUME);
    }
  };

  /* --- Desk scene sounds --- */
  const sceneEffects = {
    key: function () {         // one key press, slightly different every time
      click(KEY_VOLUME * (0.7 + Math.random() * 0.6), 1800 + Math.random() * 1400);
    },
    work: function () {        // chat app style: two quick bubbly blips
      tone(1250, 0, 0.07, "sine", NOTE_VOLUME, 1500);
      tone(1650, 0.09, 0.09, "sine", NOTE_VOLUME, 1900);
    },
    personal: function () {    // phone text style: a soft three-note chime
      bell(1319, 0, NOTE_VOLUME);
      bell(1047, 0.11, NOTE_VOLUME);
      bell(1568, 0.22, NOTE_VOLUME);
    },
    school: function () {      // a single pop
      tone(900, 0, 0.08, "sine", NOTE_VOLUME * 1.4, 180);
    }
  };

  return {
    // Menu and claw machine sounds (called from clicks and hovers)
    play: function (name) {
      // Nothing plays until the first interaction has started audio
      if (!on || !effects[name] || !isRunning()) return;
      if (playFile(name)) return;
      effects[name]();
    },

    isOn: function () {
      return on;
    },

    // The master switch: music, menu sounds and the desk scene together
    setOn: function (value) {
      on = value;
      saveSetting(value);
      if (value) {
        startMusic();
      } else {
        stopMusic();
      }
    },

    scene: {
      // Timers call this, so it never starts audio by itself
      play: function (name) {
        if (!on || !isRunning() || !sceneEffects[name]) return;
        if (playFile(name)) return;
        sceneEffects[name]();
      }
    }
  };
})();