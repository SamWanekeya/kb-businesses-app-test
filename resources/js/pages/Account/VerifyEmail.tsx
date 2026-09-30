/**
 * @file VerifyEmail.tsx
 * @description
 * Provides the email-verification screen for authenticated users whose
 * email address has not yet been verified.
 *
 * The page allows users to request another verification email or sign out
 * of their current session.
 */

import { useForm, usePage } from '@inertiajs/react';
import type { SubmitEvent } from 'react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import AccountButton from '@components/Account/AccountButton';
import { toast } from '@components/CustomToast';
import TextLink from '@components/TextLink';
import AuthLayout from '@layouts/AuthLayout';
import { route } from '@utils/Routes';

/**
 * VerifyEmail
 *
 * Handles the email-verification reminder shown to authenticated users
 * who have not yet verified their email address.
 *
 * Responsibilities:
 * - Display the email address associated with the current account.
 * - Allow the user to resend the verification email.
 * - Surface server-side resend failures through toast notifications.
 * - Provide a sign-out action.
 *
 * Accessibility:
 * - Uses semantic heading and paragraph structure through AuthLayout content.
 * - Uses a native form for the resend action.
 * - Keeps the resend action keyboard accessible through AccountButton.
 * - Uses a semantic navigation link for signing out through TextLink.
 *
 * Performance:
 * - The submission handler is memoized because it is passed to the form.
 * - No local state is maintained beyond Inertia's existing processing state.
 *
 * Extension points:
 * - A resend cooldown can be introduced later without changing the
 *   submission architecture.
 * - Success feedback can be rendered inline if persistent status messaging
 *   becomes preferable to transient toast notifications.
 */
export default function VerifyEmail() {
    const { t: translate } = useTranslation();
    const { auth } = usePage().props;

    const { post, processing } = useForm();

    /**
     * Resends the account verification email.
     *
     * A loading toast provides immediate feedback while the request is
     * processing. Server validation errors are surfaced individually so
     * users receive actionable feedback when the request fails.
     */
    const handleSubmit = useCallback(
        (event: SubmitEvent<HTMLFormElement>) => {
            event.preventDefault();

            const toastId = toast.loading(translate('Sending verification email...'));

            post(route('authenticated.verification.send'), {
                onSuccess: () => {
                    toast.dismiss(toastId);
                    toast.success(translate('A new verification link has been sent to your email address.'));
                },
                onError: (errors) => {
                    toast.dismiss(toastId);

                    Object.values(errors).forEach((message) => {
                        toast.error(translate(message));
                    });
                },
            });
        },
        [post, translate],
    );

    const email = auth?.user?.email;

    return (
        <AuthLayout title={translate('Verify your email')}>
            <div className="space-y-6">
                <div className="text-muted-foreground space-y-4 text-sm leading-6" aria-live="polite">
                    <p>
                        <strong className="text-foreground font-semibold">{translate('Check your inbox!')}</strong>{' '}
                        {translate('We’ve sent a verification link to')} <span className="text-foreground font-medium">{email}</span>.{' '}
                        {translate('Please click the link to activate your account and get started.')}
                    </p>

                    <p>
                        <strong className="text-foreground font-semibold">{translate('Didn’t get the email?')}</strong>{' '}
                        {translate('Check your spam folder or click the button below to try again.')}
                    </p>
                </div>

                <form autoComplete="off" onSubmit={handleSubmit} className="space-y-5">
                    <AccountButton processing={processing}>{translate('Resend verification email')}</AccountButton>

                    <div className="text-center">
                        <TextLink href={route('authenticated.logout')} method="post" className="font-medium transition-colors duration-200">
                            {translate('Sign out')}
                        </TextLink>
                    </div>
                </form>
            </div>
        </AuthLayout>
    );
}
