<?php
/**
 * Podar Pathways - cPanel Production Configuration
 * Target: cPanel Ultimate Hosting with PHP & MySQL (phpMyAdmin)
 */

// Prevent direct script access outside API
if (!defined('PODAR_APP')) {
    define('PODAR_APP', true);
}

// ----------------------------------------------------
// AUTOMATIC .ENV CONFIGURATION LOADER & HELPER
// ----------------------------------------------------
if (!function_exists('getEnvVar')) {
    function getEnvVar(string $key, ?string $default = null): ?string {
        if (isset($_ENV[$key]) && $_ENV[$key] !== '') {
            return (string)$_ENV[$key];
        }
        if (isset($_SERVER[$key]) && $_SERVER[$key] !== '') {
            return (string)$_SERVER[$key];
        }
        $val = @getenv($key);
        if ($val !== false && $val !== '') {
            return (string)$val;
        }
        if (array_key_exists($key, $_ENV)) {
            return (string)$_ENV[$key];
        }
        if (array_key_exists($key, $_SERVER)) {
            return (string)$_SERVER[$key];
        }
        return $default;
    }
}

(function() {
    $candidates = [
        dirname(__DIR__, 2) . '/.env', // 1 level above public_html (secure cPanel home)
        dirname(__DIR__) . '/.env',    // public_html root
        __DIR__ . '/.env'              // public_html/api/.env
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
                    } elseif (($commentPos = strpos($v, ' #')) !== false) {
                        $v = trim(substr($v, 0, $commentPos));
                    }
                    
                    $_ENV[$k] = $v;
                    $_SERVER[$k] = $v;
                    if (function_exists('putenv')) {
                        @putenv("$k=$v");
                    }
                }
            }
            break;
        }
    }
})();

// ----------------------------------------------------
// 1. DATABASE CONFIGURATION (MySQL / phpMyAdmin)
// ----------------------------------------------------
// Driver: Strictly 'mysql' for phpMyAdmin database
define('DB_DRIVER', 'mysql');

// MySQL Credentials (cPanel phpMyAdmin):
define('DB_HOST', getEnvVar('DB_HOST', 'localhost'));
define('DB_PORT', getEnvVar('DB_PORT', '3306'));
define('DB_NAME', getEnvVar('DB_NAME', 'podar_pathways'));
define('DB_USER', getEnvVar('DB_USER', 'root'));
define('DB_PASS', getEnvVar('DB_PASS', ''));
define('DB_CHARSET', 'utf8mb4');
define('DB_CERTIFICATES_NAME', getEnvVar('DB_CERTIFICATES_NAME', DB_NAME));
define('DB_PROJECTS_NAME', getEnvVar('DB_PROJECTS_NAME', DB_NAME));

// Administrative secret key for phone changes:
define('ADMIN_KEY', getEnvVar('ADMIN_KEY', 'drHPSingh'));

// ----------------------------------------------------
// 2. EMAIL OTP CONFIGURATION (noreply@podarpathways.com)
// ----------------------------------------------------
define('MAIL_FROM_EMAIL', getEnvVar('EMAIL_FROM', getEnvVar('SMTP_USER', 'noreply@podarpathways.com')));
define('MAIL_FROM_NAME', getEnvVar('MAIL_FROM_NAME', 'Podar Pathways'));
define('MAIL_REPLY_TO', getEnvVar('MAIL_REPLY_TO', 'noreply@podarpathways.com'));

// SMTP settings loaded directly from .env:
$smtpPass = getEnvVar('SMTP_PASS', '');
$useSmtpEnv = getEnvVar('USE_SMTP', null);
define('USE_SMTP', $useSmtpEnv !== null ? filter_var($useSmtpEnv, FILTER_VALIDATE_BOOLEAN) : (!empty($smtpPass)));
define('SMTP_HOST', getEnvVar('SMTP_HOST', 'mail.podarpathways.com'));
define('SMTP_PORT', (int)(getEnvVar('SMTP_PORT', '465')));
define('SMTP_SECURE', getEnvVar('SMTP_SECURE', 'ssl'));
define('SMTP_USER', getEnvVar('SMTP_USER', 'noreply@podarpathways.com'));
define('SMTP_PASS', $smtpPass);

// ----------------------------------------------------
// 3. SECURITY & SESSION SETTINGS
// ----------------------------------------------------
define('OTP_EXPIRY_MINUTES', 10);              // OTP expires in 10 minutes
define('OTP_MAX_ATTEMPTS', 5);                 // Max verification attempts before invalidation
define('RATE_LIMIT_SECONDS', 30);              // Min seconds between resending OTP to same email
define('APP_ENV', getEnvVar('APP_ENV', 'production'));

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
