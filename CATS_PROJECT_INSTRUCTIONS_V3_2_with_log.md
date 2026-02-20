# CATS APP 프로젝트 개발 지침서 V3.3

- **이 문서는 CATS APP 개발의 최상위 지침이다. 모든 코드 생성·설명·제안에 우선 적용된다.**
- 상충하는 상황이 발생하면 이 지침이 우선한다.
---

# section 0. 절대 규칙

## 0.1. 코드 생성 원칙
- AI 생성 코드 = **"한 번에 동작하는 완성형"**
   - placeholder(`// 여기에 로직 추가`), 생략(`...`), 부분 코드 → 절대 불가
   - "직접 수정하세요" 금지 → 수정된 전체 코드 재제시
   - 기술 용어 → 반드시 쉬운 비유 동반
- 코드 제시 절대 3원칙
   1. **코드 중간 생략 금지** — 첫 줄~마지막 줄 전체 출력. `// ... 기존 코드 유지` 절대 불가.
   2. **실제 복붙 실행 가능** — 복사→붙여넣기로 즉시 동작. 의사코드 절대 불가.
   3. **에러 사전 방지** — try-catch, null 체크, 기본값 설정 필수.
- 매 응답 자문 4가지
   1. 복사-붙여넣기만으로 동작하는가? → 아니면 제시 금지
   2. 코딩 경험 없는 의사가 이해 가능한가? → 아니면 재작성
   3. 화이트리스트 밖 리소스 포함? → 대안 먼저
   4. CONFIG 시트가 DB에 존재한다고 가정? → 동적 확인 추가

## 0.2. 대화 규칙
- 한 번에 하나의 파일 / 기능만 → 완성 후 다음
- 에러 → 메시지 그대로 복사하여 AI에게 전달
- 완성 코드 → Project에 첨부하여 맥락 유지

## 0.3. 답변 스타일 규칙

> AI의 모든 답변에 기본 적용. 코드 블록 내부는 예외.

1. **Numbering / Bulletin Style**
   - 순서가 있는 절차 → numbering (1, 2, 3)
   - 순서 없는 항목 나열 → bullet (-, •)
   - 한 응답 안에서 혼용 가능

2. **Cascade Style (계층 구조)**
   - 하위 항목은 반드시 들여쓰기로 계층 표현
   - 계층 표기: 1 → 1.a → 1.a.I 또는 1 → 1.1 → 1.1.1
   - 최대 3단계. 4단계 이상은 문장으로 풀어 쓴다.

3. **Explanatory Style (설명적 서술)**
   - 단답, 키워드 나열 금지. "왜 그런지", "무엇을 의미하는지" 문장으로 설명
   - 기술 용어 → 괄호 안에 쉬운 비유 또는 한줄 설명
   - 코드 제시 시 주요 단계마다 한글 주석으로 의도 설명

예외: 사용자가 "간단히", "한줄로", "목록만" 등 명시적으로 다른 형식을 요청하면 해당 요청 우선.

## 0.4. 프로토타이핑 교훈 (ANTS + CATS 현장 실증)

> **실전 검증된 규칙. 반드시 적용.**

   - 열 번호 하드코딩 금지 → `header.includes("참여자")` Partial Match 사용
   - 헤더에 특수문자 금지 → `&` 등은 문자열 비교 방해
   - UI 함수 try-catch 필수 → `SpreadsheetApp.getUi()`는 시트 열린 상태에서만 동작
   - isFixed 플래그 → 백엔드 `isFixed: true/false`로 프론트 UI 동적 제어
   - CONFIG 객체 → 시트 이름 상수 관리, 변경 시 Config.gs 한 곳만 수정
   - CONFIG-DB 동기화 필수 → 지침서 DB 구조 = "설계 계획" ≠ "현재 상태". `checkDBStructure()`로 점검
   - 버전 관리 → 변경마다 버전 부여, 변경사항 기록

## 0.5. 아키텍처 교훈 (Phase 2+5 현장 실증)

   - **iframe 내 Session 제한:** fetch API로 인증 요청 시 `Session.getActiveUser().getEmail()`이 빈 값 반환
   - **해결:** Apps Script가 HTML 직접 서빙 + `google.script.run`으로 백엔드 호출
   - **확정 아키텍처:**
     ```
     Google Sites → iframe → Apps Script (HTML 직접 서빙 + 백엔드 API)
                                ↓ google.script.run
                             백엔드 함수 → Google Sheets (DB)
     ```
   - `google.script.run` = "같은 건물 내선 전화" (Session 정상, CORS 불필요)
   - `fetch API` = "외부 전화" (Session 빈 값, CORS 필수) → **사용 금지**
   - `setXFrameOptionsMode(ALLOWALL)` → doGet()에서 HTML 반환 시 필수

