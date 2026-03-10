# KSCTVA26 세션 2 인수인계 보고서
> **작성 시점:** 2026-03-10 세션 2 종료
> **목적:** 다음 대화 세션에서 작업을 이어가기 위한 전체 맥락 인수인계

---

## 1. 이번 세션에서 수행한 작업

### 1-1. GitHub Pages 직접 호스팅 전환 (V1.2 → V2.0)
- **배경:** 기존 Apps Script HTML 서빙 → GitHub Pages에서 HTML 서빙으로 전환
- **가능한 이유:** KSCTVA26은 Session.getActiveUser()가 아닌 이름+사번 인증이므로 fetch API 전환에 인증 문제 없음
- **백엔드 변경:** `backend_core.gs` V2.0 — doGet에 JSON API 모드(?action=xxx) 추가, doPost 신규
- **프론트엔드 변경:** `google.script.run` 4곳 → `callApi()` / `callApiPost()` (fetch API) 전환
- **CORS 전략:** GET은 Simple Request 자동 통과, POST는 Content-Type: text/plain으로 preflight 회피

### 1-2. V2.1 완전 재작성 (이스케이프 문제 해결)
- **문제:** V2.0은 Apps Script 래퍼에서 HTML 추출(curl → hex decode → JSON parse → unescape) 방식으로 생성 → 정규식, 싱글쿼트, 유니코드에 잔류 이스케이프 발생 → renderOverview is not defined 에러
- **해결:** 추출 코드 전면 폐기, 1016줄 전체를 처음부터 직접 작성
- **결과:** V2.1 정상 동작 확인

### 1-3. Overview 디자인 수정 6개항
| # | 수정 내용 | 처리 방식 |
|:---:|---|---|
| 1 | 헤더 Room만 표시 (Day/날짜 제거) | `extractRoomName()` 함수 |
| 2 | 시간/Room 헤더 가운데 정렬 | CSS `th { text-align: center }` |
| 3 | 총회·런천·휴식·폐회 가운데 정렬 | `isEventCenter()` + CSS `.event-center td`, `.break-row td` |
| 4 | Session ## 굵게+색상 강조 | `formatSessionCell()` → `<span class="session-num">` + CSS |
| 5 | 공통세션 가운데 정렬 | `session-common` 클래스 + CSS |
| 6 | 컬럼 폭 균등 고정 | `<colgroup> 15%/42.5%/42.5%` + `table-layout: fixed` |

### 1-4. V3.0 파일 분리 + 데이터 하드코딩 리팩토링
- **동기:** 1016줄 단일 HTML → 수정 비효율, AI 대화 컨텍스트 소모
- **핵심 원칙:** Google Sheets 텍스트는 변할 일 없으므로 HTML/JS에 직접 하드코딩
- **결과:** `getAllData()` 서버 호출 완전 제거 → 로딩 속도 극적 향상

---

## 2. 현재 파일 구조 (V3.0, GitHub Pages 배포 완료)

```
ane1235.github.io/
├── index.html          ← 86줄, HTML 뼈대 + CSS/JS 참조
├── css/
│   └── style.css       ← 171줄, 전체 CSS
├── js/
│   ├── config.js       ← 3줄, API_URL 상수
│   ├── data.js         ← 670줄, 전체 프로그램 데이터 하드코딩
│   ├── utils.js        ← 182줄, 유틸리티 함수
│   ├── state.js        ← 98줄, 로그인·선택 조회/저장
│   ├── nav.js          ← 63줄, 드롭다운·뷰 라우터
│   └── views.js        ← 217줄, Overview·Session·MyPage 렌더링
└── assets/
    └── purmi_heart.png ← 로고
```

### JS 로드 순서 (index.html 내)
```
config.js → data.js → utils.js → state.js → nav.js → views.js
```

---

## 3. 현재 서버 호출 (3개만)

| API 호출 | 방식 | 용도 |
|---|---|---|
| `?action=login&name=...&sn2=...` | GET | 이름+사번 → ANE 탭 대조 |
| `?action=getSelections&sn2=...` | GET | 사용자 강좌 선택 목록 조회 |
| `POST { action: saveSelections }` | POST (text/plain) | 강좌 선택 저장 |

