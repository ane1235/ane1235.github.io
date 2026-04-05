/* KSCTVA 2026 — nav.js V5.0 */
/* V5.0: 심폐마취학회2026 중첩 드롭다운 구조 */

function buildDropdownMenus() {
  var map = APP_DATA.menuMap;

  var sm1 = document.getElementById('submenu-day1');
  sm1.innerHTML = '';
  map.DAY1.forEach(function(item) {
    var d = document.createElement('div');
    d.className = 'dropdown-item'; d.textContent = item.label;
    d.onclick = function(e) { e.stopPropagation(); closeAllDropdowns(); showView('session', item.tab); };
    sm1.appendChild(d);
  });

  var sm2 = document.getElementById('submenu-day2');
  sm2.innerHTML = '';
  map.DAY2.forEach(function(item) {
    var d = document.createElement('div');
    d.className = 'dropdown-item'; d.textContent = item.label;
    d.onclick = function(e) { e.stopPropagation(); closeAllDropdowns(); showView('session', item.tab); };
    sm2.appendChild(d);
  });
}

function toggleDropdown(id) {
  var menu = document.getElementById('dropdown-' + id);
  var open = menu.classList.contains('show');
  closeAllDropdowns();
  if (!open) menu.classList.add('show');
}

function toggleSubmenu(day) {
  /* 데스크탑(≥769px)은 CSS hover로 처리 — JS 클릭 무시 */
  if (window.innerWidth >= 769) return;
  var menu = document.getElementById('submenu-' + day);
  var isOpen = menu.classList.contains('show');
  /* 다른 모든 submenu 먼저 닫기 */
  document.querySelectorAll('.submenu').forEach(function(el) { el.classList.remove('show'); });
  /* 대상 submenu 토글 */
  if (!isOpen) menu.classList.add('show');
}

function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-menu').forEach(function(el) { el.classList.remove('show'); });
  document.querySelectorAll('.submenu').forEach(function(el) { el.classList.remove('show'); });
}

document.addEventListener('click', function(e) {
  if (!e.target.closest('.nav-item')) closeAllDropdowns();
});

/* 뷰 라우터 */
function showView(viewName, param) {
  state.currentView = viewName;
  var area = document.getElementById('content-area');

  /* nav-ksctva active 표시 — overview, session, mypage 모두 학회 하위 */
  var ksctvaNav = document.getElementById('nav-ksctva');
  if (ksctvaNav) {
    if (viewName === 'overview' || viewName === 'session' || viewName === 'mypage') {
      ksctvaNav.classList.add('active');
    } else {
      ksctvaNav.classList.remove('active');
    }
  }

  switch (viewName) {
    case 'overview':
      area.innerHTML = '<div class="view-container">' + renderOverview() + '</div>'; break;
    case 'session':
      state.currentTab = param;
      area.innerHTML = '<div class="view-container">' + renderSession(param) + '</div>';
      break;
    case 'mypage':
      area.innerHTML = '<div class="view-container">' + renderMyPage() + '</div>';
      break;
    default:
      area.innerHTML = '<div class="view-container">' + renderOverview() + '</div>';
  }
  updateTimeHighlight();
  window.scrollTo(0, 0);
}
