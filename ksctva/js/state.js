/* KSCTVA 2026 — state.js V4.0 */
/* V4.0 변경: 동료 수강자 레이블 기능 통합 (colleagues 상태 + polling) */
/* V3.1 기반: localStorage 기반 로그인 세션 유지 */

/* ── 상수 ── */
var STORAGE_KEY_USER = 'ksctva_user';   // localStorage 키 (= 로그인 사용자 정보 저장용)

/* ── 전역 상태 ── */
var state = {
  user: null,
  selections: [],
  colleagues: [],    /* V4.0: 동료 수강자 데이터 (colleagues.js에서 관리) */
  currentView: 'login',
  currentTab: null,
  mypageDay: 1,
  highlightTimer: null
};

/* ═══════════════════════════════════════════
   세션 저장/복원 (localStorage 기반)
   ═══════════════════════════════════════════ */

/* 로그인 정보를 localStorage에 저장 */
function saveSession(userData) {
  try {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userData));
  } catch (e) {
    /* Private Browsing 등에서 localStorage 차단 시 무시 — 기능은 동작하되 세션 유지만 불가 */
  }
}

/* localStorage에서 로그인 정보 복원 시도 */
function restoreSession() {
  try {
    var saved = localStorage.getItem(STORAGE_KEY_USER);
    if (!saved) return null;
    var userData = JSON.parse(saved);
    /* 필수 필드 검증: name과 sn2가 모두 있어야 유효한 세션 */
    if (userData && userData.name && userData.sn2) return userData;
    /* 유효하지 않은 데이터 → 정리 */
    localStorage.removeItem(STORAGE_KEY_USER);
    return null;
  } catch (e) {
    /* JSON 파싱 실패 등 → 정리 후 null 반환 */
    localStorage.removeItem(STORAGE_KEY_USER);
    return null;
  }
}

/* localStorage에서 세션 삭제 */
function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY_USER);
  } catch (e) { /* 무시 */ }
}

/* ═══════════════════════════════════════════
   로그인
   ═══════════════════════════════════════════ */

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
    .then(onLoginSuccess)
    .catch(function(err) {
      errEl.textContent = '서버 연결 오류: ' + err.message;
      errEl.classList.remove('hidden');
    });
}

function onLoginSuccess(result) {
  var errEl = document.getElementById('login-error');
  if (result.success) {
    state.user = result.data;
    saveSession(result.data);   /* ← V3.1 추가: localStorage에 저장 */
    initApp();
  } else {
    errEl.textContent = result.error || '로그인에 실패했습니다.';
    errEl.classList.remove('hidden');
  }
}

/* ═══════════════════════════════════════════
   앱 초기화 (로그인 성공 후 또는 세션 복원 후)
   ═══════════════════════════════════════════ */

function initApp() {
  document.getElementById('view-login').classList.add('hidden');
  document.getElementById('app-container').classList.remove('hidden');
  document.getElementById('user-display').textContent = state.user.name;

  /* 메뉴 구성 (APP_DATA에서 직접) */
  buildDropdownMenus();

  /* 선택 목록만 서버에서 가져옴 (프로그램 데이터는 이미 data.js에 있음) */
  callApi({ action: 'getSelections', sn2: state.user.sn2 })
    .then(function(result) {
      if (result.success) state.selections = result.data || [];
      onAllDataReady();
    })
    .catch(function(err) {
      state.selections = [];
      onAllDataReady();
    });
}

function onAllDataReady() {
  /* V4.0: 동료 데이터를 먼저 가져온 후 뷰를 렌더링한다 (깜박임 방지) */
  fetchColleagues().then(function() {
    showView('overview');
    updateTimeHighlight();
    state.highlightTimer = setInterval(updateTimeHighlight, 60000);
    startColleaguePolling();
  });
}

/* ═══════════════════════════════════════════
   로그아웃
   ═══════════════════════════════════════════ */

function handleLogout() {
  if (state.highlightTimer) clearInterval(state.highlightTimer);
  stopColleaguePolling();   /* V4.0: polling 정지 */
  state.user = null;
  state.selections = [];
  state.colleagues = [];    /* V4.0: 동료 데이터 초기화 */
  state.currentView = 'login';
  clearSession();   /* ← V3.1 추가: localStorage에서 삭제 */

  document.getElementById('app-container').classList.add('hidden');
  document.getElementById('view-login').classList.remove('hidden');
  document.getElementById('input-name').value = '';
  document.getElementById('input-sn2').value = '';
  document.getElementById('login-error').classList.add('hidden');
}

/* ═══════════════════════════════════════════
   강좌 선택/해제
   ═══════════════════════════════════════════ */

function toggleLecture(lectureId) {
  var idx = state.selections.indexOf(lectureId);
  if (idx >= 0) state.selections.splice(idx, 1);
  else state.selections.push(lectureId);

  var el = document.querySelector('[data-id="' + lectureId + '"]');
  if (el) {
    var sel = state.selections.indexOf(lectureId) >= 0;
    el.classList.toggle('selected', sel);
    var icon = el.querySelector('.select-indicator');
    if (icon) icon.textContent = sel ? 'check_circle' : 'radio_button_unchecked';
  }

  callApiPost({
    action: 'saveSelections',
    sn2: state.user.sn2,
    selections: state.selections
  })
  .then(function(r) { if (!r.success) showToast('저장 실패: ' + (r.error || '')); })
  .catch(function(err) { showToast('저장 오류: ' + err.message); });

  /* V4.0: 본인 동료 데이터 즉시 갱신 */
  updateLocalColleague();

  showToast(idx >= 0 ? '선택 해제됨' : '선택 완료');
}

/* ═══════════════════════════════════════════
   페이지 로드 시 자동 세션 복원
   ═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function() {
  var savedUser = restoreSession();
  if (savedUser) {
    /* 저장된 세션 존재 → 로그인 건너뛰고 바로 앱 초기화 */
    state.user = savedUser;
    initApp();
  }
  /* 저장된 세션 없음 → 로그인 화면 유지 (HTML 기본 상태) */
});
