"""
pdf_template_KrGov_1.0.py — [한국공문서] PDF 템플릿
=====================================================
용도: 한국 공문서 양식 PDF 보고서 생성
용지: A4 | 폰트: NanumGothic | 위계: I → 1 → 가 → (1)

v3 개정 (2026-03-06):
  - 환경 감지 + 폰트 Fallback 로직 추가 (Chat / Cowork 양쪽 지원)
  - _detect_environment(), _find_font(), _get_outputs_dir() 함수 추가
  - 하드코딩 폰트 경로 제거 → 동적 탐색으로 변경

사용법:
    from pdf_template_KrGov_1_0 import *
    story = build_content()
    build_pdf(story, path="output.pdf", title="제목")
"""

import os
import shutil
import urllib.request
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Flowable, KeepTogether, PageBreak
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ============================================================
# 환경 감지 + 폰트 동적 탐색 (v3 신규)
# ============================================================

def _detect_environment():
    """실행 환경을 감지한다. chat / cowork / unknown 중 하나를 반환."""
    if os.path.exists('/mnt/skills/'):
        return 'chat'
    elif '/sessions/' in os.environ.get('HOME', ''):
        return 'cowork'
    else:
        return 'unknown'


def _find_font(filename):
    """폰트 파일을 동적으로 탐색한다.

    탐색 순서: 시스템 경로 → 로컬 ~/.fonts → GitHub 다운로드 → DejaVu fallback
    Google Fonts 파일명 매핑: NanumGothic.ttf → NanumGothic-Regular.ttf
    """
    # Google Fonts에서의 파일명과 시스템 설치명이 다른 경우 매핑
    _NANUM_MAP = {
        "NanumGothic.ttf": "NanumGothic-Regular.ttf",
        "NanumGothicBold.ttf": "NanumGothic-Bold.ttf",
    }
    _DEJAVU_NANUM_FALLBACK = {
        "DejaVuSans.ttf": "NanumGothic.ttf",
        "DejaVuSans-Bold.ttf": "NanumGothicBold.ttf",
    }

    # 1. DejaVu 폰트 요청 시 — 시스템에 있으면 사용, 없으면 Nanum으로 대체
    if filename.startswith("DejaVu"):
        sys_path = f"/usr/share/fonts/truetype/dejavu/{filename}"
        if os.path.exists(sys_path):
            return sys_path
        nanum_name = _DEJAVU_NANUM_FALLBACK.get(filename, "NanumGothic.ttf")
        return _find_font(nanum_name)

    # 2. Nanum 폰트 — 여러 경로 후보 탐색
    dl_filename = _NANUM_MAP.get(filename, filename)
    candidates = [
        f"/usr/share/fonts/truetype/nanum/{filename}",      # apt install 결과
        f"/usr/share/fonts/truetype/nanum/{dl_filename}",    # Google Fonts 파일명
        os.path.expanduser(f"~/.fonts/nanum/{filename}"),    # 로컬 다운로드 (시스템명)
        os.path.expanduser(f"~/.fonts/nanum/{dl_filename}"), # 로컬 다운로드 (Google명)
    ]
    for path in candidates:
        if os.path.exists(path):
            return path

    # 3. 네트워크 다운로드 시도 (Cowork 환경에서 유효)
    dest = os.path.expanduser(f"~/.fonts/nanum/{dl_filename}")
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    url = f"https://github.com/google/fonts/raw/main/ofl/nanumgothic/{dl_filename}"
    try:
        urllib.request.urlretrieve(url, dest)
        if os.path.exists(dest) and os.path.getsize(dest) > 100_000:
            return dest
    except Exception:
        pass

    # 4. 최종 fallback — DejaVu (KrGov는 Nanum 전용이므로 여기까지 오면 경고)
    dejavu_fb = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    if "Bold" in filename:
        dejavu_fb = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    if os.path.exists(dejavu_fb):
        return dejavu_fb

    raise FileNotFoundError(f"폰트를 찾을 수 없음: {filename}")


def _get_outputs_dir():
    """환경에 따른 outputs 디렉토리를 반환한다."""
    env = _detect_environment()
    if env == 'chat':
        d = "/mnt/user-data/outputs"
    else:
        d = os.path.join(os.environ.get('HOME', '/tmp'), 'outputs')
    os.makedirs(d, exist_ok=True)
    return d


