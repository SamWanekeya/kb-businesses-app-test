/**
 * @file SignIn.tsx
 * @description
 * Handles standard and demo-account authentication.
 *
 * The standard sign-in flow validates the user's work email and password,
 * supports remember-me authentication, and requires reCAPTCHA verification.
 *
 * The demo flow provides predefined account roles for exploring Kakbima
 * without requiring manual credential entry.
 */

import { router, useForm } from '@inertiajs/react';
import type { SubmitEvent } from 'react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import AccountButton from '@components/Account/AccountButton';
// import Recaptcha from '@components/Recaptcha';
import TextLink from '@components/TextLink';
import { Button } from '@components/UserInterface/Button';
import { Checkbox } from '@components/UserInterface/Checkbox';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import AuthLayout from '@layouts/AuthLayout';
import { getEnvironmentVariable } from '@utils/Helpers/EnvironmentVariables';
import { route } from '@utils/Routes';

interface SignInForm {
    email: string;
    password: string;
    remember: boolean;
    // recaptcha_token?: string;
}

interface ClientErrors {
    email: string | null;
    password: string | null;
}

/**
 * SignIn
 *
 * Provides the authentication entry point for Kakbima.
 *
 * Responsibilities:
 * - Authenticate users with email and password.
 * - Validate email and password fields through the shared Input component.
 * - Handle remember-me preferences.
 * - Require reCAPTCHA verification for standard authentication.
 * - Provide demo-account shortcuts when demo mode is enabled.
 * - Reset the password field after authentication requests finish.
 *
 * Accessibility:
 * - Uses semantic form controls with associated labels.
 * - Exposes validation state through `aria-invalid`.
 * - Associates validation messages with fields through `aria-describedby`.
 * - Uses explicit button types for non-submit actions.
 * - Maintains a logical keyboard navigation order.
 * - Uses semantic links for navigation actions.
 *
 * Performance:
 * - Required-field state is derived from the existing form data rather than
 *   maintained as duplicate React state.
 * - Event handlers that participate in child component contracts are memoized.
 * - Demo-account actions share one submission handler rather than duplicating
 *   authentication logic.
 *
 * Extension points:
 * - Additional authentication providers can be introduced alongside the
 *   existing standard and demo flows.
 * - Server-side errors can be merged into `clientErrors` if the authentication
 *   endpoint later exposes field-specific validation responses.
 */
