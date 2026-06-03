# Sub-stage Count Expansion Patch

## Applied rule

- Main stages 1~3: 10 sub-stages
- Main stages 4~7: 15 sub-stages
- Main stages 8~12: 20 sub-stages

Note: the request text included two different values for stages 4~7: 12 and 15. This patch applies the later/higher value, 15, so the mid-game section is expanded.

## Runtime behavior

- Stage clear occurs only when the current sub-stage reaches the configured max for that main stage.
- The final boss now appears on the final sub-stage for that main stage.
- The mid boss now appears around the middle of that main stage.
- Sub-stage clear popups, continue behavior, result stage labels, and best-wave tracking use the dynamic count.
