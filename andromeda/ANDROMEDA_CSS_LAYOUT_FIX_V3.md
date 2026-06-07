# Andromeda CSS Layout Fix v3

## Scope
- CSS-only stabilization for the newly added 15-node Andromeda stage map.
- CSS-only safety pass for combat HUD after entering Andromeda stages.
- No gameplay/balance/save logic changed.

## Stage map fixes
- Re-sized 15 stage nodes to avoid overlap and clipping.
- Re-sized boss/final-boss nodes so they stay inside the map frame.
- Added responsive map top/bottom spacing for landscape, short-landscape, portrait, and narrow mobile.
- Prevented long node labels and Korean labels from colliding by using compact labels and hiding secondary Korean labels on the map surface.
- Stabilized stage info panel height/scroll so long Andromeda descriptions/tags do not clip.
- Stabilized ENTER action row position under the info panel.

## Battle screen fixes
- Long Andromeda stage names and wave preview text now ellipsize instead of pushing HUD layout.
- Combat HUD, canvas, field and top-line components get safe min/max sizing.
- Short landscape and portrait-specific HUD overflow safeguards were added.

## Validation
- CSS brace count verified.
- Main JS files passed syntax check.
- JSON files parsed successfully.
