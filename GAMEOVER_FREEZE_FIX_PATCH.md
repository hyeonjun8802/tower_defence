# Game Over Freeze Fix Patch

## Fixed
- Game over no longer leaves the battle screen visually frozen.
- `CORE COLLAPSE` result overlay is now shown immediately when core HP reaches 0.
- Added fallback overlay recovery if the normal game-over modal fails to render.
- Added canvas-level game-over message as a backup so the player always sees the battle ended.
- Added loop watchdog: if HP is 0 but game-over state was not triggered, it triggers game over safely.
- Raised game-over overlay z-index so it appears above other UI layers.
- Fixed wave display in the game-over log/summary to use `summary.wave` consistently.
- Game-over record/UI/audio calls are guarded so one failed call does not block the overlay.

## Files
- Replace root `index.html` with this patched version.
