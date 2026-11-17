import { DEFAULT_STUDENT_AVATAR, DEFAULT_ADMIN_AVATAR } from './defaultAvatar.js';
export function getInitials(name = '') {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  return (Array.from(words[0])[0] + (words.length > 1 ? Array.from(words[words.length - 1])[0] : '')).toLocaleUpperCase();
}
export function getAvatarColor(name = '') {
  return '#1d4ed8';
}
export function initialsAvatar(name) {
  const initials = getInitials(name).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" rx="64" fill="${getAvatarColor(name)}"/><text x="64" y="66" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial,Helvetica,sans-serif" font-size="${getInitials(name).length > 2 ? 40 : 48}" font-weight="600">${initials}</text></svg>`);
}
export function hasUploadedAvatar(src) {
  if (typeof src !== 'string' || !src.trim()) return false;
  if (src === DEFAULT_STUDENT_AVATAR || src === DEFAULT_ADMIN_AVATAR) return false;
  return !src.startsWith('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d');
}
