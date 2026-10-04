import {loadData, sizeLabel} from './data-loader.js';
let items = [];
const picker = document.querySelector('.compare-picker');
const referenceSelect = document.querySelector('#reference-item');
const suggestButton = document.querySelector('#suggest-sizes');
const result = document.querySelector('#comparison-result');
const status = document.querySelector('#comparison-status');
const head = document.querySelector('#comparison-table thead');
const body = document.querySelector('#comparison-table tbody');
const notes = document.querySelector('#comparison-notes');
const suggested = new Map();
const measurements = [
  {key: 'shoulder', label: '어깨'},
  {key: 'chest', label: '가슴단면'},
  {key: 'sleeve', label: '소매길이'},
];

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function format(value) { return String(Math.round(value * 100) / 100); }
function sizeSelect(item) { return document.getElementById(`size-${item.id}`); }
function checkedItems() { return items.filter(item => document.getElementById(`compare-${item.id}`).checked); }
function selectedSize(item) { return item.sizes.find(row => row.size === sizeSelect(item).value); }
function value(item, size, field) {
  // Never compare chest circumference to flat chest width, or unrelated garment fields.
  const compatible = item.fields.some(f => f.key === field.key && f.label === field.label);
  return compatible && Number.isFinite(size?.[field.key]) ? size[field.key] : null;
}
function score(reference, item, size) {
  let total = 0;
  for (const field of measurements) {
    const a = value(reference.item, reference.size, field);
    const b = value(item, size, field);
    if (a === null || b === null) return null;
    total += Math.abs(b - a);
  }
  return Math.round(total * 100) / 100;
}
function shoulderChest(item, size) {
  const a = value(item, size, measurements[0]);
  const b = value(item, size, measurements[1]);
  return a === null || b === null ? null : a + b;
}
function cellWithDelta(number, baseline, isReference) {
  const cell = element('td', number === null ? '—' : format(number));
  if (number !== null && baseline !== null && !isReference) {
    const difference = Math.round((number - baseline) * 100) / 100;
    cell.append(element('small', difference === 0 ? '차이 없음' : `${difference > 0 ? '+' : ''}${format(difference)}`, 'cell-delta'));
  }
  return cell;
}
function updateComparison() {
  const checked = checkedItems();
  const previousReference = referenceSelect.value;
  referenceSelect.replaceChildren();
  for (const item of checked) referenceSelect.add(new Option(`${item.name} · ${item.model}`, item.id));
  referenceSelect.disabled = checked.length === 0;
  if (checked.some(item => item.id === previousReference)) referenceSelect.value = previousReference;
  if (previousReference !== referenceSelect.value) suggested.clear();
  for (const item of items) sizeSelect(item).disabled = !checked.includes(item);
  const referenceItem = checked.find(item => item.id === referenceSelect.value);
  const reference = referenceItem ? {item: referenceItem, size: selectedSize(referenceItem)} : null;
  suggestButton.disabled = checked.length < 2 || !reference?.size;
  const selected = checked.map(item => ({item, size: selectedSize(item)})).filter(x => x.size);
  head.replaceChildren(); body.replaceChildren(); notes.replaceChildren();
  result.hidden = checked.length < 2 || selected.length !== checked.length;
  if (result.hidden) {
    status.textContent = checked.length < 2
      ? '비교할 메이커·모델을 2개 이상 선택하세요.'
      : '기준 메이커의 사이즈를 선택하고 ‘가까운 대응 사이즈 찾기’를 누르세요. 각 사이즈를 직접 선택해도 됩니다.';
    return;
  }
  status.textContent = `${selected.length}개 메이커·모델 비교 · 기준 ${reference.item.name} ${reference.size.size}`;
  const headingRow = element('tr');
  const corner = element('th', '측정 항목'); corner.scope = 'col'; headingRow.append(corner);
  for (const {item, size} of selected) {
    const cell = element('th'); cell.scope = 'col';
    const isReference = item.id === reference.item.id;
    const mode = isReference ? '기준' : suggested.has(item.id) ? '대응 후보' : '직접 선택';
    cell.append(element('strong', item.name), element('span', item.model, 'compare-model'), element('span', `${mode} ${sizeLabel(size)}`, 'compare-size'));
    headingRow.append(cell);
    const note = element('p', undefined, 'meta');
    const link = element('a', `${item.name} · ${item.model} 원본 치수표 ↗`);
    link.href = item.source; link.target = '_blank'; link.rel = 'noopener';
    note.append(link, document.createTextNode(` · 확인일 ${item.checked}`));
    if (item.measurementNote) note.append(element('span', item.measurementNote, 'compare-note'));
    const ranking = suggested.get(item.id);
    if (ranking) {
      const best = ranking[0];
      let explanation = `가장 가까운 후보 ${best.size.size} · 치수 차이 합계 ${format(best.score)}cm`;
      if (ranking[1]) explanation += ` / 다음 후보 ${ranking[1].size.size} ${format(ranking[1].score)}cm${ranking[1].score === best.score ? ' (동률)' : ''}`;
      note.append(element('span', explanation, 'compare-note'));
    }
    notes.append(note);
  }
  head.append(headingRow);
  for (const field of measurements) {
    const row = element('tr'); const label = element('th', field.label); label.scope = 'row'; row.append(label);
    const baseline = value(reference.item, reference.size, field);
    for (const {item, size} of selected) row.append(cellWithDelta(value(item, size, field), baseline, item.id === reference.item.id));
    body.append(row);
  }
  const sumRow = element('tr'); const sumLabel = element('th', '어깨+가슴 합계'); sumLabel.scope = 'row'; sumRow.append(sumLabel);
  for (const {item, size} of selected) sumRow.append(cellWithDelta(shoulderChest(item, size), shoulderChest(reference.item, reference.size), item.id === reference.item.id));
  body.append(sumRow);
  const scoreRow = element('tr'); const scoreLabel = element('th', '치수 차이 합계'); scoreLabel.scope = 'row'; scoreRow.append(scoreLabel);
  for (const {item, size} of selected) {
    const difference = score(reference, item, size);
    scoreRow.append(element('td', difference === null ? '—' : format(difference)));
  }
  body.append(scoreRow);
}

