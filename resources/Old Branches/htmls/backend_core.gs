/**
 * ============================================================
 * backend_core.gs — 웹앱 진입점 (doGet 라우터)
 * ============================================================
 * 역할: 사용자가 웹앱 URL에 접속하면 index.html을 서빙한다.
 *       index.html 내부의 <?!= include('파일명') ?> 을 통해
 *       style.html, script_*.html 파일들이 자동으로 합쳐진다.
 * 
 * 아키텍처 (CATS APP 동일 패턴):
 *   Google Sites → iframe → 이 Apps Script 웹앱 (HTML 서빙)
 *                              ↓ google.script.run
 *                           백엔드 함수들 → Google Sheets
 * 
 * 파일 구조:
 *   index.html         ← HTML 뼈대 + include 호출
 *   style.html         ← CSS 전체
 *   script_state.html  ← 전역 상태 + 로그인 + 앱 초기화
 *   script_nav.html    ← 드롭다운 메뉴 + 뷰 라우터
 *   script_views.html  ← 3개 뷰 렌더링 (overview, session, mypage)
 *   script_utils.html  ← 파싱, 시간 계산, 유틸리티
 * 
 * 배포 설정:
 *   - "실행 계정(Execute as)": 나 (개발자)
 *   - "액세스(Who has access)": 모든 사용자
 *   - 수정 후 반드시 "새 버전"으로 배포 (캐시 방지)
 * ============================================================
 */

/**
 * HTML 파일 삽입 헬퍼 함수
 * index.html 에서 <?!= include('style') ?> 형태로 호출된다.
 * 
 * 동작 방식: 지정한 HTML 파일의 내용을 문자열로 반환하여
 *           호출 위치에 그대로 삽입한다.
 *           (서버 사이드에서 조립 → 클라이언트는 하나의 완성된 HTML을 받음)
 * 
 * @param {string} filename - 삽입할 HTML 파일명 (확장자 제외)
 * @return {string} 해당 파일의 HTML 내용
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * 웹앱 GET 요청 처리 — HTML 페이지 서빙
 * 
 * createTemplateFromFile을 사용하여 <?!= ?> 태그를 처리한다.
 * (createHtmlOutputFromFile과 달리 템플릿 태그를 해석함)
 * 
 * @param {Object} e - 요청 파라미터 (현재 미사용, 향후 확장 가능)
 * @return {HtmlOutput} 조립된 HTML 페이지
 */
function doGet(e) {
  try {
    // index.html을 템플릿으로 읽어서 <?!= include(...) ?> 태그를 처리
    var template = HtmlService.createTemplateFromFile("index");
    var htmlOutput = template.evaluate()
      // 페이지 제목 (브라우저 탭에 표시)
      .setTitle("KSCTVA 2026 춘계학술대회")
      // iframe 내 표시 허용 (Google Sites 삽입 필수 설정)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      // 메타 뷰포트 설정 (모바일 반응형)
      .addMetaTag("viewport", "width=device-width, initial-scale=1.0");

    return htmlOutput;

  } catch (err) {
    // HTML 파일을 찾지 못하는 등의 오류 시 간단한 오류 페이지 반환
    return HtmlService.createHtmlOutput(
      "<h2>오류가 발생했습니다</h2>" +
      "<p>" + err.message + "</p>" +
      "<p>관리자에게 문의해주세요.</p>"
    ).setTitle("오류");
  }
}
