<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Notification sent to users to verify their email address using
 * an opaque verification token.
 */
class VerifyEmailTokenNotification extends Notification
{
    /**
     * Opaque email verification token.
     *
     * @var string
     */
    protected string $token;

    /**
     * Create a new notification instance.
     *
     * @param string $token Opaque email verification token
     */
    public function __construct(string $token)
    {
        $this->token = $token;
    }

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
     * Build the email verification notification message.
     *
     * This email contains a call-to-action link that allows the recipient
     * to verify their email address using an opaque verification token.
     * The token does not expose any personally identifiable information
     * and is subject to expiration for security purposes.
     *
     * A plain-text URL fallback is included to ensure accessibility and
     * compatibility with email clients that may block action buttons.
     *
     * @param mixed $notifiable The entity being notified
     *
     * @return MailMessage The email message instance
     */
    public function toMail($notifiable): MailMessage
    {
        $verificationUrl = route('verify-email-token', $this->token);

        return (new MailMessage())
            ->subject(__('Verify your Kakbima email address'))
            ->greeting(__('Hi :name,', ['name' => $notifiable->name]))
            ->line(__('Thanks for signing up. Please click the button below to verify your email address and activate your account.'))
            ->action(__('Verify email'), $verificationUrl)
            ->line(__('This verification link will expire in :minutes minutes.', [
                'minutes' => config('auth.verification.expire'),
            ]))
            ->line(__('If you did not create a Kakbima account, you can safely ignore this email.'))
            ->salutation('— ' . __('The Kakbima Team'));
    }
}
