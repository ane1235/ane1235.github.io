"""Update data.json, then run python3 report/clothes/build.py from any directory."""
import json
from pathlib import Path
from html import escape
ROOT = Path(__file__).resolve().parent
brands = json.loads((ROOT / 'data.json').read_text())
e = lambda v: escape(str(v), quote=True)
fields = [('shoulder','어깨'),('chest','가슴단면'),('sleeve','소매길이'),('length','총기장'),('hem','밑단단면')]

def content(b):
    rows = ''.join('<tr data-size="'+e(s['size'])+'"><th scope="row">'+e(s['size'])+'</th>'+''.join('<td>'+e(s.get(k,'—'))+'</td>' for k,_ in fields)+'</tr>' for s in b['sizes'])
    cards = ''.join('<section class="card" data-size="'+e(s['size'])+'"><h3>'+e(s['size'])+'</h3><dl>'+''.join('<div><dt>'+label+'</dt><dd>'+e(s.get(k,'—'))+'</dd></div>' for k,label in fields)+'</dl></section>' for s in b['sizes'])
    image = '<a href="'+e(b['chartImage'])+'"><img class="chart" loading="lazy" src="'+e(b['chartImage'])+'" alt="'+e(b['name'])+' 공식 사이즈 조견표"></a>' if b.get('chartImage') else ''
    return f'''<article class="brand" data-brand="{e(b['id'])}"><div class="brand-head"><div><h2>{e(b['name'])}</h2><p class="model">기준 모델 · {e(b['model'])}</p></div><span class="unit">단위 cm</span></div><div class="table-wrap"><table aria-label="{e(b['name'])} 사이즈별 세부 치수"><thead><tr><th scope="col">사이즈</th>{''.join('<th scope="col">'+label+'</th>' for _,label in fields)}</tr></thead><tbody>{rows}</tbody></table></div><div class="cards">{cards}</div><p class="empty" hidden>등록된 치수가 없습니다.</p><div class="links"><a href="{e(b['website'])}" target="_blank" rel="noopener">메이커 홈페이지 ↗</a><a href="{e(b['source'])}" target="_blank" rel="noopener">공식 사이즈 조견표 ↗</a></div><p class="meta">{e(b['sourceNote'])}</p>{image}<p class="meta">확인일 {e(b['checked'])}</p></article>'''

variants = [('static-desktop.html','정적 · PC'),('static-mobile.html','정적 · 모바일'),('interactive-desktop.html','인터랙티브 · PC'),('interactive-mobile.html','인터랙티브 · 모바일')]
for filename,label in variants:
    interactive = filename.startswith('interactive')
    nav = ''.join(f'<a href="{name}"'+(' aria-current="page"' if name == filename else '')+f'>{title}</a>' for name,title in variants)
    filters = '<div class="filters"><label>메이커<select id="brand"><option value="all">전체 메이커</option>'+''.join(f'<option value="{e(b["id"])}">{e(b["name"])}</option>' for b in brands)+'</select></label><label>사이즈<select id="size"><option value="all">전체 사이즈</option>'+''.join(f'<option value="{s}">{s}</option>' for s in ['95','100','105','110'])+'</select></label></div>' if interactive else ''
    html = f'''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>의류 사이즈 노트 · {label}</title><link rel="stylesheet" href="style.css"></head><body class="{'mobile' if 'mobile' in filename else 'desktop'}"><main><a class="back" href="../">← 목록</a><header><h1>의류 사이즈 노트</h1><p class="intro">메이커별로 모아 보는 95 · 100 · 105 · 110 치수</p></header><nav class="nav" aria-label="보기 방식">{nav}</nav>{filters}{''.join(content(b) for b in brands)}<footer>치수는 메이커·모델에 따라 다릅니다. 가슴과 밑단은 둘레가 아닌 단면 너비입니다.</footer></main>{'<script src="filter.js"></script>' if interactive else ''}</body></html>'''
    (ROOT / filename).write_text(html)
for filename,mode in [('index.html','static'),('interactive.html','interactive')]:
    links=''.join(f'<p><a href="{name}">{label}</a></p>' for name,label in variants)
    (ROOT / filename).write_text(f'''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>의류 사이즈 노트</title><link rel="stylesheet" href="style.css"><script>location.replace('{mode}-'+(matchMedia('(max-width: 767px)').matches?'mobile':'desktop')+'.html'+location.hash);</script></head><body><main><h1>의류 사이즈 노트</h1><p>화면에 맞는 보기로 이동합니다. 직접 선택할 수도 있습니다.</p>{links}</main></body></html>''')
