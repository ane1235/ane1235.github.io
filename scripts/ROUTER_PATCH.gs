/**
 * ============================================================
 * ROUTER_PATCH.gs — doGet/doPost 라우터에 추가할 분기
 * ============================================================
 * 이 파일의 내용을 기존 doGet/doPost 라우터에 병합한다.
 * 새 파일로 추가하는 것이 아니라, 기존 라우터 함수 안에
 * 아래 분기를 추가한다.
 * ============================================================
 */

/* ── doGet 라우터에 추가 ── */
// 기존 doGet 함수의 action 분기 부분에 아래를 추가:

  if (action === 'getSheetList') {
    return asJson(getSheetList());
  }
  if (action === 'getSheetData') {
    return asJson(getSheetData(params.sheetKey, params.gid));
  }

/* ── asJson 헬퍼 (없으면 추가) ── */
// ContentService로 JSON 응답을 반환하는 헬퍼
// 이미 있으면 추가 불필요

function asJson(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
