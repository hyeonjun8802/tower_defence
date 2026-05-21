# V84 Refactor Asset URL Fix

## Issue
After the v78 refactor split, CSS was moved from inline `<style>` blocks into external files under `src/styles/`.

Inline CSS originally resolved asset URLs like:

```css
url("assets/images/...")
```

relative to `index.html`. Once moved to `src/styles/base.css` and `src/styles/patches.runtime.css`, the same URL was resolved relative to `src/styles/`, so the browser looked for:

```text
src/styles/assets/images/...
```

That path does not exist. As a result:

- stage planet images did not render correctly in landscape mode
- selected-stage background images did not appear
- some UI image-frame assets from external CSS could also be missing

## Fix
Updated external CSS asset references to climb back to the project root:

```css
url("../../assets/images/...")
```

## Files changed
- `src/styles/base.css`
- `src/styles/patches.runtime.css`

## Scope
- No map coordinate changes
- No stage unlock logic changes
- No battle logic changes
- No new HUD logic added
- Only external CSS asset URL paths were corrected

## Validation
- Confirmed no remaining `url("assets/...`)` or `url('assets/...')` references in external CSS
- Confirmed all rewritten `../../assets/...` paths resolve to existing files
