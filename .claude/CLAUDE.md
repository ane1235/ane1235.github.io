# CLAUDE.md — ane1235.github.io 프로젝트 지침

## ★ Top Menu Bar 절대 원칙 ★ (2026-04-08 선언)

> ane1235.github.io의 **모든 페이지**에서 top menu bar 구조는 **반드시 동일**하다.
> 데스크탑/모바일 모두 동일. 색상만 페이지별로 달라진다.

### 고정 구조 (순서 불변)

```html
<nav class="navbar">
  <!-- 1. 홈 -->
  <div class="nav-item nav-bordered" onclick="location.href='/sheets/'" style="font-weight:700;">
    <span class="material-icons mr-1" style="font-size:22px;">home</span>홈
  </div>
  <!-- 2. ASSIGN -->
  <div class="nav-item nav-wip" onclick="location.href='/sheets/'">
    <span class="material-icons mr-1" style="font-size:18px;">assignment</span>
    <span style="font-size:12px;">ASSIGN</span>
  </div>
  <!-- 3. CALC -->
  <div class="nav-item nav-bordered" onclick="location.href='/calc/'" style="font-size:11px; letter-spacing:0.08em; font-weight:700;">
    <span class="material-icons mr-1" style="font-size:14px;">calculate</span>CALC
  </div>
  <!-- 4. 심폐마취학회2026 드롭다운 -->
  <div class="nav-item nav-bordered" onclick="toggleDropdown('ksctva')" id="nav-ksctva" style="font-size:12px;">
    심폐마취학회2026 <span class="material-icons" style="font-size:16px; margin-left:2px;">arrow_drop_down</span>
    <!-- ... 드롭다운 내용 ... -->
  </div>
  <!-- 5. 유저 표시 + 로그아웃 (ml-auto) -->
  <div class="ml-auto flex items-center text-sm opacity-80">
    <span id="user-display" class="hidden sm:inline"></span>
    <span class="material-icons ml-2 cursor-pointer" style="font-size:20px;" onclick="handleLogout()" title="로그아웃">logout</span>
  </div>
</nav>
```

### 페이지별 차이
- **색상만** 변경 가능: navbar `background-color`, 테마 accent 색
- **구조·순서·아이템** 변경 금지

### 현재 활성 페이지 표시
- 해당 페이지의 nav-item에 `active` 클래스 추가

### 로그인 세션 공유
- `localStorage` key: `'ksctva_user'` (`{name, sn2}`)
- 전 페이지가 동일 키 공유

---

## 기술 스택
- Vanilla JS + HTML5, Tailwind CSS (CDN), Material Icons (CDN)
- 빌드 없음, GitHub Pages 직접 배포
- 캐시 버스팅: `?v=` 쿼리 파라미터

## 파일 구조
- `/sheets/` — 홈 (근무 대시보드)
- `/ksctva/` — 심폐마취학회2026 학술대회
- `/calc/` — 의료 계산기 (v1.0)
