<?php
// Local development server: php -S 127.0.0.1:5000 router.php
$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');
header('X-Content-Type-Options: nosniff');
if (preg_match('~(?:^|/)[.]|[\\\\\x00-\x1f]~', $path)) {
    http_response_code(404);
    exit;
}
// Select exactly one public web root. Never expose the repository itself.
$webRoot = is_file(__DIR__ . '/dist/index.html') ? __DIR__ . '/dist' :
    (is_dir(__DIR__ . '/public') ? __DIR__ . '/public' : __DIR__);
if ($path === '/api' || str_starts_with($path, '/api/')) {
    $apiRoot = is_file(__DIR__ . '/public/api/index.php') ? __DIR__ . '/public/api' : __DIR__ . '/api';
    require $apiRoot . '/router.php';
    exit;
}
$mimes = [
    'js' => 'application/javascript', 'mjs' => 'application/javascript',
    'css' => 'text/css', 'html' => 'text/html', 'json' => 'application/json',
    'svg' => 'image/svg+xml', 'png' => 'image/png', 'jpg' => 'image/jpeg',
    'jpeg' => 'image/jpeg', 'gif' => 'image/gif', 'webp' => 'image/webp',
    'ico' => 'image/x-icon', 'woff' => 'font/woff', 'woff2' => 'font/woff2',
    'ttf' => 'font/ttf', 'txt' => 'text/plain', 'xml' => 'application/xml',
    'pdf' => 'application/pdf'
];
$root = realpath($webRoot);
$candidate = realpath($webRoot . '/' . ltrim($path, '/'));
$ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
if ($candidate && str_starts_with($candidate, $root . DIRECTORY_SEPARATOR) && is_file($candidate) && isset($mimes[$ext])) {
    header('Content-Type: ' . $mimes[$ext]);
    readfile($candidate);
    exit;
}
if ($ext !== '' || preg_match('~^/(?:src|public|dist|node_modules|scripts|adapters)(?:/|$)~i', $path)) {
    http_response_code(404);
    exit;
}
if (is_file($webRoot . '/index.html')) {
    header('Content-Type: text/html; charset=utf-8');
    readfile($webRoot . '/index.html');
    exit;
}
http_response_code(503);
echo 'Frontend not built. Run npm run build, or use npm run client:dev.';
