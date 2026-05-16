# Tower Defence 프로젝트 통합 문서

> 기존 루트의 여러 `.md` 문서를 하나로 합친 파일입니다. 앱 실행에 필요한 코드는 `index.html`, `all_scripts.js`, `audio/`, 이미지 리소스 폴더에 유지했습니다.


## 파일 정리 리포트


### 통합한 Markdown 파일

- `CLEAN_RUNTIME_NOTES.md`
- `PREMIUM_UI_PATCH_NOTES.md`
- `README.md`
- `RELEASE_NOTES.md`
- `SCENARIO_RESOURCE_MANIFEST.md`
- `V123_PLATE_AFFINITY_RESONANCE.md`
- `V126_TEST_MODE_FULL_UNLOCK_FIX.md`
- `V129_PLATE_VISUAL_POLISH.md`
- `V130_CONSTELLATION_COMPACT_PANEL.md`
- `V131_PREMIUM_ROUTE_LINE_PATH.md`
- `V132_ROUTE_CORNER_RAIL_FIX.md`
- `V136_ROUTE_CHAMFER_CORNERS.md`
- `V141_STAGE_MANIFEST_PROGRESS_FIX.md`
- `V64_UI_RECOVERY_NOTES.md`
- `V65_TOP_RIGHT_ICON_CONTROLS.md`
- `V66_TOP_ICON_TUNING.md`
- `V67_BOARD_CELL_RESTORE.md`
- `V67_RIGHT_STACKED_ICON_CONTROLS.md`
- `V74_STEP1_NOTES.md`
- `V75_STEP2_NOTES.md`
- `V76_STEP3_NOTES.md`
- `V77_STEP4_NOTES.md`
- `V78_POPUP_TEXT_IMAGE_ALIGNMENT_NOTES.md`
- `V79_COMMON_RESEARCH_ARMORY_NOTES.md`
- `V80_ICON_ONLY_ARMORY_NOTES.md`
- `V81_SKILL_CODEX_ARMORY_NOTES.md`
- `V82_PREMIUM_ARMORY_POLISH_NOTES.md`


### 삭제한 미사용 파일


아래 파일은 `index.html`과 `all_scripts.js`에서 파일명/경로 기준으로 참조되지 않는 것을 확인한 뒤 제거했습니다.

- `index_backup_v58.html`
- `scripts_check.js`
- `assets/images/common_skill_icons/default.svg`
- `assets/images/ui/generated/action_btn_active.png`
- `assets/images/ui/generated/action_btn_disabled.png`
- `assets/images/ui/generated/chip_amber.png`
- `assets/images/ui/generated/chip_shard.png`
- `assets/images/ui/generated/hud_bar.png`
- `assets/images/ui/generated/hud_button_blue.png`
- `assets/images/ui/generated/hud_button_dark1.png`
- `assets/images/ui/generated/hud_button_dark2.png`
- `assets/images/ui/generated/hud_button_purple.png`
- `assets/images/ui/generated/hud_side_icons.png`
- `assets/images/ui/generated/hud_stat_row.png`
- `assets/images/ui/generated/top_header_panel.png`


### 유지한 동적 참조 리소스


아래 리소스는 파일명이 코드에 직접 박혀 있지 않아도 런타임에서 동적으로 조합해 참조하므로 삭제하지 않았습니다.

- `assets/images/thumbs/*_lv1.webp` ~ `assets/images/thumbs/*_lv6.webp`: `assets/images/thumbs/${id}_lv${level}.webp` 패턴으로 런타임 참조
- `assets/images/common_skill_icons/global_*.svg`: `assets/images/common_skill_icons/${skillKey}.svg` 패턴으로 런타임 참조
- `audio/*.ogg`: BGM/SFX 매니페스트에서 참조
- `bg_*.webp`, `biome_*_feather.webp`, `fx_*.webp`, `stage_planet_*.webp`, `*_levels.webp`: 스테이지/타워/연출 리소스에서 참조


---



# CLEAN_RUNTIME_NOTES.md


# Clean Runtime Package V66

이 패키지는 V64의 `index.html`과 실제 리소스/디자인/기능을 그대로 유지한 상태에서,
실행에 필요 없는 검증용 추출 스크립트와 누적 패치 노트만 제거한 정리본입니다.

