<?php
/**
 * Podar Pathways - PHP Built-in Web Server Router
 * Usage: php -S localhost:5000 public/api/router.php
 */

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Allow direct serving of static files if requested
$filePath = __DIR__ . '/../' . ltrim($uri, '/');
if (file_exists($filePath) && is_file($filePath)) {
    return false;
}

// Route all API requests to index.php
require __DIR__ . '/index.php';

