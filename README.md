# Chinonso Ugwu | Portfolio

My personal developer portfolio, built as a retro arcade game.

- **Name:** Ugwu Chinonso Onochie
- **Matric number:** 23120111052
- **Course:** CSC 419, Advances in Web, Mobile and Blockchain Development
- **Assignment:** Personal Portfolio Website (individual)
- **Live site:** TODO: add the GitHub Pages link here once it's live

## Pages

| Page | File | What it has |
|---|---|---|
| Home | `index.html` | Title screen, About (Level 1), Projects (Level 2), Contact (Level 3) |
| Greedy Pig | `project-greedy-pig.html` | Full description, problem solved, features, screenshots, technologies, what I learned |
| Privacy policy | `privacy.html` | What the site stores and who hosts it |
| Terms and conditions | `terms.html` | Content ownership, credits and use of the site |
| Not found | `404.html` | Shown by GitHub Pages for any address that doesn't exist |

## How it meets the brief

- **About Me:** Level 1 on the home page: who I am, what I do and my focus, plus my tools ("inventory").
- **Projects:** Level 2. Four projects, each with a name, short description, screenshot or icon space, tech stack and status or link. They're stored as game cartridges in a claw machine; the "Unload all" button shows them all at once.
- **Call to action:** Level 3, with Email, WhatsApp and GitHub buttons.
- **Project details page:** `project-greedy-pig.html`, opened from the Greedy Pig cartridge's "Load save file" button.
- **Responsive:** mobile-first CSS with tablet (768px) and desktop (1024px) layouts, tested from 320px to 1280px wide with no sideways scrolling.
- **Code quality:** semantic HTML (`header`, `nav`, `main`, `section`, `article`, `footer`), CSS variables, flexbox and grid, and plain JavaScript with comments. Every page passes the W3C HTML validator.

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

## Project structure

```
index.html                  home page
project-greedy-pig.html     project details page
privacy.html  terms.html  404.html
css/style.css               all styles, mobile first
js/sound.js                 music and sound effects
js/main.js                  claw machine, desk scene, achievements, clock
fonts/                      self-hosted fonts
images/                     desk scene and Greedy Pig screenshots
sounds/                     music and sound effects (see sounds/CREDITS.txt)
tools/voxel_scene.py        script that renders images/desk-setup.png
favicon.svg  favicon.ico  apple-touch-icon.png
```

## Deployment

Hosted on GitHub Pages from the `main` branch. The 404 page uses links that start with `/`, so it expects the site to be served from the root of its address (a `username.github.io` repository or a custom domain).

## Credits

- **Fonts:** Press Start 2P and Atkinson Hyperlegible, SIL Open Font License, via Fontsource.
- **Sounds:** music and sound effects from Pixabay under the Pixabay Content License. Full list in `sounds/CREDITS.txt`.
- **Greedy Pig screenshots:** from the Greedy Pig team project for CSC 419.
- Everything else, including the design, code and desk scene, is my own work.
