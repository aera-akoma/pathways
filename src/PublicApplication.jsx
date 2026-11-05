import React, { useEffect, useState } from 'react';
import PublicSite from './PublicSite.jsx';
import { isPublicPage } from './publicRouting.js';
import { pageToPath, parseCurrentLocation, pushRoute, updateDocumentTitle } from './router.js';

export function PublicApplication({ Workspace }) {
  const [route, setRoute] = useState(() => parseCurrentLocation());
  const [dashboardHref, setDashboardHref] = useState(null);
  const publicPage = isPublicPage(route.page);

  useEffect(() => {
    if (!publicPage) return;
    let request;

    async function checkSession() {
      request?.abort();
      request = new AbortController();
      const { signal } = request;
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'same-origin',
          cache: 'no-store',
          signal,
        });
        const data = response.ok ? await response.json() : null;
        const role = data?.session?.role;
        const active = data?.authenticated && data.session?.id && ['student', 'admin'].includes(role);
        if (!signal.aborted) setDashboardHref(active ? pageToPath('dashboard', role) : null);
      } catch {
        if (!signal.aborted) setDashboardHref(null);
      }
    }

    function refreshRestoredPage(event) {
      if (event.persisted) checkSession();
    }

    checkSession();
    window.addEventListener('pageshow', refreshRestoredPage);
    return () => {
      request?.abort();
      window.removeEventListener('pageshow', refreshRestoredPage);
    };
  }, [publicPage]);
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
  return publicPage ? <PublicSite page={route.page} navigate={navigate} dashboardHref={dashboardHref} /> : <Workspace />;
}
