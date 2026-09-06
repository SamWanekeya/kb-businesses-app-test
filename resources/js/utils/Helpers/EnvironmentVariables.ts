/**
 * Client-side environment variables exposed through Vite.
 *
 * This is the only supported access point for frontend environment configuration.
 * Keeping the shape explicit prevents ad hoc `import.meta.env` usage from spreading
 * across the application and makes missing variables fail at compile time.
 */
interface ClientEnvironmentVariables {
    readonly isDevelopment: boolean;
    readonly isProduction: boolean;
    readonly mode: string;

    readonly viteDefaultLocale: string;
    readonly appUrl: string;
    readonly domainName: string;
    readonly sessionDomain: string;
    readonly appDemo: string;
}

/**
 * Typed environment configuration resolved at build time by Vite.
 *
 * Values are intentionally exposed as strings to match Vite's runtime behavior.
 * Consumers are expected to handle parsing/coercion where required.
 */
export const getEnvironmentVariable: ClientEnvironmentVariables = {
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    mode: import.meta.env.MODE,

    viteDefaultLocale: import.meta.env.VITE_DEFAULT_LOCALE,
    appUrl: import.meta.env.VITE_APP_URL,
    domainName: import.meta.env.VITE_APP_DOMAIN_NAME,
    sessionDomain: import.meta.env.VITE_SESSION_DOMAIN,
    appDemo: import.meta.env.VITE_APP_DEMO,
};
