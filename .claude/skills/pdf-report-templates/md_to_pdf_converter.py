"""
md_to_pdf_converter.py — Markdown → PDF 변환 파서
==================================================
버전: v1.1 (2026-03-06)

핵심 원칙:
  ★ MD 파일이 Single Source of Truth (SSOT)이다.
  ★ PDF는 반드시 MD 파일을 읽어서 변환한다.
  ★ PDF 콘텐츠를 독립적으로 생성하지 않는다.

v1.1 변경사항:
  - 하드코딩 경로 제거 → 동적 환경 감지 + HOME 기반 경로 사용
  - _append_image(): 세션별 동적 경로 탐색
  - _load_template_module(): Chat/Cowork 양쪽 호환 경로 탐색

아키텍처: MD → IR(중간 표현) → story(KrGov 또는 USDoD)

사용법:
    from md_to_pdf_converter import convert_md_to_pdf

    # KrGov 양식으로 변환
    convert_md_to_pdf("report.md", "report.pdf", template="KrGov",
                      title="보고서 제목", footer_source="출처 정보")

    # USDoD 양식으로 변환
    convert_md_to_pdf("report.md", "report.pdf", template="USDoD",
                      title="REPORT TITLE",
                      header_right="UNCLASSIFIED // FOR OFFICIAL USE",
                      footer_left="출처 정보")
"""

import re
import os
import sys
import importlib

# ============================================================
# 유틸: 한글 감지
# ============================================================

def _has_korean(text):
    """텍스트에 한글이 포함되어 있는지 검사한다."""
    return bool(re.search(r'[\uac00-\ud7af\u3130-\u318f]', text))


# ============================================================
# 유틸: MD 인라인 마크업 → ReportLab HTML
# ============================================================

def _md_inline_to_html(text):
    """MD 인라인 마크업을 ReportLab Paragraph용 HTML 태그로 변환한다.

    변환 대상:
    - **bold** → <b>bold</b>
    - *italic* → <i>italic</i>
    - `code` → <font face="Courier">code</font>
    - [text](url) → text (PDF에서 하이퍼링크는 비실용적이므로 텍스트만 유지)
    """
    # & 이스케이프 (다른 변환 전에 먼저 수행)
    text = re.sub(r'&(?!amp;|lt;|gt;|quot;|apos;|#)', '&amp;', text)
    # < > 이스케이프 (HTML 태그로 오인 방지, 단 이후 삽입할 태그와 충돌 방지)
    text = text.replace('<', '&lt;').replace('>', '&gt;')
    # bold (**text** 또는 __text__)
    text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
    text = re.sub(r'__(.+?)__', r'<b>\1</b>', text)
    # italic (*text* 또는 _text_) — bold 처리 후 실행
    text = re.sub(r'\*(.+?)\*', r'<i>\1</i>', text)
    text = re.sub(r'(?<!\w)_(.+?)_(?!\w)', r'<i>\1</i>', text)
    # inline code
    text = re.sub(r'`(.+?)`', r'<font face="Courier">\1</font>', text)
    # links: [text](url) → text
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
    return text


# ============================================================
# 1단계: MD → IR (Intermediate Representation)
# ============================================================

def _detect_heading_level(line):
    """MD 제목 레벨을 반환한다. 제목이 아니면 0."""
    match = re.match(r'^(#{1,6})\s+', line)
    return len(match.group(1)) if match else 0


def _parse_table_block(lines, start_idx):
    """테이블 블록을 파싱하여 2D 리스트와 종료 인덱스를 반환한다."""
    rows = []
    i = start_idx
    while i < len(lines) and lines[i].strip().startswith('|'):
        line = lines[i].strip()
        # 구분선 (|---|---| 패턴) 건너뛰기
        if re.match(r'^\|[\s\-:]+\|', line):
            i += 1
            continue
        # 셀 파싱
        cells = [c.strip() for c in line.split('|')]
        # 앞뒤 빈 문자열 제거
        if cells and cells[0] == '':
            cells = cells[1:]
        if cells and cells[-1] == '':
            cells = cells[:-1]
        if cells:
            rows.append(cells)
        i += 1
    return rows, i