# ============================================================
# 폰트 등록 — 동적 탐색 기반 (v3 개정)
# ============================================================
_FONT_NAMES = {
    "NanumGothic":     "NanumGothic.ttf",
    "NanumGothicBold": "NanumGothicBold.ttf",
}
for _name, _file in _FONT_NAMES.items():
    try:
        _path = _find_font(_file)
        pdfmetrics.registerFont(TTFont(_name, _path))
    except FileNotFoundError as e:
        print(f"⚠️ 폰트 등록 실패 ({_name}): {e}")

# ============================================================
# 색상 사전 C — 14종
# ============================================================
C = {
    "navy":       HexColor("#1B3464"),   # 대분류 제목
    "blue":       HexColor("#2C5282"),   # 중분류 제목
    "gold":       HexColor("#B8860B"),   # 강조 박스 (분석)
    "red":        HexColor("#C53030"),   # 경고 박스
    "light_gray": HexColor("#F0F0F0"),   # 배경
    "dark_gray":  HexColor("#4A5568"),   # 보조 텍스트
    "white":      white,
    "black":      black,
    "gold_bg":    HexColor("#FFF8DC"),   # 금색 박스 배경
    "red_bg":     HexColor("#FFF5F5"),   # 빨간 박스 배경
    "blue_bg":    HexColor("#EBF8FF"),   # 청색 박스 배경
    "default_bg": HexColor("#F7FAFC"),   # 기본 박스 배경
    "gold_bar":   HexColor("#D4A017"),   # 금색 좌측 바
    "blue_bar":   HexColor("#2B6CB0"),   # 청색 좌측 바
}

# ============================================================
# 여백 및 들여쓰기 (mm 단위)
# ============================================================
MARGIN_L, MARGIN_R = 25*mm, 20*mm
MARGIN_T, MARGIN_B = 25*mm, 20*mm

IND0 = 0*mm      # 대분류 (I, II, ...)
IND1 = 7*mm      # 중분류·본문 (1, 2, ...)
IND2 = 14*mm     # 소분류·불릿 (가, 나, ...)
IND3 = 21*mm     # 세항 ((1), (2), ...)
IND_BODY = 7*mm  # 테이블 들여쓰기

# ============================================================
# 스타일 사전 S — 14종
# ============================================================
_base = dict(fontName="NanumGothic", leading=18)

S = {
    # --- 제목 계열 ---
    "title": ParagraphStyle(
        "title", fontSize=18, fontName="NanumGothicBold",
        textColor=C["navy"], alignment=TA_CENTER,
        spaceAfter=12*mm, leading=24,
    ),
    "h1": ParagraphStyle(
        "h1", fontSize=14, fontName="NanumGothicBold",
        textColor=C["navy"], spaceBefore=6*mm, spaceAfter=3*mm,
        leftIndent=IND0, leading=20,
    ),
    "h2": ParagraphStyle(
        "h2", fontSize=12, fontName="NanumGothicBold",
        textColor=C["blue"], spaceBefore=4*mm, spaceAfter=2*mm,
        leftIndent=IND1, leading=18,
    ),
    "h3": ParagraphStyle(
        "h3", fontSize=11, fontName="NanumGothicBold",
        textColor=C["black"], spaceBefore=3*mm, spaceAfter=1.5*mm,
        leftIndent=IND2, leading=16,
    ),
    # --- 본문 계열 ---
    "body": ParagraphStyle(
        "body", fontSize=10, leftIndent=IND1,
        alignment=TA_JUSTIFY, **_base,
    ),
    "body_ind2": ParagraphStyle(
        "body_ind2", fontSize=10, leftIndent=IND2,
        alignment=TA_JUSTIFY, **_base,
    ),
    "bullet1": ParagraphStyle(
        "bullet1", fontSize=10, leftIndent=IND2,
        bulletIndent=IND1, bulletFontSize=10,
        **_base,
    ),
    "bullet2": ParagraphStyle(
        "bullet2", fontSize=10, leftIndent=IND3,
        bulletIndent=IND2, bulletFontSize=10,
        **_base,
    ),
    # --- 특수 계열 ---
    "caption": ParagraphStyle(
        "caption", fontSize=8, textColor=C["dark_gray"],
        alignment=TA_CENTER, leading=12,
        fontName="NanumGothic",
    ),
    "footer": ParagraphStyle(
        "footer", fontSize=8, textColor=C["dark_gray"],
        fontName="NanumGothic", leading=10,
    ),
    "header": ParagraphStyle(
        "header", fontSize=8, textColor=C["navy"],
        fontName="NanumGothicBold", leading=10,
    ),
    "ref": ParagraphStyle(
        "ref", fontSize=9, textColor=C["dark_gray"],
        leftIndent=IND1, leading=14, fontName="NanumGothic",
    ),
    "th": ParagraphStyle(
        "th", fontSize=9, fontName="NanumGothicBold",
        textColor=C["white"], alignment=TA_CENTER, leading=14,
    ),
    "td": ParagraphStyle(
        "td", fontSize=9, fontName="NanumGothic",
        alignment=TA_LEFT, leading=14,
    ),
}