## Removed
- all_scripts_v53.js ~ all_scripts_v61.js
- planet_rift_index_v53.html
- 누적 패치 작업용 Vxx / PATCH 노트 파일

## Kept
- index.html
- audio/
- assets/images/thumbs/
- 배경/은하/게임 리소스 이미지
- README.md / RELEASE_NOTES.md / SCENARIO_RESOURCE_MANIFEST.md




# PREMIUM_UI_PATCH_NOTES.md


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




# README.md


# Planet Rift Defense — Release v2

브라우저에서 `index.html`을 열어 실행하는 우주 성역 방어 타워디펜스입니다.

## 최종 시스템

- **전투 화면**: 소환, 병합, 배속, 일시정지만 남긴 미니멀 UI입니다.
- **일반 스킬**: 전투 중 선택하지 않고, 성역 지도에서 성흔 조각으로 업그레이드합니다.
- **타워별 스킬**: 행성 레벨에 따라 자동 해금됩니다. `Lv.3 / Lv.6 / Lv.9`에서 핵심 고유 능력이 열립니다.
- **성역 진행**: 7개 성역을 순서대로 정화하며, 성역별 보스/시나리오/BGM이 다릅니다.
- **실패 루프**: 게임오버 시에도 성흔 조각과 전투 기록이 남아 다음 강화로 이어집니다.
- **반복 목표**: 전체 클리어 후 각 성역 3성 숙련도와 최고 기록을 갱신하는 재정화 루프를 노립니다.

## 조작

- `랜덤 소환`: 보유 수정으로 행성을 배치합니다.
- `자동 병합`: 같은 행성, 같은 레벨을 찾아 병합합니다.
- `1`: 랜덤 소환 단축키
- `2`: 배속 변경
- `M`: 자동 병합
- `Space`: 일시정지

`Q/W/E` 액티브 스킬은 최종 UX에서 제거되었습니다.

## 튜토리얼과 로그

- 첫 전투 진입 시 4단계 튜토리얼이 한 번 표시됩니다.
- 전투 종료 시 로컬 브라우저 저장소에 밸런스 분석용 로그가 저장됩니다.
- 메인 화면의 `RUN LOG CSV` 버튼으로 최근 기록을 CSV로 내려받을 수 있습니다.

## 배포 최적화

- WAV 오디오는 OGG로 변환했습니다.
- PNG 리소스는 WebP로 변환했습니다.
- 이전 패치 문서, 중복 이미지, 구버전 호환 파일은 릴리즈 패키지에서 제외했습니다.




# RELEASE_NOTES.md


# Release v2 Patch Notes

## 이번 반영 내용

1. **리소스 경량화**
   - BGM/SFX: `.wav` → `.ogg`
   - 이미지: `.png` → `.webp`
   - 중복 이미지와 구버전 문서 제거

2. **문서 최신화**
   - README를 현재 기획 기준으로 다시 작성
   - 전투 중 랜덤 스킬/QWE 액티브 스킬 설명 제거

3. **죽은 시스템 정리**
   - 전투 중 일반 스킬 선택 모달을 no-op 처리
   - 일반 스킬은 성역 지도 업그레이드로 고정

4. **첫 유저 튜토리얼 추가**
   - 첫 전투 진입 시 4단계 브리핑 표시
   - 소환, 병합, 일반 스킬 관리, 10웨이브 목표 설명

5. **밸런스 로그 추가**
   - 클리어/패배 결과
   - 성역, 웨이브, 처치 수, 소환 수, 병합 수, 코어 HP, 최고 콤보, 많이 쓴 타워 저장
   - CSV 다운로드 버튼 추가

6. **타워별 역할 강화**
   - 행성 데이터에 `role`, `identity` 추가
   - 상세 팝업에 역할/운용 설명 보강

7. **엔드게임 안내 보강**
   - 최종 성역 클리어 후 3성 숙련도와 재정화 루프 안내

## 검증

- `index.html` 내부 JavaScript 문법 검사 통과
- 릴리즈 폴더 기준 참조 리소스 존재 여부 점검 완료




# SCENARIO_RESOURCE_MANIFEST.md


# Scenario & Resource Manifest

## 세계관

붕괴된 은하의 마지막 코어를 지키기 위해 잠든 행성 병기를 깨우고, 오염된 성역을 하나씩 정화하는 우주 방어전입니다.

