---
name: pdf-report-templates
description: >
  Use this skill whenever the user wants to create a styled PDF report using
  Korean government format or US DoD format. Trigger on ANY of these contexts:
  한국 공문서 PDF, 한국공문서양식, 한국공문서스타일, 정부 양식, 보고서 PDF,
  종설 PDF, 번역 결과를 PDF로, 공문서 스타일, Korean government style PDF,
  A4 PDF report, 군사 보고서, DoD양식, US DoD format, DoD report,
  PDF report with template, military report PDF, defense report,
  공문서로 만들어줘, PDF로 출력해줘, 보고서를 PDF로, MD를 PDF로,
  마크다운을 PDF로 변환.
  Also trigger when the user asks to convert any text, translation result,
  or analysis into a formal PDF document — even if they don't say "template"
  or "양식" explicitly. If the user mentions "PDF" together with "보고서",
  "report", "공문서", "DoD", "군사", or "government", always use this skill.
---

# PDF Report Templates v3.0 — [한국공문서] & [DoD양식]

두 가지 공식 문서 양식을 제공하는 PDF 보고서 생성 스킬이다.
**v2.0부터 MD→PDF 변환 파서를 내장하여, MD 파일을 SSOT로 사용한다.**
**v3.0부터 Chat/Cowork 양쪽 환경에서 동일하게 작동한다 (환경 자동 감지 + 폰트 자동 관리).**

> **Python 템플릿 파일 위치:** `.claude/skills/pdf-report-templates/` 하위에 `md_to_pdf_converter.py`, `pdf_template_KrGov_1_0.py`, `pdf_template_USDoD_v3.py`, `tests/test_templates.py`가 있다.

---

## ★ 핵심 원칙: SSOT (Single Source of Truth)

> **MD 파일이 유일한 원본이다. PDF는 반드시 MD 파일을 읽어서 변환한다.**
> PDF 콘텐츠를 독립적으로 생성하지 않는다.

이 원칙은 변경할 수 없다. MD↔PDF 내용이 일치하도록 보장하는 구조적 안전장치이다.

---

## Step 0: 환경 자동 감지 (v3.0 — 수동 설정 불필요)

v3.0부터 폰트와 경로가 **자동으로 관리**된다. `apt install` 등의 수동 설치가 필요 없다.

| 환경 | 감지 조건 | 폰트 관리 | outputs 경로 |
|---|---|---|---|
| **Chat 서버** | `/mnt/skills/` 존재 | 시스템 사전 설치 | `/mnt/user-data/outputs/` |
| **Cowork VM** | `$HOME`에 `/sessions/` 포함 | `~/.fonts/nanum/`에 자동 다운로드 | `$HOME/outputs/` |

> ⚠️ **엔진 선택 원칙 (변경 불가)**
> - **DoD 양식 (한영혼합 포함)** → `pdf_template_USDoD_v3.py` ✅ 표준
> - **한국 공문서 양식** → `pdf_template_KrGov_1_0.py` ✅ 표준
> - `pdf_template_USDoD_fpdf2.py` → ❌ 서식 불안정, 사용 금지
> - `pdf_template_USDoD_1.py` → ❌ 한글 null bytes 발생, 사용 금지

**폰트 탐색 체인 (자동 실행, 수동 개입 불필요):**
1. 시스템 경로 (`/usr/share/fonts/truetype/nanum/`) 확인
2. 사용자 폰트 (`~/.fonts/nanum/`) 확인
3. GitHub에서 Google Fonts 자동 다운로드 (Cowork 환경)
4. DejaVuSans fallback (Nanum 폰트 불가 시)

---

## 양식 선택 가이드

| 상황 | 파일 |
|---|---|
| 한국어 보고서, 종설, 번역문 | **pdf_template_KrGov_1_0.py** |
| 영문·한영혼합 군사/국방 보고서 | **pdf_template_USDoD_v3.py** ✅ |
| 사용자가 명시적으로 지정 | 해당 파일 우선 |

---

## 워크플로우 — MD→PDF 변환 (v3.0 표준)

### 방법 A: 자동 변환 (★ 권장)