## 0.6. 사전조사 기술 결정
   - **AppSheet 포기:** 19명 Starter $95/월 → Sites+GAS = 무료
   - **Stitch 포기:** 시험 후 결과 실망, 가공 과정 번거로워 배제
   - **배포:** "Execute as: Me" 필수. 수정 후 "새 버전" 배포 필수.
   - **onEdit 트리거:** CATS명단 수정 연 2~3회 → onEdit가 효율적

# section 0. 끝

====================================================================

## 1. 프로젝트 개요

- **정체성:** 사내 부서(약 20명)용 폐쇄형 프로젝트 관리 웹서비스. Google Sheets = 유일한 DB. 웹앱 = DB CRUD 도구.
- **사용자:** 약 20명 정적 집단(병원 진료 부서). 직급: RN/CN/HN/TL/Staff/COS. Guest 없음.
- **용어:** [업무]=하나의 project, [CATS Project]=본 웹 서비스, [CATS Client]=유일한 웹앱, [보고서]=조건 필터로 추출한 업무 목록+핵심 내용
- **목표:**
   - CATS Client → 개인별 사업 현황 실시간 파악, 업데이트 알림, 진행상황 한 눈에 확인
   - CATS Project DB → 사업 등록/업데이트/마감 처리 기록
   - 보고서 → Docs/Sheets/Slides 어느 형태로도 export 가능

---

## 2. 개발자 프로필 — 절대 전제

> **개발자 = 의사, 코딩 경험 거의 없음. AI = 사실상 개발자. 코드 완성도가 전부다.**

- **할 수 있는 것:** Google Workspace 중급 사용, AI 코드 복붙, 에러 메시지 전달, GitHub 업로드, Apps Script 배포
- **할 수 없는 것:** 코드 작성/수정/디버깅, CLI 사용, 프로그래밍 개념 사전 지식 없는 이해

---

## 3. 개발 방식 — No Skill No Coding Development

- 100% Vibe Coding: AI와 질문-답변 / 요청-확인 / 수락-거부 반복
- Claude Code, Codex, 터미널 도구 → **사용 안 함**
- **주력:** Claude Max — Artifacts 미리보기, Projects 맥락 유지
- **보조:** Gemini Pro — Google 생태계 특화, Sheets 수식

---

## 5. 시스템 아키텍처

### 5.1. 전체 구조 (확정)
```
[브라우저] → [Google Sites (접속 도메인)]
                ↓ iframe (Apps Script URL 삽입)
             [Apps Script Web App (HTML 서빙 + 백엔드 API)]
                ↓ google.script.run (프론트→백엔드 통신)
             [백엔드 .gs 함수들 (인증, CRUD 등)]
                ↓ 읽기/쓰기
             [Google Sheets (DB)]
                ↓ 참조/생성
             [Docs / Slides / Sheets (보고서)]

[GitHub Pages] → 정적 자산(이미지 등) 호스팅만 담당
```

### 5.2. 레이어 역할
- **Google Sites** — *.google.com 접속 도메인. iframe으로 Apps Script 웹앱 삽입.
- **Apps Script** — HTML 서빙 + 백엔드 API 겸용. `doGet()` → `HtmlService` → HTML 반환. `setXFrameOptionsMode(ALLOWALL)` 필수. "Execute as: Me" 배포.
- **GitHub Pages** — 이미지 등 정적 자산 호스팅. (UI 호스팅 역할 폐기됨)
- **Google Sheets** — 유일한 DB. **절대 변경 불가.**
- **Docs/Slides/Sheets** — `{{변수}}` 치환으로 보고서 자동 생성.

### 5.3. Two-Track
- **Track 1** — 웹앱 (입력/조회/수정) → Phase 1~8
- **Track 2** — 보고서 자동화 → Phase 9~10

---

## 6. 도메인 화이트리스트

> **최우선순위. 코드 작성·리소스 선택 시 반드시 먼저 확인.**

- **데스크탑:** 화이트리스트만 접속 가능 / **모바일:** 제한 없음
- 접속 가능: `*.google.com`, `*.github.io`, `github.com`(등록 예정), `claude.ai`(등록 예정), `*.chatgpt.com`, `cdn.tailwindcss.com`, `unpkg.com`, `cdnjs.cloudflare.com`, `fonts.googleapis.com`, `fonts.gstatic.com`
- 새 리소스 사용 전 → 화이트리스트 확인 필수. 미확인 시 GitHub Pages 직접 포함 우선.

---

## 7. 기술 스택

