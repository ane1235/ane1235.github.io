# Webpage Report — Version Update Log

---

## v4.2 (2026-03-09)

### 변경 사유

무중단 자동 처리(unattended processing) 지원을 위해 서브에이전트가 호출하는 저장 도구를 mcp__obsidian 전용으로 제한하고, request_cowork_directory 등 사용자 승인 프롬프트를 유발하는 도구 호출을 명시적으로 금지했다.

### 추가 (New)

- **Section V-라**: "Obsidian 저장 도구" 하위 섹션 신설 — mcp__obsidian__write_file 전용 규칙 + ⛔ 금지 사항 블록 (Write tool, Bash file I/O, request_cowork_directory)
- **Section VI**: 검수 체크리스트 항목 #10 추가 — "파일 저장에 mcp__obsidian__write_file을 사용했는가? (Write/Bash 사용 금지)"
- **Section VIII**: v4.2 버전 이력 행 추가

### 변경 (Changed)

- **Section V 제목**: "(★ v4 개정, v4.1 보완)" → "(★ v4 개정, v4.1 보완, v4.2 저장 도구 강화)" 변경
- **Section V-마**: 기존 V-라 (PDF 생성 규칙)를 V-마로 이동 (V-라가 신설 섹션이 차지)

---

## v4.1 (2026-03-09)

### 변경 사유

30개 군사·방산 URL 실전 배치(2026-03-08) 처리 과정에서 발견된 크롤링 실패 패턴과 대체소스 활용 경험을 반영하여 스킬을 개선했다.

### 추가 (New)

- **Section I-1**: kindly-web-search 상세 사용법 신설 — Nodriver 기반 headless 렌더링, URL 리다이렉트 자동 추적, 적합/부적합 사이트 구분
- **Section I-2**: 대체소스 전략 신설 — 원본 URL 접근 불가 시 동일 주제 권위 소스 2~3개에서 콘텐츠 수집. 소스 우선순위(동일 매체 → 통신사 → 주제 전문 매체) 정의
- **Section V 나**: 대체소스 메타데이터 블록 신설 — `alternate_source: true`, `대체 사유` 필드 추가
- **Section VIII**: 버전 이력 테이블 신설

### 변경 (Changed)

- **Section I**: 크롤링 테이블 4행 → 6행으로 확장 (kindly-web-search 상세 설명 추가, 대체소스 전략 행 추가)
- **Section I 제목**: "4단계 우회 전략" → "5단계 우회 전략" 변경
- **Section V 제목**: "(★ v4 개정)" → "(★ v4 개정, v4.1 보완)" 변경
- **Section VI**: 검수 체크리스트 항목 #9 추가 — "대체소스 사용 시 `alternate_source: true` 메타데이터가 표기되었는가?"

---

## v4 (2026-03-06)

### 변경 (Changed)

- **SKILL.md** — v4 환경 호환 업데이트
  - Section V의 PDF 변환 코드 예시를 환경 자동 감지 기반으로 업데이트
  - 하드코딩 경로 (`/mnt/skills/user/`, `/home/claude/`) → 동적 경로로 변경
  - `pdf-report-templates v3.0`의 환경 감지 기능과 연동

- **references/pdf_rules.md** — v4 개정
  - Rule III.4: `apt install -y fonts-nanum` 수동 설치 → 폰트 자동 관리(`_find_font()`)로 변경
  - Rule III.6: outputs 경로를 환경별 동적 결정(`_get_outputs_dir()`)으로 변경
  - v3→v4 변경 사유 문서화 (Cowork VM에서 sudo/시스템 디렉토리 제한 대응)

---

## v3 (2026-03-06)

### 추가 (New)

- **SKILL.md** — ★ SSOT 원칙 섹션 신설 (Section ★)
  - "MD 파일이 유일한 원본이다. PDF는 반드시 MD 파일을 읽어서 변환한다." 명시
  - Section V에 `md_to_pdf_converter.py` 연동 코드 예시 추가
  - 검수 체크리스트에 항목 8 추가: "PDF 생성 시 MD 파일에서 변환했는가? (SSOT 준수)"

### 변경 (Changed)

- **SKILL.md** — Section V "출력 형식" → "출력 형식 + 메타데이터 + PDF 변환" 으로 확장
  - 파이프라인 표기: `출력(MD/PDF)` → `출력(MD→PDF)` 변경
  - `story` 리스트 수동 작성 금지 규칙 명시
  - v2에서 발생한 MD↔PDF 불일치 원인 설명 추가

- **references/pdf_rules.md** — v3 개정
  - Rule III.1: `"build_content() (= story 리스트) **만** 새로 작성한다"` → `"MD 파일이 존재하면 반드시 convert_md_to_pdf()를 사용한다"` 변경
  - SSOT 원칙 섹션 신설
  - v2→v3 변경 사유 문서화

- **SKILL.md** — Version Update Log를 CHANGELOG.md로 분리

---

## v2 (2026-03-03)

### 최초 구조화 릴리스

- **SKILL.md** — 6단계 파이프라인 스킬 문서
  - 크롤링 → 정리 → 용어 주석 → Analyst Note → 출력 → 검수
  - 403 차단 4단계 우회 전략
  - references/ 폴더 분리 구조 도입

- **references/guideline.md** — 상세 가이드라인 v2.0
  - 피라미드 원칙, 설명 원칙, 용어 주석, Analyst Note, 보안 규칙

- **references/pdf_rules.md** — PDF 생성 규칙 v2
  - 템플릿 버전 관리 (USDoD v3 표준, v1/fpdf2 사용 금지)
  - 폰트 분리 원칙

- **references/obsidian_paths.md** — Obsidian 업로드 경로 11개 도메인
