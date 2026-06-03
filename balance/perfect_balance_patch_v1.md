# Perfect Balance Patch v1

## Scope
- Expanded sub-stage balance after increasing main stage lengths.
- No UI layout logic, tower logic, BGM routing, hidden planet unlocking, or save keys were changed.

## Applied tuning

### 1. Stage 8 early catch-up
Stage 8 uses the calm cosmic visual theme index, so its base HP formula was too low in 8-2 and 8-3.
A short catch-up multiplier now applies only to Stage 8 waves 2~7, strongest at 8-2, then fades out.

### 2. Wave 4 cliff reduction
The old durability curve gave wave 4 a large HP/armor jump.
The wave defense curve was smoothed so wave 4 is still meaningful but no longer feels like a sudden wall.

### 3. Normal boss checkpoint cleanup
The old `wave % 4 === 0` rule was too dense for 15/20-wave chapters.
Normal boss waves are now derived from each main stage's sub-stage count:

- 10-wave chapters: 4, 8
- 15-wave chapters: 5, 12
- 20-wave chapters: 5, 15

Mid boss and final boss rules stay unchanged.

### 4. Long chapter tail cap
For stages 8~12, waves 16~20 now use a soft cap so the endgame remains hard but does not explode exponentially.

## Expected result
- n-1 waves remain approachable.
- 7-2+ remains stronger than 7-1.
- 8-2 and 8-3 no longer drop below the Stage 7 pressure curve.
- 16~20 waves are still hard, but less unfair.
