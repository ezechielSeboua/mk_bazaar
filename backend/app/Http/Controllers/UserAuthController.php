<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

class UserAuthController extends Controller
{
    /**
     * Register a new client account
     */
    public function register(Request $request)
    {
        $request->validate([
            'name'                  => 'required|string|max:255',
            'email'                 => 'required|email|unique:users,email',
            'password'              => 'required|string|min:8|confirmed',
            'phone'                 => 'nullable|string|max:20',
        ]);

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'phone'    => $request->phone,
        ]);

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'token'      => $token,
            'token_type' => 'bearer',
            'user'       => $user,
        ], 201);
    }

    /**
     * Login user and return JWT token
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $credentials = $request->only('email', 'password');


        if (!$token = JWTAuth::attempt($credentials)) {
            return response()->json([
                'message' => 'Invalid credentials'
            ], 401);
        }

        return response()->json([
            'token' => $token,
            'token_type' => 'bearer',
            'user' => auth('api')->user()
        ]);
    }


    /**
     * Logout (invalidate token)
     */
    public function logout()
    {
        JWTAuth::invalidate(JWTAuth::getToken());

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }

    /**
     * Get authenticated user
     */
    public function me()
    {
        return response()->json(auth('api')->user());
    }

    /**
     * Update authenticated user's profile (name, phone)
     */
    public function updateProfile(Request $request)
    {
        $user = auth('api')->user();

        $validated = $request->validate([
            'name'  => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:20',
        ]);

        $user->update($validated);

        return response()->json($user->fresh());
    }

    /**
     * Upload avatar for authenticated user
     */
    public function updateAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,jpg,png,webp|max:2048',
        ]);

        $user = auth('api')->user();

        // Supprimer l'ancien avatar s'il existe
        if ($user->avatar) {
            $old = str_replace('/storage/', '', $user->avatar);
            if (\Illuminate\Support\Facades\Storage::disk('public')->exists($old)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($old);
            }
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $url  = \Illuminate\Support\Facades\Storage::url($path);

        $user->update(['avatar' => $url]);

        return response()->json($user->fresh());
    }
}
