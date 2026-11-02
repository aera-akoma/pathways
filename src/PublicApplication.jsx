import React, { useEffect, useState } from 'react';
import PublicSite from './PublicSite.jsx';
import { isPublicPage } from './publicRouting.js';
import { parseCurrentLocation, pushRoute, updateDocumentTitle } from './router.js';

export function PublicApplication({ Workspace }) {
  const [route, setRoute] = useState(() => parseCurrentLocation());
  useEffect(() => {
    const sync = () => setRoute(parseCurrentLocation());
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    window.addEventListener('podar-route-change', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('podar-route-change', sync);
    };
  }, []);
  useEffect(() => {
    updateDocumentTitle(route.page);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = 'https://podarpathways.com' + (window.location.pathname || '/');
    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) { robots = document.createElement('meta'); robots.name = 'robots'; document.head.appendChild(robots); }
    robots.content = isPublicPage(route.page) ? 'index, follow' : 'noindex, nofollow';
  }, [route.page]);
  const navigate = page => { pushRoute(page); window.scrollTo({ top: 0, behavior: 'auto' }); };
  return isPublicPage(route.page) ? <PublicSite page={route.page} navigate={navigate} /> : <Workspace />;
}
