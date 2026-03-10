"""
pdf_template_USDoD_v3.py  (2026-03-06 v3.1 — cross-env)
US DoD 양식 PDF 보고서 템플릿 — reportlab 엔진

폰트 분리 전략 (null bytes 방지):
  영문/숫자/기호 → DejaVuSans / DejaVuSansBold
  한글 텍스트    → NanumGothic / NanumGothicBold

★ v3.1 변경사항 (2026-03-06):
  - 환경 감지 + 폰트 자동 탐색 + outputs 경로 동적 결정
  - Chat 서버 / Cowork VM / 기타 환경 모두 지원
  - 폰트 미설치 시 GitHub 다운로드 → DejaVu fallback 체인
  - DejaVu 폰트 미설치 시 Nanum 폰트로 대체 (Nanum은 영문도 렌더 가능)

★ 2026-03-03 수정: _make_header_footer() 내 header_left·header_right의
  canvas.drawString()에서 DejaVuSans/Bold → NanumGothicBold로 변경.
  한글 title이 header_left로 전달될 때 null bytes 발생하던 버그 수정.

클리핑 방지:
  모든 커스텀 Flowable은 wrap() 호출 시점에 높이를 동적으로 재계산한다.
  __init__에서 미리 계산하지 않는다.
"""

import os, shutil, urllib.request
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Flowable
)


