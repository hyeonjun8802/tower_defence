# UI Event Flow Mode/Stage Entry Cleanup V46

## Summary
- Replaced the fragmented v45 stage controller with `stage-map-controller.v46.js`.
- Centralized START / TEST MODE / galaxy selection / galaxy ENTER / stage selection / stage ENTER into one deterministic event-flow controller.
- Disabled legacy v274 click routing, v78 enter-label observer/wrapper, and v97 menu click hardening only when the v46 controller is active. v274 dock creation and info popup utilities remain available.
- Removed persistent Andromeda/Test runtime flag writes from navigation bridges. Runtime campaign/test flags are session-scoped only.

## Fixed risks
1. Normal stage clicks reactivating TEST MODE from stale local/session storage.
2. Milky stage ENTER being intercepted by legacy landscape dock and label-sync handlers.
3. Andromeda stage ENTER and Milky stage ENTER sharing stale campaign flags.
4. Duplicate event routers using `stopImmediatePropagation()` in different layers.

## Not changed
- Battle loop, balance data, wave logic, tower damage, summon/merge/speed/pause controls, images and audio.

## Validation
- JS syntax check passed for root and Andromeda scripts.
- HTML script references checked.
- ZIP integrity checked after packaging.
