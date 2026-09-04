<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\SignInHistory;
use Exception;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the sign in page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/sign-in', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
            'settings' => settings(),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        $this->logsignInHistory($request);

        // Check if email verification is enabled and user is not verified
        $emailVerificationEnabled = getSetting('emailVerification', false);
        if ($emailVerificationEnabled && !$request->user()->hasVerifiedEmail()) {
            return redirect()->route('verification.notice');
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }

    private function logsignInHistory(Request $request): void
    {
        $ipAddress = $request->ip_address();
        $locationData = $this->getLocationData($ipAddress);
        $userAgent = $request->userAgent();
        $browserData = parseBrowserData($userAgent);
        $details = array_merge($locationData, $browserData, [
            'status' => 'success',
            'referrer_host' => $request->headers->get('referer') ? parse_url($request->headers->get('referer'), PHP_URL_HOST) : null,
            'referrer_path' => $request->headers->get('referer') ? parse_url($request->headers->get('referer'), PHP_URL_PATH) : null,
        ]);
        $ipAddressHistory = new signInHistory();
        $ipAddressHistory->user_id = Auth::id();
        $ipAddressHistory->ip_address = $ipAddress;
        $ipAddressHistory->date = now()->toDateString();
        $ipAddressHistory->details = $details;
        $ipAddressHistory->type = Auth::user()->type;
        $ipAddressHistory->created_by = createdBy();
        $ipAddressHistory->save();
    }

    private function getLocationData(string $ipAddress): array
    {
        try {
            $response = Http::timeout(5)->get("http://ip-api.com/json/{$ipAddress}");
            if ($response->successful()) {
                $data = $response->json();

                return [
                    'country' => $data['country'] ?? null,
                    'countryCode' => $data['countryCode'] ?? null,
                    'region' => $data['region'] ?? null,
                    'regionName' => $data['regionName'] ?? null,
                    'city' => $data['city'] ?? null,
                    'zip' => $data['zip'] ?? null,
                    'lat' => $data['lat'] ?? null,
                    'lon' => $data['lon'] ?? null,
                    'timezone' => $data['timezone'] ?? null,
                    'isp' => $data['isp'] ?? null,
                    'org' => $data['org'] ?? null,
                    'as' => $data['as'] ?? null,
                    'query' => $data['query'] ?? $ipAddress,
                ];
            }
        } catch (Exception $e) {
            // Ignore API errors
        }

        return ['query' => $ipAddress];
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