MD 파일이 이미 존재할 때 `md_to_pdf_converter.py`를 사용하여 자동 변환한다.

```python
import shutil, sys, os

# 1. 스킬 파일 경로 결정 (환경 자동 감지)
_skill_src = "/mnt/skills/user/pdf-report-templates"  # Chat 환경
if not os.path.isdir(_skill_src):
    # Cowork 환경: 파서와 같은 폴더 또는 현재 작업 디렉토리 사용
    _skill_src = os.path.dirname(os.path.abspath(__file__)) if '__file__' in dir() else os.getcwd()

# 2. 템플릿 + 변환기 복사
_home = os.environ.get('HOME', '.')
for f in ["pdf_template_KrGov_1_0.py", "pdf_template_USDoD_v3.py", "md_to_pdf_converter.py"]:
    src = os.path.join(_skill_src, f)
    dst = os.path.join(_home, f)
    if os.path.exists(src) and not os.path.exists(dst):
        shutil.copy(src, dst)
if _home not in sys.path:
    sys.path.insert(0, _home)

# 3. MD → PDF 변환 (한 줄)
from md_to_pdf_converter import convert_md_to_pdf

# KrGov 양식
convert_md_to_pdf(
    "report_kr.md", "report_kr.pdf",
    template="KrGov",
    title="보고서 제목",
    header_text="분류: 내부용",
    footer_source="출처: XXX | 정리일: 2026-03-06",
)

# USDoD 양식
convert_md_to_pdf(
    "report_en.md", "report_en.pdf",
    template="USDoD",
    title="REPORT TITLE",
    header_right="UNCLASSIFIED // FOR OFFICIAL USE",
    footer_left="출처: XXX | 정리일: 2026-03-06",
)
```

### 방법 B: 수동 story 작성 (기존 방식, 특수 레이아웃 필요 시만 사용)

> ⚠️ **방법 B는 MD 파일이 존재하지 않는 경우에만 사용한다.**
> MD 파일이 있으면 반드시 방법 A를 사용해야 한다.

```python
# MD 파일 없이 직접 story를 작성하는 경우
from pdf_template_USDoD_v3 import *

story = [ ... ]  # 수동으로 Flowable 리스트 작성
build_pdf(story, path="report.pdf", title="REPORT TITLE")
```

### 3. 마지막에 반드시 present_files로 전달

---

## MD→PDF 변환기 — md_to_pdf_converter.py

### 아키텍처

```
MD 파일 → parse_md() → IR(중간 표현) → ir_to_krgov_story() / ir_to_usdod_story() → build_pdf()
```

### 주요 함수

| 함수 | 역할 |
|---|---|
| `convert_md_to_pdf(md_path, pdf_path, template, **kwargs)` | ★ 통합 진입점. MD→PDF 원스텝 변환 |
| `parse_md(md_text)` | MD 텍스트 → IR 리스트 변환 |
| `ir_to_krgov_story(ir_list, mod)` | IR → KrGov 템플릿 story |
| `ir_to_usdod_story(ir_list, mod)` | IR → USDoD 템플릿 story |

### IR 노드 타입

| 타입 | 발생 조건 |
|---|---|
| `metadata` | `**출처:** 값 \| **저자:** 값` 형태의 메타데이터 블록 |
| `title` | `# 제목` (H1) |
| `h1` | `## 대분류` (H2 → 대분류로 매핑) |
| `h2` | `### 중분류` (H3 → 중분류로 매핑) |
| `h3` | `#### 소분류` (H4 → 소분류로 매핑) |
| `body` | 일반 본문 단락 |
| `bullet1` | `- 항목` 또는 `* 항목` (1단계 불릿) |
| `bullet2` | `  - 항목` (2단계 불릿, 2칸 이상 들여쓰기) |
| `analyst_note` | `> 📌 **Analyst Note**` 블록인용 |
| `table` | `\| 헤더 \| ... \|` 형태의 MD 테이블 |
| `image` | `![캡션](경로)` |
| `ref` | 참고문헌 섹션 내의 텍스트 |
| `spacer` | 빈 줄 또는 수평선 |

