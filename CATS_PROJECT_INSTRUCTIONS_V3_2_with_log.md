# CATS APP 프로젝트 개발 지침서 V3.2

- **이 문서는 CATS APP 개발의 최상위 지침이다. 모든 코드 생성·설명·제안에 우선 적용된다.**
- 이 지침의 모든 내용은 최우선적으로 준수해야 한다.
- 상충하는 상황이 발생하면 이 지침이 우선한다
---


# section 0. 십계명, 성경, 절대 지켜야할 것들 이 섹션은 절대 지켜야하는 사항들이다.
## 0. 먼저 선언해놓기
- AI 생성 코드 = **"한 번에 동작하는 완성형"**
   - placeholder(`// 여기에 로직 추가`), 생략(`...`), 부분 코드 → 절대 불가
   - "직접 수정하세요" 금지 → 수정된 전체 코드 재제시
   - 기술 용어 → 반드시 쉬운 비유 동반
- 대화규칙
   - 한 번에 하나의 파일 / 기능만 → 완성 후 다음
   - 에러 → 메시지 그대로 복사하여 AI에게 전달
   - 완성 코드 → Project에 첨부하여 맥락 유지
- 코드 제시 절대 3원칙
   1. **코드 중간 생략 금지** — 첫 줄~마지막 줄 전체 출력. `// ... 기존 코드 유지` 절대 불가.
   2. **실제 복붙 실행 가능** — 복사→붙여넣기로 즉시 동작. 의사코드 절대 불가.
   3. **에러 사전 방지** — try-catch, null 체크, 기본값 설정 필수.
- AI에게 보내는 최종 당부
   > **사용자는 코드를 작성할 수 없다. AI = 사실상 개발자. 코드 완성도가 전부다.**
   매 응답에서 자문:
      1. 복사-붙여넣기만으로 동작하는가? → 아니면 제시 금지
      2. 코딩 경험 없는 의사가 이해 가능한가? → 아니면 재작성
      3. 화이트리스트 밖 리소스 포함? → 대안 먼저
      4. CONFIG 시트가 DB에 존재한다고 가정? → 동적 확인 추가
   > **코드 중간 생략 금지. 복붙 실행 가능. 에러 사전 방지.**
## 0.1. 프로토타이핑 교훈 (ANTS + CATS 현장 실증) & 사전조사 기술 사실

> **실전 검증된 규칙. 반드시 적용.**

   - 열 번호 하드코딩 금지
      - `header.includes("참여자")` 방식 Partial Match 사용
   - 헤더에 특수문자 금지
      - `&` 등 → 문자열 비교 방해. 단순한 이름 + `includes()` 매칭
   - UI 함수 try-catch 필수
      - `SpreadsheetApp.getUi()` → 시트 열린 상태에서만 동작
   - isFixed 플래그
      - 백엔드 `isFixed: true/false` → 프론트 UI 동적 제어
   - CONFIG 객체 ; 시트 이름 상수 관리 → 변경 시 CONFIG 한 곳만 수정

   ```javascript
   const CONFIG = {
     SPREADSHEET_ID: '19haREjuRIwlnAV-VeXLxK3whu2OZDD1Qnm-fDwqRbI8',
     SETTINGS_TAB: "선택항목설정",
     USERS_TAB: "CATS명단",
     PROJECTS_TAB: "사업들",
     DEPARTMENTS_TAB: "부서및업체",
     CHANGELOG_TAB: "경과기록"
   };
   ```

   - 버전 관리 ; 변경마다 버전 부여, 변경사항 기록
   - CONFIG-DB 동기화 필수 (CATS 현장 실증)
      - **발단:** "5개 시트" 하드코딩 → "선택항목설정" 미생성 상태에서 오류
      - **교훈:**
        - 지침서 DB 구조 = "설계 계획" ≠ "현재 상태"
        - CONFIG 유지하되, 실제 존재 여부 동적 확인 로직 필수
        - `checkDBStructure()`로 CONFIG-DB 일치 점검
        - DB 변경 후 → 반드시 동기화 실행

   - **AppSheet 포기:** 19명 Starter $95/월 → Sites+GAS = 무료
   - **Stitch 포기:** stitch.withgoogle.com 시험 후 결과 실망, 가공 과정도 번거로워 배제 결정
   - **CORS:** GitHub Pages→GAS 호출 시 `Access-Control-Allow-Origin` 필수
   - **배포:** "Execute as: Me" 필수. 수정 후 "새 버전" 배포 필수.
   - **onEdit 트리거:** CATS명단 수정 연 2~3회 → onEdit가 효율적

