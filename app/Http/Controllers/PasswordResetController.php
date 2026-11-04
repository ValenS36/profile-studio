<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{Hash, Password};
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class PasswordResetController extends Controller
{
    public function request(Request $request)
    {
        return Inertia::render('PasswordReset', ['status' => $request->session()->get('status')]);
    }

    public function email(Request $request)
    {
        $data = $request->validate(['email' => 'required|email|max:255']);
        // Return the same message for unknown, throttled and registered addresses.
        Password::sendResetLink($data);

        return back()->with('status', 'Jika email tersebut terdaftar, tautan reset password akan dikirim. Periksa inbox atau spam. Tunggu satu menit sebelum mencoba lagi.');
    }

    public function edit(Request $request, string $token)
    {
        return Inertia::render('PasswordReset', [
            'token' => $token,
            'email' => is_string($request->query('email')) ? $request->query('email') : '',
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'token' => 'required|string',
            'email' => 'required|email|max:255',
            'password' => ['required', 'confirmed', PasswordRule::min(12)],
        ]);
        $status = Password::reset($data, function (User $user, string $password) {
            $user->forceFill([
                'password' => Hash::make($password),
                'remember_token' => Str::random(60),
            ])->save();
            event(new PasswordReset($user));
        });

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['email' => 'Tautan reset tidak valid atau sudah kedaluwarsa. Silakan minta tautan baru.']);
        }

        return redirect('/login')->with('success', 'Password berhasil diperbarui. Silakan masuk dengan password baru.');
    }
}
