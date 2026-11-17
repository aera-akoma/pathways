<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\ScheduleEvent;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ScheduleController extends Controller
{
    /**
     * List schedules
     */
    public function index(Request $request): JsonResponse
    {
        $query = ScheduleEvent::query();

        if ($date = $request->query('date')) {
            $query->where('date', $date);
        }

        $schedules = $query->orderBy('date', 'desc')->orderBy('startTime', 'asc')->get();
        return response()->json($schedules);
    }

    /**
     * Store new schedule event (Admin)
     */
    public function store(Request $request): JsonResponse
    {
        $title = trim((string)$request->input('title'));
        $date = trim((string)$request->input('date'));

        if (!$title || !$date) {
            return response()->json(['error' => 'Title and date are required.'], 422);
        }

        $auth = $request->attributes->get('auth');
        $createdBy = $auth['name'] ?? 'Admin';

        $id = (string)$request->input('id', 'sch-' . Str::random(12));

        $schedule = ScheduleEvent::create([
            'id' => $id,
            'title' => $title,
            'category' => $request->input('category', 'Lecture'),
            'date' => $date,
            'startTime' => $request->input('startTime'),
            'endTime' => $request->input('endTime'),
            'location' => $request->input('location'),
            'meetLink' => $request->input('meetLink'),
            'targetCourse' => $request->input('targetCourse', 'All'),
            'targetSemester' => $request->input('targetSemester', 'All'),
            'instructor' => $request->input('instructor'),
            'description' => $request->input('description'),
            'isMandatory' => (bool)$request->input('isMandatory', false),
            'createdBy' => $createdBy,
        ]);

        return response()->json($schedule, 201);
    }

    /**
     * Show schedule event
     */
    public function show(string $id): JsonResponse
    {
        $schedule = ScheduleEvent::find($id);
        if (!$schedule) {
            return response()->json(['error' => 'Schedule not found.'], 404);
        }

        return response()->json($schedule);
    }

    /**
     * Update schedule event (Admin)
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $schedule = ScheduleEvent::find($id);
        if (!$schedule) {
            return response()->json(['error' => 'Schedule not found.'], 404);
        }

        $schedule->update($request->all());
        return response()->json($schedule);
    }

    /**
     * Delete schedule event (Admin)
     */
    public function destroy(string $id): JsonResponse
    {
        $schedule = ScheduleEvent::find($id);
        if (!$schedule) {
            return response()->json(['error' => 'Schedule not found.'], 404);
        }

        $schedule->attendance()->delete();
        $schedule->delete();

        return response()->json(['success' => true]);
    }

    /**
     * List attendance records
     */
    public function attendance(Request $request): JsonResponse
    {
        $query = Attendance::query();

        if ($scheduleId = $request->query('scheduleId')) {
            $query->where('scheduleId', $scheduleId);
        }

        if ($studentId = $request->query('studentId')) {
            $query->where('studentId', $studentId);
        }

        $records = $query->orderBy('markedAt', 'desc')->get();
        return response()->json($records);
    }

    /**
     * Mark attendance for a student (Admin)
     */
    public function markAttendance(Request $request): JsonResponse
    {
        $scheduleId = (string)$request->input('scheduleId');
        $studentId = (string)$request->input('studentId');
        $status = (string)$request->input('status', 'Present');

        if (!$scheduleId || !$studentId) {
            return response()->json(['error' => 'Schedule ID and Student ID are required.'], 422);
        }

        $student = Student::find($studentId);
        $auth = $request->attributes->get('auth');
        $markedBy = $auth['name'] ?? 'Admin';

        $record = Attendance::updateOrCreate(
            ['scheduleId' => $scheduleId, 'studentId' => $studentId],
            [
                'id' => 'att-' . Str::random(12),
                'studentName' => $student ? $student->name : $request->input('studentName'),
                'course' => $student ? $student->course : $request->input('course'),
                'semester' => $student ? $student->semester : $request->input('semester'),
                'status' => $status,
                'markedAt' => now(),
                'markedBy' => $markedBy,
                'remarks' => $request->input('remarks'),
            ]
        );

        return response()->json($record);
    }

    /**
     * Attendance summary overview (Admin)
     */
    public function attendanceOverview(): JsonResponse
    {
        return response()->json([
            'totalLectures' => ScheduleEvent::count(),
            'totalMarked' => Attendance::count(),
            'presentCount' => Attendance::where('status', 'Present')->count(),
            'absentCount' => Attendance::where('status', 'Absent')->count(),
        ]);
    }

    /**
     * Student's own attendance history
     */
    public function studentAttendance(string $studentId): JsonResponse
    {
        $records = Attendance::with('schedule')
            ->where('studentId', $studentId)
            ->orderBy('markedAt', 'desc')
            ->get();

        return response()->json($records);
    }
}
