<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\EmailVerificationToken;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EmailVerificationNotificationController extends Controller
{
    /**
     * Send a new email verification notification.
     *
     * @param Request $request
     *
     * @return RedirectResponse
     */
    public function store(Request $request): RedirectResponse
    {
        if ($request->user()?->hasVerifiedEmail()) {
            return redirect()->intended(route('dashboard.index', absolute: false));
        }

        EmailVerificationToken::where('user_id', $request->user()?->id)->delete();

        $request->user()?->sendEmailVerificationNotification();

        return back()->with('success', __('A verification link has been sent to the email address you provided during registration'));
    }
}
