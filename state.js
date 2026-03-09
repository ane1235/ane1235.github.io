/* KSCTVA 2026 — state.js V3.0 */
/* 핵심 변경: getAllData() 서버 호출 제거 → data.js의 APP_DATA 직접 사용 */

var state = {
  user: null,
  selections: [],
  currentView: 'login',
  currentTab: null,
  mypageDay: 1,
  highlightTimer: null
};

/* 로그인 */
function handleLoginSubmit() {
  var name = document.getElementById('input-name').value.trim();
  var sn2 = document.getElementById('input-sn2').value.trim();
  var errEl = document.getElementById('login-error');
  if (!name || !sn2) {
    errEl.textContent = '\uC774\uB984\uACFC \uC0AC\uBC88\uC744 \uBAA8\uB450 \uC785\uB825\uD574\uC8FC\uC138\uC694.';
    errEl.classList.remove('hidden'); return;
  }
  errEl.classList.add('hidden');
  callApi({ action: 'login', name: name, sn2: sn2 })
    .then(onLoginSuccess)
    .catch(function(err) {
      errEl.textContent = '\uC11C\uBC84 \uC5F0\uACB0 \uC624\uB958: ' + err.message;
      errEl.classList.remove('hidden');
    });
}

function onLoginSuccess(result) {
  var errEl = document.getElementById('login-error');
  if (result.success) {
    state.user = result.data;
    initApp();
  } else {
    errEl.textContent = result.error || '\uB85C\uADF8\uC778\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.';
    errEl.classList.remove('hidden');
  }
}

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
  showView('overview');
  updateTimeHighlight();
  state.highlightTimer = setInterval(updateTimeHighlight, 60000);
}

/* 로그아웃 */
function handleLogout() {
  if (state.highlightTimer) clearInterval(state.highlightTimer);
  state.user = null; state.selections = []; state.currentView = 'login';
  document.getElementById('app-container').classList.add('hidden');
  document.getElementById('view-login').classList.remove('hidden');
  document.getElementById('input-name').value = '';
  document.getElementById('input-sn2').value = '';
  document.getElementById('login-error').classList.add('hidden');
}

/* 강좌 선택/해제 */
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

  callApiPost({ action: 'saveSelections', sn2: state.user.sn2, selections: state.selections })
    .then(function(r) { if (!r.success) showToast('\uC800\uC7A5 \uC2E4\uD328: ' + (r.error || '')); })
    .catch(function(err) { showToast('\uC800\uC7A5 \uC624\uB958: ' + err.message); });

  showToast(idx >= 0 ? '\uC120\uD0DD \uD574\uC81C\uB428' : '\uC120\uD0DD \uC644\uB8CC');
}
