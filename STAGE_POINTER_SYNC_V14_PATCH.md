# V14 Stage Pointer Sync Patch

## Fixed
- Stage nodes were visually visible, but clicks could be intercepted by SVG route/fog layers, so the selected stage and lower information panel stayed on Stage 1.
- Added a pointer/click fallback inside the main game scope.
- If the click target is not the button itself, the game now finds the nearest stage node from the pointer coordinates and selects that stage.
- Added CSS safety rules so route SVG, line, arrow, and visual label layers do not steal clicks.

## Expected behavior
- Click Stage 2 → lower panel changes to Stage 2 / Frost Expanse.
- Click Stage 3 → lower panel changes to Stage 3 / Lava Nebula.
- Click Stage 4 → lower panel changes to Stage 4 / Jungle Core.
- Locked stages also update the lower panel as preview, while the Enter button remains locked.
