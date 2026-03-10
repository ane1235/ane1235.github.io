# Obsidian 업로드 경로 및 도구

> **작성일:** 2026-03-03 (KST)
> **적용 범위:** webpage-report 스킬 결과물의 Obsidian 저장

---

## I. 프로젝트 도메인별 Obsidian 경로 (전체 확정)

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

## II. 업로드 도구

### 가. Claude Desktop 환경

- obsidian:write_file MCP (= @modelcontextprotocol/server-filesystem)를 사용한다.
- 파일 경로를 위 표의 해당 도메인 경로로 지정하여 직접 저장한다.

### 나. claude.ai 웹 환경

- MCP 접근이 불가하므로 **수동 배치**를 안내한다.
- MD 파일을 /mnt/user-data/outputs/에 생성하고 present_files로 다운로드 제공한다.
- 사용자가 Obsidian 앱에서 해당 폴더로 직접 이동한다.

---

## III. 파일명 규칙

- 형식: topic_keyword_analysis.md (소문자, 밑줄 구분)
- 예) flamingo_votkinsk_strike_analysis.md
- 프로젝트 도메인이 명확하면 도메인 접두어 생략 가능. 경로가 이미 도메인을 구분하기 때문이다.

---

*Obsidian Vault 기본 경로: /Users/kayen/ClaudeKB/*
