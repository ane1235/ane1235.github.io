# KSCTVA26 Debriefing — 새로고침 시 로그인 풀림 이슈 해결

> **작성 시점:** 2026-03-10 세션 3  
> **대상 버전:** V3.0 → V3.1  
> **수정 파일:** `js/state.js` (1개)

---

## I. 문제 탐색 — 데스크탑·모바일 모두에서 새로고침 시 로그인이 풀린다

### 1. 증상

- 로그인 화면에서 이름+사번 입력 → 정상적으로 로그인되어 메인 페이지(Overview)로 전환된다.
- 그러나 로그인된 상태에서 **브라우저 새로고침(F5 / 당겨서 새로고침)**을 하면, 로그인이 풀리고 다시 로그인 화면으로 돌아간다.
- 데스크탑 브라우저(Chrome)와 모바일 브라우저(Safari/Chrome) 모두에서 동일하게 재현된다.

### 2. 영향 범위

- 학회 당일 사용자가 세션 페이지 ↔ MyPage를 오가다가 실수로 새로고침하면 처음부터 다시 로그인해야 한다. 20명 사용자 전원에게 영향을 주는 UX 결함이다.

---

## II. 문제 확인 — 로그인 상태가 JS 메모리 변수에만 존재하여 페이지 재로드 시 소멸한다

### 1. 코드 분석 (GitHub 저장소에서 직접 확인)

- **`state.js` 4행:** `var state = { user: null, selections: [], ... }` — 로그인 정보(`state.user`)가 순수 JavaScript 변수(= RAM에만 존재하는 휘발성 데이터)에 저장된다.
- **`index.html` 구조:** `<div id="view-login">` 은 기본 표시 상태, `<div id="app-container" class="hidden">`은 기본 숨김 상태다. JS가 `state.user`를 확인하지 못하면 항상 로그인 화면이 보인다.
- **자동 복원 로직 부재:** 전체 코드(config.js, data.js, utils.js, state.js, nav.js, views.js)에서 `localStorage`, `sessionStorage`, 쿠키 등 브라우저 영속 저장소를 사용하는 곳이 전혀 없다.

### 2. 재현 흐름

```
[새로고침] → 브라우저가 페이지를 완전히 다시 로드
  → 모든 JS 변수 소멸 (state.user = null)
  → DOMContentLoaded 이벤트 핸들러 없음 (저장된 세션 복원 시도 자체가 없음)
  → index.html 기본 상태: view-login 표시 + app-container 숨김
  → 로그인 화면 표시
```

---

## III. 원인 분석 — V1.0 설계 시 세션 유지를 고려하지 않았다

### 1. 원래 아키텍처 (V1.0~V1.2, Google Sites iframe 방식)

- Apps Script가 HTML을 직접 서빙하고, `google.script.run`으로 통신하는 구조였다. 이 환경에서는 iframe 내부의 JS 상태가 Google Sites 페이지 내에서 유지되므로, 사용자가 Google Sites 자체를 새로고침하지 않는 한 문제가 드러나지 않았다.

### 2. V2.0~V3.0 전환 시 누락

- GitHub Pages 직접 호스팅으로 전환하면서 `google.script.run` → `fetch API`로 통신 방식을 바꾸고, 파일 분리와 데이터 하드코딩까지 진행했으나, **세션 영속성(= 페이지 새로고침 후에도 로그인 상태가 유지되는 것)**은 설계 범위에 포함되지 않았다.
- GitHub Pages에서는 사용자가 URL을 직접 입력하거나 북마크에서 열 때마다 완전한 페이지 로드가 발생하므로, 이 문제가 즉시 드러난다.

---

## IV. 해결 방안 후보들 — 5가지 접근법의 장단점 비교

### 1. `sessionStorage` (= 탭이 열려있는 동안만 데이터가 유지되는 브라우저 저장소)

| 장점 | 단점 |
|---|---|
| 새로고침 시 데이터 유지됨 | 탭을 닫으면 데이터 소멸 → 다시 로그인 필요 |
| 탭 간 데이터 격리 (보안에 유리) | 모바일 Safari에서 탭 스위칭 시 세션이 소멸하는 알려진 이슈 존재 |
| 구현 간단 (JS API 3줄) | 새 탭으로 URL을 열면 세션 없음 → 재로그인 필요 |

### 2. `localStorage` (= 브라우저에 영구적으로 저장되는 키-값 저장소)

| 장점 | 단점 |
|---|---|
| 새로고침 시 유지됨 | 명시적으로 삭제하지 않으면 영구 존속 |
| 탭을 닫아도 유지됨 → 한 번 로그인으로 학회 기간 내내 사용 | 공용 PC에서 다른 사용자가 이전 사람의 로그인으로 접속할 위험 |
| 모바일 탭 스위칭 문제 없음 | 5MB 용량 제한 (이 앱에서는 문제 없음) |
| 구현 간단 (JS API 3줄) | Private Browsing 모드에서 일부 차단될 수 있음 |

