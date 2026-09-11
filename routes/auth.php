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

// Guest routes
Route::middleware(['web', 'guest'])->group(function () {
    Route::get('sign-in', [AuthenticatedSessionController::class, 'create'])
        ->name('login');

    Route::post('sign-in', [AuthenticatedSessionController::class, 'authenticate'])
        ->middleware('throttle:5,1');

    Route::get('sign-up', [SignUpUserController::class, 'create'])
        ->name('register');
    Route::post('sign-up', [SignUpUserController::class, 'register']);

    Route::get('account-recovery', [PasswordResetLinkController::class, 'create'])
        ->name('password.request');

    Route::post('account-recovery', [PasswordResetLinkController::class, 'store'])
        ->middleware('throttle:3,5')
        ->name('password.email');

    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])
        ->name('password.reset');

    Route::post('reset-password', [NewPasswordController::class, 'store'])
        ->name('password.store');
});

Route::get('verify-email/{token}', VerifyEmailTokenController::class)
    ->middleware(['web', 'throttle:6,1'])
    ->name('verification-verify.token');

// Auth routes
Route::middleware(['web', 'auth'])->group(function () {
    Route::get('verify-email', EmailVerificationPromptController::class)
        ->name('verification.notice');

    Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])
        ->name('password.confirm');

    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);

    Route::post('sign-out', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});