def _parse_blockquote_block(lines, start_idx):
    """블록인용을 파싱한다. Analyst Note 여부를 자동 감지한다.

    Returns:
        (is_analyst_note, title, content_lines, end_idx)
    """
    first_line = lines[start_idx].lstrip('> ').strip()
    is_analyst = '📌' in first_line

    title = "Analyst Note"
    if is_analyst:
        # '📌 **Analyst Note**' 또는 '📌 Analyst Note' 패턴에서 제목 추출
        title_match = re.match(r'📌\s*\*?\*?(.+?)\*?\*?\s*$', first_line)
        if title_match:
            title = title_match.group(1).strip('* ')

    content_lines = []
    i = start_idx + 1 if is_analyst else start_idx

    # > 접두사가 계속되는 동안 수집
    while i < len(lines):
        line = lines[i]
        if line.startswith('>'):
            content = line.lstrip('>').strip()
            if content:
                content_lines.append(content)
            i += 1
        else:
            break

    # 비-Analyst Note인 경우 첫 줄도 포함
    if not is_analyst:
        first_content = first_line
        if first_content and first_content not in content_lines:
            content_lines.insert(0, first_content)

    return is_analyst, title, content_lines, i


def _parse_metadata_block(lines, start_idx):
    """메타데이터 블록을 파싱한다. **키:** 값 | **키:** 값 형태."""
    fields = []
    i = start_idx
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            break
        # **출처:** 값 | **저자:** 값 형태 파싱
        # 두 가지 패턴 지원: **키:** 값 (콜론 내부) 또는 **키**: 값 (콜론 외부)
        pairs = re.findall(r'\*\*([^*:：]+)[:：]\*\*\s*([^|]+?)(?:\||$)', line)
        if not pairs:
            pairs = re.findall(r'\*\*([^*]+)\*\*\s*[:：]\s*([^|*]+)', line)
        for label, value in pairs:
            fields.append((label.strip(), value.strip()))
        if not pairs:
            # 일반 라벨: 값 형태 시도
            match = re.match(r'^([^:：\n]{1,20})[:：]\s*(.+)', line)
            if match and not line.startswith('#'):
                fields.append((match.group(1).strip(), match.group(2).strip()))
            else:
                break  # 메타데이터 영역 종료
        i += 1
    return fields, i


