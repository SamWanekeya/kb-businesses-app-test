@php
    $locale = Cookie::get('__kb_lcl') ?? "";
    $rtlLocales = ['ar', 'ar-sa', 'ar-ae', 'ar-eg', 'ar-ma', 'ar-dz', 'ar-qa', 'ar-lb', 'he-il', 'fa', 'ur'];
    $layoutDirection = in_array(strtolower($locale), $rtlLocales, true) ? 'rtl' : 'ltr';
@endphp
    <!DOCTYPE html>
<html dir="{{ $layoutDirection }}" lang="{{ $locale }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <link rel="preload" href="{{ asset('assets/fonts/font-face.min.css') }}" as="style" />
    <link rel="stylesheet" href="{{ asset('assets/fonts/font-face.min.css') }}" />
    {{-- Favicon --}}
    <link rel="apple-touch-icon-precomposed" sizes="57x57"
          href="{{ asset('assets/images/favicon/apple-touch-icon-57x57.png') }}" />
    <link rel="apple-touch-icon-precomposed" sizes="114x114"
          href="{{ asset('assets/images/favicon/apple-touch-icon-114x114.png') }}" />
    <link rel="apple-touch-icon-precomposed" sizes="72x72"
          href="{{ asset('assets/images/favicon/apple-touch-icon-72x72.png') }}" />
    <link rel="apple-touch-icon-precomposed" sizes="144x144"
          href="{{ asset('assets/images/favicon/apple-touch-icon-144x144.png') }}" />
    <link rel="apple-touch-icon-precomposed" sizes="60x60"
          href="{{ asset('assets/images/favicon/apple-touch-icon-60x60.png') }}" />
    <link rel="apple-touch-icon-precomposed" sizes="120x120"
          href="{{ asset('assets/images/favicon/apple-touch-icon-120x120.png') }}" />
    <link rel="apple-touch-icon-precomposed" sizes="76x76"
          href="{{ asset('assets/images/favicon/apple-touch-icon-76x76.png') }}" />
    <link rel="apple-touch-icon-precomposed" sizes="152x152"
          href="{{ asset('assets/images/favicon/apple-touch-icon-152x152.png') }}" />
    <link rel="icon" type="image/png" href="{{ asset('assets/images/favicon/favicon-196x196.png') }}" sizes="196x196" />
    <link rel="icon" type="image/png" href="{{ asset('assets/images/favicon/favicon-96x96.png') }}" sizes="96x96" />
    <link rel="icon" type="image/png" href="{{ asset('assets/images/favicon/favicon-32x32.png') }}" sizes="32x32" />
    <link rel="icon" type="image/png" href="{{ asset('assets/images/favicon/favicon-16x16.png') }}" sizes="16x16" />
    <link rel="icon" type="image/png" href="{{ asset('assets/images/favicon/favicon-128.png') }}" sizes="128x128" />
    <meta name="application-name" content="&nbsp;" />
    <meta name="msapplication-TileColor" content="#FFFFFF" />
    <meta name="msapplication-TileImage" content="{{ asset('assets/images/favicon/mstile-144x144.png') }}" />
    <meta name="msapplication-square70x70logo" content="{{ asset('assets/images/favicon/mstile-70x70.png') }}" />
    <meta name="msapplication-square150x150logo" content="{{ asset('assets/images/favicon/mstile-150x150.png') }}" />
    <meta name="msapplication-wide310x150logo" content="{{ asset('assets/images/favicon/mstile-310x150.png') }}" />
    <meta name="msapplication-square310x310logo" content="{{ asset('assets/images/favicon/mstile-310x310.png') }}" />
    <script @nonce>
        (function() {
            try {
                {{-- Synchronous cookie retrieval --}}
                function getCookie(name) {
                    const value = `; ${document.cookie}`;
                    const parts = value.split(`; ${name}=`);
                    if (parts.length === 2) return parts.pop().split(';').shift();
                    return null;
                }

                const raw = getCookie('__kb_thm_md');
                let appearance = 'system';
                if (raw) {
                    try {
                        {{-- Attempt legacy JSON parse --}}
                        const parsed = JSON.parse(raw);
                        if (parsed && typeof parsed.appearance === 'string') {
                            appearance = parsed.appearance;
                        } else {
                            appearance = raw;
                        }
                    } catch {
                        {{-- Not JSON then use raw string --}}
                            appearance = raw;
                    }
                }
                {{-- Resolve system preference --}}
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const finalMode = appearance === 'system' ? (prefersDark ? 'dark' : 'light') : appearance;
                {{-- Apply theme immediately --}}
                document.documentElement.classList.toggle('dark', finalMode === 'dark');
                document.documentElement.dataset.theme = finalMode;
                if (document.body) {
                    document.body.classList.toggle('dark', finalMode === 'dark');
                }
            } catch {
                {{-- noop --}}
            }
        })();
    </script>
    {{-- Vite --}}
    @if (app()->environment('local'))
        @viteReactRefresh
    @endif
    @vite(['resources/js/app.tsx', "resources/css/app.css"], 'static')
</head>
<body class="font-mulish antialiased !mb-0">
<x-inertia::app id="kakbima-saas" data-page="{{ json_encode([
        'component' => 'Error',
        'props' => [
            'status' => (int) $__env->yieldContent('code'),
            'message' => $__env->yieldContent('message'),
        ],
        'url' => Request::getRequestUri(),
        'version' => null
    ]) }}" />
</body>
</html>
