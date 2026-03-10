/* KSCTVA 2026 — view-mypage.js V4.0 */
/* V4.0: views.js에서 분리 + 동료 레이블 표시 기능 추가 */

/* ────────── MyPage ────────── */
function renderMyPage() {
  var html = '<div class="text-center mb-4">';
  html += '<h3 class="text-lg font-bold text-primary-dark"><span class="material-icons mr-1" style="vertical-align:middle;">bookmark</span>내 강좌</h3>';
  html += '<p class="text-sm text-gray-500">' + escHtml(state.user.name) + '님의 선택 강좌</p></div>';

  html += '<div class="mypage-tabs">';
  html += '<div class="mypage-tab' + (state.mypageDay === 1 ? ' active' : '') + '" onclick="switchMypageDay(1)">Day 1 (4/11 토)</div>';
  html += '<div class="mypage-tab' + (state.mypageDay === 2 ? ' active' : '') + '" onclick="switchMypageDay(2)">Day 2 (4/12 일)</div></div>';

  html += renderMyPageDay(state.mypageDay);

  html += '<div class="overlap-legend"><span class="material-icons" style="font-size:16px; color:#dc2626;">warning</span>';
  html += ' <span class="overlap-legend-swatch"></span> = 같은 시간대 다른 Room 중복 선택 (동시 수강 불가)</div>';
  return html;
}

function switchMypageDay(d) {
  state.mypageDay = d;
  showView('mypage');
}

function renderMyPageDay(dayNum) {
  var slots = getOverviewSlots(dayNum);
  var grouped = groupSelectionsBySlot(dayNum, slots);

  var html = '<div class="my-table-wrapper">';
  html += '<table class="my-table">';
  html += '<tr><th style="width:18%;">세션 시간</th><th style="width:12%;">Room</th><th style="width:16%;">강좌시간</th><th>주제</th><th style="width:22%;">연자/소속</th></tr>';

  if (slots.length === 0) {
    html += '<tr><td colspan="5" class="text-center py-8 text-gray-400">해당 일정이 없습니다.</td></tr></table></div>';
    return html;
  }

  var hasAny = false, totalOL = 0;

  for (var s = 0; s < slots.length; s++) {
    var slot = slots[s], lecs = grouped[slot.time] || [];

    if (lecs.length === 0) {
      html += '<tr class="slot-row" data-time="' + escHtml(slot.time) + '"><td>' + escHtml(slot.time) + '</td><td colspan="4" class="text-gray-300 text-center">\u2014</td></tr>';
    } else {
      hasAny = true;
      var olIds = getOverlappingIds(lecs), hasOL = Object.keys(olIds).length > 0;

      if (hasOL) {
        totalOL++;
        html += '<tr class="overlap-group-start"><td colspan="5"></td></tr>';
      }

      for (var l = 0; l < lecs.length; l++) {
        var lec = lecs[l], isOL = olIds[lec.id] === true;
        html += '<tr class="' + (isOL ? 'overlap-row' : '') + '" data-time="' + escHtml(lec.time) + '">';
        if (l === 0) html += '<td' + (lecs.length > 1 ? ' rowspan="' + lecs.length + '"' : '') + ' class="font-semibold text-primary-dark align-top">' + escHtml(slot.time) + '</td>';
        var rb = 'room-badge' + (lec.room === 'Room 1' ? ' room-1' : lec.room === 'Room 2' ? ' room-2' : ' room-common');
        html += '<td><span class="' + rb + '">' + escHtml(lec.room) + '</span></td>';
        html += '<td class="text-sm">' + escHtml(lec.time) + '</td>';
        /* 주제 셀: 제목 아래에 동료 레이블 삽입 */
        html += '<td>' + escHtml(lec.title) + renderColleagueLabels(lec.id) + '</td>';
        html += '<td class="text-sm text-gray-500">' + escHtml(lec.speaker) + '</td></tr>';
      }

      if (hasOL) {
        html += '<tr class="overlap-group-end"><td colspan="5"><span class="material-icons" style="font-size:14px; color:#dc2626; vertical-align:middle;">warning</span>';
        html += ' <span class="text-xs text-red-600">시간이 겹치는 다른 Room 강좌가 있습니다. 하나를 선택해주세요.</span></td></tr>';
      }
    }
  }

  if (!hasAny) html += '<tr><td colspan="5" class="text-center py-4 text-gray-400 text-sm">세션 페이지에서 강좌를 선택해주세요.</td></tr>';

  html += '</table></div>';

  if (hasAny) {
    var olMsg = totalOL > 0 ? ' | <span class="text-red-500">\u26A0 시간 중복 ' + totalOL + '건</span>' : '';
    html += '<p class="text-xs text-gray-400 mt-2 text-center">선택한 강좌: ' + state.selections.length + '개' + olMsg + '</p>';
  }
  return html;
}