## 성역 구성

| Stage | Key | Korean | Core role | BGM |
|---:|---|---|---|---|
| 1 | cosmic | 공허 성역 | 기본 화력 학습 | `audio/bgm_stage_01_cosmic_void.ogg` |
| 2 | frost | 빙결 외곽 | 감속/제어 학습 | `audio/bgm_stage_02_frost_expanse.ogg` |
| 3 | lava | 용암 성운 | 장갑형/광역 화력 | `audio/bgm_stage_03_lava_nebula.ogg` |
| 4 | jungle | 생체 정글 | 회복 군체/장기전 | `audio/bgm_stage_04_jungle_core.ogg` |
| 5 | smog | 매연 폐역 | 은폐 장갑/약화 | `audio/bgm_stage_05_smog_wasteland.ogg` |
| 6 | crystal | 수정 성운 | 축전/공명 장판 | `audio/bgm_stage_06_crystal_nebula.ogg` |
| 7 | machine | 기계 핵성 | 실드 해체/최종 압박 | `audio/bgm_stage_07_machine_core.ogg` |

## 공통 오디오

- Map: `audio/bgm_map_starmap.ogg`
- Boss: `audio/bgm_boss_incursion.ogg`
- Clear: `audio/bgm_result_sanctuary_restored.ogg`
- Game Over: `audio/bgm_result_core_collapse.ogg`

## 타워 역할

| Tower | Role |
|---|---|
| Solar | 보스 딜러 / 광역 연소 |
| Frost | 감속 / 제어 |
| Storm | 연쇄 딜러 / 다중 타깃 |
| Bio | 지속 피해 / 회복 억제 |
| Void | 몰이 / 군중 제어 |
| Laser | 관통 저격 / 직선 화력 |
| Smog | 약화 / 장판 제어 |
| Crystal | 축전 / 공명 설계 |
| Mecha | 실드 해체 / 후반 안정성 |
| Star Engine | 최종 융합 병기 |




# V123_PLATE_AFFINITY_RESONANCE.md


# V123 Plate Affinity Resonance

- 특수 장판마다 소환 가능한 타워 중 하나의 공명 색상을 부여합니다.
- 장판 색상과 같은 타워를 올리면 타워 하단에 에너지 받침/공명 이펙트가 표시됩니다.
- 공명 성공 시 실제 전투 수치에 피해 +30%, 공격속도 +8%가 추가 적용됩니다.
- 색상이 다른 타워를 올리면 기존 장판 효과만 적용되고 받침 이펙트는 표시되지 않습니다.
- 선택한 타워 정보에 공명 여부가 표시됩니다.




# V126_TEST_MODE_FULL_UNLOCK_FIX.md


# V126 Test Mode Full Unlock Fix

- TEST MODE now always unlocks every sanctuary/stage.
- Added guard so navigation helper reloads cannot overwrite TEST MODE progress with saved normal-mode progress.
- Stage map rendering, stage entry, and unlock sync now force full unlock while TEST MODE is active.
- TEST MODE labels are refreshed after entering the map.




# V129_PLATE_VISUAL_POLISH.md


# V129 Plate Visual Polish

- Replaced flat solid tactical plate rectangles with premium chamfered glass/HUD plates.
- Added subtle glow, bevel, circuit-line motion, and compact DMG/SPD/RNG/ORE/RFT labels.
- Kept affinity matching and damage/fire-rate logic unchanged.
- Hover outline now follows the chamfered plate shape.




# V130_CONSTELLATION_COMPACT_PANEL.md


# V130 Constellation Compact Panel

- Constellation Map 행성 노드/행성 이미지/오비트 링 크기를 전체적으로 축소했습니다.
- 하단 Stage Info UI에서 MID/FINAL BOSS 카드 영역을 숨겨 세로 점유를 줄였습니다.
- 하단 설명 프레임을 CTA 버튼 쪽으로 더 내리고, 모바일 기준 높이를 줄였습니다.
- 모바일에서는 BOSS/ENEMY TRAIT 하위 카드가 다시 노출되지 않도록 `stageFocusedBoss`, `stageSyncBossBrief`, `offlineStagePanel` 계열을 방어적으로 숨겼습니다.




# V131_PREMIUM_ROUTE_LINE_PATH.md


