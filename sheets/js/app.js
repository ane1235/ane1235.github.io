/* 근무 대시보드 — app.js V4.0 */
/* Assign Note 시트에서 선택 날짜의 수술 일정을 파싱하여 표시 */

/* ── 전역 ── */
var sheetSources = [];
var DISPLAY_LABELS = { sheet1: 'ASSIGN', sheet2: '근무표 및 특기사항' };
var assignDataCache = {};

/* CATH 집도의 명단 — 이 집도의들의 수술명 앞에 "[CATH] " 접두사를 붙인다 */
var CATH_SURGEONS = ['방지석', '김정윤', '박상원', '박하욱', '김성호', '정현', '이의재'];

/*
 * ═══════════════════════════════════════════
 * 열 구조 (0-based index)
 * ═══════════════════════════════════════════
 * index 0    : 공백
 * index 1~10 : 일요일 (10열) — 별도 구조, 현재 미처리
 * index 11~21: 월요일 (11열)
 * index 22~32: 화요일 (11열)
 * index 33~43: 수요일 (11열)
 * index 44~54: 목요일 (11열)
 * index 55~65: 금요일 (11열)
 * index 66~74: 토요일 (9열) — 별도 구조, 현재 미처리
 *
 * 평일 11열 블록 (offset 0~10):
 *   0: 시간
 *   1: 집도의
 *   2~7: 수술 이름 (6열, 셀 병합 가능 → 비어있지 않은 값 합침)
 *   8: 담당 마취의 이니셜
 *   9: 담당 간호사 First
 *   10: 담당 간호사 Second
 *
 * 날짜 아래 3줄: 주간 근무자 근무표 → 건너뜀
 * 4줄째부터: 수술 이벤트 데이터
 */

/* 요일별 시작 열 인덱스 (0-based). JS Date.getDay(): 0=일,1=월,...,6=토 */
var WEEKDAY_COL_START = {
  0: 1,    /* 일 — 10열, 현재 미처리 */
  1: 11,   /* 월 */
  2: 22,   /* 화 */
  3: 33,   /* 수 */
  4: 44,   /* 목 */
  5: 55,   /* 금 */
  6: 66    /* 토 — 9열, 현재 미처리 */
};

var WEEKDAY_SKIP_ROWS = 3;  /* 날짜 아래 근무표 3줄 건너뜀 */

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
  html += renderDateCounter();
  html += renderSectionCards();
  html += '<p class="text-gray-400 text-sm" style="text-align:center; padding:20px 0;">created by Dr.Min Build 260405.2353</p>';
  html += '</div>';
  dashboard.innerHTML = html;

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
  var dow = selectedDate.getDay();
  var isWeekend = (dow === 0 || dow === 6);

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
      if (!isAssign) {
        html += '<div class="section-subtitle">' + escHtml(matchedTab.name) + '</div>';
      }
      html += '<div class="section-content" id="section-data-' + escHtml(src.key) + '">';
      if (isAssign) {
        if (isWeekend) {
          html += '<div class="section-no-match"><span class="material-icons" style="font-size:20px; color:#94a3b8;">weekend</span>';
          html += '<span>주말은 별도 구조로 되어 있어 현재 미지원입니다.</span></div>';
        } else {
          html += '<div class="text-center" style="padding:20px;"><div class="spinner mb-2"></div><p class="text-gray-400 text-sm">수술 일정을 불러오는 중...</p></div>';
        }
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
   Assign Note 데이터 로드
   ═══════════════════════════════════════════ */

function loadAssignData() {
  /* 주말이면 로드하지 않음 */
  var dow = selectedDate.getDay();
  if (dow === 0 || dow === 6) return;

  var src = null;
  for (var i = 0; i < sheetSources.length; i++) {
    if (sheetSources[i].key === 'sheet1') { src = sheetSources[i]; break; }
  }
  if (!src) return;

  var tab = findAssignNoteTab(src);
  if (!tab) return;

  var container = document.getElementById('section-data-sheet1');
  if (!container) return;

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
      var allRows = [result.data.headers].concat(result.data.rows);
      assignDataCache[cacheKey] = allRows;
      renderAssignSection(allRows, container);
    })
    .catch(function(err) {
      container.innerHTML = '<p class="text-danger text-sm" style="padding:16px;">로드 오류: ' + escHtml(err.message) + '</p>';
    });
}