picker.addEventListener('change', event => {
  if (event.target === referenceSelect || event.target.id === `size-${referenceSelect.value}`) suggested.clear();
  else if (event.target.id.startsWith('size-')) suggested.delete(event.target.id.slice(5));
  else if (event.target.id.startsWith('compare-')) suggested.delete(event.target.id.slice(8));
  updateComparison();
});
suggestButton.addEventListener('click', () => {
  const checked = checkedItems();
  const item = checked.find(entry => entry.id === referenceSelect.value);
  const reference = {item, size: selectedSize(item)};
  suggested.clear();
  const unavailable = [];
  for (const target of checked) {
    if (target.id === item.id) continue;
    const ranking = target.sizes.map(size => ({size, score: score(reference, target, size)}))
      .filter(candidate => candidate.score !== null).sort((a, b) => a.score - b.score);
    if (ranking.length) {
      sizeSelect(target).value = ranking[0].size.size;
      suggested.set(target.id, ranking);
    } else {
      sizeSelect(target).value = '';
      unavailable.push(target.name);
    }
  }
  updateComparison();
  if (unavailable.length) status.textContent = `${unavailable.join(', ')}: 세 치수 중 미제공 항목이 있어 자동 대응 후보를 계산할 수 없습니다.`;
});
async function initialize() {
  const retry = document.querySelector('#retry-load');
  retry.hidden = true;
  status.textContent = '치수 데이터를 불러오는 중입니다.';
  try {
    items = await loadData();
    const options = document.querySelector('.compare-options');
    options.replaceChildren();
    for (const item of items) {
      const card = element('div', undefined, 'compare-option');
      const label = element('label', undefined, 'compare-check');
      label.htmlFor = `compare-${item.id}`;
      const check = element('input'); check.type = 'checkbox'; check.id = label.htmlFor;
      const name = element('span'); name.append(element('strong', item.name), element('small', item.model));
      label.append(check, name);
      const sizeLabelNode = element('label', '비교할 사이즈', 'compare-size-label');
      sizeLabelNode.htmlFor = `size-${item.id}`;
      const select = element('select'); select.id = sizeLabelNode.htmlFor; select.disabled = true;
      select.setAttribute('aria-label', `${item.name} ${item.model} 사이즈`);
      select.add(new Option('사이즈 선택', ''));
      for (const row of item.sizes) select.add(new Option(sizeLabel(row), row.size));
      sizeLabelNode.append(select); card.append(label, sizeLabelNode); options.append(card);
    }
    picker.disabled = false;
    updateComparison();
  } catch (error) {
    status.textContent = '치수 데이터를 불러오지 못했습니다. 다시 시도하거나 정적 전체표를 이용하세요.';
    retry.hidden = false;
  }
}
document.querySelector('#retry-load').addEventListener('click', initialize);
initialize();
