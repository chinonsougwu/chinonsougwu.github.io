# Chinonso Ugwu | Portfolio

My personal developer portfolio, built as a retro arcade game.

- **Name:** Ugwu Chinonso Onochie
- **Matric number:** 23120111052
- **Course:** CSC 419, Advances in Web, Mobile and Blockchain Development
- **Assignment:** Personal Portfolio Website (individual)
- **Live site:** https://chinonsougwu.github.io/
- **Repository:** https://github.com/chinonsougwu/chinonsougwu.github.io


## Features

- **Claw machine:** projects are cartridges sorted into crates by type (Games, Web, Desktop). Press a closed crate and the claw grabs it and unloads its cartridges into the first free slots; press an open crate to pack it again.
- **3D desk scene:** a voxel illustration of me typing at my laptop, with notifications from three groups (School, Work, Personal) popping up every 3 to 5 seconds.
- **Sound:** background music, hover and click sounds, claw machine sounds and desk scene sounds, all controlled by one Sound switch in the header. Music starts on the visitor's first click or key press, as browsers require.
- **Achievements:** small pop-ups for things like using the claw or reaching the end of the page.
- **3D grid background:** a tilted grid floor that drifts slowly toward you.
- **Accessibility:** keyboard navigation with visible focus, a skip link, screen-reader labels, colour contrast checked against WCAG AA, and reduced motion respected (animations, the moving grid and the notifications switch off). With JavaScript turned off, every project still shows.

## Built with

- HTML, CSS and plain JavaScript. No frameworks and no build step.
- Web Audio API for all sound.
- Python and Pillow for rendering the desk scene (`tools/voxel_scene.py`).

## Run it locally

The sounds only load from a web server, not from a double-clicked file.

1. Open the folder in VS Code.
2. Install the **Live Server** extension.
3. Right-click `index.html` and choose **Open with Live Server**.

Or, from the folder, run `python -m http.server 8000` and open `http://localhost:8000`.

