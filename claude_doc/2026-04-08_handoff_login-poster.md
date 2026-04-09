---
title: "ane1235 로그인 화면 포스터 제작 Handoff"
date: 2026-04-08
type: handoff
project: ane1235.github.io
domain: IT
status: final
---

# ane1235 로그인 화면 포스터 제작 Handoff

> **요약**: canvas-design 스킬을 사용하여 ane1235 앱의 로그인 화면용 포스터를 제작했다. 디자인 철학(Vital Signal) 수립 → Python/Pillow 렌더링 → 한글 폰트 교체의 3단계를 거쳐 PNG + PDF 최종 파일을 생성했다.

---

## I. 작업 목적 및 배경

### 1. 요청 맥락

- **프로젝트**: `ane1235.github.io` — 부천세종병원 마취통증의학과 내부용 근무 관리 + KSCTVA 학회 앱
- **목적**: 로그인 화면에 사용할 브랜드 포스터 테스트 제작
- **활용 스킬**: `canvas-design` (디자인 철학 생성 → canvas 표현 2단계 파이프라인)

### 2. 브랜드 레퍼런스

- **기존 로그인 화면 색상**: 딥 네이비(`#1a365d`) → 블루(`#2563eb`) → 딥 네이비 135° 그라디언트
- **UI 모티프**: ECG 심전도 파형 라인 (파란 반투명, 수평 이동 애니메이션)
- **포인트 컬러**: `#2563eb` (블루), `#f59e0b` (앰버)
- **타이포 스타일**: `ane1235` 볼드, `Assign · 심폐마취학회 2026` 서브텍스트

---

## II. 디자인 철학 — Vital Signal

### 1. 철학 핵심

- **운동명**: *Vital Signal*
- **개념**: 가장 중요한 시스템은 침묵 속에서 작동하며, 훈련된 자만이 읽을 수 있다는 긴장감. 형태가 모니터링의 논리를 따른다 — 연속적·리드미컬·정밀.
- **색채**: 기능적으로만 사용. 블루=기준선, 앰버=경보, 흰색=신호.
- **타이포**: 파형처럼 읽히는 문자. 모노/콘덴스드 서체가 임상 리듬을 전달.

### 2. 시각 표현 원칙

| 요소 | 표현 방식 |
|------|----------|
| 배경 | 딥 네이비 → 블루 → 딥 네이비 진대각선(135°) 그라디언트 |
| 격자 | 62px 간격 미세 격자 (rgba 4~5) — 모니터 그리드 느낌 |
| ECG 파형 | P파·QRS복합·T파 실제 파형 수식으로 렌더링 |
| 아이콘 | 원형 링 + 내부 ECG 트레이스 + R피크 앰버 점 |
| 텍스트 분할 | `ane` 흰색 + `1235` 앰버 — 번호를 경보 신호로 표현 |
| 구분선 | 신호 블루 얇은 룰, 앰버 악센트 도트 |
| 코너 | 레지스터 마크 (측정 도구 참조 암시) |

---

## III. 제작 과정

### 1. 1차 렌더링 (v1)

- **도구**: Python 3 + Pillow (PIL)
- **해상도**: 1240×1754 px (A4 @ 150 dpi)
- **결과**: 렌더링 성공, 한글 텍스트 모두 □ 박스로 깨짐

#### 한글 깨짐 원인

- `canvas-fonts/` 디렉토리의 모든 폰트가 라틴 전용 (BigShoulders, InstrumentSans, GeistMono 등)
- 한글 유니코드 코드포인트를 포함하지 않아 대체 문자(□)로 렌더링

### 2. 한글 폰트 교체 (v2)

- **대안 탐색**: `fc-list :lang=ko` 로 시스템 한글 폰트 확인
- **선택**: `/System/Library/Fonts/AppleSDGothicNeo.ttc`
- **인덱스 선정**: TTC 파일 내 10개 인덱스 중 픽셀 암도(darkness) 측정으로 index 6 = Bold, index 2 = Light 확인
- **적용 범위**: 한글이 포함된 모든 텍스트 요소 (subtitle, affiliation, login hint, build info)
- **결과**: 한글 정상 렌더링 확인

### 3. 최종 출력

| 속성 | 값 |
|------|---|
| 해상도 | 1240 × 1754 px (150 dpi) |
| PNG 크기 | 421 KB |
| PDF 크기 | 92 KB |
| 렌더링 시간 | ~10초 |

---

## IV. 생성 파일

모두 `/Users/kayen/dev/ane1235.github.io/claude_doc/` 에 저장.

| 파일 | 설명 |
|------|------|
| `ane1235_design_philosophy_260408.md` | Vital Signal 디자인 철학 문서 |
| `ane1235_login_poster_260408.png` | 포스터 PNG (421 KB, 1240×1754 px) |
| `ane1235_login_poster_260408.pdf` | 포스터 PDF (92 KB, A4) |
| `2026-04-08_handoff_login-poster.md` | 본 문서 |

---

## V. 포스터 구성 요소 (상단 → 하단)

| 위치 | 요소 | 스타일 |
|------|------|--------|
| 상단 레이블 | ANESTHESIOLOGY · PAIN MEDICINE | Jura-Light, 신호 블루 140α |
| 아이콘 | ECG 원형 아이콘 (반지름 105px) | SIG 블루, 앰버 R피크 점 |
| 메인 타이포 | **ane**¹²³⁵ | BigShoulders-Bold 228pt, ane=흰색/1235=앰버 |
| 룰 1 | 얇은 수평선 + 앰버 도트 | alpha 65 |
| 서브타이틀 | Assign · 심폐마취학회 2026 | AppleSDGothicNeo Bold 48pt |
| 소속 | 부천세종병원 마취통증의학과 | AppleSDGothicNeo Light 34pt, 신호 블루 |
| 룰 2 | 얇은 수평선 | alpha 38 |
| 중앙 ECG | 전폭 고진폭(90px) ECG 파형 | alpha_core 170, 구성의 시각적 앵커 |
| 로그인 안내 | 이름 + 사번 (8자리) 으로 로그인 | AppleSDGothicNeo 22pt, 흰색 148α |
| 빌드 정보 | build 260407 · GitHub Pages | AppleSDGothicNeo 17pt, 신호 블루 95α |
| 코너 마크 | 4 코너 레지스터 마크 | 신호 블루 70α |

---

## VI. 향후 활용 방안

- **로그인 화면 배경**: `sheets/index.html`의 `.login-bg` 배경에 포스터 이미지를 `background-image`로 적용 가능 (단, 현재 그라디언트 CSS와 유사하므로 직접 교체보다 보조 자료로 활용 권장)
- **인쇄물**: PDF 파일을 A4로 직접 출력하여 학회 행사장 안내 포스터로 사용 가능
- **고해상도 재생성**: 스크립트를 300 dpi (2480×3508 px)로 수정하면 인쇄용 고해상도 생성 가능

#### 300 dpi 재생성 방법

```python
# ane1235_poster_v2.py 상단 W, H 수정
W, H = 2480, 3508   # A4 @ 300 dpi
# 폰트 크기도 2배로 조정 필요
```

> 📌 **Note**
> Pillow 기반 렌더링은 벡터가 아닌 래스터 방식이므로, 대형 인쇄물(A3 이상)에는 Pillow 대신 `reportlab` 또는 `cairo` 기반 SVG 렌더러 사용을 권장한다. 현재 A4 150 dpi 품질은 화면 표시 및 일반 프린터 출력에 적합하다.
