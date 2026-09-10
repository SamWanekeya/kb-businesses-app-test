import { useForm } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { FormEventHandler, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import AccountButton from '@components/Account/AccountButton';
import TextLink from '@components/TextLink';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import AuthLayout from '@layouts/AuthLayout';

/**
 * Props required to render the ResetPassword screen.
 * Provided by the password reset link.
 */
interface ResetPasswordProps {
    token: string;
    email: string;
}

/**
 * Shape of the password reset form data.
 * Used by Inertia's `useForm`.
 */

/**
 * Password reset page component.
 *
 * Handles client-side validation, required-field state,
 * and submission to the password reset endpoint.
 */
export default function ResetPassword({ token, email }: ResetPasswordProps) {
    const { t: translate } = useTranslation();

    /**
     * Inertia form state and helpers.
     * Handles server-side submission and processing state.
     */
    const { data, setData, post, processing, reset } = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    /**
     * Client-side validation error messages per field.
     * These do NOT reflect server-side validation.
     */
    const [clientErrors, setClientErrors] = useState<Record<string, string | null>>({
        password: null,
        password_confirmation: null,
    });

    /**
     * Tracks whether required fields are currently empty.
     * Used to disable submission until all required fields are filled.
     */
    const [requiredEmpty, setRequiredEmpty] = useState({
        password: true,
        password_confirmation: true,
    });

    const hasClientErrors = Object.values(clientErrors).some(Boolean);
    const requiredFieldsEmpty = Object.values(requiredEmpty).some(Boolean);

    const isSubmitDisabled = processing || hasClientErrors || requiredFieldsEmpty;

    /**
     * Updates client-side validation state for a specific field.
     *
     * @param field - Field being validated
     * @param valid - Whether the field is valid
     * @param message - Validation error message (if invalid)
     */
    const handleValidate = useCallback((field: keyof typeof clientErrors, valid: boolean, message: string | null) => {
        setClientErrors((prev) => ({
            ...prev,
            [field]: valid ? null : message,
        }));
    }, []);

    /**
     * Updates required/empty state for a specific field.
     *
     * @param field - Field being tracked
     * @param isEmpty - Whether the field is currently empty
     */
    const handleRequiredState = useCallback((field: keyof typeof requiredEmpty, isEmpty: boolean) => {
        setRequiredEmpty((prev) => ({
            ...prev,
            [field]: isEmpty,
        }));
    }, []);

    /**
     * Re-validates password confirmation whenever the password changes.
     * Prevents stale confirmation values.
     */
    useEffect(() => {
        if (!data.password_confirmation) return;

        handleValidate('password_confirmation', data.password === data.password_confirmation, translate('Passwords do not match'));
    }, [data.password, data.password_confirmation, handleValidate, translate]);

    /**
     * Form submit handler.
     * Prevents submission when client-side errors exist
     * and clears sensitive fields on completion.
     */
    const handleSubmit: FormEventHandler = useCallback(
        (e) => {
            e.preventDefault();

            if (hasClientErrors) return;

            post(route('password.store'), {
                onFinish: () => {
                    reset('password', 'password_confirmation');
                },
            });
        },
        [hasClientErrors, post, reset],
    );

    return (
        <AuthLayout title={translate('Change your password')}>
            <form autoComplete="off" onSubmit={handleSubmit} className="space-y-5">
                {/* EMAIL (read-only, no validation needed) */}
                <div>
                    <Label>{translate('Work email')}</Label>

                    <Input inputIdentifier="email" inputType="email" readOnly value={data.email} />
                </div>

                {/* PASSWORD */}
                <div>
                    <Label>
                        {translate('Password')} <span className="text-red-600">*</span>
                    </Label>

                    <Input
                        inputIdentifier="password"
                        inputType="password"
                        required
                        autoComplete="new-password"
                        value={data.password}
                        onChange={(e) => {
                            setData('password', e.target.value);
                        }}
                        onValidate={(valid, message) => {
                            handleValidate('password', valid, message);
                        }}
                        onRequiredStateChange={(isEmpty) => {
                            handleRequiredState('password', isEmpty);
                        }}
                    />

                    {clientErrors.password && <p className="mt-1 text-sm text-red-600">{clientErrors.password}</p>}
                </div>

                {/* PASSWORD CONFIRMATION */}
                <div>
                    <Label>
                        {translate('Confirm new password')} <span className="text-red-600">*</span>
                    </Label>

                    <Input
                        inputIdentifier="password_confirmation"
                        inputType="password"
                        required
                        autoComplete="new-password"
                        value={data.password_confirmation}
                        onChange={(e) => {
                            setData('password_confirmation', e.target.value);
                        }}
                        onValidate={(valid, message) => {
                            handleValidate('password_confirmation', valid, message);
                        }}
                        onRequiredStateChange={(isEmpty) => {
                            handleRequiredState('password_confirmation', isEmpty);
                        }}
                    />

                    {clientErrors.password_confirmation && <p className="mt-1 text-sm text-red-600">{clientErrors.password_confirmation}</p>}
                </div>

                <AccountButton processing={processing} disabled={isSubmitDisabled}>
                    {translate('Change password')}
                </AccountButton>
                <div className="mt-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
                    {translate('Back to')}{' '}
                    <TextLink href={route('login')} className="font-medium transition-colors duration-200" tabIndex={3}>
                        {translate('Sign in')}
                    </TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}
