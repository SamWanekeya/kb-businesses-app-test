/**
 * Overrides selected Inertia router methods in-place.
 *
 * Currently these are pass-through wrappers (`put`, `patch`, `delete`).
 * They exist to establish a stable interception point for cross-cutting
 * concerns (e.g. global toasts, error handling, request instrumentation).
 *
 * Important:
 * - These overrides intentionally preserve original call signatures.
 * - Behavior must remain identical unless explicitly extended.
 * - Do not introduce side effects here without considering all call sites.
 */

import { SonnerToaster } from '@components/UserInterface/SonnerToaster';
import { router } from '@inertiajs/react';
import { toast as sonnerToast } from 'sonner';

const originalPut = router.put;
const originalDelete = router.delete;
const originalPatch = router.patch;

/**
 * Overrides `router.put` method.
 *
 * @param {string} URL - The URL to send the PUT request to.
 * @param {any} [data] - Optional data payload for the request.
 * @param {any} [options] - Optional Inertia.js request options.
 * @returns {Promise<any>} The result of the original `router.put` call.
 */
router.put = function (url: string, data?: any, options?: any) {
    originalPut.call(this, url, data, options);
};

/**
 * Overrides `router.delete` method.
 *
 * @param {string} URL - The URL to send the DELETE request to.
 * @param {any} [options] - Optional Inertia.js request options.
 * @returns {Promise<any>} The result of the original `router.delete` call.
 */
router.delete = function (url: string, options?: any) {
    originalDelete.call(this, url, options);
};

/**
 * Overrides `router.patch` method.
 *
 * @param {string} URL - The URL to send the PATCH request to.
 * @param {any} [data] - Optional data payload for the request.
 * @param {any} [options] - Optional Inertia.js request options.
 * @returns {Promise<any>} The result of the original `router.patch` call.
 */
router.patch = function (url: string, data?: any, options?: any) {
    originalPatch.call(this, url, data, options);
};

/**
 * Re-export of `sonner` toast API with a controlled extension surface.
 *
 * This should be the only toast entry point used across the app.
 * Wrapping allows us to standardize behavior (styling, lifecycle hooks,
 * deduplication, etc.) without touching call sites.
 *
 * `loading` is explicitly exposed to keep usage consistent with
 * async UI flows.
 */
export const toast = {
    ...sonnerToast,
    /**
     * Display a loading toast.
     *
     * @param {string} message - Message to display in the toast.
     * @param {any} [options] - Optional toast configuration options.
     * @returns {any} The result of `sonnerToast.loading`.
     */
    loading: (message: string, options?: any) => {
        return sonnerToast.loading(message, options);
    },
};

/**
 * Application-level toaster instance.
 *
 * Centralizes configuration (position, duration, styling).
 * Should be mounted once near the root layout.
 *
 * Any changes here affect all toast usage globally.
 */
export const CustomToast = () => {
    return <SonnerToaster position="top-right" duration={4000} richColors closeButton />;
};
