<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Test;
use App\Models\TestSubmission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TestController extends Controller
{
    /**
     * List all tests
     */
    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status', 'active');
        $query = Test::query();

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $tests = $query->orderBy('createdAt', 'desc')->get();
        return response()->json($tests);
    }

    /**
     * Create test (Admin)
     */
    public function store(Request $request): JsonResponse
    {
        $title = trim((string)$request->input('title'));
        $questions = $request->input('questions');

        if (!$title || empty($questions)) {
            return response()->json(['error' => 'Title and questions are required.'], 422);
        }

        $id = (string)$request->input('id', 'tst-' . Str::random(12));

        $test = Test::create([
            'id' => $id,
            'title' => $title,
            'category' => $request->input('category', 'Technical'),
            'description' => $request->input('description'),
            'targetCourse' => $request->input('targetCourse', 'All'),
            'targetSemester' => $request->input('targetSemester', 'All'),
            'durationMinutes' => (int)$request->input('durationMinutes', 20),
            'totalMarks' => (int)$request->input('totalMarks', 100),
            'passingMarks' => (int)$request->input('passingMarks', 40),
            'rewardPoints' => (int)$request->input('rewardPoints', 15),
            'status' => $request->input('status', 'active'),
            'questions' => is_string($questions) ? json_decode($questions, true) : $questions,
        ]);

        return response()->json($test, 201);
    }

    /**
     * Show test
     */
    public function show(string $id): JsonResponse
    {
        $test = Test::find($id);
        if (!$test) {
            return response()->json(['error' => 'Test not found.'], 404);
        }

        return response()->json($test);
    }

    /**
     * Update test (Admin)
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $test = Test::find($id);
        if (!$test) {
            return response()->json(['error' => 'Test not found.'], 404);
        }

        $data = $request->all();
        if (isset($data['questions']) && is_string($data['questions'])) {
            $data['questions'] = json_decode($data['questions'], true);
        }

        $test->update($data);
        return response()->json($test);
    }

    /**
     * Delete test (Admin)
     */
    public function destroy(string $id): JsonResponse
    {
        $test = Test::find($id);
        if (!$test) {
            return response()->json(['error' => 'Test not found.'], 404);
        }

        $test->delete();
        return response()->json(['success' => true]);
    }

    /**
     * Submit test answers
     */
    public function submit(Request $request, string $id): JsonResponse
    {
        $test = Test::find($id);
        if (!$test) {
            return response()->json(['error' => 'Test not found.'], 404);
        }

        $auth = $request->attributes->get('auth');
        $studentId = $auth['id'] ?? $request->input('studentId');
        $studentName = $auth['name'] ?? $request->input('studentName', 'Student');
        $studentPhone = $auth['student']['phone'] ?? $request->input('studentPhone');
        $studentCourse = $auth['student']['course'] ?? $request->input('studentCourse');
        $studentSemester = $auth['student']['semester'] ?? $request->input('studentSemester');

        $answers = $request->input('answers', []);
        if (is_string($answers)) {
            $answers = json_decode($answers, true) ?: [];
        }

        // Auto evaluate answers against test questions
        $questions = is_array($test->questions) ? $test->questions : json_decode($test->questions ?: '[]', true);
        $totalQuestions = count($questions);
        $correctCount = 0;

        foreach ($questions as $qIndex => $q) {
            $correctAnswer = $q['correctAnswer'] ?? $q['correctIndex'] ?? null;
            $submittedAnswer = $answers[$qIndex] ?? $answers[$q['id'] ?? ''] ?? null;

            if ($correctAnswer !== null && (string)$correctAnswer === (string)$submittedAnswer) {
                $correctCount++;
            }
        }

        $totalMarks = $test->totalMarks ?: 100;
        $score = ($totalQuestions > 0) ? (int)round(($correctCount / $totalQuestions) * $totalMarks) : 0;
        $percentage = ($totalMarks > 0) ? (int)round(($score / $totalMarks) * 100) : 0;
        $status = ($score >= $test->passingMarks) ? 'passed' : 'failed';

        $submission = TestSubmission::create([
            'id' => 'sub-' . Str::random(12),
            'testId' => $id,
            'testTitle' => $test->title,
            'studentId' => $studentId,
            'studentName' => $studentName,
            'studentPhone' => $studentPhone,
            'studentCourse' => $studentCourse,
            'studentSemester' => $studentSemester,
            'score' => $score,
            'totalMarks' => $totalMarks,
            'percentage' => $percentage,
            'status' => $status,
            'timeSpentSeconds' => (int)$request->input('timeSpentSeconds', 0),
            'answers' => $answers,
            'submittedAt' => now(),
        ]);

        // If passed, award P-CARE score points
        if ($status === 'passed') {
            $student = Student::find($studentId);
            if ($student) {
                $student->increment('score', $test->rewardPoints ?: 15);
            }
        }

        return response()->json($submission, 201);
    }

    /**
     * List submissions (Admin sees all; student sees own)
     */
    public function submissions(Request $request): JsonResponse
    {
        $auth = $request->attributes->get('auth');
        $query = TestSubmission::query();

        if ($auth && $auth['role'] === 'student') {
            $query->where('studentId', $auth['id']);
        } elseif ($studentId = $request->query('studentId')) {
            $query->where('studentId', $studentId);
        }

        if ($testId = $request->query('testId')) {
            $query->where('testId', $testId);
        }

        $submissions = $query->orderBy('submittedAt', 'desc')->get();
        return response()->json($submissions);
    }

    /**
     * Show single submission
     */
    public function submissionDetails(string $id): JsonResponse
    {
        $submission = TestSubmission::find($id);
        if (!$submission) {
            return response()->json(['error' => 'Submission not found.'], 404);
        }

        return response()->json($submission);
    }

    /**
     * Review / grade submission (Admin)
     */
    public function reviewSubmission(Request $request, string $id): JsonResponse
    {
        $submission = TestSubmission::find($id);
        if (!$submission) {
            return response()->json(['error' => 'Submission not found.'], 404);
        }

        if ($request->has('score')) {
            $submission->score = (int)$request->input('score');
            $submission->percentage = (int)round(($submission->score / $submission->totalMarks) * 100);
            $test = Test::find($submission->testId);
            $passing = $test ? $test->passingMarks : 40;
            $submission->status = ($submission->score >= $passing) ? 'passed' : 'failed';
        }

        if ($request->has('adminRemarks')) {
            $submission->adminRemarks = $request->input('adminRemarks');
        }

        $submission->checkedAt = now();
        $submission->save();

        return response()->json($submission);
    }
}
