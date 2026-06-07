# Galaxy Test Mode Unlock v20

## Fix
Some test-mode entry paths rendered the galaxy map label as `TEST MODE` while late DOM patches still read the galaxy nodes as locked. v20 uses the visible `TEST MODE` label itself as an additional source of truth, then continuously removes lock/fog classes and lock icons while test/developer mode is active.

## Scope
- Galaxy map visual/interactivity only.
- Normal play unlock rules remain unchanged.
- Battle route, balance, tower, save, and Andromeda combat logic are untouched.

## Behavior
- In test/developer mode, all galaxy nodes are open.
- Hovering a locked-looking galaxy node immediately converts it to open/test state.
- `.galaxyLockMark` is force-hidden under test mode.
- `galaxyEnterBtn` and `v274GalaxyEnterBtn` are force-enabled.