- **프론트엔드:** HTML5/CSS3/JS (Apps Script HTML 파일). Tailwind CSS(CDN), Google Fonts(Noto Sans KR), Material Icons(CDN). 이미지: GitHub Pages. `google.script.run`으로 백엔드 통신.
- **백엔드:** Apps Script (.gs). `doGet(e)` HTML 서빙 + JSON API 겸용. `HtmlService` + `setXFrameOptionsMode(ALLOWALL)`.
- **DB:** Google Sheets — 파일 ID: `19haREjuRIwlnAV-VeXLxK3whu2OZDD1Qnm-fDwqRbI8`
- **보고서:** Docs/Slides/Sheets 템플릿 복사 + `{{변수}}` 치환

---

## 8. 인증 구조

### 8.1. 흐름 (확정)
1. 사용자 → Google Sites 접속 → iframe으로 Apps Script 웹앱 로드
2. 페이지 로드 → `google.script.run.handleAuth()` 자동 호출
3. `handleAuth()` → `Session.getActiveUser().getEmail()` → CATS명단에서 이메일 확인
4. 멤버 → 환영 화면 → 메인 메뉴 / 비멤버 → "권한 없음" + 계정 전환 안내
5. 이메일 실패 → "로그인 해주세요" / 서버 오류 → "연결 오류" + 재시도

### 8.2. 인증 응답 형식
```json
{ "success": true, "data": { "authorized": true, "email": "...", "nickname": "...", "name": "...", "rank": "...", "status": "..." } }
{ "success": true, "data": { "authorized": false, "email": "..." } }
{ "success": false, "error": "오류 메시지" }
```

### 8.3. TODO
- LogOut / 계정변경 기능 추가 필요 (미구현, 추후 개발 예정)

---

## 9. 코딩 컨벤션

### 9.1. 파일 구조
```
Apps Script 프로젝트/
├── Config.gs          ← CONFIG 전역 상수
├── backend_core.gs    ← doGet() 라우터, generateNextSN(), padNumber()
├── AuthService.gs     ← 인증 (getCurrentUserEmail, checkMember, handleAuth)
├── Triggers.gs        ← onEdit 등 트리거
├── AdminTools.gs      ← 관리자 점검 (checkDBStructure 등)
├── login.html         ← 로그인/인증 (5개 상태)
└── (추후) main.html, project_list.html 등

GitHub Pages (kayen1978.github.io/CATS/)/
└── assets/purmi_heart.png

Google Sites → iframe으로 Apps Script 웹앱 URL 삽입
```

### 9.2. 핵심 규칙
- **함수 명명:** CRUD(`createProject`), 목록(`getProjectList`), 인증(`handleAuth`), 유틸(`generateNextSN`), 관리자(`checkDBStructure`)
- **에러 처리:** API 응답 `{success, data, error}` JSON. `google.script.run`은 `withSuccessHandler`+`withFailureHandler` 필수.
- **헤더 인식:** 열 번호 하드코딩 금지, `includes()` 느슨 매칭, 특수문자 금지
- **CONFIG-DB 동기화:** CONFIG 상수 사용. 시트 미존재 시 null 체크. DB 변경 후 `checkDBStructure()` 실행. **부록 DB 구조를 "현재 상태"로 가정 금지.**
- **HTML 작성:** Apps Script 내 `.html` 파일. `google.script.run` 사용(fetch 금지). `<style>`, `<script>` 인라인(별도 파일 분리 불가).

---

## 10. 배포 프로세스

### 10.1. 절차
1. Apps Script 에디터에서 코드 수정
2. "배포" → "배포 관리" → 연필(✏️) 아이콘 → "새 버전" 선택 → "배포"
3. ⚠️ **수정 후 반드시 "새 버전" 배포** — 이전 버전은 캐시됨

### 10.2. 설정 (고정)
- **실행 계정:** 나 (개발자) — "Execute as: Me"
- **액세스:** 모든 사용자

### 10.3. URL
- Apps Script 웹앱: `https://script.google.com/macros/s/AKfycbyVYcou173gpwgtVNlsDsnkH2sruyuZz9URSRTk1vSwtAIJb_4h5is_hqPjwRmdC_piGg/exec`
- Google Sites: `https://sites.google.com/view/catspms`
- GitHub Pages: `https://kayen1978.github.io/CATS/`
- GitHub 저장소: `https://github.com/kayen1978/CATS/`

---

# 부록 — 참고용이며 절대 지침이 아니다. 부록을 지침으로 오해하지 않도록 한다.

## 부록 1. 12단계 개발 로드맵

> **순차 실행. 이전 Phase 완성 후 다음 진행.**

