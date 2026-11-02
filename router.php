<?php
// Local development & production router: php -S 127.0.0.1:5000 router.php
$rawUri = $_SERVER['REQUEST_URI'] ?? '/';
$path = rawurldecode(parse_url($rawUri, PHP_URL_PATH) ?: '/');

header('X-Content-Type-Options: nosniff');

// Block dotfiles or control characters
if (preg_match('~(?:^|/)[.]|[\\\\\x00-\x1f]~', $path)) {
    header('Content-Type: text/plain; charset=utf-8');
    http_response_code(404);
    echo "404 Not Found";
    exit;
}

// 1. API Routing: Handle /api and /api/* immediately
if ($path === '/api' || str_starts_with($path, '/api/')) {
    $apiRoot = is_file(__DIR__ . '/public/api/index.php') ? __DIR__ . '/public/api' :
        (is_file(__DIR__ . '/api/index.php') ? __DIR__ . '/api' : null);
    if ($apiRoot && is_file($apiRoot . '/router.php')) {
        require $apiRoot . '/router.php';
        exit;
    }
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'error' => 'API router not found']);
    exit;
}

// 2. MIME Types table with comprehensive JavaScript & module support
$mimes = [
    'js'   => 'application/javascript; charset=utf-8',
    'mjs'  => 'application/javascript; charset=utf-8',
    'jsx'  => 'application/javascript; charset=utf-8',
    'ts'   => 'application/javascript; charset=utf-8',
    'tsx'  => 'application/javascript; charset=utf-8',
    'css'  => 'text/css; charset=utf-8',
    'html' => 'text/html; charset=utf-8',
    'json' => 'application/json; charset=utf-8',
    'svg'  => 'image/svg+xml',
    'png'  => 'image/png',
    'jpg'  => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'gif'  => 'image/gif',
    'webp' => 'image/webp',
    'ico'  => 'image/x-icon',
    'woff' => 'font/woff',
    'woff2'=> 'font/woff2',
    'ttf'  => 'font/ttf',
    'txt'  => 'text/plain; charset=utf-8',
    'xml'  => 'application/xml; charset=utf-8',
    'pdf'  => 'application/pdf',
    'mp4'  => 'video/mp4',
    'webm' => 'video/webm'
];

$ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));

// 3. Resolve the public web root (STRICTLY dist or public, NEVER repository root __DIR__)
$distRoot = __DIR__ . '/dist';
$publicRoot = __DIR__ . '/public';

if (is_file($distRoot . '/index.html')) {
    $webRoot = $distRoot;
} elseif (is_file(__DIR__ . '/index.html') && !is_dir(__DIR__ . '/src')) {
    // router.php running directly from within the dist directory
    $webRoot = __DIR__;
} elseif (is_file($publicRoot . '/index.html')) {
    $webRoot = $publicRoot;
} else {
    $webRoot = null;
}

// 4. Vite Dev Server Interceptor:
// If Vite dev-server assets or uncompiled JSX entrypoints are requested on port 5000:
$isViteAsset = (
    $path === '/src/main.jsx' ||
    str_starts_with($path, '/src/') ||
    str_starts_with($path, '/@vite/') ||
    str_starts_with($path, '/@react-refresh') ||
    str_starts_with($path, '/@fs/') ||
    str_starts_with($path, '/node_modules/.vite/')
);

if ($isViteAsset) {
    // Check if Vite is running on port 5173
    $viteActive = false;
    $sock = @fsockopen('127.0.0.1', 5173, $errno, $errstr, 0.15);
    if ($sock) {
        fclose($sock);
        $viteActive = true;
    }

    if ($viteActive) {
        header('Location: http://127.0.0.1:5173' . $rawUri);
        exit;
    }

    // Vite is not running on 5173:
    // A browser loaded an uncompiled template (e.g. root index.html) or has stale browser cache.
    // Return valid JavaScript so browser module loader never fails with MIME type error.
    header('Content-Type: application/javascript; charset=utf-8');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    http_response_code(200);

    if ($path === '/src/main.jsx') {
        echo "// Podar Pathways: Automatic reload to compiled production assets\n";
        echo "console.warn('[Podar Pathways] Stale dev module requested. Reloading with compiled app...');\n";
        echo "if (!sessionStorage.getItem('pp_reloaded_from_dev')) {\n";
        echo "    sessionStorage.setItem('pp_reloaded_from_dev', '1');\n";
        echo "    window.location.replace('/');\n";
        echo "} else {\n";
        echo "    sessionStorage.removeItem('pp_reloaded_from_dev');\n";
        echo "}\n";
        exit;
    }

    echo "export default {};\n";
    exit;
}

