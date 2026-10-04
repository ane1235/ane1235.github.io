const brandSelect = document.querySelector('#brand');
const modelSelect = document.querySelector('#model');
const sizeSelect = document.querySelector('#size');
const articles = [...document.querySelectorAll('.brand')];
const individual = document.body.classList.contains('item-page');

function matchingModels() {
  return articles.filter(item => brandSelect.value === 'all' || item.dataset.brand === brandSelect.value);
}
function updateModels() {
  modelSelect.replaceChildren();
  if (!individual) modelSelect.add(new Option('전체 모델', 'all'));
  for (const item of matchingModels()) modelSelect.add(new Option(item.dataset.modelName, item.dataset.item));
}
function updateSizes() {
  const sizes = new Set();
  for (const item of matchingModels()) {
    if (modelSelect.value !== 'all' && item.dataset.item !== modelSelect.value) continue;
    for (const row of item.querySelectorAll('tbody tr')) sizes.add(row.dataset.size);
  }
  sizeSelect.replaceChildren(new Option('전체 사이즈', 'all'));
  for (const size of sizes) sizeSelect.add(new Option(size, size));
}
function filter() {
  for (const item of articles) {
    item.hidden = (brandSelect.value !== 'all' && item.dataset.brand !== brandSelect.value)
      || (modelSelect.value !== 'all' && item.dataset.item !== modelSelect.value);
    for (const row of item.querySelectorAll('[data-size]')) {
      row.hidden = sizeSelect.value !== 'all' && row.dataset.size !== sizeSelect.value;
    }
    item.querySelector('.empty').hidden = [...item.querySelectorAll('tbody tr')].some(row => !row.hidden);
  }
}
brandSelect.addEventListener('change', () => { updateModels(); updateSizes(); filter(); });
modelSelect.addEventListener('change', () => { updateSizes(); filter(); });
sizeSelect.addEventListener('change', filter);
updateModels();
updateSizes();
filter();
