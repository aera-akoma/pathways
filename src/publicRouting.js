export const PUBLIC_PATHS = { home: '/', about: '/about', contact: '/contact', privacy: '/privacy-policy', 'why-us': '/why-us' };
export const isPublicPage = page => Object.hasOwn(PUBLIC_PATHS, page);
export function resolveLoginDestination(route, role) {
  if (isPublicPage(route.page) || ['login', 'signup'].includes(route.page)) return 'dashboard';
  if (route.role === 'admin' && role !== 'admin') return 'dashboard';
  return route.page || 'dashboard';
}
