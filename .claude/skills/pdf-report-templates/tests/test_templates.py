"""
test_templates.py — PDF 템플릿 + MD→PDF 변환기 자체 테스트
============================================================
v2.0 기준 7가지 검증 수행:
  1. SKILL.md 읽기 → 필수 키워드 존재 확인
  2. [한국공문서] build_content() 예시 → PDF 생성 → A4 확인
  3. [DoD양식 v3] build_content() 예시 → PDF 생성 → A4 확인
  4. MD→IR 파싱 정확도 검증
  5. IR→KrGov story 변환 + PDF 생성 검증
  6. IR→USDoD story 변환 + PDF 생성 검증
  7. 한글 자동 감지 함수 검증

실행 방법:
    cd /home/claude/pdf-report-templates
    python3 tests/test_templates.py
"""

import os
import sys
import shutil
import traceback

# ============================================================
# 경로 설정
# ============================================================
SKILL_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TESTS_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUTS_DIR = "/mnt/user-data/outputs"

# 테스트 중 생성되는 부산물 목록 (cleanup 대상)
ARTIFACTS = []

def register_artifact(path):
    """삭제 대상 파일/폴더를 등록한다."""
    ARTIFACTS.append(path)

def cleanup():
    """테스트 부산물을 모두 삭제한다."""
    for path in ARTIFACTS:
        try:
            if os.path.isdir(path):
                shutil.rmtree(path)
            elif os.path.isfile(path):
                os.remove(path)
        except Exception:
            pass

    # __pycache__ 폴더 삭제
    for root, dirs, files in os.walk(SKILL_DIR):
        for d in dirs:
            if d == "__pycache__":
                try:
                    shutil.rmtree(os.path.join(root, d))
                except Exception:
                    pass


# ============================================================
# 테스트 1: SKILL.md 필수 키워드 확인
# ============================================================
def test_skill_md():
    """SKILL.md가 존재하고 핵심 키워드를 포함하는지 확인한다."""
    print("\n[TEST 1] SKILL.md 필수 키워드 확인")

    skill_path = os.path.join(SKILL_DIR, "SKILL.md")
    assert os.path.isfile(skill_path), f"SKILL.md 없음: {skill_path}"

    content = open(skill_path, encoding="utf-8").read()

    # v2.0 필수 키워드
    required = [
        "한국공문서",
        "DoD",
        "build_pdf",
        "NanumGothic",
        "present_files",
        "SSOT",                          # v2.0 신규
        "md_to_pdf_converter",           # v2.0 신규
        "convert_md_to_pdf",             # v2.0 신규
        "parse_md",                      # v2.0 신규
        "IR",                            # v2.0 신규 (중간 표현)
    ]
    missing = [kw for kw in required if kw not in content]
    assert not missing, f"SKILL.md에 누락된 키워드: {missing}"

    print(f"  ✅ SKILL.md 확인 완료 — {len(content)}자, 필수 키워드 {len(required)}개 모두 포함")


# ============================================================
# 테스트 2: [한국공문서] PDF 생성 + A4 확인
# ============================================================
def test_krgov_pdf():
    """[한국공문서] 템플릿으로 샘플 PDF를 생성하고 A4 크기를 확인한다."""
    print("\n[TEST 2] [한국공문서] PDF 생성 + A4 확인")

    src = os.path.join(SKILL_DIR, "pdf_template_KrGov_1_0.py")
    dst = os.path.join(SKILL_DIR, "pdf_template_KrGov_1_0_test.py")
    shutil.copy2(src, dst)
    register_artifact(dst)

    sys.path.insert(0, SKILL_DIR)
    import importlib
    mod = importlib.import_module("pdf_template_KrGov_1_0_test")

    story = [
        mod.title("테스트 보고서: 한국공문서 양식"),
        mod.sp(5),
        mod.h1("I. 서론"),
        mod.body("이 문서는 [한국공문서] 템플릿의 자체 테스트용 샘플이다."),
        mod.sp(),
        mod.h2("1. 배경"),
        mod.body("PDF 생성 기능이 정상 동작하는지 검증한다."),
        mod.bullet1("폰트 렌더링 확인"),
        mod.bullet2("여백 및 들여쓰기 확인"),
        mod.sp(),
        mod.h1("II. 본론"),
        mod.body("테이블과 강조 박스가 포함된 복합 레이아웃을 테스트한다."),
    ]

    test_pdf = os.path.join(SKILL_DIR, "test_krgov.pdf")
    register_artifact(test_pdf)

    mod.build_pdf(story, path=test_pdf, title="테스트 보고서",
                  header_text="자체 테스트", footer_source="test_templates.py",
                  copy_to_outputs=False)

    assert os.path.isfile(test_pdf), "PDF 파일 생성 실패"
    assert os.path.getsize(test_pdf) > 1000, "PDF 파일이 비정상적으로 작음"

    try:
        from pypdf import PdfReader
        reader = PdfReader(test_pdf)
        page = reader.pages[0]
        w = float(page.mediabox.width)
        h = float(page.mediabox.height)
        assert abs(w - 595.28) < 2, f"A4 폭 불일치: {w}"
        assert abs(h - 841.89) < 2, f"A4 높이 불일치: {h}"
        print(f"  ✅ PDF 생성 완료 — {os.path.getsize(test_pdf):,}B, A4({w:.1f}×{h:.1f}pt) 확인")
    except ImportError:
        size = os.path.getsize(test_pdf)
        print(f"  ✅ PDF 생성 완료 — {size:,}B (pypdf 미설치로 A4 크기 검증 생략)")