# ============================================================
# Flowable 클래스
# ============================================================

class SectionHeader(Flowable):
    """대분류 제목 바 — Navy 배경에 흰색 텍스트"""
    def __init__(self, text, width=None):
        super().__init__()
        self.text = text
        self._width = width

    def wrap(self, availWidth, availHeight):
        self._width = self._width or availWidth
        return self._width, 10*mm

    def draw(self):
        # 배경 바
        self.canv.setFillColor(C["navy"])
        self.canv.rect(0, 0, self._width, 10*mm, fill=1, stroke=0)
        # 텍스트
        self.canv.setFillColor(C["white"])
        self.canv.setFont("NanumGothicBold", 13)
        self.canv.drawString(3*mm, 2.5*mm, self.text)


class HighlightBox(Flowable):
    """강조 박스 — 4가지 프리셋: gold, red, blue, default"""
    PRESETS = {
        "gold":    {"bg": C["gold_bg"],    "bar": C["gold_bar"],  "title_color": C["gold"]},
        "red":     {"bg": C["red_bg"],     "bar": C["red"],       "title_color": C["red"]},
        "blue":    {"bg": C["blue_bg"],    "bar": C["blue_bar"],  "title_color": C["blue"]},
        "default": {"bg": C["default_bg"], "bar": C["dark_gray"], "title_color": C["dark_gray"]},
    }

    def __init__(self, title, content_paragraphs, preset="gold", width=None):
        super().__init__()
        self.title = title
        self.content_paragraphs = content_paragraphs  # list of Paragraph
        self.preset = self.PRESETS.get(preset, self.PRESETS["default"])
        self._width = width
        self._height = 0

    def wrap(self, availWidth, availHeight):
        self._width = self._width or availWidth
        inner_w = self._width - 8*mm  # 좌측바(3mm) + 패딩(5mm)
        h = 8*mm  # 제목 영역
        for p in self.content_paragraphs:
            pw, ph = p.wrap(inner_w, availHeight)
            h += ph + 1*mm
        self._height = h + 4*mm
        return self._width, self._height

    def draw(self):
        # 배경
        self.canv.setFillColor(self.preset["bg"])
        self.canv.rect(0, 0, self._width, self._height, fill=1, stroke=0)
        # 좌측 바
        self.canv.setFillColor(self.preset["bar"])
        self.canv.rect(0, 0, 3*mm, self._height, fill=1, stroke=0)
        # 제목
        self.canv.setFillColor(self.preset["title_color"])
        self.canv.setFont("NanumGothicBold", 10)
        self.canv.drawString(5*mm, self._height - 6*mm, self.title)
        # 내용
        y = self._height - 10*mm
        inner_w = self._width - 8*mm
        for p in self.content_paragraphs:
            pw, ph = p.wrap(inner_w, 9999)
            p.drawOn(self.canv, 5*mm, y - ph)
            y -= ph + 1*mm


class DocInfoTable(Flowable):
    """문서 기본정보 테이블 — 문서번호, 작성일, 분류, 원본출처"""
    def __init__(self, doc_no="", date="", classification="", source="", width=None):
        super().__init__()
        self.data = [
            ["문서번호", doc_no, "작 성 일", date],
            ["분    류", classification, "원본출처", source],
        ]
        self._width = width

    def wrap(self, availWidth, availHeight):
        self._width = self._width or availWidth
        return self._width, 18*mm

    def draw(self):
        w = self._width
        col_w = [w*0.12, w*0.38, w*0.12, w*0.38]
        t = Table(self.data, colWidths=col_w, rowHeights=[8*mm, 8*mm])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, -1), C["navy"]),
            ("BACKGROUND", (2, 0), (2, -1), C["navy"]),
            ("TEXTCOLOR", (0, 0), (0, -1), C["white"]),
            ("TEXTCOLOR", (2, 0), (2, -1), C["white"]),
            ("FONTNAME", (0, 0), (-1, -1), "NanumGothic"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("GRID", (0, 0), (-1, -1), 0.5, C["dark_gray"]),
        ]))
        t.wrapOn(self.canv, self._width, 9999)
        t.drawOn(self.canv, 0, 0)


