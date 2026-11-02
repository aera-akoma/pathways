<?php
// API requests never fall through to PHP's static file server.
$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');
if (preg_match('~(?:^|/)[.]|[\\\\\x00-\x1f]|/logs(?:/|$)|[.](?:php|log|sql|ini|bak|json)$~i', $path)) {
    http_response_code(404);
    header('Content-Type: application/json; charset=utf-8');
    echo '{"success":false,"error":"Not found."}';
    exit;
}
require __DIR__ . '/index.php';
