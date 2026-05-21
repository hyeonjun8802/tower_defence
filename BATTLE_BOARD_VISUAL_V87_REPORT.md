# Battle Board Visual v87

Scope: battle screen only. Map coordinates, stage map, galaxy map, unlock logic, and HUD recovery scripts were not changed.

## Changes
- Increased landscape battle grid cell sizing so tactical blocks appear larger.
- Moved the landscape battle board upward to keep lower-row level labels visible.
- Reduced landscape command/reserve spacing used in board fitting so the board can use more of the available field area.
- Improved canvas backing-store resolution while keeping game coordinates in CSS pixels, reducing blurry plate/tile labels on high-DPI displays.
- Reworked special plate rendering to be sharper:
  - removed heavy glass haze / diagonal blur overlay
  - stronger frame stroke
  - clearer DMG/SPD/RNG/ORE/RFT labels
- Removed cloud/fog visual effects:
  - dust cloud generation and drawing disabled
  - dust cloud gameplay penalty disabled
  - impact mist particles disabled
  - stage-wide cloud overlay disabled
- Reduced the background fog overlay intensity.

## Validation
- `node --check src/scripts/game-core.js` passed.
- `node --check src/scripts/patches.runtime.js` passed.
- `node --check src/scripts/map-hud-recovery.v83.js` passed.
