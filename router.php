<?php
/**
 * Podar Pathways - Unified PHP Application Server
 * Serves both the compiled React Frontend (SPA) and PHP REST API (Backend)
 * Usage: php -S 0.0.0.0:5000 router.php
 */

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// 1. API Routing -> route all /api/* requests to PHP API
if (strpos($uri, '/api') === 0) {
    if (file_exists(__DIR__ . '/public/api/index.php')) {
        require __DIR__ . '/public/api/index.php';
        exit;
    } elseif (file_exists(__DIR__ . '/api/index.php')) {
        require __DIR__ . '/api/index.php';
        exit;
    }
}

// 2. Direct Static Files (check dist, public, root)
$searchDirs = [
    __DIR__ . '/dist',
    __DIR__ . '/public',
    __DIR__
];

$cleanPath = ltrim($uri, '/');
if (!empty($cleanPath)) {
    foreach ($searchDirs as $dir) {
        $candidate = $dir . '/' . $cleanPath;
        if (file_exists($candidate) && is_file($candidate)) {
            $ext = strtolower(pathinfo($candidate, PATHINFO_EXTENSION));
            $mimes = [
                'js'    => 'application/javascript; charset=utf-8',
                'mjs'   => 'application/javascript; charset=utf-8',
                'css'   => 'text/css; charset=utf-8',
                'html'  => 'text/html; charset=utf-8',
                'json'  => 'application/json; charset=utf-8',
                'svg'   => 'image/svg+xml',
                'png'   => 'image/png',
                'jpg'   => 'image/jpeg',
                'jpeg'  => 'image/jpeg',
                'webp'  => 'image/webp',
                'ico'   => 'image/x-icon',
                'woff'  => 'font/woff',
                'woff2' => 'font/woff2',
                'ttf'   => 'font/ttf'
            ];
            if (isset($mimes[$ext])) {
                header("Content-Type: {$mimes[$ext]}");
            }
            readfile($candidate);
            exit;
        }
    }
}

// 3. Single-Page Application Fallback -> Serve dist/index.html
$indexCandidates = [
    __DIR__ . '/dist/index.html',
    __DIR__ . '/public/index.html',
    __DIR__ . '/index.html'
];

foreach ($indexCandidates as $indexFile) {
    if (file_exists($indexFile) && is_file($indexFile)) {
        header('Content-Type: text/html; charset=utf-8');
        readfile($indexFile);
        exit;
    }
}

// 4. 404 Fallback
http_response_code(404);
echo "404 Not Found";
