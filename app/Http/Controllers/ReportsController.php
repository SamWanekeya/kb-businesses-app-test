<?php

namespace App\Http\Controllers;

use App\Models\Call;
use App\Models\Contact;
use App\Models\Lead;
use App\Models\Meeting;
use App\Models\Product;
use App\Models\Project;
use App\Models\SalesOrder;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReportsController extends Controller
{
    public function leads(Request $request)
    {
        if (isDemo()) {
            $dateFrom = $request->input('date_from', Carbon::parse('2024-01-04')->format('Y-m-d'));
            $dateTo = $request->input('date_to', Carbon::parse('2025-09-09')->format('Y-m-d'));
        } else {
            $dateFrom = $request->input('date_from', Carbon::now()->subMonth()->format('Y-m-d'));
            $dateTo = $request->input('date_to', Carbon::now()->format('Y-m-d'));
        }
        $dateFrom = Carbon::parse($dateFrom)->startOfDay();
        $dateTo = Carbon::parse($dateTo)->endOfDay();

        $organizationId = Auth::user()->creatorId();

        $summary = [
            'total_leads' => Lead::where('created_by', $organizationId)->whereBetween('created_at', [$dateFrom, $dateTo])->count(),
            'converted_leads' => Lead::where('created_by', $organizationId)->whereBetween('created_at', [$dateFrom, $dateTo])->where('is_converted', true)->count(),
            'conversion_rate' => 0,
            'avg_conversion_time' => 0,
        ];

        if ($summary['total_leads'] > 0) {
            $summary['conversion_rate'] = ($summary['converted_leads'] / $summary['total_leads']) * 100;
        }

        // Calculate average conversion time for converted leads
        if ($summary['converted_leads'] > 0) {
            $avgConversionTime = Lead::where('created_by', $organizationId)
                ->whereBetween('created_at', [$dateFrom, $dateTo])
                ->where('is_converted', true)
                ->selectRaw('AVG(DATEDIFF(updated_at, created_at)) as avg_days')
                ->value('avg_days');
            $summary['avg_conversion_time'] = round($avgConversionTime ?? 0, 1);
        }

        $monthlyData = Lead::selectRaw('DATE_FORMAT(created_at, "%Y-%m") as period, COUNT(*) as count')
            ->where('created_by', $organizationId)
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        $dailyData = Lead::selectRaw('DATE_FORMAT(created_at, "%Y-%m-%d") as period, COUNT(*) as count')
            ->where('created_by', $organizationId)
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        $leadsBySource = Lead::selectRaw('lead_sources.name, COUNT(*) as total')
            ->join('lead_sources', 'leads.lead_source_id', '=', 'lead_sources.id')
            ->where('leads.created_by', $organizationId)
            ->whereBetween('leads.created_at', [$dateFrom, $dateTo])
            ->groupBy('lead_sources.name')
            ->get();


        $recentLeads = Lead::with(['leadStatus', 'assignedUser'])
            ->where('created_by', $organizationId)
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return Inertia::render('Reports/LeadReports', [
            'filters' => compact('dateFrom', 'dateTo'),
            'summary' => $summary,
            'monthlyData' => $monthlyData,
            'dailyData' => $dailyData,
            'leadsBySource' => $leadsBySource,
            'recentLeads' => $recentLeads,
        ]);
    }

    public function sales(Request $request)
    {
        if (isDemo()) {
            $dateFrom = $request->input('date_from', Carbon::parse('2024-01-04')->format('Y-m-d'));
            $dateTo = $request->input('date_to', Carbon::parse('2025-09-09')->format('Y-m-d'));
        } else {
            $dateFrom = $request->input('date_from', Carbon::now()->subMonth()->format('Y-m-d'));
            $dateTo = $request->input('date_to', Carbon::now()->format('Y-m-d'));
        }

        $dateTo = Carbon::parse($dateTo)->endOfDay();

        $organizationId = Auth::user()->creatorId();

        $summary = [
            'total_sales' => SalesOrder::where('created_by', $organizationId)->whereBetween('created_at', [$dateFrom, $dateTo])->sum('total_amount'),
            'total_orders' => SalesOrder::where('created_by', $organizationId)->whereBetween('created_at', [$dateFrom, $dateTo])->count(),
            'avg_order_value' => 0,
            'growth_rate' => 0,
        ];

        if ($summary['total_orders'] > 0) {
            $summary['avg_order_value'] = $summary['total_sales'] / $summary['total_orders'];
        }

        // Calculate growth rate compared to previous period
        $previousPeriodStart = Carbon::parse($dateFrom)->subDays(Carbon::parse($dateTo)->diffInDays(Carbon::parse($dateFrom)))->format('Y-m-d');
        $previousPeriodEnd = Carbon::parse($dateFrom)->subDay()->format('Y-m-d');

        $previousSales = SalesOrder::where('created_by', $organizationId)->whereBetween('created_at', [$previousPeriodStart, $previousPeriodEnd])->sum('total_amount');

        if ($previousSales > 0) {
            $summary['growth_rate'] = (($summary['total_sales'] - $previousSales) / $previousSales) * 100;
        } elseif ($summary['total_sales'] > 0) {
            $summary['growth_rate'] = 100; // 100% growth if no previous sales
        }

        $monthlyData = SalesOrder::selectRaw('DATE_FORMAT(created_at, "%Y-%m") as period, SUM(total_amount) as revenue, COUNT(*) as orders')
            ->where('created_by', $organizationId)
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        $dailyData = SalesOrder::selectRaw('DATE_FORMAT(created_at, "%Y-%m-%d") as period, SUM(total_amount) as revenue, COUNT(*) as orders')
            ->where('created_by', $organizationId)
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        $salesByStatus = SalesOrder::selectRaw('status, COUNT(*) as total, SUM(total_amount) as amount')
            ->where('created_by', $organizationId)
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->groupBy('status')
            ->get();

        $recentSales = SalesOrder::with(['account', 'assignedUser'])
            ->where('created_by', $organizationId)
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        $topProducts = DB::table('sales_order_products')
            ->join('products', 'sales_order_products.product_id', '=', 'products.id')
            ->join('sales_orders', 'sales_order_products.sales_order_id', '=', 'sales_orders.id')
            ->where('sales_orders.created_by', $organizationId)
            ->whereBetween('sales_orders.created_at', [$dateFrom, $dateTo])
            ->select('products.id as product_id', 'products.name', DB::raw('SUM(sales_order_products.total_price) as total_revenue'), DB::raw('SUM(sales_order_products.quantity) as total_quantity'))
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_revenue')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                $product = Product::find($item->product_id);
                $item->image = $product ? $product->main_image_url : null;

                return $item;
            });

        return Inertia::render('Reports/SalesReports', [
            'filters' => compact('dateFrom', 'dateTo'),
            'summary' => $summary,
            'monthlyData' => $monthlyData,
            'dailyData' => $dailyData,
            'salesByStatus' => $salesByStatus,
            'recentSales' => $recentSales,
            'topProducts' => $topProducts,
        ]);
    }

    public function products(Request $request)
    {
        if (isDemo()) {
            $dateFrom = $request->input('date_from', Carbon::parse('2024-01-04')->format('Y-m-d'));
            $dateTo = $request->input('date_to', Carbon::parse('2025-09-09')->format('Y-m-d'));
        } else {
            $dateFrom = $request->input('date_from', Carbon::now()->subMonth()->format('Y-m-d'));
            $dateTo = $request->input('date_to', Carbon::now()->format('Y-m-d'));
        }

        $organizationId = Auth::user()->creatorId();

        $summary = [
            'total_products' => Product::where('created_by', $organizationId)->count(),
            'active_products' => Product::where('created_by', $organizationId)->where('status', 'active')->count(),
            'total_revenue' => 0,
            'best_seller' => null,
        ];

        $productSales = DB::table('sales_order_products')
            ->join('sales_orders', 'sales_order_products.sales_order_id', '=', 'sales_orders.id')
            ->join('products', 'sales_order_products.product_id', '=', 'products.id')
            ->selectRaw('products.id as product_id, products.name, SUM(sales_order_products.quantity) as quantity, SUM(sales_order_products.total_price) as revenue')
            ->where('sales_orders.created_by', $organizationId)
            ->whereBetween('sales_orders.created_at', [$dateFrom, $dateTo])
            ->groupBy('products.id', 'products.name')
            ->orderBy('revenue', 'desc')
            ->get()
            ->map(function ($item) {
                $product = Product::find($item->product_id);

                return [
                    'name' => $item->name,
                    'quantity' => (int)$item->quantity,
                    'revenue' => (float)$item->revenue,
                    'image' => $product ? $product->main_image_url : null,
                ];
            });

        $summary['total_revenue'] = $productSales->sum('revenue');
        $summary['best_seller'] = $productSales->first()['name'] ?? null;

        $topProductsByQuantity = DB::table('sales_order_products')
            ->join('sales_orders', 'sales_order_products.sales_order_id', '=', 'sales_orders.id')
            ->join('products', 'sales_order_products.product_id', '=', 'products.id')
            ->selectRaw('products.id as product_id, products.name, SUM(sales_order_products.quantity) as quantity, SUM(sales_order_products.total_price) as revenue')
            ->where('sales_orders.created_by', $organizationId)
            ->whereBetween('sales_orders.created_at', [$dateFrom, $dateTo])
            ->groupBy('products.id', 'products.name')
            ->orderBy('quantity', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                $product = Product::find($item->product_id);

                return [
                    'name' => $item->name,
                    'quantity' => (int)$item->quantity,
                    'revenue' => (float)$item->revenue,
                    'image' => $product ? $product->main_image_url : null,
                ];
            });

        $lowStockProducts = Product::where('created_by', $organizationId)
            ->where('status', 'active')
            ->whereBetween('stock_quantity', [1, 10])
            ->get();

        $outOfStockProducts = Product::where('created_by', $organizationId)
            ->where('status', 'active')
            ->where('stock_quantity', '<=', 0)
            ->get();

        return Inertia::render('Reports/ProductReports', [
            'filters' => compact('dateFrom', 'dateTo'),
            'summary' => $summary,
            'productSales' => $productSales,
            'topProductsByQuantity' => $topProductsByQuantity,
            'lowStockProducts' => $lowStockProducts,
            'outOfStockProducts' => $outOfStockProducts,
        ]);
    }

    public function customers(Request $request)
    {
        if (isDemo()) {
            $dateFrom = $request->input('date_from', Carbon::parse('2024-01-04')->format('Y-m-d'));
            $dateTo = $request->input('date_to', Carbon::parse('2025-09-09')->format('Y-m-d'));
        } else {
            $dateFrom = $request->input('date_from', Carbon::now()->subMonth()->format('Y-m-d'));
            $dateTo = $request->input('date_to', Carbon::now()->format('Y-m-d'));
        }

        $organizationId = Auth::user()->creatorId();

        $summary = [
            'total_contacts' => Contact::where('created_by', $organizationId)->count(),
            'new_contacts' => Contact::where('created_by', $organizationId)->whereBetween('created_at', [$dateFrom, $dateTo])->count(),
            'active_contacts' => Contact::where('created_by', $organizationId)->where('status', 'active')->count(),
            'contact_lifetime_value' => 0,
        ];

        $monthlyData = Contact::selectRaw('DATE_FORMAT(created_at, "%Y-%m") as period, COUNT(*) as count')
            ->where('created_by', $organizationId)
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        $dailyData = Contact::selectRaw('DATE_FORMAT(created_at, "%Y-%m-%d") as period, COUNT(*) as count')
            ->where('created_by', $organizationId)
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        $topContacts = DB::table('contacts')
            ->join('sales_orders', 'contacts.id', '=', 'sales_orders.billing_contact_id')
            ->selectRaw('contacts.name, contacts.email, SUM(sales_orders.total_amount) as total_spent, COUNT(sales_orders.id) as order_count')
            ->where('contacts.created_by', $organizationId)
            ->where('sales_orders.created_by', $organizationId)
            ->whereBetween('sales_orders.created_at', [$dateFrom, $dateTo])
            ->groupBy('contacts.id', 'contacts.name')
            ->orderBy('total_spent', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->name,
                    'email' => $item->email,
                    'total_spent' => (float)$item->total_spent,
                    'order_count' => (int)$item->order_count,
                ];
            });

        $contactsByIndustry = DB::table('contacts')
            ->join('accounts', 'contacts.account_id', '=', 'accounts.id')
            ->join('account_industries', 'accounts.account_industry_id', '=', 'account_industries.id')
            ->selectRaw('account_industries.name as industry, COUNT(contacts.id) as total')
            ->where('contacts.created_by', $organizationId)
            ->groupBy('account_industries.id', 'account_industries.name')
            ->orderBy('total', 'desc')
            ->get();

        $recentMeetings = Meeting::where('parent_module', 'contact')
            ->where('created_by', $organizationId)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()->map(function ($item) {
                $item->type = 'meeting';
                $item->icon = 'users';
                $item->date_formatted = $item->created_at->diffForHumans();
                $contact = Contact::find($item->parent_id);
                $item->contact_name = $contact ? $contact->name : 'Unknown';

                return $item;
            });

        $recentCalls = Call::where('parent_module', 'contact')
            ->where('created_by', $organizationId)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()->map(function ($item) {
                $item->type = 'call';
                $item->icon = 'phone';
                $item->date_formatted = $item->created_at->diffForHumans();
                $contact = Contact::find($item->parent_id);
                $item->contact_name = $contact ? $contact->name : 'Unknown';

                return $item;
            });

        $recentInteractions = $recentMeetings->concat($recentCalls)
            ->sortByDesc('created_at')
            ->take(5)
            ->values();

        return Inertia::render('Reports/CustomerReports', [
            'filters' => compact('dateFrom', 'dateTo'),
            'summary' => $summary,
            'monthlyData' => $monthlyData,
            'dailyData' => $dailyData,
            'topContacts' => $topContacts,
            'contactsByIndustry' => $contactsByIndustry,
            'recentInteractions' => $recentInteractions,
        ]);
    }

    public function projects(Request $request)
    {
        if (isDemo()) {
            $dateFrom = $request->input('date_from', Carbon::parse('2024-01-04')->format('Y-m-d'));
            $dateTo = $request->input('date_to', Carbon::parse('2025-09-09')->format('Y-m-d'));
        } else {
            $dateFrom = $request->input('date_from', Carbon::now()->subMonth()->format('Y-m-d'));
            $dateTo = $request->input('date_to', Carbon::now()->format('Y-m-d'));
        }

        $organizationId = Auth::user()->creatorId();

        $summary = [
            'total_projects' => Project::where('created_by', $organizationId)->count(),
            'active_projects' => Project::where('created_by', $organizationId)->where('status', 'active')->count(),
            'completed_projects' => Project::where('created_by', $organizationId)->where('status', 'completed')->count(),
            'completion_rate' => 0,
        ];

        if ($summary['total_projects'] > 0) {
            $summary['completion_rate'] = ($summary['completed_projects'] / $summary['total_projects']) * 100;
        }

        $monthlyData = Project::selectRaw('DATE_FORMAT(created_at, "%Y-%m") as period, COUNT(*) as count')
            ->where('created_by', $organizationId)
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        $dailyData = Project::selectRaw('DATE_FORMAT(created_at, "%Y-%m-%d") as period, COUNT(*) as count')
            ->where('created_by', $organizationId)
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        $projectsByStatus = Project::selectRaw('status, COUNT(*) as total')
            ->where('created_by', $organizationId)
            ->groupBy('status')
            ->get();

        $overdueProjects = Project::with('assignedUser')
            ->where('created_by', $organizationId)
            ->where('status', '!=', 'completed')
            ->where('end_date', '<', Carbon::now()->format('Y-m-d'))
            ->get();

        return Inertia::render('Reports/ProjectReports', [
            'filters' => compact('dateFrom', 'dateTo'),
            'summary' => $summary,
            'monthlyData' => $monthlyData,
            'dailyData' => $dailyData,
            'projectsByStatus' => $projectsByStatus,
            'overdueProjects' => $overdueProjects,
        ]);
    }
}
