# Stage Enter Race Fix v85

## Problem
On landscape stage map, clicking the lower HUD ENTER button could briefly show/hide battle UI at the lower right and fail to enter the stage.

## Root cause
Legacy map HUD click handlers, pointerup handlers, and combat-HUD sync timers were running in the same event frame. The combat chrome was also enabled before the locked-stage guard, so non-battle UI could flash and interfere with the map-to-battle transition.

## Fix
- Stage entry now marks a short `PRD_STAGE_ENTERING` transition state.
- Combat HUD sync respects that transition and does not hide the battle UI during mounting.
- v274 map HUD ENTER uses click-only activation, not pointerup.
- ENTER action is debounced and delayed by one short timer so legacy click/pointer handlers finish first.
- Locked stages no longer turn on combat HUD before showing the locked toast.
- Docks/overlay are made inert during the transition.

## Scope
- Landscape map HUD stage entry only.
- Stage coordinates, galaxy coordinates, battle rules, and unlock logic are not changed.
