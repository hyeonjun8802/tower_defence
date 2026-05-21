# v86 Map HUD Initial Visibility Fix

## Issue
Landscape map HUD buttons (`INFO`, `ENTER ...`) sometimes appeared only after the browser window was resized slightly.

## Root cause
The HUD recovery script ran while the galaxy/stage map screen was still hidden or before the final landscape layout was applied. In that state the dock was created with `display:none`. A later resize event triggered the sync again, so the buttons appeared only after a tiny window resize.

## Fix
- Kept the map coordinates and map content layout unchanged.
- Made landscape detection fallback to `innerWidth >= innerHeight`.
- Added scoped visibility watchers for only these nodes:
  - `body`
  - `#galaxyMap`
  - `#stageMap`
  - `#menu`
  - `#game`
- When those nodes change class/style visibility, the HUD dock is resynced.
- Added a short startup sync window so late map activation is caught without requiring manual resize.
- Added sync on `pageshow`, `focus`, `visibilitychange`, map/back/node clicks, resize, and orientationchange.
- Avoided global subtree MutationObserver to prevent heavy performance impact.

## Files changed
- `src/scripts/map-hud-recovery.v83.js`

## Validation
- `node --check src/scripts/map-hud-recovery.v83.js` passed.
