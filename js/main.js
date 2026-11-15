/* =========================================================
   main.js
   Interactions for the portfolio:
     1. Sound toggle and menu sounds
     2. Desk scene: notifications and typing sound
     3. Loading screen before project pages
     4. Live Lagos clock in the footer status bar
     5. Achievements
     6. Claw machine (projects section)
   Each part checks that its HTML exists first, so this
   one file works on every page of the site.
   ========================================================= */

// True when the visitor's device asks for less motion
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- 5. Achievements (defined first, the others use it) ---------- */
const Achievements = (function () {
  const STORAGE_KEY = "cu-achievements";

  // Every achievement on the site. Edit the wording here.
  const list = {
    "sound-on":    { title: "Audio unlocked",   text: "The soundtrack is playing." },
    "save-loaded": { title: "Save file loaded", text: "You opened a project." },
    "crane":       { title: "Crane operator",   text: "You unloaded a crate with the claw." },
    "the-end":     { title: "Full playthrough", text: "You reached the end of the page." }
  };

  const container = document.querySelector(".toasts");
  const queue = [];
  let showing = false;

  function getUnlocked() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (error) {
      return [];
    }
  }

  function saveUnlocked(ids) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch (error) {
      /* ignore: achievements just won't be remembered */
    }
  }

  // Shows one toast at a time so they never stack on top of each other
  function showNext() {
    if (showing || queue.length === 0 || !container) return;
    showing = true;

    const item = queue.shift();
    const toast = document.createElement("div");
    toast.className = "toast";

    const label = document.createElement("p");
    label.className = "toast-label";
    label.textContent = "Achievement unlocked";

    const title = document.createElement("p");
    title.className = "toast-title";
    title.textContent = item.title;

    const text = document.createElement("p");
    text.className = "toast-text";
    text.textContent = item.text;

    toast.append(label, title, text);
    container.appendChild(toast);
    Sound.play("achievement");

    // Stay for 3 seconds, then fade out and remove
    setTimeout(function () {
      toast.classList.add("is-leaving");
      setTimeout(function () {
        toast.remove();
        showing = false;
        showNext();
      }, reduceMotion ? 0 : 300);
    }, 3000);
  }

  return {
    unlock: function (id) {
      const unlocked = getUnlocked();
      if (!list[id] || unlocked.includes(id)) return; // each one only ever pops once
      unlocked.push(id);
      saveUnlocked(unlocked);
      queue.push(list[id]);
      showNext();
    }
  };
})();

/* ---------- 1. Sound toggle and menu sounds ---------- */
(function () {
  const toggle = document.querySelector(".sound-toggle");
  if (!toggle) return;

  function render() {
    const on = Sound.isOn();
    toggle.textContent = on ? "Sound: on" : "Sound: off";
    toggle.setAttribute("aria-pressed", String(on));
  }

  toggle.hidden = false;
  render();

  toggle.addEventListener("click", function () {
    Sound.setOn(!Sound.isOn());
    render();
    Sound.play("click"); // only heard when switching sound on
  });

  // Achievement for hearing the music for the first time
  document.addEventListener("music-started", function () {
    Achievements.unlock("sound-on");
  });

  // "select" sound when the cursor or keyboard lands on something clickable
  const targets = document.querySelectorAll(".btn, .nav-list a, .logo, .sound-toggle");
  targets.forEach(function (element) {
    element.addEventListener("mouseenter", function () { Sound.play("select"); });
    // Focus only makes a sound for keyboard users (a mouse click also focuses things)
    element.addEventListener("focus", function () {
      if (element.matches(":focus-visible")) Sound.play("select");
    });
  });

  // "click" sound when any link or button is pressed (the toggle plays its own)
  document.addEventListener("click", function (event) {
    const clicked = event.target.closest("a, button");
    if (clicked && clicked !== toggle) {
      Sound.play("click");
    }
  });
})();

