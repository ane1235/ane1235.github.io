---
name: webpage-report
description: >
  웹 크롤링으로 수집한 뉴스·기사를 구조화된 보고서로 정리하는 스킬.
  다음 맥락에서 반드시 이 스킬을 사용한다:
  - 웹 기사·뉴스를 크롤링하여 정리해 달라는 요청
  - 403 차단 우회가 필요한 크롤링 작업
  - 수집한 기사를 보고서·분석 문서로 작성하는 작업
  - 전문 용어 주석이 필요한 경제·금융·정책 기사 정리
  - Analyst Note가 포함된 구조화 보고서 작성
  - "크롤링", "기사 정리", "뉴스 보고서", "웹 수집", "보고서로 만들어줘" 등의 키워드가 포함된 요청
  - fetch, kindly-web-search, web_search 등을 통해 기사를 수집하고 정리하는 모든 작업
  - webpage URL을 제시하며 번역·정리·분석을 요청하는 모든 작업
  - PDF 보고서 출력이 필요한 경우 pdf-report-templates 스킬과 함께 사용한다
---

# Webpage Report 스킬 v4.2

웹 크롤링 → 내용 정리 → 전문 용어 주석 → Analyst Note → 출력(MD/PDF) → 검수의 6단계 파이프라인을 일관된 품질로 처리하는 SSOT(Single Source of Truth) 스킬이다.

**버전:** v4.2 (2026-03-09)
**상세 레퍼런스 위치:** 각 단계의 예시·배경·상세 규칙은 `references/` 폴더를 참조한다.

```
파이프라인: 크롤링 → 정리 → 용어 주석 → Analyst Note → 출력(MD→PDF) → 검수 + Obsidian
```

- 각 단계에 확정된 규칙이 있고, 단계를 건너뛰거나 순서를 바꾸지 않는다.
- 예외: 사용자가 "간단히", "한 줄로", "목록만" 등 다른 형식을 명시하면 해당 요청을 우선한다.

---

## ★ 핵심 원칙: SSOT (Single Source of Truth)

> **MD 파일이 유일한 원본이다. PDF는 반드시 MD 파일을 읽어서 변환한다.**
> PDF 콘텐츠를 독립적으로 생성하지 않는다. 이 원칙은 변경할 수 없다.

MD↔PDF 내용이 일치하도록 보장하는 구조적 안전장치이다. PDF 생성 시 `story` 리스트를 별도로 작성하는 것은 금지된다. 반드시 `md_to_pdf_converter.py`의 `convert_md_to_pdf()`를 사용한다.

---

## I. 크롤링 — 403 차단 시 5단계 우회 전략을 순서대로 실행한다

| 순서 | 도구 | 환경 | 비고 |
|---|---|---|---|
| 1차 | `fetch:fetch` MCP | Claude Desktop | 직접 크롤링 시도 |
| 1차 | `web_fetch` | claude.ai | Claude Desktop 외 환경 |
| 2차 | `kindly-web-search` MCP | Claude Desktop | 403 차단 시. Nodriver 기반 headless 렌더링. URL 리다이렉트 자동 추적 |
| 3차 | 대체소스 전략 | 모든 환경 | 원본 URL 접근 불가 시 동일 주제 권위 소스 2~3개에서 콘텐츠 수집 |
| 4차 | `web_search` | 모든 환경 | 기사 제목 키워드로 대체 기사 탐색 |
| 5차 | Python `requests` + `BeautifulSoup` | 모든 환경 | 최후 수단 |

- ⚠️ 전문 용어 주석은 **크롤링 중 처리 금지** → 정리 단계에서 일괄 처리한다.
- 크롤링 실패 시 다음 단계로 자동 전환하되, 각 단계마다 시도 결과를 보고한다.

### I-1. kindly-web-search 상세 사용법 (★ v4.1 신규)

`mcp__kindly-web-search__get_content`는 Nodriver 기반 headless 브라우저로 JavaScript 렌더링 후 콘텐츠를 추출한다.

