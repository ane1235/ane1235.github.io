# KSCTVA26 웹앱 — 프로젝트 현황 및 향후 작업 보고서

> **작성일**: 2026-03-11
> **작성자**: Claude (AI 개발 보조)
> **현재 워크트리**: strange-nobel (main 기준, V3.x 코드)
> **최신 코드 위치**: sweet-cannon 워크트리 (V4.0 + 진단 보고서 포함)

---

## I. 프로젝트는 V4.0 기능 완성 단계이나 3가지 후속 작업이 남아있다

1. **현재 코드 상태**: V4.0이 sweet-cannon/wizardly-moser 워크트리에 존재하며, main에는 아직 머지되지 않았다
   - V4.0 핵심 변경: `views.js` → `view-overview.js`, `view-session.js`, `view-mypage.js` 3분할 + `colleagues.js` 신규 추가 (총 9개 JS 파일, 1,541줄)
   - 로그인·강좌 선택·MyPage 시간표·중복 경고·동료 레이블 등 모든 핵심 기능이 정상 작동한다.
   - strange-nobel 워크트리(현재)는 main 기준이므로 V3.x 코드(`views.js` 단일 파일, 7개 JS)를 갖고 있다.

2. **Git 브랜치 현황**: 3개 워크트리가 병존하고 있어 정리가 필요하다
   - `wizardly-moser`: V4.0 최초 구현 (커밋 2건, PR #5·#6으로 sweet-cannon에 머지 완료)
   - `sweet-cannon`: V4.0 + 데이터 파이프라인 감사 보고서 3건 포함 (가장 최신 상태)
   - `strange-nobel` (현재): main 기준으로 V3.x 코드 — **전략 B 작업의 베이스로 사용하려면 sweet-cannon 코드를 가져와야 한다**

> 📌 **Analyst Note**
> strange-nobel에서 작업을 시작하려면 먼저 sweet-cannon의 V4.0 코드와 보고서를 이 워크트리로 동기화하는 것이 선행되어야 한다. 그렇지 않으면 이미 완료된 V4.0 변경사항(3분할, 동료 기능) 위에서 작업할 수 없다.

## II. 미완료 작업은 크게 3개 트랙으로 구분된다

### 1. [트랙 A] GAS 배포 및 온라인 검증 — 사용자 수동 작업 대기 중
   - 가. GAS `getColleagueSelections` action을 Apps Script에 배포해야 동료 수강자 기능이 완성된다. 코드는 `claude_doc/GAS_getColleagueSelections.md`에 준비되어 있다.
   - 나. V4.0 브랜치를 main에 머지 후 GitHub Pages에서 온라인 검증이 필요하다.
   - 다. Google Sites iframe URL 변경을 통한 통합 검토가 대기 중이다.

### 2. [트랙 B] 전략 B: data.js 파이프라인 전면 리팩토링 — 이번 세션의 핵심 작업
   - 가. **문제 진단 완료**: data.js가 Google Sheets 원본 2D 배열을 그대로 저장하고 있어, 매 렌더링마다 텍스트 파싱(행 타입 추론, Room 추출 등)이 발생하는 구조적 비효율이 확인되었다.
   - 나. **전략 B 확정**: data.js를 의미 구조화 객체로 전면 재설계하는 방향이 사용자에 의해 승인되었다.
   - 다. **5단계 작업계획이 수립되어 있다**:

| 단계 | 내용 | 예상 규모 | 의존성 |
|------|------|-----------|--------|
| 1단계 | data.js 구조화 객체 전면 재작성 | 670줄 재작성 | 없음 (선행) |
| 2단계 | utils.js 불필요 함수 8개 제거 | 8개 삭제, 2개 수정 | 1단계 완료 필요 |
| 3단계 | view-overview/session/mypage.js 리팩토링 | 3개 뷰 수정 | 1~2단계 완료 필요 |
| 4단계 | 통합 테스트 | 전 기능 검증 | 3단계 완료 필요 |
| 5단계 | 데스크탑 CSS 최적화 | style.css 추가 | 3단계와 병행 가능 |

   - 라. **최대 리스크**: 강좌 ID 호환성(`탭이름_R행번호`)이다. 기존 사용자의 Google Sheets 저장 데이터가 `Day1_A1_R4` 형태이므로, 변환 후에도 동일 ID를 유지해야 한다.

> 📌 **Analyst Note**
> 전략 B의 핵심 가치는 "데이터가 자기 자신을 설명하게 만드는 것"이다. 현재 8개의 텍스트 파싱 함수(`extractRoomName`, `isBreakRow`, `parseSessionData` 등)가 모두 제거 가능해지며, 렌더링 코드가 크게 단순화될 수 있다. 다만 670줄 전면 재작성이므로 1단계 완료 후 ID 대조 검증이 필수적이다.

### 3. [트랙 C] 데스크탑 CSS 최적화 — 트랙 B 3단계와 병행 가능
   - 가. 모바일 우선 설계(`max-width: 960px`, 폰트 13px)가 데스크탑에서 가독성을 해치고 있다.
   - 나. `@media (min-width: 769px)` 미디어 쿼리 신설로 데스크탑 전용 스타일을 적용할 계획이다.
   - 다. 상세 진단은 `REPORT_Desktop_Design_Optimization_260311.md`에 문서화되어 있다.

## III. 이번 세션의 권장 실행 순서는 다음과 같다

1. **선행 작업**: sweet-cannon 워크트리의 V4.0 코드를 strange-nobel로 동기화한다
   - sweet-cannon의 최신 커밋(`f49dda1`)을 이 워크트리에 머지하거나 체리픽한다.
   - 동기화 후 9개 JS 파일(`colleagues.js` 포함)과 `index.html` 업데이트를 확인한다.

2. **1단계 실행**: data.js를 구조화 객체로 전면 재작성한다
   - Overview 데이터: 2D 배열 → `{ title, subtitle, days: [{ label, rooms, rows }] }` 구조
   - Session 데이터: 2D 배열 → `{ title, sections: [{ name, room, chair, items }] }` 구조
   - ID 호환성 검증: 변환 전후 모든 강좌 ID 대조표를 만들어 확인한다.

3. **2~3단계 실행**: utils.js 정리 + 렌더링 코드 리팩토링
4. **4단계**: 통합 테스트 (로그인→선택→MyPage→중복경고→동료레이블)
5. **5단계**: 데스크탑 CSS 최적화 (3단계와 병행)

## IV. 변경 금지 사항 (레드라인)

1. **강좌 ID 체계**: `탭이름_R행번호` 형식 절대 유지 — 기존 저장 데이터 호환 필수
2. **API 인터페이스**: `callApi`, `callApiPost` 시그니처 및 GAS 연동 방식 유지
3. **colleagues.js**: V4.0 동료 수강자 기능 그대로 보존
4. **config.js**: API_URL 상수 유지
