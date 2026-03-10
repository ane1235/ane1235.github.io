/**
 * ============================================================
 * DataService.gs — 전체 데이터 로드 서비스
 * ============================================================
 * 역할: 로그인 성공 후, 모든 시트 데이터를 한 번에 가져와
 *       프론트엔드에 전달한다.
 *       프론트엔드는 이 데이터를 JavaScript 변수에 캐시하여
 *       페이지 전환마다 서버를 호출하지 않고 빠르게 렌더링한다.
 * 
 * 설계 결정:
 *   - 데이터 파싱(섹션 구분, 강좌 식별 등)은 프론트엔드에서 담당
 *   - 백엔드는 각 탭의 raw 2D 배열만 전달
 *   - 이유: 파싱 로직 변경 시 HTML만 수정하면 됨 (GAS 재배포 불필요)
 * 
 * 프론트엔드에서 호출:
 *   google.script.run
 *     .withSuccessHandler(onDataLoaded)
 *     .withFailureHandler(onDataError)
 *     .getAllData();
 * ============================================================
 */

/**
 * 전체 시트 데이터를 일괄 로드하여 반환
 * 
 * @return {Object} 전체 데이터
 *   {
 *     success: true,
 *     data: {
 *       overview: [["KSCTVA 2026..."], ["시간", "Room 1", "Room 2"], ...],
 *       sessions: {
 *         "Day1_A1": [["📅 Day 1..."], ["Session 1..."], ...],
 *         "Day1_P1": [...],
 *         ...
 *       },
 *       menuMap: { DAY1: [...], DAY2: [...] },
 *       event: { TITLE: "...", VENUE: "..." }
 *     }
 *   }
 */
function getAllData() {
  try {
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

    // ── 1. Overview 탭 데이터 ──
    var overviewSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.OVERVIEW);
    var overviewData = [];
    if (overviewSheet) {
      overviewData = overviewSheet.getDataRange().getValues();
    }

    // ── 2. 세션 탭 데이터 (7개 탭 순회) ──
    // CONFIG.SESSION_TABS 배열을 순회하며 각 탭의 2D 배열을 가져온다
    var sessionsData = {};
    for (var i = 0; i < CONFIG.SESSION_TABS.length; i++) {
      var tabName = CONFIG.SESSION_TABS[i];
      var sheet = ss.getSheetByName(tabName);
      if (sheet) {
        sessionsData[tabName] = sheet.getDataRange().getValues();
      } else {
        // 탭이 없으면 빈 배열 (오류 방지)
        sessionsData[tabName] = [];
      }
    }

    // ── 3. 결과 반환 ──
    // menuMap과 event 정보도 함께 전달하여
    // 프론트엔드가 CONFIG에 의존하지 않고 독립적으로 렌더링 가능하게 한다
    return {
      success: true,
      data: {
        overview: overviewData,
        sessions: sessionsData,
        menuMap: CONFIG.MENU_MAP,
        event: CONFIG.EVENT
      }
    };

  } catch (e) {
    return {
      success: false,
      error: "데이터를 불러오는 중 오류가 발생했습니다: " + e.message
    };
  }
}
