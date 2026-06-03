# Stage 7-1 Difficulty Ease Patch

## Scope
- 대상: 7장 MACHINE CORE / 기계 핵성, 특히 7-1 초반 체감 난이도
- 비대상: 세로/가로 UI, BGM, 강화관리, 스테이지 8 이후 난이도

## Applied Changes
- Stage 7 일반 몬스터 HP multiplier: `1.58 → 1.50`
- Stage 7 일반 몬스터 speed multiplier: `1.05 → 1.04`
- Stage 7 wave pressure multiplier: `0.96 → 0.94`
- Stage 7 boss multiplier: `1.26 → 1.22`
- Stage 7 reward multiplier: `1.38 → 1.42`
- Stage 7 forbidden plate budget: `3 → 2`
- Stage 7 minimum usable placements: `20 → 21`
- Stage 7 target winrate guide: `0.56 → 0.59`

## Monster Pool Tuning
- 7-1 early band shield/armor-heavy 몬스터 비중을 낮추고 기본형 비중을 높임
  - `crystal_barrier: 34 → 28`
  - `iron_guardian: 34 → 29`
  - `void_sentry: 20 → 31`
  - `meteor_charger: 12 유지`

## Design Intent
7-1 진입부에서 갑자기 막히는 느낌을 줄이되, Stage 7의 핵심 컨셉인 실드/장갑 해체 구조는 유지합니다.
