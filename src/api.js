export async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || data?.message || `Request failed (${response.status}). Please try again.`);
  }
  if (response.status !== 204 && (data === null || typeof data !== 'object')) {
    throw new Error('The server returned an invalid response. Please refresh and check before retrying.');
  }
  return data;
}

export function requireRecord(data, key) {
  const record = data?.[key] || data;
  if (!record || typeof record !== 'object' || !record.id) {
    throw new Error('The server did not return the saved record. Please refresh and check before retrying.');
  }
  return record;
}
