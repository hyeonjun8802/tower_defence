# Andromeda Route Placement Islands v12

## Purpose
Andromeda-only multi-lane routes need tactical build cells between monster lanes.
The old terrain pass marked too many cells as route/blocked, so the player could not use the lane gaps.

## Changes
- Andromeda stages only. Legacy/Milky route behavior is unchanged.
- Stage 3~4: split/merge route pockets opened between upper/lower branches.
- Stage 5~9: dual-gate route pockets opened near the convergence corridor.
- Stage 10~14: teleport route pockets opened near portal approach/exit gaps.
- Stage 15: final spiral route keeps a center-core concept and opens protected tactical islands around the spiral.
- Protected pockets are not overwritten by random blocked plates or hazard clusters.

## Notes
This patch changes placement/terrain availability, not monster HP, rewards, tower damage, save data, or Milky Way route logic.
