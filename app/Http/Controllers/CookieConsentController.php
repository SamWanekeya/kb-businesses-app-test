<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class CookieConsentController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->all();
        $csvFile = storage_path('app/cookie-consents.csv');

        // Create headers if file doesn't exist
        if (!file_exists($csvFile)) {
            $headers = array_keys($data);
            file_put_contents($csvFile, implode(',', $headers) . "\n");
        }

        // Append data
        $values = array_map(function ($value) {
            return is_string($value) ? '"' . str_replace('"', '""', $value) . '"' : $value;
        }, array_values($data));

        file_put_contents($csvFile, implode(',', $values) . "\n", FILE_APPEND);

        return response()->json(['success' => true]);
    }

    public function download()
    {
        $csvFile = storage_path('app/cookie-consents.csv');

        if (!file_exists($csvFile)) {
            // Return an empty CSV with generic headers instead of failing
            $headers = ['necessary', 'analytics', 'marketing', 'timestamp', 'consentType', 'userAgent', 'language', 'url', 'ip', 'country', 'city', 'region', 'network', 'version', 'region_code', 'country_name', 'country_code', 'country_code_iso3', 'country_capital', 'country_tld', 'continent_code', 'in_eu', 'postal', 'latitude', 'longitude', 'timezone', 'utc_offset', 'country_calling_code', 'currency', 'currency_name', 'languages', 'country_area', 'country_population', 'asn', 'org'];
            file_put_contents($csvFile, implode(',', $headers) . "\n");
        }

        return response()->download($csvFile, 'cookie-consents-' . date('Y-m-d') . '.csv');
    }
}
