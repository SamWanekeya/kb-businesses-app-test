<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\TrimStrings as Middleware;

/**
 * Middleware to automatically trim whitespace from input strings.
 *
 * This helps normalize request data by removing unnecessary
 * leading and trailing spaces from form inputs before validation
 * or database storage.
 *
 * Exceptions are defined for sensitive fields such as passwords,
 * which must retain exact user input.
 */
class TrimStrings extends Middleware
{
    /**
     * The names of the attributes that should not be trimmed.
     *
     * These fields are excluded to preserve user-provided values
     * that may intentionally contain whitespace (e.g., passwords).
     *
     * @var array<int, string>
     */
    protected $except = [
        'current_password',
        'password',
        'password_confirmation',
    ];
}
