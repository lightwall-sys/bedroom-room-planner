BEDROOM ROOM PLANNER v2.00
==============================

START HERE
----------
For ordinary use after GitHub Pages is set up, open the published web address.

For local testing, extract this whole folder and open index.html. The planner itself will run, but app installation and the offline service worker only work when it is served over HTTPS, such as through GitHub Pages.

WHAT CHANGED IN v2.00
---------------------
- Rebuilt as a structured GitHub Pages / Progressive Web App project.
- Assets are split so the browser can cache them instead of reparsing one enormous HTML file.
- The app remains usable from the extracted folder as a fallback.
- Static measured room geometry is merged into render batches to reduce draw calls.
- Rendering is strictly on demand; there is no permanent game loop while the scene is idle.
- Shadow maps are not regenerated while the camera or a placement ghost is moving.
- Adaptive quality is now the default, with a 1.0 pixel ratio and only the warm overhead shadow enabled.
- High quality restores daylight shadows and a higher render resolution for screenshots.
- Expensive live backdrop blur over the WebGL canvas has been removed while preserving the visual panel design.
- Cutaway walls are solid visibility groups and never use transparent wall materials.
- The existing measured geometry, Dimplex Quantum heater, bed presets, furniture library, placement ghost, paint, floor, time-of-day and lighting controls are retained.

FILES
-----
index.html                 Main planner
manifest.webmanifest       Installable-app metadata
service-worker.js          Offline cache
assets/                    Styles, scripts, engine and icons
dummy-items/               Product and source records
GITHUB_PAGES_SETUP.txt     Beginner-friendly publishing instructions
CHANGELOG_v2.00.txt        Technical pass notes

PERFORMANCE TARGET
------------------
Adaptive mode is the intended everyday setting for the Gigabyte G5 / RTX 3060 / i5-10500H test target and ordinary modern Macs. High is deliberately reserved for still screenshots.
