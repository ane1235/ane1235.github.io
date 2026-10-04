# 의류 치수 페이지 템플릿

데이터 한 항목당 브랜드·모델별 페이지 6개 생성. 정적·인터랙티브 및 PC·모바일 모두 동일 HTML 템플릿 사용. 기본 입력 예시는 4가지 사이즈이며, 실제 출처에 따라 개수 변경 가능.

## 새 브랜드·모델 추가

1. `templates/item.example.json`의 객체를 복사하여 `data.json` 배열에 추가.
2. 브랜드명·모델명·출처·실제 확인일·사이즈별 치수 입력. 예시 URL과 `YYYY-MM-DD` 교체 필수.
3. 아래 명령 실행. 생성된 HTML 직접 편집 금지.
4. 생성 결과 확인 후 `data.json`과 생성 HTML을 함께 커밋·배포.

```sh
python3 report/clothes/build.py
```

명령은 저장소 루트 기준. 다른 경로에서는 `build.py`의 절대 경로 사용. Python 표준 라이브러리만 사용하며 추가 패키지 불필요.

## 데이터 규칙

| 필드 | 입력 기준 |
|---|---|
| `id` | 고유한 영문 소문자·숫자·하이픈. 개별 페이지 주소에 사용하므로 게시 후 유지 권장 |
| `brandId` | 메이커 고유 ID. 같은 메이커의 여러 모델에서 같은 값 사용 |
| `name` | 브랜드명. 같은 `brandId`에는 같은 이름 사용 |
| `model` | 기준 모델 또는 품목명 |
| `website` / `source` | 브랜드 홈페이지·브랜드관 / 실제 확인한 치수 출처의 http(s) URL |
| `sourceLabel` | 선택 항목. 기본값 `공식 사이즈 조견표`. 판매처 자료라면 `판매처 사이즈 조견표` 등으로 변경 |
| `sourceNote` / `checked` | 출처 설명 / 확인일 `YYYY-MM-DD` |
| `fields` | 선택 항목. 출력 순서대로 측정 항목의 `key`, `label` 지정 |
| `sizes` | 약 4개의 사이즈 객체. `size`는 `95`, `M` 등 원표기의 문자열 |
| 개별 치수 | cm 기준 양수. 미제공 값은 `null` 또는 키 생략 → `—` 표시 |
| `measurementNote` | 선택 항목. 오차·측정 방식·표기 대응 미확인 등 안내 |
| `chartImage` | 선택 항목. 원본 조견표 이미지의 http(s) URL 또는 `null` |

- 동일 브랜드의 다른 모델 추가 시 기존 항목을 덮어쓰지 않고 고유 `id`로 추가. 예: `spaver-another-model`.
- `fields` 생략 시 어깨·가슴단면·소매길이·총기장·밑단단면 적용.
- 숫자 사이즈와 영문 사이즈의 임의 대응 금지. 단면·둘레 구분을 `label`에 명시.
- 정적·인터랙티브 표, 모바일 카드, 사이즈 선택지는 같은 데이터에서 생성. 인터랙티브 필터는 메이커 → 모델 → 사이즈 순서이며 상위 선택에 맞는 하위 항목만 표시.
- 잘못된 ID·중복 사이즈·미정의 치수·음수 치수 등은 파일 생성 전에 오류 처리.

바지처럼 항목이 다른 품목은 `fields`와 `sizes`를 함께 변경.

```json
"fields": [
  {"key": "waist", "label": "허리단면"},
  {"key": "thigh", "label": "허벅지단면"},
  {"key": "rise", "label": "밑위"},
  {"key": "length", "label": "총기장"}
],
"sizes": [
  {"size": "30", "waist": null, "thigh": null, "rise": null, "length": null},
  {"size": "32", "waist": null, "thigh": null, "rise": null, "length": null},
  {"size": "34", "waist": null, "thigh": null, "rise": null, "length": null},
  {"size": "36", "waist": null, "thigh": null, "rise": null, "length": null}
]
```

## 파일과 주소

- `data.json`: 모든 품목의 원본 데이터. 향후 비교 인터페이스에서도 재사용 가능.
- `templates/page.html`: 정적·인터랙티브 공통 페이지 틀.
- `templates/item.html`: 제목·출처·치수표·모바일 카드의 공통 틀.
- `templates/redirect.html`: 화면 크기에 맞는 보기로 이동하는 공통 틀.
- `style.css`, `filter.js`: 모든 품목 페이지에서 공유.
- `items/<id>/static-desktop.html`, `static-mobile.html`: 개별 정적 페이지.
- `items/<id>/interactive-desktop.html`, `interactive-mobile.html`: 개별 사이즈 필터 페이지.
- `items/<id>/index.html`, `interactive.html`: 정적·인터랙티브의 PC·모바일 자동 선택.

기존 `clothes/` 진입 주소와 모아보기는 유지. 각 항목의 제조사명 링크로 개별 페이지 이동. `compare.html`에서 메이커·모델 여러 개와 기준 사이즈를 선택. 어깨·가슴단면·소매길이의 절대 차이 합계가 가장 작은 대응 후보 선택. 각 사이즈 수동 변경도 가능. 어깨+가슴 합계는 보조 지표이며 총기장·밑단은 비교에서 제외.

빌드는 항목 추가·수정용이며 기존 폴더를 자동 삭제하지 않음. 품목 삭제 시 `data.json` 항목과 해당 `items/<id>/` 폴더를 함께 제거한 뒤 재생성 필요.

구현 기준: [Python string.Template](https://docs.python.org/3/library/string.html#template-strings), [html.escape](https://docs.python.org/3/library/html.html#html.escape).

제목 영역은 왼쪽 제조사명·기준모델 두 줄, 오른쪽 링크·출처 코멘트·확인일 배치. 개별 페이지에 별도 중복 제목을 만들지 않음. 좁은 PC 창에서는 추가정보를 다음 줄로 이동.

비교 페이지도 `templates/compare.html`과 동일 `data.json`으로 생성. 어깨·가슴단면·소매길이의 key와 label이 모두 일치하는 항목만 비교하며, 단면·둘레의 임의 환산 금지. 세 치수 중 하나라도 없으면 자동 추천에서 제외. 결과는 착용감이나 공식 호수의 동등성을 보장하지 않는 실측상 후보.
