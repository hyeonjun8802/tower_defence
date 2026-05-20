# HUD Visibility Fix Report (v67)

Fixed the issue where battle HUD and command controls remained visible over the constellation/stage map after the game ended.

## Cause
- Earlier battle HUD CSS forced `#game` to stay visible with `display:block !important`.
- Several HUD/control elements also had high z-index and important display rules, so normal inline `game.style.display='none'` did not reliably hide them.

## Fix
- Added a strict non-combat screen state guard.
- When Menu / Galaxy Map / Stage Map / Result overlay is visible:
  - force `#game` hidden with `display:none !important`
  - hide battle HUD overlays
  - hide command docks
  - hide field top controls
  - hide hangar / stage FX labels
- When entering battle again:
  - restore `#game`
  - clear forced hidden styles for combat HUD controls
- Added mutation/resize/orientation observers so screen state is re-synced after navigation, game clear, retry, or layout changes.

## Scope
- Non-combat screen visibility only.
- Gameplay logic and stage progression untouched.