# V131 Premium Route Line Path

## 반영 내용

- 전투 맵의 몬스터 이동 경로에서 기존 두꺼운 검정 도로 느낌을 제거했습니다.
- 경로를 프리미엄 SF HUD 스타일의 얇은 네온 라인 + 방향 화살표 중심 디자인으로 변경했습니다.
- 보드가 더 잘 보이도록 경로 중앙부는 투명도가 높은 글래스 톤으로 낮추고, 양쪽 레일과 화살표만 명확히 보이도록 조정했습니다.
- 코너 지점에 작은 네온 회로 노드를 추가해 라인이 끊겨 보이지 않도록 보강했습니다.

## 수정 파일

- `index.html`
- `all_scripts.js`

## 검증

- `node --check all_scripts.js` 문법 검사 통과




# V132_ROUTE_CORNER_RAIL_FIX.md


# V132 Route Corner Rail Fix

## 변경 목적
전투 맵 몬스터 이동 경로의 ㄱ자/ㄴ자 코너에서 네온 라인이 겹쳐 보이거나 꺾임부가 지저분해 보이는 문제를 정리했습니다.

## 적용 내용
- 기존 segment-by-segment 방식의 레일 렌더링을 연속 offset polyline 방식으로 변경
- 코너에서 각각의 선분 cap이 겹치지 않도록 miter 교차점을 계산
- 검은 도로 느낌을 더 줄이기 위해 route glow / glass body 두께와 투명도를 축소
- 코너 노드를 사각 다이아몬드에서 작은 원형 발광점으로 변경
- `index.html`, `all_scripts.js` 동일 반영

## 검증
- `node --check all_scripts.js` 통과




# V136_ROUTE_CHAMFER_CORNERS.md


# V136 Route Chamfer Corners

- Monster route 90-degree turns now use straight diagonal chamfers instead of hard square corners.
- Enemy movement uses the same chamfered route points, so monsters glide through turns diagonally rather than snapping at corners.
- Existing premium double-line route styling, arrow color, UI layout, towers, enemies, and stage logic are preserved.




# V141_STAGE_MANIFEST_PROGRESS_FIX.md


# V141 Stage Manifest Progress Fix

- 성역 클리어 시 `StageMapState.unlocked`를 즉시 다음 성역으로 저장하도록 보강했습니다.
- `META.clears`, `StageMapState`, `META.unlockedTowers`가 서로 어긋나도 `STAGE_UNLOCK_MANIFEST` 기준으로 다시 동기화합니다.
- 1성역 클리어 후 2성역이 열리고, 1성역 보상 행성이 소환/강화 관리에 추가되도록 수정했습니다.
- 기존 저장 데이터에서 스테이지 진행값만 남아 있거나 클리어 메타만 남아 있어도 둘 중 더 많이 진행된 값을 우선합니다.




# V64_UI_RECOVERY_NOTES.md


# V64 UI Recovery Notes

## 수정 내용

1. V62/V63에서 과하게 적용됐던 버튼 스킨 문제를 V60 안정본 기준으로 복구했습니다.
2. 전투 하단 조작 버튼만 제한적으로 다시 다듬었습니다.
   - 랜덤 소환 100
   - 타워 합치기
   - 1x
   - 일시정지
   - BGM ON
3. 버튼 아이콘 크기를 키우고, 버튼 비율을 과하게 둥글거나 큰 느낌이 나지 않도록 조정했습니다.
4. 필드 위 `타워` 버튼을 위로 올리고 크기를 키워 하단 HUD에 가려지지 않도록 수정했습니다.
5. 타워 관리 팝업의 썸네일/아이콘 크기를 키웠습니다.
6. `레벨 성장표 보기`를 펼친 뒤 전투 중 DOM 갱신으로 자동 접히던 문제를 수정했습니다.
7. 타워 관리 팝업 하단의 불필요한 `확인` 버튼을 제거했습니다.

## 원인

- 이전 프리미엄 버튼 CSS가 `.towerMenuBtn`까지 공통 버튼 규칙에 포함하면서 `width:100%` 같은 속성이 적용되어 타워 버튼이 깨졌습니다.
- 타워 팝업은 기존 상세 모달 HTML을 복사하는 구조인데, hangar DOM 갱신 때마다 `buildList()`가 재실행되며 상세 영역이 다시 그려졌고, 이 과정에서 `<details>`가 접혔습니다.

