import { router, useForm } from '@inertiajs/react';
import { FormEvent, JSX, useCallback, useState } from 'react';

import AccountButton from '@components/Account/AccountButton';
import Recaptcha from '@components/Recaptcha';
import TextLink from '@components/TextLink';
import { Button } from '@components/UserInterface/Button';
import { Checkbox } from '@components/UserInterface/Checkbox';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import AuthLayout from '@layouts/AuthLayout';
import { getEnvironmentVariable } from '@utils/Helpers/EnvironmentVariables';
import { route } from '@utils/Routes';
import { useTranslation } from 'react-i18next';

type SignInForm = {
    email: string;
    password: string;
    remember: boolean;
    recaptcha_token?: string;
};

/**
 * SignIn Component
 * Handles user authentication via sign in form or demo account buttons.
 * Optimized with useCallback to avoid inline function recreation
 * and improve memoization for child components like Input and Button.
 */
export default function SignIn(): JSX.Element {
    const { t: translate } = useTranslation();
    const [recaptchaToken, setRecaptchaToken] = useState('');
    const isDemo = getEnvironmentVariable.appDemo === 'true';

    const { data, setData, post, processing, reset } = useForm<SignInForm>({
        email: '',
        password: '',
        remember: false,
    });

    // Track client-side validation errors from Input components
    const [clientErrors, setClientErrors] = useState({
        email: null as string | null,
        password: null as string | null,
    });

    const [requiredEmpty, setRequiredEmpty] = useState({
        email: true,
        password: true,
    });

    const hasErrors = Object.values(clientErrors).some((err) => err !== null);
    const requiredFieldsEmpty = Object.values(requiredEmpty).some(Boolean);
    const isSubmitDisabled = hasErrors || requiredFieldsEmpty || processing;

    /**
     * Handle form submission
     */
    const handleSubmit = useCallback(
        (e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            if (hasErrors) return;

            const formData = { ...data, recaptcha_token: recaptchaToken };
            post(route('login'), formData, {
                onFinish: () => {
                    reset('password');
                },
            });
        },
        [data, hasErrors, post, recaptchaToken, reset],
    );

    /**
     * Handle input value changes
     */
    const handleChange = useCallback(
        (field: keyof SignInForm, value: string | boolean) => {
            setData(field, value);
        },
        [setData],
    );

    /**
     * Handle input validation updates
     */
    const handleValidate = useCallback((field: keyof typeof clientErrors, valid: boolean, message: string) => {
        setClientErrors((prev) => ({ ...prev, [field]: valid ? null : message }));
    }, []);

    /**
     * Handle input required state changes
     */
    const handleRequiredStateChange = useCallback((field: keyof typeof requiredEmpty, isEmpty: boolean) => {
        setRequiredEmpty((prev) => ({ ...prev, [field]: isEmpty }));
    }, []);

    /**
     * Handle demo account sign in
     */
    const handleDemoSignIn = useCallback(
        (email: string) => {
            router.post(route('login'), {
                email,
                password: 'Kakbima@DemoAccount2026',
                remember: true,
                recaptcha_token: recaptchaToken,
            });
        },
        [recaptchaToken],
    );

    return (
        <AuthLayout
            title={isDemo ? translate('Demo account') : translate('Sign in to your account')}
            description={isDemo ? translate('A great way to look at real business data and experiment with Kakbima features') : ''}
        >
            {isDemo ? (
                <form className="space-y-5" autoComplete="off" onSubmit={handleSubmit}>
                    <div className="mt-6">
                        <div className="border-t border-neutral-200 pt-5 dark:border-neutral-700">
                            <div className="flex flex-col space-y-3">
                                <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            handleDemoSignIn('organization@kakbima.dev');
                                        }}
                                        className="btn-primary hf-bg-primary h-12 w-full rounded-md py-2.5 font-medium text-white"
                                    >
                                        {translate('Administrator')}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            ) : (
                <form className="space-y-5" autoComplete="off" onSubmit={handleSubmit}>
                    {/* Email */}
                    <div>
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
                            onChange={(e) => {
                                handleChange('email', e.target.value);
                            }}
                            onValidate={(valid, message) => {
                                handleValidate('email', valid, message);
                            }}
                            onRequiredStateChange={(isEmpty) => {
                                handleRequiredStateChange('email', isEmpty);
                            }}
                        />
                        {clientErrors.email && <p className="mt-1 text-sm text-red-600">{clientErrors.email}</p>}
                    </div>

                    {/* Password */}
                    <div>
                        <Label htmlFor="password" className="mb-2 block font-medium text-neutral-700 dark:text-neutral-300">
                            {translate('Password')} <span className="text-red-600">*</span>
                        </Label>
                        <Input
                            inputIdentifier="password"
                            inputType="password"
                            required
                            tabIndex={2}
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(e) => {
                                handleChange('password', e.target.value);
                            }}
                            onValidate={(valid, message) => {
                                handleValidate('password', valid, message);
                            }}
                            onRequiredStateChange={(isEmpty) => {
                                handleRequiredStateChange('password', isEmpty);
                            }}
                        />
                        {clientErrors.password && <p className="mt-1 text-sm text-red-600">{clientErrors.password}</p>}
                    </div>

                    {/* Remember me & Forgot password */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <Checkbox
                                id="remember"
                                name="remember"
                                checked={data.remember}
                                onClick={() => {
                                    handleChange('remember', !data.remember);
                                }}
                                tabIndex={3}
                                className="rounded border-neutral-300"
                            />
                            <Label htmlFor="remember" className="ml-2 text-neutral-600 dark:text-neutral-400">
                                {translate('Remember me')}
                            </Label>
                        </div>
                        <div>
                            <TextLink href={route('password.request')} className="text-sm font-medium transition-colors duration-200" tabIndex={5}>
                                {translate('Forgot password?')}
                            </TextLink>
                        </div>
                    </div>

                    {/* Google reCAPTCHA */}
                    <Recaptcha
                        onVerify={setRecaptchaToken}
                        onExpired={() => {
                            setRecaptchaToken('');
                        }}
                        onError={() => {
                            setRecaptchaToken('');
                        }}
                    />

                    {/* Sign In Button */}
                    <AccountButton tabIndex={4} processing={processing} disabled={isSubmitDisabled}>
                        {translate('Sign in')}
                    </AccountButton>

                    {/* Sign up link */}
                    <div className="mt-4 text-center text-sm text-neutral-600 dark:text-neutral-400">
                        {translate('Don’t have an account?')}{' '}
                        <TextLink href={route('register')} className="font-medium transition-colors duration-200" tabIndex={6}>
                            {translate('Sign up')}
                        </TextLink>
                    </div>
                </form>
            )}
        </AuthLayout>
    );
}
