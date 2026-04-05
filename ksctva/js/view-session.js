/* KSCTVA 2026 — view-session.js V5.0 (전략 B: 구조화 데이터 직접 렌더링) */

function renderSession(tabName) {
  var sessionData = APP_DATA.sessions[tabName];
  if (!sessionData) return '<p class="text-center py-10 text-gray-500">세션 데이터를 찾을 수 없습니다.</p>';

  var html = '';
  html += '<div class="text-center mb-4"><h3 class="text-lg font-bold text-primary-dark">' + escHtml(sessionData.title) + '</h3></div>';

  for (var s = 0; s < sessionData.sections.length; s++) {
    var sec = sessionData.sections[s];
    html += '<div class="session-section"><div class="session-header">' + escHtml(sec.name) + '</div>';
    if (sec.chair) html += '<div class="session-chair"><span class="material-icons mr-1" style="font-size:16px; color:#2563eb;">person</span>' + escHtml(sec.chair) + '</div>';

    for (var l = 0; l < sec.items.length; l++) {
      var item = sec.items[l];
      if (item.selectable) {
        var isSel = state.selections.indexOf(item.id) >= 0;
        html += '<div class="lecture-row' + (isSel ? ' selected' : '') + '" data-id="' + item.id + '" data-time="' + escHtml(item.time) + '" onclick="toggleLecture(\'' + item.id + '\')">';
        html += '<span class="material-icons select-indicator">' + (isSel ? 'check_circle' : 'radio_button_unchecked') + '</span>';
        html += '<div class="lec-time">' + escHtml(item.time) + '</div>';
        html += '<div class="lec-title">' + escHtml(item.title);
        html += renderColleagueLabels(item.id);
        html += '</div>';
        html += '<div class="lec-speaker">' + escHtml(item.speaker) + '</div></div>';
      } else {
        html += '<div class="event-row" data-time="' + escHtml(item.time) + '">';
        html += '<div class="lec-time">' + escHtml(item.time) + '</div>';
        html += '<div class="lec-title">' + escHtml(item.title) + '</div>';
        html += '<div class="lec-speaker">' + escHtml(item.speaker || '') + '</div></div>';
      }
    }
    html += '</div>';
  }
  return html;
}
