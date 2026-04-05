# shift-parser 스킬 v1.0
> shift 시트(근무표/연장근무 합계, sheet2) 데이터 파싱 규칙 및 알고리즘

---

## 0. 절대 규칙 ★위반 금지★

> ⛔ **Google Sheet 데이터 조회 시 WebFetch 절대 사용 금지**
> WebFetch AI 요약은 셀 값·인덱스·fontColors를 부정확하게 반환한다.
> H5=20인데 21로, H6="금"인데 "off"로 반환하는 등 반복 오류 확인 (2026-04-06).
>
> **반드시 이 방법만 사용:**
> ```bash
> curl -sL 'APPS_SCRIPT_URL?action=getSheetData&sheetKey=sheet2&gid=GID' -o /tmp/data.json
> python3 -c "import json; data=json.load(open('/tmp/data.json'))['data']; rows=data['rows']; fc=data['fontColors']; ..."
> ```

---

## 1. 명칭 정의

| 코드 키 | 명칭 |
|---------|------|
| `sheet2` 스프레드시트 | **shift** |
| `/sheets/` 페이지의 근무표 섹션 | **근무표** / **Duty 섹션** |

---

## 2. shift 탭 구조

- 탭 이름 = 날짜 범위. 예: `26.3/16~4/15` → 2026년 3월 16일 ~ 4월 15일
- 근무표는 **n월 16일 ~ n+1월 15일** 형태 (2개월에 걸친 한 달치)
- 날짜는 항상 **16일 시작 → 15일 종료** (2월 28일, 3월 31일 등 일수 무관)

### 탭 경계 주의
- 탭 경계 날짜에서 전날/다음날 데이터가 **다른 탭**에 있을 수 있음
- 인수인계 근무자 표시 시 인접 탭도 함께 로드 필요

---

## 3. 시트 내부 구조

### 직원/근무형태 탐색
```
A열(1열)을 1행부터 스캔:
  - 최초 숫자 행 ~ 마지막 숫자 행 → 직원 구간
  - C열(3열) 해당 구간 → 직원 이름 목록

직원 마지막 행 + 1행부터 10개 행 → 근무형태 제목
  (D, E, N, M, MD, MD2, 낮당, 휴낮, 당직, 휴당)
```

### 열 표기 규칙
- 열 언급 시 반드시 **알파벳+숫자 동시 표기**
- 예: A열(1열), D열(4열), AG열(33열)

---

## 4. 날짜/요일/휴일 탐색 알고리즘

> 테이블 시작 행이 탭마다 다르므로 **행 번호 하드코딩 절대 금지**
> 반드시 D열(4열) 스캔으로 동적 탐색

### 탐색 순서

```
Step 1. D열(인덱스3) rows[0]부터 순서대로 스캔
        → "X월" (endswith('월'), 길이 ≤ 3) 첫 등장 행 = month_row_idx
        → 값 = first_month (전반부 월)

Step 2. date_row_idx = month_row_idx + 1  ← 날짜 행
        day_row_idx  = month_row_idx + 2  ← 요일 행

Step 3. 날짜 행 왼쪽→오른쪽 스캔:
        - 첫 번째 16  → date_start_col
        - 16 이후 첫 번째 15 → date_end_col

Step 4. date_start_col ~ date_end_col 순회:
        - 날짜 숫자가 이전보다 작아지는 지점 → current_month += 1

Step 5. fontColors[day_row_idx][col] == '#ff0000' → 휴일
        (토/일 + 공휴일 모두 빨간색)
```

### Python 구현

```python
import json

with open('/tmp/shift_data.json') as f:
    data = json.load(f)['data']

rows = data['rows']
fc   = data['fontColors']

MONTH_COL = 3  # D열(4열)
month_row_idx = None
first_month   = None

for r_idx, row in enumerate(rows):
    val = str(row[MONTH_COL]).strip() if len(row) > MONTH_COL else ''
    if val.endswith('월') and len(val) <= 3:
        month_row_idx = r_idx
        first_month   = int(val.replace('월', ''))
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
    # date_val, day_val, current_month, is_holiday 활용
```

