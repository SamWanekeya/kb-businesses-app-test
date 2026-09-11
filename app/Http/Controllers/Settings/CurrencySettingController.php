<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CurrencySettingController extends Controller
{
    /**
     * Update the currency settings.
     */
    public function update(Request $request)
    {
        try {
            $validated = $request->validate([
                'decimal_format' => 'required|string|in:0,1,2,3,4',
                'default_currency' => 'required|string|exists:currencies,code',
                'decimal_separator' => ['required', 'string', Rule::in(['.', ','])],
                'thousands_separator' => 'required|string',
                'float_number' => 'required|boolean',
                'currency_symbol_space' => 'required|boolean',
                'currency_symbol_position' => 'required|string|in:before,after',
            ]);

            // Update settings using helper function
            foreach ($validated as $key => $value) {
                updateSetting($key, $value);
            }

            return redirect()->back()->with('success', __('Currency settings updated successfully.'));
        } catch (Exception $e) {
            return redirect()->back()->with('error', __('Failed to update currency settings: :error', ['error' => $e->getMessage()]));
        }
    }
}