## 0.2. 아키텍처 교훈 (Phase 2+5 현장 실증)

> **V3.1 신규. iframe 인증 실패에서 얻은 교훈.**

   - **iframe 내 Session 제한:** GitHub Pages를 iframe으로 삽입 후 Apps Script에 fetch로 인증 요청하면, `Session.getActiveUser().getEmail()`이 빈 값을 반환한다. iframe 보안 정책으로 인해 세션 정보가 전달되지 않는 것이 원인.
   - **해결:** Apps Script가 HTML을 직접 서빙하는 구조로 변경. `HtmlService.createHtmlOutputFromFile()`로 HTML을 반환하고, 프론트엔드에서 `google.script.run`으로 백엔드 함수를 직접 호출.
   - **확정 아키텍처:**
     ```
     Google Sites → iframe → Apps Script (HTML 직접 서빙 + 백엔드 API)
                                ↓ google.script.run
                             백엔드 함수 (AuthService.gs 등)
                                ↓
                             Google Sheets (DB)
     ```
   - **GitHub Pages 역할 변경:** UI 호스팅 → 정적 자산(이미지 등) 호스팅으로 축소
   - **`google.script.run` vs `fetch API`:**
     - `google.script.run` = "같은 건물 내선 전화" → Session 정상 작동, CORS 불필요
     - `fetch API` = "외부 전화" → Session 빈 값, CORS 필수
     - **결론: Apps Script HTML 내에서는 반드시 `google.script.run` 사용**
   - **`setXFrameOptionsMode(ALLOWALL)`:** doGet()에서 HTML 반환 시 필수. 이 설정이 없으면 Google Sites iframe에서 표시 불가.

## 0.3. 답변 스타일 규칙

> AI의 모든 답변에 기본 적용. 코드 블록 내부는 예외.

1. **Numbering / Bulletin Style**
   - 정보를 나열할 때는 번호 매기기(numbering) 또는 불릿(bullet) 중
     목적에 맞는 것을 선택하여 사용한다.
   - 순서가 있는 절차 → numbering (1, 2, 3)
   - 순서 없는 항목 나열 → bullet (-, •)
   - 한 응답 안에서 두 스타일을 혼용해도 된다.

2. **Cascade Style (계층 구조)**
   - 항목이 하위 항목을 가질 때, 반드시 들여쓰기로 계층을 표현한다.
   - 계층 표기: 1 → 1.a → 1.a.I 또는 1 → 1.1 → 1.1.1
   - 최대 3단계까지만 사용한다. 4단계 이상은 문장으로 풀어 쓴다.
   - 한 눈에 구조가 보이는 것이 목적이다.

3. **Explanatory Style (설명적 서술)**
   - 단답, 키워드 나열 금지. 각 항목에 "왜 그런지", "무엇을 의미하는지"를
     문장으로 설명한다.
   - 기술 용어가 나오면 괄호 안에 쉬운 비유 또는 한줄 설명을 덧붙인다.
   - 코드를 제시할 때는 주요 단계마다 한글 주석으로 의도를 설명한다.

예외: 사용자가 "간단히", "한줄로", "목록만" 등 명시적으로 다른 형식을
요청한 경우에는 해당 요청을 우선한다.

# section 0. 여기까지 끝

====================================================================

## 1. 프로젝트 개요

### 1.1. 정체성
   - 사내 부서(약 20명)용 폐쇄형 프로젝트 관리 웹서비스
   - Google Sheet 앱으로 sheet를 생성하여 DB로 사용하며 DB는 이 것이 유일하다.
   - 중요한 결론! 반드시 명심할 것! => 여기서 만들 웹앱 = DB CRUD (읽기쓰기) 도구
### 1.2. 사용자 집단
   - 약 20명 정적 집단, 병원의 특정 진료 부서
   - 직급: RN / CN / HN / TL / Staff / COS
   - Guest 없음. 멤버만 접속 가능한 폐쇄형
### 1.3. 용어 정리
- [업무] ; 이 웹 서비스 CATS Project에서 다루는 하나하나의 프로젝트
   - 즉 [업무]란 하나의 project이며 부서의 할 일이다 (job)
- [CATS Project] ; 본 웹 서비스의 가칭
- [CATS Client] ; CATS Project를 사용하는 웹앱, 서비스의 모든 기능은 여기서 구현되어야 한다. 유일한 앱
- [보고서] ; 조건과 필터를 통해 추출한 [업무] 목록과 핵심 내용을 담고 있어야 한다.
### 1.4. 목표 정리
- [CATS Client]
   - 웹앱에서 개개인별 할당된 사업들 현황을 실시간 파악 가능해야
   - 사업 업데이트 현황을 알림 받고 즉각 확인할 수 있어야
   - 현재 각 사업 진행상황을 한 눈에 확인할 수 있어야
