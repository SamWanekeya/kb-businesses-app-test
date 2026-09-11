<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;

class MailConfigService
{
    /**
     * Dynamically overrides the application's mail configuration based on the
     * authenticated user's ownership context.
     *
     * This method resolves the effective "owner" of email settings (e.g. super admin
     * or organization creator) and applies their persisted email configuration at runtime.
     * It enables multi-tenant email behavior where outbound mail is sent using
     * tenant-specific SMTP or provider credentials.
     *
     * Workflow:
     * - Resolve the currently authenticated user.
     * - Determine the root account responsible for email configuration:
     *   - `super_admin` -> use the first super admin account.
     *   - `organization` -> use the creator (owner) of the organization.
     *   - other users -> fallback to their creator (assumed tenant owner).
     * - Fetch email-related settings via the `settings()` helper.
     * - Build a normalized configuration array with fallbacks.
     * - Override Laravel mail configuration using the Config repository.
     *
     * Business Rules:
     * - Email configuration is always inherited from the top-level account (tenant owner).
     * - Defaults are applied when specific settings are missing.
     * - `encryption = 'none'` is explicitly mapped to `null` to disable encryption.
     *
     * Dependencies:
     * - {@see \App\Models\User} for resolving ownership hierarchy.
     * - `Auth` facade for current user context.
     * - `Config` facade for runtime configuration overrides.
     * - `settings($userId)` helper for retrieving persisted tenant settings.
     *
     * Side Effects:
     * - Mutates global mail configuration for the current request lifecycle.
     * - Affects all subsequent mail sending operations in the same request.
     *
     * Preconditions:
     * - Must be executed within a valid authenticated context to apply tenant-specific config.
     * - The `settings()` helper must return a consistent key/value structure.
     *
     * Idempotency:
     * - Safe to call multiple times within the same request; subsequent calls will
     *   overwrite configuration with the same resolved values.
     *
     * @return void
     */
    public static function setDynamicConfig()
    {
        $user = Auth::user();
        if (!$user) {
            return;
        }
        if ($user->type == 'super_admin') {
            $user = User::where('type', 'super_admin')?->first();
        } elseif ($user->type == 'organization') {
            $user = User::where('id', $user->created_by)?->first();
        } else {
            $user = User::where('id', $user->created_by)?->first();
        }

        $getSettings = settings($user->id);

        $settings = [
            'driver' => $getSettings['email_driver'] ?? 'mailgun',
            'host' => $getSettings['email_host'] ?? 'api.eu.mailgun.net',
            'port' => $getSettings['email_port'] ?? '587',
            'username' => $getSettings['email_username'] ?? '',
            'password' => $getSettings['email_password'] ?? '',
            'encryption' => $getSettings['email_encryption'] ?? 'tls',
            'fromAddress' => $getSettings['email_from_address'] ?? 'no-reply@kakbima.dev',
            'fromName' => $getSettings['email_from_name'] ?? 'Kakbima',
        ];

        Config::set([
            'mail.default' => $settings['driver'],
            'mail.mailers.smtp.host' => $settings['host'],
            'mail.mailers.smtp.port' => $settings['port'],
            'mail.mailers.smtp.encryption' => $settings['encryption'] === 'none' ? null : $settings['encryption'],
            'mail.mailers.smtp.username' => $settings['username'],
            'mail.mailers.smtp.password' => $settings['password'],
            'mail.from.address' => $settings['fromAddress'],
            'mail.from.name' => $settings['fromName'],
        ]);
    }
}