def parse_md(md_text):
    """Markdown 텍스트를 중간 표현(IR) 리스트로 변환한다.

    IR 노드 타입:
    - metadata: {"type": "metadata", "fields": [(label, value), ...]}
    - title: {"type": "title", "text": "..."}
    - h1: {"type": "h1", "text": "..."}  (## 레벨 → 대분류)
    - h2: {"type": "h2", "text": "..."}  (### 레벨 → 중분류)
    - h3: {"type": "h3", "text": "..."}  (#### 레벨 → 소분류)
    - body: {"type": "body", "text": "..."}
    - bullet1: {"type": "bullet1", "text": "..."}
    - bullet2: {"type": "bullet2", "text": "..."}
    - analyst_note: {"type": "analyst_note", "title": "...", "lines": [...]}
    - table: {"type": "table", "rows": [[...], ...]}
    - image: {"type": "image", "path": "...", "caption": "..."}
    - ref: {"type": "ref", "text": "..."}
    - spacer: {"type": "spacer", "height": N}
    """
    lines = md_text.split('\n')
    ir_list = []
    i = 0
    in_ref_section = False
    in_code_block = False
    code_buffer = []
    metadata_parsed = False

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # --- YAML frontmatter 건너뛰기 ---
        if i == 0 and stripped == '---':
            i += 1
            while i < len(lines) and lines[i].strip() != '---':
                i += 1
            i += 1  # 닫는 --- 건너뛰기
            continue

        # --- 코드 블록 처리 ---
        if stripped.startswith('```'):
            if in_code_block:
                code_text = '\n'.join(code_buffer)
                if code_text.strip():
                    ir_list.append({"type": "body", "text": code_text})
                code_buffer = []
                in_code_block = False
            else:
                in_code_block = True
            i += 1
            continue

        if in_code_block:
            code_buffer.append(stripped)
            i += 1
            continue

        # --- 빈 줄 ---
        if not stripped:
            if ir_list and ir_list[-1].get("type") != "spacer":
                ir_list.append({"type": "spacer", "height": 3})
            i += 1
            continue

        # --- 수평선 (--- 또는 ===) ---
        if re.match(r'^[-=]{3,}\s*$', stripped):
            ir_list.append({"type": "spacer", "height": 5})
            i += 1
            continue

        # --- 메타데이터 블록 감지 (문서 상단, **출처:** 패턴) ---
        if not metadata_parsed and re.match(r'^\*\*[^*]+[:：]\*\*', stripped):
            fields, i = _parse_metadata_block(lines, i)
            if fields:
                ir_list.append({"type": "metadata", "fields": fields})
                metadata_parsed = True
            continue

        # --- 블록인용 (Analyst Note 포함) ---
        if stripped.startswith('>'):
            is_analyst, bq_title, bq_lines, i = _parse_blockquote_block(lines, i)
            if is_analyst and bq_lines:
                ir_list.append({
                    "type": "analyst_note",
                    "title": bq_title,
                    "lines": [_md_inline_to_html(l) for l in bq_lines]
                })
            elif bq_lines:
                # 일반 블록인용 → body로 처리
                for bl in bq_lines:
                    ir_list.append({"type": "body", "text": _md_inline_to_html(bl)})
            continue

        # --- 이미지 ---
        img_match = re.match(r'!\[([^\]]*)\]\(([^\)]+)\)', stripped)
        if img_match:
            ir_list.append({
                "type": "image",
                "caption": img_match.group(1),
                "path": img_match.group(2)
            })
            i += 1
            continue

        # --- 테이블 ---
        if stripped.startswith('|') and '|' in stripped[1:]:
            rows, i = _parse_table_block(lines, i)
            if rows:
                ir_list.append({"type": "table", "rows": rows})
            continue

        # --- 제목 ---
        heading_level = _detect_heading_level(stripped)
        if heading_level > 0:
            text = re.sub(r'^#{1,6}\s+', '', stripped)
            text = _md_inline_to_html(text)

            # 참고문헌 섹션 감지
            if re.search(r'참고|참조|References?|Sources?|Bibliography', text, re.IGNORECASE):
                in_ref_section = True
            else:
                in_ref_section = False

            if heading_level == 1:
                ir_list.append({"type": "title", "text": text})
            elif heading_level == 2:
                ir_list.append({"type": "h1", "text": text})
            elif heading_level == 3:
                ir_list.append({"type": "h2", "text": text})
            elif heading_level >= 4:
                ir_list.append({"type": "h3", "text": text})

            i += 1
            continue

        # --- 불릿 리스트 ---
        bullet_match = re.match(r'^(\s*)([-•*]|\d+\.)\s+(.+)', line)
        if bullet_match:
            indent = len(bullet_match.group(1))
            text = _md_inline_to_html(bullet_match.group(3))

            if in_ref_section:
                ir_list.append({"type": "ref", "text": text})
            elif indent >= 2:
                ir_list.append({"type": "bullet2", "text": text})
            else:
                ir_list.append({"type": "bullet1", "text": text})
            i += 1
            continue

        # --- 참고문헌 섹션의 일반 텍스트 ---
        if in_ref_section:
            ir_list.append({"type": "ref", "text": _md_inline_to_html(stripped)})
            i += 1
            continue

        # --- 본문 단락 (연속 텍스트 줄을 합침) ---
        para_lines = [stripped]
        i += 1
        while i < len(lines):
            next_line = lines[i].strip()
            if (not next_line or
                next_line.startswith('#') or
                next_line.startswith('|') or
                next_line.startswith('>') or
                next_line.startswith('```') or
                re.match(r'^(\s*)[-•*]\s+', lines[i]) or
                re.match(r'^(\s*)\d+\.\s+', lines[i]) or
                re.match(r'^!\[', next_line) or
                re.match(r'^[-=]{3,}$', next_line)):
                break
            para_lines.append(next_line)
            i += 1

        text = ' '.join(para_lines)
        ir_list.append({"type": "body", "text": _md_inline_to_html(text)})

    return ir_list


# ============================================================
# 2단계-A: IR → KrGov story
# ============================================================