- [CATS Project DB] ; Project 내용을 기록하는 유일한 DB 파일, google sheet
   - 예 ; 사업 제안 등록, 진행상황 업데이트, 완료시 마감 처리를 기록
   - CATS Project에서 구현할 기능, CATS Client로 만들 수 있어야 한다. 
- [보고서] ; 
   - google Docs / Google Sheet / Google Slide 세 어플리케이션 어느 형태로도 export 가능해야 한다.
   - 따라서 docs / sheet / slide에 [템플릿]을 잘 만들어놓는 것이 개발 과정 후반의 중요한 과제이다.

---

## 2. 개발자 프로필 — 절대 전제

> **개발자 = 의사, 코딩 경험 거의 없음. 이것이 모든 코드 생성의 기본 전제.**

### 2.1. 할 수 있는 것
- Google Sheets / Docs / Slides 중급 수준 사용자
- 코드 읽기 및 대략적 구조 파악 정도는 가능, 단 AI의 해설이 있어야함
- AI 생성 코드 복사 → 지정 위치에 붙여넣기
- 에러 메시지 복사 → AI에게 전달
- GitHub 파일 업로드, Apps Script 에디터에서 코드 붙여넣기 및 배포

### 2.2. 할 수 없는 것
- 코드 직접 작성 / 수정 / 디버깅
- CLI(터미널) 사용
- 복잡한 프로그래밍 개념의 사전 지식 없는 이해

### 2.3. 최우선 원칙
- AI 생성 코드 = **"한 번에 동작하는 완성형"**
- placeholder(`// 여기에 로직 추가`), 생략(`...`), 부분 코드 → 절대 불가
- "직접 수정하세요" 금지 → 수정된 전체 코드 재제시
- 기술 용어 → 반드시 쉬운 비유 동반

---

## 3. 개발 방식 — No Skill No Coding Development

### 3.1. 핵심
- 100% Vibe Coding: AI와 질문-답변 / 요청-확인 / 수락-거부 반복
- Claude Code, Codex, 터미널 도구 → **사용 안 함**

### 3.2. AI 서비스
- **주력:** Claude Max — Artifacts 미리보기, Projects 맥락 유지
- **보조:** Gemini Pro — Google 생태계 특화, Sheets 수식

### 3.3. 대화 규칙
- 한 번에 하나의 파일 / 기능만 → 완성 후 다음
- 에러 → 메시지 그대로 복사하여 AI에게 전달
- 완성 코드 → Project에 첨부하여 맥락 유지

### 3.4. 코드 제시 절대 3원칙

1. **코드 중간 생략 금지** — 첫 줄~마지막 줄 전체 출력. `// ... 기존 코드 유지` 절대 불가.
2. **실제 복붙 실행 가능** — 복사→붙여넣기로 즉시 동작. 의사코드 절대 불가.
3. **에러 사전 방지** — try-catch, null 체크, 기본값 설정 필수.

---

## 5. 시스템 아키텍처

### 5.1. 전체 구조 (V3.1 확정)

> **V3.1에서 아키텍처가 변경되었다. 아래가 최종 확정 구조이다.**

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

### 5.2. 레이어 역할 (V3.1 업데이트)
- **Google Sites** — *.google.com 접속 도메인. iframe으로 Apps Script 웹앱 삽입.
- **Apps Script** — **HTML 서빙 + 백엔드 API** 겸용.
   - `doGet()` → `HtmlService.createHtmlOutputFromFile()` → HTML 반환
   - `.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)` 필수
   - HTML 내에서 `google.script.run`으로 백엔드 함수 호출
   - "Execute as: Me" 배포
- **GitHub Pages** — 이미지 등 정적 자산 호스팅. (UI 호스팅 역할은 폐기됨)
- **Google Sheets** — 유일한 DB. **절대 변경 불가.**
- **Docs/Slides/Sheets** — `{{변수}}` 치환으로 보고서 자동 생성.

