<?php
/**
 * Translation Extraction Script
 *
 * Scans application source directories for translation keys used via
 * `translate()` and `__()` helpers, and compiles them into a single
 * JSON language file (`resources/lang/en.json`).
 *
 * This script is intended to keep translation files in sync with actual
 * usage across frontend (JS/TS/JSX/TSX) and backend (PHP/Blade) layers.
 *
 * Responsibilities:
 * - Recursively traverse predefined project directories
 * - Extract translation keys from supported file types
 * - Merge with existing translations (preserving prior entries)
 * - Normalize keys by using the original string as the default value
 * - Sort and persist the result to a JSON language file
 *
 * Constraints / Assumptions:
 * - Only matches direct string literals (no dynamic expressions)
 * - Supports `translate()` and `__()` helpers with single or double quotes
 * - Ignores non-supported file extensions
 *
 * Side Effects:
 * - Reads from multiple directories across the codebase
 * - Writes (overwrites) `resources/lang/en.json`
 * - Creates the lang directory if it does not exist
 *
 * Output:
 * - JSON file containing key-value pairs of translation strings
 * - CLI output indicating total extracted strings
 */

// Define the directories to scan
$directories = [
    __DIR__ . '/resources/js/pages',
    __DIR__ . '/resources/js/config',
    __DIR__ . '/resources/js/components',
    __DIR__ . '/resources/js/layouts',
    __DIR__ . '/resources/views',
    __DIR__ . '/app',
];
$outputFile = __DIR__ . '/resources/lang/en.json';

// Initialize an array to store translations
$translations = [];

// Load existing translations if the file exists
if (file_exists($outputFile)) {
    $existingContent = file_get_contents($outputFile);
    $translations = json_decode($existingContent, true) ?:[];
}

/**
 * Recursively scans a directory for translatable strings.
 *
 * Traverses all nested directories and processes supported file types,
 * delegating extraction to `extractTranslations()`.
 *
 * @param string $dir Absolute path to the directory being scanned
 * @param array<string, string> $translations Accumulator for discovered translation keys
 *
 * @return void
 */
function scanDirectory($dir, &$translations) {
    if (!is_dir($dir)) {
        return;
    }

    $files = scandir($dir);

    foreach ($files as $file) {
        if ($file==='.' || $file==='..') {
            continue;
        }

        $path = $dir . '/' . $file;

        if (is_dir($path)) {
            scanDirectory($path, $translations);
        } else {
            $extension = pathinfo($path, PATHINFO_EXTENSION);
            if (in_array($extension, ['ts', 'tsx', 'jsx', 'php', 'blade.php'])) {
                extractTranslations($path, $translations);
            }
        }
    }
}

/**
 * Extracts translation keys from a file's contents.
 *
 * Identifies string literals passed to `translate()` and `__()` helpers
 * using regex patterns, and registers them in the translations array.
 *
 * Business Rules:
 * - Only captures static string arguments
 * - Ensures function name is not part of another identifier
 * - Uses the extracted string as both key and default value
 * - Deduplicates automatically via associative array keys
 *
 * @param string $file Absolute path to the file being processed
 * @param array<string, string> $translations Accumulator for discovered translation keys
 *
 * @return void
 */
function extractTranslations($file, &$translations) {
    $content = file_get_contents($file);

    // Match translate("...") pattern - ensure it's the function, not part of another word
    preg_match_all('/(?<![a-zA-Z0-9_])translate\("([^"]*)"\)/', $content, $doubleQuoteMatches);

    // Match translate('...') pattern - ensure it's the function, not part of another word
    preg_match_all("/(?<![a-zA-Z0-9_])translate\('([^']*)'\)/", $content, $singleQuoteMatches);

    // Match __("...") pattern
    preg_match_all('/__\("([^"]*)"\)/', $content, $doubleQuoteMatchesUnderscore);

    // Match __('...') pattern
    preg_match_all("/__\('([^']*)'\)/", $content, $singleQuoteMatchesUnderscore);

    // Add matches to translations array
    foreach ($doubleQuoteMatches[1] as $match) {
        $translations[$match] = $match;
    }

    foreach ($singleQuoteMatches[1] as $match) {
        $translations[$match] = $match;
    }

    foreach ($doubleQuoteMatchesUnderscore[1] as $match) {
        $translations[$match] = $match;
    }

    foreach ($singleQuoteMatchesUnderscore[1] as $match) {
        $translations[$match] = $match;
    }
}

// Start scanning all directories
foreach ($directories as $directory) {
    scanDirectory($directory, $translations);
}

// Sort translations alphabetically
ksort($translations);

// Create directory if it doesn’t exist
$outputDir = dirname($outputFile);
if (!is_dir($outputDir)) {
    mkdir($outputDir, 0755, true);
}

// Write to file
file_put_contents($outputFile, json_encode($translations, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo "Translation extraction complete. Found " . count($translations) . " strings.\n";
