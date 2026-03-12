#!/usr/bin/env python3
"""
4link/report 폴더의 마크다운 파일에 permalink가 없으면 자동으로 추가합니다.
permalink 형식: /4link/report/YYYYMMDD-{파일명 해시 앞 6자리}/
"""

import os
import re
import hashlib

REPORT_DIR = "4link/report"
PERMALINK_PREFIX = "/4link/report/"


def parse_frontmatter(content):
    """YAML front matter 파싱. (---...--- 블록)"""
    if not content.startswith("---"):
        return None, None, content
    end = content.find("---", 3)
    if end == -1:
        return None, None, content
    frontmatter_raw = content[3:end]
    body = content[end + 3:]
    return frontmatter_raw, end, body


def has_permalink(frontmatter_raw):
    return re.search(r'^\s*permalink\s*:', frontmatter_raw, re.MULTILINE) is not None


def make_permalink(filename):
    """파일명에서 날짜 추출 + 해시 6자리로 permalink 생성."""
    date_match = re.match(r'(\d{4}-\d{2}-\d{2})', filename)
    date_str = date_match.group(1).replace('-', '') if date_match else 'report'
    file_hash = hashlib.md5(filename.encode('utf-8')).hexdigest()[:6]
    return f"{PERMALINK_PREFIX}{date_str}-{file_hash}/"


def inject_permalink(frontmatter_raw, permalink):
    """front matter 첫 줄(---)  바로 다음에 permalink: 삽입."""
    lines = frontmatter_raw.split('\n')
    # layout: 줄 바로 다음에 삽입 (있으면), 없으면 맨 앞에 삽입
    insert_idx = 1
    for i, line in enumerate(lines):
        if line.strip().startswith('layout:'):
            insert_idx = i + 1
            break
    lines.insert(insert_idx, f"permalink: {permalink}")
    return '\n'.join(lines)


def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    frontmatter_raw, end_idx, body = parse_frontmatter(content)
    if frontmatter_raw is None:
        print(f"  SKIP (no front matter): {filepath}")
        return False

    if has_permalink(frontmatter_raw):
        print(f"  SKIP (already has permalink): {os.path.basename(filepath)}")
        return False

    filename = os.path.basename(filepath)
    permalink = make_permalink(filename)
    new_frontmatter = inject_permalink(frontmatter_raw, permalink)
    new_content = f"---{new_frontmatter}---{body}"

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"  ADDED permalink {permalink} → {filename}")
    return True


def main():
    changed = False
    for filename in sorted(os.listdir(REPORT_DIR)):
        if not filename.endswith('.md'):
            continue
        if filename == 'index.md':
            continue
        filepath = os.path.join(REPORT_DIR, filename)
        if process_file(filepath):
            changed = True

    if changed:
        print("\n✅ permalink 자동 추가 완료.")
    else:
        print("\n✅ 추가할 파일 없음 (모두 permalink 존재).")


if __name__ == "__main__":
    main()
