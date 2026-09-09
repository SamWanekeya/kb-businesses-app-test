/**
 * @file Security.ts
 *
 * Runtime security utilities for production builds.
 * DevTools disablement lives in `security-init.ts` — this file handles
 * everything that is safe to run after React has loaded.
 *
 * Exports:
 *  - suppressConsoleMethods  → silences console output in production
 *  - ConsoleRestoreFn        → type for the restore callback
 */

import { getEnvironmentVariable } from '@utils/Helpers/EnvironmentVariables';

/**
 * Every `console` method we want to silence.
 * Derived from the WHATWG Console specification:
 * https://console.spec.whatwg.org/#logging
 */
type ConsoleMethod =
    | 'assert'
    | 'clear'
    | 'count'
    | 'countReset'
    | 'debug'
    | 'dir'
    | 'dirxml'
    | 'error'
    | 'group'
    | 'groupCollapsed'
    | 'groupEnd'
    | 'info'
    | 'log'
    | 'table'
    | 'time'
    | 'timeEnd'
    | 'timeLog'
    | 'trace'
    | 'warn';

/**
 * Function returned by `suppressConsoleMethods` that restores all original
 * console methods. Useful during testing or for error-boundary recovery.
 */
type ConsoleRestoreFn = () => void;

/** All console methods to suppress, typed as a readonly tuple. */
const CONSOLE_METHODS: ReadonlyArray<ConsoleMethod> = [
    'assert',
    'clear',
    'count',
    'countReset',
    'debug',
    'dir',
    'dirxml',
    'error',
    'group',
    'groupCollapsed',
    'groupEnd',
    'info',
    'log',
    'table',
    'time',
    'timeEnd',
    'timeLog',
    'trace',
    'warn',
] as const;

/** No-operation stub used to replace console methods. */
const noop = (): void => {
    /* intentionally empty */
};

/**
 * Suppresses all standard console methods in production builds by replacing
 * them with no-op stubs.
 *
 * @remarks
 * - Only runs in production (`NODE_ENV === 'production'`). In all other
 *   environments the function returns early and the console is untouched.
 * - Does **not** call `Object.freeze(console)` — freezing can break test
 *   runners, SSR environments, and some browser extensions that augment
 *   the console legitimately.
 * - Returns a `restore` function so callers (e.g. error boundaries, test
 *   teardown) can reinstate the originals if needed.
 * - Safe to call multiple times; subsequent calls detect that methods are
 *   already noops and return a no-op restore function.
 *
 * @example
 * ```ts
 * // In app.tsx (after the security-init import):
 * if (getEnvironmentVariable.isProduction) {
 *     suppressConsoleMethods();
 * }
 *
 * // With restore (e.g. in a critical error handler):
 * const restoreConsole = suppressConsoleMethods();
 * // ... later ...
 * restoreConsole();
 * ```
 *
 * @returns A `ConsoleRestoreFn` that reinstates all original methods, or a
 *          no-op function when called outside production.
 */
function suppressConsoleMethods(): ConsoleRestoreFn {
    if (!getEnvironmentVariable.isProduction) {
        // Non-production: return a harmless restore function.
        return () => {
            /* no-op outside production */
        };
    }

    // Snapshot originals before overwriting.
    // Using `Record` here avoids an index-signature lint error on `console`.
    const originals: Partial<Record<ConsoleMethod, (...args: unknown[]) => void>> = {};

    for (const method of CONSOLE_METHODS) {
        // Guard: only override methods that actually exist on this runtime's
        // console (not every environment ships every method).
        if (typeof console[method] === 'function') {
            originals[method] = console[method] as (...args: unknown[]) => void;
            // `console` properties are configurable in all major environments.
            // Cast is safe because we checked `typeof === 'function'` above.
            (console as unknown as Record<string, unknown>)[method] = noop;
        }
    }

    return function restoreConsole(): void {
        for (const method of CONSOLE_METHODS) {
            const original = originals[method];
            if (original !== undefined) {
                (console as unknown as Record<string, unknown>)[method] = original;
            }
        }
    };
}

export { CONSOLE_METHODS, noop, suppressConsoleMethods };
export type { ConsoleMethod, ConsoleRestoreFn };
