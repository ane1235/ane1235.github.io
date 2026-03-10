# Multiple Page MD Report — Version Update Log

---

## v1.2 (2026-03-09)

### 변경 사유

MD only 모드에서 병렬 배치를 3개에서 5개로 확대하고, 사용자가 작업을 모니터하지 않아도 되는 무중단 자동 처리 프로토콜을 신설했다.

### 추가 (New)

- **Section 3-1**: 출력 모드별 배치 크기 결정표 신설 — MD only=5, MD+PDF=3, PDF heavy=2
- **Section 3-3**: 서브에이전트 프롬프트에 ⛔ 금지 사항 블록 추가 — request_cowork_directory/Write/Bash 금지
- **Section 7**: 실행 흐름에 "2. 사전 준비" 단계 추가 — Obsidian vault 접근 확인 + 폴더 사전 생성
- **Section 12 (NEW)**: "무중단 자동 처리 프로토콜" 신설 — 12-1 사전 준비, 12-2 도구 제한 시행, 12-3 에러 자동 복구

### 변경 (Changed)

- **Section 3 제목**: "배치 병렬 처리" → "배치 병렬 처리 (★ v1.2 개정)" 변경
- **Section 3**: 기존 "3개 동시 실행, PDF 없으면 4개" → 출력 모드별 결정표 + 배치 구성 원칙 + 프롬프트 템플릿으로 3개 하위 섹션 분리
- **Section 5-3**: "mcp__obsidian + bash cp" → "mcp__obsidian 전용, Write/Bash/request_cowork_directory 금지" 강화
- **Section 7**: 사전 준비 단계 삽입, Task 4/5 표시 추가
- **Section 9**: "병렬 배치 수를 3개에서 2개로" → "배치 크기를 3으로 줄인다 (Section 3-1 참조)" 변경
- **Section 10**: 서브에이전트 도구 통제 bullet 추가
- **Section 12 → 13**: 기존 레퍼런스 섹션을 13으로 이동

---

## v1.1 (2026-03-09)

### 변경 사유

30개 군사·방산 URL 실전 배치(2026-03-08) 처리 과정에서 발견된 크롤링 실패 패턴, 경로 오류, 컨텍스트 윈도우 한계를 반영하여 스킬을 개선했다.

### 추가 (New)

- **Section 4-3**: 대체소스 전략 신설 — 원본 URL 접근 불가 시 동일 주제 키워드로 권위 소스 2~3개에서 콘텐츠 수집. metadata에 `alternate_source: true` 명기
- **Section 4-5**: 사이트별 크롤링 난이도 참조표 신설 — soldat-und-technik.de(URL 리다이렉트), breakingdefense.com(403 차단) 등 실전 프로파일 6개 사이트 수록
- **Section 11**: 실패 URL 재시도 프로토콜 신설 — 실패 원인 분류(404_redirect, 403_blocked, content_mismatch, file_missing) + 배치 재시도 + 검증
- **Section 12**: 레퍼런스 테이블 신설

### 변경 (Changed)

- **Section 3**: 서브에이전트 프롬프트 템플릿에 절대 경로 명시 강제 추가 (`mcp__obsidian__write_file`의 path 파라미터)
- **Section 4**: 크롤링 폴백 3단계 → 4단계로 확장 (대체소스 전략 추가)
  - 4-2 kindly-web-search: URL 리다이렉트 자동 추적 기능 설명 추가
  - 4-4 Chrome MCP: breakingdefense.com 등 완전 차단 사이트 대응 명시
- **Section 7**: 실행 흐름에 "5. 실패 URL 재시도" 단계 추가
- **Section 8**: 결과 보고에 `_processing_summary.md` 파일 생성 규칙 추가
- **Section 10**: 주의사항 3개 항목 추가 — Supermemory 크롤링 프로파일 recall, 절대 경로 강제, 20개 이상 대량 배치 시 컨텍스트 윈도우 관리

---

## v1 (2026-03-08)

### 최초 릴리스

- **SKILL.md** — 배치 오케스트레이션 스킬 문서
  - URL 파싱 → 언어 감지 → 배치 구성 → 병렬 크롤링+보고서 생성 → Obsidian 저장
  - 3단계 크롤링 폴백 (fetch → kindly → Chrome MCP)
  - Task 서브에이전트 3개 동시 실행 (M3 MacBook Air 16GB 기준)
  - 언어별 보고서 생성 규칙 (KR×1, EN×2, DE×3)
  - webpage-report 스킬 위임 구조

- **references/obsidian_paths.md** — 도메인별 Obsidian 경로 11개
