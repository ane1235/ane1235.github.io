# 의류 데이터베이스

> 자동 생성 문서. models.csv와 sizes.csv에서 수정 후 build.py 실행.

## 데이터 정의

| 파일 | 한 행의 단위 | 연결 키 |
|---|---|---|
| models.csv | 모델 하나 | model_id |
| sizes.csv | 모델의 사이즈 하나 | model_id + size |

- 치수 단위: cm. 빈칸: 미제공. 사이즈·별칭은 문자열로 보존.
- 메이커 ID 공유 가능. 모델 ID는 고유하며 URL에 사용.
- 어깨·가슴단면·소매길이만 대응 후보 계산에 사용. 총기장 등은 원본 치수로 보존.
- 사이즈 별칭은 동일 제품의 표기. 다른 메이커 사이즈와의 공식 대응을 뜻하지 않음.

## 모델 정보

| 모델ID | 메이커 | 모델 | 조회일자 | 메이커링크 | 모델링크 | 조견표링크 |
|---|---|---|---|---|---|---|
| hyperops | 하이퍼옵스 | 크러쉬 자켓 | 2026-10-05 | [메이커](https://hyper-ops.com/) | [모델](https://hyper-ops.com/product/detail.html?product_no=390) | [조견표](https://hyper-ops.com/product/detail.html?product_no=390) |
| spaver | 스페이버 SPAVER | 어반 소프트쉘 자켓 | 2026-10-05 | [메이커](https://www.netpx.co.kr/app/contents/brandshoplist/SPV) | [모델](https://www.netpx.co.kr/app/product/detail/114754/0) | [조견표](https://www.netpx.co.kr/app/product/detail/114754/0) |
| kidon-light-wind-breaker | 키돈 Kidon | 경량 윈드 브레이커 | 2026-10-05 | [메이커](https://www.netpx.co.kr/app/contents/brandshoplist/KDN) | [모델](https://smartstore.naver.com/papaland/products/5531863221) | [조견표](https://img.netpx.co.kr/images/prd_img/pd_150450/150734/06.jpg) |
| helikon-gunfighter-black | 헬리콘텍스 HELIKON-TEX | 건파이터 자켓 (블랙) | 2026-10-05 | [메이커](https://www.netpx.co.kr/app/contents/brandshoplist/HEK) | [모델](https://www.netpx.co.kr/app/product/detail/117012/0) | [조견표](https://static.netpx.co.kr/images/prd_img/img/helikon-tex/117012.jpg) |

## 하이퍼옵스 · 크러쉬 자켓

| 사이즈 | 별칭 | 어깨 | 가슴단면 | 소매길이 | 총기장 | 밑단단면 |
|---|---|---|---|---|---|---|
| 95 |  | 45 | 54 | 62 | 67 | 51.5 |
| 100 |  | 47 | 56.5 | 63 | 69 | 54 |
| 105 |  | 49 | 59 | 64 | 71 | 56.5 |
| 110 | XXL | 51 | 61.5 | 65 | 73 | 59 |

- 출처: 상품 페이지의 ‘사이즈’ 탭 · 원본은 표 형태
- 110 별칭 근거: 제품의 XXL 병기: 사용자 확인

## 스페이버 SPAVER · 어반 소프트쉘 자켓

| 사이즈 | 별칭 | 어깨 | 가슴단면 | 소매길이 | 총기장 | 밑단단면 |
|---|---|---|---|---|---|---|
| M |  | 50 | 57 | 63.5 | 70 | — |
| L |  | 53 | 59 | 67 | 73 | — |
| XL |  | 56 | 61 | 67 | 73 | — |
| XXL |  | 60 | 63 | 68 | 75 | — |

- 출처: 넷피엑스 실측표 · M~XL 하이피엑스 대조 일치
- 측정 안내: M~XXL은 메이커 원표기이며, 국내 95·100·105·110과의 대응은 미확인입니다. 밑단단면은 미제공(—). 실측 오차 2~3cm.
- 요청 링크: https://smartstore.naver.com/hi-px/products/5432093054
- 요청 링크 확인 상태: 접속 오류로 직접 확인 불가. 사용자가 확인한 제품명을 기준으로 공식 브랜드관 및 동일 판매처 자체몰 대조.
- 교차검증 링크: https://m.hipx.co.kr/product/detail.html?product_no=4207
- 교차검증 이미지: https://gi.esmplus.com/hipxhi/spaver/114754_s.jpg

## 키돈 Kidon · 경량 윈드 브레이커

| 사이즈 | 별칭 | 어깨 | 가슴단면 | 소매길이 | 총기장 |
|---|---|---|---|---|---|
| S | 90 | 46 | 57 | 64 | 73 |
| M | 95 | 48 | 59 | 65 | 75 |
| L | 100 | 49 | 61 | 66 | 77 |
| XL | 105 | 51 | 63 | 67 | 79 |
| XXL | 110 | 52 | 65 | 68 | 81 |

- 출처: 넷피엑스 라이트 윈드 브레이커 · 원본 조견표
- 측정 안내: 넷피엑스 표기: 라이트 윈드 브레이커 (KKU-LWB-NL). 네이버 요청 페이지는 접속 제한으로 직접 대조하지 못했습니다. 측정 방식·위치에 따라 1~3cm 차이 가능.
- 요청 링크: https://smartstore.naver.com/papaland/products/5531863221
- 요청 링크 확인 상태: HTTP 429 접속 제한으로 원문 직접 대조 불가. 사용자가 제공한 메이커·제품명 및 S(90)~XXL(110) 표기와 일치하는 넷피엑스 조견표 참조.
- 교차검증 링크: https://www.netpx.co.kr/app/product/detail/150734/0/
- 교차검증 이미지: https://img.netpx.co.kr/images/prd_img/pd_150450/150734/06.jpg
- S 별칭 근거: 사용자 제공 표기 및 넷피엑스 조견표 일치
- M 별칭 근거: 사용자 제공 표기 및 넷피엑스 조견표 일치
- L 별칭 근거: 사용자 제공 표기 및 넷피엑스 조견표 일치
- XL 별칭 근거: 사용자 제공 표기 및 넷피엑스 조견표 일치
- XXL 별칭 근거: 사용자 제공 표기 및 넷피엑스 조견표 일치

## 헬리콘텍스 HELIKON-TEX · 건파이터 자켓 (블랙)

| 사이즈 | 별칭 | 어깨 | 가슴단면 | 소매길이 | 총기장 |
|---|---|---|---|---|---|
| S | 95~100 | 46 | 55 | 64 | 72 |
| M | 100~105 | 48 | 58.5 | 65 | 73 |
| L | 105~110 | 50 | 61 | 66 | 74 |
| XL | 110~115 | 52 | 63.5 | 67 | 75 |

- 출처: 넷피엑스 상품 상세 · SIZE INFO 원본
- 측정 안내: 샤크스킨 소프트쉘. 숫자 범위는 조견표의 국내표기입니다. 가슴은 그림의 단면 측정 기준. 측정 방법·위치에 따라 1~3cm 오차 가능.
- S 별칭 근거: 넷피엑스 SIZE INFO 조견표의 국내표기
- M 별칭 근거: 넷피엑스 SIZE INFO 조견표의 국내표기
- L 별칭 근거: 넷피엑스 SIZE INFO 조견표의 국내표기
- XL 별칭 근거: 넷피엑스 SIZE INFO 조견표의 국내표기