| Phase | 내용 | 핵심 | 상태 |
|:---:|---|---|:---:|
| 0 | 컨텍스트 고정 | 이 지침서 자체 | ✅ |
| 1 | DB 구조 설계 | 5개 시트 설계·검증 | ✅ |
| 2 | 인증 API | Session → CATS명단 확인 → JSON | ✅ |
| 3 | DB 읽기 API | 사업들→JSON, 인증 필수 | 🔲 |
| 4 | DB 저장 API | doPost, SN 자동생성, timestamp | 🔲 |
| 5 | 로그인 체크 HTML | 5개 상태 화면 | ✅ |
| 6 | 메인 메뉴 HTML | 카드형 UI, 반응형 | 🔲 설계 필요 |
| 7 | 데이터 조회 | 테이블, 배지, 정렬/검색 | 🔲 |
| 8 | 데이터 입력 | 폼 검증, 드롭다운 | 🔲 |
| 9 | Docs 리포트 | 템플릿 치환, PDF | 🔲 |
| 10 | Slides 보고서 | 템플릿 기반 | 🔲 |
| 11 | 보안 강화 | 접근 로그, 파라미터 검증 | 🔲 |
| 12 | 배포 가이드 | 전체 배포 절차 정리 | 🔲 |

- Phase 이동 = 현재 Phase 동작 확인 후에만. AI는 이전 Phase 호환성 확인 필수.
- **다음 작업:** Phase 6 설계 → Phase 3 → Phase 4 순 진행 예정

## 부록 2. DB 구조 — CATS Project DB

> **아래는 "설계 계획". 코드는 반드시 실제 DB를 동적으로 확인할 것.**

파일 ID: `19haREjuRIwlnAV-VeXLxK3whu2OZDD1Qnm-fDwqRbI8`

### 사업들 (16열)
| 열 | 컬럼명 | 설명 |
|---|---|---|
| A | SN1 | 고유번호, A001~ 자동생성 |
| B | 사업명 | 전체 이름 |
| C | 사업약칭 | 약어 |
| D | 사업설명 | 상세 설명 |
| E | 진행상태 | 선택항목설정에서 불러옴 |
| F~I | 제안일/시작일/목표일/종료일 | yy/mm/dd(요일) |
| J | 책임자 | 단수, SN2(사번) 참조 |
| K | 참여자 | 복수, SN2(사번) 참조 |
| L | 부서및업체 | 복수, 부서및업체 시트 참조 |
| M | 진행상황 | 여러 줄 텍스트 |
| N | 참조 | Drive URL, 복수 가능 |
| O | 최종수정 | 수정자 별명 (overwrite) |
| P | 최종수정일시 | yy/mm/dd(요일) am/pm hh:mm |

### CATS명단 (9열)
| 열 | 컬럼명 | 설명 |
|---|---|---|
| A | SN2(사번) | 8자리 숫자, **서비스 전체 핵심 식별자** |
| B | 이름 | 실명 |
| C | 직급 | 선택항목설정에서 불러옴 |
| D | 계정 | Google 이메일, 인증에 사용 |
| E | 회사E-Mail | 회사업무용 주소 |
| F | 별명 | 표시용 이름 |
| G | 연락처 | 전화번호 |
| H | 내선번호 | 회사 내선 |
| I | 상태 | 선택항목설정에서 불러옴 |

### 부서및업체 (7열)
| 열 | 컬럼명 | 설명 |
|---|---|---|
| A | SN3 | 고유번호, B001~ 자동생성 |
| B | 약칭 | 명칭 줄임말 |
| C | 명칭 | 정식 명칭 |
| D | 분류 | 선택항목설정에서 불러옴 |
| E | 연락처 | 전화번호 |
| F | 업체담당자 | 이름 입력 |
| G | 책임자 | CATS명단 F열(별명) 자동 참조 |

### 경과기록 (5열)
| 열 | 컬럼명 | 설명 |
|---|---|---|
| A | SN4 | 고유번호, C0001~ 자동생성 |
| B | 사업ID | SN1 참조 |
| C | 수정by | CATS명단 F열(별명) dropdown 선택 |
| D | 수정일시 | yy/mm/dd(요일) am/pm hh:mm |
| E | 수정내용 | 텍스트 입력 |

### 선택항목설정 (3열)
| 열 | 컬럼명 | 설명 |
|---|---|---|
| A | 탭 | 대상 시트 이름 |
| B | 항목 | 드롭다운 적용 컬럼명 |
| C | 선택사항들 | 쉼표 구분 선택지 목록 |

**선택항목 시안:**

