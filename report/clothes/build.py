"""CSV is the source. Generate only JSON, Markdown, a static table and fixed legacy redirects."""
import argparse
import csv
import json
import math
import re
from datetime import date
from html import escape
from pathlib import Path
from string import Template
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent
FIELD_LABELS = {'shoulder':'어깨', 'chest':'가슴단면', 'sleeve':'소매길이',
                'length':'총기장', 'hem':'밑단단면', 'waist':'허리단면',
                'hip':'엉덩이단면', 'thigh':'허벅지단면', 'rise':'밑위', 'inseam':'안쪽기장', 'back_neck_sleeve':'화장(뒷목~소매 끝)'}
DEFAULT_FIELDS = [{'key':key, 'label':FIELD_LABELS[key]} for key in ('shoulder','chest','sleeve','length','hem')]
MODEL_KEYS = dict(zip(
    ['model_id','brand_id','brand_name','model_name','checked_at','brand_url','model_url','chart_url',
     'source_label','source_note','measurement_note','chart_image_url','requested_url','requested_status','crosscheck_url','crosscheck_chart_url'],
    ['id','brandId','name','model','checked','website','modelUrl','source','sourceLabel','sourceNote','measurementNote',
     'chartImage','requestedSource','requestedSourceStatus','crossCheckSource','crossCheckChart']))


def e(value):
    return escape(str(value), quote=True)


def render(template, **values):
    text = Template((ROOT / 'templates' / template).read_text(encoding='utf-8')).substitute(values)
    return '\n'.join(line.rstrip() for line in text.splitlines()) + '\n'


def size_label(row):
    return row['size'] + (f" ({row['alias']})" if row.get('alias') else '')


def read_csv(path, required, allowed):
    with path.open(encoding='utf-8-sig', newline='') as f:
        reader = csv.DictReader(f, strict=True)
        headers = reader.fieldnames or []
        if len(headers) != len(set(headers)) or not required <= set(headers) or set(headers) - allowed:
            raise ValueError(f'{path.name}: 필수 열 누락, 중복 열 또는 정의되지 않은 열')
        rows = []
        for number, row in enumerate(reader, 2):
            if None in row or any(value is None for value in row.values()):
                raise ValueError(f'{path.name}:{number}: 열 개수 불일치')
            rows.append({key:value.strip() for key,value in row.items()})
        return rows


def valid_id(value):
    return value != 'all' and re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', value)


def load_csv(source):
    model_rows = read_csv(source/'models.csv', set(MODEL_KEYS) | {'measurements'}, set(MODEL_KEYS) | {'measurements'})
    sizes = read_csv(source/'sizes.csv', {'model_id','size'}, {'model_id','size','size_alias','alias_note'} | set(FIELD_LABELS))
    if not model_rows:
        raise ValueError('models.csv: 하나 이상의 모델 필요')
    models = {}; brands = {}
    for row in model_rows:
        item = {key:row[column] for column,key in MODEL_KEYS.items()}
        for key in ('id','brandId','name','model','checked','website','modelUrl','source','sourceLabel'):
            if not item[key]: raise ValueError(f"{row['model_id']}: {key} 필수")
        if not valid_id(item['id']) or not valid_id(item['brandId']) or item['id'] in models:
            raise ValueError('중복 또는 잘못된 모델·메이커 ID')
        if item['brandId'] in brands and brands[item['brandId']] != (item['name'],item['website']):
            raise ValueError('같은 메이커 ID의 이름·링크가 서로 다름')
        brands[item['brandId']] = (item['name'],item['website'])
        if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', item['checked']): raise ValueError('조회일자는 YYYY-MM-DD')
        date.fromisoformat(item['checked'])
        for key in ('website','modelUrl','source','chartImage','requestedSource','crossCheckSource','crossCheckChart'):
            if item[key]:
                url = urlsplit(item[key])
                if url.scheme not in ('https','http') or not url.netloc: raise ValueError(f'{key}: http(s) URL 필요')
        fields = row['measurements'].split('|')
        if len(set(fields)) != len(fields) or any(key not in FIELD_LABELS for key in fields):
            raise ValueError('measurements: 정의된 측정 항목을 |로 구분하여 입력')
        item['fields'] = [{'key':key,'label':FIELD_LABELS[key]} for key in fields]
        item['chartImage'] = item['chartImage'] or None
        item['sizes'] = []
        models[item['id']] = item
    seen = set()
    for row in sizes:
        item = models.get(row['model_id'])
        if not item: raise ValueError(f"sizes.csv: 미등록 모델 {row['model_id']}")
        key = (item['id'],row['size'])
        if not row['size'] or row['size'] == 'all' or key in seen: raise ValueError('비어 있거나 중복된 사이즈')
        seen.add(key)
        values = {'size':row['size']}
        if row.get('size_alias'): values.update(alias=row['size_alias'],aliasNote=row.get('alias_note',''))
        defined = {field['key'] for field in item['fields']}
        for field in FIELD_LABELS:
            raw = row.get(field,'')
            if not raw: continue
            if field not in defined: raise ValueError(f'{key}: 모델에서 정의하지 않은 치수 {field}')
            number = float(raw)
            if not math.isfinite(number) or number <= 0: raise ValueError(f'{key}.{field}: 양수 또는 빈칸만 허용')
            values[field] = int(number) if number.is_integer() else number
        item['sizes'].append(values)
    if any(not item['sizes'] for item in models.values()): raise ValueError('치수 행이 없는 모델')
    return list(models.values())


