/**
 * @file ConfirmPassword.tsx
 * @description
 * Requires the user to re-enter their password for sensitive actions.
 */

import { useForm } from '@inertiajs/react';
import { FormEventHandler, useCallback, useState } from 'react';

import AccountButton from '@components/Account/AccountButton';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import AuthLayout from '@layouts/AuthLayout';
import { route } from '@utils/Routes';
import { useTranslation } from 'react-i18next';

/**
 * ConfirmPassword page.
 * Handles password confirmation before secure operations.
 */
export default function ConfirmPassword() {
    const { t: translate } = useTranslation();

    const { data, setData, post, processing, reset } = useForm({
        password: '',
    });

    // Validation error state from Input component
    const [clientErrors, setClientErrors] = useState({
        password: null as string | null,
    });

    // Track which required fields are empty
    const [requiredEmpty, setRequiredEmpty] = useState({
        password: true,
    });

    const hasErrors = Object.values(clientErrors).some((e) => e !== null);
    const requiredFieldsEmpty = Object.values(requiredEmpty).some(Boolean);
    const isSubmitDisabled = hasErrors || requiredFieldsEmpty || processing;

    /**
     * Update password field.
     * Memoized to avoid unnecessary re-renders in the Input component.
     */
    const handlePasswordChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setData('password', e.target.value);
        },
        [setData],
    );

    /**
     * Handle client-side validation from Input component.
     */
    const handlePasswordValidate = useCallback((valid: boolean, message?: string) => {
        setClientErrors((prev) => ({
            ...prev,
            password: valid ? null : message || null,
        }));
    }, []);

    /**
     * Track required field empty state.
     */
    const handleRequiredStateChange = useCallback((isEmpty: boolean) => {
        setRequiredEmpty((prev) => ({ ...prev, password: isEmpty }));
    }, []);

    /**
     * Submit handler for password confirmation.
     */
    const handleSubmit: FormEventHandler = useCallback(
        (e) => {
            e.preventDefault();
            if (hasErrors) return;
            post(route('password.confirm'), {
                onFinish: () => {
                    reset('password');
                },
            });
        },
        [hasErrors, post, reset],
    );

    return (
        <AuthLayout
            title={translate('Confirm your password')}
            description={translate('For extra security, please re-enter your password to continue')}
        >
            <form autoComplete="off" onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-4">
                    <div className="relative">
                        <Label htmlFor="password" className="mb-2 block font-medium text-neutral-700 dark:text-neutral-300">
                            {translate('Password')} <span className="text-red-600">*</span>
                        </Label>

                        <Input
                            inputIdentifier="password"
                            inputType="password"
                            required
                            tabIndex={1}
                            autoComplete="current-password"
                            value={data.password}
                            onChange={handlePasswordChange}
                            onValidate={handlePasswordValidate}
                            onRequiredStateChange={handleRequiredStateChange}
                        />

                        {clientErrors.password && <p className="mt-1 text-sm text-red-600">{clientErrors.password}</p>}
                    </div>
                </div>

                <AccountButton tabIndex={2} processing={processing} disabled={isSubmitDisabled}>
                    {translate('Confirm new password')}
                </AccountButton>
            </form>
        </AuthLayout>
    );
}
