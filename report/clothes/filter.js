const brandSelect = document.querySelector('#brand');
const sizeSelect = document.querySelector('#size');
function filter() {
  for (const brand of document.querySelectorAll('.brand')) {
    brand.hidden = brandSelect.value !== 'all' && brand.dataset.brand !== brandSelect.value;
    for (const row of brand.querySelectorAll('[data-size]')) {
      row.hidden = sizeSelect.value !== 'all' && row.dataset.size !== sizeSelect.value;
    }
    const found = [...brand.querySelectorAll('tbody tr')].some(row => !row.hidden);
    brand.querySelector('.empty').hidden = found;
  }
}
brandSelect.addEventListener('change', filter);
sizeSelect.addEventListener('change', filter);
