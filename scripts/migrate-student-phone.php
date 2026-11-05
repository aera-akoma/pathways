<?php
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once dirname(__DIR__) . '/public/api/db.php';
$phone = Database::fetchOne("SHOW COLUMNS FROM students LIKE 'phone'");
if (!$phone) {
    fwrite(STDERR, "Student phone column not found.\n");
    exit(1);
}
if ($phone['Null'] !== 'YES') {
    Database::execute("ALTER TABLE students MODIFY COLUMN phone VARCHAR(20) DEFAULT NULL");
}
echo "Student phone column accepts missing values.\n";