### 한글 자동 감지

USDoD 템플릿에서는 텍스트에 한글이 포함되었는지 자동 감지하여 적절한 폰트 함수를 선택한다.

- 한글 포함 → `body_kr()`, `bullet1_kr()`, `bullet2_kr()`, `ref_kr()`, `th_kr()`, `td_kr()`
- 영문만 → `body()`, `bullet1()`, `bullet2()`, `ref()`, `th()`, `td()`

### convert_md_to_pdf 파라미터

```python
convert_md_to_pdf(
    md_path,          # str: 입력 MD 파일 경로 (SSOT)
    pdf_path,         # str: 출력 PDF 파일 경로
    template="KrGov", # str: "KrGov" 또는 "USDoD"
    # KrGov 전용 kwargs:
    title="보고서",
    header_text="",
    footer_source="",
    copy_to_outputs=True,
    # USDoD 전용 kwargs:
    title="REPORT",
    header_right="UNCLASSIFIED // FOR OFFICIAL USE",
    footer_left="",
    copy_to_outputs=True,
)
```

---

## [DoD양식 v3] — pdf_template_USDoD_v3.py ✅ 표준

> **2026-03-03 확정판** → **v3.0 (2026-03-06) 환경 감지 추가**
> reportlab 엔진 + 영문/한글 폰트 완전 분리 + 동적 높이 계산
> null bytes 0개, 텍스트 잘림 없음 검증 완료
> ★ v3.0 추가: `_detect_environment()`, `_find_font()`, `_get_outputs_dir()`

### 기본 사양
- 용지: A4 | 여백: L25.4 / R19.1 / T25.4 / B19.1 mm
- 색상: Army Green `#4B5320` + Tan `#D2B48C`

### 폰트 분리 원칙 (핵심 — 반드시 준수)

| 텍스트 종류 | 폰트 |
|---|---|
| 영문·숫자·기호만 | DejaVuSans / DejaVuSansBold |
| 한글 포함·혼합 | NanumGothic / NanumGothicBold |
| `canvas.drawString()` | **항상 NanumGothicBold** (안전 기본값) |
| `_make_header_footer()` 내 전체 | **NanumGothicBold** (header_left·header_right 포함) ★ |

> **null bytes 원인:** 한글 포함 텍스트에 DejaVuSans를 사용하면
> ToUnicode CMap 누락으로 뷰어에서 글자가 사라진다.

### 동적 높이 계산 원칙

> **잘림 방지:** 모든 커스텀 Flowable(`KeyFindings`, `AnalystNote`, `MetadataBlock`)은
> `wrap(avail_w, avail_h)` 호출 시점에 높이를 재계산한다.
> `__init__`에서 미리 계산하지 않는다. 이 원칙을 변경하지 않는다.

### Flowable 클래스

| 클래스 | 인자 | 용도 |
|---|---|---|
| `MetadataBlock(fields)` | `[(label, value), ...]` | 문서 메타데이터 |
| `KeyFindings(title, paragraphs, font_korean)` | `font_korean=True` → 한글 제목 | 핵심 요약 박스 |
| `SectionHeader(text, font_korean)` | 동일 | 이중선 섹션 헤더 |
| `SubSection(text, font_korean)` | 동일 | Army Green 소제목 |
| `AnalystNote(paragraphs)` | | Cream 배경 분석 박스 |

> **`font_korean` 규칙:** 제목/소제목 텍스트에 한글이 포함되면 반드시 `font_korean=True`

### 단축 함수

| 함수 | 폰트 | 용도 |
|---|---|---|
| `sp(h=3)` | — | 빈 줄 (mm) |
| `body(t)` | DejaVuSans | 영문 본문 |
| `body_kr(t)` | NanumGothic | 한글/혼합 본문 ★ 주로 사용 |
| `bullet1(t)` / `bullet2(t)` | DejaVuSans | 영문 불릿 |
| `bullet1_kr(t)` / `bullet2_kr(t)` | NanumGothic | 한글 불릿 ★ 주로 사용 |
| `ref(t)` / `ref_kr(t)` | 각각 DejaVuSans / NanumGothic | 참고문헌 |
| `th(t)` / `th_kr(t)` | 각각 DejaVuSansBold / NanumGothic | 테이블 헤더 |
| `td(t)` / `td_kr(t)` | 각각 DejaVuSans / NanumGothic | 테이블 셀 |

