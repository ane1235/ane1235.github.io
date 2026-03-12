---
name: blog-publish
description: >
  마크다운 문서를 ane1235.github.io/blog 에 자동으로 publish하는 스킬.
  다음 맥락에서 반드시 이 스킬을 사용한다:
  - "publish", "블로그에 올려", "blog에 게시", "공개해줘" 등의 키워드가 포함된 요청
  - "ane1235.github.io/blog" 경로로 publish하라는 요청
  - 생성한 마크다운 문서를 웹에 공개하라는 요청
  - "블로그 배포", "blog deploy", "문서 게시" 등의 표현이 포함된 요청
---

# Blog Publish 스킬 v1.0

마크다운 문서를 `https://ane1235.github.io/blog/` 에 자동으로 publish하는 스킬이다.

**버전:** v1.0 (2026-03-12)
**레퍼런스:** `references/blog_config.md` 참조

```
파이프라인: 파일 준비 → permalink 주입 → blog repo 커밋 → push → URL 반환
```

---

## I. 전제 조건

- blog repo 경로: `~/blog/` (GitHub: `ane1235/blog`)
- 접속 URL: `https://ane1235.github.io/blog/`
- 테마: jekyll-theme-modernist
- GitHub Pages 활성화 완료

---

## II. 파이프라인 (5단계)

### 1단계: 대상 파일 확인

- 사용자가 파일 경로를 지정한 경우 → 해당 파일 사용
- 사용자가 "방금 만든 문서"라고 한 경우 → 현재 세션에서 생성된 .md 파일 탐색
- 파일이 여러 개인 경우 → 사용자에게 확인

### 2단계: YAML front matter 보완

대상 파일의 front matter를 확인하고 보완한다.

**필수 필드 자동 추가:**
```yaml
---
layout: report
title: "(파일 내 첫 번째 # 제목에서 추출)"
permalink: /(YYYYMMDD)-(파일명 MD5 해시 앞 6자리)/
date: (파일명에서 YYYY-MM-DD 추출, 없으면 오늘 날짜)
---
```

**규칙:**
- front matter가 아예 없으면 → 전부 자동 생성
- front matter가 있지만 permalink 없으면 → permalink만 추가
- layout이 없으면 → `layout: report` 추가
- permalink가 이미 있으면 → 그대로 유지 (변경하지 않음)
- **permalink에 `/blog/` prefix를 넣지 않는다** — `baseurl: "/blog"`가 이미 처리함

**permalink 생성 로직 (Python):**
```python
import hashlib, re
filename = "2026-03-14_문서이름.md"
date_match = re.match(r'(\d{4}-\d{2}-\d{2})', filename)
date_str = date_match.group(1).replace('-', '') if date_match else 'report'
file_hash = hashlib.md5(filename.encode('utf-8')).hexdigest()[:6]
permalink = f"/{date_str}-{file_hash}/"
# 결과: /20260314-abc123/
```

### 3단계: blog repo에 파일 복사

```bash
cp "대상파일.md" ~/blog/
```

- 파일명은 한국어 그대로 유지 (변경하지 않음)
- 이미 같은 파일명이 존재하면 사용자에게 덮어쓸지 확인

### 4단계: Git 커밋 & 푸시

```bash
cd ~/blog
git add -A
git commit -m "Publish: {문서 제목}"
git push origin main
```

### 5단계: 결과 보고

publish 완료 후 반드시 다음을 출력한다:

```
✅ Publish 완료

문서: {파일명}
제목: {title}
URL:  https://ane1235.github.io/blog{permalink}

GitHub Pages 빌드 완료 후 (1~2분) 위 URL에서 접속 가능합니다.
```

---

## III. index.md 자동 업데이트 (선택)

사용자가 "목록에도 추가해줘"라고 요청한 경우에만:
- `~/blog/index.md`의 적절한 섹션에 새 문서 링크를 추가한다
- 링크 형식: `- **[{title}]({{ site.baseurl }}{permalink})**`

사용자가 요청하지 않으면 index.md는 수정하지 않는다.

---

## IV. 주의사항

1. **permalink에 `/blog/`를 넣지 않는다** — `_config.yml`의 `baseurl: "/blog"`가 자동으로 처리함
2. **파일명을 바꾸지 않는다** — 한국어 파일명 그대로 유지
3. **기존 파일을 덮어쓰기 전에 반드시 확인** — 사용자 승인 필요
4. **push 실패 시 재시도** — 최대 4회, 지수 백오프 (2s, 4s, 8s, 16s)
5. **blog repo가 clone되어 있지 않으면** — `git clone https://github.com/ane1235/blog.git ~/blog` 실행
