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
// 1. DATABASE CONFIGURATION (MySQL & SQLite)
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

// SQLite database paths:
define('SQLITE_FILE', __DIR__ . '/data/podar_pathways.db');
define('SQLITE_LOCAL', __DIR__ . '/data/podar_pathways.db');
define('SQLITE_CERTIFICATES_FILE', __DIR__ . '/data/certificates.db');
define('SQLITE_PROJECTS_FILE', __DIR__ . '/data/projects.db');

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
