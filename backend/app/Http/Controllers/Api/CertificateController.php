<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CertificateController extends Controller
{
    /**
     * List certificates
     */
    public function index(Request $request): JsonResponse
    {
        $auth = $request->attributes->get('auth');
        $query = Certificate::query();

        if ($auth && $auth['role'] === 'student') {
            $studentName = $auth['student']['name'] ?? $auth['name'];
            $query->where('studentName', $studentName);
        }

        $certificates = $query->orderBy('createdAt', 'desc')->get();
        return response()->json($certificates);
    }

    /**
     * Upload certificate
     */
    public function store(Request $request): JsonResponse
    {
        $programTitle = trim((string)$request->input('programTitle'));
        $studentName = trim((string)$request->input('studentName'));
        $certificateImg = (string)$request->input('certificateImg');

        $auth = $request->attributes->get('auth');
        if ($auth && $auth['role'] === 'student') {
            $studentName = $auth['student']['name'] ?? $auth['name'];
        }

        if (!$programTitle || !$studentName) {
            return response()->json(['error' => 'Program title and student name are required.'], 422);
        }

        $id = (string)$request->input('id', 'cert-' . Str::random(12));

        $certificate = Certificate::create([
            'id' => $id,
            'programTitle' => $programTitle,
            'studentName' => $studentName,
            'certificateImg' => $certificateImg ?: null,
            'status' => 'pending',
            'verifiedBy' => null,
            'createdAt' => now(),
        ]);

        return response()->json($certificate, 201);
    }

    /**
     * Verify or reject certificate (Admin)
     */
    public function verify(Request $request, string $id): JsonResponse
    {
        $certificate = Certificate::find($id);
        if (!$certificate) {
            return response()->json(['error' => 'Certificate not found.'], 404);
        }

        $status = $request->input('status', 'verified');
        $auth = $request->attributes->get('auth');
        $verifier = $auth['name'] ?? 'College Administrator';

        $certificate->status = $status;
        $certificate->verifiedBy = ($status === 'verified') ? $verifier : null;
        $certificate->save();

        // Increment student's verified certificate count if newly verified
        if ($status === 'verified') {
            $student = Student::where('name', $certificate->studentName)->first();
            if ($student) {
                $count = Certificate::where('studentName', $student->name)->where('status', 'verified')->count();
                $student->certificates = $count;
                $student->save();
            }
        }

        return response()->json($certificate);
    }

    /**
     * Delete certificate
     */
    public function destroy(string $id): JsonResponse
    {
        $certificate = Certificate::find($id);
        if (!$certificate) {
            return response()->json(['error' => 'Certificate not found.'], 404);
        }

        $studentName = $certificate->studentName;
        $certificate->delete();

        // Recalculate student certificate count
        $student = Student::where('name', $studentName)->first();
        if ($student) {
            $count = Certificate::where('studentName', $student->name)->where('status', 'verified')->count();
            $student->certificates = $count;
            $student->save();
        }

        return response()->json(['success' => true]);
    }

    /**
     * Public certificate verification lookup
     */
    public function publicVerify(string $certificateNumber): JsonResponse
    {
        $certificate = Certificate::find($certificateNumber);
        if (!$certificate) {
            return response()->json([
                'valid' => false,
                'message' => 'Certificate not found or invalid certificate ID.',
            ], 404);
        }

        return response()->json([
            'valid' => $certificate->status === 'verified',
            'certificate' => $certificate,
        ]);
    }
}
