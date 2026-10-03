<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Class EmailVerificationToken
 *
 * Represents an email verification token issued to an authenticated user.
 *
 * The token stored in the database is a SHA-256 hash of the raw token
 * delivered to the user. This prevents a database compromise from
 * exposing immediately usable verification links.
 *
 * @property int $id
 * @property int $user_id
 * @property string $email
 * @property string $token
 * @property Carbon $expires_at
 */
class EmailVerificationToken extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'email',
        'token',
        'expires_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'expires_at' => 'datetime',
    ];

    /**
     * Get the user associated with the verification token.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
