/**
 * Podar Pathways - Universal Client-Side Router
 * Provides clean HTML5 history URLs, deep-linking, hash fallback,
 * browser back/forward sync, and dynamic page titles.
 */

// Route to Title mapping
const PAGE_TITLES = {
  dashboard: 'Dashboard | Podar Pathways',
  courses: 'Course Catalog | Podar Pathways',
  projects: 'Student Projects | Podar Pathways',
  opportunities: 'Opportunities & Hackathons | Podar Pathways',
  internships: 'Internships Tracker | Podar Pathways',
  placements: 'Campus Placements | Podar Pathways',
  passport: 'Digital Career Passport | Podar Pathways',
  roadmap: 'Learning Roadmap | Podar Pathways',
  score: 'P-CARE Employability Score | Podar Pathways',
  resume: 'Resume Builder | Podar Pathways',
  coach: 'AI Career Coach | Podar Pathways',
  certificates: 'Certificates & Credentials | Podar Pathways',
  profile: 'Profile & Settings | Podar Pathways',
  notifications: 'Notifications | Podar Pathways',
  students: 'Student Directory | Podar Administration',
  admins: 'Administrators | Podar Administration',
  'admin-profile': 'Admin Profile | Podar Administration'
};

/**
 * Determine the base path if the app is hosted in a subdirectory
 */
export function getBasePath() {
  // If hosted at root '/', basePath is ''
  // If Vite base was configured or in a subpath, detect clean base
  const pathname = window.location.pathname;
  // If pathname ends with index.html, strip it
  if (pathname.endsWith('/index.html')) {
    return pathname.slice(0, -11).replace(/\/$/, '');
  }
  return '';
}

/**
 * Convert an internal page ID and optional role to a clean URL path
 */
export function pageToPath(page, role = 'student', params = {}) {
  if (!page) return '/';

  // Admin routes
  if (role === 'admin') {
    if (page === 'dashboard') return '/admin';
    if (page === 'students') return '/admin/students';
    if (page.startsWith('admin-student:')) {
      const id = page.slice(14);
      return `/admin/student/${encodeURIComponent(id)}`;
    }
    if (page === 'courses') return '/admin/courses';
    if (page === 'certificates') return '/admin/certificates';
    if (page === 'projects') return '/admin/projects';
    if (page === 'opportunities') return '/admin/opportunities';
    if (page === 'internships') return '/admin/internships';
    if (page === 'placements') return '/admin/placements';
    if (page === 'admins') return '/admin/admins';
    if (page === 'admin-profile') return '/admin/profile';
  }

  // Student & General routes
  if (page === 'dashboard') return '/dashboard';
  if (page === 'projects') {
    if (params?.project) {
      return `/projects?project=${encodeURIComponent(params.project)}`;
    }
    return '/projects';
  }
  if (page === 'courses') return '/courses';
  if (page === 'certificates') return '/certificates';
  if (page === 'opportunities') return '/opportunities';
  if (page === 'internships') return '/internships';
  if (page === 'placements') return '/placements';
  if (page === 'passport') return '/passport';
  if (page === 'roadmap') return '/roadmap';
  if (page === 'score') return '/score';
  if (page === 'resume') return '/resume';
  if (page === 'coach') return '/coach';
  if (page === 'profile') {
    if (params?.tab) {
      return `/profile?tab=${encodeURIComponent(params.tab)}`;
    }
    return '/profile';
  }
  if (page === 'notifications') return '/notifications';

  // Fallback for custom / legacy routes
  return `/${encodeURIComponent(page)}`;
}

/**
 * Parse the current browser location (pathname, hash, search) into page and params
 */
