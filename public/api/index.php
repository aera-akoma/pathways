<?php
/**
 * Podar Pathways - Enterprise REST API Router (PHP)
 * Complete parity with Node backend across all 78 endpoints.
 * Single Endpoint Gateway for Auth, Students, Programs, Certificates,
 * Tests, Schedules, Attendance, Admins, Notifications & Projects.
 */

define('PODAR_APP', true);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/mailer.php';
require_once __DIR__ . '/validation.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/public-certificates.php';

// Normalize URI path to extract relative API route
$requestUri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$method     = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Remove base path prefixes (e.g. /api/ or /public/api/ or /subdir/api/)
$apiPos = strpos($requestUri, '/api');
if ($apiPos !== false) {
    $route = substr($requestUri, $apiPos + 4);
} else {
    $route = $requestUri;
}
$route = '/' . trim($route, '/');

// Parse request payload
$body = getJsonInput();
validateRequestFields($body, $route);

function sendVerificationCode(string $email, string $name, string $otp, string $purpose): void {
    $result = Mailer::sendOtp($email, $name, $otp, $purpose);
    $isLocal = (DIRECTORY_SEPARATOR === '\\') || (defined('APP_ENV') && APP_ENV !== 'production');
    if (empty($result['success'])) {
        if ($isLocal) {
            error_log("[DEV OTP SIMULATION] OTP for {$email} ({$purpose}): {$otp}");
            return;
        }
        Database::execute('DELETE FROM email_otps WHERE email = ? AND purpose = ?', [$email, $purpose]);
        jsonError('Verification email could not be sent. Please try again later.', 503);
    }
}

// Helper to generate MySQL-compatible datetime timestamps
function nowIso(): string {
    return date('Y-m-d H:i:s');
}

// Helper to safely parse JSON
function safeJsonDecode($val, $default = []) {
    if (is_array($val)) return $val;
    if (empty($val)) return $default;
    $d = json_decode($val, true);
    return is_array($d) ? $d : $default;
}

// Enrich project post with like/bookmark status, images, and parsed tags
$enrichPhpProject = function($post, $currentStudentId = '') {
    if (!$post) return null;
    $postId = $post['id'];

    $images = Database::fetchAll("SELECT * FROM project_images WHERE postId = ? ORDER BY orderIndex ASC", [$postId]);
    $tags = safeJsonDecode($post['tags'] ?? '[]', []);

    $isLiked = false;
    $isBookmarked = false;

    if ($currentStudentId) {
        $like = Database::fetchOne("SELECT id FROM project_likes WHERE postId = ? AND studentId = ?", [$postId, $currentStudentId]);
        $isLiked = !empty($like);

        $bm = Database::fetchOne("SELECT id FROM project_bookmarks WHERE postId = ? AND studentId = ?", [$postId, $currentStudentId]);
        $isBookmarked = !empty($bm);
    }

    $post['images'] = $images;
    $post['tags'] = $tags;
    $post['isLiked'] = $isLiked;
    $post['isBookmarked'] = $isBookmarked;
    return $post;
};

// ========================================================
// ROUTE DISPATCHER
// ========================================================

