# PDF 생성 규칙 및 템플릿 버전 관리

> **작성일:** 2026-03-06 (KST) — v4 개정
> **적용 범위:** `webpage-report` 스킬에서 PDF 출력이 필요한 모든 작업

---

## I. 출력 형식 3가지

| 형식 | 용도 | 도구 |
|---|---|---|
| **Markdown (.md)** | Obsidian 저장 기본, 아티팩트 등록 가능 | 직접 작성 |
| **[한국공문서] PDF** | 한국어 공식 보고서·종설 | `pdf_template_KrGov_1_0.py` |
| **[DoD양식] PDF** | 군사보안 연구 번역/분석 (한영혼합) | `pdf_template_USDoD_v3.py` ✅ |

---

## II. DoD 양식 버전 관리

| 파일 | 상태 | 비고 |
|---|---|---|
| `pdf_template_USDoD_v3.py` | ✅ **표준** | reportlab 엔진, 한영 폰트 분리, null bytes 0개 검증 완료 (2026-02-27 확정) |
| `pdf_template_USDoD_1.py` | ❌ 사용 금지 | 한글 null bytes 발생 |
| `pdf_template_USDoD_fpdf2.py` | ❌ 사용 금지 | 서식 불안정 |

---

## III. PDF 생성 핵심 규칙 (★ v4 개정)

### ★ SSOT 원칙 (변경 불가)

> **MD 파일이 유일한 원본이다. PDF는 반드시 MD 파일을 읽어서 변환한다.**
> `story` 리스트를 독립적으로 작성하여 PDF를 생성하는 것은 **금지**된다.

- 1. MD 파일이 존재하면 반드시 `md_to_pdf_converter.py`의 `convert_md_to_pdf()`를 사용한다.
- 2. `story` 리스트를 수동 작성하는 방식(방법 B)은 MD 파일이 **없는 경우에만** 허용된다.
- 3. `build_pdf()` 함수는 **절대 재생성 금지**. 템플릿을 `pdf-report-templates` Skill 폴더에서 복사하여 import한다.
- 4. **폰트 자동 관리 (v4 신규):** 수동 `apt install` 불필요. 템플릿 내장 `_find_font()`가 환경을 감지하여 폰트를 자동 탐색·다운로드·fallback 처리한다.
- 5. **폰트 분리 원칙 (DoD v3):**
  - 한글 포함 텍스트 → NanumGothic
  - 영문만 → DejaVuSans
- 6. **출력 경로 (v4 변경):** `build_pdf()` → `_get_outputs_dir()` (환경별 자동 결정) → `present_files`
  - Chat: `/mnt/user-data/outputs/`
  - Cowork: `$HOME/outputs/`

### v3→v4 변경 사유

v3에서는 `apt install -y fonts-nanum` 수동 실행을 전제했으나, Cowork VM에서 sudo 불가·시스템 디렉토리 쓰기 불가로 인해 폰트 설치가 실패했다. v4에서는 환경 자동 감지 + 폰트 동적 다운로드로 수동 설정을 제거했다. 또한 outputs 경로도 하드코딩에서 환경별 동적 결정으로 변경했다.

---

## IV. 파일명 규칙

- 형식: `topic_keyword_analysis.md` (소문자, 밑줄 구분)
- 예) `flamingo_votkinsk_strike_analysis.md`
- PDF도 동일 규칙: `flamingo_votkinsk_strike_analysis.pdf`

---

*PDF 템플릿 상세 스펙은 `pdf-report-templates` 스킬의 SKILL.md를 참조한다.*
