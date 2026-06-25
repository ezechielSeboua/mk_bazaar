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
            'user'       => $this->safeUserData($user),
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

        // auth('api')->user() can be null if the guard hasn't loaded the user yet —
        // resolve directly from the token we just generated to guarantee a non-null result.
        $user = JWTAuth::setToken($token)->toUser();

        return response()->json([
            'token'      => $token,
            'token_type' => 'bearer',
            'user'       => $this->safeUserData($user),
        ]);
    }

    /**
     * Logout (invalidate token)
     */
    public function logout()
    {
        try {
            JWTAuth::invalidate(JWTAuth::getToken());
        } catch (\Tymon\JWTAuth\Exceptions\JWTException) {
            // Token already invalid or absent — logout is idempotent
        }

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }

    /**
     * Get authenticated user
     */
    public function me()
    {
        return response()->json($this->safeUserData(auth('api')->user()));
    }

    /**
     * Update authenticated user's profile (name, phone)
     */
    public function updateProfile(Request $request)
    {
        /** @var User $user */
        $user = auth('api')->user();

        $validated = $request->validate([
            'name'  => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:20',
        ]);

        $user->update($validated);

        return response()->json($this->safeUserData($user->fresh()));
    }

    /**
     * Upload avatar for authenticated user
     */
    public function updateAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,jpg,png,webp|max:2048',
        ]);

        /** @var User $user */
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

        return response()->json($this->safeUserData($user->fresh()));
    }

    /**
     * Refresh JWT token without re-authenticating
     */
    public function refresh()
    {
        try {
            $newToken = JWTAuth::refresh(JWTAuth::getToken());
        } catch (\Tymon\JWTAuth\Exceptions\TokenExpiredException $e) {
            return response()->json(['message' => 'Token expiré, reconnexion requise.'], 401);
        } catch (\Tymon\JWTAuth\Exceptions\JWTException $e) {
            return response()->json(['message' => 'Token invalide.'], 401);
        }

        return response()->json([
            'token'      => $newToken,
            'token_type' => 'bearer',
        ]);
    }

    /**
     * Returns only the fields the frontend needs — never timestamps or internals.
     */
    private function safeUserData(User $user): array
    {
        return [
            'id'       => $user->id,
            'name'     => $user->name,
            'email'    => $user->email,
            'phone'    => $user->phone,
            'avatar'   => $user->avatar,
            'is_admin' => (bool) $user->is_admin,
        ];
    }
}