- `getAllData()` 호출은 **완전 제거됨** — 프로그램 데이터는 data.js에 하드코딩
- Apps Script URL: `https://script.google.com/macros/s/AKfycbySQil2bfJ-Iicws05I7fFvbZbmmcSR1-BKjMlhg8i0pozBhJWo06b5h0p_DcIdaq3v/exec`

---

## 4. 두 접속 경로 현황

| 사이트 | URL | 버전 | 상태 |
|---|---|---|---|
| **GitHub Pages** | `https://ane1235.github.io/` | V3.0 | ✅ 정상 작동 확인 |
| **Google Sites** | `https://sites.google.com/view/ksctva26` | V1.2 | Apps Script iframe (이전 버전) |

- GitHub Pages: 파일 분리 + 데이터 하드코딩 + 디자인 수정 반영
- Google Sites: Apps Script가 HTML 직접 서빙 + google.script.run 통신 (변경 없음)
- 두 사이트는 **완전히 별개 시스템**

---

## 5. Apps Script 파일 현황

### 백엔드 (.gs) — 변경된 파일
| 파일 | 버전 | 변경 내용 |
|---|---|---|
| **backend_core.gs** | V2.0 | doGet에 JSON API 모드 추가, doPost 신규 |

### 변경 없는 파일
| 파일 | 역할 |
|---|---|
| Config.gs | 전역 상수, 시트ID, 탭이름, 메뉴매핑 |
| AuthService.gs | handleLogin(name, sn2) |
| DataService.gs | getAllData() — GitHub Pages에서는 미사용, Google Sites에서만 사용 |
| SelectionService.gs | getSelections(sn2), saveSelections(sn2, arr) |

### 프론트엔드 (.html) — Apps Script 내 (Google Sites용, 변경 없음)
- index.html, style.html, script_utils.html, script_state.html, script_nav.html, script_views.html

---

## 6. 강좌 ID 체계 (V1.2 ~ V3.0 공통, 호환 유지)
- 형식: `탭이름_R행번호` (예: `Day1_A1_R4`)
- 파싱: `lastIndexOf("_R")` 앞 = 탭이름, 뒤 = 행 인덱스 (0-based)
- data.js의 2D 배열 인덱스가 Google Sheets 행 인덱스와 동일 → Selections 탭 데이터 100% 호환

---

## 7. 이번 세션에서 배운 교훈

1. **Apps Script 래퍼에서 HTML을 추출하면 이스케이프 지옥에 빠진다** — curl로 가져온 코드를 패치하지 말고 처음부터 새로 작성하라
2. **GitHub Pages 배포 딜레이** — commit 후 1~2분 대기 필요. 즉시 접속하면 이전 버전이 보임
3. **Google Sites와 GitHub Pages는 별개 시스템** — 한쪽 수정이 다른 쪽에 반영되지 않음
4. **변하지 않는 데이터는 하드코딩이 최적** — 서버 호출 제거 → 로딩 속도 향상, 코드 단순화

---

## 8. 다음 작업 (미완료)

### 즉시 가능
- [ ] Google Sites iframe URL을 GitHub Pages URL로 변경하여 통합 검토
- [ ] 추가 디자인 수정 (사용자 피드백 기반)
- [ ] 모바일 반응형 세부 조정

### 추후
- [ ] Google Sites iframe 통합 시 로그인 흐름 검증
- [ ] 기타 기능 추가 (사용자 요청에 따라)

---

## 9. 핵심 리소스 (세션 1 보고서에서 유지)

| 리소스 | 값 |
|---|---|
| 스프레드시트 ID | `12KeGjyFvpZ6cSkKsuMrxmCBpBTBRzY3p21xQc5gtOBI` |
| Apps Script 웹앱 URL | `https://script.google.com/macros/s/AKfycbySQil2bfJ-Iicws05I7fFvbZbmmcSR1-BKjMlhg8i0pozBhJWo06b5h0p_DcIdaq3v/exec` |
| GitHub Pages | `https://ane1235.github.io/` |
| GitHub 저장소 | `https://github.com/ane1235/ane1235.github.io` |
| Google Sites | `https://sites.google.com/view/ksctva26` |
| 계정 | kayen1978@gmail.com |
