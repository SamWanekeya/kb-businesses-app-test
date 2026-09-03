<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use App\Models\Plan;
use App\Models\PlanOrder;
use App\Models\PlanRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        // Super admin always gets dashboard
        if ($user->type === 'super_admin') {
            return $this->renderDashboard();
        }

        // Check if user has dashboard permission (skip if permission doesn't exist)
        try {
            if ($user->hasPermissionTo('manage-dashboard')) {
                return $this->renderDashboard();
            }
        } catch (\Exception $e) {
            // Permission doesn't exist, continue to dashboard for authenticated users
            return $this->renderDashboard();
        }

        // Redirect to first available page
        return $this->redirectToFirstAvailablePage();
    }

    public function redirectToFirstAvailablePage()
    {
        $user = auth()->user();

        // Define available routes with their permissions
        $routes = [
            ['route' => 'users.index', 'permission' => 'manage-users'],
            ['route' => 'roles.index', 'permission' => 'manage-roles'],

            ['route' => 'plans.index', 'permission' => 'manage-plans'],
            ['route' => 'referral.index', 'permission' => 'manage-referral'],
            ['route' => 'settings.index', 'permission' => 'manage-settings'],
        ];

        // Find first available route
        foreach ($routes as $routeData) {
            try {
                if ($user->hasPermissionTo($routeData['permission'])) {
                    return redirect()->route($routeData['route']);
                }
            } catch (\Exception $e) {
                // Permission doesn't exist, continue to next route
                continue;
            }
        }

        // If no permissions found, logout user
        auth()->logout();

        return redirect()->route('login')->with('error', __('No access permissions found.'));
    }

    private function renderDashboard()
    {
        $user = auth()->user();

        if ($user->type === 'super_admin') {
            return $this->renderSuperAdminDashboard();
        } else {
            return $this->renderOrganizationDashboard();
        }
    }

    private function renderSuperAdminDashboard()
    {
        $revenueYear = (int) request('revenueYear', now()->year);
        $organizationsYear = (int) request('organizationsYear', now()->year);

        $totalOrganizations = User::where('type', 'organization')->count();
        $totalActivePlanOrganizations = User::where('type', 'organization')->where('is_plan_active', '1')->count();
        $totalUsers = User::where('type', '!=', 'super_admin')->where('type', '!=', 'super admin')->count();
        $totalRevenue = PlanOrder::where('status', 'approved')->sum('final_price') ?? 0;
        $activePlans = Plan::where('is_plan_enabled', 'on')->count();
        $pendingRequests = PlanRequest::where('status', 'pending')->count();
        $activeCoupons = Coupon::where('status', true)->count();

        if (isDemo()) {
            $demoRevenue = [4200, 5800, 3900, 7100, 6400, 8900, 7600, 9200, 8100, 10500, 9800, 12400];
            $monthlyRevenue = [];
            for ($i = 1; $i <= 12; $i++) {
                $monthlyRevenue[] = [
                    'month' => date('F Y', mktime(0, 0, 0, $i, 1, $revenueYear)),
                    'short' => date('M', mktime(0, 0, 0, $i, 1, $revenueYear)),
                    'revenue' => (float) $demoRevenue[$i - 1],
                ];
            }
        } else {
            $monthlyRevenue = [];
            for ($i = 1; $i <= 12; $i++) {
                $revenue = PlanOrder::where('status', 'approved')
                    ->whereMonth('processed_at', $i)
                    ->whereYear('processed_at', $revenueYear)
                    ->sum('final_price') ?? 0;
                $monthlyRevenue[] = [
                    'month' => date('F Y', mktime(0, 0, 0, $i, 1, $revenueYear)),
                    'short' => date('M', mktime(0, 0, 0, $i, 1, $revenueYear)),
                    'revenue' => (float) $revenue,
                ];
            }
        }

        if (isDemo()) {
            $demoOrganizations = [3, 5, 4, 7, 6, 9, 8, 11, 7, 13, 10, 15];
            $monthlyOrganizations = [];
            for ($i = 1; $i <= 12; $i++) {
                $monthlyOrganizations[] = [
                    'month' => date('F Y', mktime(0, 0, 0, $i, 1, $organizationsYear)),
                    'short' => date('M', mktime(0, 0, 0, $i, 1, $organizationsYear)),
                    'count' => $demoOrganizations[$i - 1],
                ];
            }
        } else {
            $monthlyOrganizations = [];
            for ($i = 1; $i <= 12; $i++) {
                $count = User::where('type', 'organization')
                    ->whereMonth('created_at', $i)
                    ->whereYear('created_at', $organizationsYear)
                    ->count();
                $monthlyOrganizations[] = [
                    'month' => date('F Y', mktime(0, 0, 0, $i, 1, $organizationsYear)),
                    'short' => date('M', mktime(0, 0, 0, $i, 1, $organizationsYear)),
                    'count' => $count,
                ];
            }
        }

        $firstOrganizationYear = User::where('type', 'organization')->min('created_at')
            ? (int) date('Y', strtotime(User::where('type', 'organization')->min('created_at')))
            : now()->year;
        $availableOrganizationYears = range(now()->year, $firstOrganizationYear);

        if (isDemo()) {
            $monthlyGrowth = 55;
        } else {
            $currentMonthOrganizations = User::where('type', 'organization')
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count();
            $previousMonthOrganizations = User::where('type', 'organization')
                ->whereMonth('created_at', now()->subMonth()->month)
                ->whereYear('created_at', now()->subMonth()->year)
                ->count();
            $monthlyGrowth = $previousMonthOrganizations > 0
                ? round((($currentMonthOrganizations - $previousMonthOrganizations) / $previousMonthOrganizations) * 100, 1)
                : ($currentMonthOrganizations > 0 ? 100 : 0);
        }

        $availableYears = range(now()->year + 2, now()->year - 4);

        $dashboardData = [
            'stats' => [
                'totalOrganizations' => $totalOrganizations,
                'totalActivePlanOrganizations' => $totalActivePlanOrganizations,
                'totalUsers' => $totalUsers,
                'totalRevenue' => $totalRevenue,
                'activePlans' => $activePlans,
                'pendingRequests' => $pendingRequests,
                'monthlyGrowth' => $monthlyGrowth,
                'activeCoupons' => $activeCoupons,
            ],
            'recentActivity' => User::where('type', 'organization')
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get(['id', 'name', 'email', 'avatar', 'created_at'])
                ->map(function ($organization) {
                    return [
                        'id' => $organization->id,
                        'name' => $organization->name,
                        'email' => $organization->email,
                        'avatar' => check_file($organization->getRawOriginal('avatar')) ? get_file($organization->getRawOriginal('avatar')) : null,
                        'registered_at' => $organization->created_at->diffForHumans(),
                        'status' => 'active',
                    ];
                }),
            'monthlyRevenue' => $monthlyRevenue,
            'revenueYear' => $revenueYear,
            'availableYears' => $availableYears,
            'monthlyOrganizations' => $monthlyOrganizations,
            'availableOrganizationYears' => $availableOrganizationYears,
            'topPlans' => Plan::withCount('users')
                ->orderBy('users_count', 'desc')
                ->take(3)
                ->get()
                ->map(function ($plan) {
                    return [
                        'name' => $plan->name,
                        'subscribers' => $plan->users_count,
                        'revenue' => $plan->users_count * $plan->price,
                    ];
                }),
        ];

        return Inertia::render('super_admin/dashboard', props: [
            'dashboardData' => $dashboardData,
        ]);
    }

    private function renderOrganizationDashboard()
    {
        $user = auth()->user();
        $organizationId = $user->type === 'organization' ? $user->id : $user->creatorId();

        $totalEmployees = User::where('created_by', $organizationId)->count();
        $totalLeads = 0;
        $totalOpportunities = 0;
        $totalSales = 0;
        $totalCustomers = 0;
        $totalProjects = 0;
        $organizationRevenue = 0;

        try {
            if (class_exists('\App\Models\Lead')) {
                $totalLeads = \App\Models\Lead::where('created_by', $organizationId)->count();
            }
        } catch (\Exception $e) {
        }

        try {
            if (class_exists('\App\Models\Opportunity')) {
                $totalOpportunities = \App\Models\Opportunity::where('created_by', $organizationId)->count();
            }
        } catch (\Exception $e) {
        }

        try {
            if (class_exists('\App\Models\SalesOrder')) {
                $totalSales = \App\Models\SalesOrder::where('created_by', $organizationId)->count();
            }
        } catch (\Exception $e) {
        }

        try {
            if (class_exists('\App\Models\Account')) {
                $totalCustomers = \App\Models\Account::where('created_by', $organizationId)->count();
            }
        } catch (\Exception $e) {
        }

        try {
            if (class_exists('\App\Models\Project')) {
                $totalProjects = \App\Models\Project::where('created_by', $organizationId)->count();
            }
        } catch (\Exception $e) {
        }

        try {
            if (class_exists('\App\Models\Invoice')) {
                $organizationRevenue = \App\Models\Invoice::where('created_by', $organizationId)
                    ->where('status', 'paid')
                    ->sum('total_amount') ?? 0;
            }
        } catch (\Exception $e) {
        }

        $currentMonthLeads = 0;
        $previousMonthLeads = 0;

        try {
            if (class_exists('\App\Models\Lead')) {
                $currentMonthLeads = \App\Models\Lead::where('created_by', $organizationId)
                    ->whereMonth('created_at', now()->month)
                    ->count();
                $previousMonthLeads = \App\Models\Lead::where('created_by', $organizationId)
                    ->whereMonth('created_at', now()->subMonth()->month)
                    ->count();
            }
        } catch (\Exception $e) {
        }
        $monthlyGrowth = IsDemo() ? 50 : ($previousMonthLeads > 0
            ? round((($currentMonthLeads - $previousMonthLeads) / $previousMonthLeads) * 100, 1)
            : ($currentMonthLeads > 0 ? 100 : 0));

        $totalConvertedLeads = 0;
        try {
            if (class_exists('\App\Models\Lead')) {
                $totalConvertedLeads = \App\Models\Lead::where('created_by', $organizationId)
                    ->where('is_converted', 1)
                    ->count();
            }
        } catch (\Exception $e) {
        }

        $conversionRate = $totalLeads > 0 ? round(($totalConvertedLeads / $totalLeads) * 100, 1) : 0;

        $salesTrendsData = [];
        $leadConversionsData = [];
        $revenueChartData = [];
        if (IsDemo()) {
            $demoSales = [3, 7, 5, 9, 6, 11, 8, 12, 10, 15, 13, 18];
            $demoLeads = [5, 9, 7, 12, 8, 14, 10, 16, 13, 18, 15, 20];
            $demoConversions = [3, 6, 5, 9, 6, 11, 8, 13, 10, 14, 12, 17];
            $demoRevenue = [1200, 2100, 1800, 3200, 2800, 4100, 3600, 4800, 4200, 5500, 4900, 6200];
            for ($i = 1; $i <= 12; $i++) {
                $salesTrendsData[] = [
                    'month' => date('F', mktime(0, 0, 0, $i, 1)),
                    'short' => date('M', mktime(0, 0, 0, $i, 1)),
                    'sales' => $demoSales[$i - 1],
                ];
                $leadConversionsData[] = [
                    'month' => date('F', mktime(0, 0, 0, $i, 1)),
                    'short' => date('M', mktime(0, 0, 0, $i, 1)),
                    'leads' => $demoLeads[$i - 1],
                    'conversions' => $demoConversions[$i - 1],
                ];
                $revenueChartData[] = [
                    'month' => date('F', mktime(0, 0, 0, $i, 1)),
                    'short' => date('M', mktime(0, 0, 0, $i, 1)),
                    'revenue' => $demoRevenue[$i - 1],
                ];
            }
        } else {
            $chartYear = (int) request('chart_year', now()->year);
            $leadYear = (int) request('lead_year', now()->year);
            for ($m = 1; $m <= 12; $m++) {
                $date = \Carbon\Carbon::create($chartYear, $m, 1);
                $monthlySales = 0;
                $monthlyLeads = 0;
                $monthlyConversions = 0;
                $monthlyRevenue = 0;

                try {
                    if (class_exists('\App\Models\SalesOrder')) {
                        $monthlySales = \App\Models\SalesOrder::where('created_by', $organizationId)
                            ->whereMonth('created_at', $m)
                            ->whereYear('created_at', $chartYear)
                            ->count();
                    }
                } catch (\Exception $e) {
                }

                try {
                    if (class_exists('\App\Models\Lead')) {
                        $monthlyLeads = \App\Models\Lead::where('created_by', $organizationId)
                            ->whereMonth('created_at', $m)
                            ->whereYear('created_at', $leadYear)
                            ->count();

                        $monthlyConversions = \App\Models\Lead::where('created_by', $organizationId)
                            ->where('is_converted', 1)
                            ->whereMonth('updated_at', $m)
                            ->whereYear('updated_at', $leadYear)
                            ->count();
                    }
                } catch (\Exception $e) {
                }

                try {
                    if (class_exists('\App\Models\Invoice')) {
                        $monthlyRevenue = \App\Models\Invoice::where('created_by', $organizationId)
                            ->whereIn('status', ['paid', 'partial_paid'])
                            ->whereMonth('created_at', $m)
                            ->whereYear('created_at', $chartYear)
                            ->sum('total_amount') ?? 0;
                    }
                } catch (\Exception $e) {
                }

                $salesTrendsData[] = ['month' => $date->format('F'), 'short' => $date->format('M'), 'sales' => $monthlySales];
                $leadConversionsData[] = [
                    'month' => $date->format('F'),
                    'short' => $date->format('M'),
                    'leads' => $monthlyLeads,
                    'conversions' => $monthlyConversions,
                ];
                $revenueChartData[] = ['month' => $date->format('F'), 'short' => $date->format('M'), 'revenue' => (float) $monthlyRevenue];
            }
        }

        $customerTypes = collect();
        try {
            if (class_exists('\App\Models\Account')) {
                $customerTypes = \App\Models\Account::where('created_by', $organizationId)
                    ->select('account_type_id', DB::raw('COUNT(*) as count'))
                    ->with('accountType:id,name')
                    ->groupBy('account_type_id')
                    ->get();
            }
        } catch (\Exception $e) {
        }

        $customerDistribution = [];
        $colors = ['#A12582', '#10b77f', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1'];
        foreach ($customerTypes as $index => $type) {
            $customerDistribution[] = [
                'name' => $type->accountType->name ?? 'Other',
                'value' => $type->count,
                'color' => $colors[$index % count($colors)],
            ];
        }

        $employeeRoles = User::where('created_by', $organizationId)
            ->select('type', DB::raw('COUNT(*) as count'))
            ->groupBy('type')
            ->get();

        $employeeDistribution = [];
        foreach ($employeeRoles as $index => $role) {
            $employeeDistribution[] = [
                'name' => ucfirst($role->type),
                'value' => $role->count,
                'color' => $colors[$index % count($colors)],
            ];
        }

        $recentLeads = collect();
        $recentSales = collect();
        $recentProjects = collect();
        $recentCustomers = collect();

        try {
            if (class_exists('\App\Models\Lead')) {
                $recentLeads = \App\Models\Lead::where('created_by', $organizationId)
                    ->latest()
                    ->take(5)
                    ->get(['id', 'name', 'email', 'status', 'created_at']);
            }
        } catch (\Exception $e) {
        }

        try {
            if (class_exists('\App\Models\SalesOrder')) {
                $recentSales = \App\Models\SalesOrder::where('created_by', $organizationId)
                    ->with('account:id,name')
                    ->latest()
                    ->take(5)
                    ->get(['id', 'account_id', 'total_amount', 'status', 'created_at']);
            }
        } catch (\Exception $e) {
        }

        try {
            if (class_exists('\App\Models\Project')) {
                $recentProjects = \App\Models\Project::where('created_by', $organizationId)
                    ->whereIn('status', ['active', 'in_progress', 'in progress'])
                    ->latest()
                    ->get(['id', 'name', 'status', 'created_at']);
            }
        } catch (\Exception $e) {
        }

        try {
            if (class_exists('\App\Models\Account')) {
                $recentCustomers = \App\Models\Account::where('created_by', $organizationId)
                    ->with('accountType:id,name')
                    ->latest()
                    ->take(5)
                    ->get(['id', 'name', 'email', 'account_type_id', 'created_at']);
            }
        } catch (\Exception $e) {
        }

        $recentAnnouncements = collect();
        try {
            if (class_exists('\App\Models\Announcement')) {
                $recentAnnouncements = \App\Models\Announcement::where('created_by', $organizationId)
                    ->where('status', 'active')
                    ->with('category:id,name')
                    ->orderBy('is_featured', 'desc')
                    ->latest()
                    ->take(5)
                    ->get(['id', 'title', 'announcement_category_id', 'is_featured', 'created_at']);
            }
        } catch (\Exception $e) {
        }

        // Storage usage calculation with plan limits
        $storageUsed = 0;
        $storageLimit = 1024 * 1024 * 1024; // Default 1GB in bytes

        // Get plan storage limit
        $organization = User::find($organizationId);
        if ($organization && $organization->plan && $organization->plan->storage_limit) {
            $storageLimit = $organization->plan->storage_limit * 1024 * 1024 * 1024; // Convert GB to bytes
        }

        // Calculate actual storage usage from media files
        if (IsDemo()) {
            $storageUsed = $storageLimit / 4;
        } else {
            try {
                $organizationUsers = User::where('created_by', $organizationId)->pluck('id')->push($organizationId);
                $storageUsed = \Spatie\MediaLibrary\MediaCollections\Models\Media::whereIn('user_id', $organizationUsers)->sum('size');
            } catch (\Exception $e) {
            }
        }

        if (IsDemo()) {
            $storageUsagePercent = 25;
        } else {
            $storageUsagePercent = $storageLimit > 0 ? ($storageUsed / $storageLimit) * 100 : 0;
        }

        $dashboardData = [
            'stats' => [
                'totalEmployees' => $totalEmployees,
                'totalLeads' => $totalLeads,
                'totalOpportunities' => $totalOpportunities,
                'totalSales' => $totalSales,
                'totalCustomers' => $totalCustomers,
                'totalProjects' => $totalProjects,
                'organizationRevenue' => $organizationRevenue,
                'monthlyGrowth' => $monthlyGrowth,
                'conversionRate' => $conversionRate,
                'storageUsed' => $storageUsed,
                'storageLimit' => $storageLimit,
                'storageUsagePercent' => min(100, $storageUsagePercent),
                'storageUsedMB' => round($storageUsed / (1024 * 1024), 2),
                'storageLimitGB' => round($storageLimit / (1024 * 1024 * 1024), 2),
            ],
            'charts' => [
                'salesTrends' => $salesTrendsData,
                'leadConversions' => $leadConversionsData,
                'revenueChart' => $revenueChartData,
                'customerDistribution' => $customerDistribution,
                'employeeDistribution' => $employeeDistribution,
            ],
            'recentActivities' => [
                'leads' => $recentLeads->map(function ($lead) {
                    return [
                        'id' => $lead->id,
                        'name' => $lead->name,
                        'email' => $lead->email,
                        'status' => $lead->status ?? 'new',
                        'created_at' => $lead->created_at->toISOString(),
                    ];
                }),
                'sales' => $recentSales->map(function ($sale) {
                    return [
                        'id' => $sale->id,
                        'customer' => $sale->account->name ?? 'Customer',
                        'amount' => $sale->total_amount ?? 0,
                        'status' => $sale->status ?? 'pending',
                        'created_at' => $sale->created_at->toISOString(),
                    ];
                }),
                'projects' => $recentProjects->map(function ($project) {
                    return [
                        'id' => $project->id,
                        'name' => $project->name,
                        'status' => $project->status ?? 'planning',
                        'created_at' => $project->created_at->toISOString(),
                    ];
                }),
                'customers' => $recentCustomers->map(function ($customer) {
                    return [
                        'id' => $customer->id,
                        'name' => $customer->name,
                        'email' => $customer->email,
                        'type' => $customer->accountType->name ?? 'customer',
                        'created_at' => $customer->created_at->toISOString(),
                    ];
                }),
                'announcements' => $recentAnnouncements->map(function ($announcement) {
                    return [
                        'id' => $announcement->id,
                        'title' => $announcement->title,
                        'category' => $announcement->category->name ?? 'General',
                        'is_featured' => $announcement->is_featured ?? false,
                        'created_at' => $announcement->created_at->toISOString(),
                    ];
                }),
            ],
        ];

        return Inertia::render('dashboard', [
            'dashboardData' => $dashboardData,
        ]);
    }

    private function getDirectorySize($directory)
    {
        $size = 0;
        if (is_dir($directory)) {
            foreach (new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($directory)) as $file) {
                $size += $file->getSize();
            }
        }

        return $size;
    }
}