/* ---------- 2. Desk scene: notifications and typing sound ---------- */
(function () {
  const setup = document.querySelector(".setup");
  // Skipped for visitors who ask for less motion: the scene stays still and silent
  if (!setup || reduceMotion) return;

  const scene = setup.querySelector(".setup-scene");
  const area = setup.querySelector(".setup-notes");

  // Three groups of notifications, 5 each. Edit the lines freely.
  // color: the little square icon. sound: which notification sound plays (see sound.js).
  const groups = [
    {
      name: "School", color: "var(--color-coin)", sound: "school",
      notes: [
        { app: "Calendar", text: "Lecture in 15 min" },
        { app: "Email",    text: "Assignment due Friday" },
        { app: "Portal",   text: "New course material" },
        { app: "Class",    text: "Test moved to Monday" },
        { app: "Library",  text: "Book due tomorrow" }
      ]
    },
    {
      name: "Work", color: "var(--color-ok)", sound: "work",
      notes: [
        { app: "GitHub", text: "Pushed to main" },
        { app: "Build",  text: "Build passed" },
        { app: "GitHub", text: "PR merged" },
        { app: "Deploy", text: "Site is live" },
        { app: "Client", text: "Can we talk at 3?" }
      ]
    },
    {
      name: "Personal", color: "#6FA8DC", sound: "personal",
      notes: [
        { app: "Mum",     text: "Have you eaten?" },
        { app: "Friends", text: "Game night later?" },
        { app: "Gym",     text: "Time to work out" },
        { app: "Music",   text: "New playlist ready" },
        { app: "Network", text: "Data bundle renewed" }
      ]
    }
  ];

  const VISIBLE_FOR = 1000; // each notification stays 1 second, then fades
  const FADE = 300;         // matches the .note transition in style.css
  let timer = null;
  let lastNote = null;
  let onScreen = true;      // sounds only play while the scene is visible

  function randomItem(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  // A random group, then a random line from it (never the same line twice in a row)
  function pickNote() {
    let group, note;
    do {
      group = randomItem(groups);
      note = randomItem(group.notes);
    } while (note === lastNote);
    lastNote = note;
    return { group: group, note: note };
  }

  function show() {
    const pick = pickNote();

    const el = document.createElement("div");
    el.className = "note";
    el.style.setProperty("--note-color", pick.group.color);

    const icon = document.createElement("span");
    icon.className = "note-icon";

    const body = document.createElement("div");
    const label = document.createElement("p");
    label.className = "note-app";
    label.textContent = pick.group.name + " · " + pick.note.app;
    const text = document.createElement("p");
    text.className = "note-text";
    text.textContent = pick.note.text;
    body.append(label, text);

    el.append(icon, body);
    area.appendChild(el);
    if (onScreen) Sound.scene.play(pick.group.sound);

    setTimeout(function () {
      el.classList.add("is-leaving");
      setTimeout(function () { el.remove(); }, FADE);
    }, VISIBLE_FOR);

    schedule();
  }

  // A new notification every 3 to 5 seconds
  function schedule() {
    timer = setTimeout(show, 3000 + Math.random() * 2000);
  }

  // Pause while the tab is in the background, so nothing piles up
  document.addEventListener("visibilitychange", function () {
    clearTimeout(timer);
    if (!document.hidden) schedule();
  });

  /* --- Keyboard sound, in time with the hands ---
     The typing animation flips frames twice per loop (style.css: .setup-scene),
     so each loop gets two key clicks. */
  const TYPING_LOOP = 450; // ms, matches the 0.45s animation
  scene.addEventListener("animationiteration", function () {
    if (!onScreen || document.hidden) return;
    Sound.scene.play("key");
    setTimeout(function () { Sound.scene.play("key"); }, TYPING_LOOP / 2 + (Math.random() * 40 - 20));
  });

  // Only make noise while the scene can be seen
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting;
    }, { threshold: 0.25 }).observe(scene);
  }

  schedule();
})();

/* ---------- 3. Loading screen before project pages ---------- */
(function () {
  const loader = document.querySelector(".loader");
  const links = document.querySelectorAll("a[data-loader]");
  if (!loader || links.length === 0) return;

  links.forEach(function (link) {
    link.addEventListener("click", function (event) {
      // Let ctrl-click, middle-click and similar open new tabs as normal
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (reduceMotion) return; // go straight to the page

      event.preventDefault();
      loader.hidden = false;

      // The fill animation lasts 450ms (see .loader-fill in style.css)
      setTimeout(function () {
        window.location.href = link.href;
      }, 500);
    });
  });

  // If the visitor comes back with the browser's Back button, hide the loader again
  window.addEventListener("pageshow", function (event) {
    if (event.persisted) loader.hidden = true;
  });
})();

/* ---------- 4. Live Lagos clock in the footer ---------- */
(function () {
  const clock = document.querySelector(".hud-clock");
  if (!clock) return;

  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  function tick() {
    clock.textContent = formatter.format(new Date()) + " WAT";
  }

  tick();
  setInterval(tick, 15000); // every 15 seconds is plenty for a clock with no seconds
})();

