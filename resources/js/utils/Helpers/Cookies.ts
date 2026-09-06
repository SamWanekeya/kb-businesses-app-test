/**
 * Cookie Utilities
 *
 * Handles cookie read/write with consistent encoding, typing and defaults.
 */
import { getEnvironmentVariable } from '@/utils/Helpers/EnvironmentVariables';
import { Serializable } from '@/utils/Helpers/Storage';

const cookieMaximumAge = 400 * 24 * 60 * 60; // 400 days
const cookieDomain = getEnvironmentVariable.sessionDomain ? `; Domain=${getEnvironmentVariable.sessionDomain}` : '';

interface CookieOptions {
    maxAgeSeconds?: number;
    domain?: string;
    path?: string;
    secure?: boolean;
    sameSite?: 'Lax' | 'Strict' | 'None';
}

/**
 * Retrieves a cookie value by its name.
 */
export function getRawCookie(cookieName: string): string | null {
    const cookie = document.cookie.split('; ').find((row) => row.startsWith(`${cookieName}=`));

    return cookie ? cookie.split('=')[1] : null;
}

/**
 * Retrieves a cookie value and automatically decodes + parses JSON if applicable.
 */
export function getCookie<T = unknown>(cookieName: string): T | string | null {
    const raw = getRawCookie(cookieName);
    if (!raw) return null;

    const decoded = decodeURIComponent(raw);

    try {
        return JSON.parse(decoded) as T;
    } catch {
        return decoded;
    }
}

/**
 * Serialize value safely.
 */
function serialize(value: Serializable): string {
    return typeof value === 'string' ? value : JSON.stringify(value);
}

/**
 * Stores a value in a cookie with optional expiration (in seconds).
 */
export function storeCookie<T extends Serializable>(cookieName: string, value: T, options: CookieOptions = {}): void {
    const { maxAgeSeconds = cookieMaximumAge, path = '/', secure = true, sameSite = 'Lax' } = options;

    let serialized: string;

    try {
        serialized = serialize(value);
    } catch (error) {
        if (getEnvironmentVariable.isDevelopment) {
            // eslint-disable-next-line
            console.error(`Failed to serialize cookie value: ${error.message}`);
        }
        return;
    }

    const parts = [
        `${cookieName}=${encodeURIComponent(serialized)}`,
        `Max-Age=${maxAgeSeconds}${cookieDomain}`,
        `Path=${path}`,
        `SameSite=${sameSite}`,
    ];

    if (secure) parts.push('Secure');

    document.cookie = parts.join('; ');
}

/**
 * Deletes a cookie by name.
 *
 * @param {string} cookieName - The cookie name.
 */
export function removeCookieByName(cookieName: string): void {
    document.cookie = `${cookieName}=; path=/; Secure; Max-Age=0${cookieDomain}; SameSite=Lax;`;
}
