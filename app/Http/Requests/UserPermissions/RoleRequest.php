<?php

namespace App\Http\Requests\UserPermissions;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class RoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'label' => [
                'required',
                'string',
                function ($attribute, $value, $fail) {
                    $this->validateSystemRole($value, $fail);
                },
            ],
            'description' => 'nullable|string',
            'permissions' => 'required|array',
        ];
    }

    private function validateSystemRole($label, $fail)
    {
        $user = Auth::user();
        $userType = $user->type ?? 'organization';

        // Super admin can create/edit any role
        if ($userType === 'super_admin') {
            return;
        }

        $systemRoles = ['super_admin', 'organization'];
        $slug = Str::slug($label);

        if (
            in_array(strtolower($label), array_map('strtolower', $systemRoles)) ||
            in_array($slug, $systemRoles)
        ) {
            $fail(__('This role name is reserved for system use. Please choose a different name.'));
        }
    }
}
