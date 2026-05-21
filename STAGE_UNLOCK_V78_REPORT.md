# Stage Unlock Fix v78

## Root cause
The next stage was actually being selected/unlocked in part of the runtime, but the visible landscape HUD button created by the map HUD patch kept its initial static label (`ENTER SANCTUARY 1`). In addition, old battle-exit wrappers could mark `S.runEnded` before the normal clear recorder wrote `META.clears`, so the clear record could be missed in some flows.

## Fixes
- Added a final clear-persistence guard that writes the cleared stage to `planetRiftOfflineMetaV2.clears` if the normal recorder missed it.
- Recomputes stage unlocks from `META.clears` and persists `planetRiftStageProgressV3`.
- Keeps `StageMapState.unlocked`, `selected`, and `current` synchronized after clear, map render, stage click, resize, and orientation change.
- Updates both the hidden original enter button and visible v274 HUD enter button to the currently selected stage.
- The visible button now shows `ENTER SANCTUARY N` for the selected unlocked stage, instead of staying at `ENTER SANCTUARY 1`.
- Adds a MutationObserver to repair the HUD label if older patches recreate or relabel the dock.

## Scope
- Stage unlock/progression and visible stage enter HUD only.
- Stage node coordinates, map layout, and battle balance are unchanged.
