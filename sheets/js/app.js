/* 근무 대시보드 — app.js V3.0 */
/* Assign Note 시트에서 선택 날짜의 수술 일정을 파싱하여 표시 */

/* ── 전역 ── */
var sheetSources = [];
var DISPLAY_LABELS = { sheet1: 'ASSIGN', sheet2: '근무표 및 특기사항' };
var assignDataCache = {};   /* gid → raw sheet data 캐시 */

/* ── 열 간격 상수 ── */
var DAY_COL_SPAN = 10;     /* 각 날짜가 차지하는 열 수 */
/* 요일 헤더 열 위치: 일=1, 월=11, 화=21, 수=31, 목=41, 금=51, 토=61 */
var WEEKDAY_COLS = [1, 11, 21, 31, 41, 51, 61];

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
  var dashboard = document.getElementById('dashboard');
  loading.classList.remove('hidden');
  dashboard.classList.add('hidden');

  callApi({ action: 'getSheetList' })
    .then(function(result) {
      if (!result.success) {
        loading.innerHTML = '<p class="text-danger text-center py-10">' + escHtml(result.error) + '</p>';
        return;
      }
      sheetSources = result.data;
      loading.classList.add('hidden');
      dashboard.classList.remove('hidden');
      refreshDashboard();
    })
    .catch(function(err) {
      loading.innerHTML = '<p class="text-danger text-center py-10">서버 연결 오류: ' + escHtml(err.message) + '</p>';
    });
}

/* ═══════════════════════════════════════════
   대시보드 렌더링
   ═══════════════════════════════════════════ */

function refreshDashboard() {
  var dashboard = document.getElementById('dashboard');
  if (!dashboard) return;

  var html = '<div class="view-container">';
  html += '<div class="page-title">';
  html += '<span class="material-icons" style="font-size:28px; margin-right:8px;">assignment</span>';
  html += '오늘 근무 및 할 일들';
  html += '</div>';
  html += renderDateCounter();
  html += renderSectionCards();
  html += '</div>';
  dashboard.innerHTML = html;

  /* Assign Note 데이터 로드 */
  loadAssignData();
}

/* ═══════════════════════════════════════════
   탭 매칭
   ═══════════════════════════════════════════ */

function findAssignNoteTab(src) {
  var d = selectedDate;
  var y = d.getFullYear();
  var m = d.getMonth() + 1;
  var pattern1 = y + '년 ' + m + '월';
  var pattern2 = y + '년 ' + (m < 10 ? '0' + m : m) + '월';

  for (var i = 0; i < src.tabs.length; i++) {
    var name = src.tabs[i].name.trim();
    if (name === pattern1 || name === pattern2) return src.tabs[i];
  }
  for (var j = 0; j < src.tabs.length; j++) {
    var n = src.tabs[j].name;
    if (n.indexOf(y + '') >= 0 && n.indexOf(m + '월') >= 0) return src.tabs[j];
  }
  return null;
}

function findShiftTab(src) {
  var d = selectedDate;
  var dTime = d.getTime();

  for (var i = 0; i < src.tabs.length; i++) {
    var range = parseShiftPeriod(src.tabs[i].name.trim());
    if (range && dTime >= range.start.getTime() && dTime <= range.end.getTime()) {
      return src.tabs[i];
    }
  }

  var y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
  var periodMonth = day < 16 ? (m === 0 ? 12 : m) : m + 1;
  for (var j = 0; j < src.tabs.length; j++) {
    var n = src.tabs[j].name;
    if (n.indexOf(periodMonth + '월') >= 0 || n.indexOf(periodMonth + '/') >= 0) return src.tabs[j];
  }
  return null;
}

function parseShiftPeriod(name) {
  var m = name.match(/(\d{1,2})[\/\.](\d{1,2})\s*[~\-]\s*(\d{1,2})[\/\.](\d{1,2})/);
  if (m) {
    var y = selectedDate.getFullYear();
    var start = new Date(y, parseInt(m[1]) - 1, parseInt(m[2]), 0, 0, 0);
    var end = new Date(y, parseInt(m[3]) - 1, parseInt(m[4]), 23, 59, 59);
    if (end < start) end.setFullYear(y + 1);
    return { start: start, end: end };
  }
  var m2 = name.match(/(\d{1,2})월\s*(\d{1,2})일?\s*[~\-]\s*(\d{1,2})월\s*(\d{1,2})일?/);
  if (m2) {
    var y2 = selectedDate.getFullYear();
    var start2 = new Date(y2, parseInt(m2[1]) - 1, parseInt(m2[2]), 0, 0, 0);
    var end2 = new Date(y2, parseInt(m2[3]) - 1, parseInt(m2[4]), 23, 59, 59);
    if (end2 < start2) end2.setFullYear(y2 + 1);
    return { start: start2, end: end2 };
  }
  return null;
}

/* ═══════════════════════════════════════════
   섹션 카드 렌더링
   ═══════════════════════════════════════════ */

