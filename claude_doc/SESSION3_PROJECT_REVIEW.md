# KSCTVA26 세션 3 — 프로젝트 분리 후 현황 리뷰

> **작성 시점:** 2026-03-10 세션 3 시작  
> **목적:** CATS APP에서 별도 프로젝트로 분리한 후, 전체 맥락을 재파악하고 현재 상태를 기록

---

## I. 프로젝트 분리 확인 완료 — 핵심 맥락 3개 대화 + 핸드오프 2건 모두 파악

프로젝트 내 전체 대화(3건)와 첨부된 핸드오프 리포트 2건을 리뷰한 결과를 보고한다.

---

## II. 프로젝트 타임라인 — V1.0에서 V3.0까지 3단계 진화

1. **대화 1 "표 데이터 교정":** KSCTVA 2026 프로그램 데이터를 Google Sheets 레퍼런스 기준으로 교정하여 8개 HTML 파일(overview + 7개 세션)을 생성한 초기 작업이다. 이 HTML은 정적 표 형태이며, 웹앱과는 별개의 산출물이다.
2. **대화 2 "강좌 선택 웹앱 개발" (세션 1):** Apps Script 백엔드 5개 파일 + 프론트엔드 SPA 6개 파일을 구축하여 V1.2까지 완성했다. 로그인, Overview, 세션 페이지, MyPage(중복 감지 포함), Google Sites 배포까지 마무리하고 HANDOFF_REPORT.md를 작성했다.
3. **대화 3 "GitHub Pages 업그레이드" (세션 2):** `google.script.run` → `fetch API` 전환(V2.0), 이스케이프 버그 해결을 위한 전체 재작성(V2.1), 파일 분리 + 데이터 하드코딩 리팩토링(V3.0)을 완료하고 HANDOFF_REPORT_SESSION2.md를 작성했다.

---

## III. 현재 상태 — 두 사이트 모두 정상 작동

| 항목 | 상태 | 설명 |
|---|---|---|
| **GitHub Pages** (ane1235.github.io) | ✅ 정상 | V3.0 최신 파일로 전부 업데이트 완료. main branch, index.html 정상 로딩 확인. |
| **Google Sites** (sites.google.com/view/ksctva26) | ✅ 접속 가능 | V1.2 Apps Script iframe 방식으로 동작 중. |
| **Google Sheets** (KSCTVA26) | ✅ 정상 | 10개 탭 모두 내장 MCP로 접근 확인 완료 (overview, ANE, Day1_A1\~P3, Day2_A1\~P2, Selections). |
| **Apps Script 웹앱** | ✅ 정상 추정 | Google Sites가 정상 작동하므로 백엔드도 정상으로 추정. |

---

## IV. V3.0 파일 구조 — 8개 파일 분리 + 데이터 하드코딩 완료

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

## V. 서버 호출 현황 — 3개만 남음 (getAllData 제거 완료)

| API 호출 | 방식 | 용도 |
|---|---|---|
| `?action=login&name=...&sn2=...` | GET | 이름+사번 → ANE 탭 대조 |
| `?action=getSelections&sn2=...` | GET | 사용자 강좌 선택 목록 조회 |
| `POST { action: saveSelections }` | POST (text/plain) | 강좌 선택 저장 |

- `getAllData()` 호출은 **완전 제거됨** — 프로그램 데이터는 `data.js`에 하드코딩 (= 변하지 않는 학회 프로그램이므로 서버 호출 불필요)
- Apps Script URL: `https://script.google.com/macros/s/AKfycbySQil2bfJ-Iicws05I7fFvbZbmmcSR1-BKjMlhg8i0pozBhJWo06b5h0p_DcIdaq3v/exec`

---

## VI. 계정 구조 — Google과 GitHub가 분리된 이유

| 용도 | 계정 | 연동 상태 |
|---|---|---|
| Google (시트, GCP, MCP, Drive, Sites) | kayen1978@gmail.com | Claude 내장 MCP 연동 ✅ |
| GitHub (ane1235 저장소, Pages 호스팅) | ane3401235@gmail.com | Claude MCP/Extension 미연동, **수동 push** |

- **이유:** Claude Extension과 MCP들이 kayen1978 계정에 연결되어 있어, Google Sheets DB 읽기/쓰기는 이 계정으로만 가능하다. GitHub은 개발 작업용 별도 계정(ane3401235)으로 운영하며, Claude와는 아직 연동하지 않았다.

---

## VII. 현재 환경 변화 — Claude Desktop → claude.ai 웹으로 전환

