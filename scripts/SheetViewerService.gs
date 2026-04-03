/**
 * ============================================================
 * SheetViewerService.gs — 외부 시트 데이터 조회 서비스
 * ============================================================
 * 역할: Sheets Viewer 페이지(ane1235.github.io/sheets/)에서
 *       외부 Google Sheets 데이터를 읽어 JSON으로 반환한다.
 *
 * 설치 방법:
 *   1. 이 파일의 내용을 Apps Script 편집기에 새 .gs 파일로 추가
 *   2. doGet/doPost 라우터에 아래 action 분기를 추가:
 *
 *      if (action === 'getSheetList')  → return asJson(getSheetList());
 *      if (action === 'getSheetData')  → return asJson(getSheetData(params.sheetKey, params.gid));
 *
 *   3. 두 스프레드시트를 Apps Script 실행 계정(kayen1978@gmail.com)에게
 *      "뷰어" 이상 권한으로 공유
 *   4. 새 버전으로 배포
 *
 * 데이터 소스:
 *   SHEET_VIEWER_SOURCES 배열에 정의된 스프레드시트에서 데이터를 읽는다.
 * ============================================================
 */

/* ── 외부 시트 소스 정의 ── */
var SHEET_VIEWER_SOURCES = [
  {
    key: 'sheet1',
    spreadsheetId: '1oetk8kh8SwC5cmlqpO7Kl_RFZqfID3Sm6oF214r8upo',
    defaultGid: 1181166797,
    label: '시트 1'
  },
  {
    key: 'sheet2',
    spreadsheetId: '1wmNAd3fjIkt0q8ytZFGB7jlw148cW_STdDAh_sosTzw',
    defaultGid: 568469962,
    label: '시트 2'
  }
];

/**
 * 시트 목록 반환 — 프론트엔드가 탭 UI를 구성할 때 사용
 *
 * @return {Object}
 *   { success: true, data: [
 *       { key: 'sheet1', label: '시트 1', tabs: [{ name: 'Sheet1', gid: 0 }, ...] },
 *       { key: 'sheet2', label: '시트 2', tabs: [...] }
 *   ]}
 */
function getSheetList() {
  try {
    var result = [];
    for (var i = 0; i < SHEET_VIEWER_SOURCES.length; i++) {
      var src = SHEET_VIEWER_SOURCES[i];
      var ss = SpreadsheetApp.openById(src.spreadsheetId);
      var sheets = ss.getSheets();
      var tabs = [];
      for (var j = 0; j < sheets.length; j++) {
        tabs.push({
          name: sheets[j].getName(),
          gid: sheets[j].getSheetId()
        });
      }
      result.push({
        key: src.key,
        label: ss.getName(),    // 실제 스프레드시트 이름 사용
        tabs: tabs,
        defaultGid: src.defaultGid
      });
    }
    return { success: true, data: result };
  } catch (e) {
    return { success: false, error: '시트 목록 조회 오류: ' + e.message };
  }
}

/**
 * 특정 시트의 특정 탭 데이터를 2D 배열로 반환
 *
 * @param {string} sheetKey - 'sheet1' 또는 'sheet2'
 * @param {number|string} gid - 탭의 gid (생략 시 defaultGid 사용)
 * @return {Object}
 *   { success: true, data: { headers: [...], rows: [[...], ...], tabName: '...' } }
 */
function getSheetData(sheetKey, gid) {
  try {
    /* 소스 찾기 */
    var src = null;
    for (var i = 0; i < SHEET_VIEWER_SOURCES.length; i++) {
      if (SHEET_VIEWER_SOURCES[i].key === sheetKey) {
        src = SHEET_VIEWER_SOURCES[i];
        break;
      }
    }
    if (!src) {
      return { success: false, error: '알 수 없는 시트 키: ' + sheetKey };
    }

    var ss = SpreadsheetApp.openById(src.spreadsheetId);

    /* gid로 탭 찾기 */
    var targetGid = (gid !== undefined && gid !== null && gid !== '')
      ? parseInt(gid, 10) : src.defaultGid;
    var targetSheet = null;
    var allSheets = ss.getSheets();
    for (var j = 0; j < allSheets.length; j++) {
      if (allSheets[j].getSheetId() === targetGid) {
        targetSheet = allSheets[j];
        break;
      }
    }

    if (!targetSheet) {
      return { success: false, error: '탭을 찾을 수 없습니다 (gid: ' + targetGid + ')' };
    }

    /* 데이터 읽기 */
    var values = targetSheet.getDataRange().getValues();
    if (values.length === 0) {
      return { success: true, data: { headers: [], rows: [], tabName: targetSheet.getName() } };
    }

    /* 1행 = 헤더, 나머지 = 데이터 행 */
    var headers = values[0].map(function(h) { return h.toString(); });
    var rows = values.slice(1).map(function(row) {
      return row.map(function(cell) {
        /* Date 객체 → 문자열 변환 (JSON 직렬화 안전) */
        if (cell instanceof Date) {
          return Utilities.formatDate(cell, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
        }
        return cell;
      });
    });

    return {
      success: true,
      data: {
        headers: headers,
        rows: rows,
        tabName: targetSheet.getName()
      }
    };

  } catch (e) {
    return { success: false, error: '시트 데이터 조회 오류: ' + e.message };
  }
}
