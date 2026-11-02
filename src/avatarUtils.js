import { DEFAULT_STUDENT_AVATAR, DEFAULT_ADMIN_AVATAR } from './defaultAvatar.js';
const COLORS = ['#0f766e','#1d4ed8','#7c3aed','#be185d','#b45309','#047857','#4338ca','#a21caf','#0369a1','#b91c1c'];
export function getInitials(name = '') {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  return (Array.from(words[0])[0] + (words.length > 1 ? Array.from(words[words.length - 1])[0] : '')).toLocaleUpperCase();
}
export function getAvatarColor(name = '') {
  let hash = 0;
  for (const letter of String(name).trim().toLocaleLowerCase()) hash = ((hash * 31) + letter.codePointAt(0)) >>> 0;
  return COLORS[hash % COLORS.length];
}
export function initialsAvatar(name) {
  const initials = getInitials(name).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" rx="64" fill="${getAvatarColor(name)}"/><text x="64" y="66" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial,Helvetica,sans-serif" font-size="${getInitials(name).length > 2 ? 40 : 48}" font-weight="600">${initials}</text></svg>`);
}
export function hasUploadedAvatar(src) {
  return typeof src === 'string' && src.trim() !== '' && src !== DEFAULT_STUDENT_AVATAR && src !== DEFAULT_ADMIN_AVATAR;
}
