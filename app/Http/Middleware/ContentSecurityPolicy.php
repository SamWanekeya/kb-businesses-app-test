<?php

namespace App\Http\Middleware;

use Closure;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Class ContentSecurityPolicy
 *
 * Middleware enforcing a strict nonce-based CSP optimized for performance.
 *
 * - Uses a per-request nonce provided by container (app('cspNonce')).
 * - Supports `strict-dynamic` for modern browsers while keeping safe fallbacks.
 * - Adds the nonce attribute to Vite/asset <script> tags in HTML responses (fast regex).
 * - Loads and validates config/csp.php with an in-memory static cache per request.
 * - Exempts Telescope/Horizon endpoints when present.
 *
 * @package App\Http\Middleware
 */
class ContentSecurityPolicy
{
    /**
     * Handle an incoming request and attach CSP headers.
     *
     * @param \Illuminate\Http\Request $request
     * @param \Closure $next
     *
     * @throws \RuntimeException If the nonce is missing from container (shouldn’t happen if provider registers it).
     *
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        // Exempt developer tooling routes while enforcing everywhere else.
        if ($this->shouldBypassForDevTools($request)) {
            return $next($request);
        }

        // Retrieve nonce from container (AppServiceProvider should register it).
        if (!app()->bound('cspNonce')) {
            throw new \RuntimeException('CSP nonce is not bound in the container. Ensure AppServiceProvider registers cspNonce');
        }

        $nonce = app('cspNonce');

        // Proceed and only modify HTML responses (avoid unnecessary work for APIs / Inertia JSON).
        $response = $next($request);

        if (!$this->isHtmlResponse($response)) {
            // Still add headers for non-HTML responses where headers matter (e.g. document requests),
            // but we avoid parsing/manipulating the body.
            $this->attachHeaders($response, $nonce);

            return $response;
        }

        // Attach headers + inject nonce into Vite / asset <script> tags in the HTML body.
        $this->attachHeaders($response, $nonce);

        // Fast pass to add nonce attributes to script tags that belong to Vite/asset bundles.
        $this->injectNonceIntoAssets($response, $nonce);

        return $response;
    }

    /**
     * Determine whether the request should be exempt from CSP (e.g. Telescope, Horizon).
     *
     * @param \Illuminate\Http\Request $request
     *
     * @return bool
     */
    private function shouldBypassForDevTools(Request $request): bool
    {
        // If Telescope is installed and the request is for Telescope, skip enforcement to avoid breaking dev tooling
        if (class_exists(\Laravel\Telescope\Telescope::class) && $request->is(config('telescope.path', 'telescope') . '*')) {
            return true;
        }

        // If Horizon is installed and the request is for Horizon
        if (class_exists(\Laravel\Horizon\Horizon::class) && $request->is(config('horizon.path', 'horizon') . '*')) {
            return true;
        }

        return false;
    }

