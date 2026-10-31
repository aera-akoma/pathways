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

export const INITIAL_CERTIFICATES = [
  {
    id: 'cert-1792832322687',
    programId: 'prog-gcp-02',
    programTitle: 'Google Cloud Associate Cloud Engineer',
    studentId: 'student-demo',
    studentName: 'Student Demo',
    studentDepartment: 'BCA • Semester V',
    issuer: 'Google Cloud Platform',
    category: 'Cloud Computing',
    credentialId: 'GCP-ACE-2026-001',
    issueDate: '2026-10-24',
    status: 'verified',
    verificationCode: 'PODAR-VERIF-78291',
    verifiedBy: 'Podar Academic Board',
    verifiedAt: '2026-10-24T10:00:00.000Z',
    adminRemarks: 'Approved & verified by college administrator.',
    fileName: 'google-cloud-cert.svg',
    fileData: generateCertificateSVG({
      studentName: 'Student Demo',
      programTitle: 'Google Cloud Associate Cloud Engineer',
      credentialId: 'GCP-ACE-2026-001',
      issueDate: '2026-10-24',
      verificationCode: 'PODAR-VERIF-78291',
      issuer: 'Google Cloud Platform'
    }),
    submittedAt: '2026-10-24T09:30:00.000Z'
  },
  {
    id: 'cert-demo-pending-01',
    programId: 'prog-aws-01',
    programTitle: 'AWS Cloud Practitioner Certification Program',
    studentId: 'student-demo',
    studentName: 'Student Demo',
    studentDepartment: 'BCA • Semester V',
    issuer: 'Amazon Web Services (AWS)',
    category: 'Cloud Computing',
    credentialId: 'AWS-CCP-2026-4402',
    issueDate: '2026-10-24',
    status: 'verified',
    verificationCode: 'PODAR-VERIF-497371',
    verifiedBy: 'Podar Academic Board',
    verifiedAt: '2026-10-24T11:00:00.000Z',
    adminRemarks: 'Approved & verified by college administrator.',
    fileName: 'aws-cloud-cert.svg',
    fileData: generateCertificateSVG({
      studentName: 'Student Demo',
      programTitle: 'AWS Cloud Practitioner Certification Program',
      credentialId: 'AWS-CCP-2026-4402',
      issueDate: '2026-10-24',
      verificationCode: 'PODAR-VERIF-497371',
      issuer: 'Amazon Web Services (AWS)'
    }),
    submittedAt: '2026-10-24T10:30:00.000Z'
  },
  {
    id: 'cert-meta-03',
    programId: 'prog-meta-03',
    programTitle: 'Meta Front-End Developer Professional Certificate',
    studentId: 'student-priya',
    studentName: 'Priya Patel',
    studentDepartment: 'B.Sc Computer Science • Sem VI',
    issuer: 'Meta & Coursera',
    category: 'Software Engineering',
    credentialId: 'META-FED-2026-1029',
    issueDate: '2026-10-26',
    status: 'verified',
    verificationCode: 'PODAR-VERIF-38102',
    verifiedBy: 'Podar Academic Board',
    verifiedAt: '2026-10-26T14:20:00.000Z',
    adminRemarks: 'Outstanding front-end capstone verified.',
    fileName: 'meta-developer-cert.svg',
    fileData: generateCertificateSVG({
      studentName: 'Priya Patel',
      programTitle: 'Meta Front-End Developer Professional Certificate',
      credentialId: 'META-FED-2026-1029',
      issueDate: '2026-10-26',
      verificationCode: 'PODAR-VERIF-38102',
      issuer: 'Meta & Coursera'
    }),
    submittedAt: '2026-10-26T12:00:00.000Z'
  },
  {
    id: 'cert-ibm-04',
    programId: 'prog-ibm-04',
    programTitle: 'IBM Data Science & Machine Learning Foundations',
    studentId: 'student-aarav',
    studentName: 'Aarav Sharma',
    studentDepartment: 'BCA • Semester IV',
    issuer: 'IBM Skills Network',
    category: 'AI & Data Science',
    credentialId: 'IBM-DS-2026-7731',
    issueDate: '2026-10-27',
    status: 'verified',
    verificationCode: 'PODAR-VERIF-99120',
    verifiedBy: 'Podar Academic Board',
    verifiedAt: '2026-10-27T16:00:00.000Z',
    adminRemarks: 'Verified against IBM credential issuer.',
    fileName: 'ibm-data-science-cert.svg',
    fileData: generateCertificateSVG({
      studentName: 'Aarav Sharma',
      programTitle: 'IBM Data Science & Machine Learning Foundations',
      credentialId: 'IBM-DS-2026-7731',
      issueDate: '2026-10-27',
      verificationCode: 'PODAR-VERIF-99120',
      issuer: 'IBM Skills Network'
    }),
    submittedAt: '2026-10-27T13:40:00.000Z'
  },
  {
    id: 'cert-demo-pending-02',
    programId: 'prog-career-05',
    programTitle: 'Career Readiness & Professional Excellence',
    studentId: 'student-demo',
    studentName: 'Student Demo',
    studentDepartment: 'BCA • Semester V',
    issuer: 'Podar Pathways Center of Excellence',
    category: 'Career Readiness',
    credentialId: 'CRF-2026-8910',
    issueDate: '2026-10-28',
    status: 'verified',
    verificationCode: 'PODAR-VERIF-10294',
    verifiedBy: 'Podar Academic Board',
    verifiedAt: '2026-10-28T12:00:00.000Z',
    adminRemarks: 'Excellent completion record verified.',
    fileName: 'career-readiness-cert.svg',
    fileData: generateCertificateSVG({
      studentName: 'Student Demo',
      programTitle: 'Career Readiness & Professional Excellence',
      credentialId: 'CRF-2026-8910',
      issueDate: '2026-10-28',
      verificationCode: 'PODAR-VERIF-10294',
      issuer: 'Podar Pathways Center of Excellence'
    }),
    submittedAt: '2026-10-28T11:00:00.000Z'
  },
  {
    id: 'cert-oracle-06',
    programId: 'prog-oracle-06',
    programTitle: 'Oracle Java SE 17 Developer Certification',
    studentId: 'student-rohan',
    studentName: 'Rohan Mehta',
    studentDepartment: 'BCA • Semester VI',
    issuer: 'Oracle University',
    category: 'Software Engineering',
    credentialId: 'ORCL-JAVA-2026-3829',
    issueDate: '2026-10-29',
    status: 'verified',
    verificationCode: 'PODAR-VERIF-66201',
    verifiedBy: 'Podar Academic Board',
    verifiedAt: '2026-10-29T09:15:00.000Z',
    adminRemarks: 'Verified Oracle 1Z0-829 examination score.',
    fileName: 'oracle-java-cert.svg',
    fileData: generateCertificateSVG({
      studentName: 'Rohan Mehta',
      programTitle: 'Oracle Java SE 17 Developer Certification',
      credentialId: 'ORCL-JAVA-2026-3829',
      issueDate: '2026-10-29',
      verificationCode: 'PODAR-VERIF-66201',
      issuer: 'Oracle University'
    }),
    submittedAt: '2026-10-29T08:00:00.000Z'
  }
];
