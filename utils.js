/* KSCTVA 2026 — utils.js V3.0 */

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

/* 세션 제목에서 Room 정보 추출 */
function getRoomFromSectionTitle(title) {
  if (!title) return '\u2014';
  if (/Room\s*1\s*[&]\s*2/.test(title) || title.indexOf('\uACF5\uD1B5') >= 0) return '\uACF5\uD1B5';
  if (/Room\s*1/i.test(title)) return 'Room 1';
  if (/Room\s*2/i.test(title)) return 'Room 2';
  return '\u2014';
}

/* 세션 데이터 파싱 (raw 2D배열 → 섹션 배열) */
function parseSessionData(tabName, rawData) {
  var sections = [], cur = null;
  for (var i = 0; i < rawData.length; i++) {
    var r = rawData[i];
    var c0 = (r[0] || '').toString().trim();
    var c1 = (r[1] || '').toString().trim();
    var c2 = (r[2] || '').toString().trim();
    if (!c0 && !c1 && !c2) continue;
    if (c0.indexOf('\uD83D\uDCC5') === 0) continue;
    if (c0.indexOf('Session') === 0) {
      cur = { title: c0, chair: null, room: getRoomFromSectionTitle(c0), items: [] };
      sections.push(cur); continue;
    }
    if (c0 === '\uC2DC\uAC04' && c1 === '\uC81C\uBAA9') continue;
    if (c0.indexOf('\uC88C\uC7A5') === 0) { if (cur) cur.chair = c0; continue; }
    if (!cur) continue;
    if (c0 && /\d{1,2}:\d{2}/.test(c0)) {
      cur.items.push({
        id: tabName + '_R' + i, time: c0, title: c1, speaker: c2,
        selectable: !isEventRow(c1) && !!c1 && !!c2,
        rowIndex: i, room: cur.room
      });
    }
  }
  return sections;
}

/* 이벤트(토론, 런천, 휴식 등) 판별 */
function isEventRow(title) {
  if (!title) return true;
  var kw = ['\uD1A0\uB860', 'Discussion', '\uB7F0\uCC9C', '\uD734\uC2DD', '\uD3D0\uD68C', '\uCD1D\uD68C', '\uAC1C\uD68C'];
  for (var k = 0; k < kw.length; k++) { if (title.indexOf(kw[k]) >= 0) return true; }
  return false;
}

/* 강좌 ID로 데이터 조회 */
function getLectureDataById(id) {
  var p = id.lastIndexOf('_R');
  if (p < 0) return null;
  var tab = id.substring(0, p), ri = parseInt(id.substring(p + 2));
  if (!APP_DATA.sessions[tab]) return null;
  var raw = APP_DATA.sessions[tab], row = raw[ri];
  if (!row) return null;
  var room = '\u2014';
  for (var j = ri; j >= 0; j--) {
    var chk = (raw[j][0] || '').toString().trim();
    if (chk.indexOf('Session') === 0) { room = getRoomFromSectionTitle(chk); break; }
  }
  return { id: id, tab: tab, time: (row[0]||'').toString().trim(),
           title: (row[1]||'').toString().trim(), speaker: (row[2]||'').toString().trim(), room: room };
}

/* 세션 셀 포맷: Session ## 강조 + 줄바꿈→<br> */
function formatSessionCell(text) {
  if (!text) return '';
  var h = escHtml(text);
  h = h.replace(/(Session\s+\d+)/, '<span class="session-num">$1</span>');
  return h.replace(/\n/g, '<br>');
}

/* 헤더에서 Room 이름만 추출 */
function extractRoomName(headerText) {
  if (!headerText) return '';
  var parts = headerText.split('\u2014');
  if (parts.length >= 2) return parts[parts.length - 1].trim();
  parts = headerText.split(' - ');
  if (parts.length >= 2) return parts[parts.length - 1].trim();
  return headerText;
}

/* break 행 (휴식, 폐회) */
function isBreakRow(text) {
  if (!text) return true;
  var kw = ['\uD734\uC2DD', '\uD3D0\uD68C'];
  for (var i = 0; i < kw.length; i++) { if (text.indexOf(kw[i]) >= 0) return true; }
  return false;
}

/* 이벤트 가운데 정렬 대상 */
function isEventCenter(text) {
  if (!text) return false;
  var kw = ['\uCD1D\uD68C', '\uAC1C\uD68C', '\uB7F0\uCC9C', '\uD734\uC2DD', '\uD3D0\uD68C'];
  for (var k = 0; k < kw.length; k++) { if (text.indexOf(kw[k]) >= 0) return true; }
  return false;
}

/* overview → 탭 이름 매핑 */
function findTabForOverviewRow(timeStr, sessionText, rowIdx) {
  var m = sessionText.match(/Session\s+(\d+)/);
  if (m) {
    var sn = parseInt(m[1]);
    var map = {1:'Day1_A1',2:'Day1_A1',3:'Day1_P1',4:'Day1_P2',5:'Day1_P2',
               6:'Day1_P3',7:'Day1_P3',8:null,9:'Day2_A1',10:'Day2_A1',
               11:'Day2_P1',12:'Day2_P1',13:'Day2_P2',14:'Day2_P2'};
    return map[sn] || null;
  }
  if (sessionText.indexOf('\uB7F0\uCC9C \uC138\uC158 1') >= 0 || sessionText.indexOf('\uB7F0\uCC9C \uC138\uC158 2') >= 0) return 'Day1_A1';
  if (sessionText.indexOf('\uB7F0\uCC9C \uC138\uC158 3') >= 0 || sessionText.indexOf('\uB7F0\uCC9C \uC138\uC158 4') >= 0) return 'Day2_A1';
  return null;
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
