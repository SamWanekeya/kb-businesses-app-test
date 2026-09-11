<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Production-only middleware to minify HTML responses.
 *
 * This middleware removes unnecessary whitespace between HTML tags in the response body
 * without affecting Blade directives, inline scripts, or styles.
 *
 * The minification is only applied in the production environment to avoid interfering
 * with development tools like Vite HMR or Inertia page hydration.
 */
class MinifyHtml
{
    /**
     * Handle an incoming request.
     *
     * This method minifies the HTML content of the response when in production.
     * Non-HTML responses or requests in non-production environments are left untouched.
     *
     * @param \Illuminate\Http\Request $request The incoming HTTP request instance.
     * @param \Closure $next Callback to pass the request to the next middleware.
     *
     * @return \Symfony\Component\HttpFoundation\Response The HTTP response with minified HTML.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!app()->isProduction()) {
            // Skip minification outside production
            return $next($request);
        }

        $response = $next($request);

        if ($this->isHtmlResponse($response)) {
            $output = $response->getContent();

            // Preserve contents of <pre>, <textarea>, <script>, <style>
            $output = preg_replace_callback(
                '#<(pre|textarea|script|style).*?>.*?</\1>#is',
                fn ($matches) => $matches[0],
                $output
            );

            // Minify remaining HTML: remove whitespace between tags
            $output = preg_replace('/>\s+</', '><', $output);

            // Collapse multiple consecutive spaces into a single space
            $output = preg_replace('/\s{2,}/', ' ', $output);

            $response->setContent($output);
        }

        return $response;
    }

    /**
     * Determine if the response is an HTML response that can be minified.
     *
     * @param \Symfony\Component\HttpFoundation\Response $response The HTTP response to check.
     *
     * @return bool True if the response is HTML and can be safely minified; false otherwise.
     */
    protected function isHtmlResponse(Response $response): bool
    {
        return str_contains($response->headers->get('Content-Type', ''), 'text/html');
    }
}
