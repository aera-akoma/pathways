<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Models\ProgramClick;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProgramController extends Controller
{
    /**
     * List all programs
     */
    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status', 'active');
        $query = Program::query();

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $programs = $query->orderBy('createdAt', 'desc')->get();
        return response()->json($programs);
    }

    /**
     * Store new program (Admin)
     */
    public function store(Request $request): JsonResponse
    {
        $title = trim((string)$request->input('title'));
        $issuer = trim((string)$request->input('issuer'));
        $link = trim((string)$request->input('link'));

        if (!$title || !$issuer || !$link) {
            return response()->json(['error' => 'Title, issuer, and link are required.'], 422);
        }

        $id = (string)$request->input('id', 'prg-' . Str::random(12));

        $program = Program::create([
            'id' => $id,
            'title' => $title,
            'issuer' => $issuer,
            'description' => $request->input('description'),
            'link' => $link,
            'bannerImg' => $request->input('bannerImg'),
            'targetCourse' => $request->input('targetCourse', 'All'),
            'targetSemester' => $request->input('targetSemester', 'All'),
            'deadline' => $request->input('deadline', '2026-12-31'),
            'rewardPoints' => (int)$request->input('rewardPoints', 15),
            'status' => $request->input('status', 'active'),
        ]);

        return response()->json($program, 201);
    }

    /**
     * Get single program
     */
    public function show(string $id): JsonResponse
    {
        $program = Program::find($id);
        if (!$program) {
            return response()->json(['error' => 'Program not found.'], 404);
        }

        return response()->json($program);
    }

    /**
     * Update program (Admin)
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $program = Program::find($id);
        if (!$program) {
            return response()->json(['error' => 'Program not found.'], 404);
        }

        $program->update($request->all());
        return response()->json($program);
    }

    /**
     * Delete program (Admin)
     */
    public function destroy(string $id): JsonResponse
    {
        $program = Program::find($id);
        if (!$program) {
            return response()->json(['error' => 'Program not found.'], 404);
        }

        $program->delete();
        return response()->json(['success' => true]);
    }

    /**
     * Track program or course click by student
     */
    public function trackClick(Request $request, string $id): JsonResponse
    {
        $studentId = $request->input('studentId');
        $studentName = $request->input('studentName', 'Student');
        $studentPhone = $request->input('studentPhone');

        if ($auth = $request->attributes->get('auth')) {
            if ($auth['role'] === 'student') {
                $studentId = $auth['id'];
                $studentName = $auth['name'];
                $studentPhone = $auth['student']['phone'] ?? $studentPhone;
            }
        }

        ProgramClick::create([
            'id' => 'clk-' . Str::random(12),
            'programId' => $id,
            'studentId' => $studentId ?: 'guest',
            'studentName' => $studentName,
            'studentPhone' => $studentPhone,
            'clickedAt' => now(),
        ]);

        return response()->json(['success' => true]);
    }

    /**
     * Get clicks for a specific program
     */
    public function clicks(string $id): JsonResponse
    {
        $clicks = ProgramClick::where('programId', $id)
            ->orderBy('clickedAt', 'desc')
            ->get();

        return response()->json([
            'programId' => $id,
            'totalClicks' => $clicks->count(),
            'clicks' => $clicks,
        ]);
    }

    /**
     * Get all clicks summary (Admin analytics)
     */
    public function allClicks(): JsonResponse
    {
        $clicks = ProgramClick::orderBy('clickedAt', 'desc')->get();
        return response()->json($clicks);
    }
}
