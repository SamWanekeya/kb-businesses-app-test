/**
 * @file SecurityInit.ts
 *
 * ## Import order requirement
 *
 * This file MUST be the first static import in app.tsx. ES module static
 * imports are hoisted and resolved in declaration order — placing this first
 * guarantees `installDisabledDevToolsHook` executes before React reads
 * `window.__REACT_DEVTOOLS_GLOBAL_HOOK__`.
 *
 * ```ts
 * // app.tsx — line 1, nothing above this
 * import '@/utils/Helpers/SecurityInit';
 * ```
 *
 * The module guards all side-effects behind `import.meta.env.PROD`, so it is
 * safe to import unconditionally. Vite removes the dead branch entirely from
 * development builds during tree-shaking.
 *
 * ## Two-phase execution model
 *
 * | Phase | Trigger | Responsibility |
 * |---|---|---|
 * | 1 — Module eval | First `import` resolution, before React | Installs disabled DevTools hook |
 * | 2 — Post-hydration | Caller invokes `scrubFingerprints()` after `hydrateRoot` | Clears window globals + DOM attributes |
 *
 * ```ts
 * // Inside createInertiaApp setup(), after mounting:
 * if (import.meta.env.PROD) {
 *     scrubFingerprints({ inertiaRootEl: el });
 * }
 * ```
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Minimal shape of React 19's DevTools global hook.
 * React checks `isDisabled` first — if `true` it skips all DevTools setup.
 *
 * @see https://github.com/facebook/react/blob/main/packages/react-devtools-shared/src/hook.js
 */
interface ReactDevToolsGlobalHook {
    readonly isDisabled: true;
    inject: () => void;
    readonly renderers: Map<unknown, unknown>;
    readonly rendererInterfaces: Map<unknown, unknown>;
    /**
     * Prevents "unsupported renderer" warnings in some React 19 build configs
     * even when DevTools is disabled.
     */
    readonly supportsFiber: true;
    onCommitFiberRoot?: () => void;
    onCommitFiberUnmount?: () => void;
    onPostCommitFiberRoot?: () => void;
}

/**
 * Window globals that reveal build tooling or framework choice.
 */
interface FingerprintableWindow extends Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: ReactDevToolsGlobalHook | Record<string, unknown>;
    /** Ziggy router config — exposes all named Laravel routes + domain as plain JSON. */
    Ziggy?: unknown;
    /** Set by @vitejs/plugin-react during fast-refresh preamble injection. */
    __vite_plugin_react_preamble_installed__?: unknown;
    /** Vite HMR client namespace. Absent in production but guarded defensively. */
    __vite__?: unknown;
    /**
     * Laravel Breeze / starter kits attach `window.axios = axios` in bootstrap.js.
     * Advertising the HTTP client provides a trivial XHR-hijacking surface in XSS
     * scenarios and is unnecessary once the app is initialised.
     */
    axios?: unknown;
}

declare let window: FingerprintableWindow;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns `true` only when a real browser `window` with a `document` is
 * present. Explicit `Boolean()` cast ensures the return type is always
 * `boolean`, never a DOM object.
 */
function hasWindow(): boolean {
    return typeof window !== 'undefined' && Boolean(window.document);
}

/**
 * Returns `true` when `val` is a plain, non-null, non-array object.
 * Functions are intentionally excluded.
 */
function isPlainObject(val: unknown): val is Record<string, unknown> {
    return val !== null && typeof val === 'object' && !Array.isArray(val);
}

/**
 * Attempts to delete a property from `window`.
 * Falls back to setting it `undefined` on environments (some older WebViews)
 * that disallow deletion of window properties.
 */
function scrubWindowProp(key: keyof FingerprintableWindow): void {
    try {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete window[key];
    } catch {
        (window as unknown as Record<string, unknown>)[key] = undefined;
    }
}

// ---------------------------------------------------------------------------
// Phase 1 — DevTools hook
// ---------------------------------------------------------------------------

/**
 * Installs a sealed, disabled DevTools hook on `window` so React 19 never
 * initialises its DevTools bridge.
 *
 * Strategy:
 *  1. Build the minimal hook object with `isDisabled: true`.
 *  2. Lock it with `Object.defineProperty` (non-configurable, non-writable)
 *     so no third-party script can replace it afterward.
 *  3. Bail out silently if a non-configurable descriptor already exists.
 *
 * @internal Called automatically at module evaluation — only in production.
 */
