<?php

namespace App\Libraries\Auth;

use Illuminate\Auth\SessionGuard;

/**
 * Class CustomSessionGuard
 *
 * Extends Laravel's SessionGuard to override the default "remember me"
 * (recaller) cookie naming convention.
 *
 * -----------------------------------------------------------------------------
 * CONTEXT
 * -----------------------------------------------------------------------------
 * By default, Laravel generates remember-me cookies using the pattern:
 *
 *     remember_{guard}_{hash}
 *
 * This behavior is not configurable via framework settings and is intentionally
 * treated as an internal implementation detail.
 *
 * In environments where multiple Laravel applications share the same domain
 * (or cookie scope), this can lead to cookie name collisions. This class
 * introduces a controlled override to namespace the cookie more explicitly.
 *
 * -----------------------------------------------------------------------------
 * DESIGN CONSIDERATIONS
 * -----------------------------------------------------------------------------
 * - We extend SessionGuard instead of modifying framework code.
 * - We override only getRecallerName() to minimize surface area.
 * - We preserve Laravel’s internal structure:
 *     {prefix}_{guard}_{hash}
 *   to avoid unintended side effects.
 * - The hash (sha1 of class) is retained to maintain uniqueness across guard
 *   implementations.
 *
 * -----------------------------------------------------------------------------
 * IMPORTANT NOTES
 * -----------------------------------------------------------------------------
 * - This affects ONLY the remember-me cookie name, not its value or behavior.
 * - Existing remember-me cookies (using Laravel's default naming) will become
 *   invalid after deployment. Users will be required to re-authenticate.
 * - Any change to the prefix should be treated as a breaking auth change.
 *
 * -----------------------------------------------------------------------------
 * USAGE
 * -----------------------------------------------------------------------------
 * This guard must be registered via Auth::extend(...) and referenced in
 * config/auth.php under the desired guard (e.g. 'web').
 *
 * -----------------------------------------------------------------------------
 * MAINTENANCE
 * -----------------------------------------------------------------------------
 * This implementation relies on Laravel's internal SessionGuard contract.
 * If Laravel changes how recaller names are generated in future versions,
 * this method should be reviewed.
 */
class CustomSessionGuard extends SessionGuard
{
    /**
     * Get the name of the "recaller" (remember-me) cookie.
     *
     * This overrides Laravel's default naming convention in order to:
     * - Avoid cookie collisions across applications sharing a domain
     * - Provide explicit namespacing for authentication cookies
     *
     * Structure:
     *     __kb_{guard}_{hash}
     *
     * Where:
     * - "__kb_" is the custom application-specific prefix
     * - {guard} is the guard name (e.g. "web")
     * - {hash} ensures uniqueness across guard implementations
     *
     * @return string
     */
    public function getRecallerName(): string
    {
        // We use a custom prefix and the guard name.
        // We replicate the sha1 of the class name to maintain structural
        // parity with the parent Illuminate\Auth\SessionGuard.
        return '__kb_' . $this->name . '_' . sha1(static::class);
    }
}
