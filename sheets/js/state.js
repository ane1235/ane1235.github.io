/* Sheets Viewer — state.js V1.0 */
/* KSCTVA 메인 페이지와 동일한 localStorage 키를 사용하여 로그인 세션 공유 */

var STORAGE_KEY_USER = 'ksctva_user';

var state = {
  user: null,
  currentTab: null,
  sheetData: null
};

/* ── 세션 저장/복원 (메인 페이지와 동일) ── */

function saveSession(userData) {
  try {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userData));
  } catch (e) { /* Private Browsing 시 무시 */ }
}

function restoreSession() {
  try {
    var saved = localStorage.getItem(STORAGE_KEY_USER);
    if (!saved) return null;
    var userData = JSON.parse(saved);
    if (userData && userData.name && userData.sn2) return userData;
    localStorage.removeItem(STORAGE_KEY_USER);
    return null;
  } catch (e) {
    localStorage.removeItem(STORAGE_KEY_USER);
    return null;
  }
}

function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY_USER);
  } catch (e) { /* 무시 */ }
}

/* ── 로그인 ── */

function handleLoginSubmit() {
  var name = document.getElementById('input-name').value.trim();
  var sn2  = document.getElementById('input-sn2').value.trim();
  var errEl = document.getElementById('login-error');

  if (!name || !sn2) {
    errEl.textContent = '이름과 사번을 모두 입력해주세요.';
    errEl.classList.remove('hidden');
    return;
  }
  errEl.classList.add('hidden');

  callApi({ action: 'login', name: name, sn2: sn2 })
    .then(function(result) {
      var errEl = document.getElementById('login-error');
      if (result.success) {
        state.user = result.data;
        saveSession(result.data);
        initApp();
      } else {
        errEl.textContent = result.error || '로그인에 실패했습니다.';
        errEl.classList.remove('hidden');
      }
    })
    .catch(function(err) {
      document.getElementById('login-error').textContent = '서버 연결 오류: ' + err.message;
      document.getElementById('login-error').classList.remove('hidden');
    });
}

/* ── 로그아웃 ── */

function handleLogout() {
  state.user = null;
  state.sheetData = null;
  clearSession();
  document.getElementById('app-container').classList.add('hidden');
  document.getElementById('view-login').classList.remove('hidden');
  document.getElementById('input-name').value = '';
  document.getElementById('input-sn2').value = '';
  document.getElementById('login-error').classList.add('hidden');
}

/* ── 페이지 로드 시 자동 세션 복원 ── */

document.addEventListener('DOMContentLoaded', function() {
  var savedUser = restoreSession();
  if (savedUser) {
    state.user = savedUser;
    initApp();
  }
});
