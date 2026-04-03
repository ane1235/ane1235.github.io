/* Sheets Viewer — utils.js V1.0 */
/* KSCTVA utils.js에서 필요한 함수만 가져옴 */

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
