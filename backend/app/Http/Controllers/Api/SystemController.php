<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SystemController extends Controller
{
    /**
     * System health check
     */
    public function health(): JsonResponse
    {
        $dbStatus = 'connected';
        try {
            DB::connection()->getPdo();
        } catch (\Throwable $e) {
            $dbStatus = 'error: ' . $e->getMessage();
        }

        return response()->json([
            'status' => 'ok',
            'server' => 'Laravel ' . app()->version() . ' (PHP ' . PHP_VERSION . ')',
            'database' => $dbStatus,
            'driver' => DB::connection()->getDriverName(),
            'time' => now()->toIso8601String(),
        ]);
    }

    /**
     * Get system settings
     */
    public function settings(): JsonResponse
    {
        $settings = Setting::all()->pluck('setting_value', 'setting_key');
        return response()->json($settings);
    }

    /**
     * Get start page
     */
    public function startPage(): JsonResponse
    {
        $page = Setting::getVal('start_page', 'home');
        return response()->json(['startPage' => $page]);
    }

    /**
     * Set start page
     */
    public function setStartPage(Request $request): JsonResponse
    {
        $page = $request->input('startPage', 'home');
        Setting::setVal('start_page', $page);
        return response()->json(['success' => true, 'startPage' => $page]);
    }

    /**
     * Secure admin phone update with administrative key
     */
    public function updateAdminPhone(Request $request): JsonResponse
    {
        $adminKey = (string)$request->input('adminKey');
        $email = strtolower(trim((string)$request->input('email')));
        $phone = trim((string)$request->input('phone'));

        $expectedKey = env('ADMIN_KEY', 'drHPSingh');

        if ($adminKey !== $expectedKey) {
            return response()->json(['error' => 'Invalid administrative authorization key.'], 403);
        }

        if (!preg_match('/^[0-9]{10}$/', $phone)) {
            return response()->json(['error' => 'Please provide a valid 10-digit mobile number.'], 422);
        }

        $admin = Admin::whereRaw('LOWER(email) = ?', [$email])->first();
        if (!$admin) {
            return response()->json(['error' => 'Administrator account not found.'], 404);
        }

        $admin->phone = $phone;
        $admin->save();

        return response()->json(['success' => true, 'message' => 'Administrator phone number updated successfully.']);
    }
}
