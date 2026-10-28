import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'podar_pathways.db');
export const db = new Database(dbPath);

// Enable WAL mode for better concurrency and performance
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    fathersName TEXT,
    phone TEXT NOT NULL UNIQUE,
    course TEXT NOT NULL,
    semester TEXT NOT NULL,
    email TEXT,
    linkedin TEXT,
    github TEXT,
    skills TEXT,
    goal TEXT,
    score INTEGER DEFAULT 35,
    completion INTEGER DEFAULT 28,
    applications INTEGER DEFAULT 0,
    projects INTEGER DEFAULT 0,
    certificates INTEGER DEFAULT 0,
    addedByAdmin INTEGER DEFAULT 1,
    isRegistered INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS otps (
    phone TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    role TEXT NOT NULL,
    createdAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS programs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    issuer TEXT NOT NULL,
    description TEXT,
    link TEXT NOT NULL,
    bannerImg TEXT,
    targetCourse TEXT DEFAULT 'All',
    targetSemester TEXT DEFAULT 'All',
    deadline TEXT,
    rewardPoints INTEGER DEFAULT 15,
    status TEXT DEFAULT 'active',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS program_clicks (
    id TEXT PRIMARY KEY,
    programId TEXT NOT NULL,
    studentId TEXT NOT NULL,
    studentName TEXT NOT NULL,
    studentPhone TEXT,
    clickedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS certificates (
    id TEXT PRIMARY KEY,
    programId TEXT,
    programTitle TEXT NOT NULL,
    studentId TEXT NOT NULL,
    studentName TEXT NOT NULL,
    studentPhone TEXT NOT NULL,
    credentialId TEXT,
    issueDate TEXT,
    fileData TEXT,
    fileName TEXT,
    status TEXT DEFAULT 'pending',
    adminRemarks TEXT,
    verifiedBy TEXT,
    verificationCode TEXT,
    verifiedAt TEXT,
    submittedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    studentId TEXT DEFAULT 'all',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'program',
    programId TEXT,
    read INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tests (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'Technical',
    description TEXT,
    targetCourse TEXT DEFAULT 'All',
    targetSemester TEXT DEFAULT 'All',
    durationMinutes INTEGER DEFAULT 20,
    totalMarks INTEGER DEFAULT 100,
    passingMarks INTEGER DEFAULT 40,
    rewardPoints INTEGER DEFAULT 15,
    status TEXT DEFAULT 'active',
    questions TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS test_submissions (
    id TEXT PRIMARY KEY,
    testId TEXT NOT NULL,
    testTitle TEXT NOT NULL,
    studentId TEXT NOT NULL,
    studentName TEXT NOT NULL,
    studentPhone TEXT,
    studentCourse TEXT,
    studentSemester TEXT,
    score INTEGER NOT NULL,
    totalMarks INTEGER NOT NULL,
    percentage INTEGER NOT NULL,
    status TEXT NOT NULL,
    timeSpentSeconds INTEGER DEFAULT 0,
    answers TEXT NOT NULL,
    adminRemarks TEXT,
    submittedAt TEXT NOT NULL,
    checkedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS admins (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'Admin',
    department TEXT DEFAULT 'Career & Placement Cell',
    permissions TEXT NOT NULL,
    avatar TEXT,
    status TEXT DEFAULT 'active',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS schedules (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'Lecture',
    date TEXT NOT NULL,
    startTime TEXT,
    endTime TEXT,
    location TEXT,
    meetLink TEXT,
    targetCourse TEXT DEFAULT 'All',
    targetSemester TEXT DEFAULT 'All',
    instructor TEXT,
    description TEXT,
    isMandatory INTEGER DEFAULT 0,
    createdBy TEXT DEFAULT 'Admin',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id TEXT PRIMARY KEY,
    scheduleId TEXT NOT NULL,
    studentId TEXT NOT NULL,
    studentName TEXT,
    course TEXT,
    semester TEXT,
    status TEXT NOT NULL, -- 'Present', 'Absent', 'Late', 'Excused'
    markedAt TEXT NOT NULL,
    markedBy TEXT DEFAULT 'Admin',
    remarks TEXT,
    UNIQUE(scheduleId, studentId)
  );
`);

// Auto-migrate existing database table columns if needed
try { db.exec(`ALTER TABLE students ADD COLUMN linkedin TEXT;`); } catch (e) {}
try { db.exec(`ALTER TABLE students ADD COLUMN github TEXT;`); } catch (e) {}
try { db.exec(`ALTER TABLE students ADD COLUMN skills TEXT;`); } catch (e) {}
try { db.exec(`ALTER TABLE students ADD COLUMN isRegistered INTEGER DEFAULT 0;`); } catch (e) {}
try { db.exec(`ALTER TABLE students ADD COLUMN bio TEXT;`); } catch (e) {}
try { db.exec(`ALTER TABLE students ADD COLUMN portfolio TEXT;`); } catch (e) {}
try { db.exec(`ALTER TABLE students ADD COLUMN rollNo TEXT;`); } catch (e) {}
try { db.exec(`ALTER TABLE students ADD COLUMN graduationYear TEXT;`); } catch (e) {}
try { db.exec(`ALTER TABLE students ADD COLUMN jobType TEXT;`); } catch (e) {}
try { db.exec(`ALTER TABLE students ADD COLUMN city TEXT;`); } catch (e) {}
try { db.exec(`ALTER TABLE students ADD COLUMN softSkills TEXT;`); } catch (e) {}
try { db.exec(`ALTER TABLE students ADD COLUMN resumeUrl TEXT;`); } catch (e) {}
try { db.exec(`ALTER TABLE students ADD COLUMN fathersName TEXT;`); } catch (e) {}
try { db.exec(`ALTER TABLE students ADD COLUMN avatar TEXT;`); } catch (e) {}
try { db.exec(`ALTER TABLE admins ADD COLUMN avatar TEXT;`); } catch (e) {}
try { db.exec(`ALTER TABLE programs ADD COLUMN bannerImg TEXT;`); } catch (e) {}
try { db.exec(`ALTER TABLE certificates ADD COLUMN verifiedBy TEXT;`); } catch (e) {}
try { db.exec(`ALTER TABLE certificates ADD COLUMN verificationCode TEXT;`); } catch (e) {}

// Realistic Certificate SVG generator for seeding and demos
function generateSampleCertSvg(name, program, issuer, certId, date) {
  const safeName = (name || 'Student Demo').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeProgram = (program || 'Certified Professional Pathway').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeIssuer = (issuer || 'Podar Academic Board').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeId = (certId || 'PODAR-CRED-849201').replace(/&/g, '&amp;');
  const safeDate = (date || 'October 2026').replace(/&/g, '&amp;');

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
    <text x="460" y="315" text-anchor="middle" font-family="Georgia, serif" font-size="38" font-weight="bold" fill="#1e3a8a">${safeName}</text>
    <line x1="250" y1="332" x2="670" y2="332" stroke="#cbd5e1" stroke-width="1.5"/>
    <text x="460" y="375" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" fill="#475569">has successfully fulfilled all rigorous academic standards, evaluations, and coursework for</text>
    <text x="460" y="415" text-anchor="middle" font-family="Georgia, serif" font-size="23" font-weight="bold" fill="#0f172a">${safeProgram}</text>
    <text x="460" y="448" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0d9488">Authorized Platform / Issuer: ${safeIssuer}</text>
    <g transform="translate(130, 520)">
      <text x="0" y="22" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#64748b" letter-spacing="1">DATE OF ISSUE</text>
      <text x="0" y="46" font-family="Georgia, serif" font-size="16" font-weight="bold" fill="#0f172a">${safeDate}</text>
      <line x1="0" y1="56" x2="160" y2="56" stroke="#cbd5e1" stroke-width="1"/>
    </g>
    <g transform="translate(460, 535)">
      <circle cx="0" cy="0" r="46" fill="url(#gold)"/>
      <circle cx="0" cy="0" r="38" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="5 3"/>
      <text x="0" y="-8" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="#ffffff" letter-spacing="1">OFFICIAL</text>
      <text x="0" y="9" text-anchor="middle" font-family="Georgia, serif" font-size="13" font-weight="bold" fill="#ffffff">ACADEMIC</text>
      <text x="0" y="24" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="#fef3c7" letter-spacing="1">CREDENTIAL</text>
    </g>
    <g transform="translate(630, 520)">
      <text x="0" y="22" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#64748b" letter-spacing="1">CREDENTIAL ID</text>
      <text x="0" y="46" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0f172a">${safeId}</text>
      <line x1="0" y1="56" x2="160" y2="56" stroke="#cbd5e1" stroke-width="1"/>
    </g>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// Populate sample high-res certificate image for existing demo certificate
try {
  const gcpSvg = generateSampleCertSvg(
    'Student Demo',
    'Google Cloud Associate Cloud Engineer',
    'Google Cloud',
    'GCP-ACE-2026-98124',
    '15 Oct 2026'
  );
  db.prepare(`
    UPDATE certificates 
    SET fileData = ?, verifiedBy = 'Podar Academic Board', verificationCode = 'PODAR-VERIF-78291'
    WHERE id = 'cert-1792832322687' AND (length(fileData) < 200 OR fileData LIKE '%AAAA%')
  `).run(gcpSvg);

  // Seed a pending certificate for demo if none exists so admin can inspect and verify it
  const pendingCertCount = db.prepare("SELECT COUNT(*) as count FROM certificates WHERE status = 'pending'").get().count;
  if (pendingCertCount === 0) {
    const now = new Date().toISOString();
    const awsSvg = generateSampleCertSvg(
      'Student Demo',
      'AWS Cloud Practitioner Certification Program',
      'Amazon Web Services (AWS)',
      'AWS-CCP-2026-4402',
      '24 Oct 2026'
    );
    db.prepare(`
      INSERT INTO certificates (
        id, programId, programTitle, studentId, studentName, studentPhone,
        credentialId, issueDate, fileData, fileName, status, submittedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).run(
      'cert-demo-pending-01',
      'prog-aws-01',
      'AWS Cloud Practitioner Certification Program',
      'student-demo',
      'Student Demo',
      '9000000001',
      'AWS-CCP-2026-4402',
      '2026-10-24',
      awsSvg,
      'aws-certified-cloud-practitioner.png',
      now
    );
  }
} catch (e) {}

// Populate banner images for default programs if empty
try {
  db.prepare(`
    UPDATE programs 
    SET bannerImg = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop'
    WHERE id = 'prog-aws-01' AND (bannerImg IS NULL OR bannerImg = '')
  `).run();
  db.prepare(`
    UPDATE programs 
    SET bannerImg = 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=1000&auto=format&fit=crop'
    WHERE id = 'prog-meta-02' AND (bannerImg IS NULL OR bannerImg = '')
  `).run();
} catch (e) {}

// Seed default settings if empty
const adminPhoneCheck = db.prepare("SELECT value FROM settings WHERE key = 'adminPhone'").get();
if (!adminPhoneCheck) {
  db.prepare("INSERT INTO settings (key, value) VALUES ('adminPhone', '9876543210')").run();
}

// Seed default administrators if empty
const adminCountCheck = db.prepare('SELECT COUNT(*) as count FROM admins').get().count;
if (adminCountCheck === 0) {
  const now = new Date().toISOString();
  const insertAdmin = db.prepare(`
    INSERT INTO admins (id, name, phone, email, role, department, permissions, status, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAdmin.run(
    'admin-super',
    'Chief Administrator',
    '9876543210',
    'director@podarpathways.edu',
    'Super Admin',
    'Executive Directorate & Governance',
    JSON.stringify(['manage_students', 'manage_tests', 'manage_programs', 'manage_admins', 'view_reports', 'export_data', 'delete_records']),
    'active',
    now,
    now
  );

  insertAdmin.run(
    'admin-placement',
    'Dr. Neha Kulkarni',
    '9822001122',
    'neha.kulkarni@podarpathways.edu',
    'Placement Officer',
    'Corporate Relations & Placements',
    JSON.stringify(['manage_students', 'view_reports', 'export_data']),
    'active',
    now,
    now
  );

  insertAdmin.run(
    'admin-examiner',
    'Prof. Rajesh Mehra',
    '9833004455',
    'rajesh.mehra@podarpathways.edu',
    'Academic Examiner',
    'Assessment & Evaluation Cell',
    JSON.stringify(['manage_tests', 'manage_programs', 'view_reports']),
    'active',
    now,
    now
  );
}

// Seed default demo student if empty
const studentCount = db.prepare('SELECT COUNT(*) as count FROM students').get().count;
if (studentCount === 0) {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO students (
      id, name, phone, course, semester, email, goal, score, completion,
      applications, projects, certificates, addedByAdmin, status, createdAt, updatedAt
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `).run(
    'student-demo',
    'Student Demo',
    '9000000001',
    'BCA',
    'V',
    'student.demo@example.com',
    'Software Engineer',
    78,
    92,
    6,
    2,
    3,
    1,
    'active',
    now,
    now
  );
}

// Seed sample programs if empty
const programCount = db.prepare('SELECT COUNT(*) as count FROM programs').get().count;
if (programCount === 0) {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO programs (id, title, issuer, description, link, bannerImg, targetCourse, targetSemester, deadline, rewardPoints, status, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'prog-aws-01',
    'AWS Cloud Practitioner Certification Program',
    'Amazon Web Services (AWS)',
    'Official AWS fundamentals certification course covering cloud concepts, core AWS services, security, architecture, and pricing models.',
    'https://aws.amazon.com/certification/certified-cloud-practitioner/',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop',
    'All',
    'All',
    '2026-12-15',
    15,
    'active',
    now,
    now
  );

  db.prepare(`
    INSERT INTO programs (id, title, issuer, description, link, bannerImg, targetCourse, targetSemester, deadline, rewardPoints, status, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'prog-meta-02',
    'Meta Front-End Developer Professional Certificate',
    'Meta & Coursera',
    'Comprehensive industry curriculum covering React, JavaScript ES6, UI/UX design, version control, and live project deployment.',
    'https://www.coursera.org/professional-certificates/meta-front-end-developer',
    'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=1000&auto=format&fit=crop',
    'BCA',
    'V',
    '2026-11-30',
    20,
    'active',
    now,
    now
  );

  // Seed notification
  db.prepare(`
    INSERT INTO notifications (id, studentId, title, message, type, programId, read, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'notif-01',
    'all',
    'New Certificate Program Announced',
    'Admin added "AWS Cloud Practitioner Certification Program". Check the official link and enroll now!',
    'program',
    'prog-aws-01',
    0,
    now
  );
}

// Seed sample tests if empty
const testCount = db.prepare('SELECT COUNT(*) as count FROM tests').get().count;
if (testCount === 0) {
  const now = new Date().toISOString();

  const webQuestions = JSON.stringify([
    {
      id: 'q1',
      question: 'Which React Hook is primarily used for handling side effects like API calls and DOM subscriptions?',
      options: ['useState', 'useEffect', 'useMemo', 'useRef'],
      correctIndex: 1,
      marks: 10,
      explanation: 'useEffect is designed to run asynchronous operations, data fetching, and DOM subscriptions after render.'
    },
    {
      id: 'q2',
      question: 'In JavaScript, what does typeof null evaluate to?',
      options: ["'null'", "'undefined'", "'object'", "'boolean'"],
      correctIndex: 2,
      marks: 10,
      explanation: 'Due to a historical bug in JavaScript 1.0, typeof null returns "object".'
    },
    {
      id: 'q3',
      question: 'What is the primary benefit of React Virtual DOM reconciliation?',
      options: [
        'It translates JavaScript into machine bytecode',
        'It minimizes expensive real DOM manipulations by calculating batched diffs',
        'It saves application state permanently to the database',
        'It eliminates the need for CSS stylesheets'
      ],
      correctIndex: 1,
      marks: 10,
      explanation: 'Virtual DOM computes minimal tree diffs in memory before committing only changed nodes to the browser DOM.'
    },
    {
      id: 'q4',
      question: 'Which HTTP method is idempotent and intended to completely update or replace a target resource?',
      options: ['POST', 'PUT', 'PATCH', 'CONNECT'],
      correctIndex: 1,
      marks: 10,
      explanation: 'PUT replaces the entire resource representation idempotently.'
    },
    {
      id: 'q5',
      question: 'What does CSS property "box-sizing: border-box" enforce?',
      options: [
        'Adds an inset border shadow',
        'Calculates padding and border inside the declared element width and height',
        'Converts display to CSS flexbox',
        'Clips overflowing text content'
      ],
      correctIndex: 1,
      marks: 10,
      explanation: 'border-box includes padding and borders inside the specified width/height dimensions.'
    }
  ]);

  db.prepare(`
    INSERT INTO tests (id, title, category, description, targetCourse, targetSemester, durationMinutes, totalMarks, passingMarks, rewardPoints, status, questions, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'test-fs-01',
    'Full Stack Web & React Development Diagnostic Test',
    'Web Development',
    'Comprehensive test covering modern React Hooks, Virtual DOM, JavaScript ES6+, and HTTP protocol fundamentals.',
    'All',
    'All',
    15,
    50,
    25,
    15,
    'active',
    webQuestions,
    now,
    now
  );

  const dsaQuestions = JSON.stringify([
    {
      id: 'd1',
      question: 'What is the worst-case search time complexity in a degenerated/unbalanced Binary Search Tree (BST)?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
      correctIndex: 2,
      marks: 10,
      explanation: 'When a BST is completely unbalanced, it behaves like a singly-linked list with O(n) search time.'
    },
    {
      id: 'd2',
      question: 'Which abstract data structure operates strictly on First-In-First-Out (FIFO) ordering?',
      options: ['Stack', 'Queue', 'Max-Heap', 'Hash Table'],
      correctIndex: 1,
      marks: 10,
      explanation: 'Queue enqueues at the rear and dequeues from the front following FIFO.'
    },
    {
      id: 'd3',
      question: 'What is the average time complexity of QuickSort?',
      options: ['O(n)', 'O(n log n)', 'O(n^2)', 'O(log n)'],
      correctIndex: 1,
      marks: 10,
      explanation: 'QuickSort divides arrays around balanced pivots achieving average O(n log n) performance.'
    },
    {
      id: 'd4',
      question: 'Which shortest-path algorithm is optimal for graphs with non-negative edge weights?',
      options: ["Dijkstra's Algorithm", "Bellman-Ford", "Floyd-Warshall", "Breadth-First Search (unweighted)"],
      correctIndex: 0,
      marks: 10,
      explanation: "Dijkstra's algorithm uses a priority queue to compute shortest paths with non-negative weights in O((V + E) log V)."
    },
    {
      id: 'd5',
      question: 'What is the auxiliary space complexity of an in-place sorting algorithm like HeapSort?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'],
      correctIndex: 0,
      marks: 10,
      explanation: 'HeapSort arranges elements within the input array requiring only O(1) extra space.'
    }
  ]);

  db.prepare(`
    INSERT INTO tests (id, title, category, description, targetCourse, targetSemester, durationMinutes, totalMarks, passingMarks, rewardPoints, status, questions, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'test-dsa-02',
    'Data Structures & Algorithms Mock Assessment',
    'Algorithms & DSA',
    'Evaluate core problem solving: tree traversals, sorting complexities, queues, and graph algorithms.',
    'BCA',
    'V',
    20,
    50,
    25,
    20,
    'active',
    dsaQuestions,
    now,
    now
  );

  const aptQuestions = JSON.stringify([
    {
      id: 'a1',
      question: 'Complete the number sequence: 3, 7, 15, 31, 63, ?',
      options: ['95', '127', '126', '131'],
      correctIndex: 1,
      marks: 10,
      explanation: 'Each term is (previous * 2) + 1. (63 * 2) + 1 = 127.'
    },
    {
      id: 'a2',
      question: 'A train moving at 72 km/h crosses a 180m platform in 18 seconds. What is the length of the train?',
      options: ['180 meters', '200 meters', '220 meters', '240 meters'],
      correctIndex: 0,
      marks: 10,
      explanation: '72 km/h = 20 m/s. Distance in 18s = 360m. Train length = 360 - 180 = 180m.'
    },
    {
      id: 'a3',
      question: 'If "CODER" is coded as "DPEDS", what is the code for "PODAR"?',
      options: ['QPEBS', 'QPDBS', 'QOEBS', 'RODAS'],
      correctIndex: 0,
      marks: 10,
      explanation: 'Each character shifts +1 forward: P->Q, O->P, D->E, A->B, R->S = QPEBS.'
    },
    {
      id: 'a4',
      question: 'A student walks 5 km North, turns East and walks 12 km. What is the straight-line displacement from start?',
      options: ['13 km', '17 km', '15 km', '10 km'],
      correctIndex: 0,
      marks: 10,
      explanation: 'Hypotenuse = sqrt(5^2 + 12^2) = sqrt(25 + 144) = 13 km.'
    },
    {
      id: 'a5',
      question: 'If 20% of a number is 50, what is 60% of that number?',
      options: ['100', '120', '150', '200'],
      correctIndex: 2,
      marks: 10,
      explanation: '60% is 3 times 20%, so 3 * 50 = 150.'
    }
  ]);

  db.prepare(`
    INSERT INTO tests (id, title, category, description, targetCourse, targetSemester, durationMinutes, totalMarks, passingMarks, rewardPoints, status, questions, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'test-apt-03',
    'Campus Placement Aptitude & Logical Reasoning',
    'Aptitude & Placement',
    'Benchmark placement aptitude: number series, relative velocity, cryptographic patterns, and vector displacement.',
    'All',
    'All',
    15,
    50,
    20,
    15,
    'active',
    aptQuestions,
    now,
    now
  );

  // Seed sample student test submission so admin can inspect it right away
  const sampleAnswers = JSON.stringify([
    { questionId: 'q1', selectedIndex: 1, isCorrect: true, marksAwarded: 10 },
    { questionId: 'q2', selectedIndex: 2, isCorrect: true, marksAwarded: 10 },
    { questionId: 'q3', selectedIndex: 1, isCorrect: true, marksAwarded: 10 },
    { questionId: 'q4', selectedIndex: 1, isCorrect: true, marksAwarded: 10 },
    { questionId: 'q5', selectedIndex: 0, isCorrect: false, marksAwarded: 0 }
  ]);

  db.prepare(`
    INSERT INTO test_submissions (id, testId, testTitle, studentId, studentName, studentPhone, studentCourse, studentSemester, score, totalMarks, percentage, status, timeSpentSeconds, answers, adminRemarks, submittedAt, checkedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'sub-sample-01',
    'test-fs-01',
    'Full Stack Web & React Development Diagnostic Test',
    'student-demo',
    'Student Demo',
    '9000000001',
    'BCA',
    'V',
    40,
    50,
    80,
    'passed',
    542,
    sampleAnswers,
    'Strong grasp of React core concepts and API idempotency. Review CSS box model nuances.',
    now,
    now
  );
}

// Seed sample schedule items if empty
const scheduleCount = db.prepare('SELECT count(*) as count FROM schedules').get();
if (scheduleCount.count === 0) {
  const insertSchedule = db.prepare(`
    INSERT INTO schedules (id, title, category, date, startTime, endTime, location, meetLink, targetCourse, targetSemester, instructor, description, isMandatory, createdBy, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  const currentYearMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-10"

  const sampleEvents = [
    {
      id: 'sch-01',
      title: 'Campus Placement Drive: Infosys & TCS Technical Round',
      category: 'Placement',
      date: `${currentYearMonth}-26`,
      startTime: '10:00 AM',
      endTime: '01:30 PM',
      location: 'Main Auditorium & Computer Lab 4',
      meetLink: '',
      targetCourse: 'All',
      targetSemester: 'V',
      instructor: 'Corporate Placement Cell',
      description: 'First stage technical screening and aptitude round for graduating batches. Formal attire and resume copies mandatory.',
      isMandatory: 1
    },
    {
      id: 'sch-02',
      title: 'Full Stack Cloud Architecture & AWS Serverless Workshop',
      category: 'Workshop',
      date: `${currentYearMonth}-27`,
      startTime: '02:00 PM',
      endTime: '04:30 PM',
      location: 'Seminar Hall B',
      meetLink: 'https://meet.google.com/podar-cloud-wksp',
      targetCourse: 'BCA',
      targetSemester: 'All',
      instructor: 'Prof. Rajesh Sharma (AWS Certified Solutions Architect)',
      description: 'Hands-on live deployment of microservices using AWS Lambda, DynamoDB, and React frontend with custom domain mapping.',
      isMandatory: 0
    },
    {
      id: 'sch-03',
      title: 'Mid-Term Assessment: Advanced Database Systems & SQL Optimization',
      category: 'Exam',
      date: `${currentYearMonth}-28`,
      startTime: '11:00 AM',
      endTime: '12:30 PM',
      location: 'Exam Hall 2',
      meetLink: '',
      targetCourse: 'BCA',
      targetSemester: 'V',
      instructor: 'Dr. Ananya Roy',
      description: 'Covers Indexing, B-Trees, Normalization (1NF to BCNF), ACID transactions, and query optimization.',
      isMandatory: 1
    },
    {
      id: 'sch-04',
      title: 'Algorithm & Data Structure Live Sprint (LeetCode Problem Solving)',
      category: 'Lecture',
      date: `${currentYearMonth}-30`,
      startTime: '03:30 PM',
      endTime: '05:00 PM',
      location: 'Online (Google Meet)',
      meetLink: 'https://meet.google.com/algo-sprint-oct',
      targetCourse: 'All',
      targetSemester: 'All',
      instructor: 'Coding Club Leads & Alumni Mentors',
      description: 'Interactive session breaking down sliding window techniques, two-pointer paradigms, and dynamic programming patterns.',
      isMandatory: 0
    },
    {
      id: 'sch-05',
      title: 'Industry Keynote: Artificial Intelligence in Modern Enterprise',
      category: 'Workshop',
      date: `${currentYearMonth}-31`,
      startTime: '10:30 AM',
      endTime: '12:00 PM',
      location: 'Virtual Broadcast & Auditorium',
      meetLink: 'https://meet.google.com/podar-ai-keynote',
      targetCourse: 'All',
      targetSemester: 'All',
      instructor: 'Dr. Vikram Malhotra (VP of AI Research)',
      description: 'Fireside chat and Q&A covering LLM fine-tuning, retrieval-augmented generation in fintech, and career trajectories.',
      isMandatory: 0
    }
  ];

  sampleEvents.forEach(evt => {
    insertSchedule.run(
      evt.id,
      evt.title,
      evt.category,
      evt.date,
      evt.startTime,
      evt.endTime,
      evt.location,
      evt.meetLink,
      evt.targetCourse,
      evt.targetSemester,
      evt.instructor,
      evt.description,
      evt.isMandatory,
      'Admin',
      now,
      now
    );
  });
}

// Seed sample attendance if empty
const attendanceCount = db.prepare('SELECT count(*) as count FROM attendance').get();
if (attendanceCount.count === 0) {
  const allStudents = db.prepare('SELECT id, name, course, semester FROM students').all();
  const allSchedules = db.prepare('SELECT id, title, targetCourse, targetSemester FROM schedules LIMIT 4').all();
  const insertAtt = db.prepare(`
    INSERT OR IGNORE INTO attendance (id, scheduleId, studentId, studentName, course, semester, status, markedAt, markedBy, remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const statuses = ['Present', 'Present', 'Present', 'Absent', 'Late'];
  allSchedules.forEach((sch, sIdx) => {
    allStudents.forEach((st, idx) => {
      const status = statuses[(idx + sIdx) % statuses.length];
      insertAtt.run(
        `att-${sch.id}-${st.id}`,
        sch.id,
        st.id,
        st.name,
        st.course,
        st.semester,
        status,
        new Date().toISOString(),
        'Prof. Anita Sharma',
        status === 'Late' ? 'Arrived 15 mins late' : status === 'Absent' ? 'Unexcused leave' : 'Verified attendance'
      );
    });
  });
}

export default db;
