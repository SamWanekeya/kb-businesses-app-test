<?php

namespace App\Http\Middleware;

use Illuminate\Http\Middleware\TrustProxies as Middleware;
use Illuminate\Http\Request;

/**
 * Middleware to define trusted proxies for the application.
 *
 * This middleware determines which proxies the application should trust
 * when resolving the client’s IP address and related proxy headers.
 *
 * By default, all proxies are trusted (using '*'), which is generally safe
 * in our current context as our upstream proxy is Cloudflare which is under our control.
 *
 * @package App\Http\Middleware
 */

class TrustProxies extends Middleware
{
    /**
     * The trusted proxies for this application.
     *
     * Using '*' trusts all proxies (currently safe as we control the upstream proxy).
     */
    protected $proxies = '*';

    /**
     * The headers that should be used to detect proxies.
     *
     * These constants correspond to the standard X-Forwarded-* headers.
     * Laravel uses them to correctly identify the original client request
     * when behind a reverse proxy or load balancer.
     *
     * @var int
     */
    protected $headers =
        Request::HEADER_X_FORWARDED_FOR |
        Request::HEADER_X_FORWARDED_HOST |
        Request::HEADER_X_FORWARDED_PORT |
        Request::HEADER_X_FORWARDED_PROTO;
}
