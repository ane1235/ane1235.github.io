---
name: multiple-page-md-report
description: >
  여러 개의 URL을 한꺼번에 입력받아 각각의 웹 기사를 크롤링하고,
  언어별(한국어·영어·독일어) 마크다운 보고서를 자동 생성하여 Obsidian에 저장하는
  배치 오케스트레이션 스킬. 다음 맥락에서 반드시 이 스킬을 사용한다:
  - 여러 개(2개 이상)의 URL을 동시에 보고서로 만들어 달라는 요청
  - "이 기사들 정리해줘", "URL 목록 처리해줘", "배치 크롤링" 등의 키워드
  - 다수의 웹페이지를 한 폴더에 묶어 정리하는 작업
  - "여러 기사", "multiple articles", "batch report" 등의 표현이 포함된 요청
  - URL이 2개 이상 나열되어 있고 각각에 대해 보고서를 만들어야 하는 모든 상황
  - 단일 URL 보고서는 webpage-report 스킬을 사용한다
---

# Multiple Page MD Report 스킬 v1.2

여러 URL을 동시에 입력받아 언어별 마크다운 보고서를 병렬 생성하고, Obsidian vault에 도메인별로 저장하는 배치 오케스트레이션 스킬이다.

**버전:** v1.2 (2026-03-09) — MD only 병렬 확대(→5개), 무중단 자동 처리 프로토콜 신설
**역할:** webpage-report 스킬 위의 오케스트레이션 레이어. 개별 보고서 작성 품질은 webpage-report의 6단계 파이프라인을 따른다.

```
파이프라인: URL 파싱 → 언어 감지 → 배치 구성 → 사전 준비 → 병렬 크롤링+보고서 생성 → 폴더 정리 → Obsidian 저장
```

---

## 1. 입력 처리

사용자가 제공하는 URL 목록을 파싱한다. 입력 형태는 유연하게 받아들인다.

- 줄바꿈으로 구분된 URL 목록
- 쉼표, 공백으로 구분된 URL 나열
- 번호 매긴 목록 (1. URL, 2. URL ...)
- 메시지 본문에 산재한 URL 자동 추출

파싱 후 중복 URL을 제거하고, 총 URL 수를 사용자에게 확인한다.

---

## 2. 언어 감지 및 보고서 수 결정

각 URL의 원문 언어를 크롤링 1단계에서 자동 감지하고, 아래 규칙에 따라 생성할 보고서 수를 결정한다.

| 원문 언어 | 생성 보고서 | 파일 수 |
|-----------|------------|---------|
| 한국어 (KR) | 한국어 보고서 1건 | 1 |
| 영어 (EN) | 영어 원문 + 한국어 번역 | 2 |
| 독일어 (DE) | 독일어 원문 + 영어 번역 + 한국어 번역 | 3 |
| 기타 언어 | 원문 + 영어 번역 + 한국어 번역 | 3 |

파일명 접미사 규칙:
- 원문: `_original.md` (한국어 원문은 접미사 없음)
- 영어 번역: `_en.md`
- 한국어 번역: `_kr.md`

---

## 3. 배치 병렬 처리 (★ v1.2 개정)

### 3-1. 출력 모드별 배치 크기 결정표

M3 MacBook Air 16GB 기준:

| 출력 모드 | 배치 크기 (동시 서브에이전트 수) | 병목 요인 | 비고 |
|-----------|-------------------------------|-----------|------|
| **MD only** (기본) | **5** | 네트워크 I/O + LLM API | CPU 부하 낮음, 텍스트 I/O 위주 |
| **MD + PDF** | **3** | CPU (PDF 렌더링) + 메모리 | PDF 1건당 ~200MB 피크 메모리 |
| **PDF heavy** (3언어 모두 PDF) | **2** | CPU + 메모리 | 동시 PDF 렌더링 6건 이상 방지 |

> 사용자가 "PDF도 만들어줘"라고 하지 않는 한, **MD only 모드(배치 5)** 가 기본값이다.

### 3-2. 배치 구성 원칙

1. 전체 URL 목록을 위 배치 크기에 따라 묶는다 (MD only → 5개씩)
2. 각 배치의 서브에이전트가 모두 완료된 후 다음 배치를 시작한다
3. 한 서브에이전트가 하나의 URL에 대해 **언어별 모든 보고서**를 생성한다

### 3-3. 서브에이전트 프롬프트 템플릿

