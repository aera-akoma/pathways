<?php
if (!defined('PODAR_APP')) { http_response_code(403); exit; }

// Public gallery metadata only; the authenticated router gates this read-only endpoint.
function publicCertificatesForStudent(string $studentId): array {
    $student = Database::fetchOne('SELECT id, name FROM students WHERE id = ?', [$studentId]);
    if (!$student) jsonError('Student not found.', 404);
    // The legacy certificate database has no student ID. Never guess between namesakes.
    $count = Database::fetchOne('SELECT COUNT(*) AS total FROM students WHERE name = ?', [$student['name']]);
    if ((int)($count['total'] ?? 0) !== 1) {
        jsonError('Certificate ownership needs administrator review because this name is shared.', 409);
    }
    $stmt = Database::getCertificatesConnection()->prepare(
        "SELECT id, programTitle, status, createdAt FROM certificates WHERE studentName = ? AND status = 'verified' ORDER BY createdAt DESC"
    );
    $stmt->execute([$student['name']]);
    return array_map(static function ($certificate) use ($studentId) {
        return [
            'id' => $certificate['id'],
            'studentId' => $studentId,
            'programTitle' => $certificate['programTitle'],
            'status' => $certificate['status'],
            'submittedAt' => $certificate['createdAt'],
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));
}
