/* KSCTVA 2026 — nav.js V4.0 */
/* V4.0: 페이지 이동 시 동료 데이터 갱신 */

function buildDropdownMenus() {
  var map = APP_DATA.menuMap;

  var dd1 = document.getElementById('dropdown-day1');
  dd1.innerHTML = '';
  map.DAY1.forEach(function(item) {
    var d = document.createElement('div');
    d.className = 'dropdown-item'; d.textContent = item.label;
    d.onclick = function(e) { e.stopPropagation(); closeAllDropdowns(); showView('session', item.tab); };
    dd1.appendChild(d);
  });

  var dd2 = document.getElementById('dropdown-day2');
  dd2.innerHTML = '';
  map.DAY2.forEach(function(item) {
    var d = document.createElement('div');
    d.className = 'dropdown-item'; d.textContent = item.label;
    d.onclick = function(e) { e.stopPropagation(); closeAllDropdowns(); showView('session', item.tab); };
    dd2.appendChild(d);
  });
}

function toggleDropdown(id) {
  var menu = document.getElementById('dropdown-' + id);
  var open = menu.classList.contains('show');
  closeAllDropdowns();
  if (!open) menu.classList.add('show');
}

function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-menu').forEach(function(el) { el.classList.remove('show'); });
}

document.addEventListener('click', function(e) {
  if (!e.target.closest('.nav-item')) closeAllDropdowns();
});

/* 뷰 라우터 */
function showView(viewName, param) {
  state.currentView = viewName;
  var area = document.getElementById('content-area');
  document.querySelectorAll('.nav-item').forEach(function(el) { el.classList.remove('active'); });

  switch (viewName) {
    case 'overview':
      area.innerHTML = '<div class="view-container">' + renderOverview() + '</div>'; break;
    case 'session':
      state.currentTab = param;
      area.innerHTML = '<div class="view-container">' + renderSession(param) + '</div>';
      if (param && param.startsWith('Day1')) document.getElementById('nav-day1').classList.add('active');
      if (param && param.startsWith('Day2')) document.getElementById('nav-day2').classList.add('active');
      break;
    case 'mypage':
      area.innerHTML = '<div class="view-container">' + renderMyPage() + '</div>';
      document.getElementById('nav-mypage').classList.add('active'); break;
    default:
      area.innerHTML = '<div class="view-container">' + renderOverview() + '</div>';
  }
  updateTimeHighlight();
  window.scrollTo(0, 0);
}
