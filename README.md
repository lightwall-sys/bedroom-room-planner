# Bedroom Room Planner

Bedroom Room Planner is a browser-based 3D planning tool for arranging furniture inside a measured bedroom and comparing paint, flooring and lighting choices.

## Open the planner

**[Launch Bedroom Room Planner](https://lightwall-sys.github.io/bedroom-room-planner/)**

The hosted version runs in a modern desktop browser. JavaScript and WebGL must be enabled.

## Current release

**v2.05** expands the product library, introduces modular wall storage and surface-mounted lamps and adds a more complete layout workflow.

### Product library

The planner includes dimension-matched planning models for:

- IKEA IDANÄS folding-door wardrobe
- IKEA EKET glass-door wall cabinet
- IKEA EKET two-drawer wall cabinet
- IKEA EKET cabinet with door and shelf
- IKEA HEMNES two-drawer chest
- IKEA SONGESAND bedside table
- IKEA FADO and ÅRSTID table lamps
- IKEA RÖDFLIK and LAUTERS floor lamps

Seller colour options can be selected before placement and changed after placement. Models use the published outer dimensions recorded in `dummy-items/product-sources.csv`. Decorative details are simplified for responsive browser rendering.

### Placement and editing

- Wardrobes align their backs to nearby walls automatically
- Compatible EKET cabinets join alongside or above one another as modular wall storage
- Table lamps attach to suitable furniture surfaces and move with the supporting item
- Camera-relative arrow movement follows the current view
- Objects can be duplicated, locked, recoloured, rotated, nudged or deleted
- Clearance overlays and live measurements can be shown when needed

### Room and presentation tools

- Refined non-overlapping wall, reveal, skirting and coving geometry
- Quick-Step Cotton Oak White Blush and Coast Oak Sand planning finishes
- Rotatable real-proportion flooring planks
- Daylight and evening lighting comparisons
- Furniture shadows that respond to the window and placed lamps
- Three named local save slots plus automatic recovery
- JSON layout export and import
- Current-view and plan-view PNG capture
- **Clear room view** mode for an unobstructed presentation

## Main controls

| Action | Control |
| --- | --- |
| Orbit camera | Left-drag empty room space |
| Pan camera | Right-drag empty room space |
| Zoom | Mouse wheel |
| Toggle object editing | `P` |
| Move selected object relative to the camera | Arrow keys |
| Fine nudge | `Shift` + arrow keys |
| Rotate left or right by 90° | `Q` / `E` |
| Fine rotate left or right by 5° | `Shift` + `Q` / `Shift` + `E` |
| Snap angle to the nearest 90° | `R` |
| Toggle automatic wall alignment or EKET modular joining | `W` |
| Duplicate selected object | `Ctrl`/`Cmd` + `D` |
| Lock or unlock selected object | `K` |
| Switch selected lamp on or off | `B` |
| Delete selected object | `Delete` or `Backspace` |
| Open saved layouts | `Ctrl`/`Cmd` + `S` |
| Enter clear room view | `H` |
| Confirm or cancel placement | `Enter` / `Esc` |
| Open the complete controls list | `?` or **Controls** |

The interface also exposes the relevant actions as labelled buttons, so keyboard shortcuts are optional.

## Saving and privacy

Saved layouts and automatic recovery data remain in the current browser on the current device. The JSON export option creates a portable local file. The planner does not require an account or transmit a saved layout to a server.

## Planning accuracy

The room shell is based on recorded measurements. Furniture and fixtures are planning models rather than manufacturing CAD. Product dimensions, source pages and modelling qualifications are kept in `dummy-items/`.

## Run locally

Extract the repository and open `index.html` for a basic preview. Installation and offline caching require HTTPS, such as a GitHub Pages deployment.

## Project structure

```text
index.html                 Planner interface and startup guard
manifest.webmanifest       Installable-app metadata
service-worker.js          Versioned offline cache
assets/css/                Planner styles
assets/js/                 Three.js, controls, model data and planner logic
assets/icons/              PWA icons
dummy-items/               Product, finish and source records
internal/                  Internal release and maintenance notes
```

## Browser requirements

The planner requires JavaScript and WebGL. If a required file fails to load or startup cannot complete, the loading screen is replaced by a visible error panel with technical details.
