<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\SignUpUserController;
use App\Http\Controllers\Auth\VerifyEmailTokenController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
|
| Routes for signing in, signing up, verifying email addresses,
| recovering passwords, and signing out of Kakbima.
|
*/

// Routes accessible only to unauthenticated users.
Route::middleware(['web', 'guest'])->group(function () {
    Route::get('sign-in', [AuthenticatedSessionController::class, 'create'])
        ->name('sign-in');

    Route::post('sign-in', [AuthenticatedSessionController::class, 'authenticate'])
        ->middleware('throttle:5,1');

    Route::get('sign-up', [SignUpUserController::class, 'create'])
        ->name('sign-up');

    Route::post('sign-up', [SignUpUserController::class, 'sign-up']);
    Route::get('account-recovery', [PasswordResetLinkController::class, 'create'])
        ->name('account-recovery-request');

    Route::post('account-recovery', [PasswordResetLinkController::class, 'store'])
        ->middleware('throttle:3,5')
        ->name('account-recovery-mail');

    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])
        ->name('account-recovery-token');

    Route::post('reset-password', [NewPasswordController::class, 'store'])
        ->name('account-recovery-save');
});

// Verify the user's email address using the verification token.
Route::get('verify-email/{token}', VerifyEmailTokenController::class)
    ->middleware(['web', 'throttle:6,1'])
    ->name('verify-email-token');

// Routes available only to authenticated users.
Route::middleware(['web', 'auth'])->group(function () {
    Route::get('verify-email', EmailVerificationPromptController::class)
        ->name('authenticated.verification.notice');

    Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('authenticated.verification.send');

    Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])
        ->name('authenticated.password.confirm');

    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);

    Route::post('sign-out', [AuthenticatedSessionController::class, 'destroy'])
        ->name('authenticated.logout');
});
