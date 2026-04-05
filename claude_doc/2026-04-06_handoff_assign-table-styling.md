# Handoff Note — Assign 테이블 스타일링 + 모바일 최적화
**작성일**: 2026-04-06  
**세션 주제**: Assign 섹션 테이블 컬럼 고정, 모바일 반응형 최적화, 캐시 버스팅  
**최종 커밋**: `b1ea8e3` (Duty & Assign 띄어쓰기, Build 0006)

---

## I. 완료된 변경사항

### 1. Assign 테이블 컬럼 구조 변경

#### 1-1. 헤더 변경
- `마취` → `마취의`
- `회복간호사` → `마취회복팀`
- 제목행 전체 가운데 정렬

#### 1-2. CATH 집도의 표시 기능
- `CATH_SURGEONS` 배열 상수 (`app.js` 상단)
- 명단: 방지석, 김정윤, 박상원, 박하욱, 김성호, 정현, 이의재
- 해당 집도의의 수술명 앞에 `[CATH] ` 접두사 자동 삽입
- 명단 변경 시 `CATH_SURGEONS` 배열만 수정하면 됨

#### 1-3. 시간 정규화 (`normalizeTime` 함수)
- 콜론 포함 시간의 후행 A/P 제거: `10:30A` → `10:30`, `1:30P` → `1:30`
- 콜론 없는 시간은 유지: `8A`, `9A`, `TF` 등 그대로

### 2. 컬럼 폭 설정

**글로벌 (ch 단위):**
| 컬럼 | 폭 |
|------|-----|
| 시간 | 6ch |
| 집도의 | 6ch |
| 마취의 | 6ch |
| 마취회복팀 | 12ch |
| 수술명 (데스크탑) | 40ch |

**모바일 세로 (px 고정):**
| 컬럼 | 폭 | 글꼴 | letter-spacing |
|------|-----|------|---------------|
| 시간 | 50px | 11px | -1px |
| 집도의 | 45px | 11px | -0.5px |
| 마취의 | 32px | 12px | — |
| 마취회복팀 | 80px | 12px | -0.5px |
| 수술명 | auto | 12px | -0.5px |
| td padding | 4px 4px | | |

**모바일 가로 (px 고정):**
| 컬럼 | 폭 | 글꼴 |
|------|-----|------|
| 시간 | 75px | 19px |
| 집도의 | 80px | 19px |
| 수술명 | 250px | 18px |
| 마취의 | 48px | — |
| 마취회복팀 | 120px | 20px |

### 3. 모바일 iframe 가로 스크롤 방지

Google Sites iframe 내에서 가로 스크롤 발생 문제를 해결:
- `html, body { overflow-x: hidden; max-width: 100%; }`
- `.assign-table { table-layout: fixed; min-width: auto; }`
- `.assign-table-wrap { overflow-x: hidden; }` (테이블 좌우 흔들림 방지)
- `.assign-table td { word-break: keep-all; overflow-wrap: break-word; }`
- KSCTVA 페이지에서 사용한 동일 패턴

### 4. 페이지 구조 변경

- `오늘 근무 및 할 일들` 제목 + 아이콘 삭제 (공간 확보)
- 날짜 카운터에 `Duty & Assign` 라벨 추가 (왼쪽, 녹색 #0b6e3d)
- 날짜 그룹 오른쪽 배치 (`space-between`)
- 페이지 하단 copyright: `created by Dr.Min Build 260406.0006`

### 5. 날짜 카운터 크기

| 모드 | max-width |
|------|-----------|
| 데스크탑 | 400px |
| 모바일 세로 | 367px |
| 모바일 가로 | 600px |

### 6. 자동 캐시 버스팅

모바일 Chrome 캐시 문제 해결:
- CSS: `<link>` 태그에 `Date.now()` 파라미터 동적 삽입
- JS: `document.write`로 모든 스크립트에 `?v=timestamp` 자동 추가
- HTML: `Cache-Control: no-cache, no-store, must-revalidate` 메타 태그

---

## II. 변경된 파일

```
sheets/
├── index.html          ← 캐시 버스팅 + cache-control 메타 태그
├── css/style.css       ← 컬럼 폭, 가로/세로 모드, iframe 스크롤 방지
└── js/
    ├── app.js          ← CATH_SURGEONS, normalizeTime, 제목 삭제, copyright
    └── calendar.js     ← Duty & Assign 라벨, date-group 래핑
```

---

## III. 다음 세션 예정 작업

**근무표 및 특기사항 데이터 추출 및 표시 알고리즘**
- 현재 상태: `데이터 영역 (레이아웃 구상 중)` 플레이스홀더
- 데이터 소스: `sheet2` (근무표 및 특기사항 시트)
- 탭 매칭: `findShiftTab()` 함수 이미 구현됨 (기간 기반 탭 매칭)
- API 호출: `callApi({ action: 'getSheetData', sheetKey: 'sheet2', gid: tab.gid })` 패턴 사용
- Assign 섹션의 `loadAssignData()` → `renderAssignSection()` 패턴을 참고하여 유사하게 구현

---

## IV. 커밋 이력 (이번 세션)

| 커밋 | 내용 |
|------|------|
| `8a7fb5c` | 컬럼 폭 고정(ch) + 헤더 변경 + CATH 집도의 표시 |
| `625d5f5` | 모바일 iframe 가로 스크롤 방지 |
| `8e49f2f` | 테이블 흔들림 방지 + 시간 정규화 + 컬럼 폭 미세조정 |
| `be1f57a` | 시간 6ch 복원, 마취회복팀 12ch |
| `a43118b` | 모바일 컬럼 px 전환 + padding 축소 |
| `1e5c2e5` | 모바일 컬럼 폭 조정 |
| `021e95a` | 모바일 시간 글꼴 11px |
| `fa13ed3` | letter-spacing 조정 |
| `16639d4` | 가로 모드 레이아웃 + 시간 후행 P 제거 |
| `55ddb29` | 자동 캐시 버스팅 |
| `5549a4d` | HTML 캐시 방지 메타 태그 |
| `8efb136` | 가로 모드 수술명 270px, 글꼴 확대 |
| `8e72b47` | 제목 삭제 + DUTY 라벨 추가 |
| `d238412` | copyright 라인 추가 |
| `dbb7748` | Duty&Assign + 왼쪽 정렬 |
| `cacb9d4` | space-between 배치 |
| `2416c10` | Duty&Assign 글꼴 축소 + 카운터 padding 축소 |
| `eb3c491` | date-counter-wrap 345px 고정 |
| `095ab9b` | 카운터 360px |
| `eaa01c7` | 가로 모드 카운터 600px |
| `b1ea8e3` | Duty & Assign 띄어쓰기 + 카운터 367px |