# ============================================================
# 환경 감지 + 폰트 탐색 + outputs 경로 (v3.1 신규)
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
    탐색 순서: 시스템 경로 → 로컬 ~/.fonts → GitHub 다운로드 → fallback

    DejaVu 폰트 요청 시:
      시스템에 있으면 그대로 사용, 없으면 Nanum으로 대체
      (Nanum은 영문도 렌더 가능하므로 안전한 fallback)

    Nanum 폰트 요청 시:
      시스템 경로 탐색 → ~/.fonts 탐색 → GitHub 다운로드 → DejaVu fallback
    """
    # Google Fonts 파일명 매핑 (시스템 설치명 → 다운로드명)
    _NANUM_MAP = {
        "NanumGothic.ttf": "NanumGothic-Regular.ttf",
        "NanumGothicBold.ttf": "NanumGothic-Bold.ttf",
    }
    # DejaVu → Nanum fallback 매핑
    _DEJAVU_NANUM_FALLBACK = {
        "DejaVuSans.ttf": "NanumGothic.ttf",
        "DejaVuSans-Bold.ttf": "NanumGothicBold.ttf",
    }

    # ── 1. DejaVu 폰트 요청 처리 ──
    if filename.startswith("DejaVu"):
        sys_path = f"/usr/share/fonts/truetype/dejavu/{filename}"
        if os.path.exists(sys_path):
            return sys_path
        # DejaVu 없으면 Nanum으로 대체
        nanum_name = _DEJAVU_NANUM_FALLBACK.get(filename, "NanumGothic.ttf")
        return _find_font(nanum_name)

    # ── 2. Nanum 폰트 탐색 ──
    dl_filename = _NANUM_MAP.get(filename, filename)
    candidates = [
        f"/usr/share/fonts/truetype/nanum/{filename}",
        f"/usr/share/fonts/truetype/nanum/{dl_filename}",
        os.path.expanduser(f"~/.fonts/nanum/{filename}"),
        os.path.expanduser(f"~/.fonts/nanum/{dl_filename}"),
    ]
    for path in candidates:
        if os.path.exists(path):
            return path

    # ── 3. 네트워크 다운로드 시도 ──
    dest = os.path.expanduser(f"~/.fonts/nanum/{dl_filename}")
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    url = f"https://github.com/google/fonts/raw/main/ofl/nanumgothic/{dl_filename}"
    try:
        urllib.request.urlretrieve(url, dest)
        if os.path.exists(dest) and os.path.getsize(dest) > 100_000:
            return dest
    except Exception:
        pass

    # ── 4. 최종 fallback: DejaVu ──
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


# ── 폰트 등록 (v3.1: 동적 탐색 + try/except) ──────────────
_FONT_NAMES = {
    "DejaVuSans":      "DejaVuSans.ttf",
    "DejaVuSansBold":  "DejaVuSans-Bold.ttf",
    "NanumGothic":     "NanumGothic.ttf",
    "NanumGothicBold": "NanumGothicBold.ttf",
}
for _name, _file in _FONT_NAMES.items():
    try:
        _path = _find_font(_file)
        pdfmetrics.registerFont(TTFont(_name, _path))
    except FileNotFoundError as e:
        print(f"⚠️ 폰트 등록 실패 ({_name}): {e}")


# ── 색상 ──────────────────────────────────────────────────────
C = {
    "army_green": HexColor("#4B5320"),
    "tan":        HexColor("#D2B48C"),
    "cream":      HexColor("#FFFDD0"),
    "light_gray": HexColor("#F0F0F0"),
    "mid_gray":   HexColor("#CCCCCC"),
    "dark_gray":  HexColor("#555555"),
    "white":      white,
    "black":      black,
}

# ── 페이지 규격 ───────────────────────────────────────────────
PAGE_W, PAGE_H = A4
LM = 25.4*mm
RM = 19.1*mm
TM = 25.4*mm
BM = 19.1*mm
INNER_W = PAGE_W - LM - RM
IND1 = 5*mm
IND2 = 10*mm
PAD_TOP   = 3*mm   # Flowable 내부 상단 여백
PAD_BOT   = 4*mm   # Flowable 내부 하단 여백 (클리핑 방지용 여유)
PAD_INTER = 1*mm   # 단락 사이 간격

# ── 스타일 사전 S ─────────────────────────────────────────────
S = {}

def _s(name, **kw):
    s = ParagraphStyle(name, **kw)
    S[name] = s
    return s

_s("title",    fontSize=16, fontName="DejaVuSansBold", leading=22,
   spaceAfter=10*mm, alignment=TA_CENTER)
_s("h1",       fontSize=13, fontName="DejaVuSansBold", leading=18,
   spaceBefore=4*mm, spaceAfter=2*mm)
_s("h2",       fontSize=11, fontName="DejaVuSansBold", leading=16,
   leftIndent=IND1, spaceBefore=3*mm, spaceAfter=1*mm)

# 본문
_s("body",     fontSize=10, fontName="DejaVuSans",  leading=16,
   alignment=TA_JUSTIFY, spaceBefore=1*mm, spaceAfter=1*mm)
_s("body_kr",  fontSize=10, fontName="NanumGothic", leading=18,
   alignment=TA_JUSTIFY, spaceBefore=1*mm, spaceAfter=1*mm)

# 불릿
_s("bullet1",    fontSize=10, fontName="DejaVuSans",  leading=16,
   leftIndent=IND1, spaceBefore=0.5*mm, spaceAfter=0.5*mm)
_s("bullet2",    fontSize=10, fontName="DejaVuSans",  leading=16,
   leftIndent=IND2, spaceBefore=0.5*mm, spaceAfter=0.5*mm)
_s("bullet1_kr", fontSize=10, fontName="NanumGothic", leading=18,
   leftIndent=IND1, spaceBefore=0.5*mm, spaceAfter=0.5*mm)
_s("bullet2_kr", fontSize=10, fontName="NanumGothic", leading=18,
   leftIndent=IND2, spaceBefore=0.5*mm, spaceAfter=0.5*mm)

# Key Findings / Analyst Note 내부
_s("kf_text", fontSize=10, fontName="NanumGothic", leading=18,
   textColor=C["dark_gray"], spaceBefore=1*mm, spaceAfter=1*mm)
_s("an_text", fontSize=9.5, fontName="NanumGothic", leading=17,
   textColor=C["dark_gray"], leftIndent=2*mm, spaceBefore=1*mm, spaceAfter=1*mm)

# 테이블
_s("th",    fontSize=9, fontName="DejaVuSansBold", leading=12, alignment=TA_CENTER)
_s("td",    fontSize=9, fontName="DejaVuSans",     leading=12, alignment=TA_LEFT)
_s("td_kr", fontSize=9, fontName="NanumGothic",    leading=12, alignment=TA_LEFT)

# 참고문헌
_s("ref",    fontSize=8, fontName="DejaVuSans",  leading=10,
   textColor=C["dark_gray"], leftIndent=IND1)
_s("ref_kr", fontSize=8, fontName="NanumGothic", leading=12,
   textColor=C["dark_gray"], leftIndent=IND1)


# ── 높이 동적 계산 유틸 ───────────────────────────────────────
def _para_height(p: Paragraph, avail_w: float) -> float:
    """단락의 실제 렌더 높이를 반환한다."""
    _, h = p.wrap(avail_w, 9999)
    return h


# ── Flowable 클래스 ───────────────────────────────────────────

class SectionHeader(Flowable):
    """이중선 + 섹션 제목 바"""
    HEADER_H = 20*mm   # 고정 높이 (짧은 제목 가정)

    def __init__(self, text: str, font_korean=False):
        super().__init__()
        self.text = text
        self.font = "NanumGothicBold" if font_korean else "DejaVuSansBold"

    def wrap(self, avail_w, avail_h):
        self._w = avail_w
        return avail_w, self.HEADER_H

    def draw(self):
        c = self.canv
        h = self.HEADER_H
        c.setStrokeColor(C["army_green"]); c.setLineWidth(1.5)
        c.line(0, h - 2*mm, self._w, h - 2*mm)
        c.setLineWidth(0.5)
        c.line(0, h - 4*mm, self._w, h - 4*mm)
        c.setFillColor(C["army_green"])
        c.setFont(self.font, 13)
        c.drawString(0, h - 13*mm, self.text)
        c.setStrokeColor(C["army_green"]); c.setLineWidth(0.5)
        c.line(0, h - 17*mm, self._w, h - 17*mm)


class SubSection(Flowable):
    """Army Green 소제목"""
    SUB_H = 10*mm

    def __init__(self, text: str, font_korean=False):
        super().__init__()
        self.text = text
        self.font = "NanumGothicBold" if font_korean else "DejaVuSansBold"

    def wrap(self, avail_w, avail_h):
        self._w = avail_w
        return avail_w, self.SUB_H

    def draw(self):
        c = self.canv
        c.setFillColor(C["army_green"])
        c.setFont(self.font, 11)
        c.drawString(IND1, 3.5*mm, self.text)
        c.setStrokeColor(C["army_green"]); c.setLineWidth(0.3)
        c.line(IND1, 2*mm, self._w, 2*mm)


class KeyFindings(Flowable):
    """Army Green 헤더 + Light Gray 배경 박스 — 높이 동적 계산"""
    HEADER_H = 8*mm

    def __init__(self, title: str, paragraphs: list, font_korean=False):
        super().__init__()
        self.title = title
        self.paragraphs = paragraphs
        self.font_h = "NanumGothicBold" if font_korean else "DejaVuSansBold"
        self._avail_w = None

    def _content_w(self):
        return (self._avail_w or INNER_W) - 10*mm

    def wrap(self, avail_w, avail_h):
        self._avail_w = avail_w
        cw = self._content_w()
        para_h = sum(_para_height(p, cw) + PAD_INTER for p in self.paragraphs)
        self._h = self.HEADER_H + PAD_TOP + para_h + PAD_BOT
        return avail_w, self._h

    def draw(self):
        c = self.canv
        # 헤더
        c.setFillColor(C["army_green"])
        c.rect(0, self._h - self.HEADER_H, self._avail_w, self.HEADER_H, fill=1, stroke=0)
        c.setFillColor(C["white"])
        c.setFont(self.font_h, 10)
        c.drawString(3*mm, self._h - self.HEADER_H + 2*mm, self.title)
        # 내용 배경
        body_h = self._h - self.HEADER_H
        c.setFillColor(C["light_gray"])
        c.rect(0, 0, self._avail_w, body_h, fill=1, stroke=0)
        c.setStrokeColor(C["mid_gray"]); c.setLineWidth(0.3)
        c.rect(0, 0, self._avail_w, body_h, fill=0, stroke=1)
        # 단락 렌더링 (위→아래)
        cw = self._content_w()
        y = body_h - PAD_TOP
        for p in self.paragraphs:
            ph = _para_height(p, cw)
            p.drawOn(c, 5*mm, y - ph)
            y -= ph + PAD_INTER


class AnalystNote(Flowable):
    """Cream 배경 + Tan 좌측 바 — 높이 동적 계산"""
    LABEL_H = 6*mm

    def __init__(self, paragraphs: list):
        super().__init__()
        self.paragraphs = paragraphs
        self._avail_w = None

    def _content_w(self):
        return (self._avail_w or INNER_W) - 12*mm

    def wrap(self, avail_w, avail_h):
        self._avail_w = avail_w
        cw = self._content_w()
        para_h = sum(_para_height(p, cw) + PAD_INTER for p in self.paragraphs)
        self._h = self.LABEL_H + PAD_TOP + para_h + PAD_BOT
        return avail_w, self._h

    def draw(self):
        c = self.canv
        c.setFillColor(C["cream"])
        c.rect(0, 0, self._avail_w, self._h, fill=1, stroke=0)
        c.setFillColor(C["tan"])
        c.rect(0, 0, 3*mm, self._h, fill=1, stroke=0)
        c.setStrokeColor(C["tan"]); c.setLineWidth(0.3)
        c.rect(0, 0, self._avail_w, self._h, fill=0, stroke=1)
        # 라벨
        c.setFillColor(C["army_green"])
        c.setFont("DejaVuSansBold", 8)
        c.drawString(5*mm, self._h - self.LABEL_H + 1.5*mm, "ANALYST NOTE")
        # 단락
        cw = self._content_w()
        y = self._h - self.LABEL_H - PAD_TOP
        for p in self.paragraphs:
            ph = _para_height(p, cw)
            p.drawOn(c, 6*mm, y - ph)
            y -= ph + PAD_INTER


class MetadataBlock(Flowable):
    """문서 메타데이터 테이블"""
    ROW_H = 8*mm
    PAD_V = 2*mm

    def __init__(self, fields: list):
        super().__init__()
        self.fields = fields

    def wrap(self, avail_w, avail_h):
        self._avail_w = avail_w
        self._h = len(self.fields) * self.ROW_H + self.PAD_V
        return avail_w, self._h

    def draw(self):
        c = self.canv
        c.setStrokeColor(C["army_green"]); c.setLineWidth(0.5)
        c.rect(0, 0, self._avail_w, self._h, fill=0, stroke=1)
        y = self._h - self.ROW_H
        for i, (label, value) in enumerate(self.fields):
            bg = C["light_gray"] if i % 2 == 0 else C["white"]
            c.setFillColor(bg)
            c.rect(0, y, self._avail_w, self.ROW_H, fill=1, stroke=0)
            # 라벨 (한글 포함 가능 → NanumGothicBold)
            c.setFillColor(C["army_green"])
            c.setFont("NanumGothicBold", 8.5)
            c.drawString(3*mm, y + 2.5*mm, label)
            # 구분선
            c.setStrokeColor(C["mid_gray"]); c.setLineWidth(0.3)
            c.line(50*mm, y, 50*mm, y + self.ROW_H)
            # 값 (한글 포함 → NanumGothic)
            c.setFillColor(C["black"])
            c.setFont("NanumGothic", 8.5)
            c.drawString(53*mm, y + 2.5*mm, value)
            # 행 구분선
            c.setStrokeColor(C["mid_gray"]); c.setLineWidth(0.2)
            c.line(0, y, self._avail_w, y)
            y -= self.ROW_H


# ── 테이블 빌더 ───────────────────────────────────────────────
def _base_table_style(kr=False):
    fn_h = "NanumGothicBold" if kr else "DejaVuSansBold"
    fn_b = "NanumGothic"     if kr else "DejaVuSans"
    return TableStyle([
        ("BACKGROUND",    (0,0), (-1,0), C["army_green"]),
        ("TEXTCOLOR",     (0,0), (-1,0), C["white"]),
        ("FONTNAME",      (0,0), (-1,0), fn_h),
        ("FONTSIZE",      (0,0), (-1,0), 9),
        ("FONTNAME",      (0,1), (-1,-1), fn_b),
        ("FONTSIZE",      (0,1), (-1,-1), 9),
        ("ALIGN",         (0,0), (-1,-1), "LEFT"),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
        ("ROWBACKGROUNDS",(0,1), (-1,-1), [C["white"], C["light_gray"]]),
        ("GRID",          (0,0), (-1,-1), 0.3, C["mid_gray"]),
        ("TOPPADDING",    (0,0), (-1,-1), 3),
        ("BOTTOMPADDING", (0,0), (-1,-1), 3),
        ("LEFTPADDING",   (0,0), (-1,-1), 4),
    ])

def make_table(data, col_ratios=None):
    n = len(data[0])
    cw = [INNER_W * r for r in col_ratios] if col_ratios else [INNER_W/n]*n
    t = Table(data, colWidths=cw, repeatRows=1)
    t.setStyle(_base_table_style(kr=False))
    return t

def make_table_kr(data, col_ratios=None):
    n = len(data[0])
    cw = [INNER_W * r for r in col_ratios] if col_ratios else [INNER_W/n]*n
    t = Table(data, colWidths=cw, repeatRows=1)
    t.setStyle(_base_table_style(kr=True))
    return t


# ── 단축 함수 ─────────────────────────────────────────────────
def sp(h=3): return Spacer(1, h*mm)
def body(t):      return Paragraph(t, S["body"])
def body_kr(t):   return Paragraph(t, S["body_kr"])
def bullet1(t):   return Paragraph(t, S["bullet1"])
def bullet2(t):   return Paragraph(t, S["bullet2"])
def bullet1_kr(t):return Paragraph(t, S["bullet1_kr"])
def bullet2_kr(t):return Paragraph(t, S["bullet2_kr"])
def ref(t):       return Paragraph(t, S["ref"])
def ref_kr(t):    return Paragraph(t, S["ref_kr"])
def th(t):        return Paragraph(t, S["th"])
def th_kr(t):     return Paragraph(t, S["td_kr"])  # 헤더도 NanumGothic
def td(t):        return Paragraph(t, S["td"])
def td_kr(t):     return Paragraph(t, S["td_kr"])


# ── 헤더·푸터 ─────────────────────────────────────────────────
def _make_header_footer(canvas, doc, header_left, header_right, footer_left):
    canvas.saveState()
    w, h = A4
    canvas.setFont("NanumGothicBold", 8)          # ★ 한글 title 대응: DejaVuSans → NanumGothicBold
    canvas.setFillColor(C["dark_gray"])
    canvas.drawString(LM, h - 15*mm, header_left)
    canvas.setFont("NanumGothicBold", 8)           # ★ 한글 가능성 대비: DejaVuSansBold → NanumGothicBold
    canvas.setFillColor(C["army_green"])
    canvas.drawRightString(w - RM, h - 15*mm, header_right)
    canvas.setStrokeColor(C["army_green"]); canvas.setLineWidth(0.5)
    canvas.line(LM, h - 17*mm, w - RM, h - 17*mm)
    # 푸터
    canvas.setFont("NanumGothic", 8)
    canvas.setFillColor(C["dark_gray"])
    canvas.drawString(LM, 12*mm, footer_left)
    canvas.setFont("DejaVuSans", 8)
    canvas.drawRightString(w - RM, 12*mm, f"Page {doc.page}")
    canvas.setStrokeColor(C["army_green"])
    canvas.line(LM, 14.5*mm, w - RM, 14.5*mm)
    canvas.restoreState()


# ── build_pdf ─────────────────────────────────────────────────
def build_pdf(story, path="report.pdf",
              title="REPORT",
              header_right="UNCLASSIFIED // FOR OFFICIAL USE",
              footer_left="",
              copy_to_outputs=True):

    out = path if os.path.isabs(path) else os.path.abspath(path)
    out_dir = os.path.dirname(out)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    def on_page(canvas, doc):
        _make_header_footer(canvas, doc, title.upper(), header_right, footer_left)

    doc = SimpleDocTemplate(
        out, pagesize=A4,
        leftMargin=LM, rightMargin=RM,
        topMargin=TM + 5*mm, bottomMargin=BM + 8*mm,
        title=title,
    )
    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)

    if copy_to_outputs:
        try:
            outputs_dir = _get_outputs_dir()
            dst = os.path.join(outputs_dir, os.path.basename(out))
            shutil.copy(out, dst)
            print(f"✅ {dst}")
            return dst
        except Exception as e:
            print(f"⚠️ outputs 복사 실패: {e}")
    print(f"✅ {out}")
    return out
