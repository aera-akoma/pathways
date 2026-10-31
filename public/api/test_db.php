<?php
/**
 * Podar Pathways - Intelligent Database Diagnostic Tool
 * Visit in browser: https://podarpathways.com/api/test_db.php
 */
header('Content-Type: text/html; charset=utf-8');
require_once __DIR__ . '/config.php';

echo "<!DOCTYPE html><html><head><title>MySQL Database Test</title>";
echo "<style>body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;padding:30px;background:#f8fafc;color:#1e293b;max-width:720px;margin:0 auto;}";
echo ".card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;box-shadow:0 4px 12px rgba(0,0,0,0.05);margin-bottom:20px;}";
echo ".ok{color:#16a34a;font-weight:bold;} .fail{color:#dc2626;font-weight:bold;} pre{background:#f1f5f9;padding:12px;border-radius:6px;overflow-x:auto;}";
echo ".help{background:#fffbeb;border-left:4px solid #f59e0b;padding:14px;border-radius:0 8px 8px 0;margin-top:16px;font-size:14px;line-height:1.6;}";
echo ".badge{display:inline-block;padding:3px 8px;border-radius:4px;background:#e0f2fe;color:#0369a1;font-weight:600;font-family:monospace;}";
echo "</style></head><body>";

echo "<h2>Podar Pathways - Database Connection Diagnostic</h2>";

echo "<div class='card'>";
echo "<h3>1. Current Settings in <code>api/config.php</code></h3>";
echo "<ul>";
echo "<li><strong>DB_HOST:</strong> " . htmlspecialchars(DB_HOST) . "</li>";
echo "<li><strong>DB_PORT:</strong> " . htmlspecialchars(DB_PORT) . "</li>";
echo "<li><strong>DB_NAME:</strong> <code>" . htmlspecialchars(DB_NAME) . "</code></li>";
echo "<li><strong>DB_USER:</strong> <code>" . htmlspecialchars(DB_USER) . "</code></li>";
echo "<li><strong>DB_PASS:</strong> •••••••• (" . strlen(DB_PASS) . " characters)</li>";
echo "</ul>";
echo "</div>";

echo "<div class='card'>";
echo "<h3>2. Deep Diagnostics & Inspection</h3>";

// Check 1: Connect WITHOUT database name to verify if username & password are valid
$loginOk = false;
$accessibleDbs = [];
try {
    $serverDsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";charset=utf8mb4";
    $serverPdo = new PDO($serverDsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 4
    ]);
    $loginOk = true;
    echo "<p class='ok'>✅ Username and Password are CORRECT! (User logged into MySQL server successfully).</p>";
    
    // Check accessible databases
    $stmt = $serverPdo->query("SHOW DATABASES");
    $allDbs = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $accessibleDbs = array_filter($allDbs, function($db) {
        return !in_array($db, ['information_schema', 'performance_schema', 'sys', 'mysql']);
    });
} catch (PDOException $e) {
    echo "<p class='fail'>❌ Could not login to MySQL: " . htmlspecialchars($e->getMessage()) . "</p>";
}

if ($loginOk) {
    echo "<h4>Databases accessible by user <code>" . htmlspecialchars(DB_USER) . "</code>:</h4>";
    if (count($accessibleDbs) > 0) {
        echo "<p>This user has access to these database(s):</p><ul>";
        foreach ($accessibleDbs as $d) {
            $isTarget = ($d === DB_NAME);
            echo "<li><span class='badge'>" . htmlspecialchars($d) . "</span> " . ($isTarget ? "👈 (matches DB_NAME in config.php)" : "👈 <strong>Try this in DB_NAME!</strong>") . "</li>";
        }
        echo "</ul>";

        if (!in_array(DB_NAME, $accessibleDbs)) {
            $suggested = reset($accessibleDbs);
            echo "<div class='help'>";
            echo "🚨 <strong>SOLUTION:</strong> Your database is NOT named <code>" . htmlspecialchars(DB_NAME) . "</code>!<br>";
            echo "It is named <code>" . htmlspecialchars($suggested) . "</code>.<br><br>";
            echo "Open <code>api/config.php</code> and change line 18:<br>";
            echo "<code>define('DB_NAME', '" . htmlspecialchars($suggested) . "');</code>";
            echo "</div>";
        }
    } else {
        echo "<div class='help'>";
        echo "🚨 <strong>SOLUTION: User has NOT been added to the database yet!</strong><br><br>";
        echo "Your user <code>" . htmlspecialchars(DB_USER) . "</code> exists, but has access to <strong>0 databases</strong>.<br>";
        echo "Follow these 4 clicks in cPanel:<br><br>";
        echo "1. Go to <strong>cPanel Home &rarr; MySQL Databases</strong>.<br>";
        echo "2. Scroll down to the section: <strong>Add User To Database</strong>.<br>";
        echo "3. Select User: <code>" . htmlspecialchars(DB_USER) . "</code> and Select Database: <code>" . htmlspecialchars(DB_NAME) . "</code>.<br>";
        echo "4. Click <strong>Add</strong> &rarr; Check <strong>ALL PRIVILEGES</strong> &rarr; Click <strong>Make Changes</strong>.";
        echo "</div>";
    }
}

// Check 2: Try specific database connection
echo "<hr style='margin:20px 0;border:0;border-top:1px solid #e2e8f0;'>";
echo "<h4>Direct Connection to Database <code>" . htmlspecialchars(DB_NAME) . "</code>:</h4>";
try {
    $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 4
    ]);
    echo "<p class='ok'>✅ SUCCESS: Connected directly to database <code>" . htmlspecialchars(DB_NAME) . "</code>!</p>";
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "<p>Found <strong>" . count($tables) . "</strong> tables in database:</p>";
    if (count($tables) > 0) {
        echo "<pre>" . implode(", ", $tables) . "</pre>";
        echo "<p class='ok' style='font-size:16px;'>🎉 Your database is 100% connected and ready!</p>";
        echo "<p><a href='/' style='display:inline-block;padding:10px 18px;background:#0d9488;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;'>Go to Podar Pathways &rarr;</a></p>";
    } else {
        echo "<p class='fail'>⚠️ The database is empty. You still need to import <code>database.sql</code> into phpMyAdmin.</p>";
    }
} catch (PDOException $e) {
    echo "<p class='fail'>❌ Could not connect to database <code>" . htmlspecialchars(DB_NAME) . "</code>:</p>";
    echo "<pre>" . htmlspecialchars($e->getMessage()) . "</pre>";
}

echo "</div></body></html>";
