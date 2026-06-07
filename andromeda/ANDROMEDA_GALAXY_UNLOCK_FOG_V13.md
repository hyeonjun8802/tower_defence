# Andromeda Galaxy Unlock / Fog Polish V13

## Goals
- Andromeda should not be globally open in production until the Milky Rift campaign is completed.
- Test mode must open all galaxy nodes.
- Locked galaxies should communicate progression visually through fog:
  - If only Milky Rift is open, galaxy 2 is shown as a soft preview and galaxies 3~4 are heavily obscured.
  - If galaxy 2 is open, galaxy 3 is shown as a soft preview and galaxy 4 is heavily obscured.

## Runtime rules
- Galaxy order:
  1. Milky Rift
  2. Andromeda Trace
  3. Ember Spiral
  4. Void Crown
- Test mode: all four are open.
- Production:
  - Milky Rift is always open.
  - Andromeda opens when `META.flags.milkyRiftCompleted`, `META.flags.galaxyMilkyRiftCompleted`, saved galaxy progress, or legacy final stage clear records indicate Milky completion.
  - Stage clear compatibility checks include older stage `12` and current expanded `maxStage`.

## UI rules
- Open nodes: clear and active.
- Next locked node: dim/blurred preview fog.
- Far locked nodes: heavy void fog, labels almost hidden.
- Locked enter button is disabled and visually muted.

## Notes
This patch is galaxy-map UI/progression gating only. It does not change combat balance, route variants, tower unlocks, hidden planet logic, stage reward logic, or legacy route logic.
