<?php

return [
    /*
    |--------------------------------------------------------------------------
    | OpenAI API Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for OpenAI API integration
    |
    */

    'api_key' => env('OPENAI_API_KEY'),

    'default_model' => env('OPENAI_DEFAULT_MODEL', 'gpt-3.5-turbo'),

    'models' => [
        'gpt-3.5-turbo' => [
            'name' => 'GPT-3.5 Turbo',
            'maximum_tokens' => 4096,
            'cost_per_1k_tokens' => 0.002,
        ],
        'gpt-4' => [
            'name' => 'GPT-4',
            'maximum_tokens' => 8192,
            'cost_per_1k_tokens' => 0.03,
        ],
        'gpt-4-turbo' => [
            'name' => 'GPT-4 Turbo',
            'maximum_tokens' => 128000,
            'cost_per_1k_tokens' => 0.01,
        ],
    ],

    'timeout' => env('OPENAI_TIMEOUT', 30),

    'maximum_retries' => env('OPENAI_MAX_RETRIES', 3),

    'temperature' => [
        'low' => 0.3,
        'medium' => 0.7,
        'high' => 0.9,
    ],

    'supported_languages' => [
        // Afrikaans
        'af-za' => 'Afrikaans (South Africa)',
        // Amharic
        'am-et' => 'Amharic (Ethiopia)',
        // Arabic
        'ar' => 'Arabic',
        'ar-ae' => 'Arabic (United Arab Emirates)',
        'ar-dz' => 'Arabic (Algeria)',
        'ar-eg' => 'Arabic (Egypt)',
        'ar-lb' => 'Arabic (Lebanon)',
        'ar-ma' => 'Arabic (Morocco)',
        'ar-qa' => 'Arabic (Qatar)',
        'ar-sa' => 'Arabic (Saudi Arabia)',
        // Bengali
        'bn' => 'Bengali',
        'bn-bd' => 'Bengali (Bangladesh)',
        'bn-in' => 'Bengali (India)',
        // Danish
        'da' => 'Danish',
        // German
        'de' => 'German',
        'de-at' => 'German (Austria)',
        'de-ch' => 'German (Switzerland)',
        'de-de' => 'German (Germany)',
        'de-lu' => 'German (Luxembourg)',
        // English
        'en' => 'English',
        'en-ca' => 'English (Canada)',
        'en-gb' => 'English (United Kingdom)',
        'en-gh' => 'English (Ghana)',
        'en-ke' => 'English (Kenya)',
        'en-ng' => 'English (Nigeria)',
        'en-ug' => 'English (Uganda)',
        'en-us' => 'English (United States)',
        'en-za' => 'English (South Africa)',
        'en-zm' => 'English (Zambia)',
        'en-zw' => 'English (Zimbabwe)',
        // Spanish
        'es' => 'Spanish',
        'es-ar' => 'Spanish (Argentina)',
        'es-cl' => 'Spanish (Chile)',
        'es-co' => 'Spanish (Colombia)',
        'es-es' => 'Spanish (Spain)',
        'es-mx' => 'Spanish (Mexico)',
        'es-pe' => 'Spanish (Peru)',
        'es-us' => 'Spanish (United States)',
        // French
        'fr' => 'French',
        'fr-be' => 'French (Belgium)',
        'fr-ca' => 'French (Canada)',
        'fr-ch' => 'French (Switzerland)',
        'fr-fr' => 'French (France)',
        'fr-lu' => 'French (Luxembourg)',
        // Irish
        'ga-ie' => 'Irish (Ireland)',
        // Hausa
        'ha' => 'Hausa',
        'ha-gh' => 'Hausa (Ghana)',
        'ha-ne' => 'Hausa (Niger)',
        'ha-ng' => 'Hausa (Nigeria)',
        // Hebrew
        'he-il' => 'Hebrew (Israel)',
        // Hindi
        'hi-in' => 'Hindi (India)',
        // Italian
        'it' => 'Italian',
        'it-it' => 'Italian (Italy)',
        // Japanese
        'ja-jp' => 'Japanese (Japan)',
        // Korean
        'ko-kr' => 'Korean (South Korea)',
        // Polish
        'pl-pl' => 'Polish (Poland)',
        // Portuguese
        'pt' => 'Portuguese',
        'pt-br' => 'Portuguese (Brazil)',
        'pt-mz' => 'Portuguese (Mozambique)',
        'pt-pt' => 'Portuguese (Portugal)',
        // Russian
        'ru' => 'Russian',
        'ru-kz' => 'Russian (Kazakhstan)',
        'ru-ru' => 'Russian (Russia)',
        'ru-ua' => 'Russian (Ukraine)',
        // Shona
        'sn-zw' => 'Shona (Zimbabwe)',
        // Somali
        'so-so' => 'Somali (Somalia)',
        // Swahili
        'sw' => 'Swahili',
        'sw-ke' => 'Swahili (Kenya)',
        'sw-tz' => 'Swahili (Tanzania)',
        // Turkish
        'tr-tr' => 'Turkish (Turkey)',
        // Xhosa
        'xh-za' => 'Xhosa (South Africa)',
        // Yoruba
        'yo-ng' => 'Yoruba (Nigeria)',
        // Chinese
        'zh-cn' => 'Chinese (Simplified)',
        'zh-tw' => 'Chinese (Traditional)',
        // Zulu
        'zu-za' => 'Zulu (South Africa)',
    ],
];
