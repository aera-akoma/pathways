// Default certificates data and SVG certificate generator for Podar Pathways
export function generateCertificateSVG({
  studentName = 'Student Name',
  programTitle = 'Certificate Program',
  credentialId = 'PODAR-CERT-2026',
  issueDate = new Date().toISOString().split('T')[0],
  verificationCode = 'PODAR-VERIF-78291',
  issuer = 'Podar Academic Board'
}) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 640" width="920" height="640">
    <defs>
      <linearGradient id="certBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="50%" stop-color="#fdfbf7"/>
        <stop offset="100%" stop-color="#f7f3e8"/>
      </linearGradient>
      <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#d97706"/>
        <stop offset="40%" stop-color="#fbbf24"/>
        <stop offset="80%" stop-color="#b45309"/>
        <stop offset="100%" stop-color="#78350f"/>
      </linearGradient>
      <linearGradient id="navy" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#1e3a8a"/>
      </linearGradient>
    </defs>
    <rect width="920" height="640" fill="url(#certBg)"/>
    <rect x="24" y="24" width="872" height="592" fill="none" stroke="#0f172a" stroke-width="4"/>
    <rect x="34" y="34" width="852" height="572" fill="none" stroke="url(#gold)" stroke-width="2.5"/>
    <rect x="42" y="42" width="836" height="556" fill="none" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="8 4"/>
    <circle cx="42" cy="42" r="12" fill="url(#gold)"/>
    <circle cx="878" cy="42" r="12" fill="url(#gold)"/>
    <circle cx="42" cy="598" r="12" fill="url(#gold)"/>
    <circle cx="878" cy="598" r="12" fill="url(#gold)"/>
    <g transform="translate(460, 90)">
      <circle cx="0" cy="0" r="28" fill="url(#navy)"/>
      <polygon points="0,-16 5,-5 16,-5 8,3 11,14 0,7 -11,14 -8,3 -16,-5 -5,-5" fill="url(#gold)"/>
    </g>
    <text x="460" y="145" text-anchor="middle" font-family="Georgia, serif" font-size="14" font-weight="bold" fill="#d97706" letter-spacing="5">PODAR PATHWAYS • CENTER OF CAREER EXCELLENCE</text>
    <text x="460" y="195" text-anchor="middle" font-family="Georgia, serif" font-size="34" font-weight="bold" fill="#0f172a" letter-spacing="2">CERTIFICATE OF ACHIEVEMENT</text>
    <line x1="310" y1="215" x2="610" y2="215" stroke="url(#gold)" stroke-width="2.5"/>
    <text x="460" y="255" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#64748b" letter-spacing="2">THIS CERTIFIES THAT</text>
    <text x="460" y="315" text-anchor="middle" font-family="Georgia, serif" font-size="36" font-weight="bold" fill="#1e3a8a">${escapeXml(studentName)}</text>
    <line x1="250" y1="332" x2="670" y2="332" stroke="#cbd5e1" stroke-width="1.5"/>
    <text x="460" y="365" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#64748b">HAS SUCCESSFULLY COMPLETED AND DEMONSTRATED PROFICIENCY IN</text>
    <text x="460" y="410" text-anchor="middle" font-family="Georgia, serif" font-size="24" font-weight="bold" fill="#0f172a">${escapeXml(programTitle)}</text>
    <text x="460" y="438" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#0d9488">Authorized Partner: ${escapeXml(issuer)}</text>
    <g transform="translate(180, 505)">
      <line x1="0" y1="0" x2="180" y2="0" stroke="#0f172a" stroke-width="1.5"/>
      <text x="90" y="22" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#0f172a">Academic Director</text>
      <text x="90" y="38" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#64748b">Podar Pathways Board</text>
    </g>
    <g transform="translate(460, 485)">
      <circle cx="0" cy="0" r="32" fill="#f8fafc" stroke="url(#gold)" stroke-width="3"/>
      <circle cx="0" cy="0" r="26" fill="none" stroke="#d97706" stroke-width="1" stroke-dasharray="4 2"/>
      <text x="0" y="-8" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="#b45309" letter-spacing="1">OFFICIAL</text>
      <text x="0" y="4" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#0f172a">SEAL</text>
      <text x="0" y="15" text-anchor="middle" font-family="Arial, sans-serif" font-size="7" fill="#64748b">VERIFIED</text>
    </g>
    <g transform="translate(560, 505)">
      <line x1="0" y1="0" x2="180" y2="0" stroke="#0f172a" stroke-width="1.5"/>
      <text x="90" y="22" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#0f172a">Issued: ${escapeXml(issueDate)}</text>
      <text x="90" y="38" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#64748b">Credential: ${escapeXml(credentialId)}</text>
    </g>
    <text x="460" y="580" text-anchor="middle" font-family="Courier, monospace" font-size="11" fill="#475569">Verification Code: ${escapeXml(verificationCode)} • Verify at podarpathways.edu</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function escapeXml(unsafe = '') {
  return String(unsafe).replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

// Initial Certificates: Empty by default so only real, verified certificates are listed
export const INITIAL_CERTIFICATES = [];
