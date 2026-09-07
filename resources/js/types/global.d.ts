// resources/js/types/global.d.ts
export {};

import type { KbSettings } from '@/utils/GlobalSettings';
import type { SidebarSettings } from '@components/SidebarStyleSettings';

declare global {
    /**
     * Server-driven UI configuration injected into the initial Inertia payload.
     *
     * These values are treated as runtime configuration, not reactive state.
     * They are expected to be read once during boot (e.g., layout initialization)
     * and used to configure directionality and sidebar behavior.
     *
     * Keep this aligned with the Laravel-side global settings contract.
     */
    interface GlobalSettings {
        layout_direction?: 'ltr' | 'rtl';
        sidebar_variant?: SidebarSettings['variant'];
        sidebar_style?: string;
    }

    /**
     * Augments the global `window` object with the subset of the Inertia
     * page payload we rely on before React hydration.
     *
     * This exists specifically for early bootstrapping concerns
     * (e.g., setting `dir` on `<html>` to prevent layout shift).
     *
     * Do not expand this casually — it mirrors part of Inertia's runtime
     * shape and should stay minimal.
     */
    interface Window {
        page?: {
            props?: {
                globalSettings?: GlobalSettings;
            };
        };
        kbSettings: KbSettings;
    }
}
