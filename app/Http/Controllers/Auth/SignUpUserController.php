<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\SignUpRequest;
use App\Models\LeadStatus;
use App\Models\OpportunityStage;
use App\Models\Plan;
use App\Models\TaskStatus;
use App\Models\User;
use Exception;
use Illuminate\Auth\Events\Registered;
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

            // Assign role and settings to the user
            defaultRoleAndSetting($user);

            // Create default lead statuses
            $this->createDefaultLeadStatuses($user->id);

            // Create default opportunity stages
            $this->createDefaultOpportunityStages($user->id);

            // Create default task statuses
            $this->createDefaultTaskStatuses($user->id);

            return $user;
        });

        Auth::login($user);

        event(new Registered($user));

        return redirect()
            ->route('authenticated.verification.notice')
            ->with([
                'warning' => __('Verify your email to complete account setup.'),
            ]);
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

    /**
     * Create default lead statuses for new organization
     */
    private function createDefaultLeadStatuses($userId): void
    {
        $defaultStatuses = [
            ['name' => 'New', 'color' => '#3B82F6'],
            ['name' => 'Contacted', 'color' => '#F59E0B'],
            ['name' => 'Qualified', 'color' => '#10b77f'],
            ['name' => 'Proposal sent', 'color' => '#8B5CF6'],
            ['name' => 'Converted', 'color' => '#059669'],
            ['name' => 'Lost', 'color' => '#EF4444'],
        ];

        foreach ($defaultStatuses as $status) {
            LeadStatus::create([
                'name' => $status['name'],
                'color' => $status['color'],
                'status' => 'active',
                'created_by' => $userId,
            ]);
        }
    }

    /**
     * Create default opportunity stages for new organization
     */
    private function createDefaultOpportunityStages($userId): void
    {
        $defaultStages = [
            ['name' => 'Prospecting', 'color' => '#6B7280', 'probability' => 10],
            ['name' => 'Qualification', 'color' => '#3B82F6', 'probability' => 25],
            ['name' => 'Proposal', 'color' => '#F59E0B', 'probability' => 50],
            ['name' => 'Negotiation', 'color' => '#8B5CF6', 'probability' => 75],
            ['name' => 'Closed won', 'color' => '#10b77f', 'probability' => 100],
            ['name' => 'Closed lost', 'color' => '#EF4444', 'probability' => 0],
        ];

        foreach ($defaultStages as $stage) {
            OpportunityStage::create([
                'name' => $stage['name'],
                'color' => $stage['color'],
                'probability' => $stage['probability'],
                'status' => 'active',
                'created_by' => $userId,
            ]);
        }
    }

    /**
     * Create default task statuses for new organization
     */
    private function createDefaultTaskStatuses($userId): void
    {
        $defaultStatuses = [
            ['name' => 'To do', 'color' => '#6B7280'],
            ['name' => 'In progress', 'color' => '#3B82F6'],
            ['name' => 'Review', 'color' => '#F59E0B'],
            ['name' => 'Done', 'color' => '#10b77f'],
        ];

        foreach ($defaultStatuses as $status) {
            TaskStatus::create([
                'name' => $status['name'],
                'color' => $status['color'],
                'status' => 'active',
                'created_by' => $userId,
            ]);
        }
    }
}
