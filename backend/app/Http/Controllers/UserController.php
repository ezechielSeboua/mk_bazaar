<?php
namespace App\Http\Controllers;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

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

        // ✅ Normalisation pour PostgreSQL (sensible à la casse)
        $validated['name']  = trim($validated['name']);
        $validated['email'] = strtolower(trim($validated['email']));

        $user = User::create($validated);
        return response()->json($user, 201);
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

        // ✅ Normalisation à l'update aussi
        if (isset($validated['name']))  $validated['name']  = trim($validated['name']);
        if (isset($validated['email'])) $validated['email'] = strtolower(trim($validated['email']));

        $user->update($validated);

        // ✅ Rafraîchir depuis la BD après update (évite les données stale avec Postgres)
        return response()->json($user->fresh());
    }

    /**
     * Delete user (Admin)
     */
    public function destroy(User $user)
    {
        $user->delete();
        return response()->json(['message' => 'User deleted']);
    }
}