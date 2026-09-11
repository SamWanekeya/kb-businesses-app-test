<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\SignUpRequest;
use App\Models\Plan;
use App\Models\User;
use Exception;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class SignUpUserController extends Controller
{
    /**
     * Handle an incoming registration request.
     *
     * @param SignUpRequest $request
     *
     * @return RedirectResponse
     */
    public function register(SignUpRequest $request): RedirectResponse
    {
        $locale = Cookie::get('__kb_lcl');

        $user = DB::transaction(function () use ($request, $locale) {
            $userData = [
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'type' => 'organization',
                'lang' => $locale ?? 'en',
                'is_active' => 1,
                'is_sign_in_enabled' => 1,
                'is_plan_active' => 0,
            ];

            if ($request->filled('referral_code')) {
                $referrer = User::where('referral_code', $request->referral_code)
                    ->where('type', 'organization')?->first();

                if ($referrer) {
                    $userData['referral_code_used'] = $request->referral_code;
                }
            }

            $user = User::create($userData);

            defaultRoleAndSetting($user);

            return $user;
        });

        Auth::login($user);
        $user->sendEmailVerificationNotification();

        return redirect()
            ->route('verification.notice')
            ->with('warning', __('Verify your email to complete account setup'));
    }

    /**
     * Show the registration page.
     */
    public function create(Request $request): Response
    {
        $referralCode = $request->input('ref');
        $planId = $this->resolvePlanId($request->input('plan'));

        $referrer = $referralCode
            ? User::where('referral_code', $referralCode)
                ->where('type', 'organization')
                ->value('name')
            : null;

        return Inertia::render('Account/SignUp', [
            'referralCode' => $referralCode,
            'planId' => $planId,
            'referrer' => $referrer,
            'settings' => settings(),
        ]);
    }

    /**
     * Resolve and validate encrypted plan ID.
     */
    protected function resolvePlanId(?string $encrypted): ?int
    {
        if (! $encrypted) {
            return null;
        }

        try {
            $planId = decrypt($encrypted);

            return Plan::whereKey($planId)->exists() ? $planId : null;
        } catch (Exception $e) {
            // Fail silently but log once for investigation
            Log::error($e);

            // Return an appropriate error response
            return null;
        }
    }
}
