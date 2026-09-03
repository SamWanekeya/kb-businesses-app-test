<?php

return [

    /*
    |--------------------------------------------------------------------------
    | CSP Hashes
    |--------------------------------------------------------------------------
    |
    | This hashes represent a cryptographic fingerprint of the content of an inline script or style used.
    | A hashing algorithm is used to generate a unique, fixed-size string that represents the content.
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy#hash_algorithm-hash_value
    |
    */

    'script_hashes' => env('CSP_SCRIPT_HASHES', ''),

    'style_hashes' => env('CSP_STYLE_HASHES', ''),

    'style_attribute_hashes' => env('CSP_STYLE_ATTRIBUTE_HASHES', ''),

    /*
    |--------------------------------------------------------------------------
    | CSP Source Whitelists
    |--------------------------------------------------------------------------
    |
    | Keep lists minimal. Add only domains strictly required.
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP#strict_csp
    |
    */

    /**
     * Allowed JavaScript sources (external script tags and inline script src).
     */
    'script' => array_filter([
        'self',
        ...explode(',', env('CSP_SCRIPT_SOURCES', '')),
    ]),

    /**
     * Allowed external CSS file sources (e.g., <link rel="stylesheet">).
     */
    'style' => array_filter([
        'self',
        ...explode(',', env('CSP_STYLE_SOURCES', '')),
    ]),

    /**
     * Allows style="" attributes on elements when enabled.
     */
    'style-attribute' => [],

    /**
     * Allowed image sources (img tags, background images, data/blobs, etc).
     */
    'img' => array_filter([
        'self',
        'data:',
        'blob:',
        ...explode(',', env('CSP_IMG_SOURCES', '')),
    ]),

    /**
     * Allowed font file sources (woff, woff2, ttf, etc).
     */
    'font' => array_filter([
        'self',
        'data:',
        ...explode(',', env('CSP_FONT_SOURCES', '')),
    ]),

    /**
     * Allowed endpoints for AJAX, WebSockets, and API requests (fetch, XHR, etc).
     */
    'connect' => array_filter([
        'self',
        ...explode(',', env('CSP_CONNECT_SOURCES', '')),
    ]),

    /**
     * Allowed iframe/embed frame sources (YouTube, Stripe, etc).
     */
    'frame' => array_filter([
        'self',
        ...explode(',', env('CSP_FRAME_SOURCES', '')),
    ]),
];
