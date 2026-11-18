export function normalizeSearchText(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim();
}

export function matchesSearchFields(record, query, fields) {
  const terms = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;

  const searchableText = fields.map(field => {
    const value = record?.[field];
    return Array.isArray(value) ? value.join(' ') : value;
  }).map(normalizeSearchText).join(' ');

  return terms.every(term => searchableText.includes(term));
}
