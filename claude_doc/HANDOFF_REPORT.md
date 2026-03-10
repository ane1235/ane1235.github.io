# KSCTVA26 프로젝트 인수인계 보고서
> **작성 시점:** 2026-03-10 세션 1 종료  
> **목적:** 다음 대화 세션에서 작업을 이어가기 위한 전체 맥락 인수인계

---

## 1. 프로젝트 개요

- **정체성:** 대한심폐혈관마취학회(KSCTVA) 2026 춘계학술대회 정보 제공 웹페이지
- **사용자:** 부천세종병원 마취통증의학과 약 20명 (ANE 탭에 19명 등록)
- **학회 일정:** 2026-04-11(토) ~ 04-12(일), 연세대학교 백양누리 그랜드 볼룸
- **관계:** CATS PMS 프로젝트의 사이드 프로젝트 (CATS는 약 1개월 중단, 백업 완료)
- **개발자:** 민경범 (의사, No Skill No Coding 방식)
- **계정:** kayen1978@gmail.com (시트 소유자, GCP, GitHub 모두 이 계정)

### ⚠️ 절대 규칙
- **CATS명단 시트 사용 금지** → 오로지 KSCTVA26 시트만 사용
- CATS PMS 지침서(V3.4)는 **개발 방법론(답변 스타일, 코딩 컨벤션)만 참고** — DB 대상 시트 관련 부분은 무시

---

## 2. 핵심 리소스 ID 및 URL

| 리소스 | 값 |
|---|---|
| **스프레드시트 ID** | `12KeGjyFvpZ6cSkKsuMrxmCBpBTBRzY3p21xQc5gtOBI` |
| **Apps Script 웹앱 URL** | `https://script.google.com/macros/s/AKfycbySQil2bfJ-Iicws05I7fFvbZbmmcSR1-BKjMlhg8i0pozBhJWo06b5h0p_DcIdaq3v/exec` |
| **Google Sites** | `https://sites.google.com/view/ksctva26` (배포 완료) |
| **GitHub Pages** | `https://ane1235.github.io/` (현재 404 — 아래 미완료 작업 참조) |
| **GitHub 저장소** | `https://github.com/ane1235/ane1235.github.io` |
| **GCP 프로젝트 ID** | `ksctva26` |
| **Service Account 이메일** | `mcp-sheets@ksctva26.iam.gserviceaccount.com` |
| **Service Account JSON 경로** | `~/.config/mcp-google-sheets/service-account.json` |

---

## 3. 스프레드시트 탭 구조 (10개)

| 탭 | 용도 | 비고 |
|---|---|---|
| overview | 전체일정 개요 (Day1+Day2) | 메인 페이지 표시 |
| ANE | 로그인용 사번+이름 (19명) | 헤더: SN2(사번), 이름 |
| Selections | 강좌 선택 저장 | 헤더: SN2, selections (JSON) |
| Day1_A1 | Session 1(Room1) + Session 2(Room2) | 10:30~12:00 |
| Day1_P1 | Session 3(Room1&2 공통, 영어) | 13:00~14:30 |
| Day1_P2 | Session 4(Room1) + Session 5(Room2) | 14:50~16:20 |
| Day1_P3 | Session 6(Room1) + Session 7(Room2) | 16:40~18:00 |
| Day2_A1 | Session 9(Room1) + Session 10(Room2) | 10:50~12:20 |
| Day2_P1 | Session 11(Room1) + Session 12(Room2) | 13:30~15:00 |
| Day2_P2 | Session 13(Room1) + Session 14(Room2) | 15:20~16:50 |

- **Session 8** (초록발표, Day2 09:00~10:30): 별도 탭 없음, overview에만 표시, 선택 대상 제외 확정

---

## 4. 현재 Apps Script 파일 구조 (현재 동작 중인 버전: V1.2)

### 백엔드 (.gs) — 5개

| 파일 | 버전 | 역할 |
|---|---|---|
| Config.gs | V1.0 | 전역 상수 (시트ID, 탭이름, 메뉴매핑, 학회정보) |
| AuthService.gs | V1.0 | `handleLogin(name, sn2)` → ANE 탭 대조 |
| DataService.gs | V1.0 | `getAllData()` → overview + 7개 세션 raw 2D배열 일괄 반환 |
| SelectionService.gs | V1.0 | `getSelections(sn2)`, `saveSelections(sn2, arr)` → Selections 탭 |
| backend_core.gs | V1.1 | `doGet()` + `include()` 헬퍼 (createTemplateFromFile 사용) |