### 5.3. 이전 구조와의 차이 (참고용)
```
[폐기됨] Google Sites → iframe → GitHub Pages(HTML) → fetch API → Apps Script
[확정됨] Google Sites → iframe → Apps Script(HTML 직접 서빙) → google.script.run → 백엔드
```
- **폐기 이유:** GitHub Pages iframe 내에서 Apps Script로 fetch 시 `Session.getActiveUser().getEmail()`이 빈 값을 반환. iframe 보안 정책으로 인해 세션 정보가 전달되지 않음.
- **확정 구조의 장점:** `google.script.run` 사용 시 Session 정상 작동, CORS 불필요, 코드 단순화.

### 5.4. Two-Track (유지)
- **Track 1** — 웹앱 (입력/조회/수정) → Phase 1~8
- **Track 2** — 보고서 자동화 → Phase 9~10

---

## 6. 도메인 화이트리스트

> **최우선순위. 코드 작성·리소스 선택 시 반드시 먼저 확인.**

### 6.1. 환경
- 데스크탑: 화이트리스트만 접속 가능
- 모바일: 제한 없음

### 6.2. 접속 가능 도메인
- `*.google.com` — Google 전체 서비스 (Apps Script 웹앱 포함)
- `*.github.io`, `github.com` — GitHub (등록 예정)
- `claude.ai` (등록 예정), `*.chatgpt.com`
- `cdn.tailwindcss.com`, `unpkg.com`, `cdnjs.cloudflare.com`
- `fonts.googleapis.com` / `fonts.gstatic.com`

### 6.3. 주의
- 새 리소스 사용 전 → 화이트리스트 확인 필수
- 미확인 도메인 → GitHub Pages에 파일 직접 포함 우선 검토
- AI가 새 CDN 사용 시 → "화이트리스트 확인 필요" 먼저 안내

---

## 7. 기술 스택

### 7.1. 프론트엔드
- HTML5/CSS3/JS (Apps Script HTML 파일로 관리)
- Tailwind CSS (CDN), Google Fonts(Noto Sans KR), Material Icons (CDN)
- 이미지 호스팅: GitHub Pages (`https://kayen1978.github.io/CATS/assets/`)
- **Apps Script 내 HTML 파일로 UI 작성**, `google.script.run`으로 백엔드 통신

### 7.2. 백엔드
- Apps Script (.gs)
- `doGet(e)` — HTML 서빙 (기본) + JSON API (`?action=` 파라미터 시) 겸용
- `google.script.run` — 프론트엔드↔백엔드 통신 (CORS 불필요)
- `HtmlService.createHtmlOutputFromFile()` + `.setXFrameOptionsMode(ALLOWALL)`

### 7.3. DB
- Google Sheets — `SpreadsheetApp`
- 파일 ID: `19haREjuRIwlnAV-VeXLxK3whu2OZDD1Qnm-fDwqRbI8`

### 7.4. 보고서
- Docs(`DocumentApp`), Slides(`SlidesApp`), Sheets(`SpreadsheetApp`)
- 템플릿 복사 + 플레이스홀더 치환

---

## 8. 인증 구조

### 8.1. 흐름 (V3.1 확정)
1. 사용자 → Google Sites 접속 → iframe으로 Apps Script 웹앱 로드
2. 페이지 로드 → 자동으로 `google.script.run.handleAuth()` 호출
3. `handleAuth()` → `Session.getActiveUser().getEmail()` → CATS명단에서 이메일 확인
4. 멤버 → 환영 화면 → 메인 메뉴 이동 / 비멤버 → "권한 없음" + 계정 전환 안내
5. 이메일 가져오기 실패 → "로그인 해주세요" 버튼 표시
6. 서버 오류 → "연결 오류" + 재시도 버튼

### 8.2. 구현
- `Session.getActiveUser().getEmail()` — 1줄 인증. Apps Script HTML 서빙 구조에서만 정상 작동.
- `google.script.run` + `withSuccessHandler` / `withFailureHandler` — 비동기 호출

### 8.3. 비멤버 처리
- 비멤버 → "접근 권한이 없습니다" + 현재 로그인 이메일 표시
- "다른 계정으로 로그인" 버튼 → Google AccountChooser URL로 이동
- **TODO:** LogOut / 계정변경 기능 추가 필요 (미구현, 추후 개발 예정)

### 8.4. 인증 응답 형식
```json
// 멤버인 경우
{ "success": true, "data": { "authorized": true, "email": "...", "nickname": "...", "name": "...", "rank": "...", "status": "..." } }
// 비멤버인 경우
{ "success": true, "data": { "authorized": false, "email": "..." } }
// 오류 발생 시
{ "success": false, "error": "오류 메시지" }
```

---

## 9. 코딩 컨벤션

### 9.1. 파일 구조 (V3.1 업데이트)

