<?php

namespace App\Http\Controllers;

use App\Models\Currency;
use App\Models\Referral;
use App\Models\PayoutRequest;
use App\Models\ReferralSetting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReferralController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $settings = ReferralSetting::current();

        if ($user->isSuperAdmin()) {
            return $this->superAdminView($settings);
        } else {
            return $this->organizationView($user, $settings);
        }
    }

    private function superAdminView($settings)
    {
        $totalReferralUsers = User::whereNotNull('referral_code_used')->where('referral_code_used', '!=', 0)->count();
        $pendingPayouts = PayoutRequest::where('status', 'pending')->count();
        $totalCommissionPaid = PayoutRequest::where('status', 'approved')->sum('amount');

        $monthlyReferrals = User::whereNotNull('referral_code_used')
            ->selectRaw('MONTH(created_at) as month, COUNT(*) as count')
            ->whereYear('created_at', date('Y'))
            ->groupBy('month')
            ->pluck('count', 'month')
            ->toArray();

        $monthlyPayouts = PayoutRequest::where('status', 'approved')
            ->selectRaw('MONTH(created_at) as month, SUM(amount) as total')
            ->whereYear('created_at', date('Y'))
            ->groupBy('month')
            ->pluck('total', 'month')
            ->toArray();

        $topOrganizations = User::select('users.id', 'users.name', 'users.email', 'users.avatar', 'users.referral_code')
            ->selectRaw('COUNT(referrals.id) as referral_count, SUM(referrals.amount) as total_earned')
            ->leftJoin('referrals', 'users.id', '=', 'referrals.organization_id')
            ->where('users.type', 'organization')
            ->whereNotNull('users.referral_code')
            ->groupBy('users.id', 'users.name', 'users.email', 'users.avatar', 'users.referral_code')
            ->orderByDesc('referral_count')
            ->limit(10)
            ->get();

        $payoutRequests = PayoutRequest::with('organization')
            ->orderBy('created_at', 'desc')
            ->paginate(10);
        // Always use super admin currency for plan pricing
        $superAdmin = User::where('type', 'super_admin')->first();
        $superAdminSettings = settings($superAdmin->id);
        $currency = $superAdminSettings ? ($superAdminSettings['defaultCurrency'] ?? 'USD') : 'USD';
        $currencySymbol = '$';
        if (!empty($currency)) {
            $currencyData = Currency::where('code', $currency)->first();
            $currencySymbol = $currencyData ? $currencyData->symbol : '$';
        }

        // $referredUsers = User::whereNotNull('referral_code_used')
        //     ->with(['plan', 'referrals', 'planOrders' => function ($query) {
        //         $query->where('status', 'approved')->orderBy('created_at', 'desc')->limit(1);
        //     }])
        //     ->where('referral_code_used', '!=', 0)
        //     ->orderBy('created_at', 'desc')
        //     ->paginate(5)
        //     ->withQueryString();

        // Get all referred users for the organization with pagination
        $referredUsersQuery = User::whereNotNull('referral_code_used')
            ->with(['plan', 'referrals', 'planOrders' => function ($query) {
                $query->where('status', 'approved')->orderBy('created_at', 'desc')->limit(1);
            }])
            ->where('referral_code_used', '!=', 0)
            ->orderBy('created_at', 'desc');

        $usersWithPlans = (clone $referredUsersQuery)->whereHas('plan', function ($query) {
            $query->where('is_default', 0);
        })->count();

        $totalCommissionEarned = (clone $referredUsersQuery)
            ->with('referrals')
            ->get()
            ->pluck('referrals')
            ->flatten()
            ->sum('amount');

        $referredUsers = (clone $referredUsersQuery)->paginate(5)
            ->withQueryString();

        return Inertia::render('referral/index', [
            'userType' => 'super_admin',
            'settings' => $settings,
            'stats' => [
                'totalReferralUsers' => $totalReferralUsers,
                'pendingPayouts' => $pendingPayouts,
                'totalCommissionPaid' => $totalCommissionPaid,
                'monthlyReferrals' => $monthlyReferrals,
                'monthlyPayouts' => $monthlyPayouts,
                'topOrganizations' => $topOrganizations,
            ],
            'payoutRequests' => $payoutRequests,
            'usersWithPlans' => $usersWithPlans,
            'totalCommissionEarned' => $totalCommissionEarned,
            'referredUsers' => $referredUsers,
            'currency' => $currency,
            'currencySymbol' => $currencySymbol
        ]);
    }

    private function organizationView($user, $settings)
    {
        $totalReferrals = Referral::where('organization_id', $user->id)->count();
        $totalEarned = Referral::where('organization_id', $user->id)->sum('amount');
        $totalPayoutRequests = PayoutRequest::where('organization_id', $user->id)->count();
        $pendingAmount = PayoutRequest::where('organization_id', $user->id)
            ->where('status', 'pending')
            ->sum('amount');
        $availableBalance = $totalEarned - PayoutRequest::where('organization_id', $user->id)
            ->whereIn('status', ['pending', 'approved'])
            ->sum('amount');

        $payoutRequests = PayoutRequest::where('organization_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        // Get referred users count (users who used this organization's referral code)
        $referredUsersCount = User::where('referral_code_used', $user->referral_code)->count();

        // Get recent referred users
        $recentReferredUsers = User::where('referral_code_used', $user->referral_code)
            ->with(['plan', 'planOrders' => function ($query) {
                $query->where('status', 'approved')->orderBy('created_at', 'desc')->limit(1);
            }])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // Generate referral code if not exists (same logic as UserObserver)
        if (!$user->referral_code) {
            do {
                $code = rand(100000, 999999);
            } while (User::where('referral_code', $code)->exists());
            $user->referral_code = $code;
            $user->save();
        }

        $referralLink = url('/register?ref=' . $user->referral_code);

        // Get all referred users for the organization with pagination
        $referredUsersQuery = User::where('referral_code_used', $user->referral_code)
            ->with(['plan', 'referrals', 'planOrders' => function ($query) {
                $query->where('status', 'approved')->orderBy('created_at', 'desc')->limit(1);
            }])
            ->orderBy('created_at', 'desc');

        $usersWithPlans = (clone $referredUsersQuery)->whereHas('plan', function ($query) {
            $query->where('is_default', 0);
        })->count();

        $totalCommissionEarned = (clone $referredUsersQuery)
            ->with('referrals')
            ->get()
            ->pluck('referrals')
            ->flatten()
            ->sum('amount');

        $referredUsers = (clone $referredUsersQuery)->paginate(5)
            ->withQueryString();

        // Always use super admin currency for plan pricing
        $superAdmin = User::where('type', 'super_admin')->first();
        $superAdminSettings = settings($superAdmin->id);
        $currency = $superAdminSettings ? ($superAdminSettings['defaultCurrency'] ?? 'USD') : 'USD';
        $currencySymbol = '$';
        if (!empty($currency)) {
            $currencyData = Currency::where('code', $currency)->first();
            $currencySymbol = $currencyData ? $currencyData->symbol : '$';
        }

        return Inertia::render('referral/index', [
            'userType' => 'organization',
            'settings' => $settings,
            'stats' => [
                'totalReferrals' => $totalReferrals,
                'totalEarned' => $totalEarned,
                'totalPayoutRequests' => $totalPayoutRequests,
                'availableBalance' => $availableBalance,
                'referredUsersCount' => $referredUsersCount,
            ],
            'payoutRequests' => $payoutRequests,
            'referralLink' => $referralLink,
            'usersWithPlans' => $usersWithPlans,
            'totalCommissionEarned' => $totalCommissionEarned,
            'recentReferredUsers' => $recentReferredUsers,
            'referredUsers' => $referredUsers,
            'currency' => $currency,
            'currencySymbol' => $currencySymbol
        ]);
    }


    public function updateSettings(Request $request)
    {
        $request->validate([
            'commission_percentage' => 'required|numeric|min:0|max:100',
            'threshold_amount' => 'required|numeric|min:0',
            'guidelines' => 'nullable|string',
            'is_enabled' => 'boolean',
        ]);

        $settings = ReferralSetting::current();
        $settings->update($request->all());

        return back()->with('success', __('Referral settings updated successfully'));
    }

    public function createPayoutRequest(Request $request)
    {
        $user = Auth::user();
        $settings = ReferralSetting::current();

        $request->validate([
            'amount' => 'required|numeric|min:1',
        ]);

        $totalEarned = Referral::where('organization_id', $user->id)->sum('amount');
        $totalRequested = PayoutRequest::where('organization_id', $user->id)
            ->whereIn('status', ['pending', 'approved'])
            ->sum('amount');
        $availableBalance = $totalEarned - $totalRequested;

        if ($request->amount > $availableBalance) {
            return back()->withErrors(['amount' => __('Insufficient balance')]);
        }

        if ($request->amount < $settings->threshold_amount) {
            return back()->withErrors(['amount' => __('Amount must be at least $ :amount', ['amount' => $settings->threshold_amount])]);
        }

        PayoutRequest::create([
            'organization_id' => $user->id,
            'amount' => $request->amount,
            'status' => 'pending',
        ]);

        return back()->with('success', __('Payout request submitted successfully'));
    }

    public function approvePayoutRequest(PayoutRequest $payoutRequest)
    {
        $payoutRequest->update(['status' => 'approved']);
        return back()->with('success', __('Payout request approved'));
    }

    public function rejectPayoutRequest(PayoutRequest $payoutRequest, Request $request)
    {
        $payoutRequest->update([
            'status' => 'rejected',
            'notes' => $request->notes,
        ]);
        return back()->with('success', __('Payout request rejected'));
    }


    public function getReferredUsers(Request $request)
    {
        $user = Auth::user();
        // Always use super admin currency for plan pricing
        $superAdmin = User::where('type', 'super_admin')->first();
        $superAdminSettings = settings($superAdmin->id);
        $currency = $superAdminSettings ? ($superAdminSettings['defaultCurrency'] ?? 'USD') : 'USD';
        $currencySymbol = '$';
        if (!empty($currency)) {
            $currencyData = Currency::where('code', $currency)->first();
            $currencySymbol = $currencyData ? $currencyData->symbol : '$';
        }
        if ($user->isSuperAdmin()) {
            // Super admin can see all referred users
            $referredUsers = User::whereNotNull('referral_code_used')
                ->with(['plan', 'referrals', 'planOrders' => function ($query) {
                    $query->where('status', 'approved')->orderBy('created_at', 'desc')->limit(1);
                }])
                ->where('referral_code_used', '!=', 0)
                ->orderBy('created_at', 'desc')
                ->paginate(15)
                ->withQueryString();
        } else {
            // Organization can see users who used their referral code
            $referredUsers = User::where('referral_code_used', $user->referral_code)
                ->with(['plan', 'referrals', 'planOrders' => function ($query) {
                    $query->where('status', 'approved')->orderBy('created_at', 'desc')->limit(1);
                }])
                ->orderBy('created_at', 'desc')
                ->paginate(15)
                ->withQueryString();
        }
        return Inertia::render('referral/referred-users', [
            'referredUsers' => $referredUsers,
            'userType' => $user->isSuperAdmin() ? 'super_admin' : 'organization',
            'currency' => $currency,
            'currencySymbol' => $currencySymbol
        ]);
    }

    /**
     * Create referral record when user purchases a plan
     */
    public static function createReferralRecord(User $user, $billingCycle = null)
    {
        $settings = ReferralSetting::current();

        if (!$settings->is_enabled || !$user->referral_code_used || !$user->plan) {
            return;
        }

        // Check if referral record already exists
        $existingReferral = Referral::where('user_id', $user->id)
            ->where('plan_id', $user->plan_id)
            ->first();

        if ($existingReferral) {
            return; // Already created
        }

        $referrer = User::where('referral_code', $user->referral_code_used)
            ->where('type', 'organization')
            ->first();

        if (!$referrer) {
            return;
        }

        // Get the actual paid amount from the most recent plan order
        $planOrder = \App\Models\PlanOrder::where('user_id', $user->id)
            ->where('plan_id', $user->plan_id)
            ->where('status', 'approved')
            ->orderBy('created_at', 'desc')
            ->first();

        // Use the actual paid amount if available, otherwise use plan price based on billing cycle
        if ($planOrder && $planOrder->final_price > 0) {
            $planPrice = $planOrder->final_price;
        } elseif ($planOrder && $planOrder->billing_cycle === 'yearly' && $user->plan->yearly_price) {
            $planPrice = $user->plan->yearly_price;
        } else {
            $planPrice = $user->plan->price ?? 0;
        }
        $commissionAmount = ($planPrice * $settings->commission_percentage) / 100;

        if ($commissionAmount > 0) {
            Referral::create([
                'user_id' => $user->id,
                'organization_id' => $referrer->id,
                'commission_percentage' => $settings->commission_percentage,
                'amount' => $commissionAmount,
                'plan_id' => $user->plan_id,
            ]);
        }
    }
}
