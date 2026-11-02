export const PASSWORD_HINT = 'Use 8–72 characters with uppercase, lowercase, a number and a symbol.';
export function passwordError(value) {
  return typeof value === 'string' && new TextEncoder().encode(value).length <= 72 && value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /[0-9]/.test(value) && /[^A-Za-z0-9\s]/.test(value) ? '' : PASSWORD_HINT;
}
export function isValidCalendarDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= days[month - 1];
}
export function profileError(profile) {
  if (!String(profile?.goal || '').trim()) return 'Enter your target career goal.';
  if (!/^[0-9]{10}$/.test(String(profile?.phone || ''))) return 'Enter a valid 10-digit mobile number.';
  if (profile?.pinCode && !/^[0-9]{6}$/.test(profile.pinCode)) return 'Enter a valid 6-digit PIN code.';
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (profile?.dob && (!isValidCalendarDate(profile.dob) || profile.dob > today)) return 'Enter a valid date of birth in the past.';
  if (profile?.state && !profile?.district) return 'Select a district for your state.';
  for (const field of ['portfolioUrl', 'portfolio', 'github', 'linkedin']) {
    if (!profile?.[field]) continue;
    try { const url = new URL(profile[field].includes('://') ? profile[field] : 'https://' + profile[field]); if (!['http:', 'https:'].includes(url.protocol) || !url.hostname.includes('.')) throw Error(); } catch { return 'Enter a valid website address for ' + field + '.'; }
  }
  return '';
}
export function needsProfileCompletion(student) {
  return !student?.profileCompletedAt || !String(student.goal || '').trim() || !/^[0-9]{10}$/.test(String(student.phone || ''));
}