각 Task 서브에이전트에게 아래 정보를 전달한다:

```
이 URL의 웹 기사를 크롤링하여 마크다운 보고서를 작성하라.

- URL: {url}
- 크롤링 우선순위: fetch → kindly-web-search → web_search(대체소스) → Chrome MCP
- 보고서 작성 지침: webpage-report 스킬의 6단계 파이프라인을 따른다
  - 피라미드 원칙: 결론형 소제목, 계층적 개요 (I → 1 → 가 → (1))
  - 전문 용어 주석: 초출 시 (**용어**, Term) 형식
  - Analyst Note: 📌 박스로 해석·함의·전망 2~4문장
  - 검수: 원문 대비 누락 확인
- 원문 언어: {detected_language}
- 생성할 보고서: {report_list}
- 저장 경로: {output_path}  ← ★ 반드시 절대 경로로 명시
- 파일명: {filename_base}_{suffix}.md
- 저장 도구: mcp__obsidian__write_file (path 파라미터에 절대 경로)

⛔ 금지 사항 (반드시 준수):
  - request_cowork_directory 호출 금지
  - Write 도구 (로컬 VM 파일시스템) 사용 금지
  - Bash cp/mv 등 파일 복사 명령 금지
  - 파일 저장은 오직 mcp__obsidian__write_file만 사용한다
```

> ⚠️ **v1.2 강화**: 서브에이전트가 `request_cowork_directory`를 호출하면 사용자에게 승인 프롬프트가 표시되어 무중단 처리가 중단된다. 반드시 금지 사항 블록을 포함한다.

---

## 4. 크롤링 우선순위 (★ v1.1 개정: 4단계 폴백)

네 단계 폴백(fallback) 전략을 사용한다. 각 단계에서 실패하면 다음 단계로 넘어간다.

### 4-1. 1순위: fetch / WebFetch

```
mcp__fetch__fetch 또는 WebFetch 도구 사용
```
- 가장 빠르고 안정적
- 대부분의 공개 기사에서 작동

### 4-2. 2순위: kindly-web-search

```
mcp__kindly-web-search__get_content 사용
```
- fetch가 403/404/차단될 때 사용
- Nodriver 기반 headless 브라우저로 렌더링
- **★ URL 리다이렉트 자동 추적**: 사이트가 URL 슬러그를 변경한 경우(예: soldat-und-technik.de), fetch는 404를 반환하지만 kindly-web-search는 리다이렉트를 따라가 실제 페이지에 도달한다

### 4-3. 3순위: 대체소스 전략 (★ v1.1 신설)

```
mcp__kindly-web-search__web_search 또는 WebSearch로 동일 주제 검색
```
- 원본 URL에 어떤 방법으로도 접근 불가할 때 사용
- 동일 키워드(무기명, 회사명, 프로그램명)로 검색하여 **최소 2~3개 권위 소스**에서 콘텐츠 수집
- 검증된 대체소스: 제조사 공식 사이트, Jane's, The War Zone, Army Technology, Fragout Magazine, DVIDS
- metadata 블록에 반드시 `alternate_source: true` 및 실제 사용 소스 URL 명기
- Analyst Note에서 원본 대비 대체소스의 한계를 언급

### 4-4. 4순위: Chrome MCP (최후 수단)

```
mcp__Claude_in_Chrome__ 도구군 사용
```
- 사용자가 Chrome에서 이미 로그인한 유료 구독 사이트
- 반드시 사용자가 해당 사이트에 정당한 접근 권한이 있을 때만 사용
- navigate → get_page_text 순서로 콘텐츠 추출
- breakingdefense.com 등 완전 차단(403) 사이트의 마지막 수단

### 4-5. 사이트별 크롤링 난이도 참조표 (★ v1.1 신설)

| 사이트 | 난이도 | fetch 성공률 | 권장 전략 |
|--------|--------|-------------|-----------|
| defence-network.com | ★☆☆ 쉬움 | ~90% | fetch 우선, 실패 시 kindly |
| globalsecurity.org | ★☆☆ 쉬움 | ~95% | fetch 안정적 |
| esut.de | ★☆☆ 쉬움 | ~95% | fetch 안정적 |
| soldat-und-technik.de | ★★★ 어려움 | ~30% | **kindly 필수** (URL 리다이렉트 빈번) |
| hartpunkt.de | ★★☆ 보통 | ~70% | fetch 시도 후 실패 시 대체소스 |
| breakingdefense.com | ★★★ 어려움 | 0% (403) | **Chrome MCP만 가능** |

