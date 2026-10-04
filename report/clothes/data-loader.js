export async function loadData() {
  const response = await fetch(new URL('data.json', import.meta.url), {cache: 'no-cache'});
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const items = await response.json();
  if (!Array.isArray(items) || !items.length || items.some(item => !item.id || !Array.isArray(item.sizes) || !Array.isArray(item.fields))) {
    throw new Error('Invalid clothes data');
  }
  return items;
}
export function sizeLabel(row) {
  return row.size + (row.alias ? ` (${row.alias})` : '');
}
export function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
export function externalLink(text, href) {
  const link = element('a', text);
  link.href = href; link.target = '_blank'; link.rel = 'noopener';
  return link;
}
