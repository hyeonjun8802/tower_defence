# Milky Enter Repair V37

## Problem
`ENTER MILKY RIFT` could remain on the Galaxy Map instead of opening the Milky stage map.

## Cause
Multiple legacy navigation handlers existed. Some handlers called `showStageMap()`, while later galaxy/andromeda bridge patches could leave campaign flags or cloned landscape dock events in an inconsistent state.

## Fix
- Replaced v36 galaxy bridge with `galaxy-andromeda-direct-bridge.v37.js`.
- Milky entry no longer depends on old `showStageMap()` wrappers.
- Milky entry now directly:
  - clears Andromeda runtime/session flags,
  - hides menu/galaxy/game,
  - shows `#stageMap`,
  - removes Andromeda map classes,
  - restores `data-campaign="milky"`,
  - calls `renderStageMap()` when available,
  - re-asserts the state over several frames to defeat late legacy re-syncs.
- Both real enter button and landscape cloned dock button route through the same handler.

## Scope
- Root Milky stage map entry only.
- Andromeda separate `/andromeda/index.html` entry preserved.
- Route colors, battle balance, towers, saves, and hidden planet logic unchanged.
