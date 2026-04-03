# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KSCTVA 2026 춘계학술대회 프로그램 웹앱. 부천세종병원 마취통증의학과 약 20명이 학술대회 세션을 조회하고 강좌를 선택/저장하는 GitHub Pages 정적 사이트.

- **배포:** https://ane1235.github.io/
- **백엔드:** Google Apps Script 웹앱 (인증, 선택 저장/조회)
- **데이터 원본:** Google Spreadsheet (`12KeGjyFvpZ6cSkKsuMrxmCBpBTBRzY3p21xQc5gtOBI`)

## Development

순수 HTML/CSS/JS 프로젝트 — 빌드 도구 없음. 로컬 개발 시:

```bash
# 로컬 서버 실행
cd /Users/kayen/dev/ane1235.github.io
python3 -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

배포는 `main` 브랜치 push → GitHub Pages 자동 반영.

## Architecture

### JS 로드 순서 (index.html에 명시, 순서 변경 금지)

```
config.js → data.js → utils.js → colleagues.js → state.js → nav.js → view-overview.js → view-session.js → view-mypage.js
```

### 모듈 역할

| 파일 | 역할 |
|---|---|
| `config.js` | Apps Script 웹앱 URL (API_URL 전역 상수) |
| `data.js` | 학술대회 프로그램 데이터 (APP_DATA 객체, Self-Describing 구조화 데이터) |
| `utils.js` | API 호출 헬퍼 (callApi, callApiPost), HTML escape, 유틸리티 |
| `colleagues.js` | 동료 수강자 선택 데이터 polling 및 레이블 렌더링 |
| `state.js` | 전역 상태(state 객체), localStorage 기반 로그인 세션 유지, 선택 토글 |
| `nav.js` | 드롭다운 메뉴 빌드, 뷰 라우터 (showView) |
| `view-overview.js` | 메인 일정 개요 렌더링 |
| `view-session.js` | 개별 세션 상세 렌더링 + 강좌 선택 UI |
| `view-mypage.js` | 내 선택 강좌 목록 렌더링 |

### 데이터 흐름

1. **로그인:** 이름+사번 → Apps Script `handleLogin` → ANE 탭 대조 → localStorage에 세션 저장
2. **프로그램 데이터:** `data.js`에 정적 임베딩 (APP_DATA 객체) — API 호출 불필요
3. **강좌 선택:** 선택 토글 → Apps Script `saveSelections` → Spreadsheet Selections 탭 저장
4. **동료 수강자:** colleagues.js가 주기적 polling으로 동료 선택 데이터 갱신

### API 통신

- GET: `callApi(params)` — URL query string 방식
- POST: `callApiPost(body)` — `Content-Type: text/plain`로 CORS preflight 회피
- Apps Script 웹앱 URL은 `config.js`의 `API_URL`에 정의

## Key Constraints

- **CATS명단 시트 사용 금지** — 오로지 KSCTVA26 시트만 사용
- `var` 키워드 사용 (ES5 호환 유지, `let`/`const` 사용하지 않음)
- 모든 JS는 전역 스코프 함수 — 모듈 시스템 없음
- Tailwind CSS는 CDN 방식 (`cdn.tailwindcss.com`), 커스텀 스타일은 `css/style.css`

## Directory Structure

- `js/` — 프론트엔드 JavaScript (9개 파일)
- `css/` — 스타일시트
- `assets/` — 이미지
- `resources/` — 학회 프로그램 HTML 버전 및 이전 브랜치 아카이브
- `olds/` — 이전 버전 개별 세션 HTML 파일 (사용하지 않음)
- `claude_doc/` — 인수인계 보고서 및 세션 기록
