<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\SignUpRequest;
use App\Models\LeadStatus;
use App\Models\OpportunityStage;
use App\Models\Plan;
use App\Models\TaskStatus;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Handles organization registration and registration-page rendering.
 *
 * Account creation and default workspace provisioning are performed
 * in a single database transaction. Authentication and registration
 * events happen only after the transaction succeeds.
 */
class SignUpUserController extends Controller
{
    /**
     * Register a new organization account.
     *
     * @throws \Throwable If account creation or provisioning fails.
     */
    public function register(SignUpRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        // Hash before opening the transaction to reduce transaction duration.
        $password = Hash::make($validated['password']);

        // Read the incoming cookie through the request.
        $locale = $request->cookie('__kb_lcl');

        $locale = is_string($locale)
        && preg_match('/\A[a-z]{2,3}(?:-[a-z0-9]{2,8})*\z/i', $locale) === 1
            ? $locale
            : 'en';

        $user = DB::transaction(function () use (
            $validated,
            $password,
            $locale,
        ): User {
            $userData = [
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $password,
                'type' => 'organization',
                'lang' => $locale,
                'is_active' => 1,
                'is_sign_in_enabled' => 1,
                'is_plan_active' => 0,
            ];

            $referralCode = $validated['referral_code'] ?? null;

            // Associate the referral only when it belongs to an organization.
            if (
                is_string($referralCode)
                && $referralCode !== ''
                && User::query()
                    ->where('referral_code', $referralCode)
                    ->where('type', 'organization')
                    ->exists()
            ) {
                $userData['referral_code_used'] = $referralCode;
            }

            $user = User::query()->create($userData);

            // Preserve existing role and settings initialization.
            defaultRoleAndSetting($user);

            $this->createDefaultLeadStatuses($user->id);
            $this->createDefaultOpportunityStages($user->id);
            $this->createDefaultTaskStatuses($user->id);

            return $user;
        });

        // Authenticate only after successful account provisioning.
        Auth::login($user);

        // Regenerate the session ID after authentication.
        $request->session()->regenerate();

        event(new Registered($user));

        return redirect()
            ->route('authenticated.verification.notice')
            ->with([
                'warning' => __('Verify your email to complete account setup.'),
            ]);
    }

    /**
     * Render the registration page with optional referral and plan details.
     */
    public function create(Request $request): Response
    {
        $referralCode = $request->query('ref');

        // Ignore malformed query parameters rather than passing arrays to queries.
        if (
            ! is_string($referralCode)
            || strlen($referralCode) > 255
        ) {
            $referralCode = null;
        }

        $encryptedPlanId = $request->query('plan');

        $planId = is_string($encryptedPlanId)
        && strlen($encryptedPlanId) <= 2048
            ? $this->resolvePlanId($encryptedPlanId)
            : null;

        $referrer = $referralCode
            ? User::query()
                ->where('referral_code', $referralCode)
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
     * Decrypt a plan ID and confirm that the plan exists.
     *
     * Invalid tokens and invalid identifiers resolve to null.
     * Database failures are allowed to propagate to Laravel's exception handler.
     */
    protected function resolvePlanId(?string $encrypted): ?int
    {
        if (! $encrypted) {
            return null;
        }

        try {
            $decrypted = decrypt($encrypted);
        } catch (DecryptException) {
            return null;
        }

        if (
            ! is_int($decrypted)
            && ! (
                is_string($decrypted)
                && ctype_digit($decrypted)
            )
        ) {
            return null;
        }

        $planId = filter_var(
            $decrypted,
            FILTER_VALIDATE_INT,
            ['options' => ['min_range' => 1]],
        );

        if ($planId === false) {
            return null;
        }

        return Plan::query()->whereKey($planId)->exists()
            ? $planId
            : null;
    }

    /**
     * Create the default lead statuses for a new organization.
     */
    private function createDefaultLeadStatuses(int $userId): void
    {
        $statuses = [
            ['name' => 'New', 'color' => '#3B82F6'],
            ['name' => 'Contacted', 'color' => '#F59E0B'],
            ['name' => 'Qualified', 'color' => '#10b77f'],
            ['name' => 'Proposal sent', 'color' => '#8B5CF6'],
            ['name' => 'Converted', 'color' => '#059669'],
            ['name' => 'Lost', 'color' => '#EF4444'],
        ];

        foreach ($statuses as $status) {
            LeadStatus::query()->create([
                ...$status,
                'status' => 'active',
                'created_by' => $userId,
            ]);
        }
    }

    /**
     * Create the default opportunity stages for a new organization.
     */
    private function createDefaultOpportunityStages(int $userId): void
    {
        $stages = [
            [
                'name' => 'Prospecting',
                'color' => '#6B7280',
                'probability' => 10,
            ],
            [
                'name' => 'Qualification',
                'color' => '#3B82F6',
                'probability' => 25,
            ],
            [
                'name' => 'Proposal',
                'color' => '#F59E0B',
                'probability' => 50,
            ],
            [
                'name' => 'Negotiation',
                'color' => '#8B5CF6',
                'probability' => 75,
            ],
            [
                'name' => 'Closed won',
                'color' => '#10b77f',
                'probability' => 100,
            ],
            [
                'name' => 'Closed lost',
                'color' => '#EF4444',
                'probability' => 0,
            ],
        ];

        foreach ($stages as $stage) {
            OpportunityStage::query()->create([
                ...$stage,
                'status' => 'active',
                'created_by' => $userId,
            ]);
        }
    }

    /**
     * Create the default task statuses for a new organization.
     */
    private function createDefaultTaskStatuses(int $userId): void
    {
        $statuses = [
            ['name' => 'To do', 'color' => '#6B7280'],
            ['name' => 'In progress', 'color' => '#3B82F6'],
            ['name' => 'Review', 'color' => '#F59E0B'],
            ['name' => 'Done', 'color' => '#10b77f'],
        ];

        foreach ($statuses as $status) {
            TaskStatus::query()->create([
                ...$status,
                'status' => 'active',
                'created_by' => $userId,
            ]);
        }
    }
}
