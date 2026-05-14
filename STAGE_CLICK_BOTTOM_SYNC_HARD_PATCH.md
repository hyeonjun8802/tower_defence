# Stage Click Bottom Sync Hard Patch

## Fixed
- Stage node click now updates **all** lower information blocks immediately.
- `stageInfoTitle`, risk, description, tags, mid boss, final boss, offline/story panel, reward, clear count, best wave, and mastery goals are synchronized to the clicked stage.
- Added capture-phase event delegation so older node click handlers cannot leave the bottom panel stale.
- Locked stages can still be previewed in the bottom panel while the ENTER button remains locked.
- Stage info panel scroll resets to the top whenever a different stage is selected.

## Why
The previous build could update the visible stage title/boss area while the lower offline/story block stayed on an earlier stage, because multiple stage-map render patches were competing. This patch centralizes the selected-stage sync path.