## 이번 방향

- 은하/성좌 지도 버튼에는 프리미엄 버튼 스킨을 적용하지 않습니다.
- 전투 화면 조작 버튼과 타워 팝업만 안전하게 보정합니다.




# V65_TOP_RIGHT_ICON_CONTROLS.md


# V65 Top-right Icon Controls

## 변경 사항
- 전투 화면의 `타워` 조작을 하단 좌측 큰 버튼에서 맵 우측 상단의 작은 원형 아이콘으로 이동했습니다.
- `BGM ON/OFF` 조작을 하단 버튼에서 맵 우측 상단의 작은 원형 아이콘으로 이동했습니다.
- 하단 COMMAND 영역은 `랜덤 소환`, `타워 합치기`, `1x`, `일시정지` 4개만 남기도록 정리했습니다.
- 원형 아이콘은 새 PNG 파일 2개로 추가했습니다.
  - `assets/images/ui/icons/ui_icon_tower.png`
  - `assets/images/ui/icons/ui_icon_bgm.png`
- 아이콘 크기와 밝기를 낮춰 게임 화면에서 과하게 튀지 않도록 보정했습니다.

## 검증
- `audioBtn`, `towerMenuBtn` ID 중복 없음.
- JavaScript 문법 검사 통과: `node --check`.
- BGM 버튼은 텍스트 변경 대신 `aria-label`, `title`, `aria-pressed`, `is-off` 클래스로 상태를 표시합니다.




# V66_TOP_ICON_TUNING.md


# V66 Top Icon Tuning

- 우측 상단 타워/BGM 원형 아이콘을 더 오른쪽으로 정렬했습니다.
- 실제 터치 크기를 모바일 기준 36px → 50px로 키웠습니다.
- 너무 어둡게 보이던 CSS filter를 완화해, 살짝만 톤 다운된 수준으로 조정했습니다.
- PNG 내부 투명 여백을 줄여 같은 CSS 크기에서도 아이콘이 더 또렷하게 보이도록 보정했습니다.




# V67_BOARD_CELL_RESTORE.md


# V67
- Desktop battle board cell size restored from 56 to 62.
- Mobile cell size remains 72.




# V67_RIGHT_STACKED_ICON_CONTROLS.md


# V67 Right-stacked icon controls

- Moved Tower and BGM quick controls to a vertical stack on the right side of the field.
- Increased icon hit target/visual scale slightly from V66.
- Brightened icon filter slightly while keeping glow restrained.
- Moved the battle stage label inward from the far-right edge.




# V74_STEP1_NOTES.md


V74 STEP 1 — Main menu + Galaxy map UI only

Applied
- Main menu card, typography, info cards, offline panel, action buttons
- Galaxy map top title, back button, status panel, scene wrap frame, info panel, meta cards, enter button

Preserved
- Galaxy background / nebula visuals
- Galaxy node images and layout
- Game screen, stage map, battle HUD, tower rendering




# V75_STEP2_NOTES.md


V75 STEP 2 — Constellation map UI

Applied
- Constellation map top title / back button / status panel
- Constellation deck cards
- Stage map inner frame
- Stage hint / stage info panel / risk & tags / boss cards
- Enter Sanctuary button
- Node labels only (planet visuals preserved)

Preserved
- Stage map planets and layout
- Route path and background worlds
- Battle screen and tower rendering
- Main menu + Galaxy UI from step 1




# V76_STEP3_NOTES.md


V76 STEP 3 — Battle HUD UI

Applied
- Battle top HUD
- Wave preview and global effect cards
- Stat cards
- Command panel and buttons
- Selected panel
- Top-right tower/BGM icon buttons

Preserved
- Battle field, enemies, roads, core, and tower rendering
- Step 1 main menu + galaxy UI
- Step 2 constellation UI




# V77_STEP4_NOTES.md


V77 STEP 4 — Tower popup + Planet detail popup UI

Applied
- Tower management popup shell, header, item list, active state, preview area, action buttons
- Planet detail popup shell, hero area, stat cards, section cards, tags, action buttons, close buttons

Preserved
- Popup functionality and data bindings
- Tower thumbnails / artworks
- Steps 1 to 3 UI changes




