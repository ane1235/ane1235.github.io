/* Sheets Viewer — utils.js V1.0 */
/* KSCTVA utils.js에서 필요한 함수만 가져옴 */

/* 같은 읽기 요청이 진행 중일 때만 공유한다. 완료된 근무 데이터는 보관하지 않는다. */
var pendingSheetReads = {};

/* GET 요청 헬퍼 */
function callApi(params) {
  var qs = Object.keys(params).sort().map(function(k) {
    return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
  }).join('&');
  var url = API_URL + '?' + qs;
  var shareRead = params.action === 'getSheetData' || params.action === 'getSheetList';
  if (shareRead && pendingSheetReads[url]) return pendingSheetReads[url];

  var request = fetch(url, { redirect: 'follow', cache: 'no-store' })
    .then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
  if (!shareRead) return request;

  pendingSheetReads[url] = request.then(function(result) {
    delete pendingSheetReads[url];
    return result;
  }, function(err) {
    delete pendingSheetReads[url];
    throw err;
  });
  return pendingSheetReads[url];
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
