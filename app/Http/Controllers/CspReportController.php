<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Class CspReportController
 *
 * High-throughput CSP violation sink.
 * - Supports legacy `report-uri` (Firefox/Safari): { "csp-report": {...} }
 * - Supports modern `report-to` (Chrome/Edge): { "csp-endpoint": [ { "body": {...} } ] }
 * - Logs to dedicated 'csp' channel with client IP and User-Agent.
 * - Returns 204 immediately (no redirects, no auth).
 *
 * Designed for heavy load (1M+ reports/hour):
 * - Single JSON decode
 * - No intermediate collections
 * - Early return paths
 */
class CspReportController extends Controller
{
    /**
     * Handle an incoming CSP violation report.
     *
     * @param \Illuminate\Http\Request $request Incoming HTTP request with JSON body.
     *
     * @return \Illuminate\Http\Response 204 No Content on success.
     */
    public function __invoke(Request $request)
    {
        // Minimal client context (cheap to compute, valuable for triage)
        $ip = $request->ip();
        $ua = $request->userAgent();

        // Single decode; avoid re-parsing later
        $data = json_decode($request->getContent(), true);

        // Guard: if body isn’t JSON, log once and exit
        if (!is_array($data)) {
            Log::channel('csp')->warning('CSP Report (non-JSON body)', [
                'ip' => $ip,
                'ua' => $ua,
            ]);

            return response()->noContent(204);
        }

        // Fast path: legacy report-uri
        if (isset($data['csp-report'])) {
            Log::channel('csp')->warning('CSP Violation', [
                'format' => 'report-uri',
                'ip' => $ip,
                'ua' => $ua,
                'payload' => $data['csp-report'],
            ]);

            return response()->noContent(204);
        }

        // Fast path: modern report-to (group explicitly named "csp-endpoint")
        if (isset($data['csp-endpoint']) && is_array($data['csp-endpoint'])) {
            foreach ($data['csp-endpoint'] as $entry) {
                if (isset($entry['body']) && is_array($entry['body'])) {
                    Log::channel('csp')->warning('CSP Violation', [
                        'format' => 'report-to',
                        'ip' => $ip,
                        'ua' => $ua,
                        'payload' => $entry['body'],
                    ]);
                }
            }

            return response()->noContent(204);
        }

        // Generic fallback for other Reporting API group names
        // (Avoids missing reports if the group name changes in CSP header)
        foreach ($data as $value) {
            if (is_array($value) && isset($value[0]['body'])) {
                foreach ($value as $entry) {
                    if (isset($entry['body']) && is_array($entry['body'])) {
                        Log::channel('csp')->warning('CSP Violation', [
                            'format' => 'report-to',
                            'ip' => $ip,
                            'ua' => $ua,
                            'payload' => $entry['body'],
                        ]);
                    }
                }

                return response()->noContent(204);
            }
        }

        // Unknown/unsupported shape — log once with minimal context
        Log::channel('csp')->warning('CSP Report (unrecognized format)', [
            'ip' => $ip,
            'ua' => $ua,
        ]);

        return response()->noContent(204);
    }
}
