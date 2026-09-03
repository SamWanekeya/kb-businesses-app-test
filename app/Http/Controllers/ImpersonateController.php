<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ImpersonateController extends Controller
{
    public function start(Request $request, $userId)
    {
        $user = User::findOrFail($userId);

        // Log impersonation event
        Log::info('Impersonation started', [
            'acting_user_id' => auth()->id(),
            'impersonated_user_id' => $userId,
            'ip_address' => $request->ip_address(),
            'timestamp' => now(),
        ]);

        $originalUserId = auth()->id();

        // Sign in as the target user first
        auth()->loginUsingId($userId);
        // Then store original user ID in session
        session()->put('impersonated_user_id', $userId);
        session()->put('impersonated_by', $originalUserId);
        session()->save();

        return redirect('/dashboard')->with('success', __('Now impersonating :name', ['name' => $user->name]));
    }

    public function leave(Request $request)
    {
        Log::info('Impersonation ended', [
            'timestamp' => now(),
        ]);

        $originalUserId = session('impersonated_by');
        if ($originalUserId) {
            auth()->loginUsingId($originalUserId);
            session()->forget('impersonated_by');
            session()->forget('impersonated_user_id');
            session()->save();
        }

        return redirect('/organizations')->with('success', __('Returned to admin panel'));
    }
}
