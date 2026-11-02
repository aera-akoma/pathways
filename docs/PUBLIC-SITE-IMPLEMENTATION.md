# Public website: review, implementation and verification

## Existing app review
The app is a React SPA with a custom browser-history/hash router, PHP API, MySQL-backed accounts and course activity, browser-cached state, and cookie-based sessions. The main entry is src/main.jsx. Auth.jsx supplies the existing student/admin portal and registration. Existing workspace pages cover course enrollment, projects, certificates, profile settings, readiness, roadmaps, career passport and admin management. Styling uses navy, teal, light backgrounds and editorial serif headings.

Previously the root path mapped to dashboard and fell through to authentication for visitors. There was no public information layer. Root sitemap entries mixed public discovery with sign-in-only workspace links. Media routing lacked video MIME and byte-range delivery. In-page anchors were interpreted as legacy SPA routes.

## Added public layer
- / — homepage with hero imagery, platform introduction, feature cards, collaboration story, demo video and contact callout.
- /about — purpose, approach, values and guidance context.
- /why-us — connected learning, portfolio and career-development benefits.
- /contact — support details and a validated email-draft form; no website-side sending or fake confirmation.
- /privacy-policy — actual feature/data practices, local storage/cookies, external links and account-information contact.
- /login — preserved existing portal chooser; /signup opens existing student registration.

PublicApplication separates the public site from the existing workspace. Public pages do not need an API session. Signed-in visitors can still browse public pages; opening Login routes a validated session to its workspace. Successful authentication preserves private deep links while public/login/signup destinations resolve to dashboard. Expired cached sessions are cleared when the server responds401. HTML anchors on public pages no longer accidentally open authentication.

## Editing
- Public page markup/copy: src/PublicSite.jsx
- Navigation, feature copy and privacy sections: src/publicSiteContent.js
- Styling: src/public-site.css (scoped to public pages)
- Replaceable media URLs and credits: src/publicMedia.js
- Demo source files: public/media/
- Source/license notes: docs/PUBLIC-CONTENT-SOURCES.md

Existing logo is used in public header/footer. Login/Signup appears in the header only. Organization affiliation, history, addresses, statistics, partnerships and outcomes were not invented. Media is visibly labelled as illustrative. Review draft contact/privacy wording when final organizational details are available.

## Verified
- npm run build — PASS (existing large-bundle warning remains).
- node scripts/test-public-routing.mjs — public routes, auth destination rules, legacy hashes, public anchors and protected deep links PASS.
- node scripts/test-router.mjs — existing query/hash regression suite PASS.
- node scripts/test-public-http.mjs — seven public/auth routes200, local photo/video MIME, partial video delivery206, invalid range416 PASS.
- PHP router syntax PASS.
- Existing sidebar, profile-save and 54 admin mutation checks PASS during integration.
- Browser: all five public pages, active navigation, no footer login links, original portal chooser and registration visible.
- Browser video: controls present, readyState4, playing without media errors.
- Browser responsive checks: desktop1440px and mobile375px; no horizontal overflow, menu open/close and Escape dismissal PASS.
- Preview screenshots: outputs/public-homepage-desktop.png and outputs/public-homepage-mobile.png.

This task changes the local application; no hosting deployment or real email was sent. This review covered public-site integration and related routing, not a new exhaustive security audit of every existing workspace feature.
