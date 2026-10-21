<?php

namespace App\Listeners;

use App\Notifications\PasswordChangedNotification;
use Illuminate\Auth\Events\PasswordReset;

class SendPasswordChangedNotification
{
    public function handle(PasswordReset $event): void
    {
        $event->user->notify(new PasswordChangedNotification());
    }
}
