<?php

namespace App\Http\Middleware;

use Illuminate\Http\Middleware\TrustHosts as Middleware;

/**
 * Middleware to define trusted host patterns for the application.
 *
 * This helps prevent host header poisoning and ensures that
 * requests are only served for approved domains.
 *
 * Typical use cases include:
 * - Allowing all subdomains of the application URL.
 * - Restricting accepted hosts in multi-domain deployments.
 */
class TrustHosts extends Middleware
{
    /**
     * Get the host patterns that should be trusted.
     *
     * By default, this trusts all subdomains of the application URL,
     * ensuring compatibility with setups like:
     * - Subdomain-based tenants (e.g., tenant.example.com)
     * - Development environments with wildcard DNS
     *
     * @return array<int, string|null> A list of trusted host regex patterns.
     */
    public function hosts(): array
    {
        return [
            $this->allSubdomainsOfApplicationUrl(),
        ];
    }
}
