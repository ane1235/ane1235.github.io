/**
 * ============================================================
 * Sheets Viewer — 독립 Apps Script 웹앱
 * ============================================================
 * 용도: ane1235.github.io/sheets/ 페이지의 백엔드 API
 *
 * ★ 설치 방법 (3단계):
 *   1. script.google.com → 새 프로젝트 생성 (예: "Sheets Viewer API")
 *   2. 이 파일 전체를 Code.gs에 붙여넣기
 *   3. 배포 → 웹 앱 → 실행 계정: 나, 액세스: 모든 사용자 → 배포
 *   4. 배포된 URL을 sheets/js/config.js의 API_URL에 설정
 *
 * ★ 로그인 인증:
 *   기존 KSCTVA 웹앱의 ANE 탭을 참조하여 동일한 이름+사번 인증 사용
 * ============================================================
 */

/* ═══════════════════════════════════════════
   설정
   ═══════════════════════════════════════════ */

/* KSCTVA 시트 (ANE 탭 = 로그인용) */
var KSCTVA_SHEET_ID = '12KeGjyFvpZ6cSkKsuMrxmCBpBTBRzY3p21xQc5gtOBI';

/* 외부 시트 소스 */
var SHEET_VIEWER_SOURCES = [
  {
    key: 'sheet1',
    spreadsheetId: '1oetk8kh8SwC5cmlqpO7Kl_RFZqfID3Sm6oF214r8upo',
    defaultGid: 1181166797
  },
  {
    key: 'sheet2',
    spreadsheetId: '1wmNAd3fjIkt0q8ytZFGB7jlw148cW_STdDAh_sosTzw',
    defaultGid: 568469962
  }
];

/* ═══════════════════════════════════════════
   웹앱 진입점
   ═══════════════════════════════════════════ */

function doGet(e) {
  var params = e.parameter || {};
  var action = params.action;

  if (action === 'login') {
    return asJson(handleLogin(params.name, params.sn2));
  }
  if (action === 'getSheetList') {
    return asJson(getSheetList());
  }
  if (action === 'getSheetData') {
    return asJson(getSheetData(params.sheetKey, params.gid));
  }

  return asJson({ success: false, error: 'Unknown action: ' + action });
}

function doPost(e) {
  /* 현재 POST 필요 없음 (읽기 전용) — 향후 확장 대비 */
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    return asJson({ success: false, error: 'Unknown POST action: ' + action });
  } catch (err) {
    return asJson({ success: false, error: 'Invalid request: ' + err.message });
  }
}

function asJson(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ═══════════════════════════════════════════
   로그인 (KSCTVA ANE 탭 참조)
   ═══════════════════════════════════════════ */

function handleLogin(name, sn2) {
  try {
    if (!name || !sn2) {
      return { success: false, error: '이름과 사번을 모두 입력해주세요.' };
    }

    var trimmedName = name.toString().trim();
    var trimmedSN2 = sn2.toString().trim();

    var ss = SpreadsheetApp.openById(KSCTVA_SHEET_ID);
    var aneSheet = ss.getSheetByName('ANE');
    if (!aneSheet) {
      return { success: false, error: '시스템 오류: ANE 시트를 찾을 수 없습니다.' };
    }

    var data = aneSheet.getDataRange().getValues();
    if (data.length < 2) {
      return { success: false, error: '시스템 오류: ANE 데이터가 비어있습니다.' };
    }

    for (var i = 1; i < data.length; i++) {
      var rowSN2 = data[i][0].toString().trim();
      var rowName = data[i][1].toString().trim();
      if (rowSN2 === trimmedSN2 && rowName === trimmedName) {
        return { success: true, data: { name: rowName, sn2: rowSN2 } };
      }
    }

    return { success: false, error: '이름 또는 사번이 일치하지 않습니다.' };
  } catch (e) {
    return { success: false, error: '서버 오류: ' + e.message };
  }
}

/* ═══════════════════════════════════════════
   시트 목록 조회
   ═══════════════════════════════════════════ */

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
        label: ss.getName(),
        tabs: tabs,
        defaultGid: src.defaultGid
      });
    }
    return { success: true, data: result };
  } catch (e) {
    return { success: false, error: '시트 목록 조회 오류: ' + e.message };
  }
}

/* ═══════════════════════════════════════════
   시트 데이터 조회
   ═══════════════════════════════════════════ */

function getSheetData(sheetKey, gid) {
  try {
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

    var dataRange = targetSheet.getDataRange();
    var values = dataRange.getValues();
    if (values.length === 0) {
      return { success: true, data: { headers: [], rows: [], fontColors: [], tabName: targetSheet.getName() } };
    }

    var fontColors = dataRange.getFontColors();
    /* 표시값(displayValues)은 퇴근시간 등 시간 포맷 셀을 그대로 가져오기 위해 별도 보존 */
    var displayValues = dataRange.getDisplayValues();

    var headers = values[0].map(function(h) { return h.toString(); });
    var rows = values.slice(1).map(function(row, ri) {
      return row.map(function(cell, ci) {
        if (cell instanceof Date) {
          /* 시간만 있는 셀(1899-12-30)은 표시값(예: "4:30") 그대로 반환 */
          var d = cell;
          if (d.getFullYear() === 1899 && d.getMonth() === 11 && d.getDate() === 30) {
            return displayValues[ri + 1][ci];
          }
          return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
        }
        return cell;
      });
    });

    /* fontColors[0] = 1행(headers), fontColors[1~] = rows와 동일 인덱스 */
    var rowFontColors = fontColors.slice(1);

    return {
      success: true,
      data: {
        headers: headers,
        rows: rows,
        fontColors: rowFontColors,
        tabName: targetSheet.getName()
      }
    };
  } catch (e) {
    return { success: false, error: '시트 데이터 조회 오류: ' + e.message };
  }
}