# ============================================================
# 테스트 3: [DoD양식 v3] PDF 생성 + A4 확인
# ============================================================
def test_usdod_pdf():
    """[DoD양식 v3] 템플릿으로 샘플 PDF를 생성하고 A4 크기를 확인한다."""
    print("\n[TEST 3] [DoD양식 v3] PDF 생성 + A4 확인")

    src = os.path.join(SKILL_DIR, "pdf_template_USDoD_v3.py")
    dst = os.path.join(SKILL_DIR, "pdf_template_USDoD_v3_test.py")
    shutil.copy2(src, dst)
    register_artifact(dst)

    sys.path.insert(0, SKILL_DIR)
    import importlib
    mod = importlib.import_module("pdf_template_USDoD_v3_test")

    story = [
        mod.Paragraph("TEST REPORT: DoD FORMAT v3", mod.S["title"]),
        mod.sp(5),
        mod.SectionHeader("1. EXECUTIVE SUMMARY", font_korean=False),
        mod.body("This document is a self-test sample for the DoD v3 template."),
        mod.sp(),
        mod.SubSection("a. Background", font_korean=False),
        mod.body("Verifying PDF generation functionality."),
        mod.bullet1("Font rendering check"),
        mod.bullet2("Margin and indent verification"),
        mod.sp(),
        mod.SectionHeader("2. 분석", font_korean=True),
        mod.body_kr("한글 본문 렌더링 테스트: DoD 양식에서도 한글이 정상 출력되어야 한다."),
    ]

    test_pdf = os.path.join(SKILL_DIR, "test_usdod.pdf")
    register_artifact(test_pdf)

    mod.build_pdf(story, path=test_pdf, title="TEST REPORT",
                  header_right="SELF-TEST", footer_left="test_templates.py",
                  copy_to_outputs=False)

    assert os.path.isfile(test_pdf), "PDF 파일 생성 실패"
    assert os.path.getsize(test_pdf) > 1000, "PDF 파일이 비정상적으로 작음"

    try:
        from pypdf import PdfReader
        reader = PdfReader(test_pdf)
        page = reader.pages[0]
        w = float(page.mediabox.width)
        h = float(page.mediabox.height)
        assert abs(w - 595.28) < 2, f"A4 폭 불일치: {w}"
        assert abs(h - 841.89) < 2, f"A4 높이 불일치: {h}"
        print(f"  ✅ PDF 생성 완료 — {os.path.getsize(test_pdf):,}B, A4({w:.1f}×{h:.1f}pt) 확인")
    except ImportError:
        size = os.path.getsize(test_pdf)
        print(f"  ✅ PDF 생성 완료 — {size:,}B (pypdf 미설치로 A4 크기 검증 생략)")


