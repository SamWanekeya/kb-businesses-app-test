/**
 * @file ResetPassword.tsx
 * @description
 * Handles password reset requests initiated from a password recovery link.
 *
 * Responsibilities:
 * - Display the recovery email address.
 * - Validate the new password.
 * - Validate password confirmation.
 * - Submit the password reset request through Inertia.
 * - Clear sensitive password fields after submission.
 */

import { useForm } from '@inertiajs/react';
import { route } from '@utils/Routes';
import type { SubmitEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import AccountButton from '@components/Account/AccountButton';
import TextLink from '@components/TextLink';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import AuthLayout from '@layouts/AuthLayout';

interface ResetPasswordProps {
    /**
     * Password reset token supplied by the recovery link.
     */
    token: string;

    /**
     * Email address associated with the password reset request.
     */
    email: string;
}

interface ClientErrors {
    password: string | null;
    password_confirmation: string | null;
}

/**
 * ResetPassword
 *
 * Provides the final step of the password recovery flow.
 *
 * Responsibilities:
 * - Display the account email associated with the reset request.
 * - Validate the new password through the shared Input component.
 * - Ensure password confirmation matches the new password.
 * - Prevent submission while client-side validation is incomplete.
 * - Submit the reset request through Inertia.
 * - Clear sensitive password values when the request finishes.
 *
 * Accessibility:
 * - Every form control has an associated label.
 * - Invalid fields expose `aria-invalid`.
 * - Validation messages are associated through `aria-describedby`.
 * - Validation messages use `role="alert"` so relevant changes can be announced.
 * - The read-only email field remains keyboard accessible.
 *
 * Performance:
 * - Required-field state is derived from existing form data rather than
 *   maintained as duplicate React state.
 * - Event handlers are memoized only where they are passed into reusable
 *   components or used as effect dependencies.
 *
 * Extension points:
 * - Server-side validation can be incorporated into the same field error
 *   state if Inertia errors are later surfaced directly by this page.
 */
export default function ResetPassword({ token, email }: ResetPasswordProps) {
    const { t: translate } = useTranslation();

    const { data, setData, post, processing, reset } = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    const [clientErrors, setClientErrors] = useState<ClientErrors>({
        password: null,
        password_confirmation: null,
    });

    /**
     * Determines whether either password field currently has a validation
     * error.
     */
    const hasClientErrors = clientErrors.password !== null || clientErrors.password_confirmation !== null;

    /**
     * Required-field state is derived directly from the current form values.
     *
     * Keeping this derived rather than storing it separately prevents the
     * validation state and form state from becoming inconsistent.
     */
    const requiredFieldsEmpty = data.password.trim() === '' || data.password_confirmation.trim() === '';

    const isSubmitDisabled = processing || hasClientErrors || requiredFieldsEmpty;

    /**
     * Updates the validation state for a password field.
     *
     * A valid field removes its existing client-side error. Invalid fields
     * retain the validation message supplied by the Input component.
     */
    const handleValidate = useCallback((field: keyof ClientErrors, valid: boolean, message: string | null) => {
        setClientErrors((current) => ({
            ...current,
            [field]: valid ? null : message,
        }));
    }, []);

    /**
     * Re-validates password confirmation whenever either password value
     * changes.
     *
     * The shared Input component validates the individual field, while this
     * page owns the cross-field rule requiring both passwords to match.
     */
    useEffect(() => {
        if (data.password_confirmation === '') {
            setClientErrors((current) => ({
                ...current,
                password_confirmation: null,
            }));

            return;
        }

        const passwordsMatch = data.password === data.password_confirmation;

        setClientErrors((current) => ({
            ...current,
            password_confirmation: passwordsMatch ? null : translate('Passwords do not match'),
        }));
    }, [data.password, data.password_confirmation, translate]);

    /**
     * Handles password reset form submission.
     *
     * Submission is prevented while client-side validation errors exist.
     * Password fields are cleared after the request finishes regardless of
     * whether the server request succeeds or fails.
     */
    const handleSubmit = useCallback(
        (event: SubmitEvent<HTMLFormElement>) => {
            event.preventDefault();

            if (isSubmitDisabled) {
                return;
            }

            post(route('account-recovery-save'), {
                onFinish: () => {
                    reset('password', 'password_confirmation');
                },
            });
        },
        [isSubmitDisabled, post, reset],
    );

    return (
        <AuthLayout title={translate('Change your password')}>
            <form autoComplete="off" noValidate onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="email">{translate('Work email')}</Label>

                    <Input
                        inputIdentifier="email"
                        inputType="email"
                        inputMode="email"
                        readOnly
                        value={data.email}
                        autoComplete="email"
                        aria-readonly="true"
                        className="bg-muted/50"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">
                        {translate('Password')}{' '}
                        <span aria-hidden="true" className="text-destructive">
                            *
                        </span>
                    </Label>

                    <Input
                        inputIdentifier="password"
                        inputType="password"
                        required
                        autoComplete="new-password"
                        value={data.password}
                        onChange={(event) => {
                            setData('password', event.target.value);
                        }}
                        onValidate={(valid, message) => {
                            handleValidate('password', valid, message);
                        }}
                        aria-invalid={Boolean(clientErrors.password)}
                        aria-describedby={clientErrors.password ? 'password-error' : undefined}
                    />

                    {clientErrors.password && (
                        <p id="password-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
                            {clientErrors.password}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password_confirmation">
                        {translate('Confirm new password')}{' '}
                        <span aria-hidden="true" className="text-destructive">
                            *
                        </span>
                    </Label>

                    <Input
                        inputIdentifier="password_confirmation"
                        inputType="password"
                        required
                        autoComplete="new-password"
                        value={data.password_confirmation}
                        onChange={(event) => {
                            setData('password_confirmation', event.target.value);
                        }}
                        onValidate={(valid, message) => {
                            handleValidate('password_confirmation', valid, message);
                        }}
                        aria-invalid={Boolean(clientErrors.password_confirmation)}
                        aria-describedby={clientErrors.password_confirmation ? 'password-confirmation-error' : undefined}
                    />

                    {clientErrors.password_confirmation && (
                        <p id="password-confirmation-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
                            {clientErrors.password_confirmation}
                        </p>
                    )}
                </div>

                <AccountButton processing={processing} disabled={isSubmitDisabled}>
                    {translate('Change password')}
                </AccountButton>

                <div className="text-muted-foreground text-center text-sm">
                    {translate('Back to')}{' '}
                    <TextLink href={route('sign-in')} className="font-medium transition-colors duration-200">
                        {translate('Sign in')}
                    </TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}
