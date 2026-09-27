<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword as BaseResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Notification sent to users to reset their account password.
 *
 * This notification customizes the default Laravel password reset
 * email with Kakbima branding and localized messaging.
 */
class ResetPasswordNotification extends BaseResetPassword
{
    /**
     * Build the mail representation of the password reset notification.
     *
     * Generates a signed password reset URL and returns a MailMessage
     * instance configured with the appropriate subject, greeting,
     * content lines, and call-to-action.
     *
     * @param mixed $notifiable The entity that should receive the notification
     *
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable): MailMessage
    {
        $resetUrl = url(route('account-recovery-token', [
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ], false));

        return (new MailMessage())
//            ->from('no-reply@kakbima.dev', 'Kakbima')
            ->subject(__('Reset your Kakbima account password'))
            ->greeting(__('Hi :name,', ['name' => $notifiable->name]))
            ->line(__('We received a request to reset the password for your Kakbima account. Click the button below to choose a new password.'))
            ->action(__('Reset my password'), $resetUrl)
            ->line(__('This password reset link will expire in :count minutes.', [
                'count' => config('auth.passwords.'.config('auth.defaults.passwords').'.expire'),
            ]))
            ->line(__('If you did not request a password reset, no action is required. Your password will remain unchanged.'))
            ->salutation('— ' . __('The Kakbima Team'));
    }
}
