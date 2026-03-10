/**
 * ============================================================
 * Config.gs — KSCTVA26 전역 설정 상수
 * ============================================================
 * 역할: 시트 ID, 탭 이름, 세션 매핑 등 프로젝트 전체에서 사용하는
 *       상수를 한 곳에서 관리한다.
 *       다른 .gs 파일에서 CONFIG.SPREADSHEET_ID 처럼 접근한다.
 * 
 * 수정 시 주의: 이 파일만 수정하면 전체 프로젝트에 반영된다.
 *              탭 이름이 실제 시트와 정확히 일치해야 한다.
 * ============================================================
 */

var CONFIG = {

  // ── 스프레드시트 ID ──
  // KSCTVA26 시트의 고유 식별자 (URL에서 /d/ 와 /edit 사이의 문자열)
  SPREADSHEET_ID: "12KeGjyFvpZ6cSkKsuMrxmCBpBTBRzY3p21xQc5gtOBI",

  // ── 탭(시트) 이름 ──
  // 실제 시트의 탭 이름과 정확히 일치해야 한다
  SHEET_NAMES: {
    OVERVIEW:   "overview",      // 전체일정 개요
    ANE:        "ANE",           // 로그인용 사번+이름 목록 (19명)
    SELECTIONS: "Selections",    // 강좌 선택 저장 (SN2, selections)
    DAY1_A1:    "Day1_A1",       // Day1 오전: Session 1(Room1) + Session 2(Room2)
    DAY1_P1:    "Day1_P1",       // Day1 오후: Session 3(Room1&2 공통, 영어)
    DAY1_P2:    "Day1_P2",       // Day1 오후: Session 4(Room1) + Session 5(Room2)
    DAY1_P3:    "Day1_P3",       // Day1 오후: Session 6(Room1) + Session 7(Room2)
    DAY2_A1:    "Day2_A1",       // Day2 오전: Session 9(Room1) + Session 10(Room2)
    DAY2_P1:    "Day2_P1",       // Day2 오후: Session 11(Room1) + Session 12(Room2)
    DAY2_P2:    "Day2_P2"        // Day2 오후: Session 13(Room1) + Session 14(Room2)
  },

  // ── 세션별 데이터 탭 목록 (overview, ANE, Selections 제외) ──
  // DataService.getAllData()에서 이 목록을 순회하며 데이터를 가져온다
  SESSION_TABS: ["Day1_A1", "Day1_P1", "Day1_P2", "Day1_P3", "Day2_A1", "Day2_P1", "Day2_P2"],

  // ── 서브메뉴 매핑 ──
  // Top 메뉴바의 Day1/Day2 서브메뉴 구성
  // label: 메뉴에 표시할 텍스트
  // tab: 데이터를 가져올 시트 탭 이름
  // day: 소속 날짜 (1 또는 2)
  MENU_MAP: {
    DAY1: [
      { label: "오전 세션 1,2",  tab: "Day1_A1", day: 1 },
      { label: "오후 세션 3",    tab: "Day1_P1", day: 1 },
      { label: "오후 세션 4,5",  tab: "Day1_P2", day: 1 },
      { label: "오후 세션 6,7",  tab: "Day1_P3", day: 1 }
    ],
    DAY2: [
      { label: "오전 세션 9,10",  tab: "Day2_A1", day: 2 },
      { label: "오후 세션 11,12", tab: "Day2_P1", day: 2 },
      { label: "오후 세션 13,14", tab: "Day2_P2", day: 2 }
    ]
  },

  // ── 학회 정보 ──
  EVENT: {
    TITLE: "KSCTVA 2026 춘계 학술대회",
    SUBTITLE: "대한심폐혈관마취학회 2026년 춘계 학술대회",
    DATE_DAY1: "2026-04-11",    // Day 1 날짜 (토요일)
    DATE_DAY2: "2026-04-12",    // Day 2 날짜 (일요일)
    VENUE: "연세대학교 백양누리 그랜드 볼룸"
  },

  // ── GitHub Pages (정적 자산) ──
  GITHUB_PAGES_URL: "https://ane1235.github.io",

  // ── ANE 탭 컬럼 인덱스 (0-based) ──
  // ANE 탭의 헤더: SN2(사번) | 이름
  ANE_COLUMNS: {
    SN2:  0,   // A열: 사번 (8자리 숫자)
    NAME: 1    // B열: 이름
  },

  // ── Selections 탭 컬럼 인덱스 (0-based) ──
  // Selections 탭의 헤더: SN2 | selections
  SEL_COLUMNS: {
    SN2:        0,   // A열: 사번
    SELECTIONS: 1    // B열: 선택한 강좌 ID 목록 (JSON 문자열)
  }
};