function installDisabledDevToolsHook(): void {
    if (!hasWindow()) return;

    const existingDescriptor = Object.getOwnPropertyDescriptor(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__');

    // Already locked — don't fight it.
    if (existingDescriptor !== undefined && !existingDescriptor.configurable) return;

    const hook: ReactDevToolsGlobalHook = {
        isDisabled: true,
        inject: () => {
            /* intentionally empty — disables DevTools injection */
        },
        renderers: new Map(),
        rendererInterfaces: new Map(),
        supportsFiber: true,
        onCommitFiberRoot: () => {
            /* noop */
        },
        onCommitFiberUnmount: () => {
            /* noop */
        },
        onPostCommitFiberRoot: () => {
            /* noop */
        },
    };

    Object.defineProperty(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: hook,
    });
}

// ---------------------------------------------------------------------------
// Phase 2 — Post-hydration fingerprint scrubbing
// ---------------------------------------------------------------------------

/** Options for {@link scrubFingerprints}. */
export interface ScrubOptions {
    /**
     * The Inertia root element. When provided, the `data-page` attribute —
     * which contains the full serialised initial page props as plain JSON —
     * is removed after hydration.
     *
     * Pass only after `hydrateRoot` / `createRoot(...).render()` has
     * completed. Inertia reads `data-page` during hydration.
     */
    inertiaRootEl?: Element | null;

    /**
     * When `true`, removes `<meta name="generator">` tags that reveal the
     * server-side framework name/version. Defaults to `true`.
     */
    removeGeneratorMeta?: boolean;
}

/**
 * Removes runtime window globals and DOM attributes that fingerprint your
 * technology stack to anyone who opens DevTools.
 *
 * Call once inside `createInertiaApp`'s `setup()`, immediately after
 * `hydrateRoot` / `createRoot` returns on **first mount only**.
 * Re-renders (Inertia navigations, HMR) do not need a repeat call —
 * all properties are already gone and subsequent calls are safe no-ops.
 *
 * ### What is scrubbed
 *
 * | Target | Why it's a fingerprint |
 * |---|---|
 * | `window.Ziggy` | All named Laravel routes + domain config as plain JSON |
 * | `data-page` attribute | Full Inertia initial page props (auth, shared data, flash) |
 * | `window.__vite_plugin_react_preamble_installed__` | Confirms Vite + React stack |
 * | `window.__vite__` | Confirms Vite build tooling |
 * | `window.axios` | HTTP client reference from some Laravel starter kits |
 * | `<meta name="generator">` | Framework name, sometimes with version |
 *
 *
 * @param options - See {@link ScrubOptions}.
 */
export function scrubFingerprints(options: ScrubOptions = {}): void {
    const { inertiaRootEl, removeGeneratorMeta = true } = options;

    if (!hasWindow()) return;

    // Window globals

    /**
     * `window.Ziggy` is set from Inertia shared props inside `setup()` and
     * captured into the Routes wrapper closure via `initZiggyConfig()` before
     * this runs. Safe to delete — `route()` no longer reads from the window.
     */
    scrubWindowProp('Ziggy');
    scrubWindowProp('__vite_plugin_react_preamble_installed__');
    scrubWindowProp('__vite__');
    scrubWindowProp('axios');

    // DOM

    /**
     * Inertia serialises the full initial page props into `data-page` for SSR
     * hydration. Once React has mounted this is dead weight and a data-exposure
     * risk if raw HTML is cached, logged, or captured by a proxy.
     */
    if (inertiaRootEl instanceof Element) {
        inertiaRootEl.removeAttribute('data-page');
    }

    if (removeGeneratorMeta) {
        document.querySelectorAll<HTMLMetaElement>('meta[name="generator"]').forEach((el) => {
            el.remove();
        });
    }
}

// ---------------------------------------------------------------------------
// Phase 1 side-effect — module evaluation.
//
// Guarded by import.meta.env.PROD so development builds are completely
// unaffected. Vite removes the dead else-branch at build time.
// ---------------------------------------------------------------------------
if (import.meta.env.PROD) {
    installDisabledDevToolsHook();
}

export { hasWindow, installDisabledDevToolsHook, isPlainObject, scrubWindowProp };
export type { FingerprintableWindow, ReactDevToolsGlobalHook };
