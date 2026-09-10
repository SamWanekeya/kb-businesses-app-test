<?php

namespace App\Http\Controllers;

use App\Models\SignInHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SignInHistoryController extends Controller
{
    public function index(Request $request)
    {
        if (Auth::user()->can('manage-sign-in-history')) {
            $query = SignInHistory::with('user:id,name,email,type')->where(function ($q) {
                if (Auth::user()->hasRole('super_admin')) {
                    $q->where('created_by', Auth::id())->orWhereHas('user', function ($u) {
                        $u->where('created_by', Auth::id());
                    });
                } elseif (Auth::user()->hasRole('organization')) {
                    $q->where('created_by', Auth::id());
                } else {
                    $q->whereRaw('1 = 0');
                }
            });

            // Search functionality
            if ($request->filled('search')) {
                $search = $request->search;
                $query->whereHas('user', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                })->orWhere('ip_address', 'like', "%{$search}%");
            }

            // Sorting
            $sortField = $request->input('sort_field', 'id');
            $sortDirection = $request->input('sort_direction', 'desc');
            $allowedSorts = ['id', 'name', 'created_at'];
            $allowedDirection = ['asc', 'desc'];
            if (!in_array($sortDirection, $allowedDirection)) {
                $sortDirection = 'desc';
            }
            if (in_array($sortField, $allowedSorts)) {
                $query->orderBy($sortField, $sortDirection);
            }

            // Pagination
            $perPage = $request->input('per_page', 10);
            $ipAddressHistory = $query->paginate((int)$perPage)->withQueryString();

            return Inertia::render('Account/SignInHistory/Index', [
                'signInHistory' => $ipAddressHistory,
                'filters' => $request->only(['search', 'sort_field', 'sort_direction', 'per_page']),
            ]);
        } else {
            return redirect()->back()->with('error', __('Permission Denied.'));
        }
    }

    public function destroy(SignInHistory $ipAddressDetail)
    {
        if (Auth::user()->can('delete-sign-in-history')) {
            $ipAddressDetail->delete();

            return redirect()->back()->with('success', 'Sign in history deleted successfully.');
        } else {
            return redirect()->back()->with('error', __('Permission Denied.'));
        }
    }
}