# ============================================================
# 테스트 4: MD→IR 파싱 정확도 검증
# ============================================================
def test_md_parser():
    """MD→IR 변환이 올바르게 작동하는지 검증한다."""
    print("\n[TEST 4] MD→IR 파싱 정확도 검증")

    sys.path.insert(0, SKILL_DIR)
    from md_to_pdf_converter import parse_md, _has_korean

    sample_md = """**출처:** Reuters | **저자:** John Doe
**원문 보도일:** 2026-03-01 | **정리일:** 2026-03-06 (KST)

# 테스트 보고서 제목

## I. 대분류 섹션

이것은 본문 단락이다. **굵은 글씨**와 *기울임*이 포함되어 있다.

- 불릿 항목 1
- 불릿 항목 2
  - 하위 불릿 A
  - 하위 불릿 B

### 1. 중분류 소제목

| 항목 | 값 | 비고 |
|---|---|---|
| A | 100 | 테스트 |
| B | 200 | 검증 |

> 📌 **Analyst Note**
> 이것은 분석 노트의 내용이다. 한 단계 더 들어간 해석을 제시한다.

#### 가. 소분류

소분류 본문 텍스트.

## 참고문헌

- [1] 출처 1
- [2] 출처 2
"""

    ir = parse_md(sample_md)

    # 타입별 개수 검증
    types = [node["type"] for node in ir]

    assert "metadata" in types, "메타데이터 노드 누락"
    assert "title" in types, "title 노드 누락"
    assert "h1" in types, "h1 노드 누락"
    assert "h2" in types, "h2 노드 누락"
    assert "h3" in types, "h3 노드 누락"
    assert "body" in types, "body 노드 누락"
    assert "bullet1" in types, "bullet1 노드 누락"
    assert "bullet2" in types, "bullet2 노드 누락"
    assert "analyst_note" in types, "analyst_note 노드 누락"
    assert "table" in types, "table 노드 누락"
    assert "ref" in types, "ref 노드 누락"

    # 메타데이터 필드 검증
    meta = [n for n in ir if n["type"] == "metadata"][0]
    labels = [f[0] for f in meta["fields"]]
    assert any("출처" in l for l in labels), "메타데이터에 '출처' 필드 누락"

    # 테이블 행 수 검증 (헤더 + 2행 = 3행, 구분선 제외)
    table_node = [n for n in ir if n["type"] == "table"][0]
    assert len(table_node["rows"]) == 3, f"테이블 행 수 불일치: {len(table_node['rows'])} (기대: 3)"

    # Analyst Note 내용 검증
    an = [n for n in ir if n["type"] == "analyst_note"][0]
    assert len(an["lines"]) >= 1, "Analyst Note 내용 비어있음"
    assert "분석" in an["lines"][0] or "해석" in an["lines"][0], "Analyst Note 내용 불일치"

    # 참고문헌 감지 검증
    refs = [n for n in ir if n["type"] == "ref"]
    assert len(refs) >= 2, f"참고문헌 노드 수 부족: {len(refs)}"

    print(f"  ✅ IR 파싱 완료 — 총 {len(ir)}개 노드, 11종 타입 모두 확인")


# ============================================================
# 테스트 5: IR→KrGov story + PDF 생성
# ============================================================
def test_converter_krgov():
    """MD→PDF 변환기로 KrGov PDF를 생성한다."""
    print("\n[TEST 5] MD→KrGov PDF 변환 검증")

    sys.path.insert(0, SKILL_DIR)

    sample_md = """**출처:** 테스트 매체 | **정리일:** 2026-03-06
**분류:** 내부용

# 변환기 테스트 보고서

## I. 서론

이 보고서는 md_to_pdf_converter의 KrGov 변환 기능을 검증하기 위한 문서이다.

- 불릿 항목 A
- 불릿 항목 B

### 1. 테이블 테스트

| 구분 | 값 |
|---|---|
| 항목1 | 100 |
| 항목2 | 200 |

> 📌 **Analyst Note**
> 변환기가 Analyst Note를 HighlightBox로 올바르게 변환하는지 확인한다.
"""

    # MD 파일 임시 생성
    md_path = os.path.join(SKILL_DIR, "test_converter_kr.md")
    pdf_path = os.path.join(SKILL_DIR, "test_converter_krgov.pdf")
    register_artifact(md_path)
    register_artifact(pdf_path)

    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(sample_md)

    from md_to_pdf_converter import convert_md_to_pdf
    result = convert_md_to_pdf(
        md_path, pdf_path, template="KrGov",
        title="변환기 테스트", copy_to_outputs=False
    )

    assert os.path.isfile(pdf_path), "KrGov PDF 생성 실패"
    assert os.path.getsize(pdf_path) > 1000, "KrGov PDF가 비정상적으로 작음"

    print(f"  ✅ KrGov 변환 완료 — {os.path.getsize(pdf_path):,}B")


