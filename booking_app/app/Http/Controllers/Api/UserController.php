<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index() {
        return User::all();
    }

    public function store(Request $request) {
        $data = $request->validate([
            'username' => 'required|string|unique:users',
            'email' => 'required|email|unique:users',
            'password' => 'required|string',
            'role' => 'required|in:admin,user',
        ]);

        $data['password'] = Hash::make($data['password']);
        return User::create($data);
    }

    public function show(User $user) {
        return $user;
    }

    public function update(Request $request, User $user) {
        $data = $request->validate([
            'username' => 'sometimes|string|unique:users,username,' . $user->id,
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'password' => 'sometimes|string',
            'role' => 'sometimes|in:admin,user',
        ]);

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $user->update($data);
        return $user;
    }

    public function destroy(User $user) {
        $user->delete();
        return response()->json(['message' => 'Utente eliminato']);
    }
}
