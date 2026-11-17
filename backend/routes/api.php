<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\ProgramController;
use App\Http\Controllers\Api\CertificateController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\TestController;
use App\Http\Controllers\Api\ScheduleController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\SystemController;

/*
|--------------------------------------------------------------------------
| Podar Pathways - RESTful API Routes (Laravel 12 / PHP 8.2)
|--------------------------------------------------------------------------
| Full endpoint compatibility with React 19 Frontend
*/

// 1. System & Health Endpoints
Route::get('/health', [SystemController::class, 'health']);
Route::get('/settings', [SystemController::class, 'settings']);
Route::get('/settings/start-page', [SystemController::class, 'startPage']);
Route::put('/settings/start-page', [SystemController::class, 'setStartPage']);
Route::put('/settings/admin-phone', [SystemController::class, 'updateAdminPhone']);

// 2. Authentication Endpoints
Route::prefix('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/session', [AuthController::class, 'session']);
    Route::post('/resend-otp', [AuthController::class, 'resendOtp']);
    Route::post('/direct-login', [AuthController::class, 'directLogin']);

    // Student Authentication
    Route::post('/student/send-otp', [AuthController::class, 'studentSendOtp']);
    Route::post('/student/register', [AuthController::class, 'studentRegister']);
    Route::post('/student/login', [AuthController::class, 'studentLogin']);
    Route::post('/student/forgot-password/send-otp', [AuthController::class, 'studentForgotPasswordSendOtp']);
    Route::post('/student/forgot-password/reset', [AuthController::class, 'studentForgotPasswordReset']);

    // Admin Authentication (2FA)
    Route::post('/admin/login-step1', [AuthController::class, 'adminLoginStep1']);
    Route::post('/admin/verify-otp', [AuthController::class, 'adminVerifyOtp']);
});

// 3. Public Verification Routes
Route::get('/certificates/verify/{certificateNumber}', [CertificateController::class, 'publicVerify']);
Route::get('/students/{id}/public-certificates', [StudentController::class, 'publicCertificates']);

// 4. Students Management
Route::prefix('students')->group(function () {
    Route::get('/', [StudentController::class, 'index']);
    Route::post('/', [StudentController::class, 'store']);
    Route::post('/import-csv', [StudentController::class, 'importCsv']);
    Route::get('/{id}', [StudentController::class, 'show']);
    Route::put('/{id}', [StudentController::class, 'update']);
    Route::delete('/{id}', [StudentController::class, 'destroy']);
    Route::post('/{id}/change-password', [StudentController::class, 'changePassword']);
    Route::get('/{id}/certificates', [StudentController::class, 'certificates']);
    Route::get('/{id}/test-submissions', [StudentController::class, 'testSubmissions']);
});

// 5. Programs / Courses (Dual aliases /programs & /courses)
foreach (['programs', 'courses'] as $prefix) {
    Route::prefix($prefix)->group(function () {
        Route::get('/', [ProgramController::class, 'index']);
        Route::post('/', [ProgramController::class, 'store']);
        Route::get('/all-clicks', [ProgramController::class, 'allClicks']);
        Route::get('/{id}', [ProgramController::class, 'show']);
        Route::put('/{id}', [ProgramController::class, 'update']);
        Route::delete('/{id}', [ProgramController::class, 'destroy']);
        Route::post('/{id}/click', [ProgramController::class, 'trackClick']);
        Route::get('/{id}/clicks', [ProgramController::class, 'clicks']);
    });
}

// 6. Certificates Management
Route::prefix('certificates')->group(function () {
    Route::get('/', [CertificateController::class, 'index']);
    Route::post('/', [CertificateController::class, 'store']);
    Route::put('/{id}/verify', [CertificateController::class, 'verify']);
    Route::delete('/{id}', [CertificateController::class, 'destroy']);
});

// 7. Notifications
Route::prefix('notifications')->group(function () {
    Route::get('/', [NotificationController::class, 'index']);
    Route::put('/read-all', [NotificationController::class, 'readAll']);
    Route::delete('/clear/read', [NotificationController::class, 'clearRead']);
    Route::put('/{id}/read', [NotificationController::class, 'markRead']);
    Route::delete('/{id}', [NotificationController::class, 'destroy']);
});

// 8. Tests & Submissions
Route::prefix('tests')->group(function () {
    Route::get('/', [TestController::class, 'index']);
    Route::post('/', [TestController::class, 'store']);
    Route::get('/{id}', [TestController::class, 'show']);
    Route::put('/{id}', [TestController::class, 'update']);
    Route::delete('/{id}', [TestController::class, 'destroy']);
    Route::post('/{id}/submit', [TestController::class, 'submit']);
});

Route::prefix('test-submissions')->group(function () {
    Route::get('/', [TestController::class, 'submissions']);
    Route::get('/{id}', [TestController::class, 'submissionDetails']);
    Route::put('/{id}/review', [TestController::class, 'reviewSubmission']);
});

// 9. Schedules & Attendance
Route::prefix('schedules')->group(function () {
    Route::get('/', [ScheduleController::class, 'index']);
    Route::post('/', [ScheduleController::class, 'store']);
    Route::get('/{id}', [ScheduleController::class, 'show']);
    Route::put('/{id}', [ScheduleController::class, 'update']);
    Route::delete('/{id}', [ScheduleController::class, 'destroy']);
});

Route::prefix('attendance')->group(function () {
    Route::get('/', [ScheduleController::class, 'attendance']);
    Route::post('/mark', [ScheduleController::class, 'markAttendance']);
    Route::get('/summary/overview', [ScheduleController::class, 'attendanceOverview']);
    Route::get('/student/{id}', [ScheduleController::class, 'studentAttendance']);
});

// 10. Administrators
Route::prefix('admins')->group(function () {
    Route::get('/', [AdminController::class, 'index']);
    Route::post('/', [AdminController::class, 'store']);
    Route::get('/{id}', [AdminController::class, 'show']);
    Route::put('/{id}', [AdminController::class, 'update']);
    Route::delete('/{id}', [AdminController::class, 'destroy']);
});

// 11. Projects Platform
Route::prefix('projects')->group(function () {
    Route::get('/', [ProjectController::class, 'index']);
    Route::post('/', [ProjectController::class, 'store']);

    // Categories
    Route::get('/categories', [ProjectController::class, 'categories']);
    Route::post('/categories', [ProjectController::class, 'storeCategory']);
    Route::delete('/categories/{id}', [ProjectController::class, 'destroyCategory']);

    // Admin Reports & Stats
    Route::get('/admin/reports', [ProjectController::class, 'adminReports']);
    Route::delete('/admin/reports/{id}', [ProjectController::class, 'destroyReport']);
    Route::get('/admin/stats', [ProjectController::class, 'adminStats']);

    // Notifications
    Route::get('/notifications', [ProjectController::class, 'notifications']);
    Route::put('/notifications/read', [ProjectController::class, 'markNotificationsRead']);

    // Post Comments
    Route::delete('/comments/{id}', [ProjectController::class, 'destroyComment']);

    // Post Interactions
    Route::get('/{id}', [ProjectController::class, 'show']);
    Route::put('/{id}', [ProjectController::class, 'update']);
    Route::delete('/{id}', [ProjectController::class, 'destroy']);
    Route::post('/{id}/like', [ProjectController::class, 'toggleLike']);
    Route::post('/{id}/bookmark', [ProjectController::class, 'toggleBookmark']);
    Route::get('/{id}/comments', [ProjectController::class, 'comments']);
    Route::post('/{id}/comments', [ProjectController::class, 'storeComment']);
    Route::post('/{id}/report', [ProjectController::class, 'report']);
});