| 탭 | 항목 | 선택사항들 |
|---|---|---|
| 사업들 | 진행상태 | 제안 / 검토 / 시작 / 진행중 / 마무리 / 완료 / [보류] / [일시중단] / [취소] |
| CATS명단 | 직급 | RN / CN / HN / TL / Staff / CoS |
| CATS명단 | 상태 | 신규 / 근무중 / 휴직 / 퇴사 |
| 부서및업체 | 분류 | 병원부서 / 재단부서 / 납품업체 / 학회 / 유관기관 / 정부기관 |
| 경과기록 | 수정by | CATS명단 F열(별명) 자동 참조 |
| 선택항목설정 | 탭 | 사업들, CATS명단, 부서및업체, 경과기록, 선택항목설정 |

### 공통 규칙
- **SN:** 마지막 행 +1, GAS 백엔드에서만 생성
- **날짜:** `yy/mm/dd(요일)` / 수정일시: `yy/mm/dd(요일) am/pm hh:mm`
- **SN2(사번)** = 모든 사용자 필드의 식별 기준

---

## 부록 3. 구현 완료 항목

- **Config.gs** — CONFIG 전역 상수 + CONFIG_SHEET_NAMES 배열
- **backend_core.gs (V2.0)** — doGet(e) HTML/JSON 겸용 라우터, generateNextSN(), padNumber()
- **AuthService.gs (V1.0)** — getCurrentUserEmail(), checkMember(), handleAuth()
- **login.html** — 5개 상태(로딩/로그인/환영/거부/오류), google.script.run.handleAuth(), 모바일 반응형
- **AdminTools.gs** — checkDBStructure(), checkSheetHeaders(), checkDataSample()
- **배포:** Apps Script 웹앱 + Google Sites iframe + GitHub Pages 이미지 호스팅 완료

## 부록 4. 미완료 항목

- **즉시:** 대시보드(메인 메뉴) 설계 및 구현 (Phase 6)
- **추후:** LogOut/계정변경, 사업 상세보기, 경과기록 UI, 참여자 복수선택, 보고서 자동생성, 칸반보드, 보안강화, 알림, 멤버별 대시보드

## 부록 5. 참고 대화 로그

| # | AI × 주제 | 핵심 |
|---|---|---|
| 1 | Gemini × Sheets 코딩 | ARRAYFORMULA, 배열 충돌 |
| 2 | ChatGPT × 웹 크롤링 | IMPORTXML 나스닥 |
| 3 | Gemini × 칸반보드 | DB 설계, AppSheet vs Sites, Two-Track |
| 4 | Gemini × AI 추천 | 3사 종합, Gemini 자기 추천 |
| 5 | ChatGPT × AI 추천 | 자기 추천 → **Claude로 변경**. 12단계 프롬프트 |
| 6 | Claude × 설계 | 아키텍처 3안, CORS/OAuth, CDN, 3사 분석 |
| 7 | Gemini × ANTS | 버그 패턴 (헤더, 특수문자, UI 컨텍스트) |
| 8 | ChatGPT × Vibe Coding | No Skill No Coding 원칙 |
| 9 | ChatGPT × Agent 검토 | AI 서비스 교차 검증 |
| 10 | Claude × Phase 2+5 | 인증 API, 아키텍처 변경, Sites iframe 연결 |

## 부록 6. 버전 변경 이력

### V2.0 → V2.1
- 섹션 7: "5개 시트" 단정 → 설계 계획 명시, 동적 확인 추가
- CONFIG-DB 불일치 교훈, AdminTools.gs 추가

### V2.1 → V3.0
- 전체 bulletin style 압축 (약 51% 감소), 로드맵 테이블 통합, 부록 분리

### V3.0 → V3.1
- 아키텍처 확정 (Apps Script HTML 직접 서빙), 인증 흐름 확정, 배포 프로세스 정리, 구현 완료 현행화

### V3.1 → V3.2
- 섹션 0.3 신규: 답변 스타일 규칙 (Numbering/Bulletin, Cascade, Explanatory)
- DB 구조 업데이트: CATS명단 7→9열, 부서및업체 6→7열, 경과기록 SN3→SN4

### V3.2 → V3.3
- section 0 내부 구조 재편 (중복 해소: 0.0+3.4 통합, 0.1+0.2 분리 명확화)
- section 2(개발자 프로필)·3(개발 방식) 압축 (중복 제거, 핵심만 유지)
- section 5.3(이전 구조 비교) 삭제 (0.5에 교훈으로 통합 완료)
- section 7(기술 스택)·8(인증)·9(코딩 컨벤션) 압축
- 부록 번호 체계 통일 (부록 1~6)
- 전체 약 30% 분량 감소
