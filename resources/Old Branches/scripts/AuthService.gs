/**
 * ============================================================
 * AuthService.gs — 로그인 인증 서비스
 * ============================================================
 * 역할: 사용자가 입력한 이름+사번을 ANE 탭에서 대조하여
 *       일치하면 로그인 성공, 불일치하면 실패를 반환한다.
 * 
 * CATS APP과의 차이:
 *   - CATS APP: Google 계정 이메일로 자동 인증 (Session.getActiveUser)
 *   - KSCTVA26: 이름+사번 수동 입력 → ANE 탭 대조 (학회 참석자용 간편 로그인)
 * 
 * 프론트엔드에서 호출:
 *   google.script.run
 *     .withSuccessHandler(onLoginSuccess)
 *     .withFailureHandler(onLoginFailure)
 *     .handleLogin(name, sn2);
 * ============================================================
 */

/**
 * 로그인 처리 메인 함수
 * 프론트엔드에서 google.script.run.handleLogin(name, sn2) 으로 호출
 * 
 * @param {string} name - 사용자가 입력한 이름
 * @param {string} sn2 - 사용자가 입력한 사번 (8자리 숫자)
 * @return {Object} 로그인 결과
 *   성공: { success: true, data: { name: "홍길동", sn2: "20240208" } }
 *   실패: { success: false, error: "이름 또는 사번이 일치하지 않습니다." }
 */
function handleLogin(name, sn2) {
  try {
    // ── 1. 입력값 기본 검증 ──
    // 이름과 사번이 빈 값이면 즉시 실패 처리
    if (!name || !sn2) {
      return {
        success: false,
        error: "이름과 사번을 모두 입력해주세요."
      };
    }

    // 앞뒤 공백 제거 (사용자가 실수로 공백을 넣는 경우 방지)
    var trimmedName = name.toString().trim();
    var trimmedSN2 = sn2.toString().trim();

    // ── 2. ANE 시트에서 데이터 가져오기 ──
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    var aneSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.ANE);

    // ANE 탭이 존재하지 않으면 오류 반환
    if (!aneSheet) {
      return {
        success: false,
        error: "시스템 오류: ANE 시트를 찾을 수 없습니다."
      };
    }

    // 전체 데이터 가져오기 (헤더 포함)
    var data = aneSheet.getDataRange().getValues();

    // 데이터가 헤더만 있거나 비어있으면 오류
    if (data.length < 2) {
      return {
        success: false,
        error: "시스템 오류: ANE 데이터가 비어있습니다."
      };
    }

    // ── 3. 이름+사번 대조 ──
    // 1행은 헤더이므로 2행(index 1)부터 검색
    var colSN2 = CONFIG.ANE_COLUMNS.SN2;    // 사번 열 (0)
    var colName = CONFIG.ANE_COLUMNS.NAME;  // 이름 열 (1)

    for (var i = 1; i < data.length; i++) {
      var rowSN2 = data[i][colSN2].toString().trim();
      var rowName = data[i][colName].toString().trim();

      // 사번과 이름이 모두 일치하면 로그인 성공
      if (rowSN2 === trimmedSN2 && rowName === trimmedName) {
        return {
          success: true,
          data: {
            name: rowName,
            sn2: rowSN2
          }
        };
      }
    }

    // ── 4. 일치하는 항목이 없으면 실패 ──
    return {
      success: false,
      error: "이름 또는 사번이 일치하지 않습니다."
    };

  } catch (e) {
    // ── 5. 예외 발생 시 오류 반환 ──
    return {
      success: false,
      error: "서버 오류가 발생했습니다: " + e.message
    };
  }
}
