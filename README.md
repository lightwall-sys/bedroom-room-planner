# Bedroom Room Planner

Bedroom Room Planner is a browser-based 3D tool for testing a measured bedroom layout, arranging furniture and comparing paint, flooring and lighting choices.

## Open the planner

**[Launch Bedroom Room Planner](https://lightwall-sys.github.io/bedroom-room-planner/)**

The hosted version runs directly in a modern desktop browser. JavaScript and WebGL must be enabled.

## Current release

**v2.04** adds the selected IKEA IDANÄS folding-door wardrobe and introduces Sims-style wall alignment for wardrobes.

- IDANÄS wardrobe with exact **121 × 59 × 211 cm** outer dimensions
- Recognisable closed-door model with four folding-door leaves, panel detailing, handles, frame and legs
- Automatic wardrobe wall snapping that aligns the back of the object flush to a nearby wall
- Correct inward-facing orientation for all six room walls
- Manual rotation automatically overrides wall snapping
- A visible **Wall snap** control and `W` keyboard shortcut restore or disable automatic alignment
- Existing `Q` / `E` 90° rotation and `Shift` + `Q` / `Shift` + `E` 5° fine rotation remain available
- Wall-snap state is retained in undo, redo and restored planner states

The IDANÄS model is a dimensionally exact planning proxy rather than a manufacturing CAD model. Product reference: [IKEA IDANÄS wardrobe, article 604.588.35](https://www.ikea.com/gb/en/p/idanaes-wardrobe-white-60458835/).

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
| Snap angle to nearest 90° | `R` |
| Toggle wardrobe auto wall snap | `W` |
| Delete selected furniture | `Delete` or `Backspace` |
| Confirm or cancel placement | `Enter` / `Esc` |
| Open the complete controls list | `?` or the **Controls** button |

### Wardrobe wall snapping

Wardrobes begin with automatic wall snapping enabled. Move one near a wall and its back aligns flush to that wall, with the front facing into the room.

Rotating a wardrobe manually with `Q`, `E`, the fine-rotation controls or an exact angle switches that object to manual mode. Press `W` or use the visible wall-snap button to restore automatic alignment.

## Features

- Measured room geometry with automatic directional cutaway walls
- Design, doorway and plan camera views
- Bed-wall presets and exact bed controls
- Furniture planning library with placement and collision checks
- Visible placement ghost with valid and blocked states
- Contextual move, rotate, fine-rotate, wall-snap and delete controls
- Paint, accent-wall and flooring controls
- Time-of-day, daylight and overhead-light controls
- Undo and redo history
- Installable Progressive Web App support on compatible browsers
- Offline app shell after a successful first visit
- Visible startup diagnostics if the planner cannot initialise

## Planning accuracy

Furniture and fixed-room objects are planning proxies. Recorded dimensions and source links are stored in `dummy-items/`. The IDANÄS wardrobe uses IKEA's exact published outer dimensions. Decorative construction is simplified for responsive browser rendering.

## Run locally

For a basic local preview, extract the repository and open `index.html`.

Browser installation and offline caching require the project to be served over HTTPS, such as through GitHub Pages.

## Publish with GitHub Pages

The repository is designed to be uploaded as a static GitHub Pages project. `index.html` must remain at the repository root.

See [`GITHUB_UPLOAD_INSTRUCTIONS_v2.04.txt`](GITHUB_UPLOAD_INSTRUCTIONS_v2.04.txt) for the exact manual replacement and deployment steps.

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
