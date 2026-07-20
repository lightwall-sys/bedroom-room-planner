# Bedroom Room Planner

Bedroom Room Planner is a browser-based 3D planning tool for exploring a measured bedroom layout, testing bed positions, arranging planning furniture and comparing paint, flooring and lighting choices.

## Current release

**v2.02** improves camera-orbit performance, prevents the automatic cutaway from dropping every wall, makes furniture rotation visible during placement and removes the horizontal shadow striping previously visible across plain wall surfaces.

## Features

- Measured room geometry with automatic directional cutaway walls
- Design, doorway and plan camera views
- Bed-wall presets and deliberate object-movement mode
- Furniture planning library with placement and collision checks
- Visible rotation controls while placing or editing furniture
- Paint, accent-wall and flooring controls
- Time-of-day, daylight and overhead-light controls
- Undo and redo history
- Installable Progressive Web App support on compatible browsers
- Offline app shell after a successful first visit
- Visible startup diagnostics if the planner cannot initialise

## Basic controls

- Drag empty space to orbit the camera
- Use the mouse wheel to zoom
- Right-drag to pan
- Choose **Add furniture**, move the green preview and use the on-screen rotation controls before clicking to place it
- Choose **Move objects** to select, move or rotate furniture that has already been placed
- Use **Room settings** for exact bed position, wall modes, materials, lighting and quality options

Keyboard shortcuts remain available in the in-app Help panel, but they are not required for furniture rotation.

## Run the planner

For normal use, open the published GitHub Pages address in a current desktop browser with JavaScript and WebGL enabled.

For a basic local preview, extract the repository and open `index.html`. Browser installation and offline caching require the project to be served over HTTPS, such as through GitHub Pages.

## Publish with GitHub Pages

The repository is designed to be uploaded as a static GitHub Pages project. `index.html` must remain at the repository root.

See [`GITHUB_UPLOAD_INSTRUCTIONS_v2.02.txt`](GITHUB_UPLOAD_INSTRUCTIONS_v2.02.txt) for the exact manual replacement and deployment steps.

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

The 3D planner requires JavaScript and WebGL. If a required file fails to load or startup does not complete, the loading screen is replaced with a visible error panel and technical details rather than remaining indefinitely.