### 3. 서버 세션 토큰 (= Apps Script에 세션 관리 로직 추가)

| 장점 | 단점 |
|---|---|
| 가장 안전한 인증 방식 | Apps Script에 토큰 생성·검증·만료 로직 추가 필요 → 복잡도 대폭 증가 |
| 서버 측에서 세션 강제 만료 가능 | 매 API 호출마다 토큰 검증 오버헤드 |
| | 현재 앱의 규모(20명, 2일 사용)에 비해 과도한 엔지니어링 |

### 4. URL 해시/파라미터 (= URL에 로그인 상태 인코딩)

| 장점 | 단점 |
|---|---|
| 저장소 의존 없음 | URL에 사번이 노출됨 → 브라우저 히스토리·공유 시 보안 문제 |
| 북마크로 자동 로그인 가능 | SPA 구조와 충돌 (해시 라우팅이 없는 현재 구조에서 추가 복잡도) |

### 5. 쿠키 (`document.cookie`)

| 장점 | 단점 |
|---|---|
| 만료 시간 설정 가능 | API 구문이 불편하고 직관적이지 않음 |
| 서버에 자동 전송됨 | Apps Script fetch 호출에서 쿠키가 의미 없음 (서버 세션이 없으므로) |
| | `SameSite`, `Secure` 속성 관리 필요 → 불필요한 복잡도 |

---

## V. 선택한 해결방안 — localStorage, 그리고 sessionStorage 대신 선택한 결정적 이유

### 1. 결론: `localStorage`를 선택한다

### 2. sessionStorage가 아닌 localStorage를 선택한 3가지 이유

- **가. 학회 앱의 사용 패턴은 "한 번 로그인, 이틀간 유지"다.** KSCTVA26은 2026-04-11~12 이틀간 사용하는 앱이다. 사용자가 탭을 닫고 다음 날 다시 열었을 때도 로그인이 유지되어야 자연스럽다. `sessionStorage`는 탭을 닫으면 데이터가 소멸하므로, 매일 아침 또는 탭을 닫을 때마다 재로그인이 필요해진다.
- **나. 모바일 Safari의 sessionStorage 불안정성을 회피한다.** iOS Safari에서 앱 전환(백그라운드 → 포그라운드) 시 탭이 리로드되면서 `sessionStorage`가 소멸하는 알려진 동작이 있다. 학회장에서 다른 앱(카카오톡, 메일 등)을 쓰다가 돌아오면 로그인이 풀리는 상황은 20명 사용자 전원이 겪을 수 있는 문제다. `localStorage`는 이 영향을 받지 않는다.
- **다. 보안 위험이 도메인 특성상 무시할 수 있다.** 저장되는 정보는 이름과 사번(8자리)뿐이며, 이 정보는 이미 ANE 탭에 19명 전원이 공개되어 있는 내부 정보다. 사용자 20명은 모두 동일 부서(부천세종병원 마취통증의학과) 소속이며, 대부분 개인 모바일 기기에서 접속한다. 공용 PC 사용 시에는 로그아웃 버튼을 안내하면 충분하다.

### 3. 나머지 후보를 탈락시킨 이유

- **서버 세션 토큰:** 20명이 2일간 쓰는 앱에 토큰 인증 체계를 구축하는 것은 과도한 엔지니어링이다. Apps Script 수정(doGet/doPost에 토큰 검증 로직 추가)과 클라이언트 수정이 동시에 필요하여 변경 범위가 지나치게 크다.
- **URL 해시:** 사번이 브라우저 히스토리와 공유 링크에 노출되는 것은 아무리 내부 앱이라도 바람직하지 않다.
- **쿠키:** `localStorage`와 동일한 효과를 더 복잡한 API로 달성한다. Apps Script 서버에서 쿠키를 활용하지 않으므로 쿠키의 유일한 이점(서버 자동 전송)이 무의미하다.

---

## VI. 구현 과정과 결과 — state.js 1개 파일만 수정하여 V3.1 완성

### 1. 수정 대상은 `js/state.js` 단 1개뿐이다

- `config.js`, `data.js`, `utils.js`, `nav.js`, `views.js`, `index.html`, `css/style.css` → 변경 불필요
- 이유: 로그인 상태 관리는 오직 `state.js`에 캡슐화되어 있고, 다른 파일은 `state.user`를 읽기만 한다.

### 2. 추가된 핵심 함수 3개