function renderSectionCards() {
  if (sheetSources.length === 0) {
    return '<p class="text-center py-10 text-gray-500">조회 가능한 시트가 없습니다.</p>';
  }

  var html = '';
  for (var i = 0; i < sheetSources.length; i++) {
    var src = sheetSources[i];
    var label = DISPLAY_LABELS[src.key] || src.label;
    var isAssign = (src.key === 'sheet1');
    var matchedTab = isAssign ? findAssignNoteTab(src) : findShiftTab(src);

    html += '<div class="section-card">';
    html += '<div class="section-card-header">';
    html += '<span class="material-icons" style="font-size:20px; margin-right:8px;">' + (isAssign ? 'note_alt' : 'schedule') + '</span>';
    html += '<span class="section-source-label">' + escHtml(label) + '</span>';
    html += '</div>';

    if (matchedTab) {
      html += '<div class="section-subtitle">' + escHtml(matchedTab.name) + '</div>';
      html += '<div class="section-content" id="section-data-' + escHtml(src.key) + '">';
      if (isAssign) {
        html += '<div class="text-center" style="padding:20px;"><div class="spinner mb-2"></div><p class="text-gray-400 text-sm">수술 일정을 불러오는 중...</p></div>';
      } else {
        html += '<p class="text-gray-400 text-sm" style="padding:20px; text-align:center;">데이터 영역 (레이아웃 구상 중)</p>';
      }
      html += '</div>';
    } else {
      html += renderNoMatch(src);
    }
    html += '</div>';
  }
  return html;
}

function renderNoMatch(src) {
  var html = '<div class="section-no-match">';
  html += '<span class="material-icons" style="font-size:20px; color:#94a3b8;">search_off</span>';
  html += '<span>선택한 날짜에 해당하는 탭을 찾지 못했습니다.</span>';
  html += '</div>';
  if (src.tabs && src.tabs.length > 0) {
    html += '<div class="section-tabs-hint">';
    html += '<span class="text-xs text-gray-400">사용 가능한 탭: </span>';
    for (var t = 0; t < Math.min(src.tabs.length, 6); t++) {
      html += '<span class="hint-tab">' + escHtml(src.tabs[t].name) + '</span>';
    }
    if (src.tabs.length > 6) html += '<span class="text-xs text-gray-400">외 ' + (src.tabs.length - 6) + '개</span>';
    html += '</div>';
  }
  return html;
}

/* ═══════════════════════════════════════════
   Assign Note 데이터 로드 및 파싱
   ═══════════════════════════════════════════ */

function loadAssignData() {
  var src = null;
  for (var i = 0; i < sheetSources.length; i++) {
    if (sheetSources[i].key === 'sheet1') { src = sheetSources[i]; break; }
  }
  if (!src) return;

  var tab = findAssignNoteTab(src);
  if (!tab) return;

  var container = document.getElementById('section-data-sheet1');
  if (!container) return;

  /* 캐시 확인 */
  var cacheKey = tab.gid;
  if (assignDataCache[cacheKey]) {
    renderAssignSection(assignDataCache[cacheKey], container);
    return;
  }

  callApi({ action: 'getSheetData', sheetKey: 'sheet1', gid: tab.gid })
    .then(function(result) {
      if (!result.success) {
        container.innerHTML = '<p class="text-danger text-sm" style="padding:16px;">' + escHtml(result.error) + '</p>';
        return;
      }
      /* 캐시 저장: headers를 rows 앞에 삽입하여 전체 2D 배열로 */
      var allRows = [result.data.headers].concat(result.data.rows);
      assignDataCache[cacheKey] = allRows;
      renderAssignSection(allRows, container);
    })
    .catch(function(err) {
      container.innerHTML = '<p class="text-danger text-sm" style="padding:16px;">로드 오류: ' + escHtml(err.message) + '</p>';
    });
}

/* ═══════════════════════════════════════════
   Assign Note 파싱 — 날짜 컬럼 찾기
   ═══════════════════════════════════════════ */

/**
 * 2D 배열에서 선택된 날짜의 데이터 컬럼 시작 위치와 행 범위를 찾는다.
 *
 * 시트 구조:
 *   - 행 1 (rows[1]): 요일 헤더 (일=col1, 월=col11, ..., 토=col61)
 *   - 날짜 행: 날짜 숫자가 해당 요일 열+1 위치에 배치
 *   - 날짜 행 아래: 해당 날짜의 이벤트 데이터 (다음 날짜 행까지)
 *   - 각 날짜는 10열 블록 (요일헤더열 ~ 요일헤더열+9)
 *
 * @return {Object|null} { colStart, colEnd, dataStartRow, dataEndRow }
 */
