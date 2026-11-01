export const DEFAULT_STUDENT_AVATAR = "data:image/svg+xml;utf8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <linearGradient id="studentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0d9488"/>
      <stop offset="55%" stop-color="#0f766e"/>
      <stop offset="100%" stop-color="#0b192c"/>
    </linearGradient>
    <linearGradient id="capGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="64" fill="url(#studentGrad)"/>
  <!-- Student Silhouette -->
  <circle cx="64" cy="52" r="21" fill="#ffffff" fill-opacity="0.96"/>
  <path d="M28 112 C30 84, 44 76, 64 76 C84 76, 98 84, 100 112 Z" fill="#ffffff" fill-opacity="0.96"/>
  <!-- Collegiate Academic Cap (Mortarboard) -->
  <polygon points="64,19 100,32 64,45 28,32" fill="url(#capGrad)"/>
  <polygon points="64,22 95,32 64,42 33,32" fill="#334155"/>
  <path d="M46 38 L46 48 C46 54 82 54 82 48 L82 38 Z" fill="url(#capGrad)"/>
  <!-- Gold Tassel -->
  <circle cx="64" cy="32" r="3" fill="#f59e0b"/>
  <path d="M64 32 Q80 35 88 47" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
  <circle cx="88" cy="48" r="2.5" fill="#f59e0b"/>
  <!-- Verified Student Badge (College Teal) -->
  <circle cx="94" cy="94" r="16" fill="#0d9488" stroke="#ffffff" stroke-width="2.5"/>
  <polygon points="94,84 97,91 104,91 98.5,95.5 100.5,102 94,98 87.5,102 89.5,95.5 84,91 91,91" fill="#ffffff"/>
</svg>
`.trim());

export const DEFAULT_ADMIN_AVATAR = "data:image/svg+xml;utf8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <linearGradient id="adminGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e3a8a"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="64" fill="url(#adminGrad)"/>
  <circle cx="64" cy="46" r="22" fill="#ffffff" fill-opacity="0.95"/>
  <path d="M28 110 C30 82, 44 74, 64 74 C84 74, 98 82, 100 110 Z" fill="#ffffff" fill-opacity="0.95"/>
  <polygon points="64,74 59,88 64,108 69,88" fill="#1e3a8a"/>
  <circle cx="94" cy="94" r="16" fill="#f59e0b" stroke="#ffffff" stroke-width="2.5"/>
  <path d="M94 85 L101 90 L101 98 C101 102 94 105 94 105 C94 105 87 102 87 98 L87 90 Z" fill="#ffffff"/>
  <path d="M91 95 L93.5 97.5 L97.5 92" stroke="#f59e0b" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`.trim());