// 5. If static file exists in $webRoot, serve it
if ($webRoot) {
    $root = realpath($webRoot);
    $candidate = realpath($webRoot . '/' . ltrim($path, '/'));

    if ($candidate && str_starts_with($candidate, $root . DIRECTORY_SEPARATOR) && is_file($candidate)) {
        $mime = $mimes[$ext] ?? 'application/octet-stream';
        header('Content-Type: ' . $mime);

        // Streaming for video assets
        if (in_array($ext, ['mp4', 'webm'], true)) {
            $size = filesize($candidate);
            $start = 0; $end = $size - 1;
            header('Accept-Ranges: bytes');
            if (!empty($_SERVER['HTTP_RANGE'])) {
                if (!preg_match('/^bytes=(\d*)-(\d*)$/', $_SERVER['HTTP_RANGE'], $range) || ($range[1] === '' && $range[2] === '')) {
                    http_response_code(416);
                    header("Content-Range: bytes */{$size}");
                    exit;
                }
                if ($range[1] === '') {
                    $start = max(0, $size - (int)$range[2]);
                } else {
                    $start = (int)$range[1];
                    if ($range[2] !== '') $end = min($end, (int)$range[2]);
                }
                if ($start > $end || $start >= $size) {
                    http_response_code(416);
                    header("Content-Range: bytes */{$size}");
                    exit;
                }
                http_response_code(206);
                header("Content-Range: bytes {$start}-{$end}/{$size}");
            }
            $length = $end - $start + 1;
            header('Content-Length: ' . $length);
            if (($_SERVER['METHOD'] ?? $_SERVER['REQUEST_METHOD'] ?? '') === 'HEAD') exit;
            $stream = fopen($candidate, 'rb');
            fseek($stream, $start);
            while ($length > 0 && !feof($stream)) {
                $chunk = fread($stream, min(65536, $length));
                if ($chunk === false || $chunk === '') break;
                echo $chunk;
                $length -= strlen($chunk);
            }
            fclose($stream);
            exit;
        }

        // Cache policy
        if (str_starts_with($path, '/assets/')) {
            header('Cache-Control: public, max-age=31536000, immutable');
        } else {
            header('Cache-Control: public, max-age=3600');
        }

        readfile($candidate);
        exit;
    }
}

// 6. Block internal source directories or missing static files with extensions from falling back to index.html
if ($ext !== '' || preg_match('~^/(?:src|public|dist|node_modules|scripts|adapters)(?:/|$)~i', $path)) {
    $errorMime = $mimes[$ext] ?? 'text/plain; charset=utf-8';
    header('Content-Type: ' . $errorMime);
    header('Cache-Control: no-cache, no-store, must-revalidate');
    http_response_code(404);
    echo "404 Not Found";
    exit;
}

// 7. SPA Fallback: Serve compiled index.html for all app routes (/courses, /admin, etc.)
if ($webRoot && is_file($webRoot . '/index.html')) {
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
    readfile($webRoot . '/index.html');
    exit;
}

// 8. If index.html is missing, display informative 503 page (never expose workspace source)
header('Content-Type: text/html; charset=utf-8');
http_response_code(503);
echo '<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>Podar Pathways - Build Required</title><style>body{font-family:system-ui,-apple-system,sans-serif;background:#0f172a;color:#f8fafc;padding:40px;text-align:center;}code{background:#1e293b;padding:4px 8px;border-radius:4px;color:#38bdf8;}h1{color:#38bdf8;margin-bottom:12px;}p{font-size:16px;line-height:1.6;color:#cbd5e1;}</style></head><body><h1>Podar Pathways</h1><p>Frontend production assets are not built yet.</p><p>Please run <code>npm run build</code>, or start the live development client with <code>npm run client:dev</code>.</p></body></html>';
exit;
