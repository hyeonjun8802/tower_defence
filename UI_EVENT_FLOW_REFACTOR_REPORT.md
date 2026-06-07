# PRD Stage UI Event Flow Refactor Report

## Scope

| Area | Result |
| --- | --- |
| Single controller | `PRD_STAGE_FLOW` now owns START, TEST MODE, galaxy select/enter, stage select, INFO, ENTER, and back routing. |
| Implemented campaigns | Milky Rift 1-12 and Andromeda Trace 1-15 remain playable. Future galaxies stay preview/locked. |
| Normal mode | Only unlocked stages are selectable; locked stages stay disabled and cannot change bottom ENTER. |
| Dev/test mode | Only explicit TEST MODE or query test flags enable all implemented stages. Persistent localStorage test flags are cleared. |
| Battle internals | No balance, asset, audio, enemy, tower, or wave internals were changed. |

## Modified Files

| File | Purpose |
| --- | --- |
| `index.html` | Added script cache-busting query so the refactored flow scripts are loaded deterministically. |
| `andromeda/index.html` | Same cache-busting for the Andromeda standalone page. |
| `src/scripts/stage-map-controller.v46.js` | Root `PRD_STAGE_FLOW` controller, deterministic mode/galaxy/stage/INFO/ENTER ownership. |
| `andromeda/src/scripts/stage-map-controller.v46.js` | Andromeda copy of the same controller, including 15-stage routing. |
| `src/scripts/game-core.js` | Legacy map handlers guarded; Milky constellation metadata and audio cue fallback stabilized. |
| `andromeda/src/scripts/game-core.js` | Legacy map handlers guarded; Andromeda runtime bridge kept as battle source of truth. |
| `src/scripts/map-hud-recovery.v83.js` | INFO/ENTER overlay routes through `PRD_STAGE_FLOW` when active. |
| `andromeda/src/scripts/map-hud-recovery.v83.js` | Same overlay routing for Andromeda. |
| `src/scripts/patches.runtime.js` | Legacy unlock/test wrappers disabled under v46; strict-mode armory detail globals fixed. |
| `andromeda/src/scripts/patches.runtime.js` | Same legacy-wrapper and strict-mode fixes for Andromeda. |
| `src/scripts/galaxy-andromeda-direct-bridge.v37.js` | Legacy bridge no longer intercepts v46 galaxy ENTER or test-mode routing. |

## Load Order

| Order | Script | Role |
| --- | --- | --- |
| 1 | `game-core.js` | Runtime, battle engine, stage metadata, `PRD_STAGE_RUNTIME`. |
| 2 | `stage-map-controller.v46.js` | Canonical UI event/state controller. |
| 3 | legacy bridge/other scripts | Guarded when `PRD_STAGE_FLOW_CONTROLLER_ACTIVE` is set. |
| 4 | `patches.runtime.js` | Legacy patches; map/test/progress wrappers opt out under v46. |
| 5 | `map-hud-recovery.v83.js` | Ensures landscape docks exist and delegates INFO/ENTER to v46. |
| 6 | `galaxy-andromeda-direct-bridge.v37.js` | Root-only direct bridge, disabled for v46-owned interactions. |

## Event Ownership

| Event | Final Owner | Notes |
| --- | --- | --- |
| START | `PRD_STAGE_FLOW.enterNormalMode()` | Clears test persistence and opens Milky galaxy map. |
| TEST MODE | `PRD_STAGE_FLOW.enterDevMode()` | Session-scoped test mode only; no localStorage test persistence. |
| Galaxy click | `PRD_STAGE_FLOW.selectGalaxy()` | Milky/Andromeda open; future galaxies stay locked. |
| Galaxy ENTER | `PRD_STAGE_FLOW.enterSelectedGalaxy()` | Andromeda routes to `/andromeda/index.html`; Milky opens stage map. |
| Stage click | `PRD_STAGE_FLOW.selectStage()` | Normal locked stages are disabled; test stages 1-12/1-15 selectable. |
| INFO | `PRD_STAGE_FLOW` + `map-hud-recovery.v83` | v83 overlay is preferred under v46 to avoid legacy ENTER listeners. |
| Stage ENTER | `PRD_STAGE_FLOW.enterCurrentStageBattle()` | Forces selected stage into runtime before battle start. |
| Back | `PRD_STAGE_FLOW` | Andromeda back returns to root galaxy map with Andromeda selected. |

## State Stores

| Store | Policy |
| --- | --- |
| `state.mode` in v46 | Controller-local source for normal/dev routing during the current page lifecycle. |
| `sessionStorage.PRD_ENTRY_MODE` and related test keys | Used only for explicit session test mode. |
| `localStorage` test flags | Removed/ignored so old TEST MODE cannot revive normal START. |
| `StageMapState` | Runtime bridge; v46 writes selected/current immediately before battle start. |
| `PRD_CAMPAIGN` / `PRD_SELECTED_GALAXY` | Used only for Andromeda route context. |

## Verification

| Check | Result |
| --- | --- |
| `node --check` on all changed JS files | Passed. |
| Root TEST MODE -> Milky Stage 5 -> INFO -> ENTER | Passed: dock and overlay show `ENTER 5. SMOG WASTELAND`; battle starts `5-1`. |
| Root normal START after TEST -> Stage 5 | Passed: body test mode is false; Stage 5 is disabled and cannot be clicked. |
| Root normal Stage 1 -> INFO -> ENTER | Passed: overlay shows `ENTER 1. COSMIC VOID`; battle starts `1-1`. |
| Andromeda direct test -> Stage 15 -> INFO -> ENTER | Passed: overlay shows `ENTER 15. ANDROMEDA ECHO`; battle starts `15-1`, `andromeda final`. |
| Browser console | No new post-fix warnings observed in the verified flows; older buffered v76/v128 warnings were from the pre-fix run at `2026-06-06T15:52:37Z`. |