/* ---------- 6. Claw machine ---------- */
(function () {
  const machine = document.querySelector(".claw-machine");
  const list = document.querySelector(".cartridges");
  const cartridges = Array.from(document.querySelectorAll(".cartridge[data-category]"));
  if (!machine || !list || cartridges.length === 0) return;

  const glass = machine.querySelector(".machine-glass");
  const claw = machine.querySelector(".claw");
  const cratesEl = machine.querySelector(".crates");
  const countEl = machine.querySelector(".machine-count");

  // Timings in milliseconds. They match the transitions in style.css (section 10b).
  const T = reduceMotion
    ? { move: 0, cable: 0, fly: 0, fade: 0, slide: 0, stagger: 0, pause: 0 }
    : { move: 600, cable: 500, fly: 650, fade: 200, slide: 350, stagger: 110, pause: 150 };

  // Smooth curves for the cartridges: they slow down as they land in a slot,
  // and speed up as they drop into a crate
  const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";
  const EASE_IN = "cubic-bezier(0.55, 0, 0.8, 0.3)";

  const REST_CABLE = 24; // cable length when the claw is parked, in px
  const LIFT = 56;       // how far the claw lifts a crate, in px
  const LID = 12;        // height of a crate lid, in px

  let busy = false;

  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function slotOf(cart) {
    return cart.closest(".cart-slot");
  }

  function cartsIn(slug) {
    return cartridges.filter(function (cart) { return cart.dataset.category === slug; });
  }

  function isOut(cart) {
    return !slotOf(cart).hidden;
  }

  function outCarts() {
    return cartridges.filter(isOut);
  }

  // A crate is open when its cartridges are out
  function crateIsOpen(slug) {
    return isOut(cartsIn(slug)[0]);
  }

  /* --- Slots ---
     The list is always in this order:
       1. cartridges that are out, in the order they were unloaded
       2. "Empty slot" placeholders
       3. packed cartridges (hidden)
     so a new cartridge always lands in the first free slot. */

  // How many slots fit in one row right now (1 on phones, 2 on tablets, 3 on desktop)
  function columnCount() {
    return getComputedStyle(list).gridTemplateColumns.split(" ").length;
  }

  function firstFreeSpot() {
    return list.querySelector(".is-empty, .cart-slot[hidden]");
  }

  // Shows just enough empty slots to finish the first row
  function renderEmptySlots() {
    list.querySelectorAll(".is-empty").forEach(function (el) { el.remove(); });

    const out = outCarts().length;
    const needed = Math.max(0, columnCount() - out);
    const firstPacked = list.querySelector(".cart-slot[hidden]");

    for (let i = 0; i < needed; i++) {
      const slot = document.createElement("li");
      slot.className = "cart-slot is-empty";
      slot.setAttribute("aria-hidden", "true");

      const label = document.createElement("p");
      label.className = "empty-label";
      label.textContent = "Empty slot";
      slot.appendChild(label);

      // The first empty slot tells visitors what to do when nothing is out
      if (i === 0 && out === 0) {
        const hint = document.createElement("p");
        hint.className = "empty-hint";
        hint.textContent = "Pick a crate, or press Unload all to see every project.";
        slot.appendChild(hint);
      }

      list.insertBefore(slot, firstPacked); // before null = at the end
    }
  }

  /* --- Build one crate per category, in the order categories appear in the HTML --- */
  const categories = [];
  cartridges.forEach(function (cart) {
    const slug = cart.dataset.category;
    const known = categories.some(function (cat) { return cat.slug === slug; });
    if (!known) {
      categories.push({ slug: slug, label: cart.dataset.categoryLabel || slug });
    }
  });

  const crates = {};
  categories.forEach(function (cat) {
    const crate = document.createElement("button");
    crate.type = "button";
    crate.className = "crate";
    crate.dataset.category = cat.slug;

    const lid = document.createElement("span");
    lid.className = "crate-lid";
    lid.setAttribute("aria-hidden", "true");

    const sticker = document.createElement("span");
    sticker.className = "crate-sticker";
    sticker.setAttribute("aria-hidden", "true");

    const name = document.createElement("span");
    name.textContent = cat.label;
    const count = document.createElement("span");
    count.textContent = String(cartsIn(cat.slug).length);

    sticker.append(name, count);
    crate.append(lid, sticker);

    crate.addEventListener("click", function () { onCrate(cat.slug); });
    // Hover sounds stay quiet while the claw is busy (crates move under the cursor)
    crate.addEventListener("mouseenter", function () { if (!busy) Sound.play("select"); });
    crate.addEventListener("focus", function () {
      if (!busy && crate.matches(":focus-visible")) Sound.play("select");
    });

    cratesEl.appendChild(crate);
    crates[cat.slug] = crate;
  });

  /* --- Keep the counter, lids and screen reader labels in sync --- */
  // Remember which cartridges are out (in order) for this visit, so coming back
  // from a project page shows the machine the way you left it
  const SAVE_KEY = "cu-cartridges-out";
  function saveState() {
    const out = Array.from(list.querySelectorAll(".cart-slot:not([hidden]) .cartridge"));
    try {
      sessionStorage.setItem(SAVE_KEY, JSON.stringify(out.map(function (cart) { return cartridges.indexOf(cart); })));
    } catch (error) {
      /* ignore: the machine just starts packed next time */
    }
  }

  function restoreState() {
    let saved = [];
    try {
      saved = JSON.parse(sessionStorage.getItem(SAVE_KEY)) || [];
    } catch (error) {
      saved = [];
    }
    saved.forEach(function (index) {
      const cart = cartridges[index];
      if (!cart) return;
      const slot = slotOf(cart);
      list.insertBefore(slot, firstFreeSpot());
      slot.hidden = false;
    });
  }

  function update() {
    saveState();
    countEl.textContent = outCarts().length + "/" + cartridges.length + " cartridges out";

    categories.forEach(function (cat) {
      const crate = crates[cat.slug];
      const open = crateIsOpen(cat.slug);
      const n = cartsIn(cat.slug).length;
      const noun = n === 1 ? " cartridge" : " cartridges";
      crate.classList.toggle("is-open", open);
      crate.setAttribute(
        "aria-label",
        cat.label + " crate, " + n + noun +
        (open ? ", unloaded. Press to pack." : ", packed. Press to unload with the claw.")
      );
    });
  }

  function setBusy(value) {
    busy = value;
    machine.setAttribute("aria-busy", String(value));
  }

  function centreOf(element) {
    const r = element.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function clearMotion(cart) {
    cart.classList.remove("is-flying");
    cart.style.transition = "";
    cart.style.transform = "";
    cart.style.opacity = "";
  }

  /* --- Fly cartridges between their crates and their slots ("out" or "in") --- */
  async function fly(carts, direction) {
    if (reduceMotion || carts.length === 0) return;

    // Measure every jump first, before anything moves
    const jumps = carts.map(function (cart) {
      const from = centreOf(crates[cart.dataset.category]);
      const to = centreOf(cart);
      return "translate(" + (from.x - to.x) + "px, " + (from.y - to.y) + "px) scale(0.15) rotate(-8deg)";
    });

    // Start positions
    carts.forEach(function (cart, i) {
      cart.classList.add("is-flying");
      cart.style.transition = "none";
      cart.style.transform = direction === "out" ? jumps[i] : "none";
      cart.style.opacity = direction === "out" ? "0" : "1";
    });
    list.getBoundingClientRect(); // makes the browser apply the start positions first

    // End positions, one after another. Fading happens at the crate end:
    // at the start when coming out, at the end when going in.
    carts.forEach(function (cart, i) {
      const delay = i * T.stagger;
      const easing = direction === "out" ? EASE_OUT : EASE_IN;
      const fadeDelay = direction === "out" ? delay : delay + T.fly - T.fade;
      cart.style.transition =
        "transform " + T.fly + "ms " + easing + " " + delay + "ms, " +
        "opacity " + T.fade + "ms linear " + fadeDelay + "ms";
      cart.style.transform = direction === "out" ? "none" : jumps[i];
      cart.style.opacity = direction === "out" ? "1" : "0";
    });

    await wait(T.fly + (carts.length - 1) * T.stagger);
  }

  // After a crate is packed, the cartridges still out slide up into the gaps
  async function slideIntoPlace(carts, before) {
    if (reduceMotion || carts.length === 0) return;

    carts.forEach(function (cart, i) {
      const now = cart.getBoundingClientRect();
      cart.classList.add("is-flying");
      cart.style.transition = "none";
      cart.style.transform = "translate(" + (before[i].left - now.left) + "px, " + (before[i].top - now.top) + "px)";
    });
    list.getBoundingClientRect();

    carts.forEach(function (cart) {
      cart.style.transition = "transform " + T.slide + "ms " + EASE_OUT;
      cart.style.transform = "none";
    });
    await wait(T.slide);
    carts.forEach(clearMotion);
  }

  // Puts cartridges into the first free slots, then flies them there from their crates
  async function unload(carts) {
    carts.forEach(function (cart) {
      const slot = slotOf(cart);
      list.insertBefore(slot, firstFreeSpot());
      slot.hidden = false;
    });
    renderEmptySlots();
    Sound.play("pop"); // once per unload, not once per cartridge
    await fly(carts, "out");
    carts.forEach(clearMotion);
  }

  // Flies cartridges back into their crates, then closes the gaps they leave
  async function pack(carts) {
    // The box sound plays once, just as the first cartridge lands in its crate
    setTimeout(function () { Sound.play("pack"); }, Math.max(0, T.fly - 150));
    await fly(carts, "in");

    const staying = outCarts().filter(function (cart) { return carts.indexOf(cart) === -1; });
    const before = staying.map(function (cart) { return cart.getBoundingClientRect(); });

    carts.forEach(function (cart) {
      const slot = slotOf(cart);
      slot.hidden = true;
      list.appendChild(slot); // packed cartridges wait at the end of the list
      clearMotion(cart);
    });
    renderEmptySlots();
    await slideIntoPlace(staying, before);
  }

  /* --- The full claw sequence for one packed crate --- */
  async function clawUnload(slug) {
    const crate = crates[slug];
    const g = glass.getBoundingClientRect();
    const c = crate.getBoundingClientRect();
    const trolley = claw.querySelector(".claw-trolley").offsetHeight;
    const hand = claw.querySelector(".claw-hand").getBoundingClientRect().height;

    // Positions inside the glass (clientLeft/clientTop skip the glass border)
    const x = Math.round(c.left + c.width / 2 - g.left - glass.clientLeft);
    const lidTop = c.top - g.top - glass.clientTop - LID;
    const reach = Math.round(lidTop + 6 - 2 - trolley - hand); // prongs close around the lid

    // 1. Slide along the rail
    claw.style.setProperty("--claw-x", x + "px");
    Sound.play("move");
    await wait(T.move);

    // 2. Drop down to the crate and grab it
    claw.style.setProperty("--cable", reach + "px");
    await wait(T.cable);
    claw.classList.add("is-closed");
    Sound.play("claw");
    await wait(T.pause);

    // 3. Lift the crate (cable and crate move together)
    claw.style.setProperty("--cable", (reach - LIFT) + "px");
    crate.style.transform = "translateY(-" + LIFT + "px)";
    await wait(T.cable);

    // 4. Open it and send the cartridges to the first free slots
    crate.classList.add("is-open");
    await unload(cartsIn(slug));

    // 5. Put the crate back down, let go and park the claw
    claw.style.setProperty("--cable", reach + "px");
    crate.style.transform = "";
    await wait(T.cable);
    claw.classList.remove("is-closed");
    await wait(T.pause);
    claw.style.setProperty("--cable", REST_CABLE + "px");
    await wait(T.cable);
    claw.style.removeProperty("--claw-x"); // slides back to the middle

    Achievements.unlock("crane");
  }

  /* --- Controls --- */
  async function run(task) {
    if (busy) return;
    setBusy(true);
    try {
      await task();
    } finally {
      update();
      setBusy(false);
    }
  }

  function onCrate(slug) {
    run(function () {
      return crateIsOpen(slug) ? pack(cartsIn(slug)) : clawUnload(slug);
    });
  }

  machine.querySelector(".machine-unload").addEventListener("click", function () {
    run(function () {
      // Unload every closed crate, in crate order, with no claw (it's the quick option)
      const closed = categories.filter(function (cat) { return !crateIsOpen(cat.slug); });
      closed.forEach(function (cat) { crates[cat.slug].classList.add("is-open"); });
      const carts = [];
      closed.forEach(function (cat) { carts.push.apply(carts, cartsIn(cat.slug)); });
      return unload(carts);
    });
  });

  machine.querySelector(".machine-pack").addEventListener("click", function () {
    run(function () { return pack(outCarts()); });
  });

  // Re-centre the claw and recount empty slots when the screen size changes
  let columns = columnCount();
  window.addEventListener("resize", function () {
    if (busy) return;
    claw.style.removeProperty("--claw-x");
    if (columnCount() !== columns) {
      columns = columnCount();
      renderEmptySlots();
    }
  });

  /* --- Start with every cartridge packed in its crate,
         then bring back any that were out earlier in this visit --- */
  cartridges.forEach(function (cart) { slotOf(cart).hidden = true; });
  machine.hidden = false;
  restoreState();
  renderEmptySlots();
  update();
})();

/* ---------- Achievement triggers that belong to no single feature ---------- */
(function () {
  // Arrived on a project page through a save slot
  if (document.body.dataset.page === "project") {
    Achievements.unlock("save-loaded");
  }

  // Scrolled all the way to the footer of the home page
  const footer = document.querySelector(".site-footer");
  if (document.body.dataset.page === "home" && footer && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        Achievements.unlock("the-end");
        observer.disconnect();
      }
    }, { threshold: 0.6 });
    observer.observe(footer);
  }
})();
