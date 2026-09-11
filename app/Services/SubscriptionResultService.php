<?php

namespace App\Services;

/**
 * Class SubscriptionResultService
 *
 * Immutable value object describing the outcome of
 * a subscription evaluation.
 */
class SubscriptionResultService
{
    public function __construct(
        public bool    $allowed,
        public ?string $message = null,
        public bool    $logout = false,
        public bool    $cleanup = false
    ) {
    }

    /**
     * Allow request to proceed.
     */
    public static function allow(): self
    {
        return new self(true);
    }

    /**
     * Deny request with optional side effects.
     */
    public static function deny(
        string $message,
        bool   $logout = false,
        bool   $cleanup = false
    ): self {
        return new self(false, $message, $logout, $cleanup);
    }
}
