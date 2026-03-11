/* KSCTVA 2026 — view-overview.js V5.0 (전략 B: 구조화 데이터 직접 렌더링) */

function renderOverview() {
  var ov = APP_DATA.overview;
  if (!ov) return '<p class="text-center py-10 text-gray-500">데이터를 불러올 수 없습니다.</p>';

  var html = '';
  html += '<div class="text-center mb-6">';
  html += '<h2 class="text-2xl font-bold text-primary-dark">' + escHtml(ov.title) + '</h2>';
  html += '<p class="text-sm text-gray-500 mt-1">' + escHtml(ov.subtitle) + '</p>';
  html += '</div>';

  html += '<table class="overview-table">';
  html += '<colgroup><col style="width:15%"><col style="width:42.5%"><col style="width:42.5%"></colgroup>';

  for (var d = 0; d < ov.days.length; d++) {
    var day = ov.days[d];

    /* Day 헤더 */
    html += '<tr class="day-header"><td colspan="3">' + escHtml(day.label) + '</td></tr>';

    /* Room 헤더 */
    html += '<tr><th>시간</th>';
    for (var r = 0; r < day.rooms.length; r++) {
      html += '<th>' + escHtml(day.rooms[r]) + '</th>';
    }
    if (day.rooms.length < 2) html += '<th></th>';
    html += '</tr>';

    /* 행 렌더링 — type 기반 분기 */
    for (var i = 0; i < day.rows.length; i++) {
      var row = day.rows[i];
      var ta = row.time ? ' data-time="' + escHtml(row.time) + '"' : '';

      if (row.type === 'break') {
        html += '<tr class="break-row"' + ta + '><td>' + escHtml(row.time) + '</td>';
        html += '<td colspan="2">' + escHtml(row.text) + '</td></tr>';

      } else if (row.type === 'event') {
        if (row.cells) {
          /* 멀티 셀 이벤트 (런천 세션 등) */
          var tab0 = row.cells[0].tab;
          var si0 = row.cells[0].sectionIdx;
          var labels0 = tab0 ? renderColleagueLabelsForSession(tab0, si0) : '';
          html += '<tr class="event-center"' + ta + '><td>' + escHtml(row.time) + '</td>';
          if (row.cells.length === 1) {
            html += '<td colspan="2">' + escHtml(row.cells[0].text) + labels0 + '</td>';
          } else {
            html += '<td>' + escHtml(row.cells[0].text) + labels0 + '</td>';
            var tab1 = row.cells[1].tab;
            var si1 = row.cells[1].sectionIdx;
            var labels1 = tab1 ? renderColleagueLabelsForSession(tab1, si1) : '';
            html += '<td>' + escHtml(row.cells[1].text) + labels1 + '</td>';
          }
          html += '</tr>';
        } else {
          /* 단일 텍스트 이벤트 (총회, 폐회 등) */
          html += '<tr class="event-center"' + ta + '><td>' + escHtml(row.time) + '</td>';
          html += '<td colspan="2">' + escHtml(row.text) + '</td></tr>';
        }

      } else if (row.type === 'session') {
        var cells = row.cells;
        var tab0 = cells[0].tab;
        var si0 = cells[0].sectionIdx;
        var labels0 = tab0 ? renderColleagueLabelsForSession(tab0, si0) : '';
        html += '<tr class="clickable" onclick="onOverviewRowClick(\'' + (tab0 || '') + '\')"' + ta + '>';
        html += '<td>' + escHtml(row.time) + '</td>';
        if (cells.length === 1) {
          html += '<td colspan="2" class="session-common">' + formatSessionCell(cells[0].text) + labels0 + '</td>';
        } else {
          html += '<td>' + formatSessionCell(cells[0].text) + labels0 + '</td>';
          var tab1 = cells[1].tab;
          var si1 = cells[1].sectionIdx;
          var labels1 = tab1 ? renderColleagueLabelsForSession(tab1, si1) : '';
          html += '<td>' + formatSessionCell(cells[1].text) + labels1 + '</td>';
        }
        html += '</tr>';
      }
    }
  }

  html += '</table>';

  /* 푸터 */
  if (ov.footer) {
    for (var f = 0; f < ov.footer.length; f++) {
      html += '<div class="text-center text-xs text-gray-400 mt-2">' + escHtml(ov.footer[f]) + '</div>';
    }
  }

  var ev = APP_DATA.event;
  html += '<div class="text-center text-xs text-gray-400 mt-4">' + escHtml(ev.VENUE) + ' | ' + escHtml(ev.DATE_DAY1) + ' ~ ' + escHtml(ev.DATE_DAY2) + '</div>';
  return html;
}

function onOverviewRowClick(tabName) {
  if (tabName) showView('session', tabName);
}
