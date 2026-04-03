/* Sheets Viewer — app.js V1.0 */
/* Google Sheets 데이터를 Apps Script 경유로 읽어와 테이블로 렌더링 */

/* ── 전역 ── */
var sheetSources = [];   /* getSheetList 결과 캐시 */
var currentSheetKey = null;
var currentGid = null;

function initApp() {
  document.getElementById('view-login').classList.add('hidden');
  document.getElementById('app-container').classList.remove('hidden');
  document.getElementById('user-display').textContent = state.user.name;

  loadSheetList();
}

/* ═══════════════════════════════════════════
   시트 목록 로드
   ═══════════════════════════════════════════ */

function loadSheetList() {
  var loading = document.getElementById('loading-screen');
  var content = document.getElementById('sheet-content');
  loading.classList.remove('hidden');
  content.classList.add('hidden');

  callApi({ action: 'getSheetList' })
    .then(function(result) {
      if (!result.success) {
        loading.innerHTML = '<p class="text-danger text-center py-10">' + escHtml(result.error) + '</p>';
        return;
      }
      sheetSources = result.data;
      loading.classList.add('hidden');
      content.classList.remove('hidden');

      /* 첫 번째 시트의 defaultGid 탭을 자동 로드 */
      if (sheetSources.length > 0) {
        var first = sheetSources[0];
        currentSheetKey = first.key;
        currentGid = first.defaultGid;
        renderSheetSelector();
        loadSheetData(currentSheetKey, currentGid);
      } else {
        content.innerHTML = '<p class="text-center py-10 text-gray-500">조회 가능한 시트가 없습니다.</p>';
      }
    })
    .catch(function(err) {
      loading.innerHTML = '<p class="text-danger text-center py-10">서버 연결 오류: ' + escHtml(err.message) + '</p>';
    });
}

/* ═══════════════════════════════════════════
   시트/탭 선택 UI
   ═══════════════════════════════════════════ */

function renderSheetSelector() {
  var content = document.getElementById('sheet-content');

  /* 시트 소스 선택 (상단) */
  var html = '<div class="view-container">';

  /* 스프레드시트 선택 탭 */
  html += '<div class="sheet-tabs" id="source-tabs">';
  for (var i = 0; i < sheetSources.length; i++) {
    var src = sheetSources[i];
    var active = (src.key === currentSheetKey) ? ' active' : '';
    html += '<div class="sheet-tab source-tab' + active + '" data-key="' + escHtml(src.key) + '" '
          + 'data-gid="' + src.defaultGid + '" '
          + 'onclick="switchSource(\'' + escHtml(src.key) + '\',' + src.defaultGid + ')">'
          + '<span class="material-icons" style="font-size:16px; vertical-align:middle; margin-right:4px;">description</span>'
          + escHtml(src.label)
          + '</div>';
  }
  html += '</div>';

  /* 탭(시트 내부 탭) 선택 */
  html += '<div class="sheet-tabs" id="tab-tabs" style="margin-top:-8px; margin-bottom:12px;"></div>';

  /* 데이터 테이블 영역 */
  html += '<div id="table-area"><div class="text-center py-10"><div class="spinner mb-4"></div><p class="text-gray-500">데이터를 불러오는 중...</p></div></div>';
  html += '</div>';

  content.innerHTML = html;

  /* 현재 시트의 탭 목록 렌더링 */
  renderTabSelector();
}

function renderTabSelector() {
  var tabContainer = document.getElementById('tab-tabs');
  if (!tabContainer) return;

  var src = null;
  for (var i = 0; i < sheetSources.length; i++) {
    if (sheetSources[i].key === currentSheetKey) { src = sheetSources[i]; break; }
  }
  if (!src || !src.tabs) { tabContainer.innerHTML = ''; return; }

  var html = '';
  for (var j = 0; j < src.tabs.length; j++) {
    var tab = src.tabs[j];
    var active = (tab.gid === currentGid) ? ' active' : '';
    html += '<div class="sheet-tab' + active + '" '
          + 'onclick="switchTab(\'' + escHtml(currentSheetKey) + '\',' + tab.gid + ')">'
          + escHtml(tab.name) + '</div>';
  }
  tabContainer.innerHTML = html;
}

/* ═══════════════════════════════════════════
   시트/탭 전환
   ═══════════════════════════════════════════ */

function switchSource(sheetKey, defaultGid) {
  currentSheetKey = sheetKey;
  currentGid = defaultGid;

  /* 소스 탭 활성화 상태 업데이트 */
  var sourceTabs = document.querySelectorAll('.source-tab');
  for (var i = 0; i < sourceTabs.length; i++) {
    sourceTabs[i].classList.toggle('active', sourceTabs[i].getAttribute('data-key') === sheetKey);
  }

  renderTabSelector();
  loadSheetData(sheetKey, defaultGid);
}

function switchTab(sheetKey, gid) {
  currentGid = gid;
  renderTabSelector();
  loadSheetData(sheetKey, gid);
}

/* ═══════════════════════════════════════════
   시트 데이터 로드 및 렌더링
   ═══════════════════════════════════════════ */

function loadSheetData(sheetKey, gid) {
  var area = document.getElementById('table-area');
  area.innerHTML = '<div class="text-center py-10"><div class="spinner mb-4"></div><p class="text-gray-500">데이터를 불러오는 중...</p></div>';

  callApi({ action: 'getSheetData', sheetKey: sheetKey, gid: gid })
    .then(function(result) {
      if (!result.success) {
        area.innerHTML = '<p class="text-danger text-center py-10">' + escHtml(result.error) + '</p>';
        return;
      }
      renderTable(result.data);
    })
    .catch(function(err) {
      area.innerHTML = '<p class="text-danger text-center py-10">데이터 로드 오류: ' + escHtml(err.message) + '</p>';
    });
}

function renderTable(data) {
  var area = document.getElementById('table-area');

  if (!data.headers || data.headers.length === 0) {
    area.innerHTML = '<p class="text-center py-10 text-gray-500">데이터가 비어 있습니다.</p>';
    return;
  }

  var html = '<div style="overflow-x:auto; -webkit-overflow-scrolling:touch;">';
  html += '<table class="sheet-table">';

  /* 헤더 */
  html += '<thead><tr>';
  for (var h = 0; h < data.headers.length; h++) {
    html += '<th>' + escHtml(data.headers[h]) + '</th>';
  }
  html += '</tr></thead>';

  /* 데이터 행 */
  html += '<tbody>';
  if (data.rows.length === 0) {
    html += '<tr><td colspan="' + data.headers.length + '" class="text-center text-gray-400" style="padding:20px;">데이터 없음</td></tr>';
  } else {
    for (var r = 0; r < data.rows.length; r++) {
      html += '<tr>';
      for (var c = 0; c < data.rows[r].length; c++) {
        var cellVal = data.rows[r][c];
        html += '<td>' + escHtml(cellVal !== null && cellVal !== undefined ? cellVal.toString() : '') + '</td>';
      }
      html += '</tr>';
    }
  }
  html += '</tbody></table></div>';

  /* 행 수 표시 */
  html += '<p class="text-xs text-gray-400 mt-2 text-right">' + data.rows.length + '행 · ' + escHtml(data.tabName) + '</p>';

  area.innerHTML = html;
}
