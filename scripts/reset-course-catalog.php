<?php
if (PHP_SAPI !== 'cli') exit;
require_once dirname(__DIR__) . '/public/api/db.php';
$pdo = Database::getConnection();
$dir = dirname(__DIR__) . '/.gsd/backups';
if (!is_dir($dir)) mkdir($dir, 0700, true);
$file = $dir . '/courses-' . date('Ymd-His') . '.sql';
$backup = fopen($file, 'x');
if (!$backup) throw new RuntimeException('Could not create course backup.');
$pdo->beginTransaction();
try {
 foreach (['programs', 'program_clicks'] as $table) {
  fwrite($backup, $pdo->query("SHOW CREATE TABLE {$table}")->fetch(PDO::FETCH_NUM)[1] . ";\n");
  foreach ($pdo->query("SELECT * FROM {$table}") as $row) {
   $keys = implode(',', array_map(fn($key) => '`' . $key . '`', array_keys($row)));
   $values = implode(',', array_map(fn($value) => $value === null ? 'NULL' : $pdo->quote((string)$value), array_values($row)));
   if (fwrite($backup, "INSERT INTO {$table} ({$keys}) VALUES ({$values});\n") === false) throw new RuntimeException('Backup write failed.');
  }
 }
 if (!fclose($backup)) throw new RuntimeException('Backup could not be completed.');
 $pdo->exec('DELETE FROM program_clicks WHERE programId IN (SELECT id FROM programs)');
 $deleted = $pdo->exec('DELETE FROM programs');
 $pdo->commit();
 echo "Removed {$deleted} course listings. Backup saved privately.\n";
} catch (Throwable $error) { $pdo->rollBack(); throw $error; }