    /**
     * Attach CSP and related headers to the response.
     *
     * @param \Symfony\Component\HttpFoundation\Response $response
     * @param string $nonce
     *
     * @return void
     */
    private function attachHeaders($response, string $nonce): void
    {
        $cfg = $this->loadValidatedConfig();

        // Convert CSV hashes to quoted tokens (cached per request)
        $scriptHashes = $this->csvToQuotedTokens((string) ($cfg['script_hashes'] ?? ''), 'script');
        $styleHashes = $this->csvToQuotedTokens((string) ($cfg['style_hashes'] ?? ''), 'style');
        $styleAttrHashes = $this->csvToQuotedTokens((string) ($cfg['style_attribute_hashes'] ?? ''), 'style-attribute');

        // Build script-src with nonce + strict-dynamic + safe fallbacks
        // Note: strict-dynamic trusts scripts loaded by nonce; include 'https:' fallback for older browsers.
        $scriptSrcParts = array_merge(
            ["'nonce-{$nonce}'", "'strict-dynamic'"],         // modern recommended
            $this->wrap($cfg['script'] ?? []),                // configured sources (quoted where necessary)
            $scriptHashes                                     // any configured hashes
        );

        // For backwards compatibility, include 'https:' as a fallback - older browsers will treat 'strict-dynamic' as unknown.
        $scriptSrcString = implode(' ', array_merge(["'self'"], $scriptSrcParts, ['https:']));

        // Build style-src
        $styleSrcParts = array_merge(
            ["'nonce-{$nonce}'"],
            $this->wrap($cfg['style'] ?? []),
            $styleHashes
        );

        $styleSrcString = implode(' ', array_merge(["'self'"], $styleSrcParts));

        // Build style-src-attr (allow unsafe-hashes if configured)
        $styleAttrValue = implode(' ', array_merge($this->wrap($cfg['style-attribute'] ?? []), $styleAttrHashes));
        $styleAttrDirective = $styleAttrValue ? "style-src-attr 'unsafe-hashes' {$styleAttrValue}" : '';

        // Other sources
        $imgSrc = implode(' ', $this->wrap($cfg['img'] ?? []));
        $fontSrc = implode(' ', $this->wrap($cfg['font'] ?? []));
        $connectSrc = implode(' ', $this->wrap($cfg['connect'] ?? []));
        $frameSrc = implode(' ', $this->wrap($cfg['frame'] ?? []));

        // Report-To group name and header
        $reportToGroup = $cfg['report_to_group'] ?? 'hf-csp';
        $reportTo = [
            'group' => $reportToGroup,
            'maximum_age' => (int) ($cfg['report_to_maximum_age'] ?? 5184000),
            'endpoints' => [
                ['url' => route($cfg['report_route'] ?? 'csp.report')],
            ],
        ];
        $response->headers->set('Report-To', json_encode($reportTo, JSON_UNESCAPED_SLASHES));

        // Build CSP array in the order of importance
        $csp = [
            "default-src 'self'",
            "script-src {$scriptSrcString}",
            "script-src-attr 'none'",
            "style-src {$styleSrcString}",
            $styleAttrDirective,
            "img-src {$imgSrc}",
            "font-src {$fontSrc}",
            "connect-src {$connectSrc}",
            "object-src 'none'",
            "manifest-src 'self'",
            "media-src 'self'",
            "worker-src 'self' blob:",
            "frame-src {$frameSrc}",
            "form-action 'self'",
            "base-uri 'self'",
            "frame-ancestors 'none'",
            // Trusted-Types: prefer explicit policy or omit. If disabled in config, we don’t include.
            ($cfg['trusted_types'] ?? false) ? ("trusted-types " . ($cfg['trusted_types_policy'] ?? 'default')) : null,
            // Keep both report-to and report-uri for cross-browser compatibility
            "report-to {$reportToGroup}",
            "report-uri " . route($cfg['report_route'] ?? 'csp.report'),
            // Upgrade insecure requests if enabled in config
            ($cfg['upgrade_insecure_requests'] ?? true) ? 'upgrade-insecure-requests' : null,
        ];

        // Filter out nulls and collapse into a string
        $cspHeader = implode('; ', array_filter($csp, fn ($v) => $v !== null && $v !== ''));

        // Set header (enforced mode)
        $response->headers->set('Content-Security-Policy', $cspHeader);
    }

