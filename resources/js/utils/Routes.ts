/**
 * @file Routes.ts
 * @description Type-safe Ziggy route wrapper with lazy config caching.
 *
 * ## Why this file exists
 *
 * In this app, `window.Ziggy` is set inside `createInertiaApp`'s `setup()`
 * callback from Inertia's shared props (`props.initialPage.props.namedRoutes`),
 * not from a Blade `@routes` directive evaluated at page load. This means
 * the config does not exist on `window` at module evaluation time, so it
 * cannot be snapshotted via a simple top-level `window.Ziggy` read.
 *
 * This wrapper solves that with two mechanisms:
 *
 * 1. **`initZiggyConfig(config)`** — called explicitly inside `setup()` right
 *    after `window.Ziggy` is assigned. Stores the config in a module-scoped
 *    closure that persists for the lifetime of the page.
 *
 * 2. **Lazy fallback** — if `route()` is somehow called before
 *    `initZiggyConfig`, it reads `window.Ziggy` as a one-time fallback and
 *    caches the result. Subsequent calls always use the cached value, so
 *    `scrubFingerprints()` can safely delete `window.Ziggy` at any point
 *    after `setup()` without breaking navigation.
 *
 */

import { route as ziggyRoute, type Config, type Router } from 'ziggy-js';

// ---------------------------------------------------------------------------
// Global type augmentation
// ---------------------------------------------------------------------------

declare global {
    interface Window {
        /** Ziggy route config. Set from Inertia shared props in setup(). */
        Ziggy?: Config;
    }
}

// ---------------------------------------------------------------------------
// Module-scoped config cache
// ---------------------------------------------------------------------------

/**
 * Cached Ziggy config. Populated by `initZiggyConfig()` in `setup()`, or
 * lazily from `window.Ziggy` on the first `route()` call — whichever comes
 * first. Intentionally not exported: the config must not be inspectable via
 * `import *` or DevTools module inspection after `window.Ziggy` is scrubbed.
 */
let cachedConfig: Config | undefined;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Stores the Ziggy config in the module-scoped closure.
 *
 * Call this inside `createInertiaApp`'s `setup()` immediately after assigning
 * `window.Ziggy`, before `hydrateRoot` / `createRoot`. This ensures the
 * closure is populated before any component calls `route()` during hydration,
 * and before `scrubFingerprints()` deletes `window.Ziggy`.
 *
 * @param config - The Ziggy `Config` object, typically sourced from
 *   `props.initialPage.props.namedRoutes` in your Inertia `HandleInertiaRequests`
 *   middleware.
 */
export function initZiggyConfig(config: Config): void {
    cachedConfig = config;
}

/**
 * Generates a URL for the named Laravel route.
 *
 * Drop-in replacement for `route()` from `ziggy-js`. All parameters and
 * return types are identical — only the import path changes.
 *
 * The config is read from the module-scoped cache (populated by
 * `initZiggyConfig`) rather than from `window.Ziggy`, so this function
 * is safe to call at any point in the component lifecycle, including after
 * `scrubFingerprints()` has deleted the window global.
 *
 * @param name     - Named route key as defined in Laravel route files.
 * @param params   - Route parameters (positional array or named object).
 * @param absolute - When `true`, always returns an absolute URL. Defaults
 *                   to Ziggy's global `absolute` setting.
 * @returns A {@link Router} instance when called with no arguments, or the
 *          resolved URL string when `name` is provided.
 *
 * @example
 * ```ts
 * route('dashboard.index')                      // '/dashboard'
 * route('posts.show', { id: 42 })         // '/posts/42'
 * route('posts.show', { id: 42 }, true)   // 'https://example.com/posts/42'
 * route().current('dashboard')            // true | false
 * route().has('admin.users.index')        // true | false
 * ```
 */
export function route(
    name?: Parameters<typeof ziggyRoute>[0],
    params?: Parameters<typeof ziggyRoute>[1],
    absolute?: Parameters<typeof ziggyRoute>[2],
): Router & string {
    // Lazy fallback: if initZiggyConfig() hasn't been called yet (e.g. in a
    // test environment or an unusual call order), read window.Ziggy once and
    // cache it. After this point the window property is irrelevant.
    if (!cachedConfig && typeof window !== 'undefined' && window.Ziggy) {
        cachedConfig = window.Ziggy;
    }

    return ziggyRoute(name, params, absolute, cachedConfig) as Router & string;
}
