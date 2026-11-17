<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Student;
use App\Models\TestSubmission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class StudentController extends Controller
{
    /**
     * Display a listing of students (Admin roster view)
     */
    public function index(Request $request): JsonResponse
    {
        $query = Student::query();

        if ($course = $request->query('course')) {
            $query->where('course', $course);
        }
        if ($semester = $request->query('semester')) {
            $query->where('semester', $semester);
        }
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('rollNo', 'like', "%{$search}%");
            });
        }

        $students = $query->orderBy('createdAt', 'desc')->get();
        return response()->json($students);
    }

    /**
     * Store a newly created student in roster
     */
    public function store(Request $request): JsonResponse
    {
        $name = trim((string)$request->input('name'));
        $course = trim((string)$request->input('course'));
        $semester = trim((string)$request->input('semester', 'I'));
        $email = strtolower(trim((string)$request->input('email')));
        $phone = trim((string)$request->input('phone'));

        if (!$name || !$course || !$email) {
            return response()->json(['error' => 'Name, course, and email are required.'], 422);
        }

        if (Student::whereRaw('LOWER(email) = ?', [$email])->exists()) {
            return response()->json(['error' => 'A student with this email address already exists.'], 409);
        }

        $id = (string)$request->input('id', 'std-' . Str::random(12));

        $student = Student::create([
            'id' => $id,
            'name' => $name,
            'course' => $course,
            'semester' => $semester,
            'email' => $email,
            'phone' => $phone ?: null,
            'rollNo' => $request->input('rollNo'),
            'fathersName' => $request->input('fathersName'),
            'gender' => $request->input('gender'),
            'addedByAdmin' => 1,
            'isRegistered' => 0,
            'status' => 'active',
            'score' => 0,
            'completion' => 28,
            'applications' => 0,
            'projects' => 0,
            'certificates' => 0,
        ]);

        return response()->json($student, 201);
    }

    /**
     * Import multiple students from CSV
     */
    public function importCsv(Request $request): JsonResponse
    {
        $rows = $request->input('students', []);
        if (!is_array($rows) || empty($rows)) {
            return response()->json(['error' => 'No student records provided for import.'], 422);
        }

        $imported = 0;
        $skipped = 0;

        foreach ($rows as $row) {
            $email = strtolower(trim((string)($row['email'] ?? '')));
            $name = trim((string)($row['name'] ?? ''));
            $course = trim((string)($row['course'] ?? 'BCA'));
            $semester = trim((string)($row['semester'] ?? 'I'));

            if (!$email || !$name) {
                $skipped++;
                continue;
            }

            if (Student::whereRaw('LOWER(email) = ?', [$email])->exists()) {
                $skipped++;
                continue;
            }

            Student::create([
                'id' => 'std-' . Str::random(12),
                'name' => $name,
                'email' => $email,
                'course' => $course,
                'semester' => $semester,
                'phone' => $row['phone'] ?? null,
                'rollNo' => $row['rollNo'] ?? null,
                'addedByAdmin' => 1,
                'isRegistered' => 0,
                'status' => 'active',
                'score' => 0,
                'completion' => 28,
                'applications' => 0,
                'projects' => 0,
                'certificates' => 0,
            ]);
            $imported++;
        }

        return response()->json([
            'success' => true,
            'imported' => $imported,
            'skipped' => $skipped,
        ]);
    }

    /**
     * Display the specified student
     */
    public function show(string $id): JsonResponse
    {
        $student = Student::find($id);
        if (!$student) {
            return response()->json(['error' => 'Student not found.'], 404);
        }

        return response()->json($student);
    }

    /**
     * Update the specified student
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $student = Student::find($id);
        if (!$student) {
            return response()->json(['error' => 'Student not found.'], 404);
        }

        $auth = $request->attributes->get('auth');
        $isAdmin = ($auth['role'] ?? '') === 'admin';

        // Filter permitted fields for students
        $data = $request->except(['passwordHash', 'salt']);
        if (!$isAdmin) {
            unset($data['score'], $data['completion'], $data['applications'], $data['projects'], $data['certificates'], $data['status'], $data['isRegistered'], $data['addedByAdmin']);
        }

        $student->fill($data);
        $student->save();

        return response()->json($student);
    }

    /**
     * Remove the specified student
     */
    public function destroy(string $id): JsonResponse
    {
        $student = Student::find($id);
        if (!$student) {
            return response()->json(['error' => 'Student not found.'], 404);
        }

        $student->delete();
        return response()->json(['success' => true]);
    }

    /**
     * Student change password
     */
    public function changePassword(Request $request, string $id): JsonResponse
    {
        $student = Student::find($id);
        if (!$student) {
            return response()->json(['error' => 'Student not found.'], 404);
        }

        $currentPassword = (string)$request->input('currentPassword');
        $newPassword = (string)$request->input('newPassword');

        if (!$currentPassword || !$newPassword) {
            return response()->json(['error' => 'Current and new password are required.'], 422);
        }

        if (strlen($newPassword) < 6) {
            return response()->json(['error' => 'New password must be at least 6 characters.'], 422);
        }

        if (!password_verify($currentPassword, $student->passwordHash)) {
            return response()->json(['error' => 'Current password is incorrect.'], 400);
        }

        $student->passwordHash = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 12]);
        $student->save();

        return response()->json(['success' => true, 'message' => 'Password changed successfully.']);
    }

    /**
     * Get student's certificates
     */
    public function certificates(string $id): JsonResponse
    {
        $student = Student::find($id);
        if (!$student) {
            return response()->json(['error' => 'Student not found.'], 404);
        }

        $certificates = Certificate::where('studentName', $student->name)
            ->orderBy('createdAt', 'desc')
            ->get();

        return response()->json($certificates);
    }

    /**
     * Get student's test submissions
     */
    public function testSubmissions(string $id): JsonResponse
    {
        $submissions = TestSubmission::where('studentId', $id)
            ->orderBy('submittedAt', 'desc')
            ->get();

        return response()->json($submissions);
    }

    /**
     * Public verified certificates for student
     */
    public function publicCertificates(string $id): JsonResponse
    {
        $student = Student::find($id);
        if (!$student) {
            return response()->json(['error' => 'Student not found.'], 404);
        }

        $verified = Certificate::where('studentName', $student->name)
            ->where('status', 'verified')
            ->orderBy('createdAt', 'desc')
            ->get(['id', 'programTitle', 'studentName', 'verifiedBy', 'status', 'createdAt']);

        return response()->json([
            'student' => [
                'name' => $student->name,
                'course' => $student->course,
                'semester' => $student->semester,
            ],
            'certificates' => $verified,
        ]);
    }
}
