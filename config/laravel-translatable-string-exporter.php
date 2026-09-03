<?php

return [

    /*
     |--------------------------------------------------------------------------
     | Directories to search in (relative to base_path)
     |--------------------------------------------------------------------------
    */
    'directories' => [
        'app',
        'resources',
    ],

    /*
     |--------------------------------------------------------------------------
     | Directories to exclude *within* the above directories
     | NOTE: only list subfolders relative to the ones in 'directories'
     |--------------------------------------------------------------------------
    */
    'excluded-directories' => [
        'vendor',
        'node_modules',
        'lang',
        'dist',
        'build',
        'public',
    ],

    /*
     |--------------------------------------------------------------------------
     | File patterns to scan
     |--------------------------------------------------------------------------
    */
    'patterns' => [
        "*.php",
        "*.blade.php",
        "*.js",
        "*.jsx",
        "*.ts",
        "*.tsx",
    ],

    /*
     |--------------------------------------------------------------------------
     | Allow newlines
     |--------------------------------------------------------------------------
    */
    'allow-newlines' => false,

    /*
     |--------------------------------------------------------------------------
     | Translation function names OR custom transform function
     |
     | You can escape $ signs in function names (not relevant here).
     |--------------------------------------------------------------------------
    */
    'functions' => [
        '__',
        'translate',
    ],

    /*
     |--------------------------------------------------------------------------
     | Sort translation keys alphabetically
     |--------------------------------------------------------------------------
    */
    'sort-keys' => true,

    /*
     |--------------------------------------------------------------------------
     | Whether persistent-strings should also be exported automatically
     |--------------------------------------------------------------------------
    */
    'add-persistent-strings-to-translations' => false,

    /*
     |--------------------------------------------------------------------------
     | Exclude Laravel's PHP-key translations from output JSON
     |--------------------------------------------------------------------------
    */
    'exclude-translation-keys' => false,

    /*
     |--------------------------------------------------------------------------
     | Put untranslated strings at the top (useful for workflow)
     |--------------------------------------------------------------------------
    */
    'put-untranslated-strings-at-the-top' => false,
];
