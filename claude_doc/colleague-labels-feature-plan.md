# 동료 수강자 레이블 표시 기능 — 최종 기획안 및 개발 계획

> 작성일: 2026-03-10
> 프로젝트: KSCTVA 2026 춘계학술대회 웹앱
> 상태: 계획 확정, 구현 대기

---

## I. 기능 개요

### 1. 목적

- 학회에 참석하는 우리 직원(ANE 탭 명단) 중 **누가 같은 강의를 듣는지** 한눈에 파악한다.
- 인기 강의 식별, 동료와의 합류/퇴장 시점 파악 등 현장에서 실용적인 정보를 제공한다.

### 2. 기능 정의

- 강의 제목 또는 세션 제목 아래에 **줄바꿈 후**, 해당 강의를 선택한 동료의 이름을 **작은 박스(pill badge) 레이블**로 나열한다.
- 레이블 정렬 규칙:
  - **(1) 본인 레이블이 맨 앞**에 위치하며, 다른 색상으로 구분한다.
  - **(2) 나머지 동료는 가나다 순서**로 정렬하여 나열한다.

### 3. 적용 위치 (3곳)

| 번호 | 페이지 | 대상 셀 | 표시 기준 |
|------|--------|---------|----------|
| 1 | **메인 페이지 (Overview)** | 각 Session 셀 | 해당 세션의 강의 중 **하나라도** 선택한 직원의 이름 |
| 2 | **Session 상세 페이지** | 각 Lecture Row | 해당 강의를 선택한 직원의 이름 |
| 3 | **MyPage** | 각 Lecture 셀 (주제 컬럼) | 위 2번과 동일 |

### 4. 레이블 디자인 (목업)

```
┌─────────────────────────────────────────────────┐
│ 10:30–10:45                                     │
│ 흉부 수술에서 고난도 기도 관리                       │
│ ┌──────┐ ┌──────┐ ┌──────┐                      │
│ │ 나본인 │ │ 김철수 │ │ 이영희 │                    │
│ └─파란──┘ └─회색──┘ └─회색──┘                     │
│ ↑ 본인(파란)  ↑ 동료(회색, 가나다순)                │
│ 이규호 (연세의대)                                  │
└─────────────────────────────────────────────────┘
```

---

## II. 현재 시스템 구조 분석

### 1. 아키텍처 개요

```
[GitHub Pages]                    [Google Apps Script]
  index.html                         doGet() / doPost()
  js/config.js  ── API_URL ──→      ↕
  js/data.js    (하드코딩 프로그램)    [Google Sheets]
  js/utils.js   (API 호출 헬퍼)        - ANE 탭 (A:사번, B:이름)
  js/state.js   (상태 관리)            - Selections 저장소
  js/nav.js     (내비게이션)
  js/views.js   (뷰 렌더링)
  css/style.css
```

### 2. 현재 API 목록

| Action | Method | 용도 |
|--------|--------|------|
| `login` | GET | 이름+사번 인증 |
| `getSelections` | GET | 본인 선택 강의 목록 조회 |
| `saveSelections` | POST | 본인 선택 강의 목록 저장 |

### 3. 현재 데이터 흐름의 한계

- 현재 API는 **로그인한 본인의 선택 목록만** 반환한다.
- 다른 직원의 선택 데이터를 조회하는 API가 **존재하지 않는다.**
- 따라서 신규 API action이 반드시 필요하다.

### 4. 핵심 데이터 구조

- **Lecture ID 형식**: `[TabName]_R[RowIndex]` (예: `Day1_A1_R4`)
- **State 객체**: `state.user`, `state.selections`, `state.currentView`, `state.currentTab`, `state.mypageDay`
- **APP_DATA**: `event`, `menuMap`, `overview` (2D 배열), `sessions` (탭별 2D 배열)

---

## III. 실시간 반영 전략 — 기술 검토 및 확정

### 1. GAS의 기술적 제약

| 기술 | 설명 | GAS 지원 |
|------|------|----------|
| WebSocket | 서버↔클라이언트 양방향 상시 연결 | **불가** |
| SSE | 서버→클라이언트 단방향 스트리밍 | **불가** |
| HTTP Polling | 클라이언트가 주기적으로 API 호출 | **가능** |
| Push (Firebase 등) | 외부 실시간 서비스 경유 | 가능하나 과도 |