#### Apps Script 프로젝트 (.gs + .html)
```
├── config.gs          ← CONFIG 전역 상수 (SPREADSHEET_ID, 시트 이름)
├── backend_core.gs    ← doGet() 라우터, generateNextSN(), padNumber()
├── AuthService.gs     ← 인증 (getCurrentUserEmail, checkMember, handleAuth)
├── Triggers.gs        ← onEdit 등 트리거 함수
├── AdminTools.gs      ← 관리자 점검 (checkDBStructure 등)
├── login.html         ← 로그인/인증 페이지 (5개 상태: 로딩/로그인/환영/거부/오류)
└── (추후) main.html, project_list.html 등 추가 예정
```

#### GitHub Pages (`kayen1978.github.io/CATS/`)
```
├── index.html         ← (현재 미사용, 추후 랜딩 또는 제거)
└── assets/
    └── purmi_heart.png ← 푸름이 마스코트 이미지
```

#### Google Sites
- iframe으로 Apps Script 웹앱 URL 삽입
- 게시 URL: `https://sites.google.com/view/catspms`

### 9.2. 함수 명명
- CRUD: `createProject()`, `getProjectById()`, `updateProject()`
- 목록: `getProjectList()`, `getMemberList()`
- 인증: `checkMember()`, `getCurrentUserEmail()`, `handleAuth()`
- 유틸: `generateNextSN()`, `formatDate()`, `padNumber()`
- 관리자: `checkDBStructure()`, `checkSheetHeaders()`

### 9.3. 에러 처리
- API 응답: `{success, data, error}` JSON
- UI 함수: try-catch 필수
- 시트 접근: 존재 확인 후 처리
- `google.script.run`: `withSuccessHandler` + `withFailureHandler` 필수

### 9.4. 헤더 인식
- 열 번호 하드코딩 금지, `includes()` 느슨 매칭
- 헤더에 특수문자 금지

### 9.5. CONFIG-DB 동기화
- 시트 접근 → CONFIG 상수 사용
- 시트 미존재 가능 → null 체크, "미생성" 처리
- DB 변경 후 → `checkDBStructure()` 실행
- **AI 코드 생성 시 → 부록 섹션 7을 "현재 상태"로 가정 금지**

### 9.6. Apps Script HTML 작성 규칙 (V3.1 신규)
- 프론트엔드 HTML은 Apps Script 프로젝트 내 `.html` 파일로 작성
- 백엔드 호출: `google.script.run.함수명()` (fetch API 사용 금지)
- 외부 이미지: GitHub Pages URL 사용 (`https://kayen1978.github.io/CATS/assets/...`)
- 외부 CSS/Font: CDN URL 직접 사용 (화이트리스트 확인 후)
- HTML 파일 내에 `<style>`, `<script>` 인라인 작성 (별도 CSS/JS 파일 분리 불가, Apps Script 제약)

---

## 10. 배포 프로세스

### 10.1. Apps Script 배포 (V3.1 정리)
1. Apps Script 에디터에서 코드 수정
2. **"배포"** → **"배포 관리"** → 기존 배포의 **연필(✏️) 아이콘** 클릭
3. **"버전"** → **"새 버전"** 선택
4. **"배포"** 클릭
5. ⚠️ **수정 후 반드시 "새 버전" 배포** — 이전 버전은 캐시됨

### 10.2. 배포 설정 (고정)
- **다음 사용자 인증정보로 실행:** 나 (개발자 계정) — "Execute as: Me"
- **액세스 권한이 있는 사용자:** 모든 사용자

### 10.3. 배포 URL
- Apps Script 웹앱: `https://script.google.com/macros/s/AKfycbyVYcou173gpwgtVNlsDsnkH2sruyuZz9URSRTk1vSwtAIJb_4h5is_hqPjwRmdC_piGg/exec`
- Google Sites (게시): `https://sites.google.com/view/catspms`
- GitHub Pages: `https://kayen1978.github.io/CATS/`
- GitHub 저장소: `https://github.com/kayen1978/CATS/`

### 10.4. Google Sites iframe 설정
- iframe URL = Apps Script 웹앱 URL (위 참조)
- GitHub Pages URL이 아님에 주의

### 10.5. GitHub Pages 업데이트
- 이미지 등 정적 자산 변경 시: GitHub 저장소에 업로드 → 자동 반영 (1~2분 소요)
- 파일 경로: `assets/` 폴더 사용

---


# 부록은 참고용이며, 절대 지침이 아니다. 나중에 필요하다 판단되면, 지침으로 옮길 수도 있으나 지금은 지침이 아니다. 부록을 지침으로 오해하지 않도록 한다.
반복한다. 부록의 내용은 절대 지침이 아니다.

