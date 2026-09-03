<?php

namespace App\Http\Controllers;

use App\Http\Requests\UserRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UserController extends BaseController
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $authUser = Auth::user();
        $authUserRole = $authUser->roles->first()?->name;
        // Allow super_admin, admin, product-manager, contact-manager, viewer
        if (!$authUser->hasPermissionTo('manage-users')) {
            abort(403, 'Unauthorized Access Prevented');
        }

        $userQuery = User::withPermissionCheck()->with(['roles', 'creator']);
        # Admin
        if ($authUserRole === 'super admin') {
            $userQuery->whereDoesntHave('roles', function ($q) {
                $q->where('name', 'super admin');
            });
        }

        // Handle search
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $userQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Handle role filter
        if ($request->has('role') && $request->role !== 'all') {
            $userQuery->whereHas('roles', function ($q) use ($request) {
                $q->where('roles.id', $request->role);
            });
        }

        // Handle sorting
        $sortField = $request->input('sort_field', 'id');
        $sortDirection = $request->input('sort_direction', 'desc');
        $allowedSorts = ['id', 'name', 'created_at'];
        $allowedDirection = ['asc', 'desc'];
        if (!in_array($sortDirection, $allowedDirection)) {
            $sortDirection = 'desc';
        }
        if (in_array($sortField, $allowedSorts)) {
            $userQuery->orderBy($sortField, $sortDirection);
        }

        // Handle pagination
        $defaultPerPage = $request->view === 'grid' ? 12 : 10;
        $perPage = max(1, min(200, (int) $request->get('per_page', $defaultPerPage)));
        $users = $userQuery->paginate($perPage)->withQueryString();

        # Roles listing - Get roles based on user type
        if ($authUser->type === 'organization') {
            $roles = Role::where('created_by', $authUser->id)->get();
        } elseif ($authUser->type === 'super_admin') {
            $roles = Role::get();
        } else {
            // Staff users see roles from their organization
            $roles = Role::where('created_by', $authUser->created_by)->get();
        }

        // Get plan limits for organization users and staff users
        $planLimits = null;
        $organizationUser = User::find(createdBy());
        if ($organizationUser && $organizationUser->plan) {
            $currentUserCount = User::where('created_by', $organizationUser->id)->count();
            $planLimits = [
                'current_users' => $currentUserCount,
                'maximum_users' => $organizationUser->plan->maximum_users,
                'can_create' => $currentUserCount < $organizationUser->plan->maximum_users,
            ];
        }

        return Inertia::render('users/index', [
            'users' => $users,
            'roles' => $roles,
            'planLimits' => $planLimits,
            'filters' => $request->only(['search', 'role', 'sort_field', 'sort_direction', 'per_page', 'view', 'page']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(UserRequest $request)
    {
        // Set user language same as creator (organization)
        $authUser = Auth::user();
        // Check plan limits for organization users
        if ($authUser->type === 'organization' && $authUser->plan) {
            $currentUserCount = User::where('created_by', $authUser->id)->count();
            $maxUsers = $authUser->plan->maximum_users;

            if ($currentUserCount >= $maxUsers) {
                return redirect()->back()->with('error', __('User limit exceeded. Your plan allows maximum :max users. Please upgrade your plan.', ['max' => $maxUsers]));
            }
        }
        // Check plan limits for staff users (created by organization users)
        elseif ($authUser->type !== 'super_admin' && $authUser->created_by) {
            $organizationUser = User::find($authUser->created_by);
            if ($organizationUser && $organizationUser->type === 'organization' && $organizationUser->plan) {
                $currentUserCount = User::where('created_by', $organizationUser->id)->count();
                $maxUsers = $organizationUser->plan->maximum_users;

                if ($currentUserCount >= $maxUsers) {
                    return redirect()->back()->with('error', __('User limit exceeded. Your organization plan allows maximum :max users. Please contact your administrator.', ['max' => $maxUsers]));
                }
            }
        }

        if (!in_array(auth()->user()->type, ['super_admin', 'organization'])) {
            $created_by = auth()->user()->created_by;
        } else {
            $created_by = auth()->id();
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'created_by' => $created_by,
        ]);

        if ($user && $request->roles) {
            // Convert role names to IDs for syncing
            $role = Role::where('id', $request->roles)
                ->where('created_by', $created_by)->first();

            $user->roles()->sync([$role->id]);
            $user->type = $role->name;
            $user->save();

            // Trigger email notification
            if (isEmailTemplateEnabled('User Created', createdBy()) && !IsDemo()) {
                event(new \App\Events\UserCreated($user, $request->password));
            }

            // Check for email errors
            if (session()->has('email_error')) {
                return redirect()->route('users.index')->with('warning', __('User created successfully, but welcome email failed: ') . session('email_error'));
            }

            return redirect()->route('users.index')->with('success', __('User created with roles'));
        }

        return redirect()->back()->with('error', __('Unable to create User. Please try again!'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UserRequest $request, User $user)
    {
        if ($user) {
            $user->name = $request->name;
            $user->email = $request->email;

            // find and syncing role
            if ($request->roles) {
                if (!in_array(auth()->user()->type, ['super_admin', 'organization'])) {
                    $created_by = auth()->user()->created_by;
                } else {
                    $created_by = auth()->id();
                }
                $role = Role::where('id', $request->roles)
                    ->where('created_by', $created_by)->first();

                $user->roles()->sync([$role->id]);
                $user->type = $role->name;
            }

            $user->save();

            return redirect()->route('users.index')->with('success', __('User updated with roles'));
        }

        return redirect()->back()->with('error', __('Unable to update User. Please try again!'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        if ($user) {
            $user->delete();

            return redirect()->route('users.index')->with('success', __('User deleted with roles'));
        }

        return redirect()->back()->with('error', __('Unable to delete User. Please try again!'));
    }

    /**
     * Reset user password
     */
    public function resetPassword(Request $request, User $user)
    {
        $request->validate([
            'password' => 'required|min:8|confirmed',
        ]);

        $user->password = Hash::make($request->password);
        $user->save();

        return redirect()->route('users.index')->with('success', __('Password reset successfully'));
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user)
    {
        // Get meetings where user is an attendee
        $meetings = \App\Models\Meeting::where('created_by', createdBy())
            ->whereHas('attendees', function ($q) use ($user) {
                $q->where('attendee_type', 'user')
                    ->where('attendee_id', $user->id);
            })
            ->with(['creator', 'assignedUser'])
            ->orderBy('start_date', 'desc')
            ->get();

        return Inertia::render('users/show', [
            'user' => $user->load(['roles', 'creator']),
            'meetings' => $meetings,
        ]);
    }

    /**
     * Toggle user status
     */
    public function toggleStatus(User $user)
    {
        $user->status = $user->status === 'active' ? 'inactive' : 'active';
        $user->save();

        return redirect()->route('users.index')->with('success', __('User status updated successfully'));
    }

    /**
     * Display all user logs created by current user
     */
    public function allUserLogs(Request $request)
    {
        $authUser = Auth::user();

        if ($authUser->type === 'super_admin') {
            // For super_admin: show super_admin logs and organization type logs created by super_admin
            $ipAddressHistoriesQuery = \App\Models\SignInHistory::whereHas('user', function ($q) {
                $q->where('type', 'super_admin')
                    ->orWhere(function ($subQ) {
                        $subQ->where('type', 'organization');
                    });
            })
                ->with('user')
                ->orderBy('created_at', 'desc');
        } else {
            // For other users: show logs created by current user
            $ipAddressHistoriesQuery = \App\Models\SignInHistory::where('created_by', createdBy())
                ->with('user')
                ->orderBy('created_at', 'desc');
        }

        // Handle search
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $ipAddressHistoriesQuery->where(function ($q) use ($search) {
                $q->where('ip_address', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        // Handle pagination
        $perPage = $request->get('per_page', 10);
        $ipAddressHistories = $ipAddressHistoriesQuery->paginate((int)$perPage)->withQueryString();

        return Inertia::render('users/all-logs', [
            'signInHistories' => $ipAddressHistories,
            'filters' => [
                'search' => $request->search ?? '',
                'per_page' => $perPage,
            ],
        ]);
    }

    // switchBusiness method removed
}
