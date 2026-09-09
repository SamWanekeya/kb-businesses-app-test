import { getEnvironmentVariable } from '@utils/Helpers/EnvironmentVariables';

/**
 * Join two URL segments with correct slash handling.
 */
function joinUrl(base: string, path: string): string {
    if (!base) return path;
    if (!path) return base;

    const baseEndsWithSlash = base.endsWith('/');
    const pathStartsWithSlash = path.startsWith('/');

    if (baseEndsWithSlash && pathStartsWithSlash) {
        return base + path.slice(1);
    }

    if (!baseEndsWithSlash && !pathStartsWithSlash) {
        return `${base}/${path}`;
    }

    return base + path;
}

/**
 * Resolve application origin safely.
 * - Browser: window.location.origin
 * - SSR: appUrl or localhost fallback
 */
function getOrigin(): string {
    if (typeof window !== 'undefined' && window.location.origin) {
        return window.location.origin;
    }

    return getEnvironmentVariable.appUrl || 'http://localhost';
}

/**
 * Resolve a media/image URL into a fully qualified, canonical URL.
 *
 * This centralizes how we interpret backend-provided paths vs. user-provided URLs.
 * Callers should treat this as the only entry point for rendering media URLs in the UI.
 *
 * Behavior:
 * - Empty input returns an empty string (callers can render nothing without branching).
 * - Absolute URLs (including protocol-relative) are passed through unchanged.
 * - Paths already containing `storage/media` are treated as canonical media paths and
 *   only get an origin prepended when needed.
 * - All other values are assumed to be relative media paths and are resolved under
 *   `<base>/storage/media/`.
 *
 * Environment considerations:
 * - In the browser, origin is derived from `window.location.origin`.
 * - In SSR, falls back to `appUrl`, then `http://localhost`.
 * - `appUrl` may be relative in some environments; we normalize it to an absolute URL.
 *
 * Invariants enforced here:
 * - Output is always either empty or a fully qualified URL.
 * - `storage/media` appears exactly once in the final URL.
 * - No duplicate or missing slashes regardless of input shape.
 *
 * This function intentionally tolerates loosely formatted inputs since API responses
 * and legacy data are not strictly normalized.
 */
export function resolveImageUrl(path: string): string {
    if (!path) return '';

    // Absolute URL (protocol-relative or https/http)
    if (/^(?:[a-z]+:)?\/\//i.test(path)) {
        return path;
    }

    const origin = getOrigin();

    // Already a media path
    if (path.includes('storage/media')) {
        return path.startsWith('/') ? `${origin}${path}` : `${origin}/${path}`;
    }

    let base: string = getEnvironmentVariable.appUrl || origin;

    // Ensure absolute base
    if (!/^(?:[a-z]+:)?\/\//i.test(base)) {
        base = joinUrl(origin, base);
    }

    // Ensure media prefix exactly once
    if (!base.includes('storage/media')) {
        base = joinUrl(base, 'storage/media/');
    }

    return joinUrl(base, path);
}

/**
 * Creates a Kakbima external URL with an optional subdomain prefix.
 *
 * @param prefix - Optional subdomain prefix.
 * @returns Fully qualified HTTPS URL.
 */
export function createKakbimaExternalUrl(prefix?: string): string {
    const host = prefix ? `${prefix}.${getEnvironmentVariable.domainName}` : getEnvironmentVariable.domainName;

    return new URL(`https://${host}`).href;
}