### 테이블

```python
make_table(data, col_ratios=[0.2, 0.4, 0.4])    # 영문 전용
make_table_kr(data, col_ratios=[0.2, 0.4, 0.4]) # 한글 포함 ★ 주로 사용
```

### build_pdf 파라미터

```python
build_pdf(story,
          path="output.pdf",
          title="REPORT TITLE",
          header_right="UNCLASSIFIED // FOR OFFICIAL USE",
          footer_left="출처: XXX | 정리: YYYY-MM-DD",
          copy_to_outputs=True)
```

---

## [한국공문서] — pdf_template_KrGov_1_0.py

### 기본 사양
- 용지: A4 | 여백: L25 / R20 / T25 / B20 mm
- 폰트: NanumGothic (한글+영문 겸용)
- 색상: Navy `#1B3464` + Blue `#2C5282`
- 위계: I → 1 → 가 → (1)

### 단축 함수

| 함수 | 용도 |
|---|---|
| `sp(h=3)` | 빈 줄 |
| `h1(t)` | 대분류 (SectionHeader) |
| `h2(t)` | 중분류 |
| `h3(t)` | 소분류 |
| `body(t)` | 본문 |
| `bullet1(t)` | 불릿 L1 |
| `bullet2(t)` | 불릿 L2 |
| `ref(t)` | 참고문헌 |
| `th(t)` / `td(t)` | 테이블 헤더/셀 |

### Flowable 클래스
- `SectionHeader(text)` — Navy 배경 흰색 대분류 바
- `HighlightBox(title, paragraphs, preset)` — 강조 박스 (gold/red/blue/default)
- `DocInfoTable(doc_no, date, classification, source)` — 문서정보 테이블

### build_pdf 파라미터

```python
build_pdf(story, path="output.pdf",
          title="보고서 제목",
          header_text="",
          footer_source="",
          copy_to_outputs=True)
```

### 테이블 / 강조 박스

```python
data = [[th("항목"), th("내용")], [td("A"), td("설명")]]
table = make_table(data, col_ratios=[0.3, 0.7])

box = HighlightBox("핵심 분석",
    [Paragraph("내용...", S["body"])], preset="gold")
```

---

## ❌ 사용 금지 파일

| 파일 | 이유 |
|---|---|
| `pdf_template_USDoD_fpdf2.py` | 서식 불안정 |
| `pdf_template_USDoD_1.py` | 한글 null bytes (ToUnicode CMap 오류) |

---

## CHANGELOG

### v3.0 (2026-03-06)

**추가 (New):**
- `_detect_environment()` — Chat/Cowork 환경 자동 감지 함수
- `_find_font()` — 동적 폰트 탐색 + 자동 다운로드 함수
- `_get_outputs_dir()` — 환경별 outputs 디렉토리 자동 결정

**변경 (Changed):**
- pdf_template_KrGov_1_0.py: 하드코딩 폰트 경로 → `_find_font()` 동적 탐색
- pdf_template_USDoD_v3.py: 4종 폰트 등록에 try/except + `_find_font()` 적용
- md_to_pdf_converter.py: 하드코딩 경로 → `$HOME` 기반 동적 경로
- SKILL.md: 환경 자동 감지 설명으로 전면 개정

**수정 (Fixed):**
- USDoD 폰트 등록 crash (os.path.exists 체크 누락)
- 하드코딩 세션 경로 문제

### v2.0 (2026-03-06)

**추가 (New):**
- md_to_pdf_converter.py — MD→PDF 자동 변환 파서 (IR 노드 13종, 한글 자동 감지)

**변경 (Changed):**
- SSOT 원칙 명시, 방법 A/B 이원화

### v1.0 (2026-03-03)

- 최초 릴리스: KrGov + USDoD v3 템플릿, 기본 테스트 3종