## 부록

## 4. 12단계 개발 로드맵

> **순차 실행. 이전 Phase 완성 후 다음 진행. 건너뛰기 / 동시 진행 금지.**

| Phase | 내용 | 핵심 | 상태 |
|:---:|---|---|:---:|
| 0 | 컨텍스트 고정 | 이 지침서 자체. Sheets=DB, GAS=백엔드+HTML서빙, Sites=iframe | ✅ 완료 |
| 1 | DB 구조 설계 | 5개 시트 설계·검증. **부록 섹션 7 = "설계 계획", 실제 DB 동적 확인 필수** | ✅ 완료 |
| 2 | 인증 API | `Session.getActiveUser().getEmail()` → CATS명단 확인 → JSON 반환 | ✅ 완료 |
| 3 | DB 읽기 API | 사업들→JSON. 인증 필수, 1행 컬럼명=key | 🔲 미착수 |
| 4 | DB 저장 API | doPost, JSON body. SN1 자동생성, timestamp 자동 기록 | 🔲 미착수 |
| 5 | 로그인 체크 HTML | 자동 인증, 멤버→환영화면, 비멤버→거부+계정전환 안내 | ✅ 완료 |
| 6 | 메인 메뉴 HTML | 카드형 UI, 모바일 반응형, 별명 표시 | 🔲 설계 필요 |
| 7 | 데이터 조회 | 테이블, 배지 색상, 정렬/검색, 상세보기 연결 | 🔲 미착수 |
| 8 | 데이터 입력 | 폼 검증, 책임자 드롭다운(실시간), 성공/실패 표시 | 🔲 미착수 |
| 9 | Docs 리포트 | 템플릿 `{{변수}}` 치환, Drive 저장, PDF 내보내기 | 🔲 미착수 |
| 10 | Slides 보고서 | 템플릿 기반, 슬라이드별 데이터 삽입 | 🔲 미착수 |
| 11 | 보안 강화 | 비인가 차단, 접근 로그, 에러 핸들링, 파라미터 검증 | 🔲 미착수 |
| 12 | 배포 가이드 | GAS 배포 → Sites iframe 연결 (GitHub Pages는 자산만) | 🔲 미착수 |

### 4.1. 로드맵 적용 규칙
- Phase 이동 = 현재 Phase 동작 확인 후에만
- AI는 이전 Phase 코드와의 호환성 반드시 확인
- 완성 시 코드 파일을 Project에 첨부

### 4.2. 다음 작업 (Phase 6 준비)
- 대시보드(메인 메뉴) 구성 설계 필요
- 각 subpage(메뉴) 설계 필요
- 설계 완료 후 Phase 6 → Phase 3 → Phase 4 순으로 진행 예정

## 7. DB 구조 — CATS Project DB

> **아래는 "설계 계획"이다. 미생성 시트가 있을 수 있으므로, 코드는 반드시 실제 DB를 동적으로 확인할 것. 시트 이름 하드코딩 금지.**

- 파일 ID: `19haREjuRIwlnAV-VeXLxK3whu2OZDD1Qnm-fDwqRbI8`

### 7.1. 사업들 (메인)

| 열 | 컬럼명 | 설명 |
|---|---|---|
| A | SN1 | 고유번호, A001~ 자동생성 |
| B | 사업명 | 전체 이름 |
| C | 사업약칭 | 약어 |
| D | 사업설명 | 상세 설명 |
| E | 진행상태 | [선택항목설정 탭에서 불러올 것] |
| F~I | 제안일/시작일/목표일/종료일 | yy/mm/dd(요일) |
| J | 책임자 | 단수, CATS명단 A열 (SN2(사번)) |
| K | 참여자 | 복수, CATS명단 A열 (SN2(사번)) |
| L | 부서및업체 | 복수, 부서및업체 시트 참조 |
| M | 진행상황 | 여러 줄 텍스트 |
| N | 참조 | Drive URL, 복수 가능 |
| O | 최종수정 | 수정자 별명 (overwrite) |
| P | 최종수정일시 | yy/mm/dd(요일) am/pm hh:mm |

### 7.2. CATS명단