    /**
     * Fast injection of nonce attributes into <script> tags (both inline and external).
     *
     * This implementation:
     * - Targets <script ...> tags that do NOT already have a nonce attribute.
     * - Adds nonce="{value}" before the closing '>' of the opening script tag.
     * - Is PCRE-safe (no variable-length lookbehinds).
     * - Intentionally conservative: it won’t attempt to parse the inner script contents.
     *
     * @param \Symfony\Component\HttpFoundation\Response $response
     * @param string $nonce
     *
     * @return void
     */
    private function injectNonceIntoAssets($response, string $nonce): void
    {
        $content = $response->getContent();

        if (empty($content) || !is_string($content)) {
            return;
        }

        /**
         * Pattern explanation:
         * - <script\b            : opening script tag
         * - (?![^>]*\bnonce=)    : negative lookahead to ensure no 'nonce=' appears in the tag
         * - ([^>]*)              : capture all attributes (if any) up to the closing '>'
         * - >                    : the tag close
         *
         * We match both inline and external scripts. We avoid greedy traps by stopping at the first '>'.
         */
        $pattern = '/<script\b(?![^>]*\bnonce=)([^>]*)>/i';

        $callback = function (array $matches) use ($nonce) {
            // $matches[0] = full opening tag, e.g. "<script type=\"module\">"
            // $matches[1] = attributes string (may be empty or contain src, type, etc.)
            $attrChunk = $matches[1];

            // Build nonce attribute (escaped)
            $nonceAttr = ' nonce="' . htmlspecialchars($nonce, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '"';

            // If tag is self-closing (e.g. <script ... />), place before "/>"
            if (str_ends_with($matches[0], '/>')) {
                return rtrim(substr($matches[0], 0, -2)) . $nonceAttr . ' />';
            }

            // Normal tag: insert before closing '>'
            return rtrim(substr($matches[0], 0, -1)) . $nonceAttr . '>';
        };

        try {
            $new = preg_replace_callback($pattern, $callback, $content);

            // If preg_replace_callback returned null, an error occurred. We keep original content then.
            if ($new !== null) {
                $response->setContent($new);
            }
        } catch (Exception $e) {
            // Fail silently but log once for investigation
            Log::warning('CSP: regex injection failed: ' . $e->getMessage());
        }
    }

    /**
     * Validate and load config/csp.php with request-local static caching for performance.
     *
     * @return array<string,mixed>
     */
    private function loadValidatedConfig(): array
    {
        static $cache = null;

        if ($cache !== null) {
            return $cache;
        }

        $raw = config('csp', []);

        // Basic validation and normalization
        $allowedArrayKeys = [
            'script', 'style', 'img', 'font', 'connect', 'frame',
            'script_hashes', 'style_hashes', 'style_attribute_hashes',
            'report_to_group', 'report_to_maximum_age', 'report_route',
            'trusted_types', 'trusted_types_policy', 'upgrade_insecure_requests',
        ];

        $normalized = [];

        foreach ($allowedArrayKeys as $key) {
            $value = $raw[$key] ?? null;

            // Arrays remain arrays, strings remain strings
            if (is_array($value)) {
                $normalized[$key] = $value;
            } else {
                // keep scalar or default
                $normalized[$key] = $value;
            }
        }

        // Provide sensible defaults where missing
        $normalized['script'] = $normalized['script'] ?? ['https:'];
        $normalized['style'] = $normalized['style'] ?? ['https:'];
        $normalized['img'] = $normalized['img'] ?? ["'self'", 'data:', 'https:'];
        $normalized['font'] = $normalized['font'] ?? ['https:'];
        $normalized['connect'] = $normalized['connect'] ?? ['https:'];
        $normalized['frame'] = $normalized['frame'] ?? ["'self'"];
        $normalized['script_hashes'] = $normalized['script_hashes'] ?? '';
        $normalized['style_hashes'] = $normalized['style_hashes'] ?? '';
        $normalized['style_attribute_hashes'] = $normalized['style_attribute_hashes'] ?? '';
        $normalized['report_to_group'] = $normalized['report_to_group'] ?? 'hf-csp';
        $normalized['report_to_maximum_age'] = $normalized['report_to_maximum_age'] ?? 5184000;
        $normalized['report_route'] = $normalized['report_route'] ?? 'csp.report';
        $normalized['trusted_types'] = $normalized['trusted_types'] ?? false;
        $normalized['trusted_types_policy'] = $normalized['trusted_types_policy'] ?? 'default';
        $normalized['upgrade_insecure_requests'] = $normalized['upgrade_insecure_requests'] ?? true;

        return $cache = $normalized;
    }

    /**
     * Convert a comma-separated list of CSP hash tokens into single-quoted tokens.
     * Caches per type for request lifetime.
     *
     * @param string $raw
     * @param string $type
     *
     * @return array<int,string>
     */
    private function csvToQuotedTokens(string $raw, string $type): array
    {
        static $cache = [];

        if (isset($cache[$type])) {
            return $cache[$type];
        }

        if ($raw === '') {
            return $cache[$type] = [];
        }

        $parts = explode(',', $raw);
        $out = [];

        foreach ($parts as $p) {
            $t = trim($p);
            if ($t !== '') {
                // Ensure already quoted tokens are preserved, otherwise single-quote them.
                if (preg_match("/^'[^']+'$/", $t) || preg_match('/^"[^"]+"$/', $t)) {
                    $out[] = $t;
                } else {
                    $out[] = "'" . $t . "'";
                }
            }
        }

        return $cache[$type] = $out;
    }

    /**
     * Wrap each configured source with proper quoting rules.
     *
     * This method will quote reserved keywords and leave host patterns untouched.
     *
     * @param array $sources
     *
     * @return array<int,string>
     */
    private function wrap(array $sources): array
    {
        return array_map(function ($s) {
            // Reserved keyword tokens must be quoted
            $reserved = ["self", "none", "unsafe-inline", "unsafe-eval", "unsafe-hashes"];
            if (in_array($s, $reserved, true)) {
                return "'" . $s . "'";
            }

            // If already wrapped in quotes, keep it
            if (is_string($s) && (str_starts_with($s, "'") || str_starts_with($s, '"'))) {
                return $s;
            }

            return $s;
        }, $sources);
    }

    /**
     * Quick check if response looks like HTML.
     *
     * @param mixed $response
     *
     * @return bool
     */
    private function isHtmlResponse($response): bool
    {
        // Some responses use Symfony Response; normalize header check.
        $contentType = $response->headers->get('Content-Type', '');

        if (stripos($contentType, 'text/html') !== false) {
            return true;
        }

        // Inertia's initial HTML root is text/html; API and Inertia JSON are not.
        return false;
    }
}