# ============================================================
# 유틸리티 함수
# ============================================================

def make_table(data, col_ratios=None, style_override=None):
    """범용 테이블 생성 — col_ratios는 비율 리스트 (예: [0.3, 0.7])"""
    avail = A4[0] - MARGIN_L - MARGIN_R - IND_BODY
    if col_ratios:
        col_w = [avail * r for r in col_ratios]
    else:
        n = len(data[0]) if data else 1
        col_w = [avail / n] * n

    default_style = TableStyle([
        # 헤더 행
        ("BACKGROUND", (0, 0), (-1, 0), C["navy"]),
        ("TEXTCOLOR", (0, 0), (-1, 0), C["white"]),
        ("FONTNAME", (0, 0), (-1, 0), "NanumGothicBold"),
        # 본문
        ("FONTNAME", (0, 1), (-1, -1), "NanumGothic"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, C["dark_gray"]),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [C["white"], C["light_gray"]]),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ])

    t = Table(data, colWidths=col_w)
    t.setStyle(style_override or default_style)
    return t


# ============================================================
# 단축 함수 10종 — build_content()에서 사용
# ============================================================

def sp(h=3):
    """빈 줄 삽입 (기본 3mm)"""
    return Spacer(1, h*mm)

def title(text):
    return Paragraph(text, S["title"])

def h1(text):
    """대분류 — 예: 'I. 서론'"""
    return SectionHeader(text)

def h2(text):
    return Paragraph(text, S["h2"])

def h3(text):
    return Paragraph(text, S["h3"])

def body(text):
    return Paragraph(text, S["body"])

def bullet1(text):
    return Paragraph(f"• {text}", S["bullet1"])

def bullet2(text):
    return Paragraph(f"- {text}", S["bullet2"])

def ref(text):
    return Paragraph(text, S["ref"])

def th(text):
    return Paragraph(text, S["th"])

def td(text):
    return Paragraph(text, S["td"])


# ============================================================
# build_pdf — 최종 PDF 조립 (절대 재생성 금지)
# ============================================================

def build_pdf(story, path="output.pdf", title="보고서",
              header_text="", footer_source="",
              copy_to_outputs=True):
    """
    story: list of Flowable (build_content()의 반환값)
    path: 출력 파일 경로
    title: PDF 메타데이터 제목
    header_text: 각 페이지 상단 좌측 텍스트
    footer_source: 각 페이지 하단 좌측 출처 텍스트
    copy_to_outputs: True이면 outputs 디렉토리에 복사 (환경 자동 감지)
    """

    doc = SimpleDocTemplate(
        path, pagesize=A4,
        leftMargin=MARGIN_L, rightMargin=MARGIN_R,
        topMargin=MARGIN_T, bottomMargin=MARGIN_B,
        title=title,
    )

    def _header_footer(canvas, doc):
        canvas.saveState()
        w, h = A4
        # 헤더
        if header_text:
            canvas.setFont("NanumGothicBold", 8)
            canvas.setFillColor(C["navy"])
            canvas.drawString(MARGIN_L, h - 15*mm, header_text)
            canvas.setStrokeColor(C["navy"])
            canvas.setLineWidth(0.5)
            canvas.line(MARGIN_L, h - 17*mm, w - MARGIN_R, h - 17*mm)
        # 푸터
        canvas.setFont("NanumGothic", 8)
        canvas.setFillColor(C["dark_gray"])
        if footer_source:
            canvas.drawString(MARGIN_L, 12*mm, footer_source)
        canvas.drawRightString(w - MARGIN_R, 12*mm, f"- {doc.page} -")
        canvas.restoreState()

    doc.build(story, onFirstPage=_header_footer, onLaterPages=_header_footer)

    if copy_to_outputs:
        try:
            out_dir = _get_outputs_dir()
            dest = os.path.join(out_dir, os.path.basename(path))
            shutil.copy2(path, dest)
            print(f"✅ {dest}")
        except Exception as e:
            print(f"⚠️ outputs 복사 실패: {e}")

    return path
