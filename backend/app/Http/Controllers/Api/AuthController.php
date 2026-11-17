<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\Student;
use App\Services\OtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Send OTP for student registration
     */
    public function studentSendOtp(Request $request): JsonResponse
    {
        $email = strtolower(trim((string)$request->input('email')));
        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return response()->json(['error' => 'Please provide a valid college email address.'], 422);
        }

        $student = Student::whereRaw('LOWER(email) = ?', [$email])->first();
        if (!$student) {
            return response()->json(['error' => 'This email is not on the college roster. Ask your college administrator to add or update your record.'], 403);
        }
        if ($student->status === 'suspended') {
            return response()->json(['error' => 'Your student account has been suspended. Contact your college administrator.'], 403);
        }
        if ($student->isRegistered && !empty($student->passwordHash)) {
            return response()->json(['error' => 'This student account is already registered. Please sign in or use Forgot Password.'], 409);
        }

        $otp = OtpService::generateOtp($email, 'registration', 'student');
        OtpService::sendOtpEmail($email, $student->name, $otp, 'registration');

        return response()->json([
            'success' => true,
            'message' => 'Verification code sent to your email address.',
            'email' => $email,
        ]);
    }

    /**
     * Complete student registration with OTP and password
     */
    public function studentRegister(Request $request): JsonResponse
    {
        $email = strtolower(trim((string)$request->input('email')));
        $otp = trim((string)$request->input('otp'));
        $password = (string)$request->input('password');

        if (!$email || !$otp || !$password) {
            return response()->json(['error' => 'Email, OTP, and password are required.'], 422);
        }

        if (strlen($password) < 6) {
            return response()->json(['error' => 'Password must be at least 6 characters long.'], 422);
        }

        $student = Student::whereRaw('LOWER(email) = ?', [$email])->first();
        if (!$student) {
            return response()->json(['error' => 'Student record not found.'], 404);
        }

        if (!OtpService::verifyOtp($email, $otp, 'registration')) {
            return response()->json(['error' => 'Invalid or expired verification code.'], 400);
        }

        $student->passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        $student->isRegistered = 1;
        $student->status = 'active';
        $student->save();

        // Establish session
        $authData = [
            'id' => $student->id,
            'name' => $student->name,
            'email' => $student->email,
            'role' => 'student',
        ];

        if ($request->hasSession()) {
            $request->session()->put('auth', $authData);
        }
        $token = $student->createToken('student-auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registration completed successfully.',
            'token' => $token,
            'session' => [
                'id' => $student->id,
                'name' => $student->name,
                'email' => $student->email,
                'role' => 'student',
                'student' => $student,
            ],
        ]);
    }

    /**
     * Student login
     */
    public function studentLogin(Request $request): JsonResponse
    {
        $email = strtolower(trim((string)$request->input('email')));
        $password = (string)$request->input('password');

        if (!$email || !$password) {
            return response()->json(['error' => 'Email and password are required.'], 422);
        }

        $student = Student::whereRaw('LOWER(email) = ?', [$email])->first();
        if (!$student || !$student->passwordHash || !password_verify($password, $student->passwordHash)) {
            return response()->json(['error' => 'Invalid email or password.'], 401);
        }

        if ($student->status === 'suspended') {
            return response()->json(['error' => 'Your student account has been suspended. Contact administrator.'], 403);
        }

        $authData = [
            'id' => $student->id,
            'name' => $student->name,
            'email' => $student->email,
            'role' => 'student',
        ];

        if ($request->hasSession()) {
            $request->session()->put('auth', $authData);
        }
        $token = $student->createToken('student-auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'token' => $token,
            'session' => [
                'id' => $student->id,
                'name' => $student->name,
                'email' => $student->email,
                'role' => 'student',
                'student' => $student,
            ],
        ]);
    }

    /**
     * Send OTP for student forgot password
     */
    public function studentForgotPasswordSendOtp(Request $request): JsonResponse
    {
        $email = strtolower(trim((string)$request->input('email')));
        if (!$email) {
            return response()->json(['error' => 'Email is required.'], 422);
        }

        $student = Student::whereRaw('LOWER(email) = ?', [$email])->first();
        if (!$student) {
            return response()->json(['error' => 'No student account found with this email.'], 404);
        }

        $otp = OtpService::generateOtp($email, 'reset-password', 'student');
        OtpService::sendOtpEmail($email, $student->name, $otp, 'reset-password');

        return response()->json([
            'success' => true,
            'message' => 'Password reset verification code sent to your email.',
            'email' => $email,
        ]);
    }

    /**
     * Reset student password using OTP
     */
    public function studentForgotPasswordReset(Request $request): JsonResponse
    {
        $email = strtolower(trim((string)$request->input('email')));
        $otp = trim((string)$request->input('otp'));
        $password = (string)$request->input('password');

        if (!$email || !$otp || !$password) {
            return response()->json(['error' => 'Email, OTP, and new password are required.'], 422);
        }

        if (strlen($password) < 6) {
            return response()->json(['error' => 'Password must be at least 6 characters.'], 422);
        }

        $student = Student::whereRaw('LOWER(email) = ?', [$email])->first();
        if (!$student) {
            return response()->json(['error' => 'Student record not found.'], 404);
        }

        if (!OtpService::verifyOtp($email, $otp, 'reset-password')) {
            return response()->json(['error' => 'Invalid or expired verification code.'], 400);
        }

        $student->passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        $student->save();

        return response()->json([
            'success' => true,
            'message' => 'Password reset successfully. You can now log in with your new password.',
        ]);
    }

    /**
     * Step 1: Admin login password check and OTP generation
     */
    public function adminLoginStep1(Request $request): JsonResponse
    {
        $email = strtolower(trim((string)$request->input('email')));
        $password = (string)$request->input('password');

        if (!$email || !$password) {
            return response()->json(['error' => 'Email and password are required.'], 422);
        }

        $admin = Admin::whereRaw('LOWER(email) = ?', [$email])->first();
        if (!$admin || !$admin->passwordHash || !password_verify($password, $admin->passwordHash)) {
            return response()->json(['error' => 'Invalid administrator credentials.'], 401);
        }

        if ($admin->status === 'suspended') {
            return response()->json(['error' => 'Administrator account is suspended.'], 403);
        }

        $otp = OtpService::generateOtp($email, 'admin-login', 'admin');
        OtpService::sendOtpEmail($email, $admin->name, $otp, 'admin-login');

        return response()->json([
            'success' => true,
            'requireOtp' => true,
            'email' => $email,
            'message' => 'A two-factor authentication code has been sent to your administrator email.',
        ]);
    }

    /**
     * Step 2: Verify 2FA OTP and establish admin session
     */
    public function adminVerifyOtp(Request $request): JsonResponse
    {
        $email = strtolower(trim((string)$request->input('email')));
        $otp = trim((string)$request->input('otp'));

        if (!$email || !$otp) {
            return response()->json(['error' => 'Email and OTP are required.'], 422);
        }

        $admin = Admin::whereRaw('LOWER(email) = ?', [$email])->first();
        if (!$admin) {
            return response()->json(['error' => 'Administrator account not found.'], 404);
        }

        if (!OtpService::verifyOtp($email, $otp, 'admin-login')) {
            return response()->json(['error' => 'Invalid or expired verification code.'], 400);
        }

        $authData = [
            'id' => $admin->id,
            'name' => $admin->name,
            'email' => $admin->email,
            'role' => 'admin',
        ];

        if ($request->hasSession()) {
            $request->session()->put('auth', $authData);
        }
        $token = $admin->createToken('admin-auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'token' => $token,
            'session' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'role' => 'admin',
                'admin' => $admin,
            ],
        ]);
    }

    /**
     * Resend OTP for any purpose
     */
    public function resendOtp(Request $request): JsonResponse
    {
        $email = strtolower(trim((string)$request->input('email')));
        $purpose = (string)$request->input('purpose', 'registration');

        if (!$email) {
            return response()->json(['error' => 'Email is required.'], 422);
        }

        $name = 'User';
        if ($purpose === 'admin-login') {
            $admin = Admin::whereRaw('LOWER(email) = ?', [$email])->first();
            if ($admin) $name = $admin->name;
        } else {
            $student = Student::whereRaw('LOWER(email) = ?', [$email])->first();
            if ($student) $name = $student->name;
        }

        $otp = OtpService::generateOtp($email, $purpose);
        OtpService::sendOtpEmail($email, $name, $otp, $purpose);

        return response()->json([
            'success' => true,
            'message' => 'Verification code resent successfully.',
            'email' => $email,
        ]);
    }

    /**
     * Check active session
     */
    public function session(Request $request): JsonResponse
    {
        $auth = $request->attributes->get('auth');

        // 1. Check Bearer token
        if (!$auth && ($bearerToken = $request->bearerToken())) {
            $tokenRecord = \Laravel\Sanctum\PersonalAccessToken::findToken($bearerToken);
            if ($tokenRecord && $tokenRecord->tokenable) {
                $user = $tokenRecord->tokenable;
                if ($user instanceof Admin) {
                    $auth = [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => 'admin',
                        'admin' => $user,
                    ];
                } elseif ($user instanceof Student) {
                    $auth = [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => 'student',
                        'student' => $user,
                    ];
                }
            }
        }

        // 2. Check Laravel session
        if (!$auth && $request->hasSession() && $request->session()->has('auth')) {
            $s = $request->session()->get('auth');
            if ($s['role'] === 'admin') {
                $user = Admin::find($s['id']);
                if ($user && $user->status === 'active') {
                    $auth = ['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'role' => 'admin', 'admin' => $user];
                }
            } else {
                $user = Student::find($s['id']);
                if ($user && $user->status === 'active') {
                    $auth = ['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'role' => 'student', 'student' => $user];
                }
            }
        }

        // 3. Check native podar_session cookie
        if (!$auth && $request->cookies->has('podar_session')) {
            if (session_status() !== PHP_SESSION_ACTIVE) {
                @session_name('podar_session');
                @session_start();
            }
            if (!empty($_SESSION['auth'])) {
                $s = $_SESSION['auth'];
                if (($s['role'] ?? '') === 'admin') {
                    $user = Admin::find($s['id']);
                    if ($user && $user->status === 'active') {
                        $auth = ['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'role' => 'admin', 'admin' => $user];
                    }
                } else {
                    $user = Student::find($s['id']);
                    if ($user && $user->status === 'active') {
                        $auth = ['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'role' => 'student', 'student' => $user];
                    }
                }
            }
        }

        if (!$auth) {
            return response()->json([
                'authenticated' => false,
                'session' => null,
            ]);
        }

        return response()->json([
            'authenticated' => true,
            'session' => $auth,
        ]);
    }

    /**
     * Logout
     */
    public function logout(Request $request): JsonResponse
    {
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        if ($request->user()) {
            $request->user()->currentAccessToken()->delete();
        }

        return response()->json(['success' => true]);
    }
}
