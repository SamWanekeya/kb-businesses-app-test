<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class FilterRequest
{
    /**
     * Handle an incoming HTTP request by sanitizing input data.
     *
     * This middleware recursively scans all input values and:
     * - Decodes HTML entities.
     * - Removes script tags and inline JavaScript.
     * - Strips suspicious keywords and characters that may indicate XSS payloads.
     *
     * @param \Illuminate\Http\Request $request The incoming HTTP request instance.
     * @param \Closure $next The next middleware or request handler in the pipeline.
     *
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        $input = $request->all();

        if (empty($input)) {
            return $next($request);
        }

        $sanitized = $this->sanitizeArray($input);
        $request->merge($sanitized);

        return $next($request);
    }

    /**
     * Recursively sanitize an array of input data.
     *
     * @param array $data
     *
     * @return array
     */
    protected function sanitizeArray(array $data): array
    {
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $data[$key] = $this->sanitizeArray($value);
                continue;
            }

            if (!is_string($value)) {
                continue;
            }

            // Decode only if needed to avoid unnecessary processing
            if (str_contains($value, '&lt;') || str_contains($value, '&gt;')) {
                $value = htmlspecialchars_decode($value, ENT_QUOTES);
            }

            // Remove <script> tags and inline JS
            $value = preg_replace(
                '/<\s*script\b[^>]*>.*?<\s*\/\s*script\s*>/is',
                '',
                $value
            );

            // Strip suspicious keywords and patterns
            $value = preg_replace(
                '/\b(javascript|script|alert)\b/i',
                '',
                $value
            );

            $data[$key] = trim($value);
        }

        return $data;
    }
}
