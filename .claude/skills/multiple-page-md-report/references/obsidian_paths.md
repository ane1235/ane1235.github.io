# Obsidian 업로드 경로 및 도구

> **작성일:** 2026-03-08 (KST)
> **적용 범위:** multiple-page-md-report 스킬 결과물의 Obsidian 저장

---

## I. 프로젝트 도메인별 Obsidian 경로

| 프로젝트 도메인 | Obsidian 경로 |
|---|---|
| 군사보안 연구 | /Users/kayen/ClaudeKB/03_Military_Security/Research/ |
| 군사보안 번역 | /Users/kayen/ClaudeKB/03_Military_Security/Translations/ |
| 투자 분석 | /Users/kayen/ClaudeKB/02_Investment/Research/ |
| 투자 포트폴리오 | /Users/kayen/ClaudeKB/02_Investment/Portfolio/ |
| 의학 연구 | /Users/kayen/ClaudeKB/04_Medical/Research/ |
| CATS APP 스킬 | /Users/kayen/ClaudeKB/01_CATS_APP/Skills/ |
| CATS APP 프로토콜 | /Users/kayen/ClaudeKB/01_CATS_APP/Protocols/ |
| CATS APP 세션 로그 | /Users/kayen/ClaudeKB/01_CATS_APP/Session_Logs/ |
| Apple 생태계 | /Users/kayen/ClaudeKB/05_Apple_Ecosystem/Tips/ |
| 템플릿 공통 | /Users/kayen/ClaudeKB/00_Templates/ |
| 기타/대기 | /Users/kayen/ClaudeKB/output/ |

---

## II. 도메인 자동 분류 키워드

| 도메인 | 키워드 |
|--------|--------|
| 군사보안 | missile, artillery, military, defense, weapon, army, navy, 미사일, 포병, 군사, 국방, drone, UAV, ICBM, hypersonic |
| 투자 | stock, market, investment, finance, economy, GDP, 주식, 투자, 경제, 금리, ETF, portfolio, bond |
| 의학 | medical, health, disease, treatment, clinical, 의학, 건강, 질환, 치료, pharmaceutical, drug |
| CATS APP | CATS, Claude, MCP, skill, protocol, agent |
| Apple | Apple, iPhone, Mac, iOS, macOS, iPad, Swift |

---

## III. 업로드 도구

### 가. Cowork 환경

- `mcp__obsidian__write_file` MCP를 사용한다.
- 파일 경로를 위 표의 해당 도메인 경로로 지정하여 직접 저장한다.
- 대량 파일: bash `cp` 명령이 더 빠름 (VM mount: `/sessions/*/mnt/ClaudeKB`)

### 나. 파일명 규칙

- 형식: `topic_keyword_analysis.md` (소문자, 밑줄 구분)
- 예) `flamingo_votkinsk_strike_analysis.md`
- 프로젝트 도메인이 명확하면 도메인 접두어 생략 가능

---

*Obsidian Vault 기본 경로: /Users/kayen/ClaudeKB/*
