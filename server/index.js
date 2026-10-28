import express from 'express';
import cors from 'cors';
import { db } from './db.js';

const app = express();
const PORT = process.env.PORT || 5000;
const ADMIN_KEY = 'drHPSingh';

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Settings: Get admin phone and configuration
app.get('/api/settings', (req, res) => {
  try {
    const adminPhoneRow = db.prepare("SELECT value FROM settings WHERE key = 'adminPhone'").get();
    res.json({
      adminPhone: adminPhoneRow ? adminPhoneRow.value : '9876543210'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Settings: Update admin phone
app.put('/api/settings/admin-phone', (req, res) => {
  try {
    const { adminPhone, adminKey } = req.body;
    if (adminKey !== ADMIN_KEY) {
      return res.status(403).json({ error: 'The change key was not accepted.' });
    }
    if (!/^[0-9]{10}$/.test(adminPhone)) {
      return res.status(400).json({ error: 'Enter a valid 10-digit mobile number.' });
    }

    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('adminPhone', ?)").run(adminPhone);
    res.json({ success: true, adminPhone, message: 'Admin phone updated successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// ADMINISTRATORS & PERMISSIONS MANAGEMENT
// ==========================================

// Admins: List all administrators
app.get('/api/admins', (req, res) => {
  try {
    const admins = db.prepare('SELECT * FROM admins ORDER BY createdAt ASC').all();
    const parsed = admins.map((a) => {
      let permissions = [];
      try { permissions = JSON.parse(a.permissions); } catch { permissions = []; }
      return { ...a, permissions };
    });
    res.json(parsed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admins: Add new administrator
app.post('/api/admins', (req, res) => {
  try {
    const { name, phone, email, role, department, permissions = [], avatar = '' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Administrator name is required.' });
    }
    if (!phone || !/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({ error: 'Valid 10-digit mobile number is required.' });
    }

    const existing = db.prepare('SELECT * FROM admins WHERE phone = ?').get(phone.trim());
    if (existing) {
      return res.status(409).json({ error: `An administrator with phone ${phone} already exists (${existing.name}).` });
    }

    const id = `admin-${Date.now()}`;
    const now = new Date().toISOString();
    const permJson = JSON.stringify(Array.isArray(permissions) ? permissions : []);

    db.prepare(`
      INSERT INTO admins (id, name, phone, email, role, department, permissions, avatar, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      name.trim(),
      phone.trim(),
      email ? email.trim() : '',
      role || 'Admin',
      department || 'Career & Placement Cell',
      permJson,
      avatar || '',
      'active',
      now,
      now
    );

    const newAdmin = db.prepare('SELECT * FROM admins WHERE id = ?').get(id);
    let finalPerms = [];
    try { finalPerms = JSON.parse(newAdmin.permissions); } catch { finalPerms = []; }

    res.status(201).json({
      success: true,
      admin: { ...newAdmin, permissions: finalPerms },
      message: `Administrator "${name}" registered successfully with role "${role || 'Admin'}".`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admins: Update administrator & permissions
app.put('/api/admins/:id', (req, res) => {
  try {
    const { id } = req.params;
    const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(id);
    if (!admin) {
      return res.status(404).json({ error: 'Administrator not found.' });
    }

    const { name, phone, email, role, department, permissions, status, avatar } = req.body;

    if (phone && phone !== admin.phone) {
      if (!/^[0-9]{10}$/.test(phone)) {
        return res.status(400).json({ error: 'Valid 10-digit phone number is required.' });
      }
      const duplicate = db.prepare('SELECT * FROM admins WHERE phone = ? AND id != ?').get(phone, id);
      if (duplicate) {
        return res.status(409).json({ error: `Phone number is already assigned to ${duplicate.name}.` });
      }
    }

    const finalName = name !== undefined ? name.trim() : admin.name;
    const finalPhone = phone !== undefined ? phone.trim() : admin.phone;
    const finalEmail = email !== undefined ? email.trim() : admin.email;
    const finalRole = role !== undefined ? role : admin.role;
    const finalDept = department !== undefined ? department : admin.department;
    const finalStatus = status !== undefined ? status : admin.status;
    const finalAvatar = avatar !== undefined ? avatar : admin.avatar;
    const finalPerms = permissions !== undefined
      ? JSON.stringify(Array.isArray(permissions) ? permissions : [])
      : admin.permissions;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE admins
      SET name = ?, phone = ?, email = ?, role = ?, department = ?, permissions = ?, avatar = ?, status = ?, updatedAt = ?
      WHERE id = ?
    `).run(
      finalName,
      finalPhone,
      finalEmail,
      finalRole,
      finalDept,
      finalPerms,
      finalAvatar,
      finalStatus,
      now,
      id
    );

    const updated = db.prepare('SELECT * FROM admins WHERE id = ?').get(id);
    let parsedPerms = [];
    try { parsedPerms = JSON.parse(updated.permissions); } catch { parsedPerms = []; }

    res.json({
      success: true,
      admin: { ...updated, permissions: parsedPerms },
      message: `Administrator "${updated.name}" updated successfully.`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admins: Delete administrator
app.delete('/api/admins/:id', (req, res) => {
  try {
    const { id } = req.params;
    const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(id);
    if (!admin) {
      return res.status(404).json({ error: 'Administrator not found.' });
    }

    const totalAdmins = db.prepare('SELECT COUNT(*) as count FROM admins').get().count;
    if (totalAdmins <= 1) {
      return res.status(400).json({ error: 'Cannot remove the last remaining administrator.' });
    }
    if (id === 'admin-super') {
      return res.status(403).json({ error: 'Primary Chief Administrator account cannot be removed.' });
    }

    db.prepare('DELETE FROM admins WHERE id = ?').run(id);
    res.json({ success: true, message: `Administrator "${admin.name}" removed successfully.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Students: List all students
app.get('/api/students', (req, res) => {
  try {
    const students = db.prepare('SELECT * FROM students ORDER BY createdAt DESC').all();
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Students: Admin Add Student (Strict Validation & Enrollment)
app.post('/api/students', (req, res) => {
  try {
    const { name, fathersName, phone, course, semester, email, goal, score } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Student name is required.' });
    }
    if (!phone || !/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({ error: 'Valid 10-digit mobile number is required.' });
    }
    if (!course) {
      return res.status(400).json({ error: 'Course selection is required.' });
    }
    if (!semester) {
      return res.status(400).json({ error: 'Semester selection is required.' });
    }

    // Check uniqueness in database
    const existing = db.prepare('SELECT id FROM students WHERE phone = ?').get(phone);
    if (existing) {
      return res.status(400).json({ error: 'A student with this phone number is already enrolled.' });
    }

    const id = `student-${Date.now()}`;
    const now = new Date().toISOString();
    const finalScore = Number(score) >= 0 && Number(score) <= 100 ? Number(score) : 40;

    db.prepare(`
      INSERT INTO students (
        id, name, fathersName, phone, course, semester, email, goal, score, completion,
        applications, projects, certificates, addedByAdmin, status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      name.trim(),
      fathersName ? fathersName.trim() : '',
      phone.trim(),
      course,
      semester,
      email ? email.trim() : '',
      goal ? goal.trim() : 'Explore career pathway',
      finalScore,
      30,
      0,
      0,
      0,
      1, // addedByAdmin = 1 (enrolled by admin, locked for student edit)
      'active',
      now,
      now
    );

    const newStudent = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
    res.status(201).json({
      success: true,
      student: newStudent,
      message: `Student "${name}" has been enrolled by Admin successfully.`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Students: CSV Bulk Import System
app.post('/api/students/import-csv', (req, res) => {
  try {
    const { students = [] } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ error: 'No student records provided for CSV import.' });
    }

    const now = new Date().toISOString();
    let importedCount = 0;
    const skipped = [];
    const insertedStudents = [];
    const seenPhonesInBatch = new Set();

    const insertStmt = db.prepare(`
      INSERT INTO students (
        id, name, fathersName, phone, course, semester, email, goal, score, completion,
        applications, projects, certificates, addedByAdmin, status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const importTransaction = db.transaction((rows) => {
      rows.forEach((row, idx) => {
        const name = (row.student_name || row.studentName || row.name || '').trim();
        const fathersName = (row.fathers_name || row.father_name || row.fathersName || row.fatherName || '').trim();
        const rawPhone = String(row.mobile_no || row.mobileNo || row.phone || row.mobile || '').replace(/\D/g, '').slice(0, 10);
        const course = (row.course || 'BCA').trim();
        const semester = (row.semester || 'I').trim();
        const email = (row.email || '').trim();
        const goal = (row.goal || 'Explore career pathway').trim();

        if (!name) {
          skipped.push({ row: idx + 1, name, phone: rawPhone, reason: 'Missing student name' });
          return;
        }

        if (!rawPhone || !/^[0-9]{10}$/.test(rawPhone)) {
          skipped.push({ row: idx + 1, name, phone: rawPhone, reason: 'Invalid 10-digit mobile number' });
          return;
        }

        if (seenPhonesInBatch.has(rawPhone)) {
          skipped.push({ row: idx + 1, name, phone: rawPhone, reason: 'Duplicate mobile number in CSV file' });
          return;
        }
        seenPhonesInBatch.add(rawPhone);

        // Check if phone already exists in DB
        const exists = db.prepare('SELECT id, name FROM students WHERE phone = ?').get(rawPhone);
        if (exists) {
          skipped.push({ row: idx + 1, name, phone: rawPhone, reason: `Mobile number already registered to ${exists.name}` });
          return;
        }

        const id = `student-${Date.now()}-${idx + 1}-${Math.floor(Math.random() * 1000)}`;
        insertStmt.run(
          id,
          name,
          fathersName,
          rawPhone,
          course,
          semester,
          email,
          goal,
          35,
          28,
          0,
          0,
          0,
          1, // addedByAdmin = 1 (Student cannot change name, fathersName, or mobile_no)
          'active',
          now,
          now
        );

        importedCount++;
        insertedStudents.push({
          id,
          name,
          fathersName,
          phone: rawPhone,
          course,
          semester,
          email,
          goal,
          addedByAdmin: 1
        });
      });
    });

    importTransaction(students);

    res.json({
      success: true,
      importedCount,
      skippedCount: skipped.length,
      skipped,
      students: insertedStudents,
      message: `Successfully imported ${importedCount} student${importedCount === 1 ? '' : 's'} from CSV.${skipped.length > 0 ? ` ${skipped.length} skipped due to duplicates/validation.` : ''}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Students: Update Student Profile (Student & Admin)
app.put('/api/students/:id', (req, res) => {
  try {
    const { id } = req.params;
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    const {
      name, fathersName, phone, course, semester, email, linkedin, github, portfolio,
      skills, softSkills, goal, bio, rollNo, graduationYear, jobType, city,
      resumeUrl, avatar, score, completion, byAdmin
    } = req.body;

    // Student NOT change student_name, fathers_name, mobile_no if added by admin!
    const isLockedForStudent = student.addedByAdmin === 1 && byAdmin !== true;

    const finalName = isLockedForStudent ? student.name : (name !== undefined ? name.trim() : student.name);
    const finalFathersName = isLockedForStudent ? student.fathersName : (fathersName !== undefined ? fathersName.trim() : student.fathersName);
    const finalPhone = isLockedForStudent ? student.phone : (phone !== undefined ? phone.trim() : student.phone);

    if (finalPhone && finalPhone !== student.phone) {
      if (!/^[0-9]{10}$/.test(finalPhone)) {
        return res.status(400).json({ error: 'Valid 10-digit phone number is required.' });
      }
      const phoneClash = db.prepare('SELECT id FROM students WHERE phone = ? AND id != ?').get(finalPhone, id);
      if (phoneClash) {
        return res.status(400).json({ error: 'Another student already has this phone number.' });
      }
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE students SET
        name = ?,
        fathersName = ?,
        phone = ?,
        course = COALESCE(?, course),
        semester = COALESCE(?, semester),
        email = COALESCE(?, email),
        linkedin = COALESCE(?, linkedin),
        github = COALESCE(?, github),
        portfolio = COALESCE(?, portfolio),
        skills = COALESCE(?, skills),
        softSkills = COALESCE(?, softSkills),
        goal = COALESCE(?, goal),
        bio = COALESCE(?, bio),
        rollNo = COALESCE(?, rollNo),
        graduationYear = COALESCE(?, graduationYear),
        jobType = COALESCE(?, jobType),
        city = COALESCE(?, city),
        resumeUrl = COALESCE(?, resumeUrl),
        avatar = COALESCE(?, avatar),
        score = COALESCE(?, score),
        completion = COALESCE(?, completion),
        updatedAt = ?
      WHERE id = ?
    `).run(
      finalName,
      finalFathersName,
      finalPhone,
      course || student.course,
      semester || student.semester,
      email !== undefined ? email.trim() : student.email,
      linkedin !== undefined ? linkedin.trim() : student.linkedin,
      github !== undefined ? github.trim() : student.github,
      portfolio !== undefined ? portfolio.trim() : student.portfolio,
      skills !== undefined ? skills.trim() : student.skills,
      softSkills !== undefined ? softSkills.trim() : student.softSkills,
      goal !== undefined ? goal.trim() : student.goal,
      bio !== undefined ? bio.trim() : student.bio,
      rollNo !== undefined ? rollNo.trim() : student.rollNo,
      graduationYear !== undefined ? graduationYear : student.graduationYear,
      jobType !== undefined ? jobType : student.jobType,
      city !== undefined ? city.trim() : student.city,
      resumeUrl !== undefined ? resumeUrl.trim() : student.resumeUrl,
      avatar !== undefined ? avatar : student.avatar,
      score !== undefined ? Number(score) : student.score,
      completion !== undefined ? Number(completion) : student.completion,
      now,
      id
    );

    const updated = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
    res.json({ success: true, student: updated, message: 'Profile details saved successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Students: Admin Delete Student
app.delete('/api/students/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM students WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Student not found.' });
    }
    res.json({ success: true, message: 'Student deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auth: Send OTP with strict Admin-Enrollment validation for students (validates Name and Mobile Number)
app.post('/api/auth/send-otp', (req, res) => {
  try {
    const { name, phone, role } = req.body;

    if (!phone || !/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({ error: 'Enter a valid 10-digit mobile number.' });
    }

    if (role === 'student') {
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Please enter your registered student name.' });
      }

      // VALIDATION: Student MUST be enrolled by Admin in the database
      const student = db.prepare('SELECT * FROM students WHERE phone = ?').get(phone);
      if (!student) {
        return res.status(403).json({
          error: 'Access Denied: Only students added by the Admin can log in. This mobile number is not registered in the student database.'
        });
      }

      if (!student.addedByAdmin) {
        return res.status(403).json({
          error: 'Access Denied: Your student record has not been authorized by the college administrator.'
        });
      }

      // Validate student name matches registered name (case-insensitive, trimmed)
      const inputName = name.trim().toLowerCase();
      const enrolledName = student.name.trim().toLowerCase();
      if (inputName !== enrolledName) {
        return res.status(403).json({
          error: `Name and mobile number do not match. The entered name does not match the enrolled student record for ${phone}.`
        });
      }

      // Generate OTP and store in DB
      const code = String(Math.floor(100000 + Math.random() * 900000));
      db.prepare('INSERT OR REPLACE INTO otps (phone, code, role, createdAt) VALUES (?, ?, ?, ?)').run(
        phone,
        code,
        'student',
        Date.now()
      );

      return res.json({
        success: true,
        otp: code, // returned for demo prompt/notice
        studentName: student.name,
        message: `Demo OTP sent to ${student.name} (${phone}): ${code}`
      });
    }

    if (role === 'admin') {
      let adminRecord = db.prepare("SELECT * FROM admins WHERE phone = ?").get(phone);
      const adminSetting = db.prepare("SELECT value FROM settings WHERE key = 'adminPhone'").get();
      const legacyPhone = adminSetting ? adminSetting.value : '9876543210';

      if (!adminRecord && phone !== legacyPhone) {
        return res.status(403).json({
          error: 'Access Denied: This mobile number is not registered as an administrator in the system.'
        });
      }

      if (adminRecord && adminRecord.status === 'suspended') {
        return res.status(403).json({
          error: 'Access Denied: Your administrator account has been suspended by the Chief Administrator.'
        });
      }

      const adminName = adminRecord ? adminRecord.name : 'Administrator';
      const code = String(Math.floor(100000 + Math.random() * 900000));
      db.prepare('INSERT OR REPLACE INTO otps (phone, code, role, createdAt) VALUES (?, ?, ?, ?)').run(
        phone,
        code,
        'admin',
        Date.now()
      );

      return res.json({
        success: true,
        otp: code,
        message: `Demo OTP sent to ${adminName} (${phone}): ${code}`
      });
    }

    return res.status(400).json({ error: 'Invalid role specified.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auth: Verify OTP and log in (verifying student name and phone)
app.post('/api/auth/verify-otp', (req, res) => {
  try {
    const { name, phone, otp, role } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: 'Mobile number and OTP are required.' });
    }

    const record = db.prepare('SELECT * FROM otps WHERE phone = ? AND role = ?').get(phone, role);
    if (!record || record.code !== otp) {
      return res.status(400).json({ error: 'Enter the valid OTP sent for this login.' });
    }

    // Clear used OTP
    db.prepare('DELETE FROM otps WHERE phone = ?').run(phone);

    if (role === 'student') {
      const student = db.prepare('SELECT * FROM students WHERE phone = ? AND addedByAdmin = 1').get(phone);
      if (!student) {
        return res.status(403).json({ error: 'Access Denied: Student record not found or not approved by admin.' });
      }

      if (name && student.name.trim().toLowerCase() !== name.trim().toLowerCase()) {
        return res.status(403).json({ error: 'Student name does not match the registered record.' });
      }

      return res.json({
        success: true,
        session: {
          role: 'student',
          id: student.id,
          student
        }
      });
    }

    if (role === 'admin') {
      let adminRecord = db.prepare('SELECT * FROM admins WHERE phone = ?').get(phone);
      if (!adminRecord) {
        adminRecord = {
          id: 'admin-super',
          name: 'Chief Administrator',
          phone,
          role: 'Super Admin',
          department: 'Executive Governance',
          permissions: JSON.stringify(['manage_students', 'manage_tests', 'manage_programs', 'manage_admins', 'view_reports', 'export_data', 'delete_records'])
        };
      }

      let permissions = [];
      try {
        permissions = JSON.parse(adminRecord.permissions);
      } catch {
        permissions = ['manage_students', 'manage_tests', 'manage_programs', 'manage_admins', 'view_reports', 'export_data', 'delete_records'];
      }

      return res.json({
        success: true,
        session: {
          role: 'admin',
          id: adminRecord.id,
          name: adminRecord.name,
          adminPhone: adminRecord.phone,
          adminRole: adminRecord.role,
          department: adminRecord.department,
          avatar: adminRecord.avatar || '',
          permissions,
          admin: {
            ...adminRecord,
            avatar: adminRecord.avatar || '',
            permissions
          }
        }
      });
    }

    return res.status(400).json({ error: 'Invalid role.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// COURSE & CERTIFICATE PROGRAMS
// ==========================================

// Programs: List all course/certificate programs
app.get('/api/programs', (req, res) => {
  try {
    const { studentId } = req.query;
    const programs = db.prepare('SELECT * FROM programs ORDER BY createdAt DESC').all();

    const enriched = programs.map((prog) => {
      const clickCountRow = db.prepare('SELECT COUNT(DISTINCT studentId) as count FROM program_clicks WHERE programId = ?').get(prog.id);
      const submissionCountRow = db.prepare('SELECT COUNT(*) as count FROM certificates WHERE programId = ?').get(prog.id);

      let studentClicked = false;
      let studentClickedAt = null;
      let studentSubmission = null;

      if (studentId) {
        const clickRecord = db.prepare('SELECT clickedAt FROM program_clicks WHERE programId = ? AND studentId = ?').get(prog.id, studentId);
        if (clickRecord) {
          studentClicked = true;
          studentClickedAt = clickRecord.clickedAt;
        }
        const certRecord = db.prepare('SELECT * FROM certificates WHERE programId = ? AND studentId = ? ORDER BY submittedAt DESC LIMIT 1').get(prog.id, studentId);
        if (certRecord) {
          studentSubmission = certRecord;
        }
      }

      return {
        ...prog,
        clickCount: clickCountRow ? clickCountRow.count : 0,
        submissionCount: submissionCountRow ? submissionCountRow.count : 0,
        studentClicked,
        studentClickedAt,
        studentSubmission
      };
    });

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Programs: Admin Add Course or Certificate Program
app.post('/api/programs', (req, res) => {
  try {
    const { title, issuer, description, link, bannerImg, targetCourse, targetSemester, deadline, rewardPoints } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Program title is required.' });
    }
    if (!link || !link.trim()) {
      return res.status(400).json({ error: 'Official Course or Certificate link is required.' });
    }

    const id = `prog-${Date.now()}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO programs (id, title, issuer, description, link, bannerImg, targetCourse, targetSemester, deadline, rewardPoints, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title.trim(),
      issuer && issuer.trim() ? issuer.trim() : 'Podar Academy',
      description ? description.trim() : '',
      link.trim(),
      bannerImg ? bannerImg.trim() : '',
      targetCourse || 'All',
      targetSemester || 'All',
      deadline || '',
      rewardPoints ? Number(rewardPoints) : 15,
      'active',
      now,
      now
    );

    // Create a notification for all students
    db.prepare(`
      INSERT INTO notifications (id, studentId, title, message, type, programId, read, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `notif-${Date.now()}`,
      'all',
      `New Program: ${title.trim()}`,
      `Admin assigned "${title.trim()}" (${issuer || 'Podar'}). Click the official link to enroll and upload your certificate!`,
      'program',
      id,
      0,
      now
    );

    const newProg = db.prepare('SELECT * FROM programs WHERE id = ?').get(id);
    res.status(201).json({
      success: true,
      program: newProg,
      message: 'Course or Certificate Program added and notified to students!'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Programs: Admin Update Course or Certificate Program (including banner image)
app.put('/api/programs/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, issuer, description, link, bannerImg, targetCourse, targetSemester, deadline, rewardPoints, status } = req.body;

    const prog = db.prepare('SELECT * FROM programs WHERE id = ?').get(id);
    if (!prog) {
      return res.status(404).json({ error: 'Program not found.' });
    }

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE programs SET
        title = ?,
        issuer = ?,
        description = ?,
        link = ?,
        bannerImg = ?,
        targetCourse = ?,
        targetSemester = ?,
        deadline = ?,
        rewardPoints = ?,
        status = ?,
        updatedAt = ?
      WHERE id = ?
    `).run(
      title !== undefined && title.trim() ? title.trim() : prog.title,
      issuer !== undefined ? (issuer.trim() || 'Podar Academy') : prog.issuer,
      description !== undefined ? description.trim() : prog.description,
      link !== undefined && link.trim() ? link.trim() : prog.link,
      bannerImg !== undefined ? bannerImg : prog.bannerImg,
      targetCourse || prog.targetCourse,
      targetSemester || prog.targetSemester,
      deadline !== undefined ? deadline : prog.deadline,
      rewardPoints !== undefined ? Number(rewardPoints) : prog.rewardPoints,
      status || prog.status,
      now,
      id
    );

    const updated = db.prepare('SELECT * FROM programs WHERE id = ?').get(id);
    res.json({
      success: true,
      program: updated,
      message: 'Program updated successfully!'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Programs: Admin Delete Program
app.delete('/api/programs/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM programs WHERE id = ?').run(id);
    db.prepare('DELETE FROM program_clicks WHERE programId = ?').run(id);
    res.json({ success: true, message: 'Program deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tracking: Student Clicked Official Course Link
app.post('/api/programs/:id/click', (req, res) => {
  try {
    const { id } = req.params;
    const { studentId, studentName, studentPhone } = req.body;

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required.' });
    }

    const prog = db.prepare('SELECT id, title FROM programs WHERE id = ?').get(id);
    if (!prog) {
      return res.status(404).json({ error: 'Program not found.' });
    }

    const now = new Date().toISOString();
    const existing = db.prepare('SELECT id FROM program_clicks WHERE programId = ? AND studentId = ?').get(id, studentId);

    if (existing) {
      db.prepare('UPDATE program_clicks SET clickedAt = ?, studentName = ? WHERE id = ?').run(
        now,
        studentName || 'Student',
        existing.id
      );
    } else {
      db.prepare(`
        INSERT INTO program_clicks (id, programId, studentId, studentName, studentPhone, clickedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        `click-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        id,
        studentId,
        studentName || 'Student',
        studentPhone || '',
        now
      );
    }

    res.json({ success: true, message: 'Link click tracked successfully.', clickedAt: now });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tracking: Admin View Click Engagement (Who clicked & who did not)
app.get('/api/programs/:id/clicks', (req, res) => {
  try {
    const { id } = req.params;
    const clicks = db.prepare(`
      SELECT pc.*, s.course, s.semester, s.email, s.rollNo
      FROM program_clicks pc
      LEFT JOIN students s ON pc.studentId = s.id
      WHERE pc.programId = ?
      ORDER BY pc.clickedAt DESC
    `).all(id);

    const allStudents = db.prepare('SELECT id, name, phone, course, semester, rollNo FROM students ORDER BY name ASC').all();
    const clickedStudentIds = new Set(clicks.map((c) => c.studentId));
    const notClickedStudents = allStudents.filter((s) => !clickedStudentIds.has(s.id));

    res.json({
      clicks,
      totalClicked: clicks.length,
      notClicked: notClickedStudents,
      totalStudents: allStudents.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// CERTIFICATE UPLOAD & VERIFICATION
// ==========================================

// Certificates: Admin View All Submissions
app.get('/api/certificates', (req, res) => {
  try {
    const certificates = db.prepare(`
      SELECT c.*, s.course, s.semester, s.rollNo, s.score as studentScore
      FROM certificates c
      LEFT JOIN students s ON c.studentId = s.id
      ORDER BY c.submittedAt DESC
    `).all();
    res.json(certificates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Certificates: Student View Their Own Submissions
app.get('/api/students/:id/certificates', (req, res) => {
  try {
    const { id } = req.params;
    const certs = db.prepare('SELECT * FROM certificates WHERE studentId = ? ORDER BY submittedAt DESC').all(id);
    res.json(certs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Certificates: Student Uploads / Submits Certificate
app.post('/api/certificates', (req, res) => {
  try {
    const {
      programId, programTitle, studentId, studentName, studentPhone,
      credentialId, issueDate, fileData, fileName
    } = req.body;

    if (!programTitle || !programTitle.trim()) {
      return res.status(400).json({ error: 'Certificate program or credential title is required.' });
    }
    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required.' });
    }
    if (!fileData) {
      return res.status(400).json({ error: 'Please upload a certificate document or image file.' });
    }

    const id = `cert-${Date.now()}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO certificates (
        id, programId, programTitle, studentId, studentName, studentPhone,
        credentialId, issueDate, fileData, fileName, status, submittedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).run(
      id,
      programId || null,
      programTitle.trim(),
      studentId,
      studentName || 'Student',
      studentPhone || '',
      credentialId ? credentialId.trim() : '',
      issueDate || '',
      fileData,
      fileName || 'certificate.png',
      now
    );

    const newCert = db.prepare('SELECT * FROM certificates WHERE id = ?').get(id);

    // Notify administrators about new certificate needing verification
    try {
      db.prepare(`
        INSERT INTO notifications (id, studentId, title, message, type, programId, read, createdAt)
        VALUES (?, 'admin', ?, ?, 'verification', ?, 0, ?)
      `).run(
        `notif-${Date.now()}`,
        `Certificate Submitted: ${studentName || 'Student'}`,
        `${studentName || 'Student'} uploaded a certificate for "${programTitle.trim()}" requiring verification.`,
        id,
        now
      );
    } catch (notifErr) {
      console.warn('Certificate notification warning:', notifErr.message);
    }

    res.status(201).json({
      success: true,
      certificate: newCert,
      message: 'Certificate uploaded successfully! Submitted for Admin verification.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Certificates: Admin Check & Verify or Reject Certificate
app.put('/api/certificates/:id/verify', (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminRemarks, verifiedBy, verificationCode } = req.body;

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be verified or rejected.' });
    }

    const cert = db.prepare('SELECT * FROM certificates WHERE id = ?').get(id);
    if (!cert) {
      return res.status(404).json({ error: 'Certificate record not found.' });
    }

    const now = new Date().toISOString();
    const finalVerifier = verifiedBy ? verifiedBy.trim() : 'Podar Academic Board';
    const finalCode = verificationCode ? verificationCode.trim() : (cert.verificationCode || `PODAR-VERIF-${Math.floor(100000 + Math.random() * 900000)}`);

    db.prepare(`
      UPDATE certificates SET
        status = ?,
        adminRemarks = ?,
        verifiedBy = ?,
        verificationCode = ?,
        verifiedAt = ?
      WHERE id = ?
    `).run(
      status,
      adminRemarks ? adminRemarks.trim() : (status === 'verified' ? 'Approved & verified by college administrator.' : 'Rejected'),
      status === 'verified' ? finalVerifier : null,
      status === 'verified' ? finalCode : null,
      now,
      id
    );

    // If verified, reward score points and increment student verified certificate count
    if (status === 'verified' && cert.status !== 'verified') {
      const student = db.prepare('SELECT * FROM students WHERE id = ?').get(cert.studentId);
      if (student) {
        const newCerts = (student.certificates || 0) + 1;
        const newScore = Math.min(100, (student.score || 40) + 12);
        const newCompletion = Math.min(100, (student.completion || 50) + 8);

        db.prepare('UPDATE students SET certificates = ?, score = ?, completion = ?, updatedAt = ? WHERE id = ?').run(
          newCerts,
          newScore,
          newCompletion,
          now,
          student.id
        );
      }

      // Notify student
      db.prepare(`
        INSERT INTO notifications (id, studentId, title, message, type, programId, read, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `notif-${Date.now()}`,
        cert.studentId,
        'Certificate Verified! 🎉',
        `Your certificate for "${cert.programTitle}" has been verified by the administrator (+12 P-CARE score rewarded).`,
        'verification',
        cert.programId || null,
        0,
        now
      );
    } else if (status === 'rejected') {
      // Notify student of rejection
      db.prepare(`
        INSERT INTO notifications (id, studentId, title, message, type, programId, read, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `notif-${Date.now()}`,
        cert.studentId,
        'Certificate Needs Revision',
        `Your certificate for "${cert.programTitle}" was not verified: ${adminRemarks || 'Please re-upload a clear credential.'}`,
        'verification',
        cert.programId || null,
        0,
        now
      );
    }

    const updatedCert = db.prepare('SELECT * FROM certificates WHERE id = ?').get(id);
    res.json({
      success: true,
      certificate: updatedCert,
      message: status === 'verified' ? 'Certificate verified and approved successfully!' : 'Certificate marked as rejected.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// NOTIFICATIONS
// ==========================================

// Notifications: List for student or admin
app.get('/api/notifications', (req, res) => {
  try {
    const { studentId, role } = req.query;
    let notifs = [];
    if (studentId) {
      notifs = db.prepare(`
        SELECT * FROM notifications
        WHERE studentId = ? OR studentId = 'all'
        ORDER BY createdAt DESC
        LIMIT 50
      `).all(studentId);
    } else if (role === 'admin' || !studentId) {
      // For Admin, get notifications targeted to admin or global system broadcasts
      notifs = db.prepare(`
        SELECT * FROM notifications
        WHERE studentId = 'admin' OR studentId = 'all'
        ORDER BY createdAt DESC
        LIMIT 50
      `).all();
    } else {
      notifs = db.prepare('SELECT * FROM notifications ORDER BY createdAt DESC LIMIT 50').all();
    }
    res.json(notifs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark single notification as read
app.put('/api/notifications/:id/read', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all notifications as read
app.put('/api/notifications/read-all', (req, res) => {
  try {
    const { studentId, role } = req.body || {};
    if (studentId) {
      db.prepare("UPDATE notifications SET read = 1 WHERE (studentId = ? OR studentId = 'all') AND read = 0").run(studentId);
    } else {
      db.prepare("UPDATE notifications SET read = 1 WHERE (studentId = 'admin' OR studentId = 'all') AND read = 0").run();
    }
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete individual notification
app.delete('/api/notifications/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM notifications WHERE id = ?').run(id);
    res.json({ success: true, message: 'Notification removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear all read notifications
app.delete('/api/notifications/clear/read', (req, res) => {
  try {
    const { studentId } = req.query;
    if (studentId) {
      db.prepare("DELETE FROM notifications WHERE (studentId = ? OR studentId = 'all') AND read = 1").run(studentId);
    } else {
      db.prepare("DELETE FROM notifications WHERE (studentId = 'admin' OR studentId = 'all') AND read = 1").run();
    }
    res.json({ success: true, message: 'Read notifications cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// TESTS & ASSESSMENTS
// ==========================================

// Tests: List all tests (with attempt stats)
app.get('/api/tests', (req, res) => {
  try {
    const { studentId, course, semester } = req.query;
    let tests = db.prepare('SELECT * FROM tests ORDER BY createdAt DESC').all();

    if (course && course !== 'All') {
      tests = tests.filter(t => t.targetCourse === 'All' || t.targetCourse === course);
    }
    if (semester && semester !== 'All') {
      tests = tests.filter(t => t.targetSemester === 'All' || t.targetSemester === semester);
    }

    const enhanced = tests.map(test => {
      let questions = [];
      try {
        questions = JSON.parse(test.questions || '[]');
      } catch (e) {
        questions = [];
      }

      const subCountRow = db.prepare('SELECT COUNT(*) as count FROM test_submissions WHERE testId = ?').get(test.id);
      const submissionCount = subCountRow ? subCountRow.count : 0;

      let studentSubmission = null;
      if (studentId) {
        studentSubmission = db.prepare(`
          SELECT id, score, totalMarks, percentage, status, submittedAt, checkedAt, adminRemarks
          FROM test_submissions
          WHERE testId = ? AND studentId = ?
          ORDER BY submittedAt DESC
          LIMIT 1
        `).get(test.id, studentId);
      }

      return {
        ...test,
        questionsCount: questions.length,
        submissionCount,
        studentAttempted: !!studentSubmission,
        studentSubmission: studentSubmission || null
      };
    });

    res.json(enhanced);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tests: Get single test with questions
app.get('/api/tests/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { mode } = req.query;
    const test = db.prepare('SELECT * FROM tests WHERE id = ?').get(id);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    let questions = [];
    try {
      questions = JSON.parse(test.questions || '[]');
    } catch (e) {
      questions = [];
    }

    if (mode === 'exam') {
      // Strip correctIndex and explanation during live exam to prevent client inspection cheating
      questions = questions.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options,
        marks: q.marks || 10
      }));
    }

    res.json({
      ...test,
      questions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tests: Admin create test
app.post('/api/tests', (req, res) => {
  try {
    const {
      title,
      category = 'Technical',
      description = '',
      targetCourse = 'All',
      targetSemester = 'All',
      durationMinutes = 20,
      totalMarks,
      passingMarks = 40,
      rewardPoints = 15,
      status = 'active',
      questions = []
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Test title is required.' });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'At least one test question is required.' });
    }

    const sanitizedQuestions = questions.map((q, idx) => {
      const qText = q.question && q.question.trim() ? q.question.trim() : `Question ${idx + 1}`;
      const options = Array.isArray(q.options) && q.options.length >= 2 
        ? q.options.map(opt => String(opt).trim()) 
        : ['Option A', 'Option B', 'Option C', 'Option D'];
      const correctIndex = Number(q.correctIndex) >= 0 && Number(q.correctIndex) < options.length ? Number(q.correctIndex) : 0;
      const marks = Number(q.marks) > 0 ? Number(q.marks) : 10;
      const explanation = q.explanation ? String(q.explanation).trim() : '';
      return {
        id: q.id || `q-${Date.now()}-${idx + 1}`,
        question: qText,
        options,
        correctIndex,
        marks,
        explanation
      };
    });

    const calculatedTotalMarks = sanitizedQuestions.reduce((sum, q) => sum + (q.marks || 10), 0);
    const finalTotalMarks = Number(totalMarks) > 0 ? Number(totalMarks) : calculatedTotalMarks;
    const finalPassingMarks = Number(passingMarks) > 0 ? Number(passingMarks) : Math.round(finalTotalMarks * 0.4);

    const id = `test-${Date.now()}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO tests (
        id, title, category, description, targetCourse, targetSemester,
        durationMinutes, totalMarks, passingMarks, rewardPoints, status, questions, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title.trim(),
      category.trim(),
      description.trim(),
      targetCourse,
      targetSemester,
      Number(durationMinutes) || 20,
      finalTotalMarks,
      finalPassingMarks,
      Number(rewardPoints) || 15,
      status,
      JSON.stringify(sanitizedQuestions),
      now,
      now
    );

    // Notify all students
    db.prepare(`
      INSERT INTO notifications (id, studentId, title, message, type, programId, read, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `notif-${Date.now()}`,
      'all',
      'New Assessment Available 📝',
      `Admin published "${title.trim()}" (${sanitizedQuestions.length} questions, ${durationMinutes} mins). Take the test to boost your P-CARE score!`,
      'test',
      id,
      0,
      now
    );

    const createdTest = db.prepare('SELECT * FROM tests WHERE id = ?').get(id);
    res.json({
      success: true,
      test: {
        ...createdTest,
        questions: sanitizedQuestions
      },
      message: 'Test created and published successfully!'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tests: Admin update test
app.put('/api/tests/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM tests WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const {
      title,
      category,
      description,
      targetCourse,
      targetSemester,
      durationMinutes,
      totalMarks,
      passingMarks,
      rewardPoints,
      status,
      questions
    } = req.body;

    let sanitizedQuestions = null;
    let finalTotalMarks = existing.totalMarks;

    if (Array.isArray(questions) && questions.length > 0) {
      sanitizedQuestions = questions.map((q, idx) => ({
        id: q.id || `q-${Date.now()}-${idx + 1}`,
        question: q.question && q.question.trim() ? q.question.trim() : `Question ${idx + 1}`,
        options: Array.isArray(q.options) && q.options.length >= 2 ? q.options.map(opt => String(opt).trim()) : ['Option A', 'Option B'],
        correctIndex: Number(q.correctIndex) >= 0 ? Number(q.correctIndex) : 0,
        marks: Number(q.marks) > 0 ? Number(q.marks) : 10,
        explanation: q.explanation ? String(q.explanation).trim() : ''
      }));
      finalTotalMarks = Number(totalMarks) > 0 ? Number(totalMarks) : sanitizedQuestions.reduce((sum, q) => sum + q.marks, 0);
    } else if (Number(totalMarks) > 0) {
      finalTotalMarks = Number(totalMarks);
    }

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE tests SET
        title = COALESCE(?, title),
        category = COALESCE(?, category),
        description = COALESCE(?, description),
        targetCourse = COALESCE(?, targetCourse),
        targetSemester = COALESCE(?, targetSemester),
        durationMinutes = COALESCE(?, durationMinutes),
        totalMarks = ?,
        passingMarks = COALESCE(?, passingMarks),
        rewardPoints = COALESCE(?, rewardPoints),
        status = COALESCE(?, status),
        questions = COALESCE(?, questions),
        updatedAt = ?
      WHERE id = ?
    `).run(
      title ? title.trim() : null,
      category ? category.trim() : null,
      description !== undefined ? description.trim() : null,
      targetCourse || null,
      targetSemester || null,
      durationMinutes ? Number(durationMinutes) : null,
      finalTotalMarks,
      passingMarks ? Number(passingMarks) : null,
      rewardPoints ? Number(rewardPoints) : null,
      status || null,
      sanitizedQuestions ? JSON.stringify(sanitizedQuestions) : null,
      now,
      id
    );

    const updated = db.prepare('SELECT * FROM tests WHERE id = ?').get(id);
    res.json({
      success: true,
      test: {
        ...updated,
        questions: JSON.parse(updated.questions || '[]')
      },
      message: 'Test updated successfully!'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tests: Admin delete test
app.delete('/api/tests/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM test_submissions WHERE testId = ?').run(id);
    db.prepare('DELETE FROM tests WHERE id = ?').run(id);
    res.json({ success: true, message: 'Test and associated submissions deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tests: Student submit answers
app.post('/api/tests/:id/submit', (req, res) => {
  try {
    const { id } = req.params;
    const test = db.prepare('SELECT * FROM tests WHERE id = ?').get(id);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const {
      studentId,
      studentName = 'Student',
      studentPhone = '',
      studentCourse = 'All',
      studentSemester = 'All',
      timeSpentSeconds = 0,
      answers = {}
    } = req.body;

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required to submit test.' });
    }

    const questions = JSON.parse(test.questions || '[]');
    let calculatedScore = 0;
    let totalMarks = 0;

    const gradedAnswers = questions.map((q, idx) => {
      const qMarks = Number(q.marks) || 10;
      totalMarks += qMarks;

      let selectedIndex = null;
      if (Array.isArray(answers)) {
        const found = answers.find(a => a.questionId === q.id || a.qId === q.id || a.id === q.id);
        if (found) selectedIndex = found.selectedIndex;
      } else if (answers && typeof answers === 'object') {
        selectedIndex = answers[q.id] !== undefined ? answers[q.id] : answers[idx];
      }

      const isAnswered = selectedIndex !== null && selectedIndex !== undefined && selectedIndex >= 0;
      const isCorrect = isAnswered && Number(selectedIndex) === Number(q.correctIndex);
      const marksAwarded = isCorrect ? qMarks : 0;
      calculatedScore += marksAwarded;

      return {
        questionId: q.id,
        question: q.question,
        options: q.options,
        selectedIndex: isAnswered ? Number(selectedIndex) : null,
        correctIndex: q.correctIndex,
        isCorrect,
        marksAwarded,
        marks: qMarks,
        explanation: q.explanation || ''
      };
    });

    if (test.totalMarks && Number(test.totalMarks) > 0) {
      totalMarks = Number(test.totalMarks);
    }
    const percentage = totalMarks > 0 ? Math.round((calculatedScore / totalMarks) * 100) : 0;
    const passingMarks = Number(test.passingMarks) || Math.round(totalMarks * 0.4);
    const passed = calculatedScore >= passingMarks;
    const status = passed ? 'passed' : 'failed';

    const submissionId = `sub-${Date.now()}`;
    const now = new Date().toISOString();

    const initialRemark = passed
      ? `Auto-graded: Passed with ${percentage}%. Strong performance!`
      : `Auto-graded: Scored ${calculatedScore}/${totalMarks} (${percentage}%). Passing cutoff is ${passingMarks} marks. Revision recommended.`;

    db.prepare(`
      INSERT INTO test_submissions (
        id, testId, testTitle, studentId, studentName, studentPhone,
        studentCourse, studentSemester, score, totalMarks, percentage,
        status, timeSpentSeconds, answers, adminRemarks, submittedAt, checkedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      submissionId,
      test.id,
      test.title,
      studentId,
      studentName,
      studentPhone,
      studentCourse,
      studentSemester,
      calculatedScore,
      totalMarks,
      percentage,
      status,
      Number(timeSpentSeconds) || 0,
      JSON.stringify(gradedAnswers),
      initialRemark,
      now,
      null
    );

    // Award rewardPoints to student's score if passed
    let rewardedPoints = 0;
    if (passed) {
      rewardedPoints = Number(test.rewardPoints) || 15;
      const student = db.prepare('SELECT score, completion FROM students WHERE id = ?').get(studentId);
      if (student) {
        const newScore = Math.min(100, (student.score || 40) + Math.round(rewardedPoints * 0.5));
        const newCompletion = Math.min(100, (student.completion || 50) + 5);
        db.prepare('UPDATE students SET score = ?, completion = ?, updatedAt = ? WHERE id = ?').run(
          newScore,
          newCompletion,
          now,
          studentId
        );
      }
    }

    // Notify student
    db.prepare(`
      INSERT INTO notifications (id, studentId, title, message, type, programId, read, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `notif-${Date.now()}`,
      studentId,
      passed ? 'Test Passed! 🎯' : 'Test Submitted 📋',
      `You completed "${test.title}" with score ${calculatedScore}/${totalMarks} (${percentage}%). ${passed ? `+${rewardedPoints} P-CARE reward points awarded!` : 'Keep practicing!'}`,
      'test',
      test.id,
      0,
      now
    );

    // Notify admin
    try {
      db.prepare(`
        INSERT INTO notifications (id, studentId, title, message, type, programId, read, createdAt)
        VALUES (?, 'admin', ?, ?, 'test', ?, 0, ?)
      `).run(
        `notif-${Date.now()}-adm`,
        `Test Attempt: ${studentName || 'Student'}`,
        `${studentName || 'Student'} completed "${test.title}" scoring ${calculatedScore}/${totalMarks} (${percentage}% - ${passed ? 'PASSED' : 'FAILED'}).`,
        test.id,
        0,
        now
      );
    } catch {}

    res.json({
      success: true,
      submissionId,
      score: calculatedScore,
      totalMarks,
      percentage,
      status,
      passingMarks,
      timeSpentSeconds,
      rewardedPoints: passed ? rewardedPoints : 0,
      gradedAnswers,
      message: passed ? 'Congratulations! You passed the test.' : 'Test completed. Check your answers and explanations.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test Submissions: Admin list all submissions
app.get('/api/test-submissions', (req, res) => {
  try {
    const { testId, studentId, status } = req.query;
    let query = 'SELECT * FROM test_submissions WHERE 1=1';
    const params = [];

    if (testId) {
      query += ' AND testId = ?';
      params.push(testId);
    }
    if (studentId) {
      query += ' AND studentId = ?';
      params.push(studentId);
    }
    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY submittedAt DESC';
    const submissions = db.prepare(query).all(...params);

    const parsed = submissions.map(s => {
      let answersList = [];
      try {
        answersList = JSON.parse(s.answers || '[]');
      } catch (e) {
        answersList = [];
      }
      return {
        ...s,
        answersCount: answersList.length,
        answers: answersList
      };
    });

    res.json(parsed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test Submissions: Get single submission by ID
app.get('/api/test-submissions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const sub = db.prepare('SELECT * FROM test_submissions WHERE id = ?').get(id);
    if (!sub) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    let answers = [];
    try {
      answers = JSON.parse(sub.answers || '[]');
    } catch (e) {
      answers = [];
    }

    res.json({
      ...sub,
      answers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test Submissions: Admin Check & Grade Test
app.put('/api/test-submissions/:id/review', (req, res) => {
  try {
    const { id } = req.params;
    const { score, status, adminRemarks } = req.body;

    const sub = db.prepare('SELECT * FROM test_submissions WHERE id = ?').get(id);
    if (!sub) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const finalScore = score !== undefined && Number(score) >= 0 ? Number(score) : sub.score;
    const finalPercentage = sub.totalMarks > 0 ? Math.round((finalScore / sub.totalMarks) * 100) : sub.percentage;
    const finalStatus = status && ['passed', 'failed', 'under_review'].includes(status) ? status : sub.status;
    const finalRemarks = adminRemarks ? adminRemarks.trim() : (sub.adminRemarks || 'Reviewed and evaluated by faculty.');
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE test_submissions SET
        score = ?,
        percentage = ?,
        status = ?,
        adminRemarks = ?,
        checkedAt = ?
      WHERE id = ?
    `).run(
      finalScore,
      finalPercentage,
      finalStatus,
      finalRemarks,
      now,
      id
    );

    // Notify student about faculty grading/review
    db.prepare(`
      INSERT INTO notifications (id, studentId, title, message, type, programId, read, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `notif-${Date.now()}`,
      sub.studentId,
      'Test Graded by Faculty 👨‍🏫',
      `Your test "${sub.testTitle}" was checked by faculty. Marks: ${finalScore}/${sub.totalMarks} (${finalStatus.toUpperCase()}). Faculty Note: "${finalRemarks}"`,
      'test',
      sub.testId,
      0,
      now
    );

    const updated = db.prepare('SELECT * FROM test_submissions WHERE id = ?').get(id);
    let answers = [];
    try {
      answers = JSON.parse(updated.answers || '[]');
    } catch (e) {
      answers = [];
    }

    res.json({
      success: true,
      submission: {
        ...updated,
        answers
      },
      message: 'Test checked and graded successfully!'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Student: List submissions by student
app.get('/api/students/:id/test-submissions', (req, res) => {
  try {
    const { id } = req.params;
    const submissions = db.prepare(`
      SELECT * FROM test_submissions
      WHERE studentId = ?
      ORDER BY submittedAt DESC
    `).all(id);

    const parsed = submissions.map(s => {
      let answers = [];
      try {
        answers = JSON.parse(s.answers || '[]');
      } catch (e) {
        answers = [];
      }
      return {
        ...s,
        answers
      };
    });

    res.json(parsed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// ACADEMIC & EVENT SCHEDULE CALENDAR ROUTES
// ==========================================

// List schedules with optional filters
app.get('/api/schedules', (req, res) => {
  try {
    const { month, course, semester, category } = req.query;
    let query = `SELECT * FROM schedules WHERE 1=1`;
    const params = [];

    if (month) {
      query += ` AND date LIKE ?`;
      params.push(`${month}%`);
    }

    if (course && course !== 'All') {
      query += ` AND (targetCourse = 'All' OR targetCourse = ?)`;
      params.push(course);
    }

    if (semester && semester !== 'All') {
      query += ` AND (targetSemester = 'All' OR targetSemester = ?)`;
      params.push(semester);
    }

    if (category && category !== 'All') {
      query += ` AND category = ?`;
      params.push(category);
    }

    query += ` ORDER BY date ASC, startTime ASC`;

    const schedules = db.prepare(query).all(...params);
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single schedule item
app.get('/api/schedules/:id', (req, res) => {
  try {
    const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(req.params.id);
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule item not found' });
    }
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Create new schedule item
app.post('/api/schedules', (req, res) => {
  try {
    const {
      title,
      category = 'Lecture',
      date,
      startTime = '',
      endTime = '',
      location = '',
      meetLink = '',
      targetCourse = 'All',
      targetSemester = 'All',
      instructor = '',
      description = '',
      isMandatory = 0,
      notifyStudents = false,
      adminName = 'Admin'
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Schedule event title is required.' });
    }
    if (!date || !date.trim()) {
      return res.status(400).json({ error: 'Event date is required (YYYY-MM-DD).' });
    }

    const id = `sch-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO schedules (
        id, title, category, date, startTime, endTime, location, meetLink,
        targetCourse, targetSemester, instructor, description, isMandatory,
        createdBy, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title.trim(),
      category,
      date.trim(),
      startTime.trim(),
      endTime.trim(),
      location.trim(),
      meetLink.trim(),
      targetCourse,
      targetSemester,
      instructor.trim(),
      description.trim(),
      isMandatory ? 1 : 0,
      adminName,
      now,
      now
    );

    // If notifyStudents is enabled, broadcast a notification
    if (notifyStudents) {
      try {
        db.prepare(`
          INSERT INTO notifications (id, studentId, title, message, type, programId, read, createdAt)
          VALUES (?, 'all', ?, ?, 'schedule', ?, 0, ?)
        `).run(
          `notif-${Date.now()}`,
          `New Schedule: ${title.trim()}`,
          `Scheduled on ${date.trim()} (${startTime.trim() || 'All Day'}) for ${targetCourse} (Sem ${targetSemester}). Location: ${location || 'Online'}`,
          id,
          now
        );
      } catch (err) {
        console.error('Notification error for schedule:', err.message);
      }
    }

    const created = db.prepare('SELECT * FROM schedules WHERE id = ?').get(id);
    res.status(201).json({ message: 'Event scheduled successfully!', schedule: created });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Update schedule item
app.put('/api/schedules/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM schedules WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Schedule event not found' });
    }

    const {
      title,
      category,
      date,
      startTime,
      endTime,
      location,
      meetLink,
      targetCourse,
      targetSemester,
      instructor,
      description,
      isMandatory
    } = req.body;

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE schedules
      SET title = ?, category = ?, date = ?, startTime = ?, endTime = ?,
          location = ?, meetLink = ?, targetCourse = ?, targetSemester = ?,
          instructor = ?, description = ?, isMandatory = ?, updatedAt = ?
      WHERE id = ?
    `).run(
      title !== undefined ? title.trim() : existing.title,
      category !== undefined ? category : existing.category,
      date !== undefined ? date.trim() : existing.date,
      startTime !== undefined ? startTime.trim() : existing.startTime,
      endTime !== undefined ? endTime.trim() : existing.endTime,
      location !== undefined ? location.trim() : existing.location,
      meetLink !== undefined ? meetLink.trim() : existing.meetLink,
      targetCourse !== undefined ? targetCourse : existing.targetCourse,
      targetSemester !== undefined ? targetSemester : existing.targetSemester,
      instructor !== undefined ? instructor.trim() : existing.instructor,
      description !== undefined ? description.trim() : existing.description,
      isMandatory !== undefined ? (isMandatory ? 1 : 0) : existing.isMandatory,
      now,
      id
    );

    const updated = db.prepare('SELECT * FROM schedules WHERE id = ?').get(id);
    res.json({ message: 'Schedule updated successfully', schedule: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Delete schedule item
app.delete('/api/schedules/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM schedules WHERE id = ?').run(id);
    db.prepare('DELETE FROM attendance WHERE scheduleId = ?').run(id);
    res.json({ message: 'Schedule event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// ATTENDANCE MANAGEMENT SYSTEM ENDPOINTS
// ============================================================

// Get attendance register for a specific schedule event
app.get('/api/attendance', (req, res) => {
  try {
    const { scheduleId } = req.query;
    if (!scheduleId) {
      return res.status(400).json({ error: 'scheduleId query parameter is required' });
    }

    const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(scheduleId);
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule event not found' });
    }

    // Determine target students
    let studentQuery = `SELECT id, name, phone, email, course, semester, rollNo FROM students WHERE 1=1`;
    const params = [];

    if (schedule.targetCourse && schedule.targetCourse !== 'All' && schedule.targetCourse !== 'All Courses') {
      studentQuery += ` AND (course = ? OR course = 'All')`;
      params.push(schedule.targetCourse);
    }
    if (schedule.targetSemester && schedule.targetSemester !== 'All' && schedule.targetSemester !== 'All Semesters') {
      studentQuery += ` AND (semester = ? OR semester = 'All')`;
      params.push(schedule.targetSemester);
    }

    studentQuery += ` ORDER BY name ASC`;
    let students = db.prepare(studentQuery).all(...params);

    // If filter yielded 0 students (e.g. course code mismatch), fallback to all active students
    if (students.length === 0) {
      students = db.prepare('SELECT id, name, phone, email, course, semester, rollNo FROM students ORDER BY name ASC').all();
    }

    // Get existing attendance records for this schedule
    const markedRecords = db.prepare('SELECT * FROM attendance WHERE scheduleId = ?').all(scheduleId);
    const markedMap = {};
    markedRecords.forEach(rec => {
      markedMap[rec.studentId] = rec;
    });

    // Merge student roster with attendance status
    const roster = students.map(st => {
      const existing = markedMap[st.id];
      return {
        studentId: st.id,
        name: st.name,
        rollNo: st.rollNo || st.id.slice(-6).toUpperCase(),
        course: st.course,
        semester: st.semester,
        status: existing ? existing.status : 'Unmarked',
        remarks: existing ? existing.remarks : '',
        markedAt: existing ? existing.markedAt : null,
        markedBy: existing ? existing.markedBy : null
      };
    });

    // Compute stats
    const totalStudents = roster.length;
    const presentCount = roster.filter(r => r.status === 'Present').length;
    const absentCount = roster.filter(r => r.status === 'Absent').length;
    const lateCount = roster.filter(r => r.status === 'Late').length;
    const unmarkedCount = roster.filter(r => r.status === 'Unmarked').length;
    const markedCount = totalStudents - unmarkedCount;
    const percentage = markedCount > 0 ? Math.round(((presentCount + lateCount) / markedCount) * 100) : 0;

    res.json({
      schedule,
      roster,
      stats: {
        totalStudents,
        presentCount,
        absentCount,
        lateCount,
        unmarkedCount,
        markedCount,
        percentage
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark / update attendance register for a schedule
app.post('/api/attendance/mark', (req, res) => {
  try {
    const { scheduleId, records, markedBy = 'Admin', notifyStudents = true } = req.body;
    if (!scheduleId || !Array.isArray(records)) {
      return res.status(400).json({ error: 'scheduleId and records array are required' });
    }

    const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(scheduleId);
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule event not found' });
    }

    const now = new Date().toISOString();
    const upsertStmt = db.prepare(`
      INSERT INTO attendance (id, scheduleId, studentId, studentName, course, semester, status, markedAt, markedBy, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(scheduleId, studentId) DO UPDATE SET
        status = excluded.status,
        markedAt = excluded.markedAt,
        markedBy = excluded.markedBy,
        remarks = excluded.remarks
    `);

    const insertNotification = db.prepare(`
      INSERT INTO notifications (id, studentId, title, message, type, programId, read, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `);

    const updateTx = db.transaction(() => {
      for (const rec of records) {
        if (!rec.studentId || !rec.status || rec.status === 'Unmarked') continue;
        const student = db.prepare('SELECT id, name, course, semester FROM students WHERE id = ?').get(rec.studentId);
        const id = `att-${scheduleId}-${rec.studentId}`;
        upsertStmt.run(
          id,
          scheduleId,
          rec.studentId,
          student ? student.name : (rec.name || 'Student'),
          student ? student.course : '',
          student ? student.semester : '',
          rec.status,
          now,
          markedBy,
          rec.remarks || ''
        );

        // Optionally send student individual notification
        if (notifyStudents && (rec.status === 'Present' || rec.status === 'Absent' || rec.status === 'Late')) {
          const notifTitle = rec.status === 'Present'
            ? `Attendance Marked: Present (✓)`
            : rec.status === 'Late'
            ? `Attendance Marked: Late (⏰)`
            : `Attendance Alert: Absent (✗)`;

          const notifMsg = `Your attendance for "${schedule.title}" on ${schedule.date} has been marked as ${rec.status}.`;
          insertNotification.run(
            `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            rec.studentId,
            notifTitle,
            notifMsg,
            'attendance',
            scheduleId,
            now
          );
        }
      }
    });

    updateTx();

    res.json({
      message: 'Attendance register saved successfully!',
      scheduleId,
      updatedAt: now
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Student Attendance Summary: All sessions with student's marked status and percentage
app.get('/api/attendance/student/:studentId', (req, res) => {
  try {
    const { studentId } = req.params;
    const student = db.prepare('SELECT id, name, course, semester FROM students WHERE id = ?').get(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get all schedule events that target this student
    const allSchedules = db.prepare(`
      SELECT * FROM schedules
      ORDER BY date DESC
    `).all();

    // Filter relevant schedules
    const relevantSchedules = allSchedules.filter(sch => {
      if (sch.targetCourse && sch.targetCourse !== 'All' && sch.targetCourse !== 'All Courses' && student.course) {
        if (sch.targetCourse !== student.course) return false;
      }
      return true;
    });

    // Get student's attendance records
    const attendanceRecords = db.prepare('SELECT * FROM attendance WHERE studentId = ?').all(studentId);
    const attendanceMap = {};
    attendanceRecords.forEach(r => {
      attendanceMap[r.scheduleId] = r;
    });

    // Merge
    const history = relevantSchedules.map(sch => {
      const att = attendanceMap[sch.id];
      return {
        scheduleId: sch.id,
        title: sch.title,
        category: sch.category,
        date: sch.date,
        startTime: sch.startTime,
        endTime: sch.endTime,
        location: sch.location,
        meetLink: sch.meetLink,
        instructor: sch.instructor,
        isMandatory: Boolean(sch.isMandatory),
        status: att ? att.status : 'Unmarked',
        remarks: att ? att.remarks : '',
        markedAt: att ? att.markedAt : null,
        markedBy: att ? att.markedBy : null
      };
    });

    const totalSessions = history.length;
    const markedSessions = history.filter(h => h.status !== 'Unmarked').length;
    const presentCount = history.filter(h => h.status === 'Present').length;
    const absentCount = history.filter(h => h.status === 'Absent').length;
    const lateCount = history.filter(h => h.status === 'Late').length;

    // Standard attendance percentage: (Present + Late) / markedSessions
    const percentage = markedSessions > 0 ? Math.round(((presentCount + lateCount) / markedSessions) * 100) : 100;
    const isEligible = percentage >= 75;

    res.json({
      student: {
        id: student.id,
        name: student.name,
        course: student.course,
        semester: student.semester
      },
      stats: {
        totalSessions,
        markedSessions,
        presentCount,
        absentCount,
        lateCount,
        percentage,
        isEligible,
        minimumRequired: 75
      },
      history
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Overview of Institutional Attendance
app.get('/api/attendance/summary/overview', (req, res) => {
  try {
    const totalSchedules = db.prepare('SELECT count(*) as count FROM schedules').get().count;
    const markedSchedules = db.prepare('SELECT count(DISTINCT scheduleId) as count FROM attendance').get().count;
    const totalRecords = db.prepare('SELECT count(*) as count FROM attendance').get().count;
    const presentRecords = db.prepare("SELECT count(*) as count FROM attendance WHERE status = 'Present'").get().count;
    const lateRecords = db.prepare("SELECT count(*) as count FROM attendance WHERE status = 'Late'").get().count;
    const absentRecords = db.prepare("SELECT count(*) as count FROM attendance WHERE status = 'Absent'").get().count;

    const overallRate = totalRecords > 0 ? Math.round(((presentRecords + lateRecords) / totalRecords) * 100) : 0;

    const markedSummary = db.prepare(`
      SELECT scheduleId,
             count(*) as totalMarked,
             sum(case when status = 'Present' then 1 else 0 end) as presentCount,
             sum(case when status = 'Late' then 1 else 0 end) as lateCount,
             sum(case when status = 'Absent' then 1 else 0 end) as absentCount
      FROM attendance
      GROUP BY scheduleId
    `).all();
    const markedMap = {};
    markedSummary.forEach(m => {
      markedMap[m.scheduleId] = m;
    });

    res.json({
      totalSchedules,
      markedSchedules,
      pendingSchedules: Math.max(0, totalSchedules - markedSchedules),
      totalRecords,
      presentRecords,
      lateRecords,
      absentRecords,
      overallRate,
      markedMap
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const server = app.listen(PORT, () => {
  console.log(`Podar Pathways Database & API Server running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use by another process.`);
  } else {
    console.error('Server error:', err.message);
  }
});


