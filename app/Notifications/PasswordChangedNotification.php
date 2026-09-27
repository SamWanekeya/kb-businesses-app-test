<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Notification sent to users when their account password
 * has been successfully changed.
 */
class PasswordChangedNotification extends Notification
{
    /**
     * Get the notification delivery channels.
     *
     * @param mixed $notifiable The entity being notified
     *
     * @return array<int, string> List of delivery channels
     */
    public function via($notifiable): array
    {
        return ['mail'];
    }

    /**
     * Build the password change confirmation email.
     *
     * This notification serves as a security alert to inform the user
     * that their account password has been updated. If the action was
     * not performed by the user, they are advised to reset their password
     * immediately and contact support.
     *
     * @param mixed $notifiable The entity being notified
     *
     * @return MailMessage The email message instance
     */
    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject(__('Your Kakbima password was changed'))
            ->greeting(__('Hi :name,', ['name' => $notifiable->name ?? '']))
            ->line(__('This is a confirmation that your account password was successfully changed.'))
            ->line(__('If you did not perform this action, please reset your password immediately and contact support.'))
            ->salutation('— ' . __('The Kakbima Team'));
    }
}