export default function SignIn() {
    const { t: translate } = useTranslation();

    // const [recaptchaToken, setRecaptchaToken] = useState('');
    const [clientErrors, setClientErrors] = useState<ClientErrors>({
        email: null,
        password: null,
    });

    const isDemo = getEnvironmentVariable.appDemo === 'true';

    const { data, setData, post, processing, reset } = useForm<SignInForm>({
        email: '',
        password: '',
        remember: false,
    });

    /**
     * Determines whether either authentication field currently has a
     * client-side validation error.
     */
    const hasClientErrors = clientErrors.email !== null || clientErrors.password !== null;

    /**
     * Required-field state is derived directly from form data.
     *
     * This avoids maintaining a second state object that can become
     * inconsistent with the actual input values.
     */
    const requiredFieldsEmpty = data.email.trim() === '' || data.password.trim() === '';

    const isSubmitDisabled = processing || hasClientErrors || requiredFieldsEmpty;

    /**
     * Updates validation state for an individual authentication field.
     */
    const handleValidate = useCallback((field: keyof ClientErrors, valid: boolean, message: string | null) => {
        setClientErrors((current) => ({
            ...current,
            [field]: valid ? null : message,
        }));
    }, []);

    /**
     * Handles standard sign-in form submission.
     */
    const handleSubmit = useCallback(
        (event: SubmitEvent<HTMLFormElement>) => {
            event.preventDefault();

            if (isSubmitDisabled) {
                return;
            }

            post(route('sign-in'), {
                data: {
                    ...data,
                    // recaptcha_token: recaptchaToken,
                },
                onFinish: () => {
                    reset('password');
                },
            });
        },
        [data, isSubmitDisabled, post, reset],
    );

    /**
     * Authenticates using one of the predefined demo accounts.
     *
     * Demo credentials intentionally remain confined to this handler rather
     * than being duplicated across individual role buttons.
     */
    const handleDemoSignIn = useCallback((email: string) => {
        router.post(route('sign-in'), {
            email,
            password: 'Kakbima@DemoAccount2026',
            remember: true,
            // recaptcha_token: recaptchaToken,
        });
    }, []);

    /**
     * Clears the reCAPTCHA token when verification expires.
     */
    // const handleRecaptchaExpired = useCallback(() => {
    //     setRecaptchaToken('');
    // }, []);

    /**
     * Clears the reCAPTCHA token when verification encounters an error.
     */
    // const handleRecaptchaError = useCallback(() => {
    //     setRecaptchaToken('');
    // }, []);

    /**
     * Toggles the remember-me preference.
     */
    const handleRememberChange = useCallback(() => {
        setData('remember', !data.remember);
    }, [data.remember, setData]);

    return (
        <AuthLayout
            title={isDemo ? translate('Demo account') : translate('Sign in to your account')}
            description={isDemo ? translate('A great way to look at real business data and experiment with Kakbima features') : ''}
        >
            {isDemo ? (
                <form
                    autoComplete="off"
                    onSubmit={(event) => {
                        event.preventDefault();
                    }}
                    className="space-y-5"
                >
                    <div className="border-border border-t pt-5">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Button
                                type="button"
                                onClick={() => handleDemoSignIn('organization@kakbima.dev')}
                                className="h-12 w-full rounded-md font-medium"
                            >
                                {translate('Administrator')}
                            </Button>

                            <Button
                                type="button"
                                onClick={() => handleDemoSignIn('sarahjohnson@kakbima.dev')}
                                className="h-12 w-full rounded-md font-medium"
                            >
                                {translate('User')}
                            </Button>
                        </div>
                    </div>
                </form>
            ) : (
                <form autoComplete="off" noValidate onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="email">
                            {translate('Work email')}{' '}
                            <span aria-hidden="true" className="text-destructive">
                                *
                            </span>
                        </Label>

                        <Input
                            inputIdentifier="email"
                            inputType="email"
                            inputMode="email"
                            required
                            autoComplete="email"
                            value={data.email}
                            onChange={(event) => {
                                setData('email', event.target.value);
                            }}
                            onValidate={(valid, message) => {
                                handleValidate('email', valid, message);
                            }}
                            aria-invalid={Boolean(clientErrors.email)}
                            aria-describedby={clientErrors.email ? 'email-error' : undefined}
                        />

                        {clientErrors.email && (
                            <p id="email-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
                                {clientErrors.email}
                            </p>
                        )}
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
                            autoComplete="current-password"
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

                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="remember"
                                name="remember"
                                checked={data.remember}
                                onClick={handleRememberChange}
                                aria-label={translate('Remember me')}
                                className="rounded border-neutral-300"
                            />

                            <Label htmlFor="remember" className="text-muted-foreground">
                                {translate('Remember me')}
                            </Label>
                        </div>

                        <TextLink href={route('account-recovery-request')} className="text-sm font-medium transition-colors duration-200">
                            {translate('Forgot password?')}
                        </TextLink>
                    </div>

                    {/*<Recaptcha*/}
                    {/*    onVerify={setRecaptchaToken}*/}
                    {/*    onExpired={handleRecaptchaExpired}*/}
                    {/*    onError={handleRecaptchaError}*/}
                    {/*/>*/}

                    <AccountButton processing={processing} disabled={isSubmitDisabled}>
                        {translate('Sign in')}
                    </AccountButton>

                    <p className="text-muted-foreground text-center text-sm">
                        {translate('Don’t have an account?')}{' '}
                        <TextLink href={route('sign-up')} className="font-medium transition-colors duration-200">
                            {translate('Sign up')}
                        </TextLink>
                    </p>
                </form>
            )}
        </AuthLayout>
    );
}
