<?php

namespace App\Http\Controllers;

use App\Events\AccountCreate;
use App\Exports\AccountExport;
use App\Models\Account;
use App\Models\AccountActivity;
use App\Models\AccountIndustry;
use App\Models\AccountType;
use App\Models\Call;
use App\Models\Meeting;
use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class AccountController extends Controller
{
    public function index(Request $request)
    {
        $query = Account::query()
            ->with(['assignedUser', 'accountType', 'accountIndustry'])
            ->where('created_by', createdBy());

        // Handle search
        if ($request->has('search') && !empty($request->search)) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('email', 'like', '%' . $request->search . '%')
                    ->orWhere('phone', 'like', '%' . $request->search . '%');
            });
        }

        // Handle type filter
        if ($request->has('type') && !empty($request->type) && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        // Handle account_type_id filter
        if ($request->has('account_type_id') && !empty($request->account_type_id) && $request->account_type_id !== 'all') {
            $query->where('account_type_id', $request->account_type_id);
        }

        // Handle account_industry_id filter
        if ($request->has('account_industry_id') && !empty($request->account_industry_id) && $request->account_industry_id !== 'all') {
            $query->where('account_industry_id', $request->account_industry_id);
        }

        // Handle status filter
        if ($request->has('status') && !empty($request->status) && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Handle assigned_to filter
        if ($request->has('assigned_to') && !empty($request->assigned_to) && $request->assigned_to !== 'all') {
            $query->where('assigned_to', $request->assigned_to);
        }

        // Handle sorting
        $sortField = $request->input('sort_field', 'id');
        $sortDirection = $request->input('sort_direction', 'desc');
        $allowedSorts = ['id', 'name', 'email', 'created_at'];
        $allowedDirection = ['asc', 'desc'];
        if (!in_array($sortDirection, $allowedDirection)) {
            $sortDirection = 'desc';
        }
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortDirection);
        }

        $defaultPerPage = $request->view === 'grid' ? 12 : 10;
        $perPage = max(1, min(200, (int)$request->get('per_page', $defaultPerPage)));
        $accounts = $query->paginate($perPage)->withQueryString();

        // Get users for assignment dropdown
        $userQuery = User::where('created_by', createdBy());
        $allUsers = (clone $userQuery)->select('id', 'name', 'email')->get();
        $users = (clone $userQuery)->where('status', 'active')->select('id', 'name', 'email')->get();

        $accountTypeQuery = AccountType::where('created_by', createdBy());
        $allAccountTypes = (clone $accountTypeQuery)->get(['id', 'name']);
        $accountTypes = (clone $accountTypeQuery)->where('status', 'active')->get(['id', 'name']);

        $accountIndustryQuery = AccountIndustry::where('created_by', createdBy());
        $allAccountIndustries = (clone $accountIndustryQuery)->get(['id', 'name']);
        $accountIndustries = (clone $accountIndustryQuery)->where('status', 'active')->get(['id', 'name']);

        // Get plan limits for organization users
        $planLimits = null;
        $organization = User::find(createdBy());
        if ($organization && $organization->plan) {
            $currentAccountsCount = Account::where('created_by', createdBy())->count();
            $planLimits = [
                'maximum_accounts' => $organization->plan->maximum_accounts,
                'current_accounts' => $currentAccountsCount,
                'can_create' => $currentAccountsCount < $organization->plan->maximum_accounts,
            ];
        }

        return Inertia::render('accounts/index', [
            'accounts' => $accounts,
            'users' => $users,
            'allUsers' => $allUsers,
            'accountTypes' => $accountTypes,
            'allAccountTypes' => $allAccountTypes,
            'accountIndustries' => $accountIndustries,
            'allAccountIndustries' => $allAccountIndustries,
            'planLimits' => $planLimits,
            'filters' => $request->all(['search', 'account_type_id', 'account_industry_id', 'status', 'assigned_to', 'sort_field', 'sort_direction', 'per_page', 'view', 'page']),
        ]);
    }

    public function store(Request $request)
    {
        // Check plan limits for organization users
        if (auth()->user()->type === 'organization') {
            $organization = User::find(createdBy());
            if ($organization && $organization->plan) {
                $currentAccountsCount = Account::where('created_by', createdBy())->count();
                if ($currentAccountsCount >= $organization->plan->maximum_accounts) {
                    return redirect()->back()->with('error', __('Account limit reached. Your plan allows maximum :max accounts.', ['max' => $organization->plan->maximum_accounts]));
                }
            }
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:accounts,email,NULL,id,created_by,' . createdBy(),
            'phone' => 'nullable|string|max:255',
            'website' => 'nullable|url|max:255',
            'account_type_id' => 'required|exists:account_types,id',
            'account_industry_id' => 'required|exists:account_industries,id',
            'billing_address' => 'required|string',
            'billing_city' => 'required|string|max:255',
            'billing_state' => 'required|string|max:255',
            'billing_postal_code' => 'required|string|max:255',
            'billing_country' => 'required|string|max:255',
            'shipping_address' => 'nullable|string',
            'shipping_city' => 'nullable|string|max:255',
            'shipping_state' => 'nullable|string|max:255',
            'shipping_postal_code' => 'nullable|string|max:255',
            'shipping_country' => 'nullable|string|max:255',
            'status' => 'nullable|in:active,inactive',
            'assigned_to' => 'required|exists:users,id',
        ]);

        $validated['created_by'] = createdBy();
        $validated['status'] = $validated['status'] ?? 'active';

        $account = Account::create($validated);
        if ($account && !IsDemo()) {
            event(new AccountCreate($account));
        }

        // Check for errors and combine them
        $emailError = session()->pull('email_error');
        $twilioError = session()->pull('twilio_error');

        $errors = [];
        if ($emailError) {
            $errors[] = __('Email send failed: ') . $emailError;
        }
        if ($twilioError) {
            $errors[] = __('SMS send failed: ') . $twilioError;
        }

        if (!empty($errors)) {
            $message = __('Account created successfully, but ') . implode(', ', $errors);

            return redirect()->back()->with('warning', $message);
        }

        return redirect()->route('accounts.index')->with('success', __('Account created successfully.'));
    }

    public function create()
    {
        $accountTypes = AccountType::where('created_by', createdBy())
            ->where('status', 'active')
            ->get(['id', 'name']);

        $accountIndustries = AccountIndustry::where('created_by', createdBy())
            ->where('status', 'active')
            ->get(['id', 'name']);

        $users = User::where('created_by', createdBy())
            ->where('status', 'active')
            ->select('id', 'name', 'email')
            ->get();

        return Inertia::render('accounts/create', [
            'accountTypes' => $accountTypes,
            'accountIndustries' => $accountIndustries,
            'users' => $users,
        ]);
    }

    public function show($id)
    {
        $account = Account::with(['assignedUser', 'creator', 'accountType', 'accountIndustry', 'activities.user', 'comments.user', 'contacts', 'quotes'])
            ->where('created_by', createdBy())
            ->where('id', $id)
            ->first();
        if ($account) {

            $parentMeetings = Meeting::where('created_by', createdBy())
                ->where('parent_module', 'account')->where('parent_id', $id)
                ->with(['creator', 'assignedUser'])->get();

            $parentCalls = Call::where('created_by', createdBy())
                ->where('parent_module', 'account')->where('parent_id', $id)
                ->with(['creator', 'assignedUser'])->get()
                ->map(function ($call) {
                    $call->type = 'call';

                    return $call;
                });

            $meetings = $parentMeetings->merge($parentCalls)->sortByDesc('start_date')->values();

            return Inertia::render('accounts/show', [
                'account' => $account,
                'streamItems' => $account->activities()->orderBy('id', 'desc')->get(),
                'meetings' => $meetings,
            ]);
        } else {
            return redirect()->route('accounts.index')->with('error', __('Account not found.'));
        }
    }

    public function edit($accountId)
    {
        $account = Account::where('id', $accountId)
            ->where('created_by', createdBy())
            ->first();

        if (!$account) {
            return redirect()->route('accounts.index')->with('error', __('Account not found.'));
        }

        $accountTypes = AccountType::where('created_by', createdBy())
            ->where('status', 'active')->get(['id', 'name']);

        $accountIndustries = AccountIndustry::where('created_by', createdBy())
            ->where('status', 'active')->get(['id', 'name']);

        $users = User::where('created_by', createdBy())
            ->where('status', 'active')->select('id', 'name', 'email')->get();

        return Inertia::render('accounts/edit', [
            'account' => $account,
            'accountTypes' => $accountTypes,
            'accountIndustries' => $accountIndustries,
            'users' => $users,
        ]);
    }

    public function update(Request $request, $accountId)
    {
        $account = Account::where('id', $accountId)
            ->where('created_by', createdBy())
            ->first();

        if ($account) {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|max:255|unique:accounts,email,' . $accountId . ',id,created_by,' . createdBy(),
                'phone' => 'nullable|string|max:255',
                'website' => 'nullable|url|max:255',
                'account_type_id' => 'required|exists:account_types,id',
                'account_industry_id' => 'required|exists:account_industries,id',
                'billing_address' => 'required|string',
                'billing_city' => 'required|string|max:255',
                'billing_state' => 'required|string|max:255',
                'billing_postal_code' => 'required|string|max:255',
                'billing_country' => 'required|string|max:255',
                'shipping_address' => 'nullable|string',
                'shipping_city' => 'nullable|string|max:255',
                'shipping_state' => 'nullable|string|max:255',
                'shipping_postal_code' => 'nullable|string|max:255',
                'shipping_country' => 'nullable|string|max:255',
                'status' => 'nullable|in:active,inactive',
                'assigned_to' => 'required|exists:users,id',
            ]);
            try {
                $account->update($validated);

                return redirect()->route('accounts.index')->with('success', __('Account updated successfully'));
            } catch (Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update account'));
            }
        } else {
            return redirect()->route('accounts.index')->with('error', __('Account not found.'));
        }
    }

    public function destroy($accountId)
    {
        $account = Account::where('id', $accountId)
            ->where('created_by', createdBy())
            ->first();

        if ($account) {
            try {
                $account->delete();

                return redirect()->back()->with('success', __('Account deleted successfully'));
            } catch (Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to delete account'));
            }
        } else {
            return redirect()->back()->with('error', __('Account not found.'));
        }
    }

    public function toggleStatus($accountId)
    {
        $account = Account::where('id', $accountId)
            ->where('created_by', createdBy())
            ->first();

        if ($account) {
            try {
                $account->status = $account->status === 'active' ? 'inactive' : 'active';
                $account->save();

                return redirect()->back()->with('success', __('Account status updated successfully'));
            } catch (Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update account status'));
            }
        } else {
            return redirect()->back()->with('error', __('Account not found.'));
        }
    }

    public function deleteActivities($id)
    {
        $account = Account::where('id', $id)
            ->where('created_by', createdBy())
            ->firstOrFail();

        AccountActivity::where('account_id', $account->id)->delete();

        return redirect()->back()->with('success', __('All activities deleted successfully'));
    }

    public function deleteActivity($accountId, $activityId)
    {
        $account = Account::where('id', $accountId)
            ->where('created_by', createdBy())
            ->firstOrFail();

        AccountActivity::where('id', $activityId)
            ->where('account_id', $account->id)
            ->delete();

        return redirect()->back()->with('success', __('Activity deleted successfully'));
    }

    public function fileExport()
    {
        if (!auth()->user()->can('export-accounts')) {
            return redirect()->back()->with('error', __('Permission denied.'));
        }

        $name = 'account_' . date('Y-m-d i:h:s');

        return Excel::download(new AccountExport(), $name . '.xlsx');
    }
}
