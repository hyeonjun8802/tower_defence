# v83 Refactor Runtime Loading Fix

## Root cause
v82 tried to isolate every extracted runtime patch inside one large `patches.runtime.js` file. That made legacy patches that had previously been stopped by an early runtime error continue running together, including repeated observers/timers and media/map recovery patches. In browser testing this could keep the page in a loading state.

## Fix
- Reverted the main split runtime back to the v81/v78-compatible `patches.runtime.js` behavior.
- Added one separate, small script: `src/scripts/map-hud-recovery.v83.js`.
- This script is loaded after `patches.runtime.js`, so even if a legacy patch fails, the landscape `INFO / ENTER` HUD can still be restored.
- The recovery script does not use a global body `MutationObserver`, does not preload/play audio, and does not change galaxy/stage coordinates.

## Scope
- No change to map coordinates, planet positions, galaxy positions, battle logic, or armory logic.
- Only restores landscape map HUD buttons and the existing info-popup/enter flow in a separate fail-safe file.

## Validation
- `map-hud-recovery.v83.js`: `node --check` passed.
