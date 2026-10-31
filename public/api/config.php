<?php
/**
 * Podar Pathways - cPanel Production Configuration
 * Target: cPanel Ultimate Hosting with PHP & MySQL / SQLite
 */

// Prevent direct script access outside API
if (!defined('PODAR_APP')) {
    define('PODAR_APP', true);
}

// ----------------------------------------------------
// AUTOMATIC .ENV CONFIGURATION LOADER
// ----------------------------------------------------
(function() {
    $candidates = [
        dirname(__DIR__, 2) . '/.env',
        dirname(__DIR__) . '/.env',
        __DIR__ . '/.env'
    ];
    foreach ($candidates as $file) {
        if (file_exists($file) && is_readable($file)) {
            $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                $line = trim($line);
                if ($line === '' || str_starts_with($line, '#')) continue;
                if (strpos($line, '=') !== false) {
                    list($k, $v) = explode('=', $line, 2);
                    $k = trim($k);
                    $v = trim($v);
                    if ((str_starts_with($v, '"') && str_ends_with($v, '"')) ||
                        (str_starts_with($v, "'") && str_ends_with($v, "'"))) {
                        $v = substr($v, 1, -1);
                    }
                    if (getenv($k) === false) {
                        putenv("$k=$v");
                        $_ENV[$k] = $v;
                        $_SERVER[$k] = $v;
                    }
                }
            }
            break;
        }
    }
})();

// ----------------------------------------------------
// 1. DATABASE CONFIGURATION (MySQL & SQLite - 3 SEPARATE DATABASES)
// ----------------------------------------------------
// Driver: 'mysql' (standard for cPanel production) or 'sqlite' (instant local zero-config)
$autoDriver = getenv('DB_DRIVER');
if (!$autoDriver) {
    if (DIRECTORY_SEPARATOR === '\\' || (file_exists(__DIR__ . '/data/podar_pathways.db') && !file_exists('/home'))) {
        $autoDriver = 'sqlite';
    } else {
        $autoDriver = 'mysql';
    }
}
define('DB_DRIVER', $autoDriver);

// MySQL Credentials (cPanel phpMyAdmin):
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'podar_pathways');
define('DB_USER', getenv('DB_USER') ?: 'podar_user');
define('DB_PASS', getenv('DB_PASS') ?: 'Podar@StrongPassword2026!');
define('DB_CHARSET', 'utf8mb4');
define('DB_CERTIFICATES_NAME', getenv('DB_CERTIFICATES_NAME') ?: DB_NAME);
define('DB_PROJECTS_NAME', getenv('DB_PROJECTS_NAME') ?: DB_NAME);

// Helper to resolve SQLite path from env or defaults
$resolveSqliteDb = function($envKey, $fallbackFile) {
    $custom = getenv($envKey);
    if ($custom) {
        $custom = trim($custom);
        if (preg_match('#^([a-zA-Z]:|/)#', $custom)) {
            return $custom;
        }
        $root = dirname(__DIR__, 2);
        $candidate = $root . '/' . ltrim($custom, './\\');
        if (file_exists($candidate) || file_exists(dirname($candidate))) {
            return $candidate;
        }
        return $custom;
    }
    return __DIR__ . '/data/' . $fallbackFile;
};

// SQLite 3-Database Separation Paths:
// 1. Core / Main Database (Students, Admins, Courses, OTPs, Settings)
define('SQLITE_FILE', $resolveSqliteDb('DB_MAIN_PATH', 'podar_pathways.db'));
define('SQLITE_LOCAL', SQLITE_FILE);

// 2. Certificates Database (Student Credentials, Badges & Verifications)
define('SQLITE_CERTIFICATES_FILE', $resolveSqliteDb('DB_CERTIFICATES_PATH', 'certificates.db'));

// 3. Projects Database (Student Posts, Images, Comments, Likes, Bookmarks)
define('SQLITE_PROJECTS_FILE', $resolveSqliteDb('DB_PROJECTS_PATH', 'projects.db'));

// Administrative secret key for phone changes:
define('ADMIN_KEY', 'PodarAdmin@2026!');

// ----------------------------------------------------
// 2. EMAIL OTP CONFIGURATION (noreply@podarpathways.com)
// ----------------------------------------------------
define('MAIL_FROM_EMAIL', 'noreply@podarpathways.com');
define('MAIL_FROM_NAME', 'Podar Pathways');
define('MAIL_REPLY_TO', 'noreply@podarpathways.com');

// Set to true if you prefer authenticated SMTP instead of native PHP mail()
define('USE_SMTP', false);
define('SMTP_HOST', 'localhost');
define('SMTP_PORT', 465);
define('SMTP_SECURE', 'ssl');
define('SMTP_USER', 'noreply@podarpathways.com');
define('SMTP_PASS', '');

// ----------------------------------------------------
// 3. SECURITY & SESSION SETTINGS
// ----------------------------------------------------
define('OTP_EXPIRY_MINUTES', 10);              // OTP expires in 10 minutes
define('OTP_MAX_ATTEMPTS', 5);                 // Max verification attempts before invalidation
define('RATE_LIMIT_SECONDS', 30);              // Min seconds between resending OTP to same email
define('APP_ENV', getenv('APP_ENV') ?: 'production');

// Log file for OTP audit & emergency debugging
define('OTP_LOG_FILE', __DIR__ . '/logs/otp_audit.log');

// ----------------------------------------------------
// 4. CORS & HTTP HEADERS
// ----------------------------------------------------
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Set default Content-Type for all API responses
header('Content-Type: application/json; charset=UTF-8');

// Disable error display in production
if (APP_ENV === 'production') {
    ini_set('display_errors', '0');
    error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
} else {
    ini_set('display_errors', '1');
    error_reporting(E_ALL);
}

// ----------------------------------------------------
// 5. COMMON JSON HELPER FUNCTIONS
// ----------------------------------------------------

/**
 * Return JSON response and terminate script
 */
function jsonResponse($data, int $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Return JSON error response and terminate script
 */
function jsonError(string $message, int $statusCode = 400, array $extra = []) {
    http_response_code($statusCode);
    echo json_encode(array_merge(['error' => $message, 'success' => false], $extra), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Get and parse JSON payload from request body
 */
function getJsonInput(): array {
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        return $_POST;
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

/**
 * Sanitize string input
 */
function cleanString($value): string {
    return trim(filter_var($value ?? '', FILTER_DEFAULT));
}

/**
 * Validate and clean email
 */
function cleanEmail($value): string {
    $email = strtolower(trim((string)($value ?? '')));
    return filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : '';
}

/**
 * Clean phone number to 10 digits
 */
function cleanPhone($value): string {
    $clean = preg_replace('/\D/', '', (string)($value ?? ''));
    if (strlen($clean) === 12 && str_starts_with($clean, '91')) {
        $clean = substr($clean, 2);
    }
    return $clean;
}
