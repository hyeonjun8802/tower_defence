# PLANET RIFT DEFENSE — MOBILE UX/UI OPTIMIZATION UPDATE

## Version
v50 Mobile Optimization Patch

---

# 핵심 변경 사항

이번 패치는 기존 PC 중심 레이아웃을 모바일 플레이 환경에 맞게 재구성하는 것을 목표로 진행되었다.

기존 문제:
- 전투 보드가 너무 작게 표시됨
- 하단 UI 패널이 화면을 과도하게 차지함
- 버튼 크기가 커서 플레이 영역이 좁아짐
- 모바일 Safari 환경에서 프레임 드랍 및 버벅임 발생
- Glow / Blur / Particle 효과가 과도하여 GPU 부하 증가
- 모바일에서 정보 밀도가 높아 피로감 발생

---

# MOBILE UX 개선

## 1. 전투 보드 확대
- 모바일에서 셀 및 보드 영역 확대
- 전투 공간 가시성 강화
- 플레이어 시선 집중도 향상

## 2. 전투 영역 상단 이동
- 보드를 화면 상단 쪽으로 이동
- 하단 UI 공간 확보
- 실제 플레이 영역 체감 증가

## 3. 하단 UI Compact화
- 패널 높이 축소
- padding / margin 감소
- 버튼 높이 축소
- 모바일 조작 최적화

## 4. 스킬 카드 Compact UI
- 카드 width 제한
- 텍스트 크기 조정
- 모바일 세로 화면 최적화
- 긴 설명 영역 최소화

---

# MOBILE PERFORMANCE MODE

모바일 환경(window width <= 768)에서 자동 적용된다.

## 최적화 항목

### 비활성 또는 축소
- Particle 감소
- Beam glow 감소
- Background animation 감소
- Damage text 동시 출력 제한
- Blur 효과 최소화
- Backdrop-filter 제거 또는 축소
- Shadow 효과 단순화
- Floating animation 감소

### 렌더링 최적화
- requestAnimationFrame 업데이트 최소화
- repaint/reflow 감소
- animation duration 단축
- 모바일 GPU 부하 감소

---

# SAFARI / iPHONE 대응

## 적용 사항
- 100vh 대신 100dvh 사용
- safe-area-inset-bottom 대응
- iPhone 브라우저 UI 가림 현상 완화
- 모바일 viewport 안정성 향상

---

# GAMEPLAY 방향성

현재 게임 방향성은 아래를 유지한다.

## 핵심 컨셉
- 장판 기반 전략 디펜스
- 행성 성장/합성
- 랜덤 성장 요소
- 행성별 시너지
- 광역/빙결/중독/전기/블랙홀 등 속성 기반 전투

## 난이도 방향
- 초반부터 장판 활용이 중요
- 단순 화력보다 전략 배치 요구
- 랜덤 강화로 리플레이성 확보

---

# 향후 개선 예정

## UI
- 손가락 조작 기반 터치 UX 개선
- 드래그 합성 반응 개선
- 햅틱 대응

## 성능
- Canvas 렌더링 분리
- OffscreenCanvas 검토
- Mobile GPU 대응 최적화
- Sprite Atlas 경량화

## 게임성
- 환경 디버프 타일
- 행성 특수 이벤트
- 보스 패턴 강화
- 시너지 조합 강화

---

# 결론

이번 패치는 모바일 플레이 환경 기준으로:
- 가독성
- 조작성
- 성능
- 화면 밀도

를 개선하는 데 초점을 맞춘 UX/UI 최적화 패치이다.