def content(item, mobile, individual=False, item_href=''):
    fields = item.get('fields', DEFAULT_FIELDS)
    def value(row, key):
        return e(row[key]) if row.get(key) is not None else '—'
    rows = ''.join(
        f'<tr data-size="{e(row["size"])}"><th scope="row">{e(size_label(row))}</th>'
        + ''.join(f'<td>{value(row, field["key"])}</td>' for field in fields) + '</tr>'
        for row in item['sizes']
    )
    cards = ''.join(
        f'<section class="card" data-size="{e(row["size"])}"><h3>{e(size_label(row))}</h3><dl>'
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
    return render('item.html', id=e(item['id']), brand_id=e(item['brandId']), heading=heading, model=e(item['model']), model_text=f'<a href="{e(item["modelUrl"])}" target="_blank" rel="noopener">{e(item["model"])}</a>',
                  table_label=e(f'{item["name"]} {item["model"]} 사이즈별 세부 치수'),
                  heading_info=heading_info,
                  columns=''.join(f'<th scope="col">{e(field["label"])}</th>' for field in fields),
                  rows=rows, cards=cards, measurement_note=measurement_note, below=below)


def md(value):
    return e(value or '').replace('|','&#124;').replace('\r\n','<br>').replace('\n','<br>')


def database_markdown(items):
    lines = ['# 의류 데이터베이스', '', '> 자동 생성 문서. models.csv와 sizes.csv에서 수정 후 build.py 실행.', '',
             '## 데이터 정의', '', '| 파일 | 한 행의 단위 | 연결 키 |', '|---|---|---|',
             '| models.csv | 모델 하나 | model_id |', '| sizes.csv | 모델의 사이즈 하나 | model_id + size |', '',
             '- 치수 단위: cm. 빈칸: 미제공. 사이즈·별칭은 문자열로 보존.',
             '- 메이커 ID 공유 가능. 모델 ID는 고유하며 URL에 사용.',
             '- 어깨·가슴단면·소매길이만 대응 후보 계산에 사용. 총기장 등은 원본 치수로 보존.',
             '- 사이즈 별칭은 동일 제품의 표기. 다른 메이커 사이즈와의 공식 대응을 뜻하지 않음.', '',
             '## 모델 정보', '', '| 모델ID | 메이커 | 모델 | 조회일자 | 메이커링크 | 모델링크 | 조견표링크 |', '|---|---|---|---|---|---|---|']
    for item in items:
        cells = [item['id'],item['name'],item['model'],item['checked']]
        links = [f'[{label}]({item[key]})' for key,label in [('website','메이커'),('modelUrl','모델'),('source','조견표')]]
        lines.append('| '+' | '.join([md(v) for v in cells]+links)+' |')
    for item in items:
        lines += ['', f'## {md(item["name"])} · {md(item["model"])}', '',
                  '| 사이즈 | 별칭 | '+' | '.join(md(f['label']) for f in item['fields'])+' |',
                  '|---|---|'+'---|'*len(item['fields'])]
        for row in item['sizes']:
            lines.append('| '+' | '.join([md(row['size']),md(row.get('alias'))]+[md(str(row.get(f['key'],'—'))) for f in item['fields']])+' |')
        lines += ['', f'- 출처: {md(item["sourceNote"])}']
        for key,label in [('measurementNote','측정 안내'),('requestedSource','요청 링크'),('requestedSourceStatus','요청 링크 확인 상태'),('crossCheckSource','교차검증 링크'),('crossCheckChart','교차검증 이미지')]:
            if item.get(key): lines.append(f'- {label}: {md(item[key])}')
        for row in item['sizes']:
            if row.get('aliasNote'): lines.append(f'- {md(row["size"])} 별칭 근거: {md(row["aliasNote"])}')
    return '\n'.join(lines)+'\n'


def redirect_page(target):
    # Fixed compatibility files only. No new model pages are generated.
    return ('<!doctype html><html lang="ko"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1">'
            f'<meta http-equiv="refresh" content="0;url={e(target)}">'
            '<title>의류 사이즈 노트로 이동</title></head><body>'
            f'<p><a href="{e(target)}">의류 사이즈 노트 열기</a></p>'
            f'<script>location.replace({json.dumps(target)}+location.hash);</script></body></html>\n')


def build(source=ROOT, output=ROOT):
    source,output = Path(source),Path(output)
    items = load_csv(source)  # Validate every source row before writing any artifact.
    articles = ''.join(content(item, False, item_href=f'index.html?model={item["id"]}') for item in items)
    static = render('page.html', title='의류 사이즈 노트', variant='정적 전체표', asset_prefix='',
                    body_class='desktop static-page', back_href='../', back_label='목록',
                    page_header='<header><h1>의류 사이즈 노트 · 전체표</h1></header>',
                    nav='<a href="index.html">치수 조회</a><a href="compare.html">사이즈 비교</a><a href="static.html" aria-current="page">정적 전체표</a>',
                    filters='', articles=articles, script='')
    files = {'data.json':json.dumps(items,ensure_ascii=False,indent=2)+'\n',
             'DATABASE.md':database_markdown(items), 'static.html':static}
    for name in ('interactive.html','interactive-desktop.html','interactive-mobile.html'):
        files[name] = redirect_page('index.html')
    for name in ('static-desktop.html','static-mobile.html'):
        files[name] = redirect_page('static.html')
    # This manifest lists old published IDs; it never grows when CSV rows are added.
    legacy = json.loads((ROOT/'legacy-models.json').read_text())
    for item_id in legacy:
        if not valid_id(item_id): raise ValueError('잘못된 이전 모델 ID')
        for name in ('index.html','interactive.html','static-desktop.html','static-mobile.html','interactive-desktop.html','interactive-mobile.html'):
            files[f'items/{item_id}/{name}'] = redirect_page(f'../../index.html?model={item_id}')
    for name,text in files.items():
        path=output/name;path.parent.mkdir(parents=True,exist_ok=True);path.write_text(text,encoding='utf-8')
    print(f'{len(items)}개 모델 · {sum(len(item["sizes"]) for item in items)}개 사이즈: JSON·Markdown·정적 전체표 생성')
    return items


if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source',type=Path,default=ROOT)
    parser.add_argument('--output',type=Path,default=ROOT)
    args=parser.parse_args()
    build(args.source,args.output)