# ============================================================
# 테스트 6: IR→USDoD story + PDF 생성
# ============================================================
def test_converter_usdod():
    """MD→PDF 변환기로 USDoD PDF를 생성한다."""
    print("\n[TEST 6] MD→USDoD PDF 변환 검증")

    sys.path.insert(0, SKILL_DIR)

    sample_md = """**출처:** Test Source | **정리일:** 2026-03-06
**분류:** UNCLASSIFIED

# Converter Test Report

## I. Executive Summary

This report tests the USDoD conversion capability of md_to_pdf_converter.

- Bullet item A — English only
- 불릿 항목 B — 한글 혼합 텍스트

### 1. Table Test

| Category | Value |
|---|---|
| Item A | 100 |
| 항목 B | 200 |

> 📌 **Analyst Note**
> 변환기가 USDoD AnalystNote Flowable을 올바르게 생성하는지 확인한다.
> Font separation between Korean and English text must be verified.
"""

    md_path = os.path.join(SKILL_DIR, "test_converter_en.md")
    pdf_path = os.path.join(SKILL_DIR, "test_converter_usdod.pdf")
    register_artifact(md_path)
    register_artifact(pdf_path)

    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(sample_md)

    from md_to_pdf_converter import convert_md_to_pdf
    result = convert_md_to_pdf(
        md_path, pdf_path, template="USDoD",
        title="CONVERTER TEST", copy_to_outputs=False
    )

    assert os.path.isfile(pdf_path), "USDoD PDF 생성 실패"
    assert os.path.getsize(pdf_path) > 1000, "USDoD PDF가 비정상적으로 작음"

    print(f"  ✅ USDoD 변환 완료 — {os.path.getsize(pdf_path):,}B")


# ============================================================
# 테스트 7: 한글 자동 감지 함수 검증
# ============================================================
def test_korean_detection():
    """_has_korean() 함수가 한글을 올바르게 감지하는지 확인한다."""
    print("\n[TEST 7] 한글 자동 감지 함수 검증")

    sys.path.insert(0, SKILL_DIR)
    from md_to_pdf_converter import _has_korean

    # 한글 포함 케이스
    assert _has_korean("한글 텍스트"), "순수 한글 감지 실패"
    assert _has_korean("English and 한글 mixed"), "한영 혼합 감지 실패"
    assert _has_korean("123 숫자와 한글"), "숫자+한글 감지 실패"
    assert _has_korean("ㄱㄴㄷ 자모"), "한글 자모 감지 실패"

    # 영문만 케이스
    assert not _has_korean("English only text"), "영문만 텍스트 오감지"
    assert not _has_korean("1234567890"), "숫자만 텍스트 오감지"
    assert not _has_korean("Special chars: !@#$%^&*()"), "특수문자만 텍스트 오감지"
    assert not _has_korean("日本語テスト"), "일본어 텍스트 오감지"

    print("  ✅ 한글 감지 8개 케이스 모두 통과")


# ============================================================
# 메인 실행
# ============================================================
def main():
    print("=" * 60)
    print("PDF Report Templates v2.0 — 자체 테스트")
    print("=" * 60)

    tests = [
        test_skill_md,
        test_krgov_pdf,
        test_usdod_pdf,
        test_md_parser,
        test_converter_krgov,
        test_converter_usdod,
        test_korean_detection,
    ]
    passed = 0
    failed = 0

    for test_fn in tests:
        try:
            test_fn()
            passed += 1
        except Exception as e:
            failed += 1
            print(f"  ❌ 실패: {e}")
            traceback.print_exc()

    # 결과 요약
    print("\n" + "=" * 60)
    print(f"결과: {passed} 통과 / {failed} 실패 (총 {len(tests)}건)")
    print("=" * 60)

    # 부산물 정리
    print("\n[CLEANUP] 테스트 부산물 삭제 중...")
    cleanup()
    print("  ✅ 정리 완료")

    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
