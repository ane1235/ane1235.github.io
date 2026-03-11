/* KSCTVA 2026 — utils.js V5.0 (전략 B: 구조화 데이터 대응) */

/* GET 요청 헬퍼 */
function callApi(params) {
  var qs = Object.keys(params).map(function(k) {
    return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
  }).join('&');
  return fetch(API_URL + '?' + qs, { redirect: 'follow' })
    .then(function(res) { return res.json(); });
}

/* POST 요청 헬퍼 (Content-Type: text/plain → CORS preflight 회피) */
function callApiPost(body) {
  return fetch(API_URL, {
    method: 'POST', redirect: 'follow',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(body)
  }).then(function(res) { return res.json(); });
}

/* HTML 이스케이프 */
function escHtml(str) {
  if (!str) return '';
  return str.toString()
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* 토스트 메시지 */
function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 2000);
}

/* 시간 파싱: "10:30" → { h:10, m:30, total:630 } */
function parseTime(str) {
  if (!str) return null;
  var m = str.trim().match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  var h = parseInt(m[1]), mi = parseInt(m[2]);
  return { h: h, m: mi, total: h * 60 + mi };
}

/* 현재 시간 하이라이트 */
function updateTimeHighlight() {
  document.querySelectorAll('.time-highlight').forEach(function(el) {
    el.classList.remove('time-highlight');
  });
  var now = new Date();
  var nowMin = now.getHours() * 60 + now.getMinutes();
  document.querySelectorAll('[data-time]').forEach(function(el) {
    var parts = el.getAttribute('data-time').split(/[\u2013\-]/);
    if (parts.length < 2) return;
    var s = parseTime(parts[0]), e = parseTime(parts[1]);
    if (s && e && nowMin >= s.total && nowMin < e.total) el.classList.add('time-highlight');
  });
}

/* 강좌 ID로 데이터 조회 — V5.0: 구조화 데이터에서 직접 검색 */
function getLectureDataById(id) {
  var p = id.lastIndexOf('_R');
  if (p < 0) return null;
  var tab = id.substring(0, p);
  var sessionData = APP_DATA.sessions[tab];
  if (!sessionData) return null;
  for (var s = 0; s < sessionData.sections.length; s++) {
    var sec = sessionData.sections[s];
    for (var i = 0; i < sec.items.length; i++) {
      if (sec.items[i].id === id) {
        var item = sec.items[i];
        return { id: id, tab: tab, time: item.time, title: item.title, speaker: item.speaker, room: sec.room };
      }
    }
  }
  return null;
}

/* 세션 셀 포맷: Session ## 강조 + 줄바꿈→<br> */
function formatSessionCell(text) {
  if (!text) return '';
  var h = escHtml(text);
  h = h.replace(/(Session\s+\d+)/, '<span class="session-num">$1</span>');
  return h.replace(/\n/g, '<br>');
}

/* MyPage: 강좌 시간 → overview 슬롯 매칭 */
function findMatchingSlot(lectureTime, slots) {
  var ls = parseTime(lectureTime.split(/[\u2013\-]/)[0]);
  if (!ls) return null;
  for (var i = 0; i < slots.length; i++) {
    var r = slots[i].time.split(/[\u2013\-]/);
    var ss = parseTime(r[0]), se = parseTime(r[1]);
    if (ss && se && ls.total >= ss.total && ls.total < se.total) return slots[i].time;
  }
  return null;
}