def ir_to_krgov_story(ir_list, mod):
    """IR 리스트를 KrGov 템플릿의 story 리스트로 변환한다.

    Args:
        ir_list: parse_md()의 반환값
        mod: import된 pdf_template_KrGov_1_0 모듈

    Returns:
        list: reportlab Flowable 리스트
    """
    story = []

    for node in ir_list:
        t = node["type"]

        if t == "metadata":
            kwargs = {}
            for label, value in node["fields"]:
                ll = label.lower()
                if '출처' in ll or 'source' in ll:
                    kwargs['source'] = value
                elif '날짜' in ll or 'date' in ll or '보도일' in ll or '정리일' in ll:
                    kwargs['date'] = value
                elif '분류' in ll or 'class' in ll:
                    kwargs['classification'] = value
                elif '문서번호' in ll or 'doc' in ll:
                    kwargs['doc_no'] = value
            story.append(mod.DocInfoTable(**kwargs))
            story.append(mod.sp(3))

        elif t == "title":
            story.append(mod.title(node["text"]))

        elif t == "h1":
            story.append(mod.sp(3))
            story.append(mod.h1(node["text"]))
            story.append(mod.sp(2))

        elif t == "h2":
            story.append(mod.h2(node["text"]))

        elif t == "h3":
            story.append(mod.h3(node["text"]))

        elif t == "body":
            story.append(mod.body(node["text"]))

        elif t == "bullet1":
            story.append(mod.bullet1(node["text"]))

        elif t == "bullet2":
            story.append(mod.bullet2(node["text"]))

        elif t == "analyst_note":
            from reportlab.platypus import Paragraph
            paras = [Paragraph(line, mod.S["body"]) for line in node["lines"]]
            box = mod.HighlightBox(
                node.get("title", "Analyst Note"),
                paras, preset="gold"
            )
            story.append(mod.sp(2))
            story.append(box)
            story.append(mod.sp(2))

        elif t == "table":
            rows = node["rows"]
            if len(rows) >= 2:
                table_data = []
                table_data.append([mod.th(cell) for cell in rows[0]])
                for row in rows[1:]:
                    table_data.append([mod.td(cell) for cell in row])
                n = len(rows[0])
                ratios = [1.0 / n] * n
                story.append(mod.sp(2))
                story.append(mod.make_table(table_data, col_ratios=ratios))
                story.append(mod.sp(2))

        elif t == "image":
            _append_image(story, node, mod)

        elif t == "ref":
            story.append(mod.ref(node["text"]))

        elif t == "spacer":
            story.append(mod.sp(node.get("height", 3)))

    return story


# ============================================================
# 2단계-B: IR → USDoD story
# ============================================================

def ir_to_usdod_story(ir_list, mod):
    """IR 리스트를 USDoD 템플릿의 story 리스트로 변환한다.

    Args:
        ir_list: parse_md()의 반환값
        mod: import된 pdf_template_USDoD_v3 모듈

    Returns:
        list: reportlab Flowable 리스트
    """
    story = []

    for node in ir_list:
        t = node["type"]

        if t == "metadata":
            fields = [(label, value) for label, value in node["fields"]]
            story.append(mod.MetadataBlock(fields))
            story.append(mod.sp(4))

        elif t == "title":
            from reportlab.platypus import Paragraph
            style_key = "title" if "title" in mod.S else "h1"
            story.append(Paragraph(node["text"], mod.S[style_key]))
            story.append(mod.sp(4))

        elif t == "h1":
            text = node["text"]
            story.append(mod.sp(3))
            story.append(mod.SectionHeader(text, font_korean=_has_korean(text)))
            story.append(mod.sp(2))

        elif t == "h2":
            text = node["text"]
            story.append(mod.SubSection(text, font_korean=_has_korean(text)))

        elif t == "h3":
            text = node["text"]
            fn = mod.body_kr if _has_korean(text) else mod.body
            story.append(fn(f"<b>{text}</b>"))

        elif t == "body":
            text = node["text"]
            fn = mod.body_kr if _has_korean(text) else mod.body
            story.append(fn(text))

        elif t == "bullet1":
            text = node["text"]
            fn = mod.bullet1_kr if _has_korean(text) else mod.bullet1
            story.append(fn(f"• {text}"))

        elif t == "bullet2":
            text = node["text"]
            fn = mod.bullet2_kr if _has_korean(text) else mod.bullet2
            story.append(fn(f"- {text}"))

        elif t == "analyst_note":
            from reportlab.platypus import Paragraph
            paras = [Paragraph(line, mod.S["an_text"]) for line in node["lines"]]
            story.append(mod.sp(2))
            story.append(mod.AnalystNote(paras))
            story.append(mod.sp(2))

        elif t == "table":
            rows = node["rows"]
            if len(rows) >= 2:
                all_text = ' '.join(' '.join(row) for row in rows)
                kr = _has_korean(all_text)
                _th = mod.th_kr if kr else mod.th
                _td = mod.td_kr if kr else mod.td
                _mt = mod.make_table_kr if kr else mod.make_table

                table_data = []
                table_data.append([_th(cell) for cell in rows[0]])
                for row in rows[1:]:
                    table_data.append([_td(cell) for cell in row])
                n = len(rows[0])
                ratios = [1.0 / n] * n
                story.append(mod.sp(2))
                story.append(_mt(table_data, col_ratios=ratios))
                story.append(mod.sp(2))

        elif t == "image":
            _append_image(story, node, mod)

        elif t == "ref":
            text = node["text"]
            fn = mod.ref_kr if _has_korean(text) else mod.ref
            story.append(fn(text))

        elif t == "spacer":
            story.append(mod.sp(node.get("height", 3)))

    return story


