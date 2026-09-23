# NEXUS STRIKE

A production-ready AAA-feel top-down arena shooter in a single HTML file. No libraries, no assets, no build step. Open `index.html` and play.

Survive escalating waves in a neon arena. Tight movement, instant shooting, dual-stick mobile controls, and a fast restart loop.

## Play

Open `index.html` in any modern browser, or use GitHub Pages (see Deployment).

## Controls

### Desktop
- **WASD** / **Arrow keys** — move
- **Mouse** — aim
- **Click / hold** — shoot
- **ESC** / **P** — pause
- **Space** — start / play again (from title or game over)

### Mobile / Tablet
- **Left side** — virtual joystick (move)
- **Right side** — drag to aim, hold to fire
- **II** button — pause

Auto-detects touch. Works in portrait and landscape, including notched devices (safe-area insets).

## Features

- Velocity-based player motion with delta-time, no floatiness
- High-speed bullets with object pooling (no tunneling, no leaks)
- Wave-scaled enemies: chasers + ranged units
- Health, death, score, kill rewards, difficulty scaling
- High score persisted in `localStorage`
- Muzzle flash, bullet trails, hit particles, camera shake
- Web Audio API SFX (gunshot, hit, death, wave) with mute toggle
- Pause: ESC / P / on-screen II, plus auto-pause on tab hide and window blur
- Pause menu: Resume, Restart, Sound, Title
- Instant restart loop
- Fullscreen responsive canvas, 60 FPS target on mobile and desktop
- Single-file deploy — GitHub Pages ready

## Tech stack

- Vanilla ES6 JavaScript
- HTML5 Canvas 2D
- Web Audio API
- CSS (inline, safe-area aware)
- No dependencies, no CDN, no external assets

Everything is procedural: player, enemies, particles, grid arena, and audio.

## Deployment (GitHub Pages)

1. Create a GitHub repository.
2. Upload `index.html` and `README.md` to the repo root.
3. **Settings → Pages → Build and deployment**
4. Source: **Deploy from a branch**
5. Branch: `main` (or `master`), folder: `/ (root)`
6. Save. The game is live at `https://<user>.github.io/<repo>/`

Local preview:

```bash
# Serve the folder, then open the printed URL
python3 -m http.server 8080
```

Or just double-click `index.html`.

## License

MIT