> 이 표는 실전 경험에 기반한다. 사이트 정책 변경 시 Supermemory를 recall하여 최신 정보를 확인한다.

---

## 5. 폴더 구조 및 저장

### 5-1. 폴더 결정 규칙

| 조건 | 폴더명 |
|------|--------|
| 사용자가 폴더명을 지정한 경우 | 지정된 이름 사용 |
| 폴더명 미지정 | YYMMDD 형식 (예: `260308`) |

### 5-2. Obsidian 저장 경로

도메인별 Obsidian 경로는 `references/obsidian_paths.md`를 참조한다. 핵심 매핑:

| 도메인 | 경로 |
|--------|------|
| 군사보안 연구 | `/Users/kayen/ClaudeKB/03_Military_Security/Research/` |
| 투자 분석 | `/Users/kayen/ClaudeKB/02_Investment/Research/` |
| 의학 연구 | `/Users/kayen/ClaudeKB/04_Medical/Research/` |
| 기타 | `/Users/kayen/ClaudeKB/output/` |

최종 저장 경로: `{도메인경로}/{폴더명}/{파일명}.md`

예시:
```
/Users/kayen/ClaudeKB/03_Military_Security/Research/260308/hypersonic_missile_analysis.md
/Users/kayen/ClaudeKB/03_Military_Security/Research/260308/hypersonic_missile_analysis_kr.md
```

### 5-3. 저장 도구 (★ v1.2 강화: mcp__obsidian 전용)

> ⚠️ **필수 규칙: 파일 저장은 오직 `mcp__obsidian__write_file`만 사용한다.**

- **Cowork 환경**: `mcp__obsidian__write_file` MCP의 `path` 파라미터에 절대 경로 지정
- 서브에이전트를 포함한 모든 처리 단계에서 이 규칙을 따른다

⛔ **금지:**
- `Write` 도구 (로컬 VM 파일시스템) — 사용자 Obsidian vault에 도달하지 못함
- `Bash cp/mv` 명령 — VM mount 경로가 서브에이전트에서 불안정
- `request_cowork_directory` — 사용자 승인 프롬프트가 표시되어 무중단 처리 중단

### 5-4. 파일명 규칙

- 형식: `topic_keyword_{suffix}.md` (소문자, 밑줄 구분)
- 예: `flamingo_votkinsk_strike_analysis.md`
- 기사 제목에서 핵심 키워드 2~3개를 추출하여 구성

---

## 6. 보고서 작성 지침 (위임)

개별 보고서의 내용 품질은 **webpage-report 스킬의 6단계 파이프라인**에 위임한다. 서브에이전트가 참조해야 할 핵심 규칙만 요약하면:

1. **피라미드 원칙**: 결론을 소제목에 담는다 (×기술 동향 → ○차세대 센서가 탐지 확률을 40% 높인다)
2. **계층적 개요**: I → 1 → 가 → (1) 순서
3. **전문 용어 주석**: 초출 시 (**볼드 한글**, English Term) 형식으로 각주 없이 본문 병기
4. **Analyst Note**: 📌 표시, 2~4문장, 단순 사실 반복이 아닌 해석·함의·전망
5. **SSOT**: 마크다운이 원본, PDF는 파생물 (PDF는 명시적 요청 시에만)
6. **검수**: 원문 대비 주요 수치·인명·사건 누락 확인

번역 보고서 작성 시 추가 규칙:
- 원문의 구조와 소제목 체계를 유지한다
- 전문 용어는 번역어와 원어를 병기한다
- 번역 보고서 상단에 원문 URL과 원문 언어를 명시한다

---

## 7. 실행 흐름 요약 (★ v1.2 개정)