/* 중복 감지 (반개구간) */
function getOverlappingIds(lectures) {
  var ids = {};
  if (lectures.length < 2) return ids;
  for (var i = 0; i < lectures.length; i++) {
    for (var j = i + 1; j < lectures.length; j++) {
      var a = lectures[i], b = lectures[j];
      if (a.room === b.room || a.room === '\uACF5\uD1B5' || b.room === '\uACF5\uD1B5' || a.room === '\u2014' || b.room === '\u2014') continue;
      var ar = a.time.split(/[\u2013\-]/), br = b.time.split(/[\u2013\-]/);
      if (ar.length < 2 || br.length < 2) continue;
      var as = parseTime(ar[0]), ae = parseTime(ar[1]), bs = parseTime(br[0]), be = parseTime(br[1]);
      if (!as || !ae || !bs || !be) continue;
      if (as.total < be.total && bs.total < ae.total) { ids[a.id] = true; ids[b.id] = true; }
    }
  }
  return ids;
}

/* overview에서 세션 슬롯 추출 */
function getOverviewSlots(dayNum) {
  var rows = APP_DATA.overview, slots = [], inDay = false;
  for (var i = 0; i < rows.length; i++) {
    var c0 = (rows[i][0] || '').toString(), c1 = (rows[i][1] || '').toString();
    if (c0.indexOf('\uD83D\uDCC5 Day ' + dayNum) >= 0) { inDay = true; continue; }
    if (c0.indexOf('\uD83D\uDCC5 Day') >= 0 && inDay) break;
    if (!inDay) continue;
    if (c0 === '\uC2DC\uAC04' || !c0) continue;
    if (c0.indexOf('\uC77C\uC2DC:') === 0 || c0.indexOf('\uC0AC\uC804\uB4F1\uB85D\uBE44') === 0) continue;
    if (c1.indexOf('Session') >= 0 || c1.indexOf('\uB7F0\uCC9C') >= 0) slots.push({ time: c0, label: c1 });
  }
  return slots;
}

/* 선택 강좌를 슬롯별로 그룹핑 */
function groupSelectionsBySlot(dayNum, slots) {
  var grouped = {}, prefix = 'Day' + dayNum + '_';
  slots.forEach(function(sl) { grouped[sl.time] = []; });
  state.selections.forEach(function(selId) {
    if (selId.indexOf(prefix) !== 0) return;
    var ld = getLectureDataById(selId);
    if (!ld) return;
    var ms = findMatchingSlot(ld.time, slots);
    if (ms && grouped[ms]) grouped[ms].push(ld);
  });
  Object.keys(grouped).forEach(function(key) {
    grouped[key].sort(function(a, b) {
      var tc = a.time.localeCompare(b.time);
      if (tc !== 0) return tc;
      return a.room === 'Room 1' ? -1 : a.room === 'Room 2' ? 1 : 0;
    });
  });
  return grouped;
}
