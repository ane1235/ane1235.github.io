/* KSCTVA 2026 — colleagues.js V4.0 */
/* 동료 수강자 데이터 관리 및 레이블 렌더링 모듈 */

/* ── Polling 타이머 ── */
var _colleagueTimer = null;

/* ═══════════════════════════════════════════
   API 호출 및 캐싱
   ═══════════════════════════════════════════ */

/**
 * 서버에서 전체 동료 선택 데이터를 가져와 state.colleagues에 캐싱한다.
 * GAS에 getColleagueSelections action이 배포되어 있어야 동작한다.
 * 미배포 상태에서는 에러를 무시하고 빈 배열로 유지한다.
 */
function fetchColleagues() {
  return callApi({ action: 'getColleagueSelections' })
    .then(function(result) {
      if (result.success && Array.isArray(result.data)) {
        state.colleagues = result.data;
      }
    })
    .catch(function() {
      /* GAS 미배포 또는 네트워크 오류 시 기존 데이터 유지 */
    });
}

/**
 * 본인이 강의를 선택/해제할 때, 서버 응답을 기다리지 않고
 * state.colleagues 내 본인 데이터를 즉시 갱신한다. (체감 지연 0ms)
 */
function updateLocalColleague() {
  if (!state.colleagues || !state.user) return;
  for (var i = 0; i < state.colleagues.length; i++) {
    if (state.colleagues[i].sn2 === state.user.sn2) {
      state.colleagues[i].selections = state.selections.slice();
      return;
    }
  }
}

/* ═══════════════════════════════════════════
   동료 조회 함수
   ═══════════════════════════════════════════ */

/**
 * 특정 강의(lectureId)를 선택한 동료 이름 목록을 반환한다.
 * 반환 형식: { me: '본인이름'|null, others: ['이름1','이름2',...] }
 * others는 가나다순 정렬된다.
 */
function getColleaguesForLecture(lectureId) {
  var result = { me: null, others: [] };
  if (!state.colleagues || !lectureId) return result;

  for (var i = 0; i < state.colleagues.length; i++) {
    var c = state.colleagues[i];
    if (!c.selections || c.selections.indexOf(lectureId) < 0) continue;

    if (state.user && c.sn2 === state.user.sn2) {
      result.me = c.name;
    } else {
      result.others.push(c.name);
    }
  }
  result.others.sort();   /* 가나다순 */
  return result;
}

/**
 * 특정 세션(tabName)의 강의를 하나라도 선택한 동료 이름 목록을 반환한다.
 * sectionIdx가 지정되면 해당 섹션의 강좌 ID만 매칭한다.
 * 하나의 탭에 2개 세션이 있을 때(예: Day2_P2에 Session 13,14) 정확히 구분한다.
 */
function getColleaguesForSession(tabName, sectionIdx) {
  var result = { me: null, others: [] };
  if (!state.colleagues || !tabName) return result;

  /* sectionIdx가 지정된 경우: 해당 섹션의 강좌 ID 집합을 미리 구한다 */
  var validIds = null;
  if (typeof sectionIdx === 'number' && APP_DATA.sessions[tabName]) {
    var sec = APP_DATA.sessions[tabName].sections[sectionIdx];
    if (sec) {
      validIds = {};
      for (var k = 0; k < sec.items.length; k++) {
        validIds[sec.items[k].id] = true;
      }
    }
  }

  var prefix = tabName + '_R';

  for (var i = 0; i < state.colleagues.length; i++) {
    var c = state.colleagues[i];
    if (!c.selections) continue;

    var found = false;
    for (var j = 0; j < c.selections.length; j++) {
      var sid = c.selections[j];
      if (sid.indexOf(prefix) !== 0) continue;
      /* validIds가 있으면 해당 섹션 강좌만 매칭 */
      if (validIds) {
        if (validIds[sid]) { found = true; break; }
      } else {
        found = true; break;
      }
    }
    if (!found) continue;

    if (state.user && c.sn2 === state.user.sn2) {
      result.me = c.name;
    } else {
      result.others.push(c.name);
    }
  }
  result.others.sort();
  return result;
}

/* ═══════════════════════════════════════════
   레이블 HTML 렌더링
   ═══════════════════════════════════════════ */

/**
 * 특정 강의(lectureId)를 선택한 동료의 pill badge HTML을 생성한다.
 * 본인=파란색(맨 앞), 타인=회색(가나다순)
 * 동료가 없으면 빈 문자열을 반환한다.
 */
function renderColleagueLabels(lectureId) {
  var data = getColleaguesForLecture(lectureId);
  return _buildLabelsHtml(data);
}

/**
 * 특정 세션(tabName)의 동료 pill badge HTML을 생성한다.
 * Overview 페이지의 Session 셀에서 사용된다.
 * sectionIdx를 전달하면 탭 내 특정 섹션만 필터링한다.
 */
function renderColleagueLabelsForSession(tabName, sectionIdx) {
  var data = getColleaguesForSession(tabName, sectionIdx);
  return _buildLabelsHtml(data);
}

/**
 * { me, others } 데이터를 받아 pill badge HTML을 조합한다.
 * 내부 헬퍼 함수이다.
 */
function _buildLabelsHtml(data) {
  if (!data.me && data.others.length === 0) return '';

  var html = '<div class="colleague-container">';
  if (data.me) {
    html += '<span class="colleague-badge me">' + escHtml(data.me) + '</span>';
  }
  for (var i = 0; i < data.others.length; i++) {
    html += '<span class="colleague-badge">' + escHtml(data.others[i]) + '</span>';
  }
  html += '</div>';
  return html;
}

/* ═══════════════════════════════════════════
   Polling 제어
   ═══════════════════════════════════════════ */

/**
 * 1분(60초) 간격으로 동료 데이터를 자동 갱신한다.
 * 데이터가 실제로 변경된 경우에만 뷰를 다시 렌더링하여 깜박임을 방지한다.
 */
function startColleaguePolling() {
  stopColleaguePolling();   /* 기존 타이머 정리 */
  _colleagueTimer = setInterval(function() {
    var before = JSON.stringify(state.colleagues);
    fetchColleagues().then(function() {
      /* 데이터가 변경된 경우에만 뷰 재렌더링 (깜박임 방지) */
      if (JSON.stringify(state.colleagues) !== before) {
        if (state.currentView && state.currentView !== 'login') {
          showView(state.currentView, state.currentTab);
        }
      }
    });
  }, 60000);
}

/** polling을 정지한다. 로그아웃 시 호출된다. */
function stopColleaguePolling() {
  if (_colleagueTimer) {
    clearInterval(_colleagueTimer);
    _colleagueTimer = null;
  }
}
