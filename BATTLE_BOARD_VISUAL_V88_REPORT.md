# Battle Board Visual v88

Scope: battle-board visual polish only. No map layout, stage unlock, HUD recovery, battle rules, or economy logic was changed.

## Changes
- Restored clearer plate color identity by using fixed plate colors by plate type instead of letting the main plate color follow planet affinity.
  - DMG: gold
  - SPD: cyan
  - RNG: violet
  - ORE: green
  - RFT: pink
- Kept affinity text as a small secondary label, so plates and planets are easier to distinguish.
- Made plate borders and inner frames sharper without bringing back the blurry glass/fog effect.
- Made normal build blocks slightly visible even outside drag mode, so the board cells are easier to read.
- Reduced dragged tower preview opacity so the dragged planet does not look too heavy or obscure the target block.
- Kept cloud/fog removal from v87.

## Validation
- `src/scripts/game-core.js` passed JavaScript syntax check.