```
사용자: URL 목록 + (선택) 폴더명 + (선택) 도메인 힌트
         │
         ▼
    ┌─────────────┐
    │ 1. URL 파싱  │  중복 제거, 총 수 확인
    └──────┬──────┘
           ▼
    ┌──────────────────┐
    │ 2. 사전 준비      │  ★ v1.2 추가
    │  ├─ Obsidian vault│  mcp__obsidian__list_directory로 접근 확인
    │  └─ 폴더 생성     │  mcp__obsidian__create_directory로 사전 생성
    └──────┬───────────┘
           ▼
    ┌─────────────┐
    │ 3. 배치 구성 │  출력 모드별 배치 크기 결정 (MD only=5)
    └──────┬──────┘
           ▼
    ┌─────────────────────────┐
    │ 4. 배치 N 병렬 실행     │
    │  ├─ Task 1: URL-A 처리  │  크롤링 → 언어감지 → 보고서 생성
    │  ├─ Task 2: URL-B 처리  │  (⛔ request_cowork_directory 금지)
    │  ├─ Task 3: URL-C 처리  │
    │  ├─ Task 4: URL-D 처리  │  ← MD only 모드 시
    │  └─ Task 5: URL-E 처리  │  ← MD only 모드 시
    └──────┬──────────────────┘
           ▼
    ┌─────────────┐
    │ 5. 다음 배치 │  배치 완료 후 반복
    └──────┬──────┘
           ▼
    ┌──────────────────┐
    │ 6. 실패 URL 재시도│  (섹션 11 참조)
    └──────┬───────────┘
           ▼
    ┌──────────────────┐
    │ 7. 폴더 생성     │  커스텀명 or YYMMDD
    │    + Obsidian 저장│  도메인별 경로
    └──────┬───────────┘
           ▼
    ┌─────────────┐
    │ 8. 결과 보고 │  처리 요약표 + _processing_summary.md
    └─────────────┘
```

---

## 8. 결과 보고

모든 배치 완료 후, 아래 형식의 요약표를 사용자에게 제시한다:

```markdown
## 처리 결과 요약

| # | 기사 제목 | 원문 언어 | 생성 파일 | 저장 경로 | 상태 |
|---|----------|----------|----------|----------|------|
| 1 | 제목A | EN | 2건 | .../260308/ | ✅ 완료 |
| 2 | 제목B | DE | 3건 | .../260308/ | ✅ 완료 |
| 3 | 제목C | EN | 2건 | .../260308/ | ⚠️ kindly 폴백 |

총 URL: 3개 / 생성 파일: 7개 / 소요 시간: ~X분
```

> ★ v1.1: 요약표를 `_processing_summary.md` 파일로도 저장 폴더에 기록한다. 폴백 이력, 소스 분포, 통계를 포함한다.

---

## 9. PDF 옵션 (명시적 요청 시에만)

사용자가 "PDF도 만들어줘"라고 명시한 경우에만 PDF를 생성한다. 이 경우:
- pdf-report-templates 스킬을 함께 사용한다
- 배치 크기를 3으로 줄인다 (Section 3-1 참조)
- PDF는 마크다운으로부터 파생한다 (SSOT 원칙)

---

## 10. 주의사항

- Sequential Thinking을 사용하여 전체 배치 계획을 수립한 후 실행한다
- Supermemory에서 사용자의 보고서 관련 선호도를 recall한다
- **★ Supermemory에서 사이트별 크롤링 난이도를 recall한다** (v1.1 추가)
- 배치 중 하나의 URL이 실패해도 나머지는 계속 진행한다
- 각 서브에이전트는 독립적으로 크롤링 폴백을 수행한다
- 동일 도메인의 기사가 섞여 있으면, 가장 빈도가 높은 도메인 경로를 기본으로 하되 사용자에게 확인한다
- **★ 서브에이전트에게 저장 경로를 절대 경로로 전달한다** (v1.1 추가: 경로 오류 방지)
- **★ 20개 이상 대량 배치 시 컨텍스트 윈도우 관리에 유의한다** (v1.1 추가):
  - TodoWrite로 배치별 진행 상태를 반드시 추적한다
  - 컴팩션(compaction) 발생 시 TodoWrite 상태로 복원 가능하도록 설계한다
  - 실패 URL 목록을 별도로 관리하여 최종 재시도에 사용한다
- **★ 서브에이전트 도구 통제를 반드시 시행한다** (v1.2 추가):
  - 서브에이전트 프롬프트에 ⛔ 금지 사항 블록을 반드시 포함한다 (Section 3-3 참조)
  - 서브에이전트가 권한 요청 프롬프트를 트리거하면 사용자가 모니터해야 하므로, 무중단 처리가 불가능해진다

---

## 11. 실패 URL 재시도 프로토콜 (★ v1.1 신설)

전체 배치 완료 후, 실패한 URL이 있으면 아래 프로토콜로 재시도한다.

### 11-1. 실패 URL 수집

