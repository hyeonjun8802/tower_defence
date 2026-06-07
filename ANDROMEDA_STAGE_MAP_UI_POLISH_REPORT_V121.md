# Andromeda Stage Map UI Polish V121

## Scope

- Targeted only the Andromeda stage map presentation layer.
- Updated `src/styles/base.css` and `andromeda/src/styles/base.css`.
- Did not edit battle balance, enemy logic, tower logic, summon logic, audio, result flow, starfield RAF/observer logic, Milky Rift art, or image assets.

## Changes

- Added the final scoped override block: `V121 ANDROMEDA STAGE MAP UI POLISH`.
- Compressed the constellation deck and cards so the map body has clear vertical space.
- Recalibrated `stageMapInner` spacing for portrait, landscape, and desktop viewports.
- Reduced Andromeda node and planet visual density while preserving number readability.
- Repositioned stages 11-15 and adjusted nearby stages so the core spiral reads more clearly.
- Strengthened the selected node with higher z-index, focused glow, and a backplate.
- Subdued the swirl, route glow, and background layers so nodes remain the primary visual element.
- Compressed the bottom stage info panel in portrait views, clamped copy, and limited visible tags.

## Verification

- `node --check src/scripts/game-core.js`
- `node --check src/scripts/patches.runtime.js`
- `node --check andromeda/src/scripts/stage-map-controller.v46.js`
- `node --check andromeda/src/scripts/patches.runtime.js`
- Browser viewport checks:
  - 390 x 844
  - 430 x 932
  - 844 x 390
  - 1280 x 800
- Interaction smoke:
  - Entered Andromeda stage map.
  - Confirmed 15 stage nodes render.
  - Confirmed stage 15 selection updates active node, panel stage, and ENTER label.
  - Confirmed `GALAXY MAP` back button shows galaxy map.
  - Confirmed ENTER starts battle.
  - Confirmed summon button remains functional.
  - Confirmed no browser console errors during the smoke pass.

## Screenshot Artifacts

- `andromeda_stage_map_v121_390x844.png`
- `andromeda_stage_map_v121_430x932.png`
- `andromeda_stage_map_v121_844x390.png`
- `andromeda_stage_map_v121_1280x800.png`
