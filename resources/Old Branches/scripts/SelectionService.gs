/**
 * ============================================================
 * SelectionService.gs — 강좌 선택 저장/로드 서비스
 * ============================================================
 * 역할: 사용자가 세션별 페이지에서 강좌를 선택/해제할 때마다
 *       Selections 탭에 저장하고, MyPage에서 불러올 때 로드한다.
 * 
 * Selections 탭 구조:
 *   A열 (SN2)       | B열 (selections)
 *   20240208         | ["Day1_A1_R5","Day1_P2_R6"]
 *   20180052         | ["Day2_A1_R5"]
 * 
 * 강좌 ID 체계:
 *   형식: "탭이름_R행번호" (예: "Day1_A1_R5")
 *   - 탭이름: 시트 탭 이름 (Day1_A1, Day1_P1 등)
 *   - R행번호: 해당 탭 데이터에서의 행 인덱스 (0-based)
 *   - 프론트엔드에서 이 ID로 원본 강좌 데이터를 역추적한다
 * 
 * 프론트엔드에서 호출:
 *   google.script.run.getSelections(sn2);
 *   google.script.run.saveSelections(sn2, selectionsArray);
 * ============================================================
 */

/**
 * 특정 사용자의 강좌 선택 목록을 불러오기
 * 
 * @param {string} sn2 - 사번 (8자리)
 * @return {Object} 선택 목록
 *   성공: { success: true, data: ["Day1_A1_R5", "Day1_P2_R6"] }
 *   미등록: { success: true, data: [] }  (아직 선택한 강좌가 없음)
 *   오류: { success: false, error: "..." }
 */
function getSelections(sn2) {
  try {
    // ── 입력값 검증 ──
    if (!sn2) {
      return { success: false, error: "사번이 필요합니다." };
    }

    var trimmedSN2 = sn2.toString().trim();
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    var selSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SELECTIONS);

    // Selections 탭이 없으면 빈 배열 반환 (첫 사용 시)
    if (!selSheet) {
      return { success: true, data: [] };
    }

    var data = selSheet.getDataRange().getValues();

    // 헤더만 있거나 비어있으면 빈 배열
    if (data.length < 2) {
      return { success: true, data: [] };
    }

    // ── 사번으로 행 검색 ──
    var colSN2 = CONFIG.SEL_COLUMNS.SN2;          // 0
    var colSel = CONFIG.SEL_COLUMNS.SELECTIONS;    // 1

    for (var i = 1; i < data.length; i++) {
      if (data[i][colSN2].toString().trim() === trimmedSN2) {
        // B열의 JSON 문자열을 파싱하여 배열로 반환
        var rawValue = data[i][colSel];
        if (!rawValue || rawValue.toString().trim() === "") {
          return { success: true, data: [] };
        }
        try {
          var parsed = JSON.parse(rawValue);
          // 배열이 아닌 경우 방어 처리
          if (!Array.isArray(parsed)) {
            return { success: true, data: [] };
          }
          return { success: true, data: parsed };
        } catch (parseErr) {
          // JSON 파싱 실패 시 빈 배열 (데이터 손상 방어)
          return { success: true, data: [] };
        }
      }
    }

    // 해당 사번의 행이 없으면 빈 배열 (아직 선택한 적 없음)
    return { success: true, data: [] };

  } catch (e) {
    return {
      success: false,
      error: "선택 목록을 불러오는 중 오류: " + e.message
    };
  }
}


/**
 * 특정 사용자의 강좌 선택 목록을 저장
 * 해당 사번의 행이 이미 있으면 덮어쓰기, 없으면 새 행 추가
 * 
 * @param {string} sn2 - 사번 (8자리)
 * @param {Array} selections - 선택한 강좌 ID 배열 (예: ["Day1_A1_R5", "Day1_P2_R6"])
 * @return {Object} 저장 결과
 *   성공: { success: true }
 *   오류: { success: false, error: "..." }
 */
function saveSelections(sn2, selections) {
  try {
    // ── 입력값 검증 ──
    if (!sn2) {
      return { success: false, error: "사번이 필요합니다." };
    }
    // selections가 배열이 아니면 빈 배열로 기본값 설정
    if (!Array.isArray(selections)) {
      selections = [];
    }

    var trimmedSN2 = sn2.toString().trim();
    var selectionsJSON = JSON.stringify(selections);

    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    var selSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SELECTIONS);

    // Selections 탭이 없으면 생성 (안전장치)
    if (!selSheet) {
      selSheet = ss.insertSheet(CONFIG.SHEET_NAMES.SELECTIONS);
      selSheet.getRange("A1:B1").setValues([["SN2", "selections"]]);
    }

    var data = selSheet.getDataRange().getValues();
    var colSN2 = CONFIG.SEL_COLUMNS.SN2;  // 0

    // ── 기존 행 찾기 ──
    for (var i = 1; i < data.length; i++) {
      if (data[i][colSN2].toString().trim() === trimmedSN2) {
        // 기존 행의 B열(selections)을 덮어쓰기
        // 행 번호는 i+1 (시트는 1-based)
        selSheet.getRange(i + 1, 2).setValue(selectionsJSON);
        return { success: true };
      }
    }

    // ── 기존 행이 없으면 마지막 행 다음에 새 행 추가 ──
    var lastRow = selSheet.getLastRow();
    selSheet.getRange(lastRow + 1, 1, 1, 2).setValues([[trimmedSN2, selectionsJSON]]);

    return { success: true };

  } catch (e) {
    return {
      success: false,
      error: "선택 목록 저장 중 오류: " + e.message
    };
  }
}
