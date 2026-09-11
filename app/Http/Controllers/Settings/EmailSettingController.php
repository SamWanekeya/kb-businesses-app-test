<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Mail\TestMail;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class EmailSettingController extends Controller
{
    public function index(): \Inertia\Response
    {
        return Inertia::render('Settings/EmailSettings');
    }

    /**
     * Get email settings for the authenticated user.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getEmailSettings()
    {
        $settings = [
            'provider' => getSetting('email_provider', 'smtp'),
            'driver' => getSetting('email_driver', 'mailgun'),
            'host' => getSetting('email_host', 'api.eu.mailgun.net'),
            'port' => getSetting('email_port', '587'),
            'username' => getSetting('email_username', 'user@kakbima.dev'),
            'password' => getSetting('email_password', ''),
            'encryption' => getSetting('email_encryption', 'tls'),
            'fromAddress' => getSetting('email_from_address', 'no-reply@kakbima.dev'),
            'fromName' => getSetting('email_from_name', 'Kakbima'),
        ];

        // Mask password if it exists
        if (!empty($settings['password'])) {
            $settings['password'] = '••••••••••••';
        }

        return response()->json($settings);
    }

    /**
     * Update email settings for the authenticated user.
     *
     * @param \Illuminate\Http\Request $request
     */
    public function updateEmailSettings(Request $request)
    {
        $validated = $request->validate([
            'provider' => 'required|string',
            'driver' => 'required|string',
            'host' => 'required|string',
            'port' => 'required|string',
            'username' => 'required|string',
            'password' => 'nullable|string',
            'encryption' => 'required|string',
            'fromAddress' => 'required|email|max:255',
            'fromName' => 'required|string',
        ]);

        updateSetting('email_provider', $validated['provider']);
        updateSetting('email_driver', $validated['driver']);
        updateSetting('email_host', $validated['host']);
        updateSetting('email_port', $validated['port']);
        updateSetting('email_username', $validated['username']);

        // Only update password if provided and not masked
        if (!empty($validated['password']) && $validated['password'] !== '••••••••••••') {
            updateSetting('email_password', $validated['password']);
        }

        updateSetting('email_encryption', $validated['encryption']);
        updateSetting('email_from_address', $validated['fromAddress']);
        updateSetting('email_from_name', $validated['fromName']);

        return redirect()->back()->with('success', __('Email settings updated successfully'));
    }

    /**
     * Send a test email.
     *
     * @param \Illuminate\Http\Request $request
     */
    public function sendTestEmail(Request $request)
    {
        $validator = Validator::make(
            $request->all(),
            [
                'email' => 'required|email|max:255',
            ]
        );

        if ($validator->fails()) {
            return redirect()->back()->with('error', $validator->errors()?->first());
        }

        $settings = [
            'provider' => getSetting('email_provider', 'smtp'),
            'driver' => getSetting('email_driver', 'mailgun'),
            'host' => getSetting('email_host', 'api.eu.mailgun.net'),
            'port' => getSetting('email_port', '587'),
            'username' => getSetting('email_username', 'user@kakbima.dev'),
            'encryption' => getSetting('email_encryption', 'tls'),
            'fromAddress' => getSetting('email_from_address', 'no-reply@kakbima.dev'),
            'fromName' => getSetting('email_from_name', 'Kakbima'),
        ];

        // Get the actual password (not masked)
        $password = getSetting('email_password', '');

        try {
            // Configure mail settings for this request only
            config([
                'mail.default' => $settings['driver'],
                'mail.mailers.smtp.host' => $settings['host'],
                'mail.mailers.smtp.port' => $settings['port'],
                'mail.mailers.smtp.encryption' => $settings['encryption'] === 'none' ? null : $settings['encryption'],
                'mail.mailers.smtp.username' => $settings['username'],
                'mail.mailers.smtp.password' => $password,
                'mail.from.address' => $settings['fromAddress'],
                'mail.from.name' => $settings['fromName'],
            ]);

            // Send test email
            Mail::to($request->email)->send(new TestMail());

            return redirect()->back()->with('success', __('Test email sent successfully to :email', ["email" => $request->email]));
        } catch (Exception $e) {
            // Fail silently but log once for investigation
            Log::error($e);

            // Return an appropriate error response
            return redirect()->back()->with('error', __('Something went wrong. Please try again.'));
        }
    }

    /**
     * Get a setting value for a user.
     *
     * @param int $userId
     * @param string $key
     * @param mixed $default
     *
     * @return mixed
     */

}
