# Stage Background Full Cover Fix (v75)

## Fixed
- Normalized all clicked stage backgrounds to fill the full stage viewport.
- Removed late-stage partial offsets/partial width-height rules for gravity, thunder, time, silent, and rift layers.
- Re-declared all 12 selected-stage background mappings after older CSS patches so the final rule wins.
- Kept stage planet positions, route coordinates, and map content layout untouched.

## Scope
- Stage map background layers only.
- No changes to galaxy map nodes, stage route coordinates, or battle UI.
