/**
 * @file Performance.ts
 * @description Browser performance utilities: lazy image loading and Core Web
 * Vitals / resource-timing monitoring.
 *
 * ## Usage
 *
 * ```ts
 * // app.tsx — call once at entry-point startup
 * initPerformanceMonitoring();
 *
 * document.addEventListener('DOMContentLoaded', () => {
 *     lazyLoadImages();
 * });
 * ```
 *
 * ## Design notes
 *
 * - Each `PerformanceObserver` subscription is isolated in its own try/catch.
 *   A browser that supports `resource` timing but not `largest-contentful-paint`
 *   (e.g. Firefox < 122) must not lose resource logging because LCP threw.
 * - `initPerformanceMonitoring` returns a `disconnect` handle. Call it in
 *   component teardown or hot-reload hooks to prevent duplicate observers
 *   across HMR cycles.
 * - Console output is unconditional here; callers gate on `NODE_ENV` via
 *   `suppressConsoleMethods()` in security-init. This keeps logging concerns
 *   in one place.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Handle returned by `initPerformanceMonitoring` that disconnects all
 * active `PerformanceObserver` instances.
 */
export interface PerformanceMonitorHandle {
    /** Disconnects all active observers registered by this call. */
    disconnect: () => void;
}

/**
 * Shape of a `layout-shift` PerformanceEntry.
 * TypeScript's lib.dom.d.ts ships `LayoutShift` in TS ≥ 4.4; this augments
 * it for projects on older compiler targets.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/LayoutShift
 */
interface LayoutShiftEntry extends PerformanceEntry {
    /** Cumulative Layout Shift score for this frame (0–1). */
    readonly value: number;
    /** True when the shift was caused by user interaction (excluded from CLS). */
    readonly hadRecentInput: boolean;
}

/**
 * Narrowed type for `largest-contentful-paint` entries.
 * `startTime` (inherited from `PerformanceEntry`) holds the LCP timestamp in ms.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/LargestContentfulPaint
 */
type LCPEntry = PerformanceEntry;

/**
 * Narrowed type for `first-input` entries.
 * `processingStart` is the timestamp when the browser began handling the event.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/PerformanceEventTiming
 */
interface FirstInputEntry extends PerformanceEntry {
    /** Timestamp when the browser started processing the first user input. */
    readonly processingStart: DOMHighResTimeStamp;
}

// ---------------------------------------------------------------------------
// Lazy image loading
// ---------------------------------------------------------------------------

/**
 * Options accepted by `lazyLoadImages`.
 */
export interface LazyLoadOptions {
    /**
     * CSS selector for images to observe. Defaults to `'img[data-src]'`.
     * Override when using a custom attribute or a different element type.
     */
    selector?: string;
    /**
     * `IntersectionObserver` root margin. Enlarging this value starts loading
     * images slightly before they scroll into view, reducing perceived latency
     * on fast-scrolling users. Defaults to `'200px'`.
     */
    rootMargin?: string;
}

/**
 * Wires up lazy loading for images that carry a `data-src` attribute (or a
 * custom selector) using `IntersectionObserver`.
 *
 * Behaviour:
 * - When a watched image enters the viewport (± `rootMargin`), its `data-src`
 *   value is promoted to `src` and the observer stops watching that element.
 * - Falls back to eager loading for browsers without `IntersectionObserver`
 *   (covers < 2% of global traffic as of 2024, mainly older Safari/UC Browser).
 *
 * @param options - Optional configuration; see {@link LazyLoadOptions}.
 *
 * @example
 * ```html
 * <!-- Mark images for deferred loading in your Blade/JSX templates -->
 * <img data-src="/images/hero.webp" alt="Hero banner" width="1200" height="630" />
 * ```
 * ```ts
 * // Wire up in your DOMContentLoaded handler
 * document.addEventListener('DOMContentLoaded', () => lazyLoadImages());
 * ```
 */
export function lazyLoadImages(options: LazyLoadOptions = {}): void {
    const { selector = 'img[data-src]', rootMargin = '200px' } = options;

    /**
     * Promotes `data-src` -> `src` for a single image element and removes
     * the `data-src` attribute so the image is not processed twice.
     */
    function loadImage(img: HTMLImageElement): void {
        const src = img.dataset.src;
        if (!src) return;
        img.src = src;
        img.removeAttribute('data-src');
    }

    const targets = document.querySelectorAll<HTMLImageElement>(selector);
    if (targets.length === 0) return;

    if (!('IntersectionObserver' in window)) {
        // Fallback: load all matched images immediately.
        // This path is hit on browsers that predate IntersectionObserver (see MDN compat).
        targets.forEach(loadImage);
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const img = entry.target as HTMLImageElement;
                loadImage(img);
                observer.unobserve(img);
            });
        },
        { rootMargin },
    );

    targets.forEach((img) => {
        observer.observe(img);
    });
}

