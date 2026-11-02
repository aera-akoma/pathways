<?php
// Run once with PHP CLI after backing up the database: php scripts/migrate-profile.php
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once dirname(__DIR__) . '/public/api/db.php';
$columns = Database::fetchAll('SHOW COLUMNS FROM students');
$existing = array_column($columns, 'Field');
foreach (['gender' => 'VARCHAR(20)', 'houseNo' => 'VARCHAR(255)', 'district' => 'VARCHAR(100)', 'state' => 'VARCHAR(100)', 'pinCode' => 'VARCHAR(6)', 'dob' => 'DATE', 'profileCompletedAt' => 'DATETIME'] as $column => $type) {
    if (in_array($column, $existing, true)) continue;
    Database::execute("ALTER TABLE students ADD COLUMN `{$column}` {$type} DEFAULT NULL");
    echo "Added {$column}\n";
}
echo "Profile schema is ready.\n";
