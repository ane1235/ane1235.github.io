/* 근무 대시보드 — calendar.js V1.0 */
/* iOS Calendar 스타일 날짜 선택기 */

var DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
var MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

/* ── 선택된 날짜 (전역) ── */
var selectedDate = new Date();
var calendarOpen = false;
var calendarMonth = null;  /* 달력에 표시 중인 월 */
var calendarYear = null;

/* ── 날짜 포맷 ── */

function formatDateDisplay(d) {
  var y = d.getFullYear();
  var m = d.getMonth() + 1;
  var day = d.getDate();
  var dow = DAY_NAMES[d.getDay()];
  return y + '년 ' + m + '월 ' + day + '일 (' + dow + ')';
}

function isToday(d) {
  var now = new Date();
  return d.getFullYear() === now.getFullYear() &&
         d.getMonth() === now.getMonth() &&
         d.getDate() === now.getDate();
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}

/* ── 날짜 카운터 렌더링 ── */

function renderDateCounter() {
  var todayLabel = isToday(selectedDate) ? ' <span class="today-badge">오늘</span>' : '';
  var html = '';
  html += '<div class="date-counter" onclick="toggleCalendar()">';
  html += '<span class="material-icons" style="font-size:24px; color:#0f9d58; margin-right:8px;">calendar_today</span>';
  html += '<span class="date-text">' + formatDateDisplay(selectedDate) + todayLabel + '</span>';
  html += '<span class="material-icons" style="font-size:18px; color:#94a3b8; margin-left:8px;">' + (calendarOpen ? 'expand_less' : 'expand_more') + '</span>';
  html += '</div>';

  /* 달력 패널 */
  html += '<div id="calendar-panel" class="calendar-panel' + (calendarOpen ? ' open' : '') + '">';
  html += renderCalendarGrid();
  html += '</div>';

  return html;
}

/* ── 달력 그리드 ── */

function renderCalendarGrid() {
  var viewYear = calendarYear !== null ? calendarYear : selectedDate.getFullYear();
  var viewMonth = calendarMonth !== null ? calendarMonth : selectedDate.getMonth();

  var html = '';
  /* 헤더: 이전 월 | 년월 | 다음 월 */
  html += '<div class="cal-header">';
  html += '<span class="cal-nav" onclick="event.stopPropagation(); calendarPrev()"><span class="material-icons">chevron_left</span></span>';
  html += '<span class="cal-title">' + viewYear + '년 ' + (viewMonth + 1) + '월</span>';
  html += '<span class="cal-nav" onclick="event.stopPropagation(); calendarNext()"><span class="material-icons">chevron_right</span></span>';
  html += '</div>';

  /* 요일 헤더 */
  html += '<div class="cal-weekdays">';
  for (var w = 0; w < 7; w++) {
    var cls = w === 0 ? ' sun' : (w === 6 ? ' sat' : '');
    html += '<div class="cal-wd' + cls + '">' + DAY_NAMES[w] + '</div>';
  }
  html += '</div>';

  /* 날짜 그리드 */
  var firstDay = new Date(viewYear, viewMonth, 1).getDay();
  var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  var today = new Date();

  html += '<div class="cal-days">';
  /* 빈 칸 (첫째 주 앞) */
  for (var b = 0; b < firstDay; b++) {
    html += '<div class="cal-day empty"></div>';
  }
  /* 날짜 */
  for (var d = 1; d <= daysInMonth; d++) {
    var thisDate = new Date(viewYear, viewMonth, d);
    var cls = 'cal-day';
    var dayOfWeek = thisDate.getDay();
    if (dayOfWeek === 0) cls += ' sun';
    if (dayOfWeek === 6) cls += ' sat';
    if (isSameDay(thisDate, today)) cls += ' today';
    if (isSameDay(thisDate, selectedDate)) cls += ' selected';
    html += '<div class="' + cls + '" onclick="event.stopPropagation(); selectDate(' + viewYear + ',' + viewMonth + ',' + d + ')">' + d + '</div>';
  }
  html += '</div>';

  /* 오늘로 돌아가기 버튼 */
  if (!isToday(selectedDate)) {
    html += '<div class="cal-today-btn" onclick="event.stopPropagation(); goToToday()">오늘로 돌아가기</div>';
  }

  return html;
}

/* ── 달력 조작 ── */

function toggleCalendar() {
  calendarOpen = !calendarOpen;
  if (calendarOpen) {
    calendarYear = selectedDate.getFullYear();
    calendarMonth = selectedDate.getMonth();
  }
  refreshDashboard();
}

function calendarPrev() {
  if (calendarMonth === 0) {
    calendarMonth = 11;
    calendarYear--;
  } else {
    calendarMonth--;
  }
  var panel = document.getElementById('calendar-panel');
  if (panel) panel.innerHTML = renderCalendarGrid();
}

function calendarNext() {
  if (calendarMonth === 11) {
    calendarMonth = 0;
    calendarYear++;
  } else {
    calendarMonth++;
  }
  var panel = document.getElementById('calendar-panel');
  if (panel) panel.innerHTML = renderCalendarGrid();
}

function selectDate(y, m, d) {
  selectedDate = new Date(y, m, d);
  calendarOpen = false;
  refreshDashboard();
}

function goToToday() {
  selectedDate = new Date();
  calendarOpen = false;
  refreshDashboard();
}
