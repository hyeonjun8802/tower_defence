# Stage Unlock Manifest Fix v76

## Problem
Stage clear progression and test/debug unlock behavior were mixed in the same runtime path. Several late wrappers were reading and writing both `StageMapState.unlocked` and `localStorage` during render, which could leave the next sanctuary locked after a clear in some flows.

## Fix
- Added a production runtime manifest and a separate test runtime manifest under `manifests/`.
- Production runtime now derives stage unlocks from the canonical clear records: `planetRiftOfflineMetaV2.clears`.
- Test/mock unlock behavior is gated behind explicit test activation only: `?test`, `?qa`, `?debug`, or `localStorage.PLANET_RIFT_TEST_MODE = "1"`.
- Added a final deterministic unlock patch:
  - clearing stage N always unlocks stage N+1
  - progress is persisted to `planetRiftStageProgressV3`
  - tower rewards are synchronized from clear records
  - map node locked/unlocked classes are reapplied after load, render, and clear
- Map coordinates and visual layout were not modified.