# ============================================================
# 이미지 삽입 헬퍼
# ============================================================

def _append_image(story, node, mod):
    """이미지 노드를 story에 추가한다. 파일이 존재하지 않으면 경고 텍스트를 삽입한다.

    v1.1: 하드코딩 경로 제거, 동적 HOME 기반 탐색으로 변경.
    """
    path = node["path"]
    if not os.path.exists(path):
        # 상대경로인 경우 절대경로로 변환 시도
        if not os.path.isabs(path):
            # 동적 경로 탐색 — 하드코딩 세션 경로 제거
            _home = os.environ.get('HOME', '.')
            candidates = [
                os.path.join(_home, "images", os.path.basename(path)),
                os.path.join(_home, "work", path),
                os.path.join(_home, path),
                os.path.join(os.getcwd(), "images", os.path.basename(path)),
                os.path.join(os.getcwd(), path),
            ]
            for c in candidates:
                if os.path.exists(c):
                    path = c
                    break

    if os.path.exists(path):
        try:
            from reportlab.platypus import Image as RLImage
            from reportlab.lib.pagesizes import A4
            from reportlab.lib.units import mm
            max_w = A4[0] - 45 * mm
            img = RLImage(path, width=max_w, height=None)
            img._restrictSize(max_w, A4[1] * 0.4)
            story.append(mod.sp(2))
            story.append(img)
            if node.get("caption"):
                from reportlab.platypus import Paragraph
                cap_style = mod.S.get("caption", mod.S.get("ref", mod.S["body"]))
                story.append(Paragraph(node["caption"], cap_style))
            story.append(mod.sp(2))
        except Exception as e:
            fn = getattr(mod, 'body_kr', mod.body) if hasattr(mod, 'body_kr') else mod.body
            story.append(fn(f"[이미지 로드 실패: {path} — {e}]"))
    else:
        fn = getattr(mod, 'body_kr', mod.body) if hasattr(mod, 'body_kr') else mod.body
        story.append(fn(f"[이미지 파일 없음: {node['path']}]"))


# ============================================================
# 3단계: 통합 변환 함수
# ============================================================

