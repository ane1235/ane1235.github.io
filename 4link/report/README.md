# 4Link Report Jekyll 블로그

## 📌 개요

`4link/report` 폴더는 Jekyll을 사용한 독립적인 블로그 프로젝트입니다.
- **테마**: jekyll-theme-modernist (깔끔한 회색/검은색 디자인)
- **용도**: 마크다운 문서를 블로그 형식으로 렌더링
- **실행**: 로컬 개발 환경에서만 실행

---

## 🚀 로컬에서 실행하기

### 1단계: 폴더 이동
```bash
cd /home/user/ane1235.github.io/4link/report
```

### 2단계: Ruby 의존성 설치
```bash
bundle install
```

### 3단계: Jekyll 서버 실행
```bash
bundle exec jekyll serve
```

### 4단계: 브라우저에서 확인
```
http://localhost:4000/4link/report/
```

---

## 📁 폴더 구조

```
4link/report/
├── _config.yml                                    # Jekyll 설정
├── _layouts/
│   ├── default.html                             # 기본 레이아웃
│   └── post.html                                # 포스트 레이아웃
├── Gemfile                                       # Ruby 의존성
├── index.md                                      # 블로그 메인 페이지
├── [markdown files]                             # 문서 파일들
└── README.md                                     # 이 파일
```

---

## 📝 마크다운 파일 작성 규칙

모든 마크다운 파일의 상단에 YAML front matter를 포함해야 합니다:

```yaml
---
title: "문서 제목"
author: "작성자"
date: 2026-03-13
tags:
  - 태그1
  - 태그2
---

# 문서 제목

문서 내용...
```

### 필수 속성:
- `title`: 문서 제목
- `date`: 발행 날짜 (YYYY-MM-DD 형식)

### 선택 속성:
- `author`: 작성자
- `tags`: 분류 태그
- `language`: 언어 코드 (예: KR, EN)

---

## 🔗 문서 링크 작성

마크다운 파일에서 다른 문서로 링크할 때:

```markdown
[링크 텍스트](파일명_without_extension/)
```

예:
```markdown
[빈크리스틴 해설](2026-03-13_항암제_빈크리스틴_해설/)
```

---

## 🎨 커스터마이징

### CSS 수정
- `_layouts/default.html`의 `<style>` 섹션 수정

### 레이아웃 추가
- `_layouts/` 폴더에 새 HTML 파일 생성
- YAML front matter에서 `layout: filename` 지정

### 테마 변경
- `_config.yml`의 `theme: jekyll-theme-modernist` 변경

---

## 📚 참고

- [Jekyll 공식 문서](https://jekyllrb.com/)
- [jekyll-theme-modernist](https://github.com/pages-themes/modernist)
- [Markdown 문법](https://www.markdownguide.org/)

---

## ⚠️ 주의사항

- GitHub Pages 배포는 이 설정으로 지원하지 않습니다 (로컬 전용)
- 파일명 변경 시 다른 문서의 링크도 업데이트 필요
- `index.md`를 삭제하면 메인 페이지가 표시되지 않습니다