/* ═══════════════════════════════════════════
   Assign Note 파싱 — 날짜 위치 찾기
   ═══════════════════════════════════════════ */

/**
 * 셀 값에서 앞부분 날짜 숫자를 추출한다.
 * "3" → 3, "10 Dr.Y 휴가" → 10, "abc" → NaN
 * 날짜 셀은 숫자로 시작하되 뒤에 휴가자 정보 등이 붙을 수 있다.
 */
function parseDateNum(val) {
  if (val === '' || val === null || val === undefined) return NaN;
  var s = val.toString().trim();
  if (!s) return NaN;
  /* 시간 패턴 제외: "4:30", "8:30A", "1:30P" 등 */
  if (/^\d{1,2}:/.test(s)) return NaN;
  var m = s.match(/^(\d{1,2})\b/);
  if (!m) return NaN;
  var num = parseInt(m[1]);
  return (num >= 1 && num <= 31) ? num : NaN;
}

/**
 * 선택된 날짜의 요일에 해당하는 열 블록에서 날짜를 찾는다.
 * @return {Object|null} { colStart, dateRow, dataStartRow, dataEndRow }
 */
function findDatePosition(rows, targetDay) {
  var dow = selectedDate.getDay();
  if (dow < 1 || dow > 5) return null;

  var colStart = WEEKDAY_COL_START[dow];

  /* 날짜 탐색: colStart ~ colStart+10 범위에서 targetDay 찾기 */
  var dateRow = -1;
  var dateCol = -1;  /* 날짜가 발견된 열을 기억 */
  for (var r = 0; r < rows.length; r++) {
    var row = rows[r];
    if (!row) continue;
    for (var c = colStart; c <= colStart + 10 && c < row.length; c++) {
      if (parseDateNum(row[c]) === targetDay) {
        dateRow = r;
        dateCol = c;
        break;
      }
    }
    if (dateRow >= 0) break;
  }

  if (dateRow < 0) return null;

  /* 다음 날짜 행 찾기: 같은 열(dateCol)에서만 다음 날짜를 탐색
     — 전체 블록을 검색하면 수술 시간 등 숫자가 날짜로 오인됨 */
  var nextDateRow = rows.length;
  for (var r2 = dateRow + 1; r2 < rows.length; r2++) {
    var row2 = rows[r2];
    if (!row2) continue;
    var dn = parseDateNum(row2[dateCol]);
    if (!isNaN(dn) && dn !== targetDay) {
      nextDateRow = r2;
      break;
    }
  }

  return {
    colStart: colStart,
    dateRow: dateRow,
    dataStartRow: dateRow + 1 + WEEKDAY_SKIP_ROWS,
    dataEndRow: nextDateRow - 1
  };
}

/**
 * 날짜 블록에서 수술 이벤트와 메모를 분리 추출
 * 평일 11열 블록 (offset 0~10):
 *   0: 시간, 1: 집도의, 2~7: 수술명(6열), 8: 마취의, 9: 간호사1, 10: 간호사2
 *
 * 판별 기준: 집도의(offset 1) 또는 마취의(offset 8)가 있으면 수술, 둘 다 없으면 메모
 * @return {{ events: Array, memos: Array }}
 */
function extractEvents(rows, pos) {
  var events = [];
  var memos = [];
  var base = pos.colStart;

  for (var r = pos.dataStartRow; r <= pos.dataEndRow && r < rows.length; r++) {
    var row = rows[r];
    if (!row) continue;

    var time    = cellStr(row, base + 0);
    var surgeon = cellStr(row, base + 1);

    /* 수술명: offset 2~7 (6열) — 비어있지 않은 값을 합침 */
    var opParts = [];
    for (var k = 2; k <= 7; k++) {
      var v = cellStr(row, base + k);
      if (v) opParts.push(v);
    }
    var opName = opParts.join(' ');

    var anes   = cellStr(row, base + 8);
    var nurse1 = cellStr(row, base + 9);
    var nurse2 = cellStr(row, base + 10);

    /* 빈 행 무시 */
    if (!time && !opName && !surgeon && !anes) continue;

    /* Google Sheets Date 유령값 필터링 */
    if (time && time.indexOf('1899') >= 0) continue;

    /* 집도의 또는 마취의가 있으면 수술, 없으면 메모 */
    if (surgeon || anes) {
      events.push({
        time: time,
        surgeon: surgeon,
        opName: opName,
        anesthesiologist: anes,
        nurse1: nurse1,
        nurse2: nurse2
      });
    } else {
      /* 메모: 시간 + 나머지 텍스트를 합쳐 하나의 메모 문자열로 */
      var memoParts = [];
      if (time) memoParts.push(time);
      if (opName) memoParts.push(opName);
      if (nurse1) memoParts.push(nurse1);
      if (nurse2) memoParts.push(nurse2);
      var memoText = memoParts.join(' ');
      if (memoText) memos.push(memoText);
    }
  }
  return { events: events, memos: memos };
}

