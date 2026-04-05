# Handoff Note — ane1235.github.io 사이트 구조 재편
**작성일**: 2026-04-05  
**세션 주제**: 사이트 구조 재편 (루트 리디렉트 / sheets 홈 / ksctva 서브디렉토리 분리)  
**최종 커밋**: `e5d0e7e` (푸르미 로고 크기 조정)

---

## I. 작업 개요

ane1235.github.io를 단일 KSCTVA 학술대회 페이지에서  
**다중 콘텐츠 대시보드 사이트**로 전환하는 구조 재편 작업.

---

## II. 완료된 변경사항

### 1. 루트 리디렉트 (`/index.html`)

- 루트(`/`) 접속 시 `/sheets/`로 자동 이동
- `meta http-equiv="refresh"` + `location.replace()` 이중 구현

```html
<meta http-equiv="refresh" content="0;url=/sheets/">
<script>location.replace('/sheets/');</script>
```

---

### 2. KSCTVA 학술대회 앱 이동 (`/ksctva/`)

- 기존 루트에 있던 KSCTVA 2026 앱 전체를 `/ksctva/` 서브디렉토리로 이동
- 경로 구성: `ksctva/index.html`, `ksctva/js/`, `ksctva/css/`, `ksctva/assets/`
- 홈/오늘일정 버튼은 `/sheets/`로 링크

---

### 3. Sheets 홈 페이지 (`/sheets/`)

#### 3-1. 네비게이션 바 구조 (홈/오늘일정/심폐마취학회2026/Logout)

| 항목 | 동작 |
|------|------|
| 홈 | 현재 페이지 (active 스타일) |
| 오늘일정(공사중) | `/sheets/` 링크 (공사중 표시) |
| 심폐마취학회2026 | 드롭다운 → `/ksctva/` 링크들 |
| Logout | `handleLogout()` 호출 |

- `sheets/js/nav.js` 신규 생성 — 드롭다운/서브메뉴 토글 로직
- 드롭다운: 데스크탑(≥769px) CSS hover + 모바일 JS 클릭 하이브리드

#### 3-2. 로그인 화면 변경

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 배경 테마 | 녹색 (KSCTVA) | 파란색 (부천세종병원) |
| 로고 | `table_chart` Material Icon | purmi_heart.png 이미지 |
| 로고 경로 | — | `/ksctva/assets/purmi_heart.png` |
| 제목 | KSCTVA 2026 | ane1235 |
| 부제목 | 춘계 학술대회 프로그램 | Assign, 심폐마취학회 2026 |
| 추가 문구 | — | 공사중. 공지없이 수시 변경 가능 |
| 빌드 번호 | — | build 260405.01 |
| 배경 애니메이션 | grid-line / gridPulse | ecg-line / ecgMove |

#### 3-3. 푸르미 로고 크기 규칙

- **데스크탑**: `width: 200px; height: auto; aspect-ratio: 1536 / 2197`
- **모바일 (≤768px)**: `width: calc(90vw * 2 / 3); max-width: 253px`
  - 로그인 박스 폭(90vw)의 2/3에 해당
  - max-width는 데스크탑 박스 max-width(380px)의 2/3 = 253px
- 원본 이미지 크기: 1536 × 2197 px → `aspect-ratio`로 비율 고정

---

## III. 파일 구조 (변경된 파일)

```
ane1235.github.io/
├── index.html                    ← 루트 리디렉트 (/sheets/로)
├── ksctva/                       ← KSCTVA 학술대회 앱 (이동됨)
│   ├── index.html
│   ├── js/ (config, data, utils, colleagues, state, nav, view-*.js)
│   ├── css/style.css
│   └── assets/purmi_heart.png
└── sheets/                       ← 근무 대시보드 홈
    ├── index.html                ← 네비게이션 + 로그인 화면 개편
    ├── js/
    │   ├── nav.js                ← 신규 생성 (드롭다운 로직)
    │   ├── config.js
    │   ├── utils.js
    │   ├── state.js
    │   ├── calendar.js
    │   └── app.js
    └── css/style.css             ← 파란색 테마 + logo-img + ecg-line
```

---

## IV. CSS 주요 클래스 (sheets/css/style.css)

| 클래스 | 용도 |
|--------|------|
| `.login-bg` | 파란색 그라디언트 배경 |
| `.ecg-line` | ECG 선 애니메이션 (로그인 배경) |
| `.logo-img` | 푸르미 로고 크기·비율 제어 |
| `.nav-bordered` | 네비게이션 일반 항목 |
| `.nav-wip` | 공사중 항목 (회색 스타일) |
| `.dropdown-menu` | 드롭다운 컨테이너 |
| `.submenu` | 서브메뉴 컨테이너 |
| `.has-submenu` | 서브메뉴 부모 항목 |

---

## V. 로그인 세션 공유 구조

- `/sheets/`와 `/ksctva/` 모두 `localStorage`를 통해 로그인 세션 공유
- 동일 도메인(ane1235.github.io)이므로 별도 처리 불필요

---

## VI. 다음 세션 예정 작업

- 현재 없음. 모든 요청사항 완료 및 GitHub 푸시 완료.
- 추후 `/sheets/` 오늘일정(공사중) 기능 개발 시 이 파일을 참조할 것.

---

## VII. 커밋 이력 (이번 세션)

| 커밋 해시 | 내용 |
|-----------|------|
| 초기 커밋들 | 루트 리디렉트, ksctva 이동, sheets 네비 구조 |
| `75b8b62` | 파란색 부천세종 테마 복원 + purmi 로고 |
| `e5d0e7e` | 푸르미 로고 크기 조정 (데스크탑 200px, 모바일 2/3) |
