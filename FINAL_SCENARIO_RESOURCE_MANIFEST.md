# PLANET RIFT DEFENSE — 최종 시나리오/리소스 매니페스트

## 전체 세계관

붕괴된 은하의 마지막 코어를 지키기 위해 잠든 행성 병기를 깨우고, 오염된 성역을 하나씩 정화하는 우주 방어전입니다.

플레이어는 마지막 코어 방어망의 지휘관입니다. 성역 지도에서 일반 스킬을 연구하고, 전투에서는 행성 장판을 배치·병합해 균열 항로를 막습니다.

게임 루프는 다음 기준으로 통일했습니다.

```text
성역 진입 → 10웨이브 방어 → 보스 정화 → 신규 행성/일반 스킬 해금 → 다음 성역 개방
```

## 리소스 네이밍 규칙

스테이지 리소스는 아래 기준으로 맞췄습니다.

```text
배경: bg_{stage_key}.png
전투 연출: fx_{stage_key}.png
지도 행성 이미지: stage_planet_{stage_key}.png
성역 BGM: audio/bgm_stage_XX_{stage_key_title}.wav
```

기존 파일명과 시나리오명이 어긋나던 부분은 호환용 원본을 유지하면서 신규 별칭 파일을 추가했습니다.

- `space_bg.png` → `bg_cosmic.png`
- `bg_ice.png` → `bg_frost.png`
- `fx_ice.png` → `fx_frost.png`
- `bg_smog.png` → `fx_smog.png`
- `bg_crystal.png` → `fx_crystal.png`
- `bg_machine.png` → `fx_machine.png`

## 성역별 구성

| 성역 | Key | 한글명 | 배경 | 전투 FX | 지도 행성 | BGM | 중간 보스 | 최종 보스 | 해금 일반 스킬 | 클리어 타워 |
|---:|---|---|---|---|---|---|---|---|---|---|
| 1 | cosmic | 공허 성역 | `bg_cosmic.png` | `fx_cosmic.png` | `stage_planet_cosmic.png` | `audio/bgm_stage_01_cosmic_void.wav` | 성운 감시자 | 공허 심핵 | 공격력 연구 | 블랙홀 행성 |
| 2 | frost | 빙결 외곽 | `bg_frost.png` | `fx_frost.png` | `stage_planet_frost.png` | `audio/bgm_stage_02_frost_expanse.wav` | 빙하 포효체 | 절대영도 핵 | 치명타 연구 | 프로스트 행성 |
| 3 | lava | 용암 성운 | `bg_lava.png` | `fx_lava.png` | `stage_planet_lava.png` | `audio/bgm_stage_03_lava_nebula.wav` | 화염 거신 | 태양 화옥 | 공격속도 연구 | 솔라 행성 |
| 4 | jungle | 생체 정글 | `bg_jungle.png` | `fx_jungle.png` | `stage_planet_jungle.png` | `audio/bgm_stage_04_jungle_core.wav` | 포자 군체 | 월드루트 프라임 | 보스 대응 연구 | 바이오 행성 |
| 5 | smog | 매연 폐역 | `bg_smog.png` | `fx_smog.png` | `stage_planet_smog.png` | `audio/bgm_stage_05_smog_wasteland.wav` | 굴뚝 포식체 | 스모그 오메가 | 사거리 연구 | 스모그 행성 |
| 6 | crystal | 수정 성운 | `bg_crystal.png` | `fx_crystal.png` | `stage_planet_crystal.png` | `audio/bgm_stage_06_crystal_nebula.wav` | 프리즘 가디언 | 수정 군주 | 장판 증폭 연구 | 크리스탈 행성 |
| 7 | machine | 기계 핵성 | `bg_machine.png` | `fx_machine.png` | `stage_planet_machine.png` | `audio/bgm_stage_07_machine_core.wav` | 수리 드론 군집 | 오토마톤 코어 | 전장 회수 연구 | 메카 행성 |

## 상황별 BGM/SFX

### BGM

| 상황 | 파일 |
|---|---|
| 성역 지도 | `audio/bgm_map_starmap.wav` |
| 보스 경보 | `audio/bgm_boss_incursion.wav` |
| 성역 클리어 | `audio/bgm_result_sanctuary_restored.wav` |
| 게임오버 | `audio/bgm_result_core_collapse.wav` |

### 효과음

| 상황 | 파일 |
|---|---|
| 보스 경보 | `audio/sfx_boss_warning.wav` |
| 성역 클리어 | `audio/sfx_stage_clear.wav` |
| 코어 붕괴 | `audio/sfx_core_collapse.wav` |
| 코어 피격 | `audio/sfx_core_damage.wav` |
| 신규 타워 해금 | `audio/sfx_unlock.wav` |

## 전투/UX 반영 사항

- 전투 화면은 소환, 병합, 배속, 일시정지, BGM, 핵심 수치만 유지했습니다.
- 일반 스킬은 전투 중 조작하지 않고 성역 지도에서만 업그레이드합니다.
- 전투 중에는 전역 효과를 한 줄 요약으로만 보여줍니다.
- 타워별 스킬은 행성 레벨에 따라 자동 해금되는 고유 성장으로 구분했습니다.
- 보스 등장 시 경고 문구, 보스 BGM, 보스 효과음, 시나리오 로그가 함께 출력됩니다.
- 클리어 시 `SANCTUARY RESTORED` 팝업이 나오며, 다음 성역 진입 또는 성역 지도 강화로 이동할 수 있습니다.
- 게임오버 시 `CORE COLLAPSE` 팝업이 나오며, 실패 보상/전투 기록/재도전 버튼을 제공합니다.

## 검증

- `index.html`의 JavaScript 문법 검사를 통과했습니다.
- 최종본은 `.git`, `__MACOSX`, `.DS_Store`를 제외하고 압축했습니다.
