/* 근무 대시보드 — app.js V2.0 */
/* 두 시트에서 오늘 날짜에 해당하는 탭을 찾아 대시보드로 표시 */

/* ── 전역 ── */
var sheetSources = [];

function initApp() {
  document.getElementById('view-login').classList.add('hidden');
  document.getElementById('app-container').classList.remove('hidden');
  document.getElementById('user-display').textContent = state.user.name;

  loadSheetList();
}

/* ═══════════════════════════════════════════
   시트 목록 로드 → 대시보드 렌더링
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

  /* 페이지 제목 */
  html += '<div class="page-title">';
  html += '<span class="material-icons" style="font-size:28px; margin-right:8px;">assignment</span>';
  html += '오늘 근무 및 할 일들';
  html += '</div>';

  /* 날짜 카운터 + 캘린더 */
  html += renderDateCounter();

  /* 섹션 카드들 */
  html += renderSectionCards();

  html += '</div>';
  dashboard.innerHTML = html;
}

/* ═══════════════════════════════════════════
   탭 매칭 로직
   ═══════════════════════════════════════════ */

/**
 * Assign Note 탭 매칭: "2026년 4월" 형태의 탭 이름에서 선택된 날짜의 연월과 일치하는 탭
 */
function findAssignNoteTab(src) {
  var d = selectedDate;
  var y = d.getFullYear();
  var m = d.getMonth() + 1;

  /* 패턴: "YYYY년 M월" 또는 "YYYY년 MM월" */
  var pattern1 = y + '년 ' + m + '월';
  var pattern2 = y + '년 ' + (m < 10 ? '0' + m : m) + '월';

  for (var i = 0; i < src.tabs.length; i++) {
    var name = src.tabs[i].name.trim();
    if (name === pattern1 || name === pattern2) {
      return src.tabs[i];
    }
  }

  /* 부분 매칭 시도: 탭 이름에 연도+월이 포함 */
  for (var j = 0; j < src.tabs.length; j++) {
    var n = src.tabs[j].name;
    if (n.indexOf(y + '') >= 0 && (n.indexOf(m + '월') >= 0)) {
      return src.tabs[j];
    }
  }
  return null;
}

/**
 * 근무표 탭 매칭: 매달 16일~다음 달 15일 단위의 shift schedule
 * 탭 이름에서 기간을 파싱하여 선택된 날짜가 포함되는 탭을 찾는다
 */
function findShiftTab(src) {
  var d = selectedDate;
  var dTime = d.getTime();

  for (var i = 0; i < src.tabs.length; i++) {
    var name = src.tabs[i].name.trim();
    var range = parseShiftPeriod(name);
    if (range) {
      if (dTime >= range.start.getTime() && dTime <= range.end.getTime()) {
        return src.tabs[i];
      }
    }
  }

  /* 기간 파싱 실패 시: 16일 기준 추정 매칭 */
  var y = d.getFullYear();
  var m = d.getMonth();
  var day = d.getDate();

  /* 16일 이전이면 이전 달 16일 ~ 이번 달 15일 구간 */
  var periodMonth, periodYear;
  if (day < 16) {
    if (m === 0) { periodYear = y - 1; periodMonth = 12; }
    else { periodYear = y; periodMonth = m; }
  } else {
    periodYear = y;
    periodMonth = m + 1;
  }

  /* 탭 이름에 월 숫자가 포함되는지 확인 */
  for (var j = 0; j < src.tabs.length; j++) {
    var n = src.tabs[j].name;
    if (n.indexOf(periodMonth + '월') >= 0 || n.indexOf(periodMonth + '/') >= 0) {
      return src.tabs[j];
    }
  }
  return null;
}

/**
 * 탭 이름에서 기간 파싱 시도
 * 예: "4/16~5/15", "2026.4.16-5.15", "4월16일~5월15일" 등
 */
function parseShiftPeriod(name) {
  /* 패턴 1: M/D~M/D 또는 M.D~M.D */
  var m = name.match(/(\d{1,2})[\/\.](\d{1,2})\s*[~\-]\s*(\d{1,2})[\/\.](\d{1,2})/);
  if (m) {
    var y = selectedDate.getFullYear();
    var sm = parseInt(m[1]), sd = parseInt(m[2]);
    var em = parseInt(m[3]), ed = parseInt(m[4]);
    var start = new Date(y, sm - 1, sd, 0, 0, 0);
    var end = new Date(y, em - 1, ed, 23, 59, 59);
    if (end < start) end.setFullYear(y + 1);
    return { start: start, end: end };
  }

  /* 패턴 2: M월D일~M월D일 */
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

    /* 시트 유형에 따라 매칭 전략 결정 */
    var matchedTab = null;
    var label = src.label;
    var isAssignNote = (label.indexOf('Assign') >= 0 || label.indexOf('assign') >= 0 ||
                        label.indexOf('Note') >= 0 || label.indexOf('note') >= 0 ||
                        src.key === 'sheet1');
    var isShift = (label.indexOf('근무') >= 0 || label.indexOf('연장') >= 0 ||
                   label.indexOf('합계') >= 0 || src.key === 'sheet2');

    if (isAssignNote) {
      matchedTab = findAssignNoteTab(src);
    } else if (isShift) {
      matchedTab = findShiftTab(src);
    } else {
      /* 기본: Assign Note 방식 시도 → 실패 시 Shift 방식 */
      matchedTab = findAssignNoteTab(src) || findShiftTab(src);
    }

    /* 카드 렌더링 */
    html += '<div class="section-card">';
    html += '<div class="section-card-header">';
    html += '<span class="material-icons" style="font-size:20px; margin-right:8px;">' + (isAssignNote ? 'note_alt' : 'schedule') + '</span>';
    html += '<span class="section-source-label">' + escHtml(label) + '</span>';
    html += '</div>';

    if (matchedTab) {
      html += '<div class="section-subtitle">' + escHtml(matchedTab.name) + '</div>';
      html += '<div class="section-content" id="section-data-' + escHtml(src.key) + '">';
      html += '<p class="text-gray-400 text-sm" style="padding:20px; text-align:center;">데이터 영역 (레이아웃 구상 중)</p>';
      html += '</div>';
    } else {
      html += '<div class="section-no-match">';
      html += '<span class="material-icons" style="font-size:20px; color:#94a3b8;">search_off</span>';
      html += '<span>선택한 날짜에 해당하는 탭을 찾지 못했습니다.</span>';
      html += '</div>';

      /* 사용 가능한 탭 목록 표시 */
      if (src.tabs && src.tabs.length > 0) {
        html += '<div class="section-tabs-hint">';
        html += '<span class="text-xs text-gray-400">사용 가능한 탭: </span>';
        for (var t = 0; t < Math.min(src.tabs.length, 6); t++) {
          html += '<span class="hint-tab">' + escHtml(src.tabs[t].name) + '</span>';
        }
        if (src.tabs.length > 6) html += '<span class="text-xs text-gray-400">외 ' + (src.tabs.length - 6) + '개</span>';
        html += '</div>';
      }
    }

    html += '</div>';
  }

  return html;
}
