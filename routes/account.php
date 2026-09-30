<?php

use App\Http\Controllers\Account\PasswordController;
use App\Http\Controllers\Account\MyKakbimaAccountController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Account Routes
|--------------------------------------------------------------------------
|
| Here are the routes for user account management.
|
*/

// These routes require authentication, and email verification.
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('my-kakbima-account', MyKakbimaAccountController::class)
        ->name('my-kakbima-account.success');

    Route::patch('my-kakbima-account', [MyKakbimaAccountController::class, 'update'])
        ->name('my-kakbima-account.update');

    Route::post('my-kakbima-account', [MyKakbimaAccountController::class, 'update']);

    Route::delete('my-kakbima-account', [MyKakbimaAccountController::class, 'destroy'])
        ->name('my-kakbima-account.destroy');

    Route::put('my-kakbima-account/password', [PasswordController::class, 'update'])
        ->name('my-kakbima-account.password.update');
});
