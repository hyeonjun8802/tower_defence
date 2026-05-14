# V31 Galaxy Map Display Hard Fix

## Root cause found
- V30 had the galaxy map markup and assets, but the entry flow could still be overridden by older navigation bindings in some browser/cache conditions.
- The galaxy nodes were rendered only by JS, so if binding/render timing failed the map could appear as if it was missing.

## Fix
- Added hard fallback galaxy nodes directly in HTML.
- Added a small early V31 script before the main game script to guarantee START DEFENSE opens the galaxy screen.
- Added final binding override after the main script so older V28/V29 handlers cannot win.
- Raised galaxy map z-index above stage map.
- Kept the cinematic galaxy zoom transition into stage map.
