# v78 Patch Refactor

이 버전은 **v78 기능을 유지**한 상태에서, 누적된 inline 패치 코드를 외부 파일로 분리한 정리본입니다.

## 런타임 파일 구조

```text
index.html
src/
  styles/
    base.css                 # 기존 메인 CSS
    patches.runtime.css      # v74~v78 CSS 패치 묶음, 원래 cascade 순서 유지
  scripts/
    game-core.js             # 기존 메인 게임 런타임
    armory-base.js           # 기존 강화 관리 기본 컨트롤러
    patches.runtime.js       # v87~v78 JS 패치 묶음, 원래 실행 순서 유지
  manifests/
    patch-manifest.json      # 패치 id / domain / runtime file 매핑
```

## 정리 원칙

- v78의 게임 기능/해금/전투/맵 로직은 변경하지 않았습니다.
- inline `<style>` / `<script>`를 외부 파일로 분리했습니다.
- CSS cascade 순서와 JS 실행 순서는 기존 index.html 기준으로 유지했습니다.
- 테스트/디버그 관련 패치는 manifest에서 `debug-test` domain으로 표시했습니다.

## 다음 리팩토링 권장 순서

1. `patches.runtime.js`에서 `stage-unlock`, `battle`, `armory`, `map` 도메인별로 실제 함수 단위 분리
2. `patches.runtime.css`에서 최신 override만 남기고 오래된 v패치 제거
3. `runtime.production.json` / `runtime.test.json` 기준으로 테스트 코드를 별도 로더에서만 실행
4. HTML 단일 파일 의존 제거 후 Vite/Expo/RN 구조로 이관
```

## 분리 결과

- inline style: 146개 → `src/styles/base.css`, `src/styles/patches.runtime.css`
- inline script: 54개 → `src/scripts/game-core.js`, `src/scripts/armory-base.js`, `src/scripts/patches.runtime.js`
- 기존 중복 `all_scripts.js`는 `src/legacy/all_scripts.unused.v78.js`로 이동
- JS 문법 검사: `node --check` 통과

## Domain count

- stage-unlock: 74
- battle: 55
- armory: 71
