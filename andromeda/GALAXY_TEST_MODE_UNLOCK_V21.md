# Galaxy Test Mode Unlock v21

## Problem
The galaxy map showed `TEST MODE` in the header, but static lock DOM on galaxy nodes could remain visible after later map rendering patches.

## Fix
- Added `src/scripts/galaxy-testmode-hard-unlock.v21.js` loaded after all existing runtime/map HUD patches.
- Uses multiple test-mode signals:
  - visible `TEST MODE` header
  - `TEST_MODE_CONFIG.enabled`
  - `META.flags.testMode`
  - `PLANET_RIFT_TEST_MODE=1`
  - body/html test-mode classes
- In test/developer mode:
  - all galaxy nodes are forced open
  - `.galaxyLockMark` elements are removed from the DOM, not just hidden
  - `locked`, `fogPreview`, `fogDeep`, and disabled classes are removed repeatedly
  - node badges are rewritten to `OPEN` / `TEST OPEN`
  - the galaxy enter button is always enabled
- Normal gameplay locking rules remain unchanged when test mode is not active.

## Notes
This patch is intentionally loaded last to override older galaxy-map patches that may reapply locked DOM/classes.
