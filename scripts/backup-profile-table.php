<?php
if (PHP_SAPI !== 'cli') exit;
require_once dirname(__DIR__) . '/public/api/db.php';
$pdo = Database::getConnection();
$dir = dirname(__DIR__) . '/.gsd/backups';
if (!is_dir($dir)) mkdir($dir, 0700, true);
$file = $dir . '/students-' . date('Ymd-His') . '.sql';
$fp = fopen($file, 'x');
if (!$fp) throw new RuntimeException('Could not create backup.');
$pdo->beginTransaction();
fwrite($fp, $pdo->query('SHOW CREATE TABLE students')->fetch(PDO::FETCH_NUM)[1] . ";\n");
foreach ($pdo->query('SELECT * FROM students') as $row) {
    $keys = implode(',', array_map(fn($key) => '`' . str_replace('`', '``', $key) . '`', array_keys($row)));
    $values = implode(',', array_map(fn($value) => $value === null ? 'NULL' : $pdo->quote((string)$value), array_values($row)));
    fwrite($fp, "INSERT INTO students ({$keys}) VALUES ({$values});\n");
}
$pdo->commit();
fclose($fp);
echo "Student table backup saved privately.\n";
