# Handoff Note — shift 시트 파싱 알고리즘 수립
**작성일**: 2026-04-06
**세션 주제**: shift(근무표/연장근무 합계) 시트 데이터 읽기 규칙 및 알고리즘 수립
**관련 파일**: `scripts/SheetViewerService.gs`, `sheets/js/app.js`

---

## I. 명칭 정의 (변경 금지)

| 코드 키 | 명칭 |
|---------|------|
| `sheet2` 스프레드시트 | **shift** |
| `/sheets/` 페이지의 근무표 및 특기사항 섹션 | **근무표** 또는 **Duty 섹션** |

---

## II. shift 시트 구조

### 탭 구조
- 탭 이름 = 날짜 범위. 예: `26.3/16~4/15` → 2026년 3월 16일 ~ 4월 15일
- 근무표는 **n월 16일 ~ n+1월 15일** 형태 (2개월에 걸친 한 달치)
- 날짜는 항상 **16일 시작 → 15일 종료**

### 탭 경계 주의사항
- 탭 경계(시작일/종료일) 근처에서 전날/다음날 데이터가 **다른 탭**에 있을 수 있음
- 인수인계 근무자 표시 시 인접 탭 참조 필요

### 직원/근무형태 구조
- A열(1열)을 1행부터 스캔 → 최초 숫자 행 ~ 마지막 숫자 행 = 직원 구간
- C열(3열) 직원 구간 = 직원 이름 목록
- 직원 마지막 행 +1행부터 10개 행 = 근무형태 제목 (D, E, N, M, MD, MD2, 낮당, 휴낮, 당직, 휴당)
- 현재 탭(26.3/16~4/15) 기준: 직원 7~19행(13명), 근무형태 20~29행

---

## III. 날짜/요일/휴일 탐색 알고리즘

### 핵심 규칙
- 테이블 시작 행이 탭마다 다를 수 있으므로 **행 번호 하드코딩 금지**
- 반드시 D열(4열) 스캔으로 동적 탐색

### 알고리즘 순서

```
1. D열(인덱스3)을 rows[0]부터 순서대로 스캔
   → "X월" 패턴(endswith('월'), 길이 ≤ 3)이 처음 나오는 행 = month_row_idx
   → 그 값 = first_month (전반부 월)

2. date_row_idx = month_row_idx + 1  ← 날짜 행
   day_row_idx  = month_row_idx + 2  ← 요일 행

3. 날짜 행에서 왼쪽→오른쪽 스캔:
   - 첫 번째 16  = date_start_col
   - 16 이후 첫 번째 15 = date_end_col

4. date_start_col ~ date_end_col 순회:
   - 날짜 숫자가 이전보다 작아지는 지점 → current_month += 1 (월 전환)

5. 요일 행 fontColors[day_row_idx][col] == '#ff0000' → 휴일
   (토/일 + 공휴일 모두 빨간색으로 표시됨)
```

### Python 구현 (검증 완료)

```python
import json

with open('/tmp/shift_data.json') as f:
    data = json.load(f)['data']

rows = data['rows']
fc = data['fontColors']

MONTH_COL = 3  # D열(4열)
month_row_idx = None
first_month = None

for r_idx, row in enumerate(rows):
    val = str(row[MONTH_COL]).strip() if len(row) > MONTH_COL else ''
    if val.endswith('월') and len(val) <= 3:
        month_row_idx = r_idx
        first_month = int(val.replace('월', ''))
        break

date_row_idx = month_row_idx + 1
day_row_idx  = month_row_idx + 2
date_row   = rows[date_row_idx]
day_row    = rows[day_row_idx]
day_colors = fc[day_row_idx]

date_start_col = None
date_end_col   = None
for c_idx, val in enumerate(date_row):
    if date_start_col is None:
        if isinstance(val, (int, float)) and int(val) == 16:
            date_start_col = c_idx
    else:
        if isinstance(val, (int, float)) and int(val) == 15:
            date_end_col = c_idx
            break

current_month = first_month
for c in range(date_start_col, date_end_col + 1):
    date_val = date_row[c]
    day_val  = day_row[c]
    color    = day_colors[c]
    if c > date_start_col:
        prev = date_row[c-1]
        if isinstance(date_val,(int,float)) and isinstance(prev,(int,float)):
            if int(date_val) < int(prev):
                current_month += 1
    is_holiday = (color == '#ff0000')
```

---

## IV. 행 번호 오프셋 주의사항 ★치명적 오류 방지★

- API `headers` = 실제 1행, `rows[0]` = 실제 2행
- **실제 행 번호 = rows 인덱스 + 2**
- 병합 셀(예: D2:S2)이 있으면 API가 해당 값을 공백으로 반환 → 행 카운트 오류 유발
- 반드시 실측값과 대조하여 오프셋 확인 후 사용

---

## V. Google Sheet 데이터 조회 절대 규칙

> ⛔ **WebFetch 절대 사용 금지**
> WebFetch AI 요약이 셀 값을 잘못 반환하는 오류 반복 확인
> (H5=20인데 21로, H6="금"인데 "off"로 반환 등)
>
> **허용 방법만 사용:**
> ```bash
> curl -sL 'APPS_SCRIPT_URL?action=getSheetData&sheetKey=sheet2&gid=GID' -o /tmp/data.json
> python3 -c "import json; data=json.load(open('/tmp/data.json'))['data']; ..."
> ```

---

## VI. GAS 백엔드 변경사항

- `SheetViewerService.gs` `getSheetData()` 에 `getFontColors()` 추가 (2026-04-06 배포 완료)
- 반환 JSON에 `fontColors` 필드 추가: `data.fontColors[rowIdx][colIdx]` → 텍스트 색상값

---

## VII. 다음 세션 예정 작업

- shift 시트의 **각 직원별 근무 데이터** 읽기 규칙 학습 (미완료)
- 위 알고리즘을 `sheets/js/app.js`의 Duty 섹션 렌더링에 실제 구현
