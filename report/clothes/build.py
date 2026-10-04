"""Generate all clothes pages from data.json and shared HTML templates."""
import json
import math
import re
from datetime import date
from html import escape
from pathlib import Path
from string import Template
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent
DEFAULT_FIELDS = [
    {'key': 'shoulder', 'label': '어깨'},
    {'key': 'chest', 'label': '가슴단면'},
    {'key': 'sleeve', 'label': '소매길이'},
    {'key': 'length', 'label': '총기장'},
    {'key': 'hem', 'label': '밑단단면'},
]
VARIANTS = [
    ('static-desktop.html', '정적 · PC'),
    ('static-mobile.html', '정적 · 모바일'),
    ('interactive-desktop.html', '인터랙티브 · PC'),
    ('interactive-mobile.html', '인터랙티브 · 모바일'),
]


def e(value):
    return escape(str(value), quote=True)


def render(template, **values):
    html = Template((ROOT / 'templates' / template).read_text(encoding='utf-8')).substitute(values)
    return '\n'.join(line.rstrip() for line in html.splitlines()) + '\n'


def validate(items):
    """Reject ambiguous IDs, labels and invalid measurements before writing pages."""
    if not isinstance(items, list) or not items:
        raise ValueError('data.json에는 하나 이상의 의류 항목이 필요합니다.')
    ids = set()
    brand_names = {}
    for item in items:
        for key in ('id', 'brandId', 'name', 'model', 'website', 'source', 'sourceNote', 'checked'):
            if not isinstance(item.get(key), str) or not item[key].strip():
                raise ValueError(f'{key}: 비어 있지 않은 문자열이 필요합니다.')
        item_id = item['id']
        if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', item_id) or item_id in ids or item_id == 'all':
            raise ValueError(f'{item_id}: id는 고유한 영문 소문자·숫자·하이픈 조합이어야 합니다.')
        ids.add(item_id)
        brand_id = item['brandId']
        if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', brand_id) or brand_id == 'all':
            raise ValueError(f'{item_id}: brandId 형식이 잘못되었습니다.')
        if brand_id in brand_names and brand_names[brand_id] != item['name']:
            raise ValueError(f'{brand_id}: 같은 메이커 ID에는 같은 이름을 사용하세요.')
        brand_names[brand_id] = item['name']
        date.fromisoformat(item['checked'])
        for key in ('website', 'source', 'chartImage'):
            if item.get(key):
                url = urlsplit(item[key])
                if url.scheme not in ('https', 'http') or not url.netloc:
                    raise ValueError(f'{item_id}.{key}: http(s) URL이 필요합니다.')
        fields = item.get('fields', DEFAULT_FIELDS)
        if not isinstance(fields, list) or not fields:
            raise ValueError(f'{item_id}: 측정 항목이 필요합니다.')
        keys = set()
        for field in fields:
            key = field.get('key', '')
            if not re.fullmatch(r'[a-z][a-z0-9_]*', key) or key == 'size' or key in keys:
                raise ValueError(f'{item_id}: 측정 항목 key가 잘못되었거나 중복되었습니다.')
            if not isinstance(field.get('label'), str) or not field['label'].strip():
                raise ValueError(f'{item_id}.{key}: 측정 항목명이 필요합니다.')
            keys.add(key)
        if not isinstance(item.get('sizes'), list) or not item['sizes']:
            raise ValueError(f'{item_id}: 하나 이상의 사이즈가 필요합니다.')
        sizes = set()
        for row in item['sizes']:
            size = row.get('size')
            if not isinstance(size, str) or not size.strip() or size == 'all' or size in sizes:
                raise ValueError(f'{item_id}: 사이즈는 중복 없는 문자열이어야 합니다(all 예약어 제외).')
            sizes.add(size)
            for key, value in row.items():
                if key == 'size':
                    continue
                if key not in keys:
                    raise ValueError(f'{item_id}.{size}: 정의되지 않은 치수 {key}')
                if value is not None and (type(value) not in (int, float) or not math.isfinite(value) or value <= 0):
                    raise ValueError(f'{item_id}.{size}.{key}: 양수 또는 null만 입력하세요.')


def content(item, mobile, individual=False, item_href=''):
    fields = item.get('fields', DEFAULT_FIELDS)
    def value(row, key):
        return e(row[key]) if row.get(key) is not None else '—'
    rows = ''.join(
        f'<tr data-size="{e(row["size"])}"><th scope="row">{e(row["size"])}</th>'
        + ''.join(f'<td>{value(row, field["key"])}</td>' for field in fields) + '</tr>'
        for row in item['sizes']
    )
    cards = ''.join(
        f'<section class="card" data-size="{e(row["size"])}"><h3>{e(row["size"])}</h3><dl>'
        + ''.join(f'<div><dt>{e(field["label"])}</dt><dd>{value(row, field["key"])}</dd></div>' for field in fields)
        + '</dl></section>' for row in item['sizes']
    )
    image = (f'<a href="{e(item["chartImage"])}"><img class="chart" loading="lazy" src="{e(item["chartImage"])}" '
             f'alt="{e(item["name"])} {e(item["model"])} 사이즈 조견표"></a>') if item.get('chartImage') else ''
    links = (f'<div class="links"><a href="{e(item["website"])}" target="_blank" rel="noopener">메이커 홈페이지 ↗</a>'
             f'<a href="{e(item["source"])}" target="_blank" rel="noopener">{e(item.get("sourceLabel", "공식 사이즈 조견표"))} ↗</a></div>')
    note = f'<p class="meta">{e(item["sourceNote"])}</p>'
    checked = f'<p class="meta">확인일 {e(item["checked"])}</p>'
    if mobile:
        heading_info = '<span class="unit">단위 cm</span>'
        below = f'{links}{note}{image}{checked}'
    else:
        links = links.replace('</a><a', '</a><span aria-hidden="true">·</span><a')
        heading_info = f'<div class="brand-info">{links}{note}{checked}</div>'
        below = image
    measurement_note = f'<p class="meta measurement-note">{e(item["measurementNote"])}</p>' if item.get('measurementNote') else ''
    heading_tag = 'h1' if individual else 'h2'
    name = e(item['name'])
    if item_href:
        name = f'<a class="item-title-link" href="{e(item_href)}" title="개별 페이지 보기">{name}</a>'
    heading = f'<{heading_tag}>{name}</{heading_tag}>'
    return render('item.html', id=e(item['id']), brand_id=e(item['brandId']), heading=heading, model=e(item['model']),
                  table_label=e(f'{item["name"]} {item["model"]} 사이즈별 세부 치수'),
                  heading_info=heading_info,
                  columns=''.join(f'<th scope="col">{e(field["label"])}</th>' for field in fields),
                  rows=rows, cards=cards, measurement_note=measurement_note, below=below)


