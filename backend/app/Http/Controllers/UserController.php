<?php
namespace App\Http\Controllers;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Get all users
     */
    public function index()
    {
        $users = User::all(); // ✅ get() → all() plus explicite
        return response()->json($users);
    }

    /**
     * Store a new user (Admin)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255|unique:users',
            'email'    => 'required|email|unique:users',
            'phone'    => 'nullable|string|max:20',
            'password' => 'required|string|min:8',
            'is_admin' => 'boolean',
        ]);

        $validated['password'] = bcrypt($validated['password']);
        $validated['name']     = trim($validated['name']);
        $validated['email']    = strtolower(trim($validated['email']));

        $isAdmin = $validated['is_admin'] ?? false;
        unset($validated['is_admin']);

        $user = User::create($validated);
        $user->forceFill(['is_admin' => $isAdmin])->save();

        return response()->json($user->fresh(), 201);
    }

    /**
     * Update user (Admin)
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name'     => 'sometimes|string|max:255|unique:users,name,' . $user->id,
            'email'    => 'sometimes|email|unique:users,email,' . $user->id,
            'phone'    => 'nullable|string|max:20',
            'password' => 'sometimes|string|min:8',
            'is_admin' => 'boolean',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = bcrypt($validated['password']);
        }

        if (isset($validated['name']))  $validated['name']  = trim($validated['name']);
        if (isset($validated['email'])) $validated['email'] = strtolower(trim($validated['email']));

        $isAdmin = $validated['is_admin'] ?? null;
        unset($validated['is_admin']);

        // Prevent removing admin rights from the last administrator
        if ($isAdmin === false && $user->is_admin) {
            $adminCount = User::where('is_admin', true)->count();
            if ($adminCount <= 1) {
                return response()->json([
                    'message' => 'Impossible de rétrograder le dernier administrateur.'
                ], 403);
            }
        }

        $user->update($validated);

        if (!is_null($isAdmin)) {
            $user->forceFill(['is_admin' => $isAdmin])->save();
        }

        return response()->json($user->fresh());
    }

    /**
     * Delete user (Admin)
     */
    public function destroy(User $user)
    {
        if ($user->id === auth('api')->id()) {
            return response()->json(['message' => 'Vous ne pouvez pas supprimer votre propre compte.'], 403);
        }
        $user->delete();
        return response()->json(['message' => 'User deleted']);
    }
}