- GAS는 요청-응답 모델만 지원하므로, 서버가 능동적으로 클라이언트에 데이터를 보낼 수 없다.
- Firebase, Pusher 등 외부 서비스를 도입하면 Push가 가능하지만, 20명이 2일 쓰는 학회용 앱에는 과도하다.

### 2. 확정된 전략: Polling 1분 간격

| 상황 | 방식 | 체감 지연 |
|------|------|----------|
| **본인 선택 변경** | 로컬 `state.colleagues` 즉시 업데이트 (API 불필요) | **0ms (즉시)** |
| **타인 선택 변경** | 1분 간격 Polling으로 자동 갱신 | **최대 60초** |
| **페이지 이동** | 즉시 1회 fetch | **최신 보장** |

### 3. API 호출량 안전성

- GAS 일일 한도: 20,000회
- 20명 × 1분 간격 × 16시간 = 약 19,200회 (이론적 최대치)
- 실제로 20명이 16시간 내내 접속하지 않으므로 **문제없음 확정**

---

## IV. 개발 계획

### 1단계: Google Apps Script — 신규 API action 추가

- **`getColleagueSelections` action 구현**
  - [ANE] 탭(A열: 사번, B열: 이름)을 읽는다.
  - 각 직원의 사번으로 저장된 선택 목록을 조합한다.
  - JSON 형태로 반환한다: `{ success: true, data: [ { name, sn2, selections: [...] }, ... ] }`
- 사용자가 GAS 편집기에 붙여넣을 수 있도록 **완성된 코드를 제공**한다.

### 2단계: 프론트엔드 — 동료 모듈 신규 작성

- **파일**: `js/colleagues.js`
- **함수 목록**:

| 함수 | 역할 |
|------|------|
| `fetchColleagues()` | API 호출 → `state.colleagues`에 캐싱 |
| `updateLocalColleague()` | 본인 선택 변경 시 로컬 즉시 반영 |
| `getColleaguesForLecture(lectureId)` | 특정 강의를 선택한 동료 이름 배열 반환 (본인 분리, 가나다순) |
| `getColleaguesForSession(tabName)` | 특정 세션의 강의를 하나라도 선택한 동료 이름 배열 반환 |
| `renderColleagueLabels(lectureId)` | HTML 레이블 문자열 생성 (본인=파란색 맨 앞, 타인=회색 가나다순) |
| `startColleaguePolling()` | 1분 간격 자동 갱신 시작 |
| `stopColleaguePolling()` | 로그아웃 시 polling 정지 |

### 3단계: 뷰 파일 분리 (리팩토링)

현재 `views.js`(247줄)가 3개 뷰를 모두 담당하고 있어 비대하다. 다음과 같이 분리한다:

| 현재 | 분리 후 | 내용 |
|------|---------|------|
| `views.js` 전체 | `js/view-overview.js` | `renderOverview()`, `onOverviewRowClick()` |
| | `js/view-session.js` | `renderSession()`, `toggleLecture()` |
| | `js/view-mypage.js` | `renderMyPage()`, `switchMypageDay()`, `renderMyPageDay()`, `getOverlappingIds()`, `getOverviewSlots()`, `groupSelectionsBySlot()` |
| (삭제) | — | 기존 `views.js`는 분리 완료 후 제거 |

### 4단계: 뷰별 동료 레이블 삽입

#### 위치 1) Overview — Session 셀

- `renderOverview()`에서 Session 텍스트를 포함하는 `<td>` 생성 시, `formatSessionCell()` 결과 뒤에 줄바꿈 후 `renderColleagueLabels()` 호출 결과를 추가한다.
- `getColleaguesForSession(tabName)`으로 해당 세션의 수강자를 조회한다.

#### 위치 2) Session 상세 — Lecture Row

- `renderSession()`에서 각 `lecture-row` 내부, `lec-title` div 아래에 `renderColleagueLabels(item.id)` 결과를 삽입한다.

#### 위치 3) MyPage — 주제 셀

- `renderMyPageDay()`에서 주제 `<td>` 내부, 제목 텍스트 아래에 `renderColleagueLabels(lec.id)` 결과를 삽입한다.

### 5단계: CSS 추가