def write_views(items, destination, individual=False):
    destination.mkdir(parents=True, exist_ok=True)
    asset_prefix = '../../' if individual else ''
    title = f'{items[0]["name"]} · {items[0]["model"]}' if individual else '의류 사이즈 노트'
    size_options = list(dict.fromkeys(row['size'] for item in items for row in item['sizes']))
    for filename, label in VARIANTS:
        interactive = filename.startswith('interactive')
        mobile = 'mobile' in filename
        nav = ''.join(f'<a href="{name}"'+(' aria-current="page"' if name == filename else '')+f'>{text}</a>' for name, text in VARIANTS)
        nav += f'<a href="{asset_prefix}compare.html">사이즈 비교</a>'
        filters = ''
        if interactive:
            brands = {item['brandId']: item['name'] for item in items}
            brand_options = ''.join(f'<option value="{e(key)}">{e(name)}</option>' for key, name in brands.items())
            model_options = ''.join(f'<option value="{e(item["id"])}">{e(item["model"])}</option>' for item in items)
            filters = ('<div class="filters"><label>메이커<select id="brand">'
                       + ('' if individual else '<option value="all">전체 메이커</option>') + brand_options + '</select></label>'
                       '<label>모델<select id="model">'
                       + ('' if individual else '<option value="all">전체 모델</option>') + model_options + '</select></label>'
                       '<label>사이즈<select id="size"><option value="all">전체 사이즈</option>'
                       + ''.join(f'<option value="{e(size)}">{e(size)}</option>' for size in size_options) + '</select></label></div>')
        articles = ''.join(content(item, mobile, individual, '' if individual else
                          f'items/{item["id"]}/{filename}') for item in items)
        html = render('page.html', title=e(title), variant=e(label), asset_prefix=asset_prefix,
                      body_class=('mobile' if mobile else 'desktop') + (' item-page' if individual else ''),
                      back_href='../../' if individual else '../',
                      back_label='의류 목록' if individual else '목록',
                      page_header='' if individual else '<header><h1>의류 사이즈 노트</h1><p class="intro">메이커·모델별 사이즈 원표기와 세부 치수</p></header>',
                      nav=nav, filters=filters, articles=articles,
                      script=f'<script src="{asset_prefix}filter.js"></script>' if interactive else '')
        (destination / filename).write_text(html, encoding='utf-8')
    links = ''.join(f'<p><a href="{name}">{label}</a></p>' for name, label in VARIANTS)
    for filename, mode in [('index.html', 'static'), ('interactive.html', 'interactive')]:
        (destination / filename).write_text(render('redirect.html', title=e(title), asset_prefix=asset_prefix,
                                                   mode=mode, links=links), encoding='utf-8')


def write_comparison(items, output):
    options = ''
    for item in items:
        item_id = e(item['id'])
        options += (f'<div class="compare-option"><label class="compare-check" for="compare-{item_id}">'
                    f'<input type="checkbox" id="compare-{item_id}"><span><strong>{e(item["name"])}</strong>'
                    f'<small>{e(item["model"])}</small></span></label>'
                    f'<label class="compare-size-label" for="size-{item_id}">비교할 사이즈'
                    f'<select id="size-{item_id}" disabled aria-label="{e(item["name"])} {e(item["model"])} 사이즈">'
                    '<option value="">사이즈 선택</option>'
                    + ''.join(f'<option value="{e(row["size"])}">{e(row["size"])}</option>' for row in item['sizes'])
                    + '</select></label></div>')
    data = [{**item, 'fields': item.get('fields', DEFAULT_FIELDS)} for item in items]
    # Escape '<' so source text cannot terminate the inert JSON script element.
    payload = json.dumps(data, ensure_ascii=False).replace('<', '\\u003c')
    (output / 'compare.html').write_text(render('compare.html', options=options, data=payload), encoding='utf-8')


def build(data_path=ROOT / 'data.json', output=ROOT):
    items = json.loads(Path(data_path).read_text(encoding='utf-8'))
    validate(items)
    output = Path(output)
    write_views(items, output)
    for item in items:
        write_views([item], output / 'items' / item['id'], individual=True)
    write_comparison(items, output)
    print(f'{len(items)}개 의류 항목: 공통 페이지 6개 + 비교 페이지 1개 + 개별 페이지 {len(items) * 6}개 생성')


if __name__ == '__main__':
    build()
