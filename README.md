# Bedroom Room Planner

Bedroom Room Planner is a browser-based 3D planning tool for exploring a measured bedroom layout, testing bed positions, arranging planning furniture and comparing paint, flooring and lighting choices.

## Current release

**v2.01** fixes the GitHub Pages startup failure in v2.00 and adds a visible diagnostic screen when the planner cannot initialise.

## Features

- Measured room geometry with automatic cutaway walls
- Design, doorway and plan camera views
- Bed-wall presets and deliberate object-placement mode
- Furniture planning library with placement checks
- Paint, accent-wall and flooring controls
- Time-of-day, daylight and overhead-light controls
- Undo and redo history
- Installable Progressive Web App support on compatible browsers
- Offline app shell after a successful first visit

## Run the planner

For normal use, open the published GitHub Pages address in a current desktop browser with WebGL enabled.

For a basic local preview, extract the repository and open `index.html`. Browser installation and offline caching require the project to be served over HTTPS, such as through GitHub Pages.

## Publish with GitHub Pages

The repository is designed to be uploaded as a static GitHub Pages project. `index.html` must remain at the repository root.

See [`GITHUB_UPLOAD_INSTRUCTIONS_v2.01.txt`](GITHUB_UPLOAD_INSTRUCTIONS_v2.01.txt) for the exact manual replacement and deployment steps.

## Project structure

```text
index.html                 Planner interface and startup guard
manifest.webmanifest       Installable-app metadata
service-worker.js          Versioned offline cache
assets/css/                Planner styles
assets/js/                 Three.js, controls, model data and planner logic
assets/icons/              PWA icons
dummy-items/               Planning-item and source records
internal/                  Release patch notes and developer handover notes
```

## Browser requirements

The 3D planner requires JavaScript and WebGL. When startup fails because a file is missing, stale or incompatible, v2.01 replaces the endless loading spinner with an on-screen error message and technical details.