# V78_POPUP_TEXT_IMAGE_ALIGNMENT_NOTES.md


# V78 Popup Text/Image Alignment Fix

## 적용 범위
- `index.html` Tower Armory 팝업 전용 CSS 보정 추가
- 기존 게임 로직과 타워 수치 계산은 변경하지 않음

## 수정 내용
1. 타워 관리 왼쪽 목록의 한글 타워명/역할 텍스트가 지나치게 잘리는 문제 수정
2. 목록 썸네일을 기존 배경 복제 방식에서 이미지 태그 기반으로 보강해 숨김 DOM/캐시 상태에서도 안정적으로 표시
3. 목록 썸네일, 상세 대표 이미지의 중앙 정렬 규칙 통일
4. 상세 상단 히어로, 스탯 카드, 고유 스킬 카드의 글자 줄바꿈/간격 보정
5. 잘못 들어가 있던 `max-width:760px` CSS 구문을 정상 `@media` 구문으로 복구
6. 760px 이하 화면에서는 왼쪽 세로 목록 대신 상단 가로 스크롤 목록으로 전환해 텍스트 압축 방지




# V79_COMMON_RESEARCH_ARMORY_NOTES.md


# V79 Common Research Armory Patch

## Decision
- 공통 연구를 별도 신규 버튼으로 분리하지 않고 기존 타워 관리 흐름에 통합했습니다.
- 팝업 이름을 `강화 관리 / UPGRADE ARMORY`로 확장하고, 내부 탭을 `타워 강화`와 `공통 연구`로 나눴습니다.
- 메인 화면은 공통 연구 버튼 그리드를 제거하고 진행/재화 요약만 보여주도록 정리했습니다.

## UX Changes
- 전투 화면의 기존 타워 아이콘 버튼은 그대로 유지하며, 클릭 시 강화 관리 팝업이 열립니다.
- 성좌 지도에는 같은 톤의 `강화 관리` 진입 버튼을 추가했습니다.
- 성좌 지도에서 강화 관리 버튼을 누르면 공통 연구 탭이 먼저 열립니다.
- 전투 화면에서 기존 타워 버튼을 누르면 타워 강화 탭이 먼저 열립니다.

## Common Research Tab
- 성흔 조각 보유량, 현재 전역 효과, 다음 해금 정보를 표시합니다.
- 각 공통 연구는 잠금/해금/MAX 상태를 명확히 표시합니다.
- 연구 상세에는 현재 효과, 다음 효과, 필요 조각, 설명, 업그레이드 버튼을 표시합니다.
- 업그레이드 후 즉시 저장, 전역 효과 갱신, UI 갱신이 이루어집니다.

## Technical Notes
- 기존 `OFFLINE_UPGRADE_CONFIG`, `META.upgrades`, `buyOfflineUpgrade()` 로직을 재사용했습니다.
- 팝업 스크립트에서 접근할 수 있도록 `window.TowerDefenseGrowth` API를 노출했습니다.
- 기존 `data-offline-upgrade` 클릭 흐름과 충돌하지 않도록 공통 연구 팝업 버튼은 별도의 `data-common-research-buy` 이벤트를 사용합니다.
- 모바일에서는 공통 연구 목록이 상단 가로 스크롤로 바뀌어 상세 영역이 압축되지 않도록 했습니다.




# V80_ICON_ONLY_ARMORY_NOTES.md


# V80 Icon-only Upgrade Armory

## 핵심 변경
- 강화 관리 팝업을 레퍼런스 시안과 같은 좌측 세로 아이콘 네비게이션 구조로 변경했습니다.
- 타워 탭의 좌측 목록에서 텍스트를 제거하고 타워 아이콘만 표시합니다.
- 공통 연구 탭도 동일하게 좌측 세로 아이콘 목록으로 통일했습니다.
- 공통 연구용 신규 SVG 리소스를 `assets/images/common_skill_icons/` 폴더에 추가했습니다.
- 공통 연구 상세 화면에 현재 레벨, 현재 효과, 다음 효과, 비용, 적용 범위, 설명, 연구 단계 타임라인을 추가했습니다.
- 기존 메인/맵/전투 진입 로직은 유지하고, 강화 관리 팝업 UI만 v80 구조로 보강했습니다.