### 프론트엔드 (.html) — 6개 (분리 완료)

| 파일 | 버전 | 줄 수 | 역할 | 수정 빈도 |
|---|---|:---:|---|:---:|
| index.html | V1.0 | ~100 | HTML 뼈대 + `<?!= include() ?>` 호출 | 낮음 |
| style.html | V1.1 | ~150 | CSS 전체 (Room 뱃지 + 중복 하이라이트 포함) | 중간 |
| script_utils.html | V1.1 | ~170 | 파싱, 시간, Room 추출, 유틸리티 | 낮음 |
| script_state.html | V1.0 | ~120 | 전역 상태, 로그인, 데이터 로드, 선택 토글 | 중간 |
| script_nav.html | V1.0 | ~80 | 드롭다운 메뉴, 뷰 라우터 | 낮음 |
| script_views.html | V1.2 | ~250 | Overview/Session/MyPage 렌더링 | **높음** |

### include 로드 순서 (index.html 내)
```
<?!= include('style') ?>        ← CSS
<?!= include('script_utils') ?> ← 유틸리티 (가장 먼저)
<?!= include('script_state') ?> ← 상태+로그인
<?!= include('script_nav') ?>   ← 네비게이션+라우터
<?!= include('script_views') ?> ← 뷰 렌더링 (가장 마지막)
```

---

## 5. 아키텍처 (현재 동작 중)

```
[브라우저] → [Google Sites (https://sites.google.com/view/ksctva26)]
                ↓ iframe
             [Apps Script 웹앱 (doGet → index.html 서빙)]
                ↓ google.script.run
             [백엔드 함수들 (handleLogin, getAllData, getSelections, saveSelections)]
                ↓ 읽기/쓰기
             [Google Sheets (KSCTVA26)]

[GitHub Pages (ane1235.github.io)] → 현재: purmi_heart.png 로고만 제공
```

---

## 6. 구현 완료 기능

1. **로그인:** 이름+사번 → ANE 탭 대조 → 성공/실패
2. **메인 페이지 (Overview):** 전체일정 표, 세션 행 클릭 → 세션 페이지 이동
3. **세션별 페이지:** 강좌 목록, 클릭으로 선택/해제 토글, 서버 즉시 저장
4. **MyPage (내 강좌):**
   - Day1/Day2 탭 분리
   - Room 칼럼 (Room 1 / Room 2 / 공통 뱃지)
   - 중복 선택 감지 (같은 시간대 + 다른 Room + 실제 시간 범위 겹침)
   - 중복 시 빨간 테두리 + 경고 메시지
5. **현재시간 하이라이트:** 1분마다 갱신, data-time 속성 매칭
6. **로그아웃:** 상태 초기화 → 로그인 화면 복귀
7. **Google Sites 배포:** iframe 삽입 완료
8. **MCP 연동:** xing5/mcp-google-sheets (Service Account 방식, 읽기/쓰기 정상)

---

## 7. V1.2 핵심 설계 결정

### 강좌 ID 체계
- 형식: `탭이름_R행번호` (예: `Day1_A1_R5`)
- 파싱: `lastIndexOf("_R")` 앞 = 탭이름, 뒤 = 행 인덱스 (0-based)

### Room 정보 추출
- 세션 제목에서 파싱: `getRoomFromSectionTitle(title)`
- "(Room 1)" → "Room 1" / "(Room 2)" → "Room 2" / "(Room 1&2" → "공통"

### 중복 감지 (V1.2)
- 함수: `getOverlappingIds(lectures)` → 겹치는 강좌 ID 집합 반환
- **반개구간(half-open interval) 방식:** `A_start < B_end AND B_start < A_end`
- 10:30~10:45 ↔ 10:45~11:00 → **겹치지 않음** (이어지는 강좌, OK)
- 10:30~11:00 ↔ 10:45~11:00 → **겹침** (동시 수강 불가)

### 데이터 흐름
- 로그인 성공 → `getAllData()` + `getSelections(sn2)` 동시 호출
- 클라이언트 JS 변수에 캐시 → 페이지 전환은 서버 호출 없이 JS로 렌더링
- 강좌 선택/해제 → UI 즉시 반영 + `saveSelections()` 비동기 저장

---

## 8. ★ 다음 작업: GitHub Pages 직접 호스팅 전환 (경로 B 확정)

