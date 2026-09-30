/**
 * @file ConfirmPassword.tsx
 * @description
 * Requires the authenticated user to re-enter their current password
 * before continuing with a sensitive account action.
 */

import { useForm } from '@inertiajs/react';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import AccountButton from '@components/Account/AccountButton';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import AuthLayout from '@layouts/AuthLayout';
import { route } from '@utils/Routes';

/**
 * ConfirmPassword
 *
 * Provides a password confirmation step for sensitive authenticated actions.
 *
 * Responsibilities:
 * - Render the current-password field.
 * - Handle client-side validation feedback.
 * - Prevent invalid or duplicate submissions.
 * - Submit the confirmation request through Inertia.
 * - Clear the password after the request lifecycle completes.
 *
 * Accessibility:
 * - Uses semantic form controls and an associated label.
 * - Exposes validation state through `aria-invalid`.
 * - Associates validation feedback with the password input.
 * - Preserves native keyboard form submission and focus behavior.
 *
 * Performance:
 * - Derives validation state from the existing form value instead of
 *   maintaining redundant required-field state.
 * - Memoizes callbacks passed to the reusable Input component.
 * - Avoids unnecessary memoization of the page itself.
 *
 * Extension points:
 * - Additional confirmation requirements can be introduced without
 *   changing the Inertia submission architecture.
 */
export default function ConfirmPassword() {
    const { t: translate } = useTranslation();

    const { data, setData, post, processing, reset } = useForm({
        password: '',
    });

    const [passwordError, setPasswordError] = useState<string | null>(null);

    const isPasswordEmpty = data.password.length === 0;
    const isSubmitDisabled = processing || isPasswordEmpty || passwordError !== null;

    /**
     * Updates the password field.
     *
     * The callback is stable so the reusable Input component does not receive
     * a new handler reference on every parent render.
     */
    const handlePasswordChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setData('password', event.target.value);
        },
        [setData],
    );

    /**
     * Receives client-side validation results from the Input component.
     *
     * A successful validation clears any previously displayed password error.
     */
    const handlePasswordValidate = useCallback((valid: boolean, message: string | null) => {
        setPasswordError(valid ? null : message);
    }, []);

    /**
     * Submits the password confirmation request.
     *
     * Uses the React 19.3 SubmitEvent type rather than the deprecated
     * FormEvent type.
     */
    const handleSubmit = useCallback(
        (event: React.SubmitEvent<HTMLFormElement>) => {
            event.preventDefault();

            if (isSubmitDisabled) {
                return;
            }

            post(route('authenticated.password.confirm'), {
                onFinish: () => {
                    reset('password');
                },
            });
        },
        [isSubmitDisabled, post, reset],
    );

    return (
        <AuthLayout title={translate('Confirm your password')} description={translate('Re-enter your password to continue with this secure action.')}>
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="password" className="font-medium text-neutral-700 dark:text-neutral-300">
                        {translate('Password')}
                        <span aria-hidden="true" className="ml-1 text-red-600 dark:text-red-400">
                            *
                        </span>
                    </Label>

                    <Input
                        inputIdentifier="password"
                        inputType="password"
                        required
                        autoComplete="current-password"
                        value={data.password}
                        onChange={handlePasswordChange}
                        onValidate={handlePasswordValidate}
                        aria-invalid={passwordError !== null}
                        aria-describedby={passwordError ? 'password-error' : undefined}
                    />

                    {passwordError && (
                        <p id="password-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
                            {passwordError}
                        </p>
                    )}
                </div>

                <AccountButton type="submit" processing={processing} disabled={isSubmitDisabled}>
                    {translate('Confirm password')}
                </AccountButton>
            </form>
        </AuthLayout>
    );
}
