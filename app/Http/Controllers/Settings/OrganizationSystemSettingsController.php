<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Exception;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class OrganizationSystemSettingsController extends Controller
{
    /**
     * Update the organization system settings.
     *
     * Handles organization-level configuration including:
     * - Language and localization settings
     * - Date/time formats and timezone
     * - Excludes email verification and landing page settings
     *
     * @param Request $request
     *
     * @return RedirectResponse
     */
    public function update(Request $request)
    {
        try {
            $validated = $request->validate([
                'defaultLanguage' => 'required|string',
                'dateFormat' => 'required|string',
                'timeFormat' => 'required|string',
                'defaultTimezone' => 'required|string',
            ]);

            foreach ($validated as $key => $value) {
                updateSetting($key, $value);
            }

            return redirect()->back()->with('success', __('System settings updated successfully.'));
        } catch (Exception $e) {
            return redirect()->back()->with('error', __('Failed to update system settings: :error', ['error' => $e->getMessage()]));
        }
    }
}
