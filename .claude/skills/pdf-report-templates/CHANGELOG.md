# PDF Report Templates — Version Update Log

---

## v3.0 (2026-03-06)

### 추가 (New)

- **_detect_environment()** — Chat/Cowork 환경 자동 감지 함수
  - `/mnt/skills/` 존재 → Chat, `$HOME`에 `/sessions/` 포함 → Cowork
  - KrGov, USDoD 양쪽 템플릿에 동일하게 내장

- **_find_font()** — 동적 폰트 탐색 + 자동 다운로드 함수
  - 탐색 체인: 시스템 경로 → `~/.fonts/nanum/` → GitHub 다운로드 → DejaVu fallback
  - Google Fonts 파일명 매핑 자동 처리 (`NanumGothic.ttf` ↔ `NanumGothic-Regular.ttf`)
  - DejaVu→Nanum fallback: DejaVu 폰트 부재 시 Nanum으로 자동 대체

- **_get_outputs_dir()** — 환경별 outputs 디렉토리 자동 결정
  - Chat: `/mnt/user-data/outputs/`, Cowork: `$HOME/outputs/`

### 변경 (Changed)

- **pdf_template_KrGov_1_0.py** — v3.0 환경 호환 업데이트
  - 하드코딩 폰트 경로 제거 → `_find_font()` 동적 탐색으로 전환
  - 폰트 등록 시 try/except 적용 (crash 방지)
  - `build_pdf()`의 outputs 경로를 `_get_outputs_dir()`로 동적 결정

- **pdf_template_USDoD_v3.py** — v3.0 환경 호환 업데이트
  - 4종 폰트(DejaVu 2종 + Nanum 2종) 등록에 try/except + `_find_font()` 적용
  - 원본의 `os.path.exists()` 체크 누락 버그 수정 (폰트 파일 부재 시 crash 방지)
  - `build_pdf()`의 outputs 경로를 `_get_outputs_dir()`로 동적 결정

- **md_to_pdf_converter.py** — v1.1 경로 호환 업데이트
  - `_append_image()`: 하드코딩 `/sessions/festive-fervent-feynman/` 경로 → `$HOME` 기반 동적 경로
  - `_load_template_module()`: 하드코딩 `/home/claude` → `$HOME`, Chat 환경 `/mnt/skills/` 경로 추가

- **SKILL.md** — v3.0 전면 개정
  - Step 0: `apt install` 수동 설치 안내 제거 → 환경 자동 감지 + 폰트 자동 관리 설명
  - 워크플로우 방법 A 코드 예시를 환경 감지 기반으로 업데이트
  - DoD양식 v3 설명에 환경 감지 관련 변경사항 추가

### 수정 (Fixed)

- **USDoD 폰트 등록 crash** — 원본 코드에서 `pdfmetrics.registerFont(TTFont(_name, _path))`를 `os.path.exists()` 체크 없이 호출하여, 폰트 파일이 없는 환경(Cowork VM)에서 즉시 crash하던 버그 수정
- **하드코딩 세션 경로** — md_to_pdf_converter.py에 이전 세션 ID(`festive-fervent-feynman`)가 하드코딩되어 다른 세션에서 이미지 탐색이 실패하던 문제 수정

---

## v2.0 (2026-03-06)

### 추가 (New)

- **md_to_pdf_converter.py** — MD→PDF 자동 변환 파서 신규 추가
  - 아키텍처: MD → IR(중간 표현) → story(KrGov/USDoD)
  - 주요 함수: `convert_md_to_pdf()`, `parse_md()`, `ir_to_krgov_story()`, `ir_to_usdod_story()`
  - IR 노드 타입 13종: metadata, title, h1~h3, body, bullet1~2, analyst_note, table, image, ref, spacer
  - 한글 자동 감지: USDoD 템플릿에서 텍스트별 적절한 폰트 함수 자동 선택
  - MD 인라인 마크업 → ReportLab HTML 자동 변환 (**bold**, *italic*, `code`, [link])
  - YAML frontmatter 자동 건너뛰기
  - Analyst Note (`> 📌`) 블록인용 자동 감지 및 HighlightBox/AnalystNote 변환
  - 참고문헌 섹션 자동 감지 및 ref 스타일 적용
  - 이미지 삽입 지원 (파일 존재 확인 + 폴백 경고 텍스트)

### 변경 (Changed)

- **SKILL.md** — v2.0 전면 개정
  - ★ SSOT 원칙 명시: "MD 파일이 유일한 원본. PDF는 반드시 MD에서 변환"
  - 워크플로우를 방법 A(자동 변환, 권장) / 방법 B(수동 story, 특수 레이아웃용)로 이원화
  - md_to_pdf_converter.py API 문서 추가 (함수, IR 노드 타입, 파라미터 상세)
  - 한글 자동 감지 규칙 문서화
  - Version Update Log를 CHANGELOG.md로 분리

### 수정 (Fixed)

- **tests/test_templates.py** — DoD 테스트에서 deprecated `pdf_template_USDoD_1.py` 참조를 `pdf_template_USDoD_v3.py`로 수정
  - MD→PDF 변환기 테스트 4종 추가: IR 파싱, KrGov 변환, USDoD 변환, 한글 감지

---

## v1.0 (2026-03-03)

### 최초 릴리스

- **pdf_template_KrGov_1_0.py** — 한국 공문서 양식 PDF 템플릿
  - reportlab 기반, A4, NanumGothic, Navy/Blue 색상
  - SectionHeader, HighlightBox, DocInfoTable, make_table 등 Flowable 제공

- **pdf_template_USDoD_v3.py** — US DoD 양식 PDF 템플릿 (v3 확정판)
  - reportlab 기반, A4, DejaVuSans+NanumGothic 폰트 분리
  - Army Green/Tan 색상, MetadataBlock, KeyFindings, SectionHeader, SubSection, AnalystNote 등 Flowable 제공
  - 2026-03-03: _make_header_footer() 내 폰트를 NanumGothicBold로 통일 (null bytes 버그 수정)

- **SKILL.md** — v1.0 스킬 문서
- **tests/test_templates.py** — 기본 테스트 3종 (SKILL.md 검증, KrGov PDF, DoD PDF)
