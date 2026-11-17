<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Admin;
use App\Models\Student;
use Laravel\Sanctum\PersonalAccessToken;

class PodarAuthMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $auth = null;

        // 1. Check Sanctum Bearer token
        $bearerToken = $request->bearerToken();
        if ($bearerToken) {
            $tokenRecord = PersonalAccessToken::findToken($bearerToken);
            if ($tokenRecord) {
                $user = $tokenRecord->tokenable;
                if ($user instanceof Admin) {
                    $auth = [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => 'admin',
                        'admin' => $user->toArray(),
                    ];
                } elseif ($user instanceof Student) {
                    $auth = [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => 'student',
                        'student' => $user->toArray(),
                    ];
                }
            }
        }

        // 2. Check Laravel session
        if (!$auth && $request->hasSession() && $request->session()->has('auth')) {
            $sessionAuth = $request->session()->get('auth');
            if (!empty($sessionAuth['id']) && !empty($sessionAuth['role'])) {
                if ($sessionAuth['role'] === 'admin') {
                    $admin = Admin::find($sessionAuth['id']);
                    if ($admin && $admin->status === 'active') {
                        $auth = [
                            'id' => $admin->id,
                            'name' => $admin->name,
                            'email' => $admin->email,
                            'role' => 'admin',
                            'admin' => $admin->toArray(),
                        ];
                    }
                } else {
                    $student = Student::find($sessionAuth['id']);
                    if ($student && $student->status === 'active') {
                        $auth = [
                            'id' => $student->id,
                            'name' => $student->name,
                            'email' => $student->email,
                            'role' => 'student',
                            'student' => $student->toArray(),
                        ];
                    }
                }
            }
        }

        // 3. Check PHP session (podar_session cookie interoperability)
        if (!$auth && $request->cookies->has('podar_session')) {
            $cookieVal = $request->cookies->get('podar_session');
            if ($cookieVal) {
                // If standard PHP session was started
                if (session_status() !== PHP_SESSION_ACTIVE) {
                    @session_name('podar_session');
                    @session_start();
                }
                if (!empty($_SESSION['auth'])) {
                    $sAuth = $_SESSION['auth'];
                    $role = $sAuth['role'] ?? 'student';
                    if ($role === 'admin') {
                        $admin = Admin::find($sAuth['id']);
                        if ($admin && $admin->status === 'active') {
                            $auth = [
                                'id' => $admin->id,
                                'name' => $admin->name,
                                'email' => $admin->email,
                                'role' => 'admin',
                                'admin' => $admin->toArray(),
                            ];
                        }
                    } else {
                        $student = Student::find($sAuth['id']);
                        if ($student && $student->status === 'active') {
                            $auth = [
                                'id' => $student->id,
                                'name' => $student->name,
                                'email' => $student->email,
                                'role' => 'student',
                                'student' => $student->toArray(),
                            ];
                        }
                    }
                }
            }
        }

        if (!$auth) {
            return response()->json(['error' => 'Please sign in to continue.'], 401);
        }

        // Role authorization checks if specific roles passed
        if (!empty($roles) && !in_array($auth['role'], $roles, true)) {
            return response()->json(['error' => 'Unauthorized action for your role.'], 403);
        }

        $request->attributes->set('auth', $auth);
        return $next($request);
    }
}
