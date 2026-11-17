<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    /**
     * List administrators
     */
    public function index(): JsonResponse
    {
        $admins = Admin::orderBy('createdAt', 'desc')->get();
        return response()->json($admins);
    }

    /**
     * Store new administrator (Main Admin only)
     */
    public function store(Request $request): JsonResponse
    {
        $name = trim((string)$request->input('name'));
        $email = strtolower(trim((string)$request->input('email')));
        $phone = trim((string)$request->input('phone'));
        $password = (string)$request->input('password', 'Admin@123');

        if (!$name || !$email || !$phone) {
            return response()->json(['error' => 'Name, email, and phone are required.'], 422);
        }

        if (Admin::whereRaw('LOWER(email) = ?', [$email])->exists()) {
            return response()->json(['error' => 'An administrator with this email already exists.'], 409);
        }

        $id = (string)$request->input('id', 'adm-' . Str::random(12));

        $admin = Admin::create([
            'id' => $id,
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'passwordHash' => password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]),
            'role' => $request->input('role', 'Admin'),
            'department' => $request->input('department', 'Career & Placement Cell'),
            'permissions' => $request->input('permissions', []),
            'avatar' => $request->input('avatar'),
            'status' => 'active',
        ]);

        return response()->json($admin, 201);
    }

    /**
     * Show administrator
     */
    public function show(string $id): JsonResponse
    {
        $admin = Admin::find($id);
        if (!$admin) {
            return response()->json(['error' => 'Administrator not found.'], 404);
        }

        return response()->json($admin);
    }

    /**
     * Update administrator
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $admin = Admin::find($id);
        if (!$admin) {
            return response()->json(['error' => 'Administrator not found.'], 404);
        }

        $data = $request->only(['name', 'phone', 'department', 'avatar', 'permissions', 'status', 'role']);

        if ($request->has('password') && $request->filled('password')) {
            $data['passwordHash'] = password_hash($request->input('password'), PASSWORD_BCRYPT, ['cost' => 12]);
        }

        $admin->update($data);
        return response()->json($admin);
    }

    /**
     * Delete administrator
     */
    public function destroy(string $id): JsonResponse
    {
        $admin = Admin::find($id);
        if (!$admin) {
            return response()->json(['error' => 'Administrator not found.'], 404);
        }

        if ($admin->isMainAdmin()) {
            return response()->json(['error' => 'The primary institutional administrator cannot be removed.'], 403);
        }

        $admin->delete();
        return response()->json(['success' => true]);
    }
}
