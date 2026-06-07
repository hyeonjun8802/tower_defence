# Galaxy Test Mode Unlock v22

## Purpose

Test/developer mode should not unlock every future galaxy.
It should open only the currently testable campaigns:

- Milky Rift: open
- Andromeda Trace: test open
- Ember Spiral: locked / fog preview
- Void Crown: locked / deep void fog

## Fix

- Replaces the previous hard unlock behavior that visually opened all four galaxy nodes.
- Keeps the older script filename for stable load order.
- Runs a final selective override after the older v18~v20 galaxy test patches.
- Restores lock marks and fog for the 3rd and 4th galaxy even if previous patches temporarily opened them.

## Scope

No battle, stage, tower, balance, route, save, BGM, or resource logic changed.
This is a galaxy map test-mode visual/interaction correction only.
