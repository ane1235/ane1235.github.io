# CSV 기반 의류 데이터 관리

**수정 원본은 `models.csv`, `sizes.csv` 두 파일.** 모델별 HTML 생성 없이 공통 조회·비교 화면에서 `data.json` 호출. 새 데이터 추가 후 아래 명령으로 파생 파일 갱신.

```sh
python3 report/clothes/build.py
```

명령은 저장소 루트 기준. Python 표준 라이브러리만 사용. 검증 성공 후 `data.json`, `DATABASE.md`, `static.html` 자동 생성. CSV와 생성 결과를 함께 커밋·배포하면 반영. 저장소에 CSV만 올리고 생성 명령을 생략하면 공개 데이터에 반영되지 않음.

## 파일 역할

| 파일 | 역할 | 직접 수정 |
|---|---|---|
| `models.csv` | 모델별 기본정보·출처. 한 모델 한 행 | 가능 |
| `sizes.csv` | 모델별 사이즈·치수. 한 사이즈 한 행 | 가능 |
| `data.json` | 두 CSV를 결합한 웹 조회 데이터 | 금지: 자동 생성 |
| `DATABASE.md` | 데이터 사전·모델 목록·치수표·출처 기록 | 금지: 자동 생성 |
| `index.html`, `viewer.js` | 공통 조회 화면. 메이커 → 모델 → 사이즈 | 화면 수정 시만 |
| `compare.html`, `compare.js` | 공통 대응 사이즈 비교 화면 | 화면 수정 시만 |
| `static.html` | JavaScript 없이 읽는 전체표 | 금지: 자동 생성 |
| `templates/page.html`, `templates/item.html` | 정적 전체표 생성 틀 | 양식 수정 시만 |
| `legacy-models.json`, `items/`의 HTML | 이미 게시한 주소의 이동 안내 | 새 모델 추가 시 변경 불필요 |

## 새 모델 추가

1. `models.csv`에 모델 한 행 추가. 같은 메이커에는 같은 `brand_id`·`brand_name`·`brand_url` 사용.
2. `sizes.csv`에 같은 `model_id`로 약 4개의 사이즈 행 추가. 개수 제한 없음.
3. 치수는 cm 단위 숫자 입력. 미제공 값은 빈칸. `0`, `null`, `—` 문자 입력 금지.
4. `python3 report/clothes/build.py` 실행. ID·조회일자·링크·치수 오류 수정 후 재실행.
5. 공통 조회·비교·정적 전체표 확인 후 CSV와 생성 파일 함께 배포.

`templates/models.example.csv`, `templates/sizes.example.csv`는 복사할 행의 입력 예시. 예시 ID·이름·링크·조회일자 교체 후 **기존 CSV의 헤더 아래에 행만 추가**. 예시 파일은 사이트에서 읽지 않음.

## models.csv 열

| 열 | 입력 기준 |
|---|---|
| `model_id` | 고유 모델 ID. 영문 소문자·숫자·하이픈. 기존 URL 유지를 위해 게시 후 유지 |
| `brand_id` | 메이커 ID. 같은 메이커의 여러 모델에서 같은 값 |
| `brand_name`, `model_name` | 메이커명·모델명 |
| `checked_at` | 실제 조회·확인일 `YYYY-MM-DD` |
| `brand_url` | 메이커 홈페이지 또는 공식 브랜드관 |
| `model_url` | 제품 모델 페이지 |
| `chart_url` | 확인한 조견표의 페이지 또는 이미지 |
| `source_label`, `source_note` | 링크 표시명·출처 코멘트. 공식 자료 여부에 맞는 표현 사용 |
| `measurement_note` | 측정 방법·실측 오차·대응 미확인 등. 없으면 빈칸 |
| `chart_image_url` | 원본 조견표 이미지. 없으면 빈칸 |
| `measurements` | 표시할 측정 열을 `shoulder\|chest\|sleeve\|length\|hem`처럼 구분. 순서대로 표시 |
| `requested_url`, `requested_status` | 요청 링크와 직접 확인 여부. 선택값 |
| `crosscheck_url`, `crosscheck_chart_url` | 교차검증 페이지·이미지. 선택값 |

## sizes.csv 열

- `model_id`: models.csv에 있는 모델 ID.
- `size`: 원표기 문자열. `95`, `110`, `M`, `XXL` 등. 같은 모델 내 중복 금지.
- `size_alias`, `alias_note`: 제품에서 사용하는 별칭과 확인 근거. 예: `110`의 `XXL` 병기. 메이커 간 대응 관계와 구분.
- 측정 열: 아래 표 참고. 모델의 `measurements`에 없는 항목에는 수치 입력 금지.

| 열 | 의미 | 열 | 의미 |
|---|---|---|---|
| shoulder | 어깨 | chest | 가슴단면 |
| sleeve | 소매길이 | length | 총기장 |
| hem | 밑단단면 | waist | 허리단면 |
| hip | 엉덩이단면 | thigh | 허벅지단면 |
| rise | 밑위 | inseam | 안쪽기장 |
| back_neck_sleeve | 화장(뒷목 중심~소매 끝) | | |

화장은 일반 소매길이와 구분하여 저장. 어깨·소매길이 미제공 모델은 자동 대응 계산에서 제외.

바지 모델은 `waist|hip|thigh|rise|inseam|length` 등 필요한 항목 지정. 단면 열에 둘레값 입력 금지. 새 측정 정의는 `build.py`의 `FIELD_LABELS`에 추가하고 CSV 열도 추가한 뒤 검증.

CSV는 UTF-8 사용. Excel의 UTF-8 BOM도 지원. 쉼표·따옴표·줄바꿈이 들어간 설명은 CSV 규칙에 맞춰 인용하며, 스프레드시트의 CSV 저장 기능 사용 권장. 문자열 사이즈의 앞자리 0이나 날짜가 자동 변환되지 않도록 해당 열을 텍스트로 편집.

## 주소와 동작

- `index.html`: 공통 조회 화면. PC·모바일 자동 반응형.
- `index.html?model=spaver`: 특정 모델 조회. 새 HTML 파일 불필요.
- `index.html?model=hyperops&size=110`: 특정 모델·사이즈 공유.
- `compare.html`: 메이커·모델 여러 개 선택 후 기준 사이즈와 대응 후보 비교.
- `static.html`: 전체 모델의 정적 표·모바일 카드. 인쇄 시 표로 표시.
- 이전 PC·모바일 주소와 `items/hyperops/`, `items/spaver/`는 공통 화면으로 연결.

어깨+소매x2 = 어깨 + 소매길이 × 2. 치수 차이 합계 = |비교 대상 가슴단면 − 기준 가슴단면| + |비교 대상의 어깨+소매x2 − 기준의 어깨+소매x2|. 이 합계가 가장 작은 사이즈를 대응 후보로 선택. 총기장·밑단은 비교에서 제외하되 원본 데이터에는 보존. 세 항목 중 하나가 없으면 자동 후보 계산에서 제외. 제품의 실제 착용감 동등성을 보장하지 않음.

원본 CSV 수정은 파일·저장소에서 수행. 사이트에는 데이터 쓰기 기능 없음. 로컬 확인 시 HTTP 서버 사용(`python3 -m http.server 8768`). 브라우저로 HTML 파일을 직접 더블클릭하면 데이터 호출이 제한될 수 있음.

## 검증

```sh
python3 -m unittest discover -s report/clothes/tests
```

입력 검증, 출처·치수 보존, CSV 인용 처리, 새 모델 추가 시 페이지 개수 고정을 확인.

구현 기준: [Python CSV](https://docs.python.org/3/library/csv.html), [MDN Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch).
