<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ConfirmablePasswordController extends Controller
{
    /**
     * Show the confirm password page.
     */
    public function show(Request $request): Response
    {
        return Inertia::render('Account/ConfirmPassword', [
            'intended' => url()->previous(),
        ]);
    }

    /**
     * Confirm the user's password.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate(
            [
                'password' => ['required'],
            ],
            [
                'password.required' => __('Please confirm your password to continue'),
            ]
        );

        $user = $request->user();

        if (! $user || ! Auth::guard('web')->validate([
                'email' => $user->email,
                'password' => $request->password,
            ])) {
            throw ValidationException::withMessages([
                'password' => __('The password you entered is incorrect'),
            ]);
        }

        // Mark password as confirmed
        $request->session()->put('auth.password_confirmed_at', time());

        return redirect()->intended(
            route('dashboard.index', absolute: false)
        )->with('success', __('Password confirmed successfully'));
    }
}