try {
    if ($route === '/auth/logout' && $method === 'POST') {
        startAuthSession();
        $_SESSION = [];
        session_destroy();
        setcookie('podar_session', '', ['expires' => time() - 3600, 'path' => '/', 'httponly' => true, 'samesite' => 'Lax']);
        jsonResponse(['success' => true]);
    }
    if ($route === '/auth/session' && $method === 'GET') {
        startAuthSession();
        $auth = $_SESSION['auth'] ?? null;
        if (!$auth || ($_SESSION['expiresAt'] ?? 0) < time()) {
            jsonResponse(['authenticated' => false, 'session' => null]);
        }
        jsonResponse(['authenticated' => true, 'session' => authenticatedSession()]);
    }
    $auth = authorizeRoute($route, $method, $body);
    if ($method === 'GET' && preg_match('#^/students/([^/]+)/public-certificates$#', $route, $matches)) {
        jsonResponse(publicCertificatesForStudent(rawurldecode($matches[1])));
    }

    // ----------------------------------------------------
    // 1. HEALTH CHECK
    // ----------------------------------------------------
    if ($route === '/health' && $method === 'GET') {
        $dbStatus = 'connected (' . Database::getDriver() . ')';
        try {
            Database::getConnection()->query('SELECT 1');
        } catch (\Throwable $e) {
            $dbStatus = 'error: ' . $e->getMessage();
        }

        jsonResponse([
            'status'     => 'ok',
            'server'     => 'PHP ' . PHP_VERSION,
            'database'   => $dbStatus,
            'driver'     => Database::getDriver(),
            'mailSender' => MAIL_FROM_EMAIL,
            'time'       => date('c')
        ]);
    }

    // ----------------------------------------------------
    // 2. SYSTEM SETTINGS
    // ----------------------------------------------------
    if ($route === '/settings' && $method === 'GET') {
        $phone = '9876543210';
        try {
            $row = Database::fetchOne("SELECT setting_value FROM settings WHERE setting_key = 'adminPhone'");
            if ($row) $phone = $row['setting_value'];
        } catch (\Throwable $e) {
            $row = Database::fetchOne("SELECT value FROM settings WHERE key = 'adminPhone'");
            if ($row) $phone = $row['value'];
        }
        jsonResponse(['adminPhone' => $phone]);
    }

    if ($route === '/settings/admin-phone' && $method === 'PUT') {
        $adminPhone = cleanPhone($body['adminPhone'] ?? '');
        $adminKey   = $body['adminKey'] ?? '';

        if ($adminKey !== ADMIN_KEY) {
            jsonError('The change key was not accepted.', 403);
        }
        if (!preg_match('/^[0-9]{10}$/', $adminPhone)) {
            jsonError('Enter a valid 10-digit mobile number.');
        }

        try {
            Database::execute("INSERT INTO settings (setting_key, setting_value) VALUES ('adminPhone', ?) ON DUPLICATE KEY UPDATE setting_value = ?", [$adminPhone, $adminPhone]);
        } catch (\Throwable $e) {
            Database::execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('adminPhone', ?)", [$adminPhone]);
        }

        jsonResponse(['success' => true, 'adminPhone' => $adminPhone, 'message' => 'Admin phone updated successfully.']);
    }

    // ----------------------------------------------------
    // 3. STUDENT REGISTRATION & AUTH
    // ----------------------------------------------------
    // Send OTP for student registration
    if ($route === '/auth/student/send-otp' && $method === 'POST') {
        $email = cleanEmail($body['email'] ?? '');
        if (!$email) jsonError('Please enter a valid email address.');

        $student = Database::fetchOne("SELECT * FROM students WHERE LOWER(email) = ?", [$email]);
        $studentName = 'Student';
        $studentCourse = 'BCA';
        $studentSemester = 'Semester I';
        $studentId = '';

        if ($student) {
            if (($student['status'] ?? '') === 'suspended') {
                jsonError('Access Denied: Your student account has been suspended by the administrator.', 403);
            }
            if (!empty($student['isRegistered']) && !empty($student['passwordHash'])) {
                jsonError('An account with this email is already registered. Please sign in with your email and password, or use Forgot Password.');
            }
            $studentName = $student['name'] ?? 'Student';
            $studentCourse = $student['course'] ?? 'BCA';
            $studentSemester = $student['semester'] ?? 'Semester I';
            $studentId = $student['id'];
        }

        $recentOtp = Database::fetchOne(
            "SELECT * FROM email_otps WHERE email = ? AND purpose = 'registration' AND (? - createdAt) < ?",
            [$email, time(), RATE_LIMIT_SECONDS]
        );
        if ($recentOtp) {
            $wait = RATE_LIMIT_SECONDS - (time() - $recentOtp['createdAt']);
            jsonError("Please wait {$wait} seconds before requesting a new OTP.");
        }

        $otp = sprintf('%06d', random_int(100000, 999999));
        $now = time();
        $expiresAt = $now + (OTP_EXPIRY_MINUTES * 60);

        Database::execute("DELETE FROM email_otps WHERE email = ? AND purpose = 'registration'", [$email]);
        Database::execute(
            "INSERT INTO email_otps (email, code, role, purpose, payload, createdAt, expiresAt, isUsed) VALUES (?, ?, 'student', 'registration', ?, ?, ?, 0)",
            [$email, $otp, json_encode(['email' => $email, 'studentId' => $studentId]), $now, $expiresAt]
        );

        sendVerificationCode($email, $studentName, $otp, 'registration');

        jsonResponse([
            'success' => true,
            'message' => "Verification code sent to {$email}.",
            'student' => ['id' => $studentId, 'name' => $studentName, 'course' => $studentCourse, 'semester' => $studentSemester]
        ]);
    }

    // Verify OTP & complete registration
    if ($route === '/auth/student/register' && $method === 'POST') {
        $email    = cleanEmail($body['email'] ?? '');
        $otp      = trim($body['otp'] ?? '');
        $password = $body['password'] ?? '';

        if (!$email || !$otp || empty($password)) jsonError('Email, OTP, and password are required.');
        if (strlen($password) < 6) jsonError('Password must be at least 6 characters long.');

        $otpRecord = Database::fetchOne(
            "SELECT * FROM email_otps WHERE email = ? AND purpose = 'registration' AND isUsed = 0 ORDER BY id DESC LIMIT 1",
            [$email]
        );
        if (!$otpRecord) jsonError('No active OTP found. Please request a new verification code.');
        if (($otpRecord['attempts'] ?? 0) >= OTP_MAX_ATTEMPTS) jsonError('Too many incorrect codes. Request a new code.', 429);
        if (time() > $otpRecord['expiresAt']) {
            Database::execute("DELETE FROM email_otps WHERE id = ?", [$otpRecord['id']]);
            jsonError('This OTP has expired. Please request a new verification code.');
        }
        $isCodeMatch = hash_equals((string)$otpRecord['code'], $otp);
        if (!$isCodeMatch) {
            Database::execute("UPDATE email_otps SET attempts = attempts + 1 WHERE id = ?", [$otpRecord['id']]);
            jsonError('Invalid verification code. Please check your email and try again.');
        }

        Database::execute("UPDATE email_otps SET isUsed = 1 WHERE id = ?", [$otpRecord['id']]);

        $student = Database::fetchOne("SELECT * FROM students WHERE LOWER(email) = ?", [$email]);
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);
        $now = nowIso();

        if ($student) {
            Database::execute(
                "UPDATE students SET passwordHash = ?, isRegistered = 1, updatedAt = ? WHERE id = ?",
                [$passwordHash, $now, $student['id']]
            );
        } else {
            // Auto-create and store student record in database upon successful verification
            $studentId = 'student-' . time() . '-' . random_int(100, 999);
            $name = cleanString($body['name'] ?? '');
            if (!$name) {
                $prefix = explode('@', $email)[0];
                $name = ucwords(str_replace(['.', '_', '-'], ' ', $prefix));
            }
            $phone = cleanPhone($body['phone'] ?? '');
            if (empty($phone) || strlen($phone) !== 10) {
                $phone = '9' . str_pad((string)random_int(100000000, 999999999), 9, '0', STR_PAD_LEFT);
            }
            $course = cleanString($body['course'] ?? 'BCA');
            $semester = cleanString($body['semester'] ?? 'Semester I');

            Database::execute(
                "INSERT INTO students (id, name, phone, course, semester, email, passwordHash, goal, score, completion, applications, projects, certificates, addedByAdmin, isRegistered, status, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'Software Engineer', 0, 0, 0, 0, 0, 0, 1, 'active', ?, ?)",
                [$studentId, $name, $phone, $course, $semester, $email, $passwordHash, $now, $now]
            );
            $student = Database::fetchOne("SELECT * FROM students WHERE id = ?", [$studentId]);
        }

        $updated = Database::fetchOne("SELECT * FROM students WHERE id = ?", [$student['id']]);
        unset($updated['passwordHash'], $updated['salt']);

        // Dispatch Welcome Onboarding Email
        if (!empty($updated['email'])) {
            Mailer::sendWelcomeEmail($updated['email'], $updated['name'], $updated['course'] ?? '', $updated['semester'] ?? '');
        }

        $token = 'podar-token-' . bin2hex(random_bytes(24));
        $sessionObj = [
            'token'   => $token,
            'role'    => 'student',
            'id'      => $updated['id'],
            'name'    => $updated['name'],
            'email'   => $updated['email'],
            'avatar'  => $updated['avatar'] ?? '',
            'student' => $updated
        ];
        establishSession($sessionObj);
        jsonResponse(array_merge([
            'success' => true,
            'session' => $sessionObj,
            'message' => 'Registration complete! Welcome to Podar Pathways.'
        ], $sessionObj));
    }

    // Student Login
    if ($route === '/auth/student/login' && $method === 'POST') {
        $email    = cleanEmail($body['email'] ?? '');
        $password = $body['password'] ?? '';

        if (!$email || empty($password)) jsonError('Email and password are required.');

        $student = Database::fetchOne("SELECT * FROM students WHERE LOWER(email) = ?", [$email]);
        if (!$student) jsonError('No account found with this email address.', 404);
        if (($student['status'] ?? '') === 'suspended') {
            jsonError('Your student account has been suspended by the administrator.', 403);
        }

        $isValid = false;
        if (!empty($student['passwordHash']) && str_starts_with($student['passwordHash'], '$')) {
            $isValid = password_verify($password, $student['passwordHash']);
        }

        if (!$isValid) jsonError('Incorrect email or password. Please try again.', 401);

        unset($student['passwordHash'], $student['salt']);
        $token = 'podar-token-' . bin2hex(random_bytes(24));
        $sessionObj = [
            'token'   => $token,
            'role'    => 'student',
            'id'      => $student['id'],
            'name'    => $student['name'],
            'email'   => $student['email'],
            'avatar'  => $student['avatar'] ?? '',
            'student' => $student
        ];

        establishSession($sessionObj);
        jsonResponse(array_merge([
            'success' => true,
            'session' => $sessionObj,
            'message' => "Welcome back, {$student['name']}!"
        ], $sessionObj));
    }

    // Forgot Password: Send OTP
    if ($route === '/auth/student/forgot-password/send-otp' && $method === 'POST') {
        $email = cleanEmail($body['email'] ?? '');
        if (!$email) jsonError('Valid email address is required.');

        $student = Database::fetchOne("SELECT * FROM students WHERE LOWER(email) = ?", [$email]);
        if (!$student) jsonError('No registered account found with this email address.', 404);

        $otp = sprintf('%06d', random_int(100000, 999999));
        $now = time();
        $expiresAt = $now + (OTP_EXPIRY_MINUTES * 60);

        Database::execute("DELETE FROM email_otps WHERE email = ? AND purpose = 'reset-password'", [$email]);
        Database::execute(
            "INSERT INTO email_otps (email, code, role, purpose, payload, createdAt, expiresAt, isUsed) VALUES (?, ?, 'student', 'reset-password', ?, ?, ?, 0)",
            [$email, $otp, json_encode(['email' => $email]), $now, $expiresAt]
        );

        sendVerificationCode($email, $student['name'], $otp, 'reset-password');
        jsonResponse(['success' => true, 'message' => "Password reset OTP has been sent to {$email}."]);
    }

    // Forgot Password: Reset
    if ($route === '/auth/student/forgot-password/reset' && $method === 'POST') {
        $email    = cleanEmail($body['email'] ?? '');
        $otp      = trim($body['otp'] ?? '');
        $password = $body['password'] ?? '';

        if (!$email || !$otp || !$password) jsonError('Email, OTP, and new password are required.');
        if (strlen($password) < 6) jsonError('New password must be at least 6 characters long.');

        $otpRecord = Database::fetchOne(
            "SELECT * FROM email_otps WHERE email = ? AND purpose = 'reset-password' AND isUsed = 0 ORDER BY id DESC LIMIT 1",
            [$email]
        );
        $isCodeMatch = $otpRecord && (hash_equals((string)$otpRecord['code'], $otp));
        if ($otpRecord && ($otpRecord['attempts'] ?? 0) >= OTP_MAX_ATTEMPTS) jsonError('Too many incorrect codes. Request a new code.', 429);
        if (!$otpRecord || time() > $otpRecord['expiresAt'] || !$isCodeMatch) {
            if ($otpRecord) Database::execute('UPDATE email_otps SET attempts = attempts + 1 WHERE id = ?', [$otpRecord['id']]);
            jsonError('Invalid or expired password reset OTP.');
        }

        Database::execute("UPDATE email_otps SET isUsed = 1 WHERE id = ?", [$otpRecord['id']]);

        $student = Database::fetchOne("SELECT * FROM students WHERE LOWER(email) = ?", [$email]);
        if (!$student) jsonError('Student not found.', 404);

        $passwordHash = password_hash($password, PASSWORD_BCRYPT);
        Database::execute("UPDATE students SET passwordHash = ?, updatedAt = ? WHERE id = ?", [$passwordHash, nowIso(), $student['id']]);

        unset($student['passwordHash'], $student['salt']);
        $token = 'podar-token-' . bin2hex(random_bytes(24));
        $sessionObj = [
            'token'   => $token,
            'role'    => 'student',
            'id'      => $student['id'],
            'name'    => $student['name'],
            'email'   => $student['email'],
            'avatar'  => $student['avatar'] ?? '',
            'student' => $student
        ];

        establishSession($sessionObj);
        jsonResponse(array_merge([
            'success' => true,
            'session' => $sessionObj,
            'message' => 'Password reset successfully! Welcome back.'
        ], $sessionObj));
    }

    // Admin Login Step 1: Verify Password & Send 2FA
    if ($route === '/auth/admin/login-step1' && $method === 'POST') {
        $email    = cleanEmail($body['email'] ?? '');
        $password = $body['password'] ?? '';

        if (!$email || empty($password)) jsonError('Administrator email and password are required.');

        $admin = Database::fetchOne("SELECT * FROM admins WHERE LOWER(email) = ?", [$email]);
        if (!$admin) jsonError('Incorrect email or password.', 401);

        if (($admin['status'] ?? '') === 'suspended') {
            jsonError('This administrator account has been disabled.', 403);
        }

        $isValid = false;
        if (!empty($admin['passwordHash']) && str_starts_with($admin['passwordHash'], '$')) {
            $isValid = password_verify($password, $admin['passwordHash']);
        }

        if (!$isValid) jsonError('Incorrect administrator password.', 401);

        $otp = sprintf('%06d', random_int(100000, 999999));
        $now = time();
        $expiresAt = $now + (OTP_EXPIRY_MINUTES * 60);

        Database::execute("DELETE FROM email_otps WHERE email = ? AND purpose = 'admin-login'", [$email]);
        Database::execute(
            "INSERT INTO email_otps (email, code, role, purpose, payload, createdAt, expiresAt, isUsed) VALUES (?, ?, 'admin', 'admin-login', ?, ?, ?, 0)",
            [$email, $otp, json_encode(['adminId' => $admin['id']]), $now, $expiresAt]
        );
        sendVerificationCode($email, $admin['name'], $otp, 'admin-login');

        jsonResponse([
            'success' => true,
            'message' => "Password verified. A 6-digit 2FA security code has been sent to {$email}.",
            'admin'   => ['id' => $admin['id'], 'name' => $admin['name'], 'email' => $admin['email'], 'role' => $admin['role']]
        ]);
    }

    // Admin Login Step 2: Verify 2FA OTP
    if ($route === '/auth/admin/verify-otp' && $method === 'POST') {
        $email = cleanEmail($body['email'] ?? '');
        $otp   = trim($body['otp'] ?? '');

        if (!$email || !$otp) jsonError('Email and 2FA OTP code are required.');

        $otpRecord = null;
        try {
            $otpRecord = Database::fetchOne("SELECT * FROM email_otps WHERE email = ? AND role = 'admin' AND purpose = 'admin-login' AND isUsed = 0 ORDER BY id DESC LIMIT 1", [$email]);
        } catch (\Throwable $e) {}

        $isCodeValid = $otpRecord && ($otpRecord['code'] === $otp) && (time() <= $otpRecord['expiresAt']);

        if ($otpRecord && ($otpRecord['attempts'] ?? 0) >= OTP_MAX_ATTEMPTS) jsonError('Too many incorrect codes. Repeat sign-in.', 429);
        if (!$isCodeValid) {
            if ($otpRecord) Database::execute('UPDATE email_otps SET attempts = attempts + 1 WHERE id = ?', [$otpRecord['id']]);
            jsonError('Invalid or expired 2FA code. Please request a new security code.');
        }

        $consumed = Database::execute("UPDATE email_otps SET isUsed = 1 WHERE id = ? AND isUsed = 0", [$otpRecord['id']]);
        if ($consumed !== 1) jsonError('This verification code has already been used.', 409);

        $admin = Database::fetchOne("SELECT * FROM admins WHERE LOWER(email) = ?", [$email]);
        if (!$admin || ($admin['status'] ?? '') === 'suspended') jsonError('Administrator account unavailable.', 403);
        unset($admin['passwordHash'], $admin['salt']);
        $admin['permissions'] = safeJsonDecode($admin['permissions'] ?? '[]', ['all']);

        $token = 'podar-admin-token-' . bin2hex(random_bytes(24));

        $sessionObj = [
            'token'       => $token,
            'role'        => 'admin',
            'id'          => $admin['id'],
            'name'        => $admin['name'],
            'email'       => $admin['email'],
            'phone'       => $admin['phone'],
            'department'  => $admin['department'],
            'permissions' => $admin['permissions'],
            'avatar'      => $admin['avatar'] ?? '',
            'admin'       => $admin
        ];

        establishSession($sessionObj);
        jsonResponse(array_merge([
            'success'     => true,
            'session'     => $sessionObj,
            'message'     => 'Welcome back to the Podar Pathways Executive Console.'
        ], $sessionObj));
    }

    // Resend OTP
    if ($route === '/auth/resend-otp' && $method === 'POST') {
        $email   = cleanEmail($body['email'] ?? '');
        $purpose = cleanString($body['purpose'] ?? 'registration');
        if (!in_array($purpose, ['registration', 'reset-password'], true)) jsonError('Repeat administrator sign-in to request a new security code.', 400);
        if (!$email) jsonError('Valid email address is required.');

        $otp = sprintf('%06d', random_int(100000, 999999));
        $now = time();
        $expiresAt = $now + (OTP_EXPIRY_MINUTES * 60);

        Database::execute("DELETE FROM email_otps WHERE email = ? AND purpose = ?", [$email, $purpose]);
        Database::execute(
            "INSERT INTO email_otps (email, code, role, purpose, payload, createdAt, expiresAt, isUsed) VALUES (?, ?, 'student', ?, ?, ?, ?, 0)",
            [$email, $otp, json_encode(['email' => $email]), $now, $expiresAt]
        );

        sendVerificationCode($email, 'User', $otp, $purpose);
        jsonResponse(['success' => true, 'message' => "A new verification code has been sent to {$email}."]);
    }

    if (in_array($route, ['/auth/send-otp', '/auth/verify-otp'], true)) jsonError('Mobile OTP sign-in is no longer supported. Use email sign-in.', 410);

    // ----------------------------------------------------
    // 4. STUDENTS DIRECTORY & MANAGEMENT
    // ----------------------------------------------------
    if ($route === '/students' && $method === 'GET') {
        if (($auth['role'] ?? '') === 'student') jsonResponse(Database::fetchAll("SELECT id, name, avatar, course, semester, bio, skills, linkedin, github, portfolio FROM students WHERE status != 'suspended' ORDER BY name"));
        $students = Database::fetchAll("SELECT * FROM students ORDER BY name ASC");
        $safeList = array_map(function($s) {
            unset($s['passwordHash'], $s['salt']);
            return $s;
        }, $students);
        jsonResponse($safeList);
    }

    if ($route === '/students' && $method === 'POST') {
        $id          = cleanString($body['id'] ?? '') ?: ('student-' . time() . '-' . random_int(100, 999));
        $name        = cleanString($body['name'] ?? '');
        $fathersName = cleanString($body['fathersName'] ?? $body['fatherName'] ?? '');
        $phone       = cleanPhone($body['phone'] ?? '');
        $course      = cleanString($body['course'] ?? 'BCA');
        $semester    = cleanString($body['semester'] ?? 'V');
        $rawEmail    = trim((string)($body['email'] ?? ''));
        $email       = cleanEmail($rawEmail);
        $dbEmail     = !empty($email) ? $email : null;
        $goal        = cleanString($body['goal'] ?? 'Software Engineer');
        $score       = (isset($body['score']) && is_numeric($body['score'])) ? (int)$body['score'] : 0;
        $completion  = (isset($body['completion']) && is_numeric($body['completion'])) ? (int)$body['completion'] : 0;
        $avatar      = $body['avatar'] ?? null;

        if (!$name || !$phone) {
            jsonError('Student name and 10-digit mobile number are required.');
        }

        $existingPhone = Database::fetchOne("SELECT id, name FROM students WHERE phone = ?", [$phone]);
        if ($existingPhone) {
            jsonError("A student with mobile number {$phone} already exists ({$existingPhone['name']}).");
        }

        if ($dbEmail !== null) {
            $existingEmail = Database::fetchOne("SELECT id, name FROM students WHERE LOWER(email) = ?", [$dbEmail]);
            if ($existingEmail) {
                jsonError("A student with email {$dbEmail} already exists ({$existingEmail['name']}).");
            }
        }

        $now = nowIso();

        Database::execute(
            "INSERT INTO students (id, name, fathersName, phone, course, semester, email, goal, score, completion, applications, projects, certificates, avatar, addedByAdmin, isRegistered, status, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, 1, 0, 'active', ?, ?)",
            [$id, $name, $fathersName, $phone, $course, $semester, $dbEmail, $goal, $score, $completion, $avatar, $now, $now]
        );

        $created = Database::fetchOne("SELECT * FROM students WHERE id = ?", [$id]);
        unset($created['passwordHash'], $created['salt']);
        jsonResponse($created, 201);
    }

    // Bulk Import Students from CSV
    if ($route === '/students/import-csv' && $method === 'POST') {
        $rows = $body['students'] ?? [];
        if (!is_array($rows) || empty($rows)) {
            jsonError('No student records provided for CSV import.');
        }

        $now = nowIso();
        $importedCount = 0;
        $skipped = [];
        $inserted = [];
        $seenPhones = [];

        foreach ($rows as $row) {
            $name        = cleanString($row['student_name'] ?? $row['studentName'] ?? $row['name'] ?? '');
            $fathersName = cleanString($row['fathers_name'] ?? $row['father_name'] ?? $row['fathersName'] ?? '');
            $phone       = cleanPhone($row['mobile_no'] ?? $row['mobileNo'] ?? $row['phone'] ?? '');
            $course      = cleanString($row['course'] ?? 'BCA');
            $semester    = cleanString($row['semester'] ?? 'V');
            $rawEmail    = trim((string)($row['email'] ?? $row['email_id'] ?? ''));
            $email       = cleanEmail($rawEmail);
            $dbEmail     = !empty($email) ? $email : null;
            $goal        = cleanString($row['goal'] ?? 'Software Engineer');

            if (!$name || strlen($phone) !== 10) {
                $skipped[] = ['name' => $name, 'phone' => $phone, 'reason' => 'Invalid name or 10-digit mobile'];
                continue;
            }

            if (isset($seenPhones[$phone])) {
                $skipped[] = ['name' => $name, 'phone' => $phone, 'reason' => 'Duplicate in upload batch'];
                continue;
            }
            $seenPhones[$phone] = true;

            $existing = Database::fetchOne("SELECT id, name FROM students WHERE phone = ?", [$phone]);
            if ($existing) {
                $skipped[] = ['name' => $name, 'phone' => $phone, 'reason' => "Mobile already registered ({$existing['name']})"];
                continue;
            }

            if ($dbEmail !== null) {
                $existingEmail = Database::fetchOne("SELECT id FROM students WHERE LOWER(email) = ?", [$dbEmail]);
                if ($existingEmail) {
                    $dbEmail = null;
                }
            }

            $id = 'st-' . time() . '-' . random_int(1000, 9999);
            Database::execute(
                "INSERT INTO students (id, name, fathersName, phone, course, semester, email, goal, score, completion, applications, projects, certificates, addedByAdmin, status, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 1, 'active', ?, ?)",
                [$id, $name, $fathersName, $phone, $course, $semester, $dbEmail, $goal, $now, $now]
            );

            $inserted[] = ['id' => $id, 'name' => $name, 'phone' => $phone, 'course' => $course, 'semester' => $semester, 'email' => $dbEmail];
            $importedCount++;
        }

        jsonResponse([
            'success'       => true,
            'importedCount' => $importedCount,
            'skippedCount'  => count($skipped),
            'skipped'       => $skipped,
            'students'      => $inserted,
            'message'       => "Successfully imported {$importedCount} student records."
        ]);
    }

    // Student by ID & Sub-routes
    if (preg_match('#^/students/([^/]+)(?:/(change-password|certificates|test-submissions))?$#', $route, $matches)) {
        $studentId = $matches[1];
        $sub = $matches[2] ?? '';

        // Student Certificates
        if ($sub === 'certificates' && $method === 'GET') {
            $student = Database::fetchOne("SELECT name FROM students WHERE id = ?", [$studentId]);
            $studentName = $student['name'] ?? $studentId;
            try {
                $pdo = Database::getCertificatesConnection();
                $stmt = $pdo->prepare("SELECT id, programTitle, studentName, certificateImg, verifiedBy, status, createdAt FROM certificates WHERE studentName = ? ORDER BY createdAt DESC");
                $stmt->execute([$studentName]);
                $certs = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } catch (\Throwable $e) {
                $certs = [];
            }
            $certs = array_map(function($c) {
                $c['fileData'] = $c['certificateImg'] ?? '';
                $c['submittedAt'] = $c['createdAt'] ?? date('c');
                return $c;
            }, $certs);
            jsonResponse($certs);
        }

        // Student Test Submissions
        if ($sub === 'test-submissions' && $method === 'GET') {
            $subs = Database::fetchAll("SELECT * FROM test_submissions WHERE studentId = ? ORDER BY submittedAt DESC", [$studentId]);
            $enriched = array_map(function($s) {
                $s['answers'] = safeJsonDecode($s['answers'] ?? '[]', []);
                return $s;
            }, $subs);
            jsonResponse($enriched);
        }

        // Change Password
        if ($sub === 'change-password' && ($method === 'POST' || $method === 'PUT')) {
            $currentPassword = $body['currentPassword'] ?? '';
            $newPassword     = $body['newPassword'] ?? '';

            if (strlen($newPassword) < 6) jsonError('New password must be at least 6 characters long.');

            $student = Database::fetchOne("SELECT * FROM students WHERE id = ?", [$studentId]);
            if (!$student) jsonError('Student not found', 404);

            if (!empty($student['passwordHash']) && !password_verify($currentPassword, $student['passwordHash'])) {
                jsonError('Current password is incorrect.', 400);
            }

            $hash = password_hash($newPassword, PASSWORD_BCRYPT);
            Database::execute("UPDATE students SET passwordHash = ?, updatedAt = ? WHERE id = ?", [$hash, nowIso(), $studentId]);
            jsonResponse(['success' => true, 'message' => 'Password updated successfully.']);
        }

        // GET Single Student
        if (!$sub && $method === 'GET') {
            $student = Database::fetchOne("SELECT * FROM students WHERE id = ?", [$studentId]);
            if (!$student) jsonError('Student not found', 404);
            unset($student['passwordHash'], $student['salt']);
            jsonResponse($student);
        }

        // PUT Update Student Details
        if (!$sub && $method === 'PUT') {
            $student = Database::fetchOne('SELECT * FROM students WHERE id = ?', [$studentId]);
            if (!$student) jsonError('Student not found.', 404);
            $fields = [
                'name', 'gender', 'fathersName', 'phone', 'course', 'semester', 'email', 'linkedin', 'github',
                'portfolio', 'skills', 'softSkills', 'goal', 'bio', 'rollNo', 'graduationYear', 'jobType',
                'city', 'address', 'houseNo', 'district', 'state', 'pinCode', 'dob', 'avatar', 'resumeUrl',
                'score', 'completion', 'applications', 'projects', 'certificates', 'status'
            ];
            $updates = [];
            $params = [];

            foreach ($fields as $field) {
                if (array_key_exists($field, $body)) {
                    $val = $body[$field];
                    if ($field === 'dob' && $val === '') $val = null;
                    if ($field === 'email') {
                        $val = cleanEmail($val);
                        $val = !empty($val) ? $val : null;
                    } elseif ($field === 'phone') {
                        $val = cleanPhone($val);
                    }
                    $updates[] = "{$field} = ?";
                    $params[] = $val;
                }
            }

            if (array_key_exists('goal', $body)) {
                $profilePhone = cleanPhone($body['phone'] ?? $student['phone'] ?? '');
                if (trim((string)$body['goal']) === '' || !preg_match('/^[0-9]{10}$/', $profilePhone)) jsonError('Add your career goal and a valid mobile number to complete your profile.');
                $updates[] = 'profileCompletedAt = ?';
                $params[] = nowIso();
            }

            if (!empty($updates)) {
                $updates[] = "updatedAt = ?";
                $params[] = nowIso();
                $params[] = $studentId;

                Database::execute("UPDATE students SET " . implode(', ', $updates) . " WHERE id = ?", $params);
            }

            $updated = Database::fetchOne("SELECT * FROM students WHERE id = ?", [$studentId]);
            unset($updated['passwordHash'], $updated['salt']);
            jsonResponse($updated);
        }

        // DELETE Student
        if (!$sub && $method === 'DELETE') {
            $st = Database::fetchOne("SELECT name FROM students WHERE id = ?", [$studentId]);
            if ($st && !empty($st['name'])) {
                try {
                    $certPdo = Database::getCertificatesConnection();
                    $certStmt = $certPdo->prepare("DELETE FROM certificates WHERE studentName = ?");
                    $certStmt->execute([$st['name']]);
                } catch (\Throwable $e) {}
            }
            Database::execute("DELETE FROM notifications WHERE studentId = ?", [$studentId]);
            Database::execute("DELETE FROM test_submissions WHERE studentId = ?", [$studentId]);
            Database::execute("DELETE FROM attendance WHERE studentId = ?", [$studentId]);
            Database::execute("DELETE FROM project_posts WHERE studentId = ?", [$studentId]);
            Database::execute("DELETE FROM students WHERE id = ?", [$studentId]);
            jsonResponse(['success' => true, 'message' => 'Student record deleted successfully.']);
        }
    }

    // ----------------------------------------------------
    // 5. PROGRAMS / COURSES PLATFORM
    // ----------------------------------------------------
    if (($route === '/programs' || $route === '/courses') && $method === 'GET') {
        $studentId = cleanString($_GET['studentId'] ?? '');
        $programs = Database::fetchAll("SELECT * FROM programs ORDER BY createdAt DESC");

        $enriched = array_map(function($prog) use ($studentId) {
            $clickCount = (int)(Database::fetchOne("SELECT COUNT(DISTINCT studentId) as c FROM program_clicks WHERE programId = ?", [$prog['id']])['c'] ?? 0);
            $submissionCount = 0;
            try {
                $pdo = Database::getCertificatesConnection();
                $cStmt = $pdo->prepare("SELECT COUNT(*) as c FROM certificates WHERE programTitle = ?");
                $cStmt->execute([$prog['title']]);
                $submissionCount = (int)($cStmt->fetch(PDO::FETCH_ASSOC)['c'] ?? 0);
            } catch (\Throwable $e) {}

            $studentClicked = false;
            $studentClickedAt = null;
            $studentSubmission = null;

            if ($studentId) {
                $click = Database::fetchOne("SELECT clickedAt FROM program_clicks WHERE programId = ? AND studentId = ?", [$prog['id'], $studentId]);
                if ($click) {
                    $studentClicked = true;
                    $studentClickedAt = $click['clickedAt'];
                }
                try {
                    $st = Database::fetchOne("SELECT name FROM students WHERE id = ?", [$studentId]);
                    if ($st) {
                        $pdo = Database::getCertificatesConnection();
                        $certStmt = $pdo->prepare("SELECT id, programTitle, studentName, certificateImg, verifiedBy, status, createdAt FROM certificates WHERE programTitle = ? AND studentName = ? ORDER BY createdAt DESC LIMIT 1");
                        $certStmt->execute([$prog['title'], $st['name']]);
                        $cert = $certStmt->fetch(PDO::FETCH_ASSOC);
                        if ($cert) {
                            $cert['fileData'] = $cert['certificateImg'];
                            $studentSubmission = $cert;
                        }
                    }
                } catch (\Throwable $e) {}
            }

            $prog['clickCount'] = $clickCount;
            $prog['submissionCount'] = $submissionCount;
            $prog['studentClicked'] = $studentClicked;
            $prog['studentClickedAt'] = $studentClickedAt;
            $prog['studentSubmission'] = $studentSubmission;
            $prog['image'] = $prog['bannerImg'] ?? '';
            $prog['image_url'] = $prog['bannerImg'] ?? '';
            $prog['provider'] = $prog['issuer'] ?? 'Podar Pathways';
            $prog['url'] = $prog['link'] ?? '';
            $prog['validTill'] = $prog['deadline'] ?? '2026-12-31';
            return $prog;
        }, $programs);

        jsonResponse($enriched);
    }

    if (($route === '/programs' || $route === '/courses') && $method === 'POST') {
        $title          = cleanString($body['title'] ?? '');
        $issuer         = cleanString($body['issuer'] ?? $body['provider'] ?? 'Podar Pathways');
        $description    = trim($body['description'] ?? '');
        $link           = cleanString($body['link'] ?? $body['url'] ?? '');
        $bannerImg      = trim((string)($body['bannerImg'] ?? $body['image'] ?? $body['image_url'] ?? ''));
        $targetCourse   = cleanString($body['targetCourse'] ?? 'All');
        $targetSemester = cleanString($body['targetSemester'] ?? 'All');
        $deadline       = cleanString($body['validTill'] ?? $body['deadline'] ?? '2026-12-31');
        $rewardPoints   = (int)($body['rewardPoints'] ?? 15);

        if (!$title) jsonError('Program title is required.');
        if (!$link)  jsonError('Official Course or Certificate link is required.');

        $id = 'prog-' . time() . '-' . random_int(100, 999);
        $now = nowIso();

        Database::execute(
            "INSERT INTO programs (id, title, issuer, description, link, bannerImg, targetCourse, targetSemester, deadline, rewardPoints, status, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)",
            [$id, $title, $issuer, $description, $link, $bannerImg, $targetCourse, $targetSemester, $deadline, $rewardPoints, $now, $now]
        );

        $created = Database::fetchOne("SELECT * FROM programs WHERE id = ?", [$id]);
        if ($created) {
            $created['image'] = $created['bannerImg'] ?? '';
            $created['image_url'] = $created['bannerImg'] ?? '';
            $created['provider'] = $created['issuer'] ?? 'Podar Pathways';
            $created['url'] = $created['link'] ?? '';
            $created['validTill'] = $created['deadline'] ?? '2026-12-31';
        }
        jsonResponse($created, 201);
    }

    if ($route === '/programs/all-clicks' || $route === '/courses/all-clicks') {
        if ($method === 'GET') {
            $allClicks = Database::fetchAll("
                SELECT pc.*, COALESCE(s.name, pc.studentName) as studentName,
                       COALESCE(s.phone, pc.studentPhone) as studentPhone,
                       s.course as studentCourse, s.semester as studentSemester, s.email, s.rollNo, s.avatar,
                       p.title as programTitle
                FROM program_clicks pc
                LEFT JOIN students s ON pc.studentId = s.id
                LEFT JOIN programs p ON pc.programId = p.id
                ORDER BY pc.clickedAt DESC
            ");
            jsonResponse(['clicks' => $allClicks, 'total' => count($allClicks)]);
        }
    }

    if (preg_match('#^/(?:programs|courses)/([^/]+)(?:/(click|clicks))?$#', $route, $matches)) {
        $progId = $matches[1];
        $sub = $matches[2] ?? '';

        // Record Click
        if ($sub === 'click' && $method === 'POST') {
            $studentId    = cleanString($body['studentId'] ?? '');
            $studentName  = cleanString($body['studentName'] ?? 'Student');
            $studentPhone = cleanPhone($body['studentPhone'] ?? '');

            if (!$studentId && !empty($auth['id'])) {
                $studentId    = $auth['id'];
                $studentName  = $auth['student']['name'] ?? $studentName;
                $studentPhone = $auth['student']['phone'] ?? $studentPhone;
            }

            if (!$studentId) jsonError('Student ID is required.');

            $prog = Database::fetchOne("SELECT id, title FROM programs WHERE id = ?", [$progId]);
            $now = nowIso();

            if (!$prog) {
                $progTitle = cleanString($body['courseTitle'] ?? $body['programTitle'] ?? 'Curated Course');
                $progLink  = cleanString($body['url'] ?? $body['link'] ?? 'https://www.coursera.org');
                Database::execute(
                    "INSERT INTO programs (id, title, issuer, description, link, targetCourse, targetSemester, deadline, rewardPoints, status, createdAt, updatedAt)
                     VALUES (?, ?, 'Podar Pathways', 'Curated career preparation course', ?, 'All', 'All', '2026-12-31', 15, 'active', ?, ?)",
                    [$progId, $progTitle, $progLink, $now, $now]
                );
            }

            $existing = Database::fetchOne("SELECT id FROM program_clicks WHERE programId = ? AND studentId = ?", [$progId, $studentId]);

            if ($existing) {
                Database::execute("UPDATE program_clicks SET clickedAt = ?, studentName = ?, studentPhone = ? WHERE id = ?", [$now, $studentName, $studentPhone, $existing['id']]);
            } else {
                $clickId = 'pclk-' . time() . '-' . random_int(100, 999);
                Database::execute(
                    "INSERT INTO program_clicks (id, programId, studentId, studentName, studentPhone, clickedAt) VALUES (?, ?, ?, ?, ?, ?)",
                    [$clickId, $progId, $studentId, $studentName, $studentPhone, $now]
                );
            }

            jsonResponse(['success' => true, 'message' => 'Course interaction recorded.', 'programId' => $progId, 'clickedAt' => $now]);
        }

        // Get Program Clicks & Analytics
        if ($sub === 'clicks' && $method === 'GET') {
            $clicks = Database::fetchAll("
                SELECT pc.id, pc.programId, pc.studentId, pc.clickedAt,
                       COALESCE(s.name, pc.studentName) as studentName,
                       COALESCE(s.phone, pc.studentPhone) as studentPhone,
                       s.course, s.semester, s.email, s.rollNo, s.avatar
                FROM program_clicks pc
                LEFT JOIN students s ON pc.studentId = s.id
                WHERE pc.programId = ?
                ORDER BY pc.clickedAt DESC
            ", [$progId]);

            $allStudents = Database::fetchAll("SELECT id, name, phone, email, course, semester, rollNo, avatar FROM students WHERE status != 'suspended' ORDER BY name ASC");
            $clickedIds = array_column($clicks, 'studentId');
            $notClicked = array_values(array_filter($allStudents, function($s) use ($clickedIds) {
                return !in_array($s['id'], $clickedIds);
            }));

            jsonResponse([
                'clicks'        => $clicks,
                'totalClicked'  => count($clicks),
                'notClicked'    => $notClicked,
                'totalStudents' => count($allStudents)
            ]);
        }

        // PUT Program
        if (!$sub && $method === 'PUT') {
            $prog = Database::fetchOne("SELECT * FROM programs WHERE id = ?", [$progId]);
            if (!$prog) jsonError('Program not found.', 404);

            $title          = cleanString($body['title'] ?? $prog['title']);
            $issuer         = cleanString($body['issuer'] ?? $body['provider'] ?? $prog['issuer']);
            $description    = trim($body['description'] ?? $prog['description']);
            $link           = cleanString($body['link'] ?? $body['url'] ?? $prog['link']);
            $bannerImg      = isset($body['bannerImg']) ? trim((string)$body['bannerImg']) : (isset($body['image']) ? trim((string)$body['image']) : (isset($body['image_url']) ? trim((string)$body['image_url']) : $prog['bannerImg']));
            $targetCourse   = cleanString($body['targetCourse'] ?? $prog['targetCourse']);
            $targetSemester = cleanString($body['targetSemester'] ?? $prog['targetSemester']);
            $deadline       = cleanString($body['validTill'] ?? $body['deadline'] ?? $prog['deadline']);
            $rewardPoints   = isset($body['rewardPoints']) ? (int)$body['rewardPoints'] : $prog['rewardPoints'];
            $status         = cleanString($body['status'] ?? $prog['status']);

            Database::execute("
                UPDATE programs SET
                    title = ?, issuer = ?, description = ?, link = ?, bannerImg = ?,
                    targetCourse = ?, targetSemester = ?, deadline = ?, rewardPoints = ?,
                    status = ?, updatedAt = ?
                WHERE id = ?
            ", [$title, $issuer, $description, $link, $bannerImg, $targetCourse, $targetSemester, $deadline, $rewardPoints, $status, nowIso(), $progId]);

            $updated = Database::fetchOne("SELECT * FROM programs WHERE id = ?", [$progId]);
            if ($updated) {
                $updated['image'] = $updated['bannerImg'] ?? '';
                $updated['image_url'] = $updated['bannerImg'] ?? '';
                $updated['provider'] = $updated['issuer'] ?? 'Podar Pathways';
                $updated['url'] = $updated['link'] ?? '';
                $updated['validTill'] = $updated['deadline'] ?? '2026-12-31';
            }
            jsonResponse($updated);
        }

        // DELETE Program
        if (!$sub && $method === 'DELETE') {
            Database::execute("DELETE FROM programs WHERE id = ?", [$progId]);
            Database::execute("DELETE FROM program_clicks WHERE programId = ?", [$progId]);
            jsonResponse(['success' => true, 'message' => 'Program deleted successfully.']);
        }
    }

    // ----------------------------------------------------
    // 6. CERTIFICATES DESK & VERIFICATION (Simplified Schema)
    // Structure: id, programTitle, studentName, certificateImg, verifiedBy, status, createdAt
    // ----------------------------------------------------
    if ($route === '/certificates' && $method === 'GET') {
        if (($auth['role'] ?? '') === 'student') {
            $stmt = Database::getCertificatesConnection()->prepare('SELECT id, programTitle, studentName, certificateImg, verifiedBy, status, createdAt FROM certificates WHERE studentName = ? ORDER BY createdAt DESC');
            $stmt->execute([$auth['student']['name']]);
            $certificates = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($certificates as &$certificate) { $certificate['studentId'] = $auth['id']; $certificate['fileData'] = $certificate['certificateImg']; $certificate['submittedAt'] = $certificate['createdAt']; }
            unset($certificate);
            jsonResponse($certificates);
        }
        try {
            $pdo = Database::getCertificatesConnection();
            $certs = $pdo->query("SELECT id, programTitle, studentName, certificateImg, verifiedBy, status, createdAt FROM certificates ORDER BY createdAt DESC")->fetchAll(PDO::FETCH_ASSOC);
        } catch (\Throwable $e) {
            $certs = Database::fetchAll("SELECT * FROM certificates ORDER BY createdAt DESC");
        }
        $certs = array_map(function($c) {
            $c['fileData'] = $c['certificateImg'] ?? '';
            $c['submittedAt'] = $c['createdAt'] ?? date('c');
            return $c;
        }, $certs);
        jsonResponse($certs);
    }

    if ($route === '/certificates' && $method === 'POST') {
        $id             = $body['id'] ?? ('cert-' . time() . '-' . random_int(1000, 9999));
        $programTitle   = cleanString($body['programTitle'] ?? 'Course Certificate');
        $studentName    = cleanString($body['studentName'] ?? 'Student');
        $certificateImg = $body['certificateImg'] ?? ($body['fileData'] ?? ($body['image'] ?? ''));
        $status         = cleanString($body['status'] ?? 'pending');
        $verifiedBy     = ($status === 'verified') ? cleanString($body['verifiedBy'] ?? 'Podar Academic Board') : null;
        $now            = nowIso();

        $pdo = Database::getCertificatesConnection();
        $stmt = $pdo->prepare("
            INSERT INTO certificates (id, programTitle, studentName, certificateImg, verifiedBy, status, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$id, $programTitle, $studentName, $certificateImg, $verifiedBy, $status, $now]);

        // Keep podar_pathways in sync if separate DB
        if (Database::getDriver() === 'mysql' && defined('DB_CERTIFICATES_NAME') && DB_CERTIFICATES_NAME !== DB_NAME) {
            try {
                $mainPdo = Database::getConnection();
                $mainStmt = $mainPdo->prepare("
                    INSERT INTO certificates (id, programTitle, studentName, certificateImg, verifiedBy, status, createdAt)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE programTitle = VALUES(programTitle), studentName = VALUES(studentName), certificateImg = VALUES(certificateImg), verifiedBy = VALUES(verifiedBy), status = VALUES(status)
                ");
                $mainStmt->execute([$id, $programTitle, $studentName, $certificateImg, $verifiedBy, $status, $now]);
            } catch (\Throwable $e) {}
        }

        $stmt = $pdo->prepare("SELECT id, programTitle, studentName, certificateImg, verifiedBy, status, createdAt FROM certificates WHERE id = ?");
        $stmt->execute([$id]);
        $inserted = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($inserted) {
            $inserted['fileData'] = $inserted['certificateImg'];
            $inserted['submittedAt'] = $inserted['createdAt'];
        }
        jsonResponse($inserted, 201);
    }

    if (preg_match('#^/certificates/([^/]+)/verify$#', $route, $matches) && $method === 'PUT') {
        $certId     = $matches[1];
        $status     = cleanString($body['status'] ?? 'verified');
        $verifiedBy = cleanString($body['verifiedBy'] ?? 'Podar Academic Board');

        if (!in_array($status, ['verified', 'rejected', 'pending'])) {
            jsonError('Status must be verified, rejected, or pending.');
        }

        $pdo = Database::getCertificatesConnection();
        $stmt = $pdo->prepare("SELECT * FROM certificates WHERE id = ?");
        $stmt->execute([$certId]);
        $cert = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$cert) jsonError('Certificate record not found.', 404);

        $vBy = ($status === 'verified') ? ($verifiedBy ?: 'Podar Academic Board') : null;

        $updateStmt = $pdo->prepare("UPDATE certificates SET status = ?, verifiedBy = ? WHERE id = ?");
        $updateStmt->execute([$status, $vBy, $certId]);

        // Keep podar_pathways in sync if separate DB
        if (Database::getDriver() === 'mysql' && defined('DB_CERTIFICATES_NAME') && DB_CERTIFICATES_NAME !== DB_NAME) {
            try {
                $mainPdo = Database::getConnection();
                $mUp = $mainPdo->prepare("UPDATE certificates SET status = ?, verifiedBy = ? WHERE id = ?");
                $mUp->execute([$status, $vBy, $certId]);
            } catch (\Throwable $e) {}
        }

        // Award score points and notify student
        if ($status === 'verified') {
            try {
                $student = Database::fetchOne("SELECT * FROM students WHERE LOWER(name) = ?", [strtolower($cert['studentName'])]);
                if ($student) {
                    $newCerts = (int)($student['certificates'] ?? 0) + 1;
                    $newScore = min(100, (int)($student['score'] ?? 40) + 12);
                    $newCompletion = min(100, (int)($student['completion'] ?? 50) + 8);
                    Database::execute("UPDATE students SET certificates = ?, score = ?, completion = ?, updatedAt = ? WHERE id = ?", [$newCerts, $newScore, $newCompletion, nowIso(), $student['id']]);

                    if (!empty($student['email'])) {
                        Mailer::sendCertificateApprovedEmail($student['email'], $student['name'], $cert['programTitle'], $cert['id']);
                    }
                }
            } catch (\Throwable $e) {}
        } elseif ($status === 'rejected') {
            try {
                $student = Database::fetchOne("SELECT * FROM students WHERE LOWER(name) = ?", [strtolower($cert['studentName'])]);
                if ($student && !empty($student['email'])) {
                    $remarks = cleanString($body['adminRemarks'] ?? 'Document could not be verified against course standards. Please re-upload a clear authentic copy.');
                    Mailer::sendCertificateDeniedEmail($student['email'], $student['name'], $cert['programTitle'], $remarks);
                }
            } catch (\Throwable $e) {}
        }

        $stmt = $pdo->prepare("SELECT id, programTitle, studentName, certificateImg, verifiedBy, status, createdAt FROM certificates WHERE id = ?");
        $stmt->execute([$certId]);
        $updated = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($updated) {
            $updated['fileData'] = $updated['certificateImg'];
            $updated['submittedAt'] = $updated['createdAt'];
        }
        jsonResponse($updated);
    }

    if (preg_match('#^/certificates/([^/]+)$#', $route, $matches) && $method === 'DELETE') {
        $certId = $matches[1];
        $pdo = Database::getCertificatesConnection();
        $stmt = $pdo->prepare("DELETE FROM certificates WHERE id = ?");
        $stmt->execute([$certId]);

        if (Database::getDriver() === 'mysql' && defined('DB_CERTIFICATES_NAME') && DB_CERTIFICATES_NAME !== DB_NAME) {
            try {
                $mainPdo = Database::getConnection();
                $mainStmt = $mainPdo->prepare("DELETE FROM certificates WHERE id = ?");
                $mainStmt->execute([$certId]);
            } catch (\Throwable $e) {}
        }
        jsonResponse(['success' => true, 'message' => 'Certificate deleted successfully.']);
    }

    // ----------------------------------------------------
    // 7. NOTIFICATIONS DESK
    // ----------------------------------------------------
    if ($route === '/notifications' && $method === 'GET') {
        $studentId = cleanString($_GET['studentId'] ?? 'all');
        $notifications = Database::fetchAll(
            "SELECT * FROM notifications WHERE studentId = 'all' OR studentId = ? ORDER BY createdAt DESC LIMIT 50",
            [$studentId]
        );
        jsonResponse($notifications);
    }

    if ($route === '/notifications/read-all' && $method === 'PUT') {
        $studentId = cleanString($body['studentId'] ?? $_GET['studentId'] ?? 'all');
        if ($studentId === 'all') {
            Database::execute("UPDATE notifications SET isRead = 1");
        } else {
            Database::execute("UPDATE notifications SET isRead = 1 WHERE studentId = ?", [$studentId]);
        }
        jsonResponse(['success' => true, 'message' => 'All notifications marked as read']);
    }

    if ($route === '/notifications/clear/read' && $method === 'DELETE') {
        $studentId = cleanString($_GET['studentId'] ?? 'all');
        if ($studentId === 'all') {
            Database::execute("DELETE FROM notifications WHERE isRead = 1");
        } else {
            Database::execute("DELETE FROM notifications WHERE isRead = 1 AND studentId = ?", [$studentId]);
        }
        jsonResponse(['success' => true, 'message' => 'Read notifications cleared']);
    }

    if (preg_match('#^/notifications/([^/]+)/read$#', $route, $matches) && $method === 'PUT') {
        Database::execute("UPDATE notifications SET isRead = 1 WHERE id = ?", [$matches[1]]);
        jsonResponse(['success' => true]);
    }

    if (preg_match('#^/notifications/([^/]+)$#', $route, $matches) && $method === 'DELETE') {
        Database::execute("DELETE FROM notifications WHERE id = ?", [$matches[1]]);
        jsonResponse(['success' => true]);
    }

    // ----------------------------------------------------
    // 8. TESTS & ASSESSMENTS MODULE
    // ----------------------------------------------------
    if ($route === '/tests' && $method === 'GET') {
        $course   = cleanString($_GET['course'] ?? '');
        $semester = cleanString($_GET['semester'] ?? '');
        $tests = Database::fetchAll("SELECT * FROM tests ORDER BY createdAt DESC");

        if ($course && $course !== 'All') {
            $tests = array_values(array_filter($tests, fn($t) => ($t['targetCourse'] ?? 'All') === 'All' || $t['targetCourse'] === $course));
        }
        if ($semester && $semester !== 'All') {
            $tests = array_values(array_filter($tests, fn($t) => ($t['targetSemester'] ?? 'All') === 'All' || $t['targetSemester'] === $semester));
        }

        $enhanced = array_map(function($t) {
            $t['questions'] = safeJsonDecode($t['questions'] ?? '[]', []);
            $t['questionsCount'] = count($t['questions']);
            if (($_SESSION['auth']['role'] ?? '') !== 'admin') {
                foreach ($t['questions'] as &$question) unset($question['correctAnswer'], $question['explanation']);
                unset($question);
            }
            return $t;
        }, $tests);

        jsonResponse($enhanced);
    }

    if ($route === '/tests' && $method === 'POST') {
        $title           = cleanString($body['title'] ?? '');
        $category        = cleanString($body['category'] ?? 'Technical');
        $description     = trim($body['description'] ?? '');
        $targetCourse    = cleanString($body['targetCourse'] ?? 'All');
        $targetSemester  = cleanString($body['targetSemester'] ?? 'All');
        $durationMinutes = (int)($body['durationMinutes'] ?? 20);
        $totalMarks      = (int)($body['totalMarks'] ?? 100);
        $passingMarks    = (int)($body['passingMarks'] ?? 40);
        $rewardPoints    = (int)($body['rewardPoints'] ?? 15);
        $status          = cleanString($body['status'] ?? 'active');
        $questions       = $body['questions'] ?? [];

        if (!$title) jsonError('Test title is required');

        $id = 'test-' . time() . '-' . random_int(100, 999);
        $now = nowIso();
        $questionsJson = json_encode($questions);

        Database::execute("
            INSERT INTO tests (id, title, category, description, targetCourse, targetSemester, durationMinutes, totalMarks, passingMarks, rewardPoints, status, questions, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ", [$id, $title, $category, $description, $targetCourse, $targetSemester, $durationMinutes, $totalMarks, $passingMarks, $rewardPoints, $status, $questionsJson, $now, $now]);

        $created = Database::fetchOne("SELECT * FROM tests WHERE id = ?", [$id]);
        $created['questions'] = $questions;
        jsonResponse($created, 201);
    }

    if (preg_match('#^/tests/([^/]+)(?:/(submit))?$#', $route, $matches)) {
        $testId = $matches[1];
        $isSubmit = ($matches[2] ?? '') === 'submit';

        // Submit Test
        if ($isSubmit && $method === 'POST') {
            $test = Database::fetchOne("SELECT * FROM tests WHERE id = ?", [$testId]);
            if (!$test) jsonError('Test not found', 404);

            $studentId       = cleanString($body['studentId'] ?? '');
            $studentName     = cleanString($body['studentName'] ?? 'Student');
            $studentPhone    = cleanPhone($body['studentPhone'] ?? '');
            $studentCourse   = cleanString($body['studentCourse'] ?? 'All');
            $studentSemester = cleanString($body['studentSemester'] ?? 'All');
            $timeSpent       = (int)($body['timeSpentSeconds'] ?? 0);
            $userAnswers     = $body['answers'] ?? [];

            $questions = safeJsonDecode($test['questions'] ?? '[]', []);
            $score = 0;
            $totalMarks = (int)$test['totalMarks'];
            $passingMarks = (int)$test['passingMarks'];

            $evaluatedAnswers = [];
            foreach ($questions as $q) {
                $qId = $q['id'];
                $qMarks = (int)($q['marks'] ?? 5);
                $correct = $q['correctAnswer'] ?? '';
                $given = $userAnswers[$qId] ?? '';
                $isCorrect = false;

                if (is_numeric($correct) && is_numeric($given)) {
                    $isCorrect = (int)$correct === (int)$given;
                } else {
                    $isCorrect = strtolower(trim((string)$correct)) === strtolower(trim((string)$given));
                }

                if ($isCorrect) $score += $qMarks;

                $evaluatedAnswers[] = [
                    'questionId'    => $qId,
                    'question'      => $q['question'] ?? '',
                    'userAnswer'    => $given,
                    'correctAnswer' => $correct,
                    'isCorrect'     => $isCorrect,
                    'marksAwarded'  => $isCorrect ? $qMarks : 0,
                    'maxMarks'      => $qMarks
                ];
            }

            $percentage = $totalMarks > 0 ? (int)round(($score / $totalMarks) * 100) : 0;
            $passed = $score >= $passingMarks;
            $status = $passed ? 'Passed' : 'Failed';
            $now = nowIso();
            $subId = 'sub-' . time() . '-' . random_int(100, 999);

            Database::execute("
                INSERT INTO test_submissions (id, testId, testTitle, studentId, studentName, studentPhone, studentCourse, studentSemester, score, totalMarks, percentage, status, timeSpentSeconds, answers, submittedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ", [$subId, $testId, $test['title'], $studentId, $studentName, $studentPhone, $studentCourse, $studentSemester, $score, $totalMarks, $percentage, $status, $timeSpent, json_encode($evaluatedAnswers), $now]);

            // Update student P-CARE score on passing
            if ($passed && $studentId) {
                $student = Database::fetchOne("SELECT score FROM students WHERE id = ?", [$studentId]);
                if ($student) {
                    $newScore = min(100, (int)($student['score'] ?? 50) + 5);
                    Database::execute("UPDATE students SET score = ?, updatedAt = ? WHERE id = ?", [$newScore, $now, $studentId]);
                }
            }

            jsonResponse([
                'success'    => true,
                'submission' => [
                    'id'          => $subId,
                    'testId'      => $testId,
                    'testTitle'   => $test['title'],
                    'score'       => $score,
                    'totalMarks'  => $totalMarks,
                    'percentage'  => $percentage,
                    'status'      => $status,
                    'submittedAt' => $now,
                    'answers'     => $evaluatedAnswers
                ]
            ]);
        }

        // GET Single Test
        if (!$isSubmit && $method === 'GET') {
            $test = Database::fetchOne("SELECT * FROM tests WHERE id = ?", [$testId]);
            if (!$test) jsonError('Test not found', 404);
            $test['questions'] = safeJsonDecode($test['questions'] ?? '[]', []);
            if (($auth['role'] ?? '') !== 'admin') {
                foreach ($test['questions'] as &$question) unset($question['correctAnswer'], $question['explanation']);
                unset($question);
            }
            jsonResponse($test);
        }

        // PUT Test
        if (!$isSubmit && $method === 'PUT') {
            $existing = Database::fetchOne("SELECT * FROM tests WHERE id = ?", [$testId]);
            if (!$existing) jsonError('Test not found', 404);

            $title           = cleanString($body['title'] ?? $existing['title']);
            $category        = cleanString($body['category'] ?? $existing['category']);
            $description     = trim($body['description'] ?? $existing['description']);
            $targetCourse    = cleanString($body['targetCourse'] ?? $existing['targetCourse']);
            $targetSemester  = cleanString($body['targetSemester'] ?? $existing['targetSemester']);
            $durationMinutes = isset($body['durationMinutes']) ? (int)$body['durationMinutes'] : $existing['durationMinutes'];
            $totalMarks      = isset($body['totalMarks']) ? (int)$body['totalMarks'] : $existing['totalMarks'];
            $passingMarks    = isset($body['passingMarks']) ? (int)$body['passingMarks'] : $existing['passingMarks'];
            $rewardPoints    = isset($body['rewardPoints']) ? (int)$body['rewardPoints'] : $existing['rewardPoints'];
            $status          = cleanString($body['status'] ?? $existing['status']);
            $questionsJson   = isset($body['questions']) ? json_encode($body['questions']) : $existing['questions'];

            Database::execute("
                UPDATE tests SET
                    title = ?, category = ?, description = ?, targetCourse = ?,
                    targetSemester = ?, durationMinutes = ?, totalMarks = ?,
                    passingMarks = ?, rewardPoints = ?, status = ?, questions = ?, updatedAt = ?
                WHERE id = ?
            ", [$title, $category, $description, $targetCourse, $targetSemester, $durationMinutes, $totalMarks, $passingMarks, $rewardPoints, $status, $questionsJson, nowIso(), $testId]);

            $updated = Database::fetchOne("SELECT * FROM tests WHERE id = ?", [$testId]);
            $updated['questions'] = safeJsonDecode($updated['questions'] ?? '[]', []);
            jsonResponse($updated);
        }

        // DELETE Test
        if (!$isSubmit && $method === 'DELETE') {
            Database::execute("DELETE FROM test_submissions WHERE testId = ?", [$testId]);
            Database::execute("DELETE FROM tests WHERE id = ?", [$testId]);
            jsonResponse(['success' => true, 'message' => 'Test and associated submissions deleted successfully.']);
        }
    }

    // Test Submissions Listing & Review
    if ($route === '/test-submissions' && $method === 'GET') {
        $testId    = cleanString($_GET['testId'] ?? '');
        $studentId = cleanString($_GET['studentId'] ?? '');
        $status    = cleanString($_GET['status'] ?? '');

        $sql = "SELECT * FROM test_submissions WHERE 1=1";
        $params = [];
        if ($testId)    { $sql .= " AND testId = ?";    $params[] = $testId; }
        if ($studentId) { $sql .= " AND studentId = ?"; $params[] = $studentId; }
        if ($status)    { $sql .= " AND status = ?";    $params[] = $status; }
        $sql .= " ORDER BY submittedAt DESC";

        $subs = Database::fetchAll($sql, $params);
        $enriched = array_map(function($s) {
            $s['answers'] = safeJsonDecode($s['answers'] ?? '[]', []);
            return $s;
        }, $subs);
        jsonResponse($enriched);
    }

    if (preg_match('#^/test-submissions/([^/]+)(?:/(review))?$#', $route, $matches)) {
        $subId = $matches[1];
        $isReview = ($matches[2] ?? '') === 'review';

        if ($isReview && $method === 'PUT') {
            $sub = Database::fetchOne("SELECT * FROM test_submissions WHERE id = ?", [$subId]);
            if (!$sub) jsonError('Submission not found', 404);

            $score = isset($body['score']) ? (int)$body['score'] : (int)$sub['score'];
            $totalMarks = (int)$sub['totalMarks'];
            $percentage = $totalMarks > 0 ? (int)round(($score / $totalMarks) * 100) : 0;
            $status = cleanString($body['status'] ?? ($score >= 40 ? 'Passed' : 'Failed'));
            $remarks = trim($body['adminRemarks'] ?? '');

            Database::execute("
                UPDATE test_submissions SET score = ?, percentage = ?, status = ?, adminRemarks = ?, checkedAt = ? WHERE id = ?
            ", [$score, $percentage, $status, $remarks, nowIso(), $subId]);

            $updated = Database::fetchOne("SELECT * FROM test_submissions WHERE id = ?", [$subId]);
            $updated['answers'] = safeJsonDecode($updated['answers'] ?? '[]', []);
            jsonResponse($updated);
        }

        if (!$isReview && $method === 'GET') {
            $sub = Database::fetchOne("SELECT * FROM test_submissions WHERE id = ?", [$subId]);
            if (!$sub) jsonError('Submission not found', 404);
            $sub['answers'] = safeJsonDecode($sub['answers'] ?? '[]', []);
            jsonResponse($sub);
        }
    }

    // ----------------------------------------------------
    // 9. SCHEDULES & WORKSHOPS
    // ----------------------------------------------------
    if ($route === '/schedules' && $method === 'GET') {
        $month    = cleanString($_GET['month'] ?? '');
        $course   = cleanString($_GET['course'] ?? '');
        $semester = cleanString($_GET['semester'] ?? '');
        $category = cleanString($_GET['category'] ?? '');

        $sql = "SELECT * FROM schedules WHERE 1=1";
        $params = [];
        if ($month)    { $sql .= " AND date LIKE ?";     $params[] = "{$month}%"; }
        if ($category) { $sql .= " AND category = ?";   $params[] = $category; }
        $sql .= " ORDER BY date ASC, startTime ASC";

        $schedules = Database::fetchAll($sql, $params);
        if ($course && $course !== 'All') {
            $schedules = array_values(array_filter($schedules, fn($s) => ($s['targetCourse'] ?? 'All') === 'All' || $s['targetCourse'] === $course));
        }
        if ($semester && $semester !== 'All') {
            $schedules = array_values(array_filter($schedules, fn($s) => ($s['targetSemester'] ?? 'All') === 'All' || $s['targetSemester'] === $semester));
        }
        jsonResponse($schedules);
    }

    if ($route === '/schedules' && $method === 'POST') {
        $title          = cleanString($body['title'] ?? '');
        $category       = cleanString($body['category'] ?? 'Lecture');
        $date           = cleanString($body['date'] ?? date('Y-m-d'));
        $startTime      = cleanString($body['startTime'] ?? '');
        $endTime        = cleanString($body['endTime'] ?? '');
        $location       = cleanString($body['location'] ?? '');
        $meetLink       = cleanString($body['meetLink'] ?? '');
        $targetCourse   = cleanString($body['targetCourse'] ?? 'All');
        $targetSemester = cleanString($body['targetSemester'] ?? 'All');
        $instructor     = cleanString($body['instructor'] ?? 'Faculty');
        $description    = trim($body['description'] ?? '');
        $isMandatory    = !empty($body['isMandatory']) ? 1 : 0;
        $createdBy      = cleanString($body['createdBy'] ?? 'Admin');

        if (!$title || !$date) jsonError('Title and Date are required');

        $id = 'sch-' . time() . '-' . random_int(100, 999);
        $now = nowIso();

        Database::execute("
            INSERT INTO schedules (id, title, category, date, startTime, endTime, location, meetLink, targetCourse, targetSemester, instructor, description, isMandatory, createdBy, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ", [$id, $title, $category, $date, $startTime, $endTime, $location, $meetLink, $targetCourse, $targetSemester, $instructor, $description, $isMandatory, $createdBy, $now, $now]);

        $created = Database::fetchOne("SELECT * FROM schedules WHERE id = ?", [$id]);
        jsonResponse($created, 201);
    }

    if (preg_match('#^/schedules/([^/]+)$#', $route, $matches)) {
        $schId = $matches[1];

        if ($method === 'GET') {
            $sch = Database::fetchOne("SELECT * FROM schedules WHERE id = ?", [$schId]);
            if (!$sch) jsonError('Schedule not found', 404);
            jsonResponse($sch);
        }

        if ($method === 'PUT') {
            $sch = Database::fetchOne("SELECT * FROM schedules WHERE id = ?", [$schId]);
            if (!$sch) jsonError('Schedule event not found', 404);

            $title          = cleanString($body['title'] ?? $sch['title']);
            $category       = cleanString($body['category'] ?? $sch['category']);
            $date           = cleanString($body['date'] ?? $sch['date']);
            $startTime      = cleanString($body['startTime'] ?? $sch['startTime']);
            $endTime        = cleanString($body['endTime'] ?? $sch['endTime']);
            $location       = cleanString($body['location'] ?? $sch['location']);
            $meetLink       = cleanString($body['meetLink'] ?? $sch['meetLink']);
            $targetCourse   = cleanString($body['targetCourse'] ?? $sch['targetCourse']);
            $targetSemester = cleanString($body['targetSemester'] ?? $sch['targetSemester']);
            $instructor     = cleanString($body['instructor'] ?? $sch['instructor']);
            $description    = trim($body['description'] ?? $sch['description']);
            $isMandatory    = isset($body['isMandatory']) ? (!empty($body['isMandatory']) ? 1 : 0) : $sch['isMandatory'];

            Database::execute("
                UPDATE schedules SET
                    title = ?, category = ?, date = ?, startTime = ?, endTime = ?, location = ?,
                    meetLink = ?, targetCourse = ?, targetSemester = ?, instructor = ?,
                    description = ?, isMandatory = ?, updatedAt = ?
                WHERE id = ?
            ", [$title, $category, $date, $startTime, $endTime, $location, $meetLink, $targetCourse, $targetSemester, $instructor, $description, $isMandatory, nowIso(), $schId]);

            $updated = Database::fetchOne("SELECT * FROM schedules WHERE id = ?", [$schId]);
            jsonResponse($updated);
        }

        if ($method === 'DELETE') {
            Database::execute("DELETE FROM schedules WHERE id = ?", [$schId]);
            Database::execute("DELETE FROM attendance WHERE scheduleId = ?", [$schId]);
            jsonResponse(['message' => 'Schedule event deleted successfully']);
        }
    }

    // ----------------------------------------------------
    // 10. ATTENDANCE REGISTER
    // ----------------------------------------------------
    if ($route === '/attendance' && $method === 'GET') {
        $scheduleId = cleanString($_GET['scheduleId'] ?? '');
        if (!$scheduleId) jsonError('scheduleId parameter is required');

        $schedule = Database::fetchOne("SELECT * FROM schedules WHERE id = ?", [$scheduleId]);
        if (!$schedule) jsonError('Schedule event not found', 404);

        $marked = Database::fetchAll("SELECT * FROM attendance WHERE scheduleId = ? ORDER BY studentName ASC", [$scheduleId]);
        $allStudents = Database::fetchAll("SELECT id, name, course, semester, phone, avatar FROM students ORDER BY name ASC");

        $markedMap = [];
        foreach ($marked as $m) {
            $markedMap[$m['studentId']] = $m;
        }

        $records = [];
        foreach ($allStudents as $st) {
            if (isset($markedMap[$st['id']])) {
                $m = $markedMap[$st['id']];
                $records[] = [
                    'id'          => $m['id'],
                    'studentId'   => $st['id'],
                    'studentName' => $st['name'],
                    'course'      => $st['course'],
                    'semester'    => $st['semester'],
                    'status'      => $m['status'],
                    'markedAt'    => $m['markedAt'],
                    'markedBy'    => $m['markedBy'],
                    'remarks'     => $m['remarks']
                ];
            } else {
                $records[] = [
                    'id'          => null,
                    'studentId'   => $st['id'],
                    'studentName' => $st['name'],
                    'course'      => $st['course'],
                    'semester'    => $st['semester'],
                    'status'      => 'Unmarked',
                    'markedAt'    => null,
                    'markedBy'    => null,
                    'remarks'     => ''
                ];
            }
        }

        jsonResponse([
            'schedule'     => $schedule,
            'records'      => $records,
            'total'        => count($records),
            'markedCount'  => count($marked),
            'presentCount' => count(array_filter($marked, fn($r) => $r['status'] === 'Present')),
            'absentCount'  => count(array_filter($marked, fn($r) => $r['status'] === 'Absent')),
            'lateCount'    => count(array_filter($marked, fn($r) => $r['status'] === 'Late'))
        ]);
    }

    if ($route === '/attendance/mark' && $method === 'POST') {
        $scheduleId = cleanString($body['scheduleId'] ?? '');
        $records    = $body['records'] ?? [];
        $markedBy   = cleanString($body['markedBy'] ?? 'Admin');

        if (!$scheduleId || !is_array($records)) jsonError('scheduleId and records array are required');

        $schedule = Database::fetchOne("SELECT * FROM schedules WHERE id = ?", [$scheduleId]);
        if (!$schedule) jsonError('Schedule event not found', 404);

        $now = nowIso();
        foreach ($records as $rec) {
            $studentId = cleanString($rec['studentId'] ?? '');
            $status    = cleanString($rec['status'] ?? 'Present');
            $remarks   = trim($rec['remarks'] ?? '');

            if (!$studentId || !in_array($status, ['Present', 'Absent', 'Late', 'Excused'])) continue;

            $st = Database::fetchOne("SELECT name, course, semester FROM students WHERE id = ?", [$studentId]);
            $name   = $st['name'] ?? ($rec['studentName'] ?? 'Student');
            $course = $st['course'] ?? ($rec['course'] ?? 'BCA');
            $sem    = $st['semester'] ?? ($rec['semester'] ?? 'V');

            $existing = Database::fetchOne("SELECT id FROM attendance WHERE scheduleId = ? AND studentId = ?", [$scheduleId, $studentId]);
            if ($existing) {
                Database::execute("
                    UPDATE attendance SET status = ?, markedAt = ?, markedBy = ?, remarks = ? WHERE id = ?
                ", [$status, $now, $markedBy, $remarks, $existing['id']]);
            } else {
                $attId = 'att-' . time() . '-' . random_int(100, 999);
                Database::execute("
                    INSERT INTO attendance (id, scheduleId, studentId, studentName, course, semester, status, markedAt, markedBy, remarks)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ", [$attId, $scheduleId, $studentId, $name, $course, $sem, $status, $now, $markedBy, $remarks]);
            }
        }

        jsonResponse(['success' => true, 'message' => "Attendance saved for " . count($records) . " students."]);
    }

    if (preg_match('#^/attendance/student/([^/]+)$#', $route, $matches) && $method === 'GET') {
        $studentId = $matches[1];
        $student = Database::fetchOne("SELECT id, name, course, semester FROM students WHERE id = ?", [$studentId]);
        if (!$student) jsonError('Student not found', 404);

        $records = Database::fetchAll("
            SELECT a.*, s.title as scheduleTitle, s.date as scheduleDate, s.category as scheduleCategory
            FROM attendance a
            LEFT JOIN schedules s ON a.scheduleId = s.id
            WHERE a.studentId = ?
            ORDER BY a.markedAt DESC
        ", [$studentId]);

        $total = count($records);
        $present = count(array_filter($records, fn($r) => in_array($r['status'], ['Present', 'Late'])));
        $rate = $total > 0 ? (int)round(($present / $total) * 100) : 100;

        jsonResponse([
            'student'        => $student,
            'attendanceRate' => $rate,
            'totalSessions'  => $total,
            'attended'       => $present,
            'records'        => $records
        ]);
    }

    if ($route === '/attendance/summary/overview' && $method === 'GET') {
        $totalSchedules  = (int)(Database::fetchOne("SELECT count(*) as c FROM schedules")['c'] ?? 0);
        $totalRecords    = (int)(Database::fetchOne("SELECT count(*) as c FROM attendance")['c'] ?? 0);
        $presentRecords  = (int)(Database::fetchOne("SELECT count(*) as c FROM attendance WHERE status = 'Present'")['c'] ?? 0);
        $lateRecords     = (int)(Database::fetchOne("SELECT count(*) as c FROM attendance WHERE status = 'Late'")['c'] ?? 0);
        $absentRecords   = (int)(Database::fetchOne("SELECT count(*) as c FROM attendance WHERE status = 'Absent'")['c'] ?? 0);

        $overallRate = $totalRecords > 0 ? (int)round((($presentRecords + $lateRecords) / $totalRecords) * 100) : 0;

        jsonResponse([
            'totalSchedules' => $totalSchedules,
            'totalRecords'   => $totalRecords,
            'presentRecords' => $presentRecords,
            'lateRecords'    => $lateRecords,
            'absentRecords'  => $absentRecords,
            'overallRate'    => $overallRate
        ]);
    }

    // ----------------------------------------------------
    // 11. ADMINISTRATORS & ROLES
    // ----------------------------------------------------
    if ($route === '/admins' && $method === 'GET') {
        $admins = Database::fetchAll("SELECT * FROM admins ORDER BY createdAt ASC");
        $safeAdmins = array_map(function($a) {
            unset($a['passwordHash'], $a['salt']);
            $a['permissions'] = safeJsonDecode($a['permissions'] ?? '[]', ['all']);
            return $a;
        }, $admins);
        jsonResponse($safeAdmins);
    }

    if ($route === '/admins' && $method === 'POST') {
        $name        = cleanString($body['name'] ?? '');
        $phone       = cleanPhone($body['phone'] ?? '');
        $email       = cleanEmail($body['email'] ?? '');
        $role        = cleanString($body['role'] ?? 'Admin');
        $department  = cleanString($body['department'] ?? 'Career & Placement Cell');
        $permissions = $body['permissions'] ?? ['manage_students', 'manage_courses'];
        $avatar      = cleanString($body['avatar'] ?? '');
        $password    = $body['password'] ?? '';
        if (strlen($password) < 8) jsonError('Set an administrator password with at least 8 characters.');

        if (!$name || !$email || !$phone) jsonError('Name, email, and mobile number are required.');

        $existing = Database::fetchOne("SELECT id FROM admins WHERE LOWER(email) = ? OR phone = ?", [$email, $phone]);
        if ($existing) jsonError('An administrator with this email or mobile already exists.');

        $id = 'admin-' . time() . '-' . random_int(100, 999);
        $now = nowIso();
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $permsJson = json_encode($permissions);

        Database::execute("
            INSERT INTO admins (id, name, phone, email, passwordHash, role, department, permissions, avatar, status, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
        ", [$id, $name, $phone, $email, $hash, $role, $department, $permsJson, $avatar, $now, $now]);

        $created = Database::fetchOne("SELECT * FROM admins WHERE id = ?", [$id]);
        unset($created['passwordHash'], $created['salt']);
        $created['permissions'] = $permissions;
        jsonResponse($created, 201);
    }

    if (preg_match('#^/admins/([^/]+)$#', $route, $matches)) {
        $adminId = $matches[1];

        if ($method === 'PUT') {
            $admin = Database::fetchOne("SELECT * FROM admins WHERE id = ?", [$adminId]);
            if (!$admin) jsonError('Administrator not found.', 404);

            $name        = cleanString($body['name'] ?? $admin['name']);
            $phone       = cleanPhone($body['phone'] ?? $admin['phone']);
            $role        = cleanString($body['role'] ?? $admin['role']);
            $department  = cleanString($body['department'] ?? $admin['department']);
            $avatar      = cleanString($body['avatar'] ?? $admin['avatar']);
            $status      = cleanString($body['status'] ?? $admin['status']);
            $permsJson   = isset($body['permissions']) ? json_encode($body['permissions']) : $admin['permissions'];

            Database::execute("
                UPDATE admins SET name = ?, phone = ?, role = ?, department = ?, avatar = ?, status = ?, permissions = ?, updatedAt = ?
                WHERE id = ?
            ", [$name, $phone, $role, $department, $avatar, $status, $permsJson, nowIso(), $adminId]);

            $updated = Database::fetchOne("SELECT * FROM admins WHERE id = ?", [$adminId]);
            unset($updated['passwordHash'], $updated['salt']);
            $updated['permissions'] = safeJsonDecode($updated['permissions'] ?? '[]', []);
            jsonResponse($updated);
        }

        if ($method === 'DELETE') {
            $admin = Database::fetchOne("SELECT * FROM admins WHERE id = ?", [$adminId]);
            $admEmail = strtolower($admin['email'] ?? '');
            if ($admin && ($admEmail === 'admin@podar.edu' || $admEmail === 'jatp22316@gmail.com' || $adminId === 'admin-jatp-main' || $adminId === 'admin-podar-root')) {
                jsonError('Main Administrator account cannot be deleted.', 403);
            }
            Database::execute("DELETE FROM admins WHERE id = ?", [$adminId]);
            jsonResponse(['success' => true, 'message' => 'Administrator account removed.']);
        }
    }

    // ----------------------------------------------------
    // 12. STUDENT PROJECTS PLATFORM
    // ----------------------------------------------------
    if ($route === '/projects' && $method === 'GET') {
        $category         = cleanString($_GET['category'] ?? '');
        $search           = cleanString($_GET['search'] ?? '');
        $sort             = cleanString($_GET['sort'] ?? 'trending');
        $currentStudentId = cleanString($_GET['currentStudentId'] ?? '');

        $sql = "SELECT * FROM project_posts WHERE status != 'hidden'";
        $params = [];

        if ($category && $category !== 'All') {
            $sql .= " AND category = ?";
            $params[] = $category;
        }

        if ($search) {
            $sql .= " AND (title LIKE ? OR description LIKE ? OR tags LIKE ?)";
            $term = "%{$search}%";
            $params[] = $term;
            $params[] = $term;
            $params[] = $term;
        }

        switch ($sort) {
            case 'recent':   $sql .= " ORDER BY createdAt DESC"; break;
            case 'top':      $sql .= " ORDER BY likesCount DESC, createdAt DESC"; break;
            case 'trending': default: $sql .= " ORDER BY (likesCount * 2 + commentsCount) DESC, createdAt DESC"; break;
        }

        $posts = Database::fetchAll($sql, $params);
        $enriched = array_map(fn($p) => $enrichPhpProject($p, $currentStudentId), $posts);

        jsonResponse(['success' => true, 'posts' => $enriched]);
    }

    if ($route === '/projects/categories' && $method === 'GET') {
        $categories = Database::fetchAll("SELECT * FROM project_categories ORDER BY orderIndex ASC, name ASC");
        jsonResponse(['success' => true, 'categories' => $categories]);
    }

    if ($route === '/projects/categories' && $method === 'POST') {
        $name = cleanString($body['name'] ?? '');
        $icon = cleanString($body['icon'] ?? 'Code');
        if (!$name) jsonError('Category name is required.');

        $catId = 'cat-' . time() . '-' . random_int(10, 99);
        Database::execute("INSERT INTO project_categories (id, name, icon, orderIndex, createdAt) VALUES (?, ?, ?, 99, ?)", [$catId, $name, $icon, nowIso()]);

        $categories = Database::fetchAll("SELECT * FROM project_categories ORDER BY orderIndex ASC, name ASC");
        jsonResponse(['success' => true, 'categories' => $categories], 201);
    }

    if (preg_match('#^/projects/categories/([^/]+)$#', $route, $matches) && $method === 'DELETE') {
        Database::execute("DELETE FROM project_categories WHERE id = ?", [$matches[1]]);
        jsonResponse(['success' => true, 'message' => 'Category deleted']);
    }

    if ($route === '/projects/notifications' && $method === 'GET') {
        $studentId = cleanString($_GET['studentId'] ?? '');
        $notifs = Database::fetchAll("SELECT * FROM project_notifications WHERE studentId = ? ORDER BY createdAt DESC LIMIT 30", [$studentId]);
        jsonResponse(['success' => true, 'notifications' => $notifs]);
    }

    if ($route === '/projects/notifications/read' && $method === 'PUT') {
        $studentId = cleanString($body['studentId'] ?? '');
        Database::execute("UPDATE project_notifications SET isRead = 1 WHERE studentId = ?", [$studentId]);
        jsonResponse(['success' => true]);
    }

    if ($route === '/projects/admin/reports' && $method === 'GET') {
        $reports = Database::fetchAll("
            SELECT r.*, p.title as postTitle, p.studentName as authorName, p.category as postCategory
            FROM project_reports r
            LEFT JOIN project_posts p ON r.postId = p.id
            ORDER BY r.createdAt DESC
        ");
        jsonResponse(['success' => true, 'reports' => $reports]);
    }

    // Dismiss Reported Project Flag
    if (preg_match('#^/projects/admin/reports/([^/]+)$#', $route, $matches) && $method === 'DELETE') {
        $reportId = $matches[1];
        Database::execute("DELETE FROM project_reports WHERE id = ?", [$reportId]);
        jsonResponse(['success' => true, 'message' => 'Report dismissed successfully.']);
    }

    if ($route === '/projects/admin/stats' && $method === 'GET') {
        $totalP   = (int)(Database::fetchOne("SELECT COUNT(*) as c FROM project_posts")['c'] ?? 0);
        $totalL   = (int)(Database::fetchOne("SELECT SUM(likesCount) as c FROM project_posts")['c'] ?? 0);
        $totalC   = (int)(Database::fetchOne("SELECT COUNT(*) as c FROM project_comments")['c'] ?? 0);
        $reported = (int)(Database::fetchOne("SELECT COUNT(*) as c FROM project_reports WHERE status = 'pending'")['c'] ?? 0);
        $creators = (int)(Database::fetchOne("SELECT COUNT(DISTINCT studentId) as c FROM project_posts")['c'] ?? 0);

        jsonResponse([
            'success' => true,
            'stats' => [
                'totalProjects' => $totalP,
                'totalLikes'    => $totalL,
                'totalComments' => $totalC,
                'reportedCount' => $reported,
                'creatorsCount' => $creators
            ]
        ]);
    }

    if (preg_match('#^/projects/comments/([^/]+)$#', $route, $matches) && $method === 'DELETE') {
        $commentId = $matches[1];
        $studentId = cleanString($_GET['studentId'] ?? $body['studentId'] ?? '');
        $isAdmin   = !empty($_GET['isAdmin']) || !empty($body['isAdmin']);

        $comment = Database::fetchOne("SELECT * FROM project_comments WHERE id = ?", [$commentId]);
        if (!$comment) jsonError('Comment not found.', 404);
        if (!$isAdmin && $comment['studentId'] !== $studentId) jsonError('Unauthorized.', 403);

        $childRow = Database::fetchOne("SELECT COUNT(*) as c FROM project_comments WHERE parentId = ?", [$commentId]);
        $childCount = (int)($childRow['c'] ?? 0);

        Database::execute("DELETE FROM project_comments WHERE parentId = ?", [$commentId]);
        Database::execute("DELETE FROM project_comments WHERE id = ?", [$commentId]);

        Database::execute(
            "UPDATE project_posts SET commentsCount = GREATEST(0, commentsCount - ?) WHERE id = ?",
            [1 + $childCount, $comment['postId']]
        );

        jsonResponse(['success' => true, 'message' => 'Comment deleted.']);
    }

    // Create New Project Post
    if ($route === '/projects' && $method === 'POST') {
        $studentId       = cleanString($body['studentId'] ?? '');
        $studentName     = cleanString($body['studentName'] ?? '');
        $studentAvatar   = cleanString($body['studentAvatar'] ?? '');
        $studentCourse   = cleanString($body['studentCourse'] ?? 'BCA');
        $studentSemester = cleanString($body['studentSemester'] ?? 'Semester V');
        $title           = cleanString($body['title'] ?? '');
        $description     = trim($body['description'] ?? '');
        $category        = cleanString($body['category'] ?? 'Web Development');
        $demoUrl         = cleanString($body['demoUrl'] ?? '');
        $githubUrl       = cleanString($body['githubUrl'] ?? '');
        $youtubeUrl      = cleanString($body['youtubeUrl'] ?? '');
        $tags            = $body['tags'] ?? [];
        $images          = $body['images'] ?? [];

        if (!$studentId || !$studentName) jsonError('Student authentication required.', 401);
        if (!$title) jsonError('Project title is required.');
        if (!$description) jsonError('Project description is required.');

        $postId = 'proj-' . time() . '-' . random_int(1000, 9999);
        $now = nowIso();
        $tagsJson = json_encode(is_array($tags) ? $tags : []);

        Database::execute("
            INSERT INTO project_posts (
                id, studentId, studentName, studentAvatar, studentCourse, studentSemester,
                title, description, category, demoUrl, githubUrl, youtubeUrl, tags,
                likesCount, commentsCount, status, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 'active', ?, ?)
        ", [$postId, $studentId, $studentName, $studentAvatar, $studentCourse, $studentSemester, $title, $description, $category, $demoUrl, $githubUrl, $youtubeUrl, $tagsJson, $now, $now]);

        if (is_array($images) && count($images) > 0) {
            foreach ($images as $idx => $img) {
                $imgUrl = is_string($img) ? $img : ($img['imageUrl'] ?? $img['dataUrl'] ?? '');
                $caption = is_array($img) ? ($img['caption'] ?? '') : '';
                if ($imgUrl) {
                    Database::execute(
                        "INSERT INTO project_images (id, postId, imageUrl, caption, orderIndex, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
                        ['pimg-' . time() . '-' . $idx, $postId, $imgUrl, $caption, $idx, $now]
                    );
                }
            }
        }

        Database::execute("UPDATE students SET projects = COALESCE(projects, 0) + 1 WHERE id = ?", [$studentId]);

        $created = $enrichPhpProject(Database::fetchOne("SELECT * FROM project_posts WHERE id = ?", [$postId]), $studentId);
        jsonResponse(['success' => true, 'post' => $created, 'message' => 'Project published!'], 201);
    }

    // Single Project Sub-routes
    if (preg_match('#^/projects/([^/]+)(?:/(like|bookmark|comments|report))?$#', $route, $matches)) {
        $postId = $matches[1];
        $action = $matches[2] ?? '';

        // Like / Unlike
        if ($action === 'like' && $method === 'POST') {
            $studentId     = cleanString($body['studentId'] ?? '');
            $studentName   = cleanString($body['studentName'] ?? 'Student');
            $studentAvatar = cleanString($body['studentAvatar'] ?? '');
            if (!$studentId) jsonError('Student ID is required.');

            $post = Database::fetchOne("SELECT id, studentId, title, likesCount FROM project_posts WHERE id = ?", [$postId]);
            if (!$post) jsonError('Project post not found.', 404);

            $existing = Database::fetchOne("SELECT id FROM project_likes WHERE postId = ? AND studentId = ?", [$postId, $studentId]);
            $isLiked = false;

            if ($existing) {
                Database::execute("DELETE FROM project_likes WHERE postId = ? AND studentId = ?", [$postId, $studentId]);
                Database::execute("UPDATE project_posts SET likesCount = GREATEST(0, likesCount - 1) WHERE id = ?", [$postId]);
                $isLiked = false;
            } else {
                $likeId = 'like-' . time() . '-' . random_int(100, 999);
                Database::execute("INSERT INTO project_likes (id, postId, studentId, createdAt) VALUES (?, ?, ?, ?)", [$likeId, $postId, $studentId, nowIso()]);
                Database::execute("UPDATE project_posts SET likesCount = likesCount + 1 WHERE id = ?", [$postId]);
                $isLiked = true;

                if ($post['studentId'] !== $studentId) {
                    Database::execute("
                        INSERT INTO project_notifications (id, studentId, actorId, actorName, actorAvatar, postId, type, message, isRead, createdAt)
                        VALUES (?, ?, ?, ?, ?, ?, 'like', ?, 0, ?)
                    ", ['pnotif-' . time(), $post['studentId'], $studentId, $studentName, $studentAvatar, $postId, "{$studentName} liked your project \"{$post['title']}\"", nowIso()]);
                }
            }

            $currentPost = Database::fetchOne("SELECT likesCount FROM project_posts WHERE id = ?", [$postId]);
            jsonResponse(['success' => true, 'isLiked' => $isLiked, 'likesCount' => (int)($currentPost['likesCount'] ?? 0)]);
        }

        // Bookmark / Unbookmark
        if ($action === 'bookmark' && $method === 'POST') {
            $studentId = cleanString($body['studentId'] ?? '');
            if (!$studentId) jsonError('Student ID is required.');

            $existing = Database::fetchOne("SELECT id FROM project_bookmarks WHERE postId = ? AND studentId = ?", [$postId, $studentId]);
            $isBookmarked = false;

            if ($existing) {
                Database::execute("DELETE FROM project_bookmarks WHERE postId = ? AND studentId = ?", [$postId, $studentId]);
                $isBookmarked = false;
            } else {
                Database::execute("INSERT INTO project_bookmarks (id, postId, studentId, createdAt) VALUES (?, ?, ?, ?)", ['bm-' . time(), $postId, $studentId, nowIso()]);
                $isBookmarked = true;
            }

            jsonResponse(['success' => true, 'isBookmarked' => $isBookmarked]);
        }

        // Comments
        if ($action === 'comments' && $method === 'GET') {
            $rawComments = Database::fetchAll("SELECT * FROM project_comments WHERE postId = ? ORDER BY createdAt ASC", [$postId]);
            $commentMap = [];
            $rootComments = [];

            foreach ($rawComments as $c) {
                $c['replies'] = [];
                $commentMap[$c['id']] = $c;
            }

            foreach ($rawComments as $c) {
                if (!empty($c['parentId']) && isset($commentMap[$c['parentId']])) {
                    $commentMap[$c['parentId']]['replies'][] = $commentMap[$c['id']];
                } else {
                    $rootComments[] = &$commentMap[$c['id']];
                }
            }

            jsonResponse(['success' => true, 'comments' => $rootComments]);
        }

        if ($action === 'comments' && $method === 'POST') {
            $studentId     = cleanString($body['studentId'] ?? '');
            $studentName   = cleanString($body['studentName'] ?? '');
            $studentAvatar = cleanString($body['studentAvatar'] ?? '');
            $content       = trim($body['content'] ?? '');
            $parentId      = !empty($body['parentId']) ? cleanString($body['parentId']) : null;

            if (!$studentId || !$studentName) jsonError('Student authentication required.', 401);
            if (!$content) jsonError('Comment cannot be empty.');

            $post = Database::fetchOne("SELECT id, studentId, title FROM project_posts WHERE id = ?", [$postId]);
            if (!$post) jsonError('Project post not found.', 404);

            $commentId = 'com-' . time() . '-' . random_int(100, 999);
            $now = nowIso();

            Database::execute("
                INSERT INTO project_comments (id, postId, parentId, studentId, studentName, studentAvatar, content, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ", [$commentId, $postId, $parentId, $studentId, $studentName, $studentAvatar, $content, $now, $now]);

            Database::execute("UPDATE project_posts SET commentsCount = commentsCount + 1 WHERE id = ?", [$postId]);

            $recipientId = $post['studentId'];
            $notifType = 'comment';
            $notifMsg = "{$studentName} commented on your project \"{$post['title']}\"";

            if ($parentId) {
                $parentCom = Database::fetchOne("SELECT studentId FROM project_comments WHERE id = ?", [$parentId]);
                if ($parentCom && $parentCom['studentId'] !== $studentId) {
                    $recipientId = $parentCom['studentId'];
                    $notifType = 'reply';
                    $notifMsg = "{$studentName} replied to your comment on \"{$post['title']}\"";
                }
            }

            if ($recipientId && $recipientId !== $studentId) {
                Database::execute("
                    INSERT INTO project_notifications (id, studentId, actorId, actorName, actorAvatar, postId, type, message, isRead, createdAt)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
                ", ['pnotif-' . time(), $recipientId, $studentId, $studentName, $studentAvatar, $postId, $notifType, $notifMsg, $now]);
            }

            $createdComment = Database::fetchOne("SELECT * FROM project_comments WHERE id = ?", [$commentId]);
            $createdComment['replies'] = [];
            jsonResponse(['success' => true, 'comment' => $createdComment, 'message' => 'Comment posted!'], 201);
        }

        // Report
        if ($action === 'report' && $method === 'POST') {
            $reporterId   = cleanString($body['reporterId'] ?? '');
            $reporterName = cleanString($body['reporterName'] ?? 'Student');
            $reason       = cleanString($body['reason'] ?? 'Inappropriate Content');
            $details      = trim($body['details'] ?? '');
            if (!$reporterId) jsonError('Reporter ID required.');

            $reportId = 'rep-' . time() . '-' . random_int(100, 999);
            $now = nowIso();

            Database::execute("
                INSERT INTO project_reports (id, postId, reporterId, reporterName, reason, details, status, createdAt)
                VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
            ", [$reportId, $postId, $reporterId, $reporterName, $reason, $details, $now]);

            Database::execute("UPDATE project_posts SET status = 'reported' WHERE id = ?", [$postId]);
            jsonResponse(['success' => true, 'message' => 'Report submitted for review.']);
        }

        // GET Single Project
        if (!$action && $method === 'GET') {
            $currentStudentId = cleanString($_GET['currentStudentId'] ?? '');
            $post = Database::fetchOne("SELECT * FROM project_posts WHERE id = ?", [$postId]);
            if (!$post) jsonError('Project not found.', 404);

            $enriched = $enrichPhpProject($post, $currentStudentId);

            $rawComments = Database::fetchAll("SELECT * FROM project_comments WHERE postId = ? ORDER BY createdAt ASC", [$postId]);
            $commentMap = [];
            $rootComments = [];

            foreach ($rawComments as $c) {
                $c['replies'] = [];
                $commentMap[$c['id']] = $c;
            }

            foreach ($rawComments as $c) {
                if (!empty($c['parentId']) && isset($commentMap[$c['parentId']])) {
                    $commentMap[$c['parentId']]['replies'][] = $commentMap[$c['id']];
                } else {
                    $rootComments[] = &$commentMap[$c['id']];
                }
            }

            $enriched['comments'] = $rootComments;
            jsonResponse(['success' => true, 'post' => $enriched]);
        }

        // PUT Project
        if (!$action && $method === 'PUT') {
            $studentId = cleanString($body['studentId'] ?? '');
            $isAdmin   = !empty($body['isAdmin']);

            $existing = Database::fetchOne("SELECT * FROM project_posts WHERE id = ?", [$postId]);
            if (!$existing) jsonError('Project not found.', 404);
            if (!$isAdmin && $existing['studentId'] !== $studentId) jsonError('Unauthorized.', 403);

            $title       = cleanString($body['title'] ?? $existing['title']);
            $description = trim($body['description'] ?? $existing['description']);
            $category    = cleanString($body['category'] ?? $existing['category']);
            $demoUrl     = cleanString($body['demoUrl'] ?? $existing['demoUrl']);
            $githubUrl   = cleanString($body['githubUrl'] ?? $existing['githubUrl']);
            $youtubeUrl  = cleanString($body['youtubeUrl'] ?? $existing['youtubeUrl']);
            $tagsJson    = isset($body['tags']) ? json_encode($body['tags']) : $existing['tags'];
            $now = nowIso();

            Database::execute("
                UPDATE project_posts SET
                    title = ?, description = ?, category = ?, demoUrl = ?,
                    githubUrl = ?, youtubeUrl = ?, tags = ?, updatedAt = ?
                WHERE id = ?
            ", [$title, $description, $category, $demoUrl, $githubUrl, $youtubeUrl, $tagsJson, $now, $postId]);

            if (isset($body['images']) && is_array($body['images'])) {
                Database::execute("DELETE FROM project_images WHERE postId = ?", [$postId]);
                foreach ($body['images'] as $idx => $img) {
                    $imgUrl = is_string($img) ? $img : ($img['imageUrl'] ?? $img['dataUrl'] ?? '');
                    $caption = is_array($img) ? ($img['caption'] ?? '') : '';
                    if ($imgUrl) {
                        Database::execute(
                            "INSERT INTO project_images (id, postId, imageUrl, caption, orderIndex, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
                            ['pimg-' . time() . '-' . $idx, $postId, $imgUrl, $caption, $idx, $now]
                        );
                    }
                }
            }

            $updated = $enrichPhpProject(Database::fetchOne("SELECT * FROM project_posts WHERE id = ?", [$postId]), $studentId);
            jsonResponse(['success' => true, 'post' => $updated, 'message' => 'Project updated.']);
        }

        // DELETE Project
        if (!$action && $method === 'DELETE') {
            $studentId = cleanString($_GET['studentId'] ?? $body['studentId'] ?? '');
            $isAdmin   = !empty($_GET['isAdmin']) || !empty($body['isAdmin']);

            $existing = Database::fetchOne("SELECT * FROM project_posts WHERE id = ?", [$postId]);
            if (!$existing) jsonError('Project not found.', 404);
            if (!$isAdmin && $existing['studentId'] !== $studentId) jsonError('Unauthorized.', 403);

            Database::execute("DELETE FROM project_images WHERE postId = ?", [$postId]);
            Database::execute("DELETE FROM project_likes WHERE postId = ?", [$postId]);
            Database::execute("DELETE FROM project_comments WHERE postId = ?", [$postId]);
            Database::execute("DELETE FROM project_bookmarks WHERE postId = ?", [$postId]);
            Database::execute("DELETE FROM project_reports WHERE postId = ?", [$postId]);
            Database::execute("DELETE FROM project_notifications WHERE postId = ?", [$postId]);
            Database::execute("DELETE FROM project_posts WHERE id = ?", [$postId]);

            Database::execute("UPDATE students SET projects = GREATEST(0, COALESCE(projects, 1) - 1) WHERE id = ?", [$existing['studentId']]);

            jsonResponse(['success' => true, 'message' => 'Project deleted successfully.']);
        }
    }

    // Default 404
    jsonError("API endpoint not found: {$method} {$route}", 404);

} catch (\Throwable $e) {
    error_log("[API EXCEPTION] " . $e->getMessage() . "\n" . $e->getTraceAsString());
    jsonError("Internal server error. Please try again later.", 500);
}
