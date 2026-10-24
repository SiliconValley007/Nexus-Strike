# NEXUS STRIKE

Vanilla JS Canvas top-down arena shooter. No libraries, no CDN, no build step. Open `index.html` or host on GitHub Pages.

Survive escalating waves in a neon arena. Dash, chain combos, grab power-ups, and fight a telegraphed boss every five waves.

## Play

Open `index.html` in a modern browser, or use the live URL. Works on Android Chrome and Windows 10 browsers, including offline after first visit (PWA).

On touch phones, play in landscape. Portrait during a match auto-pauses and shows **ROTATE DEVICE**; resume after rotating. Desktop windows of any size play normally.

## Controls

### Desktop
- **WASD** / **Arrow keys** — move
- **Mouse** — aim
- **Click / hold** — shoot
- **Shift** / **Space** — dash
- **ESC** / **P** — pause
- **Space** — start / play again (title or game over)

### Mobile / Tablet
- **Left side** — virtual joystick (move)
- **Right side** — drag to aim, hold to fire
- **DASH** — dash
- **II** — pause
- Landscape recommended; on touch devices, portrait auto-pauses with a rotate prompt

### Gamepad
- **Left stick** — move
- **Right stick** — aim
- **RT / RB / A** — fire
- **LB / B** — dash
- **Start / Select** — pause, or start from title / game over

Auto-detects touch. Landscape and portrait (touch portrait pauses with rotate). Notched devices use safe-area insets. Desktop never forces rotate.

## Features

- Fixed-timestep loop (60 Hz update, interpolated render, accumulator cap)
- Enemies: chaser, ranger, dasher, tank, splitter (plus splitter shards)
- Boss every 5 waves with telegraphed ring, charge, and blast attacks
- Power-ups: rapid fire, spread, shield, heal, bomb, weapon upgrade
- Combo multiplier and floating score popups
- Dash with i-frames
- Screen-edge damage vignette, hit-stop, layered particles
- Parallax grid and bloom via cached gradients
- Procedural Web Audio music loop and SFX with separate MUSIC / SFX toggles
- Difficulty: Easy / Normal / Hard, per-difficulty high scores in `localStorage` (memory fallback); a run saves only to the difficulty it started on
- Object pools, offscreen-cached background, adaptive particle quality, DPR cap 2
- PWA: manifest, service worker (network-first navigations, stale-while-revalidate assets, versioned cache), PNG + SVG icons, install prompt
- Audio unlock on first gesture; no zoom / context menu / pull-to-refresh
- Handles resize, orientation, visibility, and blur; reduced-motion respected
- Touch portrait play auto-pauses with rotate overlay; desktop is unrestricted


## Tech

- Vanilla ES6 (`index.html`, `style.css`, `game.js`)
- HTML5 Canvas 2D
- Web Audio API
- Gamepad API
- Service Worker + Web App Manifest
- No dependencies, no CDN, no external assets
- Relative paths (works under `/Nexus-Strike/` on GitHub Pages)

Everything is procedural: sprites, particles, arena, music, and SFX.

## File tree

```
.
├── index.html
├── style.css
├── game.js
├── sw.js
├── manifest.webmanifest
├── favicon.svg
├── icon-192.svg
├── icon-512.svg
├── icon-maskable.svg
├── icon-192.png
├── icon-512.png
├── icon-maskable.png
├── apple-touch-icon.png
├── 404.html
├── .nojekyll
├── .gitignore
├── README.md
└── LICENSE
```

## Local run

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080/ . Or double-click `index.html`. Service worker registration is skipped on `file://`.

## License

MIT
