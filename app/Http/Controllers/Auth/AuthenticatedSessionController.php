<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\SignInRequest;
use App\Models\SignInHistory;
use App\Models\User;
use Exception;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use WhichBrowser\Parser;

class AuthenticatedSessionController extends Controller
{
    /**
     * Synchronize the authenticated user's preferences with browser cookies.
     *
     * @param User $user The authenticated user whose preferences are being synced.
     *
     * @return void
     */
    protected function syncUserPreferencesToCookies(User $user): void
    {
        $minutes = 400 * 24 * 60; // 400 days in minutes

        Cookie::queue(
            cookie(
                name: '__kb_lcl',
                value: $user->lang,
                minutes: $minutes,
                path: '/',
                secure: true,
                httpOnly: false,
                sameSite: 'Lax'
            )
        );

        Cookie::queue(
            cookie(
                name: '__kb_thm_md',
                value: $user->theme_mode,
                minutes: $minutes,
                path: '/',
                secure: true,
                httpOnly: false,
                sameSite: 'Lax'
            )
        );
    }

    /**
     * Display the sign-in page.
     *
     * @param Request $request
     *
     * @return Response
     */
    public function create(Request $request): Response
    {
        return Inertia::render('Account/SignIn', [
            'status' => $request->session()->get('status'),
            'settings' => settings(),
        ]);
    }

    /**
     * Authenticate the user and initialize their session context.
     *
     * This method orchestrates the full sign-in flow beyond credential validation:
     * - Delegates authentication, rate limiting, and eligibility checks to SignInRequest.
     * - Regenerates the session to prevent fixation attacks.
     * - Synchronizes persisted user preferences (language, theme) into long-lived cookies.
     * - Collects and enriches sign-in metadata (IP, geolocation, browser, OS, device type, referrer).
     * - Persists a SignInHistory record for auditing and analytics purposes.
     *
     * Business rules:
     * - Bot traffic (as detected via user agent parsing) is not tracked and is redirected immediately.
     * - Ownership of the sign-in record (`created_by`) is derived based on role hierarchy:
     *   - super_admin -> self
     *   - organization -> creator or self
     *   - others -> resolved organization context or self
     *
     * External effects:
     * - Writes a new session (session regeneration).
     * - Queues preference cookies (__kb_lcl, __kb_thm_md).
     * - Performs an external HTTP request to ip-api.com for geolocation (best-effort, failure-tolerant).
     * - Parses user agent via WhichBrowser.
     * - Persists a SignInHistory database record.
     * - Mutates PHP runtime timezone if a valid timezone is resolved.
     * - Logs failures for observability without interrupting authentication flow.
     *
     * Failure handling:
     * - All non-critical operations (geolocation lookup, user agent parsing, history persistence,
     *   timezone setting) are best-effort and fail silently with logging.
     * - Authentication failure handling is delegated to SignInRequest.
     *
     *
     * @throws ValidationException When authentication fails (via SignInRequest).
     *
     * @return RedirectResponse Redirects to the originally intended destination or dashboard.
     */
    public function authenticate(SignInRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        $this->syncUserPreferencesToCookies(Auth::user());

        $user = Auth::user();

        // Safely get IP address
        $ipAddress = $request->ip() ?? '127.0.0.1';
        try {
            // Get location data with timeout and error handling
            $context = stream_context_create([
                'http' => [
                    'timeout' => 5,
                    'ignore_errors' => true,
                ],
            ]);
            $response = @file_get_contents('http://ip-api.com/php/' . $ipAddress, false, $context);
            $query = $response ? @unserialize($response) : [];
            if (!is_array($query)) {
                $query = [];
            }
        } catch (Exception $e) {
            // Fail silently but log once for investigation
            Log::error($e);

            $query = [];
        }

        $userAgent = $request->userAgent() ?? '';

        try {
            if (!empty($userAgent)) {
                $whichBrowser = new Parser($userAgent);

                if (isset($whichBrowser->device->type) && $whichBrowser->device->type == 'bot') {
                    return redirect()->intended(route('dashboard.index', absolute: false));
                }

                $query['browser_name'] = $whichBrowser->browser->name ?? null;
                $query['os_name'] = $whichBrowser->os->name ?? null;
            }
        } catch (Exception $e) {
            // Fail silently but log once for investigation
            Log::error($e);

            // Continue without browser detection if it fails
        }

        // Get referrer safely
        $referrer = $request->header('Referer') ? parse_url($request->header('Referer')) : null;

        // Set additional details
        $query['browser_language'] = $request->header('Accept-Language') ? mb_substr($request->header('Accept-Language'), 0, 2) : null;
        $query['device_type'] = getDeviceType($userAgent);
        $query['referrer_host'] = !empty($referrer['host']) ? $referrer['host'] : null;
        $query['referrer_path'] = !empty($referrer['path']) ? $referrer['path'] : null;

        // Set timezone safely
        if (!empty($query['timezone'])) {
            try {
                date_default_timezone_set($query['timezone']);
            } catch (Exception $e) {
                // Fail silently but log once for investigation
                Log::error($e);

                // Continue with default timezone if setting fails
            }
        }

        // Save sign in details
        try {

            if ($user->hasRole('super_admin')) {
                $createdBy = $user->id;
            } elseif ($user->hasRole('organization')) {
                $createdBy = $user->created_by ?? $user->id;
            } else {
                $createdBy = getOrganizationId($user->id) ?? $user->id;
            }

            $signInDetails = new SignInHistory();
            $signInDetails->user_id = $user->id;
            $signInDetails->ip_address = $ipAddress;
            $signInDetails->date = now();
            $signInDetails->details = json_encode($query);
            $signInDetails->created_by = $createdBy;
            $signInDetails->save();

        } catch (Exception $e) {
            // Fail silently but log once for investigation
            Log::error('Failed to save sign in details: ' . $e->getMessage());
        }

        return redirect()->intended(route('dashboard.index', absolute: false));
    }

    /**
     * Log out the authenticated user and invalidate the session.
     *
     * @param Request $request
     *
     * @return RedirectResponse
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
