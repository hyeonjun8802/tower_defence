# v74 Map HUD Recovery Fix

## Fixed
- Restored visible galaxy route/nodes in landscape mode.
- Reclaimed the vertical space previously reserved for hidden information panels.
- Moved stage constellation area upward/within bounds so lower planets do not fall below the visible screen.
- Replaced DOM-moving dock logic with independent dock buttons to avoid breaking existing click handlers.
- Added direct guarded click routing for:
  - Galaxy map `ENTER MILKY RIFT`
  - Stage map `ENTER SANCTUARY`
  - `INFO` popup on both map screens

## Scope
- Landscape map screens only.
- Battle screen, tower armory, and portrait-mode layout were not intentionally changed.
