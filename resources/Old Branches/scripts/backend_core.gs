/**
 * ============================================================
 * backend_core.gs — 웹앱 진입점 (doGet 라우터)
 * ============================================================
 * 역할: 사용자가 웹앱 URL에 접속하면 index.html을 서빙한다.
 *       Google Sites의 iframe에서 표시되므로
 *       setXFrameOptionsMode(ALLOWALL) 설정이 필수이다.
 * 
 * 아키텍처 (CATS APP 동일 패턴):
 *   Google Sites → iframe → 이 Apps Script 웹앱 (HTML 서빙)
 *                              ↓ google.script.run
 *                           백엔드 함수들 → Google Sheets
 * 
 * 배포 설정:
 *   - "실행 계정(Execute as)": 나 (개발자)
 *   - "액세스(Who has access)": 모든 사용자
 *   - 수정 후 반드시 "새 버전"으로 배포 (캐시 방지)
 * ============================================================
 */

/**
 * 웹앱 GET 요청 처리 — HTML 페이지 서빙
 * 
 * @param {Object} e - 요청 파라미터 (현재 미사용, 향후 확장 가능)
 * @return {HtmlOutput} index.html 페이지
 */
function doGet(e) {
  try {
    // index.html 파일을 읽어서 HtmlOutput으로 반환
    var htmlOutput = HtmlService.createHtmlOutputFromFile("index")
      // 페이지 제목 (브라우저 탭에 표시)
      .setTitle("KSCTVA 2026 춘계학술대회")
      // iframe 내 표시 허용 (Google Sites 삽입 필수 설정)
      // 이 설정이 없으면 Google Sites iframe에서 "연결 거부" 오류 발생
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      // 메타 뷰포트 설정 (모바일 반응형)
      .addMetaTag("viewport", "width=device-width, initial-scale=1.0");

    return htmlOutput;

  } catch (e) {
    // HTML 파일을 찾지 못하는 등의 오류 시 간단한 오류 페이지 반환
    return HtmlService.createHtmlOutput(
      "<h2>오류가 발생했습니다</h2>" +
      "<p>" + e.message + "</p>" +
      "<p>관리자에게 문의해주세요.</p>"
    ).setTitle("오류");
  }
}