---

## 5. 행 번호 오프셋 주의사항

- API `headers` = 실제 1행, `rows[0]` = 실제 2행
- **실제 행 번호 = rows 인덱스 + 2**
- 병합 셀(예: D2:S2)이 있으면 API가 공백 반환 → 행 카운트 오류 유발
- 반드시 실측값과 대조하여 오프셋 확인

---

## 6. API 정보

```
SheetViewerService.gs API URL (sheets/ 전용):
https://script.google.com/macros/s/AKfycbzhaQRh-P7RFHUlc4-3DFrdiLWs_IegB0UCI-YCDddZ9nQGSDPRR3FT8blBcDKnOmkfmg/exec

sheet2 스프레드시트 ID: 1wmNAd3fjIkt0q8ytZFGB7jlw148cW_STdDAh_sosTzw

주요 탭 (2026 기준):
  26.3/16~4/15  gid: 2106514365
  26.4/16~5/15  gid: 568469962

반환 구조:
  data.rows[rowIdx][colIdx]        → 셀 값
  data.fontColors[rowIdx][colIdx]  → 텍스트 색상 (#ff0000=빨강, #000000=검정)
```

---

## 7. 근무형태 및 표시 규칙

### 표준 근무형태 (11종)
D, M, MD, MD2, E, N, 낮당, 휴낮, 휴당, 당직, 휴가

### Off 분류 규칙
| 셀 값 | 표시 | 비고 |
|-------|------|------|
| 휴가 | Off — 이름(휴가) | 표준 11종에 포함 |
| 특휴 | Off — 이름(특휴) | 임시 근무형태 |
| Off | Off — 이름 (괄호 없음) | |

### 평일 레이아웃
```
D행 (있을 때만) | 직원 이름
M행             | 직원들 이름 (줄바꿈 가능)
MD | 직원       | MD2 | 직원 (쌍)
E  | 직원       | N   | 직원 (쌍)
낮당/휴낮/휴당/당직 (있을 때만, 단독행)
Off             | 직원 이름들
비표준 근무형태  | 직원 이름 (맨 아래)
```

### 휴일 레이아웃 (토/일/공휴일)
```
휴낮 | 직원 (1~2명)
낮당 | 직원
당직 | 직원
휴당 | 직원
(없는 형태 생략, 다음 줄로 당김)
```

### 기타 규칙
- 근무형태 카운트 행(직원 마지막 행 +1부터 10행)은 무시 — 행정용
- 비표준 근무형태(예: 휴직)는 그대로 등록, 맨 아래 표시

---

## 8. 탭 매칭 주의사항 (2026-04-06 버그 수정)

> ⚠️ sheet2에 2021~2025년 과거 탭이 수십 개 존재한다.
> 일부 탭(예: "3/16~4/15")은 연도 접두사가 없어 `parseShiftPeriod`가
> 현재 연도로 해석하여 오매칭을 유발한다.
>
> **필수 규칙:**
> 1. `findShiftTab`에서 현재 연도 접두사(예: `26.`)가 있는 탭을 **1차 우선 탐색**
> 2. `parseShiftPeriod` regex는 연도 접두사를 건너뛰어야 한다:
>    `(?:\d{2,4}['.]\s*)?` 옵션 그룹으로 "26.", "22' " 등을 무시
> 3. "26.1/16~**26.**2/15" 형태에서 끝 날짜의 연도 접두사도 처리 필수

---

## 9. 검증 완료 사항 (2026-04-06)

| 탭 | 결과 |
|----|------|
| 26.3/16~4/15 | 월 텍스트 D4, 날짜행 5행, 요일행 6행 확인 ✅ |
| 26.4/16~5/15 | 월 텍스트 D5, 날짜행 6행, 요일행 7행 확인 ✅ (시작행 다름) |
| 5/1(근로자의 날), 5/5(어린이날) | 빨간색 공휴일 정상 감지 ✅ |
