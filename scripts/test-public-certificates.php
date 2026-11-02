<?php
define('PODAR_APP', true);
require __DIR__ . '/../public/api/auth.php';
require __DIR__ . '/../public/api/public-certificates.php';
function jsonError($message, $status = 400) { throw new RuntimeException($message, $status); }
class Database {
    static $duplicate = false;
    static function fetchOne($sql, $params) {
        if (str_contains($sql, 'COUNT(*)')) return ['total' => self::$duplicate ? 2 : 1];
        if ($params[0] === 'missing') return null;
        return ['id' => $params[0], 'name' => 'Student ' . $params[0], 'passwordHash' => 'hash'];
    }
    static function getCertificatesConnection() { return new CertificateConnection(); }
}
class CertificateConnection {
    function prepare($sql) {
        check(str_contains($sql, "status = 'verified'"), 'Only verified certificates selected');
        check(!str_contains($sql, 'certificateImg'), 'Private certificate images not selected');
        return new CertificateStatement();
    }
}
class CertificateStatement {
    function execute($params) { check($params === ['Student peer'], 'Uses the target owner name'); }
    function fetchAll($mode) { return [['id' => 'cert1', 'programTitle' => 'Course', 'status' => 'verified', 'createdAt' => '2026-01-01', 'certificateImg' => 'private', 'verifiedBy' => 'private']]; }
}
function check($condition, $message) { if (!$condition) throw new RuntimeException($message); }
function fails($callback, $code) {
    try { $callback(); } catch (RuntimeException $e) { check($e->getCode() === $code, 'Expected status ' . $code); return; }
    throw new RuntimeException('Expected rejection');
}
session_start();
$_SESSION = ['auth' => ['id' => 'self', 'role' => 'student'], 'expiresAt' => time()+100, 'credential' => hash('sha256', 'hash')];
$body = [];
authorizeRoute('/students/peer/public-certificates', 'GET', $body);
$result = publicCertificatesForStudent('peer');
check($result[0]['studentId'] === 'peer', 'Target ID is normalized');
check(array_keys($result[0]) === ['id','studentId','programTitle','status','submittedAt'], 'Only public metadata returned');
foreach (['POST', 'PUT', 'DELETE'] as $method) { $_GET=[]; $body=[]; fails(function() use ($method, &$body) { authorizeRoute('/students/peer/public-certificates', $method, $body); },403); }
$_GET=[]; $body=[];
fails(function() use (&$body) { authorizeRoute('/students/peer', 'PUT', $body); },403);
Database::$duplicate=true;
fails(fn() => publicCertificatesForStudent('peer'),409);
Database::$duplicate=false;
fails(fn() => publicCertificatesForStudent('missing'),404);
$_SESSION=[]; $_GET=[]; $body=[];
fails(function() use (&$body) { authorizeRoute('/students/peer/public-certificates', 'GET', $body); },401);
echo "PASS: authenticated peer certificates, metadata privacy, duplicate ownership, missing student, read-only permissions\n";
