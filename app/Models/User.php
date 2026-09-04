<?php

namespace App\Models;

use App\Services\MailConfigService;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Log;
use Lab404\Impersonate\Models\Impersonate;
use Spatie\Permission\Traits\HasRoles;

class User extends BaseAuthenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasRoles;
    use HasFactory;
    use Notifiable;
    use Impersonate;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'email_verified_at',
        'password',
        'type',
        'avatar',
        'lang',
        'delete_status',
        'plan_id',
        'plan_expiry_date',
        'requested_plan',
        'is_plan_active',
        'is_sign_in_enabled',
        'storage_limit',
        'mode',
        'created_by',
        'referral_code',
        'referral_code_used',
        'google2fa_enabled',
        'google2fa_secret',
        'status',
        'is_trial',
        'trial_days',
        'trial_expiry_date',
        'commission_amount',
        'invoice_template',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'google2fa_secret',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'plan_expiry_date' => 'date',
            'trial_expiry_date' => 'date',
            'is_plan_active' => 'integer',
            'is_active' => 'integer',
            'is_sign_in_enabled' => 'integer',
            'google2fa_enabled' => 'integer',
            'storage_limit' => 'float',
        ];
    }

    /**
     * Get the creator ID based on user type
     */
    public function creatorId()
    {
        if ($this->type == 'super_admin') {
            return $this->id;
        } elseif ($this->type == 'organization') {
            return $this->id;
        } else {
            return $this->created_by;
        }
    }

    /**
     * Check if user is super admin
     */
    public function isSuperAdministrator()
    {
        return $this->type === 'super_admin';
    }

    /**
     * Check if user is admin
     */
    public function isAdmin()
    {
        return $this->type === 'admin';
    }

    // Organizations relationship removed

    /**
     * Get the plan associated with the user.
     */
    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }

    /**
     * Check if user is on free plan
     */
    public function isOnFreePlan()
    {
        return $this->plan && $this->plan->is_default;
    }

    /**
     * Get current plan or default plan
     */
    public function getCurrentPlan()
    {
        if ($this->plan) {
            return $this->plan;
        }

        return Plan::getDefaultPlan();
    }

    /**
     * Check if user has an active plan subscription
     */
    public function hasActivePlan()
    {
        if (!$this->isTrialExpired()) {
            return true;
        }

        return $this->plan_id &&
            $this->is_plan_active &&
            ($this->plan_expiry_date !== null && $this->plan_expiry_date > now());
    }

    /**
     * Check if user's plan has expired
     */
    public function isPlanExpired()
    {
        return $this->plan_expiry_date && $this->plan_expiry_date < now();
    }

    /**
     * Check if user's trial has expired
     */
    public function isTrialExpired()
    {
        return $this->is_trial && $this->trial_expiry_date && $this->trial_expiry_date < now();
    }

    /**
     * Check if user needs to subscribe to a plan
     */
    public function needsPlanSubscription()
    {
        if ($this->isSuperAdministrator()) {
            return false;
        }

        if ($this->type !== 'organization') {
            return false;
        }

        // Check if user has no plan
        if (!$this->plan_id) {
            return true;
        }

        // Check if trial is expired
        if ($this->isTrialExpired()) {
            return true;
        }

        // Check if plan is expired (but not on trial)
        if (!$this->is_trial && $this->isPlanExpired()) {
            return true;
        }

        // Check if plan is active
        if (!$this->hasActivePlan()) {
            return true;
        }

        return false;
    }

    public function planOrders()
    {
        return $this->hasMany(PlanOrder::class);
    }

    /**
     * Check if user can be impersonated
     */
    public function canBeImpersonated()
    {
        return $this->type === 'organization';
    }

    /**
     * Check if user can impersonate others
     */
    public function canImpersonate()
    {
        return $this->isSuperAdministrator();
    }

    /**
     * Get referrals made by this organization
     */
    public function referrals()
    {
        return $this->hasMany(Referral::class, 'user_id');
    }

    /**
     * Get payout requests made by this organization
     */
    public function payoutRequests()
    {
        return $this->hasMany(PayoutRequest::class, 'organization_id');
    }

    /**
     * Get the user who created this user
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get user email template settings
     */
    public function userEmailTemplates()
    {
        return $this->hasMany(UserEmailTemplate::class);
    }

    /**
     * Get user notification template settings
     */
    public function userNotificationTemplates()
    {
        return $this->hasMany(UserNotificationTemplate::class);
    }

    /**
     * Get referral balance for organization
     */
    public function getReferralBalance()
    {
        $totalEarned = $this->referrals()->sum('amount');
        $totalRequested = $this->payoutRequests()->whereIn('status', ['pending', 'approved'])->sum('amount');

        return $totalEarned - $totalRequested;
    }

    /**
     * Send the email verification notification with dynamic config.
     */
    public function sendEmailVerificationNotification()
    {
        try {
            MailConfigService::setDynamicConfig();
            parent::sendEmailVerificationNotification();

            return ['success' => true, 'message' => 'Verification email sent successfully'];
        } catch (\Exception $e) {
            Log::error('Email verification failed', [
                'user_id' => $this->id,
                'email' => $this->email,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return ['success' => false, 'message' => 'Failed to send verification email: ' . $e->getMessage()];
        }
    }

    /**
     * Boot method to handle model events
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($user) {
            // Assign default plan to organization users if no default plan exists
            if ($user->type === 'organization' && !$user->plan_id) {
                $defaultPlan = Plan::getDefaultPlan();
                if ($defaultPlan) {
                    $user->plan_id = $defaultPlan->id;
                    $user->is_plan_active = 1;
                    $user->plan_expiry_date = now()->addMonth();
                }
            }
        });

        static::created(function ($user) {
            // Skip for super_admin
            if ($user->type === 'super_admin') {
                return;
            }

            // Set language for new users based on organization owner
            $authUser = auth()->user();
            $organizationSettings = settings();
            $userLang = isset($organizationSettings['defaultLanguage']) ? $organizationSettings['defaultLanguage'] : ($authUser?->lang ?? 'en');
            $user->lang = $userLang ?? 'en';

            // Generate referral code for organization users (same logic as UserObserver)
            if ($user->type === 'organization' && !$user->referral_code) {
                do {
                    $code = rand(100000, 999999);
                } while (User::where('referral_code', $code)->exists());
                $user->referral_code = $code;
            }

            $user->save();

            // Set layout direction based on language
            $rtlLanguages = ['ar', 'he'];
            $isRtl = in_array($userLang, $rtlLanguages);
            $layoutDirection = $isRtl ? 'right' : 'left';
            Setting::updateOrCreate(
                [
                    'key' => 'layoutDirection',
                    'user_id' => $user->id,
                ],
                [
                    'value' => $layoutDirection,
                ]
            );
        });
    }

    public function organizationDefaultData($organization)
    {
        $roles = [
            'sales-manager' => [
                'label' => 'Sales Manager',
                'description' => 'Sales Manager has access to manage sales operations',
                'permissions' => $this->getSalesManagerPermissions(),
            ],
        ];

        foreach ($roles as $name => $data) {
            $role = Role::firstOrCreate(
                [
                    'name' => $name,
                    'guard_name' => 'web',
                    'created_by' => $organization->id,
                ],
                [
                    'label' => $data['label'],
                    'description' => $data['description'],
                    'created_by' => $organization->id,
                ]
            );

            $permissions = Permission::whereIn('name', $data['permissions'])->get();
            $role->syncPermissions($permissions);
        }
    }

    public function getSalesManagerPermissions()
    {
        $permissions =
            [
                'manage-dashboard',

                'manage-media',
                'manage-own-media',
                'view-media',
                'create-media',
                'delete-media',
                'download-media',

                'manage-leads',
                'view-leads',
                'create-leads',
                'edit-leads',
                'delete-leads',
                'convert-leads',
                'import-leads',
                'export-leads',

                'manage-contacts',
                'view-contacts',
                'create-contacts',
                'edit-contacts',
                'delete-contacts',
                'export-contacts',

                'manage-accounts',
                'view-accounts',
                'create-accounts',
                'edit-accounts',
                'delete-accounts',
                'export-accounts',

                'manage-opportunities',
                'view-opportunities',
                'create-opportunities',
                'edit-opportunities',
                'delete-opportunities',
                'export-opportunities',

                'manage-quotes',
                'view-quotes',
                'create-quotes',
                'edit-quotes',
                'delete-quotes',
                'export-quotes',

                'manage-sales-orders',
                'view-sales-orders',
                'create-sales-orders',
                'edit-sales-orders',
                'delete-sales-orders',
                'export-sales-orders',

                'manage-invoices',
                'view-invoices',
                'create-invoices',
                'edit-invoices',
                'delete-invoices',
                'export-invoices',
                'send-reminder-invoices',

                'manage-delivery-orders',
                'view-delivery-orders',
                'create-delivery-orders',
                'edit-delivery-orders',
                'export-delivery-orders',

                'manage-campaigns',
                'view-campaigns',
                'create-campaigns',
                'edit-campaigns',

                'manage-products',
                'view-products',
                'import-products',
                'export-products',

                'manage-categories',
                'view-categories',

                'manage-brands',
                'view-brands',

                'manage-meetings',
                'view-meetings',
                'create-meetings',
                'edit-meetings',
                'delete-meetings',

                'manage-calls',
                'view-calls',
                'create-calls',
                'edit-calls',
                'delete-calls',

                'manage-reports',
                'view-reports',

                'manage-stream',
                'view-stream',
                'delete-stream',

                'manage-notes',
                'view-notes',
                'create-notes',
                'edit-notes',
                'delete-notes',

                'manage-announcements',
                'view-announcements',
            ];

        return $permissions;
    }

    public function getAvatarAttribute($value)
    {
        return check_file($value) ? get_file($value) : get_file('avatars/avatar.png');
    }
}
