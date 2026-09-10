<?php

namespace App\Rules;

use App\Support\BlockedEmailProvider;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Class WorkEmail
 *
 * Validates that a given email address belongs to a "work" domain.
 *
 * This rule rejects email addresses that are likely to originate from
 * free or disposable email providers. It relies on a centralized
 * BlockedEmailProvider for domain and keyword configuration.
 *
 * Validation Strategy:
 * --------------------
 * 1. Extract the domain portion of the email address.
 * 2. Reject if the domain exactly matches a blocked domain.
 * 3. Reject if the domain contains any blocked keyword.
 *
 * Design Notes:
 * -------------
 * - This rule assumes the input has already passed basic email validation
 *   (e.g. via Laravel's `email` rule). It does not attempt to fully validate
 *   email structure.
 * - Domain comparison is performed in a case-insensitive manner.
 * - The BlockedEmailProvider acts as a single source of truth, making
 *   the rule easy to maintain and extend.
 *
 * Example Usage:
 * --------------
 * <code>
 * 'email' => ['required', 'email', new WorkEmail()],
 * </code>
 *
 * @package App\Rules
 */
class WorkEmail implements ValidationRule
{
    /**
     * Validate the given attribute.
     *
     * @param string $attribute The name of the attribute under validation.
     * @param mixed $value The value of the attribute being validated.
     * @param Closure $fail Callback to invoke on validation failure.
     *
     * @return void
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Defensive: ensure we are working with a string
        if (!is_string($value) || !str_contains($value, '@')) {
            $fail(__('Please enter a valid work email address'));

            return;
        }

        $blockedDomains = BlockedEmailProvider::domains();
        $blockedKeywords = BlockedEmailProvider::keywords();

        // Extract domain safely
        $domain = strtolower(substr(strrchr($value, '@'), 1));

        // Exact domain match (e.g. gmail.com)
        if (in_array($domain, $blockedDomains, true)) {
            $fail(__('Please enter a valid work email address'));

            return;
        }

        // Partial keyword match (e.g. "mail", "yahoo", etc.)
        foreach ($blockedKeywords as $keyword) {
            if (str_contains($domain, $keyword)) {
                $fail(__('Please enter a valid work email address'));

                return;
            }
        }
    }
}