## 신규 리소스
- `assets/images/common_skill_icons/global_damage.svg`
- `assets/images/common_skill_icons/global_crit.svg`
- `assets/images/common_skill_icons/global_speed.svg`
- `assets/images/common_skill_icons/global_boss.svg`
- `assets/images/common_skill_icons/global_range.svg`
- `assets/images/common_skill_icons/global_plate.svg`
- `assets/images/common_skill_icons/global_economy.svg`




# V81_SKILL_CODEX_ARMORY_NOTES.md


# V81 Skill Codex Armory

- 강화 관리 팝업을 타워/공통 연구 모두 스킬 정보 중심으로 재구성했습니다.
- 타워 탭에서 필드 보유, 최고 레벨 등 전투 중 보유 정보성 카드를 제거했습니다.
- 행성별 기본 능력치, 해금 조건, 역할과 운용, 고유 스킬 정보를 우측 상세 패널에 표시합니다.
- 미해금 행성은 좌측 아이콘과 상세 패널을 블러/잠금 처리하여 상세 정보를 볼 수 없도록 했습니다.
- 공통 연구 상세에서 업그레이드 버튼을 다시 노출하고, 성흔 조각이 충분할 때 실제 연구 구매가 가능하도록 연결했습니다.
- 미해금 공통 연구도 성역 조건 달성 전에는 블러/잠금 처리됩니다.


## 2026-05-16 추가 보정
- 팝업 최초 진입 시 미해금 타워가 아니라 먼저 사용 가능한 타워의 스킬 정보를 보여주도록 조정.
- 공통 연구 잠금 문구를 `도달` 기준이 아니라 실제 진행 흐름에 맞춘 `이전 성역 클리어 후` 기준으로 정리.
- 미해금 아이콘 블러 강도를 높여 상세 내용을 유추하기 어렵게 조정.




# V82_PREMIUM_ARMORY_POLISH_NOTES.md


# V82 Premium Armory Polish

## 변경 요약
- 강화 관리 팝업을 더 작고 고급스러운 카드 밀도로 재정리했습니다.
- 우측 상단에 업그레이드 재화인 `성흔 조각` 보유량 배지를 추가했습니다.
- 공통 연구 상세 상단에 즉시 업그레이드 가능한 `NEXT UPGRADE` 도킹 패널을 추가했습니다.
- 타워/공통 연구 좌측 아이콘 레일을 더 작고 정돈된 프리미엄 버튼 형태로 개선했습니다.
- 타워 상세 정보에서 불필요하게 큰 카드/텍스트를 줄이고, 스킬 정보 중심으로 재배치했습니다.
- 미해금 타워/공통 연구는 블러와 잠금 배지로 정보 접근을 제한합니다.
- 전투/맵의 강화 관리 진입 버튼을 네온 글래스 버튼 스타일로 고도화했습니다.

## 검증
- HTML 내 스크립트 2개 `node --check` 문법 검사를 통과했습니다.
- 현재 샌드박스에서는 `file://` 및 `localhost` 브라우저 접근이 관리자 정책으로 차단되어 실제 렌더링 스크린샷 검증은 수행하지 못했습니다.



---

## 이미지 리소스 폴더 구조 정리

이미지 리소스는 `assets/images/` 하위에서 관리합니다.

- `assets/images/backgrounds/`: 스테이지 배경 `bg_*.webp`
- `assets/images/biomes/`: 스테이지/바이옴 feather 이미지 `biome_*_feather.webp`
- `assets/images/effects/`: 스테이지 연출 `fx_*.webp`
- `assets/images/galaxies/`: 은하 맵 이미지 `galaxy_*.png`
- `assets/images/planets/`: 성좌/스테이지 행성 이미지 `stage_planet_*.webp`
- `assets/images/towers/`: 타워 레벨 스프라이트 및 행성 시트 `*_levels.webp`, `planet_units_planet_style_v15.webp`
- `assets/images/thumbs/`: 타워 썸네일 `*_lv*.webp`
- `assets/images/common_skill_icons/`: 공통 연구 SVG 아이콘
- `assets/images/ui/icons/`: 전투/맵 상단 아이콘
- `assets/images/ui/armory/`: 강화 관리 UI 프레임 이미지
- `assets/images/ui/generated/`: 생성형 HUD/UI 패널 이미지