function findDatePosition(rows, targetDay) {
  /* 모든 행을 스캔하여 날짜 숫자가 있는 위치 찾기 */
  var datePositions = [];  /* { row, col, day } */

  for (var r = 1; r < rows.length; r++) {
    var row = rows[r];
    if (!row) continue;

    /* 요일 헤더 열 +1 위치에서 날짜 숫자 검색 */
    for (var w = 0; w < WEEKDAY_COLS.length; w++) {
      var dateCol = WEEKDAY_COLS[w] + 1;
      if (dateCol >= row.length) continue;
      var val = row[dateCol];
      if (val === '' || val === null || val === undefined) continue;

      var num = parseInt(val);
      if (!isNaN(num) && num >= 1 && num <= 31 && num.toString() === val.toString().trim()) {
        datePositions.push({ row: r, col: WEEKDAY_COLS[w], day: num });
      }
    }
  }

  /* 타깃 날짜 찾기 */
  var target = null;
  var targetIdx = -1;
  for (var d = 0; d < datePositions.length; d++) {
    if (datePositions[d].day === targetDay) {
      target = datePositions[d];
      targetIdx = d;
      break;
    }
  }
  if (!target) return null;

  /* 같은 주(같은 날짜 행)의 다음 날짜 행을 찾아 데이터 범위 결정 */
  var dateRow = target.row;
  var nextDateRow = rows.length; /* 기본: 시트 끝까지 */

  /* 다음 날짜 행 찾기: 같은 열 블록이 아닌 다른 행에 날짜가 있는 경우 */
  for (var n = 0; n < datePositions.length; n++) {
    if (datePositions[n].row > dateRow && datePositions[n].row < nextDateRow) {
      nextDateRow = datePositions[n].row;
    }
  }

  return {
    colStart: target.col,       /* 요일 헤더 열 */
    colEnd: target.col + DAY_COL_SPAN - 1,
    dataStartRow: dateRow + 1,  /* 날짜 행 다음부터 */
    dataEndRow: nextDateRow - 1 /* 다음 날짜 행 직전까지 */
  };
}

/**
 * 날짜 블록에서 수술 이벤트 추출
 * 10열 블록 내 offset:
 *   [0]: 빈칸/기타  [1]: 시간  [2]: 집도의  [3]: 수술명
 *   [4-7]: 기타     [8]: 마취의 이니셜  [9]: 마취회복팀 간호사
 */
function extractEvents(rows, pos) {
  var events = [];

  for (var r = pos.dataStartRow; r <= pos.dataEndRow && r < rows.length; r++) {
    var row = rows[r];
    if (!row) continue;

    var c = pos.colStart;
    /* 10열 블록에서 데이터 추출 */
    var time    = cellStr(row, c + 1);
    var surgeon = cellStr(row, c + 2);
    var opName  = cellStr(row, c + 3);
    var anes    = cellStr(row, c + 8);
    var nurse   = cellStr(row, c + 9);

    /* 시간 또는 수술명이 있는 행만 이벤트로 인식 */
    if (!time && !opName && !surgeon) continue;

    /* 시간값이 Google Sheets Date (1899-12-30...) 형태이면 건너뜀 */
    if (time && time.indexOf('1899') >= 0) continue;

    events.push({
      time: time,
      surgeon: surgeon,
      opName: opName,
      anesthesiologist: anes,
      nurse: nurse
    });
  }
  return events;
}

function cellStr(row, colIdx) {
  if (!row || colIdx >= row.length) return '';
  var v = row[colIdx];
  if (v === null || v === undefined) return '';
  return v.toString().trim();
}

/* ═══════════════════════════════════════════
   Assign Note 렌더링
   ═══════════════════════════════════════════ */

function renderAssignSection(allRows, container) {
  var targetDay = selectedDate.getDate();
  var pos = findDatePosition(allRows, targetDay);

  if (!pos) {
    container.innerHTML = '<div class="section-no-match">'
      + '<span class="material-icons" style="font-size:20px; color:#94a3b8;">event_busy</span>'
      + '<span>' + targetDay + '일 데이터를 찾을 수 없습니다.</span>'
      + '</div>';
    return;
  }

  var events = extractEvents(allRows, pos);

  if (events.length === 0) {
    container.innerHTML = '<div class="section-no-match">'
      + '<span class="material-icons" style="font-size:20px; color:#94a3b8;">event_available</span>'
      + '<span>' + targetDay + '일: 등록된 수술 일정이 없습니다.</span>'
      + '</div>';
    return;
  }

  var html = '<div class="assign-table-wrap">';
  html += '<table class="assign-table">';
  html += '<thead><tr>';
  html += '<th class="col-time">시간</th>';
  html += '<th class="col-surgeon">집도의</th>';
  html += '<th class="col-opname">수술명</th>';
  html += '<th class="col-anes">마취</th>';
  html += '<th class="col-nurse">회복간호사</th>';
  html += '</tr></thead>';
  html += '<tbody>';

  for (var i = 0; i < events.length; i++) {
    var ev = events[i];
    html += '<tr>';
    html += '<td class="col-time">' + escHtml(ev.time) + '</td>';
    html += '<td class="col-surgeon">' + escHtml(ev.surgeon) + '</td>';
    html += '<td class="col-opname">' + escHtml(ev.opName) + '</td>';
    html += '<td class="col-anes">' + escHtml(ev.anesthesiologist) + '</td>';
    html += '<td class="col-nurse">' + escHtml(ev.nurse) + '</td>';
    html += '</tr>';
  }

  html += '</tbody></table></div>';
  html += '<p class="text-xs text-gray-400 mt-2" style="padding:0 16px 8px; text-align:right;">' + events.length + '건</p>';

  container.innerHTML = html;
}
