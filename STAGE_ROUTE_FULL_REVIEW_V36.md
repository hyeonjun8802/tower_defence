# Stage / Route Full Review v36

## Final campaign contract

- Root `v003_edit/index.html` owns the galaxy map and the Milky Rift campaign.
- `Milky Rift` keeps the original 12-stage Constellation Map and cyan/blue battle route.
- `Andromeda Trace` opens `andromeda/index.html` directly and uses the standalone Andromeda campaign code.
- `Andromeda Trace` has 15 stages and uses pink/red/magenta battle routes.
- Test/developer mode opens all galaxy nodes on the root galaxy map.
- Normal mode opens Milky by default; Andromeda opens after the actual Milky final-stage clear save key is found.

## v36 fix

Previous bridge code checked an old `PRD_STAGE_PROGRESS_V1` key first. The game core actually stores progress in:

- `planetRiftOfflineMetaV2`
- `planetRiftOfflineMetaV1`
- `planetRiftStageProgressV3`
- `planetRiftStageProgressV2`
- `planetRiftGalaxyProgressV1`

v36 updates the galaxy bridge to read these real keys and keeps `PRD_STAGE_PROGRESS_V1` only as a legacy fallback.

## Verified stage counts

- Milky root campaign: 12 stages.
- Andromeda standalone campaign: 15 stages.

## Verified route color rule

- Root Milky route keeps cyan/blue rails.
- Andromeda standalone route uses red/pink/magenta palette across stages 1~15.
