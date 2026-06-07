# Runtime order

`index.html` loads the refactored files in this order:

1. `src/styles/base.css`
2. `src/styles/patches.runtime.css`
3. `src/scripts/game-core.js`
4. `src/scripts/armory-base.js`
5. `src/scripts/patches.runtime.js`

This mirrors the original v78 inline execution/cascade order as closely as possible while removing inline code from `index.html`.