| 함수 | 역할 | 호출 시점 |
|---|---|---|
| `saveSession(userData)` | `localStorage.setItem('ksctva_user', JSON.stringify(userData))` | 로그인 성공 시 (`onLoginSuccess`) |
| `restoreSession()` | `localStorage.getItem` → JSON.parse → 필수 필드(name, sn2) 검증 | 페이지 로드 시 (`DOMContentLoaded`) |
| `clearSession()` | `localStorage.removeItem('ksctva_user')` | 로그아웃 시 (`handleLogout`) |

### 3. 기존 함수 수정 사항 (2개)

| 함수 | V3.0 (수정 전) | V3.1 (수정 후) |
|---|---|---|
| `onLoginSuccess()` | `state.user = result.data` → `initApp()` | `state.user = result.data` → **`saveSession(result.data)`** → `initApp()` |
| `handleLogout()` | `state.user = null` → UI 초기화 | `state.user = null` → **`clearSession()`** → UI 초기화 |

### 4. 신규 추가: DOMContentLoaded 이벤트 리스너

```javascript
document.addEventListener('DOMContentLoaded', function() {
  var savedUser = restoreSession();
  if (savedUser) {
    state.user = savedUser;
    initApp();   // 로그인 건너뛰고 바로 앱 초기화
  }
  // savedUser가 null이면 로그인 화면 유지 (HTML 기본 상태)
});
```

- **타이밍 안전성:** `<script>` 태그가 `</body>` 직전에 위치하므로, `config.js → data.js → utils.js → state.js → nav.js → views.js` 순서로 모두 실행된 후 `DOMContentLoaded`가 발생한다. 따라서 `initApp()` 호출 시 `buildDropdownMenus()`, `showView()` 등 다른 파일의 함수가 이미 정의되어 있다.

### 5. 방어적 설계: 3가지 예외 상황 대응

| 예외 상황 | 대응 방식 |
|---|---|
| JSON 파싱 실패 (corrupt 데이터) | `try-catch`로 감싸서 실패 시 `localStorage.removeItem()` + `return null` → 로그인 화면으로 안전하게 복귀 |
| 필수 필드 누락 (`name` 또는 `sn2` 없음) | 검증 후 유효하지 않으면 정리 후 `null` 반환 |
| Private Browsing 모드 (localStorage 차단) | `saveSession`에서 `try-catch` → 에러 무시. 앱 자체는 정상 동작하되 세션 유지만 불가 (graceful degradation) |

---

## VII. 검증 — 6개 시나리오 시뮬레이션 전부 통과

| # | 시나리오 | 기대 결과 | 판정 |
|:---:|---|---|:---:|
| 1 | 최초 방문 (localStorage 비어있음) | 로그인 화면 표시 | ✅ |
| 2 | 로그인 성공 | localStorage에 저장 + 메인 페이지 표시 | ✅ |
| 3 | **새로고침 (핵심 시나리오)** | **localStorage에서 복원 → 메인 페이지 유지** | ✅ |
| 4 | 로그아웃 후 새로고침 | localStorage 비어있음 → 로그인 화면 | ✅ |
| 5 | corrupt 데이터 | try-catch로 정리 → 로그인 화면 | ✅ |
| 6 | Private Browsing | 세션 유지만 불가, 앱 정상 동작 | ✅ |

---

## VIII. 적용 절차

1. 제출된 `state.js` 파일을 다운로드한다.
2. GitHub 저장소 `ane1235/ane1235.github.io`의 `js/state.js`를 V3.1로 교체한다.
3. commit → push 후 1~2분 대기한다 (GitHub Pages 배포 딜레이).
4. `ane1235.github.io` 접속 → 로그인 → F5 새로고침 → 로그인 유지 확인.
5. 모바일에서도 동일하게 테스트한다 (탭 닫기 → 재열기 → 로그인 유지 확인).

---

## IX. Analyst Note

> 이 이슈의 근본 원인은 V1.0 설계 당시 Google Sites iframe 환경에서는 문제가 드러나지 않았기 때문이다. GitHub Pages 전환(V2.0~V3.0)은 통신 방식과 파일 구조를 대폭 변경했지만, **세션 영속성**이라는 암묵적 기능 요건은 검토 목록에서 빠졌다. 이는 플랫폼 전환 시 "기존에 잘 되던 것"이 새 환경에서 깨지는 전형적인 패턴이며, 전환 체크리스트에 "상태 유지 동작 검증"을 포함해야 한다는 교훈을 남긴다. localStorage 선택은 이 앱의 도메인 특성(20명, 2일, 개인 기기 위주)에 정확히 부합하며, 만약 사용자 규모나 보안 요건이 달라진다면 서버 세션 토큰으로 전환하는 것이 적절하다.