- **URL 리다이렉트 자동 추적:** soldat-und-technik.de 등 URL 리다이렉트 사이트에서도 최종 목적지까지 따라가 콘텐츠를 반환한다.
- **적합한 사이트:** 403 차단이 JavaScript 기반인 경우, 동적 렌더링이 필요한 SPA 사이트
- **부적합한 사이트:** IP 기반 차단(breakingdefense.com 등), 로그인 필수 paywall
- **사용 예시:**
  ```
  mcp__kindly-web-search__get_content(url="https://example.com/article")
  ```

### I-2. 대체소스 전략 (★ v4.1 신규)

원본 URL이 모든 크롤링 방법으로 접근 불가할 때, 동일 주제를 다룬 **권위 있는 대체 소스 2~3개**에서 콘텐츠를 수집한다.

- **검색 방법:** `web_search`로 원문 기사 제목의 핵심 키워드 2~3개를 검색
- **소스 우선순위:**
  1. 동일 매체의 다른 URL (아카이브, AMP 버전 등)
  2. Reuters, AP, AFP 등 통신사 원문
  3. 주제 전문 매체 (방산: Janes, Defense News / 경제: Bloomberg, FT)
- **의무 사항:** 대체소스를 사용한 보고서의 메타데이터에 반드시 `alternate_source: true`를 명기한다 (Section V 참조)
- **품질 기준:** 원문과 동일한 사건·수치·인물을 다루는 기사만 대체소스로 인정한다

---

## II. 내용 정리 — 피라미드 구조로 하향식 요약한다

### 가. 논리 구조 (Pyramid Principle)

- 1. 소제목은 **결론형 메시지**로 작성한다. 소제목만 읽어도 핵심을 알 수 있어야 한다.
   - ❌ `"관세 관련 내용"` → ✅ `"대법원 판결로 트럼프 관세 체계가 흔들렸다"`
- 2. 흐름: **결론(헤드라인 요약) → 소제목별 세부 → Analyst Note**
- 3. 상위 항목이 하위 항목을 포괄해야 한다. 단순 나열 금지.

### 나. 시각 구조 (Outline Style)

- 1. 위계: `I → 1 → 가 → (1)` 순서를 따른다.
- 2. 단계별 들여쓰기로 계층을 시각화한다.
- 3. **최대 3단계**까지만 사용한다. 4단계 이상은 문장으로 풀어 쓴다.

### 다. 문장 형식 (Bullet Point Writing)

- 1. 순서 있는 절차 → 번호 (1, 2, 3). 순서 없는 항목 → 불릿 (-, •)
- 2. 한 항목은 **1~3문장 이내**로 압축한다.
- 3. 같은 계층의 항목은 **동일한 문장 형식(병렬 구조)**으로 통일한다.

### 라. 설명 원칙 (Explanatory Style) ★필수★

- 1. 단답·키워드 나열 금지. 각 항목에 "왜 그런지", "무엇을 의미하는지"를 문장으로 설명한다.
- 2. 처음 접하는 기술 용어가 나오면 비유 또는 한 줄 설명을 괄호 안에 덧붙인다.
- 3. 코드 제시 시 주요 단계마다 **한글 주석**으로 의도를 설명한다.

> 📎 **상세 예시·배경:** `references/guideline.md` 섹션 II 참조

---

## III. 전문 용어 주석 — 처음 등장하는 용어에 한 줄 설명을 덧붙인다

- 1. **경제·금융·정책 용어:** `용어 (= 설명. 이 문맥에서의 의미)` 형식
- 2. **기업명·지수명:** 첫 등장 시 영문 원명 + 티커 병기
- 3. **기술 용어:** 비유 또는 한 줄 설명을 괄호 안에 덧붙인다.
- 4. 동일 용어는 **문서 내 최초 1회만** 주석, 이후 생략한다.

