<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * List notifications
     */
    public function index(Request $request): JsonResponse
    {
        $auth = $request->attributes->get('auth');
        $studentId = $auth['id'] ?? $request->query('studentId', 'all');

        $notifications = Notification::where(function ($q) use ($studentId) {
            $q->where('studentId', 'all')
              ->orWhere('studentId', $studentId);
        })->orderBy('createdAt', 'desc')->get();

        return response()->json($notifications);
    }

    /**
     * Mark all notifications read
     */
    public function readAll(Request $request): JsonResponse
    {
        $auth = $request->attributes->get('auth');
        $studentId = $auth['id'] ?? $request->input('studentId', 'all');

        Notification::where(function ($q) use ($studentId) {
            $q->where('studentId', 'all')
              ->orWhere('studentId', $studentId);
        })->update(['isRead' => 1]);

        return response()->json(['success' => true]);
    }

    /**
     * Clear read notifications
     */
    public function clearRead(Request $request): JsonResponse
    {
        $auth = $request->attributes->get('auth');
        $studentId = $auth['id'] ?? $request->input('studentId', 'all');

        Notification::where('isRead', 1)
            ->where(function ($q) use ($studentId) {
                $q->where('studentId', 'all')
                  ->orWhere('studentId', $studentId);
            })->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Mark single notification read
     */
    public function markRead(string $id): JsonResponse
    {
        $notification = Notification::find($id);
        if ($notification) {
            $notification->isRead = 1;
            $notification->save();
        }

        return response()->json(['success' => true]);
    }

    /**
     * Delete notification
     */
    public function destroy(string $id): JsonResponse
    {
        $notification = Notification::find($id);
        if ($notification) {
            $notification->delete();
        }

        return response()->json(['success' => true]);
    }
}
