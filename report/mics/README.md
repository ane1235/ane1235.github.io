# 한국 심장수술·MICS 2040 전망 — 최종 통합본

- 게시 주소: https://ane1235.github.io/report/mics/
- 전체 보고서: [full_report.html](full_report.html)
- 작성 기준: 2026-10-04 한국시간. 국내 기준 보고서는 2026-10-03, 해외 MICS 보강 자료는 2026-10-04 기준임.
- 목적: 국내 현재 수술량·대사위험·치료 선택·인력과 해외 MICS 추세를 연결한 조건부 장기 전망 제공.

## 구성

| 파일·폴더 | 용도 |
|---|---|
| `index.html` | 국내 시나리오와 해외 MICS 근거를 탐색하는 인터랙티브 보고서 |
| `full_report.html` | 최종 통합 보고서 본문·전망표·참고문헌·인쇄용 화면 |
| `assets/` | 화면 스타일과 계산·탐색 코드 |
| `data/` | 화면에 사용하는 국내 모형·관측자료·해외 시계열 |
| `downloads/` | 보고서 Markdown, 연간 전망·MICS 교차 시나리오·근거 목록 |

## 주요 자료 내려받기

- [최종 통합 보고서 Markdown](downloads/MICS_Korea_final_report_2026-10-04.md)
- [국내 2025–2040 연간 조건부 전망](downloads/korea_forecast_annual.csv)
- [국내 2027–2031 전망](downloads/korea_forecast_2027_2031.csv)
- [MICS 수량·채택률 교차 시나리오](downloads/korea_mics_scenario_cross.csv)
- [MICS 시작 비중 민감도](downloads/korea_mics_starting_share.csv)
- [집도 공급 대비 상대 산출 요구](downloads/korea_relative_output_requirement.csv)
- [해외 문헌·공식자료 목록](downloads/global_source_register.csv)
- [해외 추출 집계자료](downloads/global_evidence.json)

## 사용과 해석

- 기준·낮음·높음은 입력 가정의 조합임. 발생확률이나 통계적 예측구간이 아님.
- CABG 청구건·항목 내 인원, KHF 조사범위 등가량, 전국 심장이식 건수를 분리함. 서로 다른 행을 더하여 성인 전체 수술량을 만들지 않음.
- 한국의 현재 전국 MICS 보급률과 실제 활동 집도의 절대 인원은 미확인임. MICS 시작 비중과 채택 속도는 합성 가정임.
- 해외 추세는 술식별 확대·정체·운영 지속성의 해석에 반영함. 국내 수술량·채택률 계수를 해외 비율로 재적합하지 않음.
- 기존 MICS 함수는 단조 증가 경로임. 해외에서 관찰된 중단·재개를 국내 함수가 직접 재현하는 것은 아님.
- 위험 민감도는 지정 연령의 순이용률을 교체한 경로임. 기존 성장률에 유병률·위험비를 추가 곱하지 않음.
- 화면은 보존된 집계자료와 기존 계산 결과를 사용함. 브라우저에서 새 문헌을 수집하거나 환자 단위 자료를 조회하지 않음.

## 로컬 열람

이 폴더에서 `python3 -m http.server 8000 --bind 127.0.0.1` 실행 후 `http://127.0.0.1:8000/` 접속 가능함. 데이터 파일을 읽는 구조이므로 `file://`로 직접 여는 방식보다 로컬 HTTP 서버를 사용함.

외부 JavaScript 라이브러리와 CDN은 사용하지 않음. 자료원 링크는 인터넷 접속이 필요함. 보고서 HTML의 인쇄 버튼으로 브라우저 인쇄·PDF 저장 가능함.
