# V13 Stage Click Hard Sync Patch

## Fix
- Stage node click now forces the lower information panel to update through `renderStageMapInfo(stageNo)` itself.
- The lower `offlineStagePanel` now resolves its stage from the currently visible stage info panel / stage map dataset / stage state, in that priority order.
- This prevents the lower block from staying on `1장. 공허 성역` when the selected map node changes to Frost, Lava, Jungle, etc.

## Expected behavior
- Click stage 2 → bottom panel changes to `2장. 빙결 외곽`.
- Click stage 3 → bottom panel changes to `3장. 용암 성운`.
- Click stage 4 → bottom panel changes to `4장. 생체 정글`.
- Background, title, risk, tags, boss cards, enter button, chapter text, shard/mastery block are synchronized.
