# Andromeda Spiral Route v9

## Purpose
- Make the Andromeda stage map read more clearly as a spiral moving inward.
- Make Andromeda battle routes differ from the older Milky Way route feeling.

## Changes
- Added stronger spiral node placement overrides for stages 1~15.
- Added a non-interactive spiral visual layer on the stage map.
- Re-synced visual route SVG segments to the new spiral node centers.
- Fixed the combat route stage clamp so stages 13~15 can use their own route plan.
- Added scenario-based combat route templates:
  - 1~5: outer spiral
  - 6~9: gravity corridor
  - 10~12: inner spiral
  - 13~14: core collapse
  - 15: final core entry

## Safety
- No monster HP, reward, tower damage, save, unlock, BGM, or UI input logic was changed.
- Missing image resources remain replaceable later through the existing manifest paths.
