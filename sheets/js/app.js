/* Sheets Viewer — app.js V1.0 */
/* Google Sheets 데이터를 읽어와 테이블로 렌더링 */

function initApp() {
  document.getElementById('view-login').classList.add('hidden');
  document.getElementById('app-container').classList.remove('hidden');
  document.getElementById('user-display').textContent = state.user.name;

  showWipScreen();
}

/* ── 공사중 화면 ── */

function showWipScreen() {
  var loading = document.getElementById('loading-screen');
  var content = document.getElementById('sheet-content');
  loading.classList.add('hidden');
  content.classList.remove('hidden');

  var html = '';
  html += '<div class="view-container">';
  html += '<div class="wip-banner">';
  html += '<span class="material-icons">construction</span>';
  html += '<h2 class="text-lg font-bold mt-2" style="color:#92400e;">공사중</h2>';
  html += '<p class="text-sm mt-2" style="color:#78350f;">이 페이지는 현재 개발 중입니다.</p>';
  html += '<p class="text-xs mt-1" style="color:#a16207;">Google Sheets 데이터 뷰어가 곧 추가됩니다.</p>';
  html += '</div>';

  /* 샘플 테이블 — 실제 시트 연동 전 레이아웃 확인용 */
  html += '<div style="margin-top:16px;">';
  html += '<div class="sheet-tabs">';
  html += '<div class="sheet-tab active">Sheet1</div>';
  html += '<div class="sheet-tab">Sheet2</div>';
  html += '</div>';
  html += '<table class="sheet-table">';
  html += '<thead><tr>';
  html += '<th>A</th><th>B</th><th>C</th><th>D</th>';
  html += '</tr></thead>';
  html += '<tbody>';
  for (var i = 1; i <= 5; i++) {
    html += '<tr>';
    html += '<td>Row ' + i + '</td>';
    html += '<td>샘플 데이터</td>';
    html += '<td>—</td>';
    html += '<td>—</td>';
    html += '</tr>';
  }
  html += '</tbody></table>';
  html += '</div>';
  html += '</div>';

  content.innerHTML = html;
}

/* ── 시트 데이터 로드 (향후 구현) ── */

function loadSheetData(tabName) {
  /* TODO: Apps Script에 getSheetData action 추가 후 구현 */
  /* callApi({ action: 'getSheetData', tab: tabName, sn2: state.user.sn2 }) */
}

/* ── 시트 데이터 렌더링 (향후 구현) ── */

function renderSheet(data) {
  /* TODO: 2D 배열 데이터를 sheet-table로 렌더링 */
}