def convert_md_to_pdf(md_path, pdf_path, template="KrGov", **kwargs):
    """MD 파일을 읽어서 지정된 템플릿으로 PDF를 생성한다.

    ★ 이 함수가 유일한 MD→PDF 변환 진입점이다.
    ★ PDF 콘텐츠를 독립적으로 생성하지 않고 반드시 MD 파일을 읽어서 변환한다.

    Args:
        md_path (str): 입력 MD 파일 경로 (SSOT)
        pdf_path (str): 출력 PDF 파일 경로
        template (str): "KrGov" 또는 "USDoD"
        **kwargs: build_pdf()에 전달할 추가 인자
            KrGov용: title, header_text, footer_source, copy_to_outputs
            USDoD용: title, header_right, footer_left, copy_to_outputs

    Returns:
        str: 생성된 PDF 파일 경로

    Raises:
        FileNotFoundError: MD 파일이 존재하지 않을 때
        ValueError: 지원하지 않는 템플릿일 때
    """
    # ── MD 파일 읽기 ──
    if not os.path.exists(md_path):
        raise FileNotFoundError(f"MD 파일을 찾을 수 없습니다: {md_path}")

    with open(md_path, 'r', encoding='utf-8') as f:
        md_text = f.read()

    print(f"📖 MD 파일 로드: {md_path} ({len(md_text):,} chars)")

    # ── 1단계: MD → IR ──
    ir_list = parse_md(md_text)
    print(f"📋 IR 노드 {len(ir_list)}개 파싱 완료")

    # ── 2단계: IR → story (템플릿별 분기) ──
    template_lower = template.strip().lower()

    if template_lower in ("krgov", "kr_gov", "한국공문서", "korean"):
        return _build_krgov_pdf(ir_list, pdf_path, **kwargs)
    elif template_lower in ("usdod", "us_dod", "dod", "dod양식", "military"):
        return _build_usdod_pdf(ir_list, pdf_path, **kwargs)
    else:
        raise ValueError(
            f"지원하지 않는 템플릿: '{template}'. "
            f"'KrGov' 또는 'USDoD' 중 하나를 지정하세요."
        )


def _build_krgov_pdf(ir_list, pdf_path, **kwargs):
    """KrGov 템플릿으로 PDF를 생성한다."""
    # 템플릿 모듈 로드
    mod = _load_template_module("pdf_template_KrGov_1_0")

    story = ir_to_krgov_story(ir_list, mod)
    print(f"📑 KrGov story {len(story)}개 Flowable 생성")

    build_kwargs = {
        "story": story,
        "path": pdf_path,
        "title": kwargs.get("title", "보고서"),
        "header_text": kwargs.get("header_text", ""),
        "footer_source": kwargs.get("footer_source", ""),
        "copy_to_outputs": kwargs.get("copy_to_outputs", True),
    }
    result = mod.build_pdf(**build_kwargs)
    print(f"✅ KrGov PDF 생성 완료: {result}")
    return result


def _build_usdod_pdf(ir_list, pdf_path, **kwargs):
    """USDoD 템플릿으로 PDF를 생성한다."""
    mod = _load_template_module("pdf_template_USDoD_v3")

    story = ir_to_usdod_story(ir_list, mod)
    print(f"📑 USDoD story {len(story)}개 Flowable 생성")

    build_kwargs = {
        "story": story,
        "path": pdf_path,
        "title": kwargs.get("title", "REPORT"),
        "header_right": kwargs.get("header_right", "UNCLASSIFIED // FOR OFFICIAL USE"),
        "footer_left": kwargs.get("footer_left", ""),
        "copy_to_outputs": kwargs.get("copy_to_outputs", True),
    }
    result = mod.build_pdf(**build_kwargs)
    print(f"✅ USDoD PDF 생성 완료: {result}")
    return result


def _load_template_module(module_name):
    """템플릿 모듈을 동적으로 import한다.

    이미 로드된 모듈이 있으면 재사용한다.
    없으면 스킬 폴더 또는 작업 디렉토리에서 탐색한다.

    v1.1: 하드코딩 세션 경로 제거, 환경 감지 기반 동적 탐색으로 변경.
    """
    if module_name in sys.modules:
        return sys.modules[module_name]

    # 동적 경로 계산 — 하드코딩 경로 제거
    _home = os.environ.get('HOME', '.')

    # 탐색 경로 후보
    search_dirs = [
        os.path.dirname(os.path.abspath(__file__)),  # 파서와 같은 폴더
        _home,                                        # HOME 디렉토리
        os.path.join(_home, "work"),                  # HOME/work (Cowork 작업 폴더)
        os.getcwd(),                                   # 현재 작업 디렉토리
    ]

    # Chat 서버 환경: /mnt/skills/ 경로 추가
    _skill_dir = "/mnt/skills/user/pdf-report-templates"
    if os.path.isdir(_skill_dir):
        search_dirs.insert(0, _skill_dir)

    for d in search_dirs:
        if d and os.path.isdir(d) and d not in sys.path:
            sys.path.insert(0, d)

    try:
        return importlib.import_module(module_name)
    except ImportError:
        raise ImportError(
            f"{module_name}.py를 import할 수 없습니다. "
            f"먼저 pdf-report-templates 스킬 폴더에서 작업 디렉토리로 복사하세요."
        )