```css
/* 동료 레이블 컨테이너 */
.colleague-container { }

/* 동료 레이블 (타인) */
.colleague-badge { }

/* 본인 레이블 */
.colleague-badge.me { }
```

### 6단계: 기존 코드 수정

| 파일 | 수정 내용 |
|------|----------|
| `js/state.js` | `state.colleagues` 속성 추가, `initApp()`에서 `fetchColleagues()` 호출 |
| `js/view-session.js` | `toggleLecture()` 내에서 `updateLocalColleague()` 호출 추가 |
| `js/nav.js` | `showView()`에서 페이지 이동 시 `fetchColleagues()` 호출 추가 |
| `js/state.js` | `handleLogout()`에서 `stopColleaguePolling()` 호출 추가 |
| `index.html` | `<script>` 태그 업데이트 (분리된 파일 반영) |

---

## V. 최종 파일 구조

```
ane1235.github.io/
├── index.html
├── css/
│   └── style.css              ← colleague-badge 스타일 추가
├── js/
│   ├── config.js              ← 기존 유지
│   ├── data.js                ← 기존 유지
│   ├── utils.js               ← 기존 유지
│   ├── colleagues.js          ← 신규: 동료 데이터 모듈
│   ├── state.js               ← 수정: colleagues 상태 추가
│   ├── nav.js                 ← 수정: 페이지 이동 시 fetch
│   ├── view-overview.js       ← 신규 (views.js에서 분리)
│   ├── view-session.js        ← 신규 (views.js에서 분리)
│   └── view-mypage.js         ← 신규 (views.js에서 분리)
├── assets/
│   └── purmi_heart.png
└── claude_docs/
    └── colleague-labels-feature-plan.md  ← 본 문서
```

### Script 로드 순서

```html
<script src="js/config.js"></script>
<script src="js/data.js"></script>
<script src="js/utils.js"></script>
<script src="js/colleagues.js"></script>
<script src="js/state.js"></script>
<script src="js/nav.js"></script>
<script src="js/view-overview.js"></script>
<script src="js/view-session.js"></script>
<script src="js/view-mypage.js"></script>
```

---

## VI. 공정표

| 단계 | 작업 | 산출물 | 선후관계 |
|------|------|--------|----------|
| **1** | GAS `getColleagueSelections` action 코드 작성 | GAS 코드 스니펫 | — |
| **2** | `js/colleagues.js` 모듈 개발 | 신규 파일 | 1 완료 후 |
| **3** | `views.js` → 3개 뷰 파일 분리 (리팩토링) | 3개 신규 파일, 기존 삭제 | — (1과 병행 가능) |
| **4** | 3개 뷰에 동료 레이블 삽입 | 뷰 파일 수정 | 2, 3 완료 후 |
| **5** | CSS `.colleague-badge` 스타일 추가 | style.css 수정 | 4와 병행 가능 |
| **6** | `state.js`, `nav.js`, `index.html` 수정 | 기존 파일 수정 | 2, 3 완료 후 |
| **7** | 통합 테스트 및 디버깅 | 동작 검증 | 4, 5, 6 완료 후 |
| **8** | 사용자에게 GAS 코드 전달 및 등록 안내 | 문서 | 1 완료 후 |

```
단계1 ──────┐
            ├──→ 단계2 ──┐
단계3 ──────┤            ├──→ 단계4 ──┐
            │            │           ├──→ 단계7
            └──→ 단계6 ──┘  단계5 ──┘
단계8 (단계1 완료 시 즉시 전달 가능)
```

---

## VII. 확정 사항 요약

| 항목 | 결정 |
|------|------|
| 실시간 반영 방식 | Polling **1분 간격** |
| 본인 선택 변경 반영 | 로컬 즉시 반영 (0ms) |
| 타인 선택 변경 반영 | Polling으로 최대 60초 지연 |
| 레이블 정렬 | 본인(파란) 맨 앞 + 타인(회색) 가나다순 |
| 레이블 위치 | 제목/세션명 아래 줄바꿈 후 삽입 |
| 백엔드 수정 | GAS에 `getColleagueSelections` action 추가 (코드 제공) |
| 뷰 리팩토링 | `views.js` → 3개 파일 분리 |
| Push 방식 | GAS 단독으로 불가, 외부 서비스 도입은 과도하여 미채택 |
