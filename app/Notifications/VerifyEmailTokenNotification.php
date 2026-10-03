<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Class VerifyEmailTokenNotification
 *
 * Sends the email verification notification containing the user's
 * opaque verification token.
 *
 * Responsibilities:
 * - Generate the verification URL from the supplied token.
 * - Display the configured verification expiration.
 * - Provide context-specific verification email content.
 */
class VerifyEmailTokenNotification extends Notification
{
    use Queueable;

    /**
     * The raw verification token.
     */
    protected string $token;

    /**
     * The reason for sending the verification notification.
     */
    protected string $reason;

    /**
     * Create a new notification instance.
     *
     * @param string $token The raw verification token.
     * @param string $reason The reason for sending the notification.
     */
    public function __construct(
        string $token,
        string $reason = 'registration',
    ) {
        $this->token = $token;
        $this->reason = $reason;
    }

    /**
     * Get the notification delivery channels.
     *
     * @param object $notifiable The notification recipient.
     *
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Build the verification email.
     *
     * @param object $notifiable The notification recipient.
     *
     * @return MailMessage
     */
    public function toMail(object $notifiable): MailMessage
    {
        $verificationUrl = route(
            'verify-email-token',
            ['token' => $this->token],
        );

        $message = (new MailMessage())
            ->greeting(__('Hi :name,', [
                'name' => $notifiable->name,
            ]))
            ->action(
                __('Verify email'),
                $verificationUrl,
            )
            ->line(__(
                'This verification link will expire in :minutes minutes.',
                [
                    'minutes' => config('auth.verification.expire'),
                ],
            ));

        if ($this->reason === 'email-change') {
            $message
                ->subject(__('Verify your new Kakbima email address'))
                ->line(__(
                    'You recently changed the email address associated with your Kakbima account. Please click the button below to verify your new email address and continue using your account.',
                ))
                ->line(__(
                    'If you did not make this change, please sign in to your Kakbima account and update your email address.',
                ));
        } else {
            $message
                ->subject(__('Verify your Kakbima email address'))
                ->line(__(
                    'Thanks for signing up. Please click the button below to verify your email address and complete your Kakbima account setup.',
                ))
                ->line(__(
                    'If you did not create a Kakbima account, you can safely ignore this email.',
                ));
        }

        return $message->salutation(
            '— ' . __('The Kakbima Team'),
        );
    }
}