| 항목 | 이전 (세션 1~2) | 현재 (세션 3~) |
|---|---|---|
| Claude 인터페이스 | Desktop App (macOS) | claude.ai 웹 인터페이스 |
| Google Sheets MCP | xing5/mcp-google-sheets (Service Account) | Claude 내장 google-sheets MCP (kayen1978 직접 연동) |
| Sequential Thinking | ✅ 사용 가능 | ✅ 사용 가능 |
| Supermemory | ✅ 사용 가능 | ✅ 사용 가능 |
| xing5 MCP | ✅ Service Account 방식 | ❌ 사용 불가 (웹 환경) |
| 파일 생성/코드 실행 | ❌ 불가 | ✅ 컴퓨터 도구 사용 가능 |

- **핵심:** xing5 MCP는 없지만, 내장 google-sheets MCP로 동일한 시트 접근이 가능하므로 개발 작업에 지장 없다. 오히려 파일 생성·코드 실행이 가능해져서 작업 범위가 넓어졌다.

---

## VIII. 두 접속 경로 비교 — 별개 시스템으로 병행 운영 중

| 사이트 | URL | 버전 | 통신 방식 | 데이터 소스 |
|---|---|---|---|---|
| **GitHub Pages** | `https://ane1235.github.io/` | V3.0 | fetch API → Apps Script | `data.js` 하드코딩 + 서버 3호출 |
| **Google Sites** | `https://sites.google.com/view/ksctva26` | V1.2 | google.script.run | `getAllData()` 포함 서버 4호출 |

- 두 사이트는 **완전히 별개 시스템**이다. 한쪽 수정이 다른 쪽에 반영되지 않는다.
- Google Sites에 GitHub Pages URL을 iframe으로 삽입하면 단일 접속 경로로 통합 가능하나, 아직 미실행이다.

---

## IX. 확정된 설계 결정 (변경 금지)

1. **강좌 선택 저장:** Google Sheet `Selections` 탭 (서버 저장, 기기 이동 유지)
2. **Session 8 (초록발표):** overview에만 표시, 세션 페이지/MyPage 선택 대상 제외
3. **강좌 ID 체계:** `탭이름_R행번호` (예: `Day1_A1_R4`), `lastIndexOf("_R")` 파싱
4. **중복 감지:** 반개구간 방식 (끝 시간 = 시작 시간은 겹치지 않음으로 처리)
5. **HTML 파일 분리 구조 유지** (수정 효율성)
6. **데이터 하드코딩:** `data.js`의 2D 배열 인덱스가 Google Sheets 행 인덱스와 동일 → Selections 탭 데이터 100% 호환

---

## X. 미완료 작업 — 세션 2 보고서 기준 3개 항목

### 즉시 가능

- [ ] Google Sites iframe URL을 GitHub Pages URL로 변경하여 통합 검토
- [ ] 추가 디자인 수정 (사용자 피드백 기반)
- [ ] 모바일 반응형 세부 조정

### 추후

- [ ] Google Sites iframe 통합 시 로그인 흐름 검증
- [ ] 기타 기능 추가 (사용자 요청에 따라)

---

## XI. 핵심 리소스 요약

| 리소스 | 값 |
|---|---|
| 스프레드시트 ID | `12KeGjyFvpZ6cSkKsuMrxmCBpBTBRzY3p21xQc5gtOBI` |
| Apps Script 웹앱 URL | `https://script.google.com/macros/s/AKfycbySQil2bfJ-Iicws05I7fFvbZbmmcSR1-BKjMlhg8i0pozBhJWo06b5h0p_DcIdaq3v/exec` |
| GitHub Pages | `https://ane1235.github.io/` |
| GitHub 저장소 | `https://github.com/ane1235/ane1235.github.io` |
| Google Sites | `https://sites.google.com/view/ksctva26` |
| Google 계정 | kayen1978@gmail.com |
| GitHub 계정 | ane3401235@gmail.com |

---

## XII. Analyst Note

> 프로젝트가 CATS APP에서 분리됨에 따라 컨텍스트 전달 비용이 발생했으나, 핸드오프 리포트 2건과 Supermemory가 이 비용을 효과적으로 상쇄했다. V3.0의 데이터 하드코딩 전략은 학회 프로그램이 확정된 후 변경될 일이 없다는 도메인 특성을 정확히 반영한 설계이며, 서버 호출을 4→3개로 줄여 로딩 성능과 코드 복잡도를 동시에 개선했다. 다음 단계에서 가장 큰 의사결정 포인트는 Google Sites iframe 통합 여부인데, 이는 병원 네트워크 환경에서의 접근 편의성과 유지보수 단일화라는 두 가지 이점을 제공하므로 우선 검토할 가치가 있다.