function cellStr(row, colIdx) {
  if (!row || colIdx >= row.length) return '';
  var v = row[colIdx];
  if (v === null || v === undefined) return '';
  return v.toString().trim();
}

/**
 * 시간 텍스트 정규화:
 *   "8A", "10A" → 그대로 (숫자+A)
 *   "10:30A"    → "10:30" (콜론 포함 시 뒤의 A 제거)
 *   "1:30"      → "1:30"  (A 없으면 그대로)
 */
function normalizeTime(t) {
  if (!t) return t;
  if (t.indexOf(':') >= 0) return t.replace(/[AP]$/i, '');
  return t;
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

  var result = extractEvents(allRows, pos);
  var events = result.events;
  var memos = result.memos;

  if (events.length === 0 && memos.length === 0) {
    container.innerHTML = '<div class="section-no-match">'
      + '<span class="material-icons" style="font-size:20px; color:#94a3b8;">event_available</span>'
      + '<span>' + targetDay + '일: 등록된 수술 일정이 없습니다.</span>'
      + '</div>';
    return;
  }

  var html = '';

  /* 수술 테이블 */
  if (events.length > 0) {
    html += '<div class="assign-table-wrap">';
    html += '<table class="assign-table">';
    html += '<thead><tr>';
    html += '<th class="col-time">시간</th>';
    html += '<th class="col-surgeon">집도의</th>';
    html += '<th class="col-opname">수술명</th>';
    html += '<th class="col-anes">마취의</th>';
    html += '<th class="col-nurse">마취회복팀</th>';
    html += '</tr></thead>';
    html += '<tbody>';

    for (var i = 0; i < events.length; i++) {
      var ev = events[i];
      var nurseDisplay = ev.nurse1;
      if (ev.nurse2) {
        nurseDisplay = nurseDisplay ? nurseDisplay + ', ' + ev.nurse2 : ev.nurse2;
      }

      var displayOpName = (CATH_SURGEONS.indexOf(ev.surgeon) >= 0)
        ? '[CATH] ' + ev.opName
        : ev.opName;

      html += '<tr>';
      html += '<td class="col-time">' + escHtml(normalizeTime(ev.time)) + '</td>';
      html += '<td class="col-surgeon">' + escHtml(ev.surgeon) + '</td>';
      html += '<td class="col-opname">' + escHtml(displayOpName) + '</td>';
      html += '<td class="col-anes">' + escHtml(ev.anesthesiologist) + '</td>';
      html += '<td class="col-nurse">' + escHtml(nurseDisplay) + '</td>';
      html += '</tr>';
    }

    html += '</tbody></table></div>';
    html += '<p class="text-xs text-gray-400 mt-2" style="padding:0 16px 8px; text-align:right;">' + events.length + '건</p>';
  }

  /* 메모 박스 — 메모가 있을 때만 표시 */
  if (memos.length > 0) {
    html += '<div class="assign-memo-box">';
    html += '<div class="assign-memo-header">';
    html += '<span class="material-icons" style="font-size:18px;">sticky_note_2</span>';
    html += '<span>메모</span>';
    html += '</div>';
    html += '<ul class="assign-memo-list">';
    for (var m = 0; m < memos.length; m++) {
      html += '<li>' + escHtml(memos[m]) + '</li>';
    }
    html += '</ul>';
    html += '</div>';
  }

  container.innerHTML = html;
}