### 8-1. 전환 배경
- 현재: Apps Script가 HTML 직접 서빙 → `google.script.run`으로 통신
- 목표: GitHub Pages에서 HTML 서빙 → `fetch API`로 Apps Script 호출
- **가능한 이유:** KSCTVA26은 `Session.getActiveUser()`를 사용하지 않고 이름+사번 인증이므로 fetch API로 전환해도 인증 문제 없음

### 8-2. 필요한 변경 작업

#### 백엔드 변경 (Apps Script)
1. **doGet(e) / doPost(e)에 JSON API 모드 추가**
   - 파라미터로 분기: `?action=login&name=...&sn2=...` → JSON 반환
   - 기존 HTML 서빙 모드도 유지 (Google Sites iframe용)
2. **CORS 처리**
   - Apps Script doGet/doPost는 리다이렉트 방식으로 응답 → CORS 자동 처리될 수 있으나 검증 필요
   - `ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON)` 사용

#### 프론트엔드 변경
1. **google.script.run → fetch API 전환**
   - `handleLogin`: `fetch(APPS_SCRIPT_URL + '?action=login&name=...&sn2=...')`
   - `getAllData`: `fetch(APPS_SCRIPT_URL + '?action=getAllData')`
   - `getSelections`: `fetch(APPS_SCRIPT_URL + '?action=getSelections&sn2=...')`
   - `saveSelections`: `fetch(APPS_SCRIPT_URL + '?action=saveSelections', { method: POST, body: ... })`
2. **index.html 구조 변경**
   - `<?!= include() ?>` 템플릿 태그 제거 → 일반 `<script src="...">` 또는 인라인으로 변경
   - 또는 단일 HTML로 재통합 (GitHub Pages는 파일 분리가 다른 방식으로 가능)
3. **GitHub 저장소에 파일 업로드**

#### 배포 구조 변경
```
[브라우저] → [GitHub Pages (https://ane1235.github.io)]
                ↓ fetch API (HTTPS)
             [Apps Script 웹앱 (JSON API 모드)]
                ↓ 읽기/쓰기
             [Google Sheets (KSCTVA26)]

[Google Sites] → 그대로 유지 (병원 데스크탑용 백업 접속 경로)
```

### 8-3. 주의사항
- Apps Script fetch 호출 시 URL 끝에 `/exec` 필수
- Apps Script는 302 리다이렉트를 거침 → fetch에서 `redirect: 'follow'` 필요
- POST 요청 시 `doPost(e)` 구현 필요 (현재 없음)
- Google Sites iframe 방식도 병행 유지 → doGet()에서 action 파라미터 유무로 분기

---

## 9. 개발 환경 요약

| 항목 | 값 |
|---|---|
| OS | macOS |
| Claude | Desktop App (Claude Max) |
| MCP | xing5/mcp-google-sheets (Service Account, uvx) |
| MCP 기타 | sequential-thinking, supermemory |
| Google Sheets MCP 삭제됨 | Claude 내장 Google Sheets MCP, Google Drive MCP 모두 삭제 |
| uvx 경로 | `~/.local/bin/uvx` (config에서 전체 경로 사용) |

### claude_desktop_config.json 내 google-sheets MCP 설정
```json
{
  "google-sheets": {
    "command": "/Users/본인유저이름/.local/bin/uvx",
    "args": ["mcp-google-sheets@latest"],
    "env": {
      "SERVICE_ACCOUNT_PATH": "/Users/본인유저이름/.config/mcp-google-sheets/service-account.json"
    }
  }
}
```

---

## 10. 도메인 화이트리스트 (병원 네트워크)

- 접속 가능: `*.google.com`, `*.github.io`, `cdn.tailwindcss.com`, `unpkg.com`, `cdnjs.cloudflare.com`, `fonts.googleapis.com`, `fonts.gstatic.com`
- `fonts.googleapis.com` / `fonts.gstatic.com`: 화이트리스트 신청 예정, 아직 미등록, 회사 PC 접속 불가
- 모바일: 제한 없음

---

## 11. 확정된 설계 결정 (변경 금지)

1. 강좌 선택 저장: Google Sheet `Selections` 탭 (서버 저장, 기기 이동 유지)
2. Session 8(초록발표): overview에만 표시, 세션 페이지/MyPage 선택 대상 제외
3. Day2 서브메뉴: `[오후 세션 13,14]` → `Day2_P2` (오타 수정 확인됨)
4. HTML 파일 분리 구조 유지 (수정 효율성)
5. 중복 감지: 반개구간 방식 (끝 시간 = 시작 시간은 겹치지 않음으로 처리)