// ---------------------------------------------------------------------------
// Performance monitoring
// ---------------------------------------------------------------------------

/**
 * Registers `PerformanceObserver` instances for the three Core Web Vitals and
 * for API / XHR resource timing.
 *
 * ### Metrics captured
 *
 * | Signal | Entry type | What we log |
 * |---|---|---|
 * | LCP | `largest-contentful-paint` | Render timestamp in ms |
 * | FID | `first-input` | Input delay in ms |
 * | CLS | `layout-shift` | Shift score (user-initiated shifts excluded) |
 * | API latency | `resource` (fetch / XHR only) | URL + duration in ms |
 *
 * ### Console output (dev only)
 * Console methods are silenced in production by `suppressConsoleMethods()` in
 * `security-init.ts`. No `NODE_ENV` guards are needed here — keeping all
 * logging decisions in one place avoids scattered conditional blocks.
 *
 * @returns A {@link PerformanceMonitorHandle} whose `disconnect()` method
 *   tears down all observers. Call this in HMR cleanup hooks or test teardown
 *   to prevent duplicate observers accumulating across hot reloads.
 *
 * @example
 * ```ts
 * const monitor = initPerformanceMonitoring();
 *
 * // Vite HMR cleanup
 * if (import.meta.hot) {
 *     import.meta.hot.dispose(() => monitor.disconnect());
 * }
 * ```
 */
export function initPerformanceMonitoring(): PerformanceMonitorHandle {
    const observers: PerformanceObserver[] = [];

    if (!('PerformanceObserver' in window)) {
        return {
            disconnect: () => {
                /* browser lacks PerformanceObserver; nothing to clean up */
            },
        };
    }

    // Largest Contentful Paint
    // LCP is the timestamp at which the largest above-the-fold element finished
    // rendering. Target: < 2 500 ms for a "Good" score per web.dev/lcp.
    try {
        const lcpObserver = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry: LCPEntry) => {
                console.log(`[LCP] ${entry.startTime.toFixed(0)}ms`);
            });
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        observers.push(lcpObserver);
    } catch {
        console.warn('[Performance] LCP observer not supported in this browser.');
    }

    // First Input Delay
    // FID measures the delay between the first user interaction and when the
    // browser can begin processing it. Target: < 100 ms ("Good").
    // Note: FID is deprecated in favour of INP (Interaction to Next Paint) in
    // the 2024 CWV update, but remains useful for backwards-compatible tooling.
    try {
        const fidObserver = new PerformanceObserver((list) => {
            list.getEntries().forEach((rawEntry) => {
                const entry = rawEntry as FirstInputEntry;
                const delay = (entry.processingStart - entry.startTime).toFixed(0);
                console.log(`[FID] ${delay}ms input delay`);
            });
        });
        fidObserver.observe({ type: 'first-input', buffered: true });
        observers.push(fidObserver);
    } catch {
        console.warn('[Performance] FID observer not supported in this browser.');
    }

    // Cumulative Layout Shift
    // CLS accumulates the visual instability score across all non-user-triggered
    // layout shifts. Target: < 0.1 ("Good"). We skip `hadRecentInput` shifts
    // per the spec — those are caused by intentional interaction and should
    // not penalise the score.
    try {
        const clsObserver = new PerformanceObserver((list) => {
            list.getEntries().forEach((rawEntry) => {
                const entry = rawEntry as LayoutShiftEntry;
                if (!entry.hadRecentInput) {
                    console.log(`[CLS] shift score: ${entry.value.toFixed(4)}`);
                }
            });
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
        observers.push(clsObserver);
    } catch {
        console.warn('[Performance] CLS observer not supported in this browser.');
    }

    // API / XHR resource timing
    // Logs fetch and XHR request durations. Useful for catching slow API calls
    // early in development before they become production incidents.
    // Other initiator types (script, img, css) are deliberately excluded to
    // keep the console signal-to-noise ratio high.
    try {
        const resourceObserver = new PerformanceObserver((list) => {
            list.getEntries().forEach((rawEntry) => {
                const entry = rawEntry as PerformanceResourceTiming;
                if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
                    console.log(`[API] ${entry.name} : ${entry.duration.toFixed(0)}ms`);
                }
            });
        });
        resourceObserver.observe({ type: 'resource', buffered: true });
        observers.push(resourceObserver);
    } catch {
        console.warn('[Performance] Resource timing observer not supported in this browser.');
    }

    return {
        disconnect(): void {
            observers.forEach((observer) => {
                observer.disconnect();
            });
            observers.length = 0;
        },
    };
}
