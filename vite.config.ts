import { defineConfig, type Plugin } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

/**
 * -----------------------------------------------------------------------------
 * Custom Plugin: Strip `"use client"` Directives
 * -----------------------------------------------------------------------------
 *
 * Purpose:
 * - Removes `"use client"` directives found in some third-party libraries
 *   (primarily designed for Next.js environments).
 *
 * Why:
 * - Vite + SSR does not use this directive
 * - It can interfere with bundling or create inconsistent SSR/client behavior
 *
 * Scope:
 * - Applied only to JavaScript/TypeScript source files
 * - Runs before other transforms (`enforce: 'pre'`)
 */
function stripUseClientDirective(): Plugin {
    return {
        name: 'strip-use-client-directive',
        enforce: 'pre',
        transform(code, id) {
            if (!/\.(j|t)sx?$/.test(id)) return;

            if (code.includes('use client')) {
                return code.replace(/["']use client["'];?\s*/g, '');
            }
        }
    };
}

/**
 * -----------------------------------------------------------------------------
 * Vite Configuration
 * -----------------------------------------------------------------------------
 */
export default defineConfig(({ mode }) => {
    const isProduction = mode === 'production';

    return {
        /**
         * Base public path.
         *
         * Empty string ensures assets are served relative to the current domain.
         * Works well with Laravel routing and avoids hardcoded paths.
         */
        base: '',

        /**
         * Order matters:
         * - Laravel plugin initializes entry points and HMR
         * - React plugin handles JSX + Fast Refresh
         * - Custom plugin runs before transforms
         * - Tailwind processes CSS utilities
         */
        plugins: [
            laravel({
                /**
                 * Entry points for client-side assets
                 */
                input: ['resources/css/app.css', 'resources/js/app.tsx'],

                /**
                 * SSR entry point
                 */
                ssr: 'resources/js/ssr.tsx',

                /**
                 * Enable automatic browser refresh in development
                 */
                refresh: true,
                /**
                 * Use custom build directory name used instead of Laravel's default `build`.
                 */
                buildDirectory: 'static'
            }),

            react({
                /**
                 * Use modern JSX runtime (no need to import React manually)
                 */
                jsxRuntime: 'automatic'
            }),

            stripUseClientDirective(),

            tailwindcss()
        ],

        /**
         * Improves import ergonomics and avoids deep relative paths.
         * Also ensures consistency across client and SSR builds.
         */
        resolve: {
            alias: {
                '@': resolve(import.meta.dirname, 'resources/js'),
                '@components': resolve(import.meta.dirname, 'resources/js/components'),
                '@pages': resolve(import.meta.dirname, 'resources/js/pages'),
                '@hooks': resolve(import.meta.dirname, 'resources/js/hooks'),
                '@lib': resolve(import.meta.dirname, 'resources/js/lib'),
                '@types': resolve(import.meta.dirname, 'resources/js/types'),
                '@images': resolve(import.meta.dirname, 'resources/images'),

                /**
                 * Ziggy route helper (Laravel → JS bridge)
                 *
                 * Note:
                 * - This couples frontend to Laravel routing
                 * - Consider isolating usage if scaling architecture later
                 */
                'ziggy-js': resolve(import.meta.dirname, 'vendor/tightenco/ziggy')
            }
        },

        /**
         * ---------------------------------------------------------------------
         * CSS Configuration
         * ---------------------------------------------------------------------
         *
         * CSS Modules:
         * - Dev: readable class names for debugging
         * - Prod: short hashed names for smaller output and reduced leakage
         */
        css: {
            modules: {
                generateScopedName: isProduction
                    ? '[hash:base64:6]'
                    : '[name]__[local]__[hash:base64:6]'
            }
        },

        /**
         * ---------------------------------------------------------------------
         * Build Configuration
         * ---------------------------------------------------------------------
         *
         * Focus:
         * - Long-term caching
         * - Stable output
         * - Optimized bundle size
         */
        build: {
            /**
             * Production output directory.
             * Must stay synchronized with:
             *   - Laravel Vite plugin `buildDirectory`
             *   - Blade `@vite(..., 'static')`
             */
            outDir: 'public/static',
            emptyOutDir: true,
            /**
             * Directory for built assets (relative to outDir)
             */
            assetsDir: 'cdn',

            /**
             * Disable sourcemaps in production
             * (enable only if debugging production issues)
             */
            sourcemap: false,

            /**
             * Fast minification using esbuild
             */
            minify: 'esbuild',

            /**
             * Rollup-specific output configuration
             */
            rollupOptions: {
                output: {
                    /**
                     * File naming strategy
                     *
                     * - Uses hashes for cache busting
                     * - Avoids exposing framework/library names
                     */
                    entryFileNames: 'cdn/kakbima-[hash].js',
                    chunkFileNames: 'cdn/kbm-[hash].js',
                    assetFileNames: 'cdn/kbm-sst-[hash][extname]',

                    /**
                     * Manual chunk splitting strategy
                     *
                     * Goals:
                     * - Isolate stable dependencies (React)
                     * - Separate UI libraries
                     * - Keep vendor fallback predictable
                     */
                    manualChunks(id: string) {
                        if (!id.includes('node_modules')) return;

                        /**
                         * Core React runtime (rarely changes)
                         */
                        if (id.includes('/react/') || id.includes('react-dom')) {
                            return 'core';
                        }

                        /**
                         * UI component libraries (e.g., Radix)
                         */
                        if (id.includes('@radix-ui')) {
                            return 'ui';
                        }

                        /**
                         * Fallback vendor chunk
                         */
                        return 'vendor';
                    }
                }
            }
        },

        /**
         * ---------------------------------------------------------------------
         * Environment Variables
         * ---------------------------------------------------------------------
         *
         * Only expose variables prefixed with VITE_ to the client.
         * Prevents accidental leakage of sensitive server-side values.
         */
        envPrefix: 'VITE_',

        /**
         * ---------------------------------------------------------------------
         * Server-Side Rendering (SSR)
         * ---------------------------------------------------------------------
         *
         * Ensures critical dependencies are bundled instead of externalized.
         *
         * Why:
         * - Prevents multiple React instances
         * - Avoids hydration mismatches
         * - Keeps SSR/client output consistent
         */
        ssr: {
            noExternal: ['react', 'react-dom']
        },

        /**
         * ---------------------------------------------------------------------
         * Dependency Optimization (Dev Only)
         * ---------------------------------------------------------------------
         *
         * Optional:
         * - Speeds up dev server startup
         * - Pre-bundles frequently used dependencies
         *
         * Add entries here only if you observe slow cold starts.
         */
        optimizeDeps: {
            include: ['@inertiajs/react']
        }
    };
});
