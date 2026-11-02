<?php
if (!defined('PODAR_APP')) { http_response_code(403); exit; }

function startAuthSession(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    session_name('podar_session');
    session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off', 'httponly' => true, 'samesite' => 'Lax']);
    if (!session_start()) throw new RuntimeException('Unable to start session.');
    header('Cache-Control: no-store');
}

function establishSession(array $session): void {
    startAuthSession();
    session_regenerate_id(true);
    $table = $session['role'] === 'admin' ? 'admins' : 'students';
    $account = Database::fetchOne("SELECT passwordHash FROM {$table} WHERE id = ?", [$session['id']]);
    $_SESSION = ['auth' => $session, 'expiresAt' => time() + 28800, 'credential' => hash('sha256', $account['passwordHash'] ?? '')];
}

function authenticatedSession(): array {
    startAuthSession();
    $auth = $_SESSION['auth'] ?? null;
    if (!$auth || ($_SESSION['expiresAt'] ?? 0) < time()) jsonError('Please sign in to continue.', 401);
    $table = ($auth['role'] ?? '') === 'admin' ? 'admins' : 'students';
    $account = Database::fetchOne("SELECT * FROM {$table} WHERE id = ?", [$auth['id']]);
    if (!$account || ($account['status'] ?? '') === 'suspended' || !hash_equals($_SESSION['credential'] ?? '', hash('sha256', $account['passwordHash'] ?? ''))) {
        $_SESSION = [];
        jsonError('Your session is no longer valid. Please sign in again.', 401);
    }
    unset($account['passwordHash'], $account['salt']);
    if ($auth['role'] === 'admin') $account['permissions'] = safeJsonDecode($account['permissions'] ?? '[]');
    $auth[$auth['role']] = $account;
    return $auth;
}

// Deny by default; student access is explicitly scoped to their own records.
function authorizeRoute(string $route, string $method, array &$body): ?array {
    if (str_starts_with($route, '/auth/') || ($method === 'GET' && in_array($route, ['/health', '/settings'], true)) || ($method === 'POST' && preg_match('#^/(programs|courses)/[^/]+/click$#', $route))) return null;
    $auth = authenticatedSession();
    $isAdmin = $auth['role'] === 'admin';
    $body['isAdmin'] = $isAdmin;
    $_GET['isAdmin'] = $isAdmin;
    if ($isAdmin) return $auth;
    $id = $auth['id'];
    foreach (['studentId', 'currentStudentId', 'reporterId'] as $key) {
        if ((isset($body[$key]) && $body[$key] !== $id) || (isset($_GET[$key]) && $_GET[$key] !== $id)) jsonError('You can only access your own student records.', 403);
    }
    $body['studentId'] = $_GET['studentId'] = $_GET['currentStudentId'] = $body['reporterId'] = $id;
    foreach (['name', 'phone', 'avatar', 'course', 'semester'] as $field) $body['student' . ucfirst($field)] = $auth['student'][$field] ?? '';
    $body['reporterName'] = $auth['student']['name'];
    $allowed = false;
    if ($route === '/students' && $method === 'GET') $allowed = true;
    if ($method === 'GET' && preg_match('#^/students/[^/]+/public-certificates$#', $route)) $allowed = true;
    if (preg_match('#^/students/([^/]+)(?:/(change-password|certificates|test-submissions))?$#', $route, $m)) {
        $allowed = $m[1] === $id && in_array($method, ['GET', 'PUT', 'POST'], true);
        foreach (['score', 'completion', 'applications', 'projects', 'certificates', 'status', 'isRegistered', 'addedByAdmin'] as $field) unset($body[$field]);
    }
    if ($method === 'GET' && preg_match('#^/(programs|courses|tests|schedules)(/[^/]+)?$#', $route)) $allowed = true;
    if ($method === 'POST' && preg_match('#^/(programs|courses)/[^/]+/click$#', $route)) $allowed = true;
    if ($method === 'POST' && preg_match('#^/tests/[^/]+/submit$#', $route)) $allowed = true;
    if ($route === '/test-submissions' && $method === 'GET') $allowed = true;
    if (preg_match('#^/test-submissions/([^/]+)$#', $route, $m) && $method === 'GET') {
        $record = Database::fetchOne('SELECT studentId FROM test_submissions WHERE id = ?', [$m[1]]);
        $allowed = $record && $record['studentId'] === $id;
    }
    if ($route === '/attendance/student/' . $id && $method === 'GET') $allowed = true;
    if (($route === '/certificates' && in_array($method, ['GET', 'POST'], true)) || ($route === '/students/' . $id . '/certificates' && $method === 'GET')) {
        // Legacy certificates identify owners by name. Refuse ambiguous ownership.
        $count = Database::fetchOne('SELECT COUNT(*) AS total FROM students WHERE name = ?', [$auth['student']['name']]);
        if ((int)$count['total'] !== 1) jsonError('Certificate ownership needs administrator review because this name is shared.', 409);
        $allowed = true;
        $body['status'] = 'pending';
        unset($body['verifiedBy']);
    }
    if (str_starts_with($route, '/notifications')) {
        $allowed = true;
        if (preg_match('#^/notifications/([^/]+)(?:/read)?$#', $route, $m) && !in_array($m[1], ['read-all', 'clear'], true)) {
            $record = Database::fetchOne('SELECT studentId FROM notifications WHERE id = ?', [$m[1]]);
            $allowed = $record && $record['studentId'] === $id;
        }
    }
    if ($route === '/projects' || str_starts_with($route, '/projects/')) {
        $allowed = !str_starts_with($route, '/projects/admin/') && (!str_starts_with($route, '/projects/categories') || $method === 'GET');
    }
    if (!$allowed) jsonError('Administrator access is required.', 403);
    return $auth;
}
