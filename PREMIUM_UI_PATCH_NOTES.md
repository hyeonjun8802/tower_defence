# Premium UI Patch Notes

## v53 Battle Bottom Simplification
- Reduced visual weight of the bottom tower hangar cards.
- Hid secondary role/tag text in hangar cards and kept only essential info.
- Shrunk hangar thumbnails, card height, and emphasis.
- Simplified the battle HUD by removing the round preview text line, stage type line, and global effect line in battle view.
- Flattened the HUD stats into a lighter, compact tactical strip.
- Reduced button height and general bottom panel complexity for a cleaner premium look.

## v54 Constellation Map Vertical Spacing
- Expanded vertical spacing between stage planets on mobile constellation map.
- Moved some nodes upward and some downward to reduce the large empty middle/lower area.
- Adjusted stage map inner transform and route SVG area to better use vertical space.

## v55 Premium Paid-Game Layout Pass
- Expanded constellation map node spacing much more aggressively across top/mid/bottom bands.
- Changed battle HUD from a detached centered box into a bottom dock directly under the game field.
- Reduced empty vertical gap between the battlefield and controls.
- Split battle information and actions into a cleaner paid-game style dock on tablet/desktop-width layouts.

## v56 Mobile Map Panel Height Reduction
- Galaxy map lower info panel height reduced aggressively on mobile.
- Galaxy meta cards are hidden on mobile to reveal more of the galaxy background and nodes.
- Constellation map stage panel is also reduced with compact typography and boss cards.
- Mobile scene area for both maps is enlarged by reclaiming space from the lower panel.

## v57 Premium Battle HUD Redesign
- Rebuilt the battle lower UI into a docked premium layout.
- Tower hangar is now a compact tactical tray with lower visual dominance.
- Stats became four compact resource cards with an EXP progress mini bar.
- Action buttons were unified into a cleaner command panel.
- Removed prototype-like clutter such as selected/log/offline panels from the battle view.

## v58 Tower Armory Popup
- Replaced the battle tower hangar with a single bottom-left Tower button.
- Added a Tower Armory popup with a left vertical tower list and right detail panel.
- Kept the original `#hangar` DOM hidden for compatibility with existing tower click logic.
- Renamed visible merge action from `자동 병합` to `타워 합치기`.