- 각 배치 결과에서 실패(404, 403, 콘텐츠 불일치, 파일 누락)한 URL을 수집한다
- 실패 원인을 분류한다:
  - `404_redirect`: URL 슬러그 변경 → kindly-web-search 재시도
  - `403_blocked`: 완전 차단 → Chrome MCP 또는 대체소스
  - `content_mismatch`: 크롤링 성공이나 내용이 다름 → 재크롤링 또는 대체소스
  - `file_missing`: 파일이 잘못된 경로에 저장됨 → 경로 확인 후 재생성

### 11-2. 재시도 실행

- 실패 URL을 2~3개씩 묶어 병렬 서브에이전트로 재시도한다
- 서브에이전트 프롬프트에 **실패 원인과 권장 폴백 단계**를 명시한다
- 재시도 서브에이전트에게 원본 URL뿐 아니라 **주제 키워드**도 전달하여 대체소스 검색을 용이하게 한다

### 11-3. 재시도 후 검증

- `mcp__obsidian__list_directory`로 최종 파일 수를 확인한다
- 예상 파일 수(DE×3 + EN×2)와 실제 파일 수가 일치하는지 검증한다
- `_processing_summary.md`를 갱신한다

---

## 12. 무중단 자동 처리 프로토콜 (★ v1.2 신설)

사용자가 배치 작업을 시작한 뒤 모니터 없이 자리를 비울 수 있도록, 오케스트레이터가 사전 준비를 완료하고 서브에이전트의 권한 요청을 원천 차단한다.

### 12-1. 사전 준비 (오케스트레이터 1회 실행)

배치 병렬 실행 전에 오케스트레이터가 아래 작업을 완료한다:

1. **Obsidian vault 접근 확인**: `mcp__obsidian__list_directory`로 Obsidian vault 루트(`/Users/kayen/ClaudeKB/`)에 접근 가능한지 검증한다
2. **저장 폴더 사전 생성**: `mcp__obsidian__create_directory`로 도메인별 하위 폴더를 미리 생성한다
   - 예: `/Users/kayen/ClaudeKB/03_Military_Security/Research/260309/`
3. **접근 불가 시 즉시 중단**: vault 접근 불가 시 사용자에게 알리고 배치를 시작하지 않는다

> 이 단계에서 사용자 승인이 1회 필요할 수 있다. 이후 서브에이전트 단계에서는 승인 0회를 보장한다.

### 12-2. 서브에이전트 도구 제한 시행

- 서브에이전트 프롬프트에 **Section 3-3의 ⛔ 금지 사항 블록**을 반드시 포함한다
- 허용 도구 화이트리스트:
  - `mcp__obsidian__write_file` — 파일 저장
  - `mcp__obsidian__list_directory` — 파일 존재 확인
  - `mcp__obsidian__create_directory` — 하위 폴더 생성
  - `mcp__fetch__fetch` / `mcp__kindly-web-search__*` / `WebFetch` / `WebSearch` — 크롤링
  - `mcp__sequential-thinking__sequentialthinking` — 분석
- 금지 도구 블랙리스트:
  - `request_cowork_directory` — 사용자 승인 프롬프트 유발
  - `Write` — 로컬 VM 파일시스템, Obsidian vault 미도달
  - `Bash` (파일 I/O 관련) — VM mount 불안정

### 12-3. 에러 자동 복구

- 서브에이전트가 `mcp__obsidian__write_file` 실패 시:
  1. 저장 경로의 상위 폴더 존재 확인 → 없으면 `mcp__obsidian__create_directory`
  2. 재시도 1회
  3. 재시도 실패 시 해당 URL을 실패 목록에 추가하고 다음 URL로 진행
- 크롤링 실패 시: Section 4의 폴백 체인을 순서대로 시도

---

## 13. 레퍼런스

| 파일/소스 | 내용 | 언제 참조하는가 |
|-----------|------|----------------|
| `references/obsidian_paths.md` | 5개 도메인별 Obsidian 경로 | 저장 경로 결정 시 |
| webpage-report SKILL.md | 6단계 파이프라인 상세 | 서브에이전트 프롬프트 작성 시 |
| pdf-report-templates SKILL.md | PDF 템플릿 규칙 | PDF 옵션 사용 시 |
| Supermemory: 크롤링 프로파일 | 사이트별 난이도·폴백 이력 | 배치 계획 수립 시 |
