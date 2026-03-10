/* KSCTVA 2026 — view-overview.js V4.0 */
/* V4.0: views.js에서 분리 + 동료 레이블 표시 기능 추가 */

/* ────────── Overview ────────── */
function renderOverview() {
  var rows = APP_DATA.overview;
  if (!rows) return '<p class="text-center py-10 text-gray-500">데이터를 불러올 수 없습니다.</p>';

  var html = '';
  html += '<div class="text-center mb-6">';
  html += '<h2 class="text-2xl font-bold text-primary-dark">' + escHtml(rows[0][0] || '') + '</h2>';
  html += '<p class="text-sm text-gray-500 mt-1">' + escHtml(rows[1] ? rows[1][0] : '') + '</p>';
  html += '</div>';

  html += '<table class="overview-table">';
  html += '<colgroup><col style="width:15%"><col style="width:42.5%"><col style="width:42.5%"></colgroup>';

  for (var i = 2; i < rows.length; i++) {
    var row = rows[i];
    var c0 = (row[0] || '').toString(), c1 = (row[1] || '').toString(), c2 = (row[2] || '').toString();
    if (!c0 && !c1 && !c2) continue;

    if (c0.indexOf('\uD83D\uDCC5') === 0) {
      html += '<tr class="day-header"><td colspan="3">' + escHtml(c0) + '</td></tr>';
      continue;
    }
    if (c0 === '\uC2DC\uAC04') {
      html += '<tr><th>' + escHtml(c0) + '</th><th>' + escHtml(extractRoomName(c1)) + '</th>';
      if (c2) html += '<th>' + escHtml(extractRoomName(c2)) + '</th>';
      html += '</tr>';
      continue;
    }
    if (c0.indexOf('\uC77C\uC2DC:') === 0 || c0.indexOf('\uC0AC\uC804\uB4F1\uB85D\uBE44') === 0) {
      html += '<tr><td colspan="3" class="text-xs text-gray-500" style="background:#f8fafc;">' + escHtml(c0) + '</td></tr>';
      continue;
    }

    var brk = isBreakRow(c1), evt = isEventCenter(c1);
    var click = !brk && c1.indexOf('Session') >= 0;
    var tab = click ? findTabForOverviewRow(c0, c1, i) : null;
    var has2 = !!c2, ta = c0 ? ' data-time="' + escHtml(c0) + '"' : '';

    if (brk) {
      html += '<tr class="break-row"' + ta + '><td>' + escHtml(c0) + '</td>';
      html += '<td' + (has2 ? '' : ' colspan="2"') + '>' + escHtml(c1) + '</td>';
      if (has2) html += '<td>' + escHtml(c2) + '</td>';
      html += '</tr>';
    } else if (click) {
      /* Session 셀: 탭 이름 기준으로 동료 레이블 삽입 */
      var tab1 = findTabForOverviewRow(c0, c1, i);
      var tab2 = has2 ? findTabForOverviewRow(c0, c2, i) : null;
      var labels1 = tab1 ? renderColleagueLabelsForSession(tab1) : '';
      var labels2 = tab2 ? renderColleagueLabelsForSession(tab2) : '';

      html += '<tr class="clickable" onclick="onOverviewRowClick(\'' + (tab || '') + '\')"' + ta + '>';
      html += '<td>' + escHtml(c0) + '</td>';
      if (!has2) {
        html += '<td colspan="2" class="session-common">' + formatSessionCell(c1) + labels1 + '</td>';
      } else {
        html += '<td>' + formatSessionCell(c1) + labels1 + '</td>';
        html += '<td>' + formatSessionCell(c2) + labels2 + '</td>';
      }
      html += '</tr>';
    } else if (evt) {
      html += '<tr class="event-center"' + ta + '><td>' + escHtml(c0) + '</td>';
      html += '<td' + (has2 ? '' : ' colspan="2"') + '>' + escHtml(c1) + '</td>';
      if (has2) html += '<td>' + escHtml(c2) + '</td>';
      html += '</tr>';
    } else {
      html += '<tr' + ta + '><td>' + escHtml(c0) + '</td>';
      html += '<td' + (has2 ? '' : ' colspan="2"') + '>' + escHtml(c1) + '</td>';
      if (has2) html += '<td>' + escHtml(c2) + '</td>';
      html += '</tr>';
    }
  }
  html += '</table>';

  var ev = APP_DATA.event;
  html += '<div class="text-center text-xs text-gray-400 mt-4">' + escHtml(ev.VENUE) + ' | ' + escHtml(ev.DATE_DAY1) + ' ~ ' + escHtml(ev.DATE_DAY2) + '</div>';
  return html;
}

function onOverviewRowClick(tabName) {
  if (tabName) showView('session', tabName);
}
