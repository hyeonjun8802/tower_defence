# v81 Refactor Connection Fix

## Analysis
The v80 split did not remove the original stage map data or the stage info panel. The issue was in the landscape-only HUD path:

- v274 CSS intentionally hides the original `#stageInfoPanel` and `.stageActionRow` in landscape mode.
- The hidden panel is still used as the source for the v274 popup overlay.
- After the split, the only visible route into that popup was the small `INFO` HUD button.
- Stage planet clicks still selected the stage, but they did not bridge into `openInfo('stage')`, so the expected “click planet → popup → enter next step” UX looked missing.

## Fix
This version does not add a new popup system. It reconnects the existing v274 popup flow:

- Landscape stage-node click is allowed to continue to the original stage selection handler.
- After the original handler updates `StageMapState`, `data-selected`, and `renderStageMapInfo`, the existing `openInfo('stage')` overlay is opened.
- The popup continues to use the existing hidden `#stageInfoPanel` as its source.
- The popup enter button continues to delegate to the existing stage-enter flow.

## Scope
- Modified: `src/scripts/patches.runtime.js`
- Touched function: `delegatedClick()` inside `v274-landscape-map-hud-recovery-script`
- No changes to galaxy/stage node coordinates, path layout, or content map geometry.
- No new stage/map layout system was added.

## Verification
- `node --check src/scripts/game-core.js`
- `node --check src/scripts/armory-base.js`
- `node --check src/scripts/patches.runtime.js`
