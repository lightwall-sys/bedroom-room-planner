# Bedroom Room Planner

Bedroom Room Planner is a browser-based 3D planning tool for exploring a measured bedroom layout, testing bed positions, arranging planning furniture and comparing paint, flooring and lighting choices.

## Open the planner

**[Launch Bedroom Room Planner](https://lightwall-sys.github.io/bedroom-room-planner/)**

The hosted version runs directly in a modern desktop browser. JavaScript and WebGL must be enabled.

## Current release

**v2.03** cleans up the room rendering and makes object editing much easier to understand:

- Plain, shadow-acne-free wall surfaces with one chosen accent wall
- Neutral white paint on every non-accent wall
- Balanced room lighting with clearer whites and softer contrast
- Main object rotation in 90° steps
- Optional 5° fine rotation for tight clearances
- 1 cm fine nudging with `Shift` + arrow keys
- Clearly labelled rotation and deletion controls
- Immediate shadow refresh after moving, rotating or deleting furniture
- A more recognisable late-2010s Dimplex Quantum storage-heater proxy
- A persistent essential-controls guide and a complete Controls panel

## Main controls

| Action | Mouse or keyboard |
| --- | --- |
| Orbit camera | Left-drag empty space |
| Pan camera | Right-drag empty space |
| Zoom | Mouse wheel |
| Toggle Move objects | `P` |
| Move selected furniture | Left-drag, or arrow keys |
| Fine nudge | `Shift` + arrow keys |
| Rotate left or right by 90° | `Q` / `E` |
| Fine rotate left or right by 5° | `Shift` + `Q` / `Shift` + `E` |
| Snap to nearest 90° | `R` |
| Delete selected furniture | `Delete` or `Backspace` |
| Confirm or cancel placement | `Enter` / `Esc` |
| Open the complete controls list | `?` or the **Controls** button |

Right-dragging only pans the camera. It does not delete furniture.

## Features

- Measured room geometry with automatic directional cutaway walls
- Design, doorway and plan camera views
- Bed-wall presets and exact bed controls
- Furniture planning library with placement and collision checks
- Visible placement ghost with valid and blocked states
- Contextual move, rotate, fine-rotate and delete controls
- Paint, accent-wall and flooring controls
- Time-of-day, daylight and overhead-light controls
- Undo and redo history
- Installable Progressive Web App support on compatible browsers
- Offline app shell after a successful first visit
- Visible startup diagnostics if the planner cannot initialise

## Planning accuracy

Furniture and fixed-room objects are simplified planning proxies. Their recorded dimensions and source links are stored in `dummy-items/`. The Dimplex Quantum heater is a recognisable approximation of the late-2010s casing style rather than a claim that the exact wattage variant has been identified.

## Run locally

For a basic local preview, extract the repository and open `index.html`.

Browser installation and offline caching require the project to be served over HTTPS, such as through GitHub Pages.

## Publish with GitHub Pages

The repository is designed to be uploaded as a static GitHub Pages project. `index.html` must remain at the repository root.

See [`GITHUB_UPLOAD_INSTRUCTIONS_v2.03.txt`](GITHUB_UPLOAD_INSTRUCTIONS_v2.03.txt) for the exact manual replacement and deployment steps.

## Project structure

```text
index.html                 Planner interface and startup guard
manifest.webmanifest       Installable-app metadata
service-worker.js          Versioned offline cache
assets/css/                Planner styles
assets/js/                 Three.js, controls, model data and planner logic
assets/icons/              PWA icons
dummy-items/               Planning-item and source records
internal/                  Internal release and maintenance notes
```

## Browser requirements

The planner requires JavaScript and WebGL. If a required file fails to load or startup does not complete, the loading screen is replaced with a visible error panel and technical details rather than remaining indefinitely.