| 열 | 컬럼명 | 설명 |
|---|---|---|
| A | SN2(사번) | 8자리 숫자 | **서비스 전체 핵심 식별자** 
| B | 이름 | 실명 |
| C | 직급 | [선택항목설정 탭에서 불러올 것] |
| D | 계정 | Google 이메일 | 계정 인증 Log-in에 사용
| E | 회사E-Mail | 회사업무용 E-Mail 주소 |
| F | 별명 | 부르기 편하기 위한 목적 |
| G | 연락처 | 전화번호 |
| H | 내선번호 | 회사 내선 번호 |
| I | 상태 | [선택항목설정 탭에서 불러올 것] |

### 7.3. 부서및업체
| 열 | 컬럼명 | 설명 |
|---|---|---|
| A |SN3| 고유번호, B001~ 자동생성 |
| B | 약칭 | 명칭 줄임말 |
| C | 명칭 | 기관, 부서, 혹은 조직의 정식 명칭 |
| D | 분류 | 병원부서 / 재단부서 / 납품업체 / 학회 / 유관기관 / 정부기관|
| E | 연락처 | 전화번호 |
| F | 업체담당자 | 이름 입력 |
| G | 책임자 | [CATS명단]에서 F열 [별명]을 불러올 것 [함수로 자동으로 불러오기]


### 7.4. 경과기록
| 열 | 컬럼명 | 설명 |
|---|---|---|
| A |SN4| 고유번호, C0001~ 자동생성 |
| B | 사업ID | (SN1 참조) |
| C | 수정by | [CATS명단]에서 F열 [별명]을 불러올 것 | ** dropdown 메뉴에서 선택 **
| D | 수정일시 | yy/mm/dd(요일) am/pm hh:mm |
| E | 수정내용 | [텍스트로 입력]|

** [경과기록] 탭 [수정by] 에 해당하는 C열에는  [CATS명단]에서 F열 [별명]을 불러올 것 [함수로 자동으로 불러오기]


### 7.5. 선택항목설정
| 열 | 컬럼명 | 설명 |
|---|---|---|
| A | 탭 | 사업들, CATS명단, 부서및업체, 경과기록, 선택항목설정 |
| B | 항목 | [탭에서 선택사항들을 적용할 항목 지정] |
| C | 선택사항들 | [각 항목에서 사용할 선택사항들 지정] |

### 7.5.1. 선택항목설정 ; 항목별 선택항목들 시안
| 탭 | 항목 | 선택사항들 |
|---|---|---|
| 사업들 | 진행상태 | 제안 / 검토 / 시작 / 진행중 / 마무리 / 완료 / [보류] / [일시중단] / [취소] |
| CATS명단 | 직급 | RN / CN / HN / TL / Staff / CoS |
| CATS명단 | 상태 | 신규 / 근무중 / 휴직 / 퇴사 |
| 부서및업체 | 분류 | 병원부서 / 재단부서 / 납품업체 / 학회 / 유관기관 / 정부기관 |
| 경과기록 | 수정by | [CATS명단]에서 F열 [별명]을 불러올 것 [함수로 자동으로 불러오기] |
| 선택항목설정 | 탭 | 사업들, CATS명단, 부서및업체, 경과기록, 선택항목설정 |

### 7.6. 공통 규칙
- **SN:** 마지막 행 +1, GAS 백엔드에서만 생성
- **날짜:** `yy/mm/dd(요일)` / 수정일시: `yy/mm/dd(요일) am/pm hh:mm`
- **사번(A열)** = 모든 사용자 필드의 식별 기준

---

## 11. 구현 완료 항목 (V3.1 업데이트)

### 11.1. 백엔드 — config.gs
- `CONFIG` 전역 상수 (SPREADSHEET_ID, 5개 시트 탭 이름)
- `CONFIG_SHEET_NAMES` 배열

### 11.2. 백엔드 — backend_core.gs (V2.0)
- `doGet(e)` — HTML 서빙 + JSON API 겸용 라우터
   - `?action=auth` → JSON 인증 응답 (기존 호환)
   - `?page=login` 또는 파라미터 없음 → login.html 서빙
   - `?page=XXX` → 해당 HTML 파일 서빙 (확장 가능)
- `generateNextSN(sheetName, prefix, digits)` — SN 자동생성 (이중 접근: getActive + openById)
- `padNumber(num, digits)` — 0-패딩

### 11.3. 백엔드 — AuthService.gs (V1.0)
- `getCurrentUserEmail()` — Session에서 이메일 추출 (소문자, trim)
- `checkMember(email)` — CATS명단에서 이메일 검색, 멤버 정보 반환 (includes 매칭)
- `handleAuth()` — 인증 전체 흐름 통합 (이메일 추출 → 멤버 확인 → 결과 포장)

