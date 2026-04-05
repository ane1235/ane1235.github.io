/* Sheets — nav.js V1.0 */
/* 메인 페이지와 동일한 드롭다운 동작 (sheets 전용: showView 없음, 링크 이동만) */

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
  document.querySelectorAll('.submenu').forEach(function(el) { el.classList.remove('show'); });
  if (!isOpen) menu.classList.add('show');
}

function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-menu').forEach(function(el) { el.classList.remove('show'); });
  document.querySelectorAll('.submenu').forEach(function(el) { el.classList.remove('show'); });
}

document.addEventListener('click', function(e) {
  if (!e.target.closest('.nav-item')) closeAllDropdowns();
});
