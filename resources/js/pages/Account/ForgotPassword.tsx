/**
 * @file ForgotPassword.tsx
 * @description
 * Handles the "Forgot Password" flow:
 * - Email input validation
 * - Recaptcha verification
 * - POST request to send reset link
 */

import { useForm } from '@inertiajs/react';
import { FormEventHandler, useCallback, useState } from 'react';

import AccountButton from '@components/Account/AccountButton';
import Recaptcha from '@components/Recaptcha';
import TextLink from '@components/TextLink';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import AuthLayout from '@layouts/AuthLayout';
import { route } from '@utils/Routes';
import { useTranslation } from 'react-i18next';

/**
 * Forgot password page component.
 * Wraps content in AuthLayout and manages form submission.
 */
export default function ForgotPassword() {
    const { t: translate } = useTranslation();
    const [recaptchaToken, setRecaptchaToken] = useState('');

    const { data, setData, post, processing } = useForm<{
        email: string;
        recaptcha_token?: string;
    }>({
        email: '',
    });

    // Track validation errors from Input component
    const [clientErrors, setClientErrors] = useState({
        email: null as string | null,
    });

    const hasErrors = Object.values(clientErrors).some((e) => e !== null);

    const [requiredEmpty, setRequiredEmpty] = useState({
        email: true,
    });

    const requiredFieldsEmpty = Object.values(requiredEmpty).some(Boolean);
    const isSubmitDisabled = hasErrors || requiredFieldsEmpty || processing;

    /**
     * Update email field.
     * Memoized to avoid re-renders in Input component.
     */
    const handleEmailChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setData('email', e.target.value);
        },
        [setData],
    );

    /**
     * Handle validation result from Input component.
     */
    const handleEmailValidate = useCallback((valid: boolean, message?: string) => {
        setClientErrors((prev) => ({
            ...prev,
            email: valid ? null : message || null,
        }));
    }, []);

    /**
     * Track whether required fields are empty.
     */
    const handleRequiredStateChange = useCallback((isEmpty: boolean) => {
        setRequiredEmpty((prev) => ({ ...prev, email: isEmpty }));
    }, []);

    /**
     * Submit handler for password reset request.
     */
    const handleSubmit: FormEventHandler = useCallback(
        (e) => {
            e.preventDefault();
            if (hasErrors) return;

            post(route('password.email'), {
                data: {
                    ...data,
                    recaptcha_token: recaptchaToken,
                },
            });
        },
        [hasErrors, post, data, recaptchaToken],
    );

    /**
     * Recaptcha callback handlers.
     */
    const handleRecaptchaVerify = useCallback((token: string) => {
        setRecaptchaToken(token);
    }, []);

    const handleRecaptchaExpired = useCallback(() => {
        setRecaptchaToken('');
    }, []);

    const handleRecaptchaError = useCallback(() => {
        setRecaptchaToken('');
    }, []);

    return (
        <AuthLayout title={translate('Forgot password')}>
            <form className="space-y-5" autoComplete="off" onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <Label htmlFor="email" className="mb-2 block font-medium text-neutral-700 dark:text-neutral-300">
                        {translate('Work email')} <span className="text-red-600">*</span>
                    </Label>

                    <Input
                        inputIdentifier="email"
                        inputType="email"
                        inputMode="email"
                        required
                        tabIndex={1}
                        autoComplete="email"
                        value={data.email}
                        onChange={handleEmailChange}
                        onValidate={handleEmailValidate}
                        onRequiredStateChange={handleRequiredStateChange}
                        className="block w-full outline-1 focus:ring-2 focus:ring-green-500 sm:text-sm/6"
                    />

                    {clientErrors.email && <p className="mt-1 text-sm text-red-600">{clientErrors.email}</p>}
                </div>

                <Recaptcha onVerify={handleRecaptchaVerify} onExpired={handleRecaptchaExpired} onError={handleRecaptchaError} />

                <AccountButton tabIndex={2} processing={processing} disabled={isSubmitDisabled}>
                    {translate('Send password reset link')}
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