> 📎 **용어 주석 예시 모음:** `references/guideline.md` 섹션 III 참조

---

## IV. Analyst Note — 시장 영향·정책 함의가 있는 섹션에 분석 박스를 추가한다

- **첨가:** 시장 영향, 정책 함의, 구조적 리스크가 있는 섹션
- **생략:** 단순 사실 전달(수치, 일정, 인사 등)만 있는 섹션

```
> 📌 **Analyst Note**
> [2~4문장. 사실에서 한 단계 더 들어간 함의·리스크·전망]
```

- 1. 기사 내용 단순 반복 **금지**. 반드시 한 단계 더 들어간 해석을 제시한다.
- 2. 불확실한 전망은 `~할 수 있다`, `~가능성이 있다` 등 **조건부 표현** 사용.
- 3. 분량 **2~4문장** 엄수. 길어지면 섹션 본문으로 이동한다.

---

## V. 출력 형식 + 메타데이터 + PDF 변환 (★ v4 개정, v4.1 보완, v4.2 저장 도구 강화)

### 가. 메타데이터 블록 (모든 문서 상단 필수)

```
**출처:** [매체명] | **저자:** [이름]
**원문 보도일:** YYYY-MM-DD | **정리일:** YYYY-MM-DD (KST)
**원문 URL:** [링크]
```

### 나. 대체소스 메타데이터 (★ v4.1 신규)

원본 URL 대신 대체소스를 사용한 경우, 메타데이터 블록에 아래 필드를 추가한다:

```
**출처:** [대체 매체명] | **저자:** [이름]
**원문 보도일:** YYYY-MM-DD | **정리일:** YYYY-MM-DD (KST)
**원문 URL:** [대체 기사 링크]
**원본 URL (접근 불가):** [원래 요청된 URL]
**alternate_source:** true
**대체 사유:** [403_blocked / 404_redirect / content_mismatch 등]
```

### 다. 출력 형식

| 형식 | 용도 | 비고 |
|---|---|---|
| **Markdown (.md)** | Obsidian 저장 기본 | 파일명: `topic_keyword_analysis.md` (소문자, 밑줄) |
| **한국공문서 PDF** | 한국어 공식 보고서·종설 | `pdf-report-templates` 스킬 연계 |
| **DoD양식 PDF** | 군사보안 연구 번역/분석 | `pdf-report-templates` 스킬 연계 |

### 라. Obsidian 저장 도구 (★ v4.2 강화: mcp__obsidian 전용)

> ⚠️ **필수 규칙: 보고서 MD 파일 저장은 오직 `mcp__obsidian__write_file`만 사용한다.**

- `mcp__obsidian__write_file`의 `path` 파라미터에 절대 경로 지정
- Obsidian 도메인별 경로는 `references/obsidian_paths.md` 참조

⛔ **금지:**
- `Write` 도구 (로컬 VM 파일시스템) — Obsidian vault에 도달하지 못함
- `Bash cp/mv` 명령 — VM mount 경로가 불안정할 수 있음
- `request_cowork_directory` — 사용자 승인 프롬프트가 표시되어 무중단 처리 중단 (특히 multiple-page-md-report에서 위임받아 실행될 때 중요)

> 이 규칙은 본 스킬이 단독 실행될 때와 multiple-page-md-report의 서브에이전트로 위임 실행될 때 모두 적용된다.

### 마. PDF 생성 규칙 — SSOT 필수 (★ v4 업데이트)

> ⚠️ **PDF 콘텐츠를 독립적으로 생성하는 것은 금지된다.**
> MD 파일이 이미 존재하면 반드시 `md_to_pdf_converter.py`를 사용하여 MD→PDF 자동 변환한다.