export function parseCurrentLocation(role = 'student') {
  if (typeof window === 'undefined') {
    return { page: 'dashboard', params: {}, rawPath: '/' };
  }

  let pathname = window.location.pathname;
  let search = window.location.search;
  let hash = window.location.hash;

  // 1. Check if hash routing is being used (e.g., #/projects or #projects or #/admin/students)
  if (hash && hash.length > 1) {
    const rawHash = hash.replace(/^#\/?/, '/');
    const hashSplit = rawHash.split('?');
    pathname = hashSplit[0] || '/';
    if (hashSplit[1]) {
      search = '?' + hashSplit[1];
    }
  }

  // Strip index.html and trailing slashes
  pathname = pathname.replace(/\/index\.html$/, '').replace(/\/+$/, '') || '/';

  // Parse URL search params
  const searchParams = new URLSearchParams(search);
  const params = {};
  for (const [k, v] of searchParams.entries()) {
    params[k] = v;
  }

  // 2. Direct query param override: ?project=123 -> projects
  if (params.project) {
    return {
      page: 'projects',
      params,
      rawPath: pathname,
      role
    };
  }

  // 2b. Direct query param override: ?page=courses
  if (params.page) {
    return {
      page: params.page,
      params,
      rawPath: pathname,
      role
    };
  }

  // 3. Admin routes match
  if (pathname === '/admin' || pathname === '/admin/dashboard') {
    return { page: 'dashboard', params, rawPath: pathname, role: 'admin' };
  }
  if (pathname === '/admin/students') {
    return { page: 'students', params, rawPath: pathname, role: 'admin' };
  }
  if (pathname.startsWith('/admin/student/')) {
    const studentId = decodeURIComponent(pathname.slice(15));
    return {
      page: `admin-student:${studentId}`,
      params: { ...params, studentId },
      rawPath: pathname,
      role: 'admin'
    };
  }
  if (pathname === '/admin/courses') {
    return { page: 'courses', params, rawPath: pathname, role: 'admin' };
  }
  if (pathname === '/admin/certificates') {
    return { page: 'certificates', params, rawPath: pathname, role: 'admin' };
  }
  if (pathname === '/admin/projects') {
    return { page: 'projects', params, rawPath: pathname, role: 'admin' };
  }
  if (pathname === '/admin/opportunities') {
    return { page: 'opportunities', params, rawPath: pathname, role: 'admin' };
  }
  if (pathname === '/admin/internships') {
    return { page: 'internships', params, rawPath: pathname, role: 'admin' };
  }
  if (pathname === '/admin/placements') {
    return { page: 'placements', params, rawPath: pathname, role: 'admin' };
  }
  if (pathname === '/admin/admins') {
    return { page: 'admins', params, rawPath: pathname, role: 'admin' };
  }
  if (pathname === '/admin/profile') {
    return { page: 'admin-profile', params, rawPath: pathname, role: 'admin' };
  }

  // 4. Student & General routes
  if (pathname === '/' || pathname === '/dashboard') {
    return { page: 'dashboard', params, rawPath: pathname, role };
  }
  if (pathname === '/projects') {
    return { page: 'projects', params, rawPath: pathname, role };
  }
  if (pathname.startsWith('/projects/')) {
    const projId = decodeURIComponent(pathname.slice(10));
    return {
      page: 'projects',
      params: { ...params, project: projId },
      rawPath: pathname,
      role
    };
  }
  if (pathname === '/courses') {
    return { page: 'courses', params, rawPath: pathname, role };
  }
  if (pathname === '/certificates') {
    return { page: 'certificates', params, rawPath: pathname, role };
  }
  if (pathname === '/opportunities') {
    return { page: 'opportunities', params, rawPath: pathname, role };
  }
  if (pathname === '/internships') {
    return { page: 'internships', params, rawPath: pathname, role };
  }
  if (pathname === '/placements') {
    return { page: 'placements', params, rawPath: pathname, role };
  }
  if (pathname === '/passport') {
    return { page: 'passport', params, rawPath: pathname, role };
  }
  if (pathname === '/roadmap') {
    return { page: 'roadmap', params, rawPath: pathname, role };
  }
  if (pathname === '/score') {
    return { page: 'score', params, rawPath: pathname, role };
  }
  if (pathname === '/resume') {
    return { page: 'resume', params, rawPath: pathname, role };
  }
  if (pathname === '/coach') {
    return { page: 'coach', params, rawPath: pathname, role };
  }
  if (pathname === '/profile') {
    return { page: 'profile', params, rawPath: pathname, role };
  }
  if (pathname === '/notifications') {
    return { page: 'notifications', params, rawPath: pathname, role };
  }

  // If path is a single token like /explore or /login
  const singleToken = pathname.replace(/^\//, '');
  if (singleToken) {
    return { page: singleToken, params, rawPath: pathname, role };
  }

  return { page: 'dashboard', params, rawPath: pathname, role };
}

/**
 * Update document title dynamically based on the current page
 */
export function updateDocumentTitle(page) {
  if (typeof document === 'undefined') return;
  if (page?.startsWith('admin-student:')) {
    document.title = 'Student Profile | Podar Administration';
    return;
  }
  document.title = PAGE_TITLES[page] || 'Podar Pathways - Career Operating System';
}

/**
 * Navigate to a page and synchronize the browser address bar & history state
 */
export function pushRoute(page, role = 'student', options = {}) {
  if (typeof window === 'undefined') return;

  const { replace = false, params = {}, keepSearch = false } = options;

  let targetPath = pageToPath(page, role, params);

  // If params are passed and not already in path
  const urlSearchParams = new URLSearchParams(keepSearch ? window.location.search : '');
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && !targetPath.includes(`${k}=`)) {
      urlSearchParams.set(k, v);
    }
  });

  const queryString = urlSearchParams.toString();
  if (queryString && !targetPath.includes('?')) {
    targetPath += `?${queryString}`;
  }

  // Check if hash mode is currently active
  const isHashMode = window.location.hash.startsWith('#/');
  const fullTargetUrl = isHashMode ? `#${targetPath}` : targetPath;

  const currentFull = isHashMode
    ? window.location.hash
    : (window.location.pathname + window.location.search);

  if (currentFull !== fullTargetUrl) {
    if (replace) {
      window.history.replaceState({ page, role, params }, '', fullTargetUrl);
    } else {
      window.history.pushState({ page, role, params }, '', fullTargetUrl);
    }
  }

  updateDocumentTitle(page);

  // Notify any active route subscribers
  window.dispatchEvent(
    new CustomEvent('podar-route-change', {
      detail: { page, role, params, url: fullTargetUrl }
    })
  );
}

/**
 * Get canonical shareable URL for a project
 */
export function getProjectShareUrl(projectId) {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  // If hash mode
  if (window.location.hash.startsWith('#/')) {
    return `${origin}/#/projects?project=${encodeURIComponent(projectId)}`;
  }
  return `${origin}/projects?project=${encodeURIComponent(projectId)}`;
}

