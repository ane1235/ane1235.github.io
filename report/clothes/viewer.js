import {loadData, sizeLabel, element, externalLink} from './data-loader.js';
const brandSelect = document.querySelector('#brand');
const modelSelect = document.querySelector('#model');
const sizeSelect = document.querySelector('#size');
const container = document.querySelector('#items');
const message = document.querySelector('#load-status');
const retry = document.querySelector('#retry-load');
let items = [];
function modelsForBrand() { return items.filter(item => brandSelect.value === 'all' || item.brandId === brandSelect.value); }
function modelsForSelection() { return modelsForBrand().filter(item => modelSelect.value === 'all' || item.id === modelSelect.value); }
function fillModels() {
  modelSelect.replaceChildren(new Option('전체 모델', 'all'));
  for (const item of modelsForBrand()) modelSelect.add(new Option(item.model, item.id));
}
function fillSizes() {
  sizeSelect.replaceChildren(new Option('전체 사이즈', 'all'));
  const labels = new Map();
  for (const item of modelsForSelection()) for (const row of item.sizes) {
    if (!labels.has(row.size)) labels.set(row.size, new Set());
    if (row.alias) labels.get(row.size).add(row.alias);
  }
  for (const [size, aliases] of labels) sizeSelect.add(new Option(size + (aliases.size ? ` (${[...aliases].join(' / ')})` : ''), size));
}
function renderItem(item, single) {
  const article = element('article', undefined, 'brand');
  article.id = item.id; article.dataset.item = item.id; article.dataset.brand = item.brandId;
  const heading = element('div', undefined, 'brand-head');
  const left = element('div');
  const title = element(single ? 'h1' : 'h2');
  if (single) title.textContent = item.name;
  else {
    const link = element('a', item.name, 'item-title-link');
    link.href = `index.html?model=${encodeURIComponent(item.id)}`; title.append(link);
  }
  const model = element('p', '기준 모델 · ', 'model');
  model.append(externalLink(item.model, item.modelUrl)); left.append(title, model);
  const right = element('div', undefined, 'brand-info');
  const links = element('div', undefined, 'links');
  const dot = element('span', '·'); dot.setAttribute('aria-hidden', 'true');
  links.append(externalLink('메이커 홈페이지 ↗', item.website), dot, externalLink(`${item.sourceLabel} ↗`, item.source));
  right.append(links, element('p', item.sourceNote, 'meta'), element('p', `확인일 ${item.checked}`, 'meta'));
  heading.append(left, right); article.append(heading);
  const wrap = element('div', undefined, 'table-wrap');
  const table = element('table'); table.setAttribute('aria-label', `${item.name} ${item.model} 사이즈별 세부 치수`);
  const thead = element('thead'); const columns = element('tr');
  for (const label of ['사이즈', ...item.fields.map(field => field.label)]) { const cell = element('th', label); cell.scope = 'col'; columns.append(cell); }
  thead.append(columns); table.append(thead);
  const tbody = element('tbody'); const cards = element('div', undefined, 'cards');
  const rows = item.sizes.filter(row => sizeSelect.value === 'all' || row.size === sizeSelect.value);
  for (const row of rows) {
    const tr = element('tr'); tr.dataset.size = row.size;
    const th = element('th', sizeLabel(row)); th.scope = 'row'; tr.append(th);
    const card = element('section', undefined, 'card'); card.dataset.size = row.size;
    card.append(element('h3', sizeLabel(row))); const list = element('dl');
    for (const field of item.fields) {
      const value = row[field.key] == null ? '—' : String(row[field.key]);
      tr.append(element('td', value));
      const pair = element('div'); pair.append(element('dt', field.label), element('dd', value)); list.append(pair);
    }
    tbody.append(tr); card.append(list); cards.append(card);
  }
  table.append(tbody); wrap.append(table); article.append(wrap, cards);
  if (!rows.length) article.append(element('p', '선택한 사이즈의 등록 치수가 없습니다.', 'empty'));
  if (item.measurementNote) article.append(element('p', item.measurementNote, 'meta measurement-note'));
  if (item.chartImage) { const link = externalLink('', item.chartImage); const image = element('img', undefined, 'chart'); image.src = item.chartImage; image.alt = `${item.name} ${item.model} 사이즈 조견표`; image.loading = 'lazy'; link.append(image); article.append(link); }
  return article;
}
function renderSelection(notice = '') {
  const selected = modelsForSelection();
  document.querySelector('#collection-heading').hidden = selected.length === 1;
  document.body.classList.toggle('item-page', selected.length === 1);
  document.title = selected.length === 1 ? `${selected[0].name} · ${selected[0].model}` : '의류 사이즈 노트';
  container.replaceChildren(...selected.map(item => renderItem(item, selected.length === 1)));
  message.textContent = notice;
  message.hidden = !notice;
}
function writeURL() {
  const url = new URL(location.href);
  for (const [key, value] of [['brand',brandSelect.value],['model',modelSelect.value],['size',sizeSelect.value]]) {
    if (value === 'all') url.searchParams.delete(key); else url.searchParams.set(key,value);
  }
  history.pushState(null, '', url);
}
function restoreURL() {
  const params = new URLSearchParams(location.search);
  const modelId = params.get('model'); const item = items.find(item => item.id === modelId);
  const brandId = item?.brandId || params.get('brand') || 'all';
  brandSelect.value = [...brandSelect.options].some(option => option.value === brandId) ? brandId : 'all';
  fillModels();
  if (item) modelSelect.value = item.id;
  fillSizes();
  const size = params.get('size');
  const foundSize = size && [...sizeSelect.options].some(option => option.value === size);
  if (foundSize) sizeSelect.value = size;
  renderSelection(modelId && !item ? '등록되지 않은 모델입니다. 전체 목록에서 선택하세요.' : size && !foundSize ? '등록되지 않은 사이즈입니다. 선택한 모델의 전체 사이즈를 표시합니다.' : '');
}
brandSelect.addEventListener('change', () => { fillModels(); fillSizes(); renderSelection(); writeURL(); });
modelSelect.addEventListener('change', () => { fillSizes(); renderSelection(); writeURL(); });
sizeSelect.addEventListener('change', () => { renderSelection(); writeURL(); });
window.addEventListener('popstate', () => { if (items.length) restoreURL(); });
async function initialize() {
  retry.hidden = true; message.hidden = false; message.textContent = '치수 데이터를 불러오는 중입니다.';
  container.setAttribute('aria-busy', 'true');
  try {
    items = await loadData();
    brandSelect.replaceChildren(new Option('전체 메이커', 'all'));
    for (const [id,name] of new Map(items.map(item => [item.brandId,item.name]))) brandSelect.add(new Option(name,id));
    restoreURL(); document.querySelector('.viewer-filters').disabled = false;
  } catch (error) {
    message.textContent = '치수 데이터를 불러오지 못했습니다. 다시 시도하거나 정적 전체표를 이용하세요.';
    retry.hidden = false;
  } finally { container.setAttribute('aria-busy','false'); }
}
retry.addEventListener('click', initialize);
initialize();
