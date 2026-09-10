<?php

namespace App\Http\Controllers;

use App\Events\UserCreated;
use App\Models\LeadStatus;
use App\Models\OpportunityStage;
use App\Models\Plan;
use App\Models\PlanOrder;
use App\Models\TaskStatus;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class OrganizationController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query()
            ->where('type', 'organization')
            ->with('plan');

        // Apply search filter
        if ($request->has('search') && !empty($request->search)) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('email', 'like', "%{$request->search}%");
            });
        }

        // Apply status filter
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Apply date filters
        if ($request->has('start_date') && !empty($request->start_date)) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->has('end_date') && !empty($request->end_date)) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }


        // Apply sorting
        $sortField = $request->input('sort_field', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc');
        $allowedSorts = ['name', 'created_at'];
        $allowedDirection = ['asc', 'desc'];

        if (!in_array($sortDirection, $allowedDirection)) {
            $sortDirection = 'desc';
        }

        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortDirection);
        }

        // Get paginated results
        $defaultPerPage = $request->view === 'grid' ? 12 : 10;
        $perPage = $request->input('per_page', $defaultPerPage);
        if (!is_numeric($perPage) || $perPage < 1 || $perPage > 200) {
            $perPage = $defaultPerPage;
        }
        $organizations = $query->paginate((int)$perPage)->withQueryString();

        // Transform data for frontend
        $organizations->getCollection()->transform(function ($organization) {
            return [
                'id' => $organization->id,
                'name' => $organization->name,
                'email' => $organization->email,
                'avatar' => $organization->avatar,
                'status' => $organization->status,
                'created_at' => $organization->created_at,
                'plan_id' => $organization->plan_id,
                'plan_name' => $organization->plan ? $organization->plan->name : __('No Plan'),
                'plan_expiry_date' => $organization->plan_expiry_date,
            ];
        });

        // Get plans for dropdown
        $plans = Plan::all(['id', 'name']);

        return Inertia::render('Organizations/Index', [
            'organizations' => $organizations,
            'plans' => $plans,
            'filters' => $request->only(['search', 'status', 'start_date', 'end_date', 'sort_field', 'sort_direction', 'per_page', 'view', 'page']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'nullable|string|min:8',
            'status' => 'required|in:active,inactive',
        ]);

        $organization = new User();
        $organization->name = $validated['name'];
        $organization->email = $validated['email'];

        // Only set password if provided
        if (isset($validated['password'])) {
            $organization->password = Hash::make($validated['password']);
        }

        $organization->type = 'organization';
        $organization->status = $validated['status'];
        $organization->created_by = createdBy() ?? 1;

        // Assign default plan
        $defaultPlan = Plan::where('is_default', true)->first();
        if ($defaultPlan) {
            $organization->plan_id = $defaultPlan->id;

            // Set plan expiry date based on plan duration
            if ($defaultPlan->duration === 'yearly') {
                $organization->plan_expiry_date = now()->addYear();
            } else {
                $organization->plan_expiry_date = now()->addMonth();
            }

            // Set plan is active
            $organization->is_plan_active = 1;
        }

        $organization->save();

        // Assign role and settings to the user
        defaultRoleAndSetting($organization);

        // Create default lead statuses for the organization
        $this->createDefaultLeadStatuses($organization->id);

        // Create default opportunity stages for the organization
        $this->createDefaultOpportunityStages($organization->id);

        // Create default task statuses for the organization
        $this->createDefaultTaskStatuses($organization->id);

        // Trigger email notification
        if (!IsDemo()) {
            event(new UserCreated($organization, $validated['password'] ?? ''));
        }

        // Check for email errors
        if (session()->has('email_error')) {
            return redirect()->back()->with('warning', __('Organization created successfully, but welcome email failed: ') . session('email_error'));
        }

        return redirect()->back()->with('success', __('Organization created successfully'));
    }

    public function update(Request $request, User $organization)
    {
        // Ensure this is a organization type user
        if ($organization->type !== 'organization') {
            return redirect()->back()->with('error', __('Invalid organization record'));
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $organization->id,
            // 'status' => 'required|in:active,inactive',
        ]);

        $organization->name = $validated['name'];
        $organization->email = $validated['email'];
        // $organization->status = $validated['status'];
        // // Only set password if provided
        // if (isset($validated['password'])) {
        //     $organization->password = Hash::make($validated['password']);
        // }

        $organization->save();

        return redirect()->back()->with('success', __('Organization updated successfully'));
    }

    public function destroy(User $organization)
    {
        // Ensure this is a organization type user
        if ($organization->type !== 'organization') {
            return redirect()->back()->with('error', __('Invalid organization record'));
        }

        $organization->delete();

        return redirect()->back()->with('success', __('Organization deleted successfully'));
    }

    public function resetPassword(Request $request, User $organization)
    {
        // Ensure this is a organization type user
        if ($organization->type !== 'organization') {
            return redirect()->back()->with('error', __('Invalid organization record'));
        }

        $validated = $request->validate([
            'password' => ['required', 'string', 'min:8'],
        ]);

        $organization->password = Hash::make($validated['password']);
        $organization->save();

        return redirect()->back()->with('success', __('Password reset successfully'));
    }

    public function toggleStatus(User $organization)
    {
        // Ensure this is a organization type user
        if ($organization->type !== 'organization') {
            return redirect()->back()->with('error', __('Invalid organization record'));
        }

        $organization->status = $organization->status === 'active' ? 'inactive' : 'active';
        $organization->save();

        return redirect()->back()->with('success', __('Organization status updated successfully'));
    }

    /**
     * Get available plans for upgrade
     */
    public function getPlans(User $organization)
    {
        // Ensure this is a organization type user
        if ($organization->type !== 'organization') {
            return response()->json(['error' => __('Invalid organization record')], 400);
        }

        $plans = Plan::where('is_plan_enabled', 'on')->get();

        // Determine the organization's current billing cycle from their latest approved plan order
        $latestPlanOrder = $organization->planOrders()
            ->where('status', 'approved')
            ->where('plan_id', $organization->plan_id)
            ->latest('processed_at')
            ->first();

        $currentBillingCycle = $latestPlanOrder ? $latestPlanOrder->billing_cycle : 'monthly';

        if ($organization->is_trial) {
            $currentBillingCycle = 'monthly';
        }

        $formattedPlans = [];

        foreach ($plans as $plan) {
            // Format features
            $features = [];
            if ($plan->features) {
                $enabledFeatures = $plan->getEnabledFeatures();
                $featureLabels = [
                    'kakbima_intelligence' => __('Kakbima Intelligence'),
                    'password_protection' => __('Password Protection'),
                ];
                foreach ($enabledFeatures as $feature) {
                    if (isset($featureLabels[$feature])) {
                        $features[] = $featureLabels[$feature];
                    }
                }
            } else {
                // Fallback to legacy columns
                if ($plan->enable_kakbima_intelligence === 'on') {
                    $features[] = __('Kakbima Intelligence');
                }
            }

            // Monthly plan
            $formattedPlans[] = [
                'id' => $plan->id,
                'name' => $plan->name,
                'price' => $plan->price,
                'duration' => 'Monthly',
                'description' => $plan->description,
                'features' => $features,
                'maximum_users' => $plan->maximum_users,
                'maximum_projects' => $plan->maximum_projects,
                'maximum_contacts' => $plan->maximum_contacts,
                'maximum_accounts' => $plan->maximum_accounts,
                'storage_limit' => $plan->storage_limit,
                'enable_branding' => $plan->enable_branding,
                'enable_kakbima_intelligence' => $plan->enable_kakbima_intelligence,
                'module' => json_decode($plan->module, true),
                'is_trial' => $plan->is_trial,
                'trial_days' => $plan->trial_days,
                'is_current' => $organization->plan_id === $plan->id && ($currentBillingCycle === 'monthly'),
                'is_default' => $plan->is_default,
            ];

            // Yearly plan (create a separate entry)
            $yearlyPrice = $plan->yearly_price ?? ($plan->price * 12 * 0.8);
            $formattedPlans[] = [
                'id' => $plan->id,
                'name' => $plan->name,
                'price' => $yearlyPrice,
                'duration' => 'Yearly',
                'description' => $plan->description,
                'features' => $features,
                'maximum_users' => $plan->maximum_users,
                'maximum_projects' => $plan->maximum_projects,
                'maximum_contacts' => $plan->maximum_contacts,
                'maximum_accounts' => $plan->maximum_accounts,
                'storage_limit' => $plan->storage_limit,
                'enable_branding' => $plan->enable_branding,
                'enable_kakbima_intelligence' => $plan->enable_kakbima_intelligence,
                'module' => json_decode($plan->module, true),
                'is_trial' => $plan->is_trial,
                'trial_days' => $plan->trial_days,
                'is_current' => $organization->plan_id === $plan->id && ($currentBillingCycle === 'yearly'),
                'is_default' => $plan->is_default,
            ];
        }

        return response()->json([
            'plans' => $formattedPlans,
            'organization' => [
                'id' => $organization->id,
                'name' => $organization->name,
                'current_plan_id' => $organization->plan_id,
            ],
        ]);
    }

    public function upgradePlan(Request $request, User $organization)
    {
        // Ensure this is a organization type user
        if ($organization->type !== 'organization') {
            return back()->with('error', __('Invalid organization record'));
        }

        $validated = $request->validate([
            'plan_id' => 'required|exists:plans,id',
            'duration' => 'required|in:yearly,monthly',
        ]);

        $plan = Plan::find($validated['plan_id']);
        if (!$plan) {
            return back()->with('error', __('Plan not found'));
        }


        // Create plan order entry for tracking
        $planOrder = new PlanOrder();
        $planOrder->user_id = $organization->id;
        $planOrder->plan_id = $plan->id;
        $planOrder->billing_cycle = $request->duration === 'yearly' ? 'yearly' : 'monthly';
        $planOrder->original_price = $request->duration === 'yearly' ? ($plan->yearly_price ?? 0) : $plan->price;
        $planOrder->discount_amount = 0;
        $planOrder->final_price = $planOrder->original_price;
        $planOrder->payment_method = 'admin_upgrade';
        $planOrder->status = 'approved';
        $planOrder->ordered_at = now();
        $planOrder->processed_at = now();
        $planOrder->processed_by = auth()->id();
        $planOrder->notes = 'Plan upgraded by super admin';
        $planOrder->save();
        // Update organization plan
        assignPlanToUser($organization, $plan, $validated['duration']);

        return back()->with('success', __('Plan upgraded successfully'));
    }

    /**
     * Create default lead statuses for a new organization
     */
    private function createDefaultLeadStatuses($organizationId)
    {
        $defaultStatuses = [
            ['name' => 'New', 'color' => '#3B82F6'],
            ['name' => 'Contacted', 'color' => '#F59E0B'],
            ['name' => 'Qualified', 'color' => '#10b77f'],
            ['name' => 'Proposal Sent', 'color' => '#8B5CF6'],
            ['name' => 'Converted', 'color' => '#059669'],
            ['name' => 'Lost', 'color' => '#EF4444'],
        ];

        foreach ($defaultStatuses as $status) {
            LeadStatus::create([
                'name' => $status['name'],
                'color' => $status['color'],
                'created_by' => $organizationId,
            ]);
        }
    }

    /**
     * Create default opportunity stages for a new organization
     */
    private function createDefaultOpportunityStages($organizationId)
    {
        $defaultStages = [
            ['name' => 'Prospecting', 'color' => '#6B7280', 'probability' => 10],
            ['name' => 'Qualification', 'color' => '#3B82F6', 'probability' => 25],
            ['name' => 'Proposal', 'color' => '#F59E0B', 'probability' => 50],
            ['name' => 'Negotiation', 'color' => '#8B5CF6', 'probability' => 75],
            ['name' => 'Closed Won', 'color' => '#10b77f', 'probability' => 100],
            ['name' => 'Closed Lost', 'color' => '#EF4444', 'probability' => 0],
        ];

        foreach ($defaultStages as $stage) {
            OpportunityStage::create([
                'name' => $stage['name'],
                'color' => $stage['color'],
                'probability' => $stage['probability'],
                'status' => 'active',
                'created_by' => $organizationId,
            ]);
        }
    }

    /**
     * Create default task statuses for a new organization
     */
    private function createDefaultTaskStatuses($organizationId)
    {
        $defaultStatuses = [
            ['name' => 'To Do', 'color' => '#6B7280'],
            ['name' => 'In Progress', 'color' => '#3B82F6'],
            ['name' => 'Review', 'color' => '#F59E0B'],
            ['name' => 'Done', 'color' => '#10b77f'],
        ];

        foreach ($defaultStatuses as $status) {
            TaskStatus::create([
                'name' => $status['name'],
                'color' => $status['color'],
                'status' => 'active',
                'created_by' => $organizationId,
            ]);
        }
    }
}