```python
import shutil, sys, os

# 1. 스킬 파일 경로 결정 (환경 자동 감지)
_skill_src = "/mnt/skills/user/pdf-report-templates"  # Chat 환경
if not os.path.isdir(_skill_src):
    # Cowork 환경: 현재 작업 디렉토리 또는 파서와 같은 폴더 사용
    _skill_src = os.getcwd()

# 2. 템플릿 + 변환기를 작업 디렉토리로 복사
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

# 한국공문서 양식
convert_md_to_pdf(
    "report.md", "report.pdf",
    template="KrGov",
    title="보고서 제목",
    footer_source="출처: XXX | 정리일: 2026-03-06",
)

# DoD 양식
convert_md_to_pdf(
    "report.md", "report.pdf",
    template="USDoD",
    title="REPORT TITLE",
    header_right="UNCLASSIFIED // FOR OFFICIAL USE",
    footer_left="출처: XXX | 정리일: 2026-03-06",
)
```

- `story` 리스트를 수동 작성하는 방식(방법 B)은 MD 파일이 없는 경우에만 허용된다.
- MD 파일이 존재하는데 `story`를 별도 작성하면 **MD↔PDF 불일치**가 발생한다. 이것이 v2에서 발생했던 핵심 버그이다.

> 📎 **PDF 생성 상세 규칙:** `references/pdf_rules.md` 참조
> 📎 **Obsidian 업로드 경로:** `references/obsidian_paths.md` 참조

---

## VI. 검수 체크리스트 — 제출 전 반드시 확인한다

| # | 확인 항목 |
|---|---|
| 1 | 소제목이 결론형 메시지인가? |
| 2 | 위계가 `I → 1 → 가` 순서인가? |
| 3 | 한 항목이 3문장 이내인가? |
| 4 | 전문 용어에 괄호 주석이 있는가? |
| 5 | Analyst Note가 단순 반복 없이 해석을 추가하는가? |
| 6 | 메타데이터(출처·날짜·저자)가 포함되었는가? |
| 7 | 한국어 + Markdown 문법이 적용되었는가? |
| 8 | ★ PDF 생성 시 MD 파일에서 변환했는가? (SSOT 준수) |
| 9 | ★ 대체소스 사용 시 `alternate_source: true` 메타데이터가 표기되었는가? (v4.1) |
| 10 | ★ 파일 저장에 `mcp__obsidian__write_file`을 사용했는가? (v4.2) |

- 검수 시 `sequential thinking` 도구를 사용하여 각 항목을 순차 점검한다.
- 발견된 문제는 `str_replace`로 즉시 수정한다.

---

## VII. 레퍼런스 목차

| 파일 | 내용 | 언제 읽는가 |
|---|---|---|
| `references/guideline.md` | 피라미드 원칙 상세, 설명 원칙 예시, 용어 주석 예시, Analyst Note 상세, 시스템 보안 규칙 | 보고서 작성 시 항상 |
| `references/pdf_rules.md` | PDF 템플릿 버전 관리, 폰트 규칙, SSOT 변환 규칙 | PDF 출력 요청 시 |
| `references/obsidian_paths.md` | 5개 프로젝트 도메인별 Obsidian 경로, 업로드 도구 | Obsidian 저장 시 |

---

## VIII. 버전 이력 (★ v4.1 신규)

| 버전 | 날짜 | 주요 변경 |
|---|---|---|
| v4.2 | 2026-03-09 | Obsidian 저장 도구 mcp__obsidian 전용 강화, request_cowork_directory 금지, 검수 체크리스트 #10 추가 |
| v4.1 | 2026-03-09 | kindly-web-search 상세 가이드, 대체소스 전략, 대체소스 메타데이터, 체크리스트 #9, 버전 이력 섹션 |
| v4 | 2026-03-06 | 환경 자동 감지 PDF 코드, 폰트 자동 관리, 동적 경로 |
| v3 | 2026-03-06 | SSOT 원칙, md_to_pdf_converter 연동 |
| v2 | 2026-03-03 | 최초 6단계 파이프라인, references 분리 |

> 📎 **상세 변경 이력:** `CHANGELOG.md` 참조