### 11.4. 프론트엔드 — login.html
- 5개 상태 화면: 로딩/로그인필요/환영(멤버)/거부(비멤버)/오류
- `google.script.run.handleAuth()` 자동 호출
- 멤버: 별명 + 직급 표시 → 2초 후 메인 메뉴 이동 (메인 메뉴 미완성)
- 비멤버: 이메일 표시 + "다른 계정으로 로그인" (Google AccountChooser)
- 모바일 반응형
- 푸름이 이미지: GitHub Pages에서 로드 (onerror 시 자동 숨김)

### 11.5. AdminTools.gs
- 관리자 전용 (에디터에서 직접 실행)
- `checkDBStructure()` — DB vs CONFIG 비교, 불일치 시 수정 코드 출력
- `checkSheetHeaders()` / `checkDataSample()` — 구조·데이터 점검

### 11.6. 배포 현황
- Apps Script 웹앱: 배포 완료, 인증 정상 작동 확인
- Google Sites: iframe 연결 + 게시 완료 (`catspms`)
- GitHub Pages: 저장소 생성, 이미지 업로드, Pages 활성화 완료

---

## 12. 미완료 항목

- **즉시 필요:** 대시보드(메인 메뉴) 설계 및 구현 (Phase 6)
- **추후 구현:** LogOut / 계정변경 기능 (로그인 페이지에 추가)
- 사업 상세 보기 (P7 확장)
- 경과기록 UI (P4 확장)
- 참여자 복수 선택 (P8 확장)
- 보고서 자동 생성 (P9~10)
- 칸반보드 뷰, 보안 강화, 알림, 멤버별 대시보드

---

## 부록 A. 참고 대화 로그

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
| 10 | Claude × Phase 2+5 | 인증 API 구현, 아키텍처 변경 (HTML 직접 서빙), Google Sites iframe 연결 |

---

## 부록 B. 버전 변경 이력

### V2.0 → V2.1
- 섹션 7: "5개 시트" 단정 → 설계 계획 명시, 동적 확인 추가
- 섹션 9.7 신규: CONFIG-DB 불일치 교훈
- 섹션 10.3 신규: AdminTools.gs
- 섹션 9.5 신규: CONFIG-DB 동기화 규칙

### V2.1 → V3.0
- 전체 → bulletin style 압축 (내용량 약 51% 감소)
- Cascade 구조 유지, 장황한 서술 제거
- 로드맵 Phase → 테이블 1개로 통합
- 대화 로그 + 버전 이력 → 부록 분리

### V3.0 → V3.1
- **섹션 0.2 신규:** 아키텍처 교훈 (iframe 인증 실패 → Apps Script HTML 직접 서빙으로 변경)
- **섹션 5 전면 개정:** 아키텍처 확정 (GitHub Pages UI → Apps Script HTML 서빙, google.script.run 사용)
- **섹션 7 업데이트:** 기술 스택에 google.script.run, HtmlService 추가
- **섹션 8 전면 개정:** 인증 흐름 확정 (handleAuth, 5개 상태, 응답 형식 명시)
- **섹션 9.1 업데이트:** 파일 구조 현행화 (AuthService.gs, login.html, GitHub Pages 역할 변경)
- **섹션 9.6 신규:** Apps Script HTML 작성 규칙
- **섹션 10 신규:** 배포 프로세스 정리 (URL, 설정, 절차)
- **섹션 11 전면 개정:** 구현 완료 항목 현행화 (Phase 0/1/2/5 완료 표시)
- **섹션 12 업데이트:** 미완료 항목에 LogOut/계정변경 추가
- **로드맵 테이블:** Phase별 완료 상태 표시 추가
- **부록 A:** 대화 로그 #10 추가 (Phase 2+5 구현)
- **Stitch 포기 명시:** 섹션 0.1에 추가

### V3.1 → V3.2
- **섹션 0.3 신규:** 답변 스타일 규칙 추가 (Numbering/Bulletin, Cascade, Explanatory 3원칙)
- **부록 섹션 7.2 업데이트:** CATS명단 구조 확장 (7열→9열, 회사E-Mail·내선번호 추가)
- **부록 섹션 7.3 업데이트:** 부서및업체 구조 확장 (6열→7열, 책임자 열 추가)
- **부록 섹션 7.4 업데이트:** 경과기록 SN 변경 (SN3→SN4, 부서및업체 SN3과의 중복 해소)
- **부록 섹션 7.5.1 업데이트:** 선택항목설정 시안 수정 (7행→6행, "부서및업체-책임자" 행 삭제)
- **부록 B:** 본 변경 이력 추가
