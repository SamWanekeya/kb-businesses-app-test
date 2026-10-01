/**
 * @file SignUp.tsx
 * @description
 * Handles new Kakbima account registration.
 *
 * Responsibilities:
 * - Collect and validate registration details.
 * - Validate password confirmation.
 * - Manage terms and privacy acceptance.
 * - Handle reCAPTCHA verification.
 * - Preserve optional plan and referral information.
 * - Submit the registration request through Inertia.
 */

import { useForm } from '@inertiajs/react';
import type { ChangeEvent, SubmitEvent } from 'react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import AccountButton from '@components/Account/AccountButton';
import Recaptcha from '@components/Recaptcha';
import TextLink from '@components/TextLink';
import { Checkbox } from '@components/UserInterface/Checkbox';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import AuthLayout from '@layouts/AuthLayout';
import { getCookie } from '@utils/Helpers/Cookies';
import { createKakbimaExternalUrl } from '@utils/Helpers/Url';
import { route } from '@utils/Routes';

interface SignUpProps {
    /** Optional referral code attached to the registration. */
    referralCode?: string;

    /** Optional subscription plan identifier attached to the registration. */
    planId?: string;
}

interface SignUpForm {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    terms: boolean;
    // recaptcha_token?: string;
    plan_id?: string;
    referral_code?: string;
}

interface ClientErrors {
    name: string | null;
    email: string | null;
    password: string | null;
    password_confirmation: string | null;
}

/**
 * SignUp
 *
 * Provides the account-registration experience for new Kakbima users.
 *
 * Responsibilities:
 * - Collect required registration information.
 * - Delegate field validation to the shared Input component.
 * - Validate password confirmation after the confirmation field is touched.
 * - Require acceptance of the Terms and Privacy Policy.
 * - Manage reCAPTCHA verification.
 * - Submit registration data through Inertia.
 *
 * Accessibility:
 * - Uses semantic form controls with associated labels.
 * - Removes manually managed tab ordering in favor of the browser's
 *   natural document order.
 * - Associates field-level validation messages through `aria-describedby`.
 * - Exposes invalid fields through `aria-invalid`.
 * - Uses `aria-hidden` for decorative required-field indicators.
 * - Provides explicit labels and descriptions for the terms checkbox.
 *
 * Performance:
 * - Required-field state is derived from form data instead of duplicated
 *   React state.
 * - Event handlers used by child components are memoized.
 * - Password confirmation validation only activates after the confirmation
 *   field has been touched.
 *
 * Extension points:
 * - Additional registration fields can be added to `SignUpForm` without
 *   introducing another validation-state abstraction.
 * - Additional legal acknowledgements can be added alongside the existing
 *   terms acceptance state.
 */
export default function SignUp({ referralCode, planId }: SignUpProps) {
    const { t: translate } = useTranslation();

    // const [recaptchaToken, setRecaptchaToken] = useState('');
    const [confirmTouched, setConfirmTouched] = useState(false);

    const [clientErrors, setClientErrors] = useState<ClientErrors>({
        name: null,
        email: null,
        password: null,
        password_confirmation: null,
    });

    const languageFromCookie = getCookie('__kb_lcl');

    const { data, setData, post, processing, reset } = useForm<SignUpForm>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        terms: false,
        plan_id: planId,
        referral_code: referralCode,
    });

    /**
     * Determines whether any shared Input validation currently reports
     * an error.
     */
    const hasClientErrors =
        clientErrors.name !== null || clientErrors.email !== null || clientErrors.password !== null || clientErrors.password_confirmation !== null;

    /**
     * Required-field state is derived directly from form values.
     *
     * Keeping this derived prevents a second state object from becoming
     * inconsistent with the actual form data.
     */
    const requiredFieldsEmpty = data.name.trim() === '' || data.email.trim() === '' || data.password === '' || data.password_confirmation === '';

    /**
     * Password confirmation mismatch is intentionally derived rather than
     * stored separately. This prevents duplicate state representing the
     * same underlying form values.
     */
    const passwordMismatch = confirmTouched && data.password_confirmation !== '' && data.password !== data.password_confirmation;

    const passwordMismatchMessage = passwordMismatch ? translate('Passwords do not match') : null;

    const termsError = !data.terms ? translate('You must read and agree to the terms and privacy statements in order to create an account') : null;

    const isSubmitDisabled = processing || hasClientErrors || requiredFieldsEmpty || passwordMismatch || !data.terms;

    /**
     * Updates client-side validation state for an individual field.
     */
    const handleValidate = useCallback((field: keyof ClientErrors, valid: boolean, message: string | null) => {
        setClientErrors((current) => ({
            ...current,
            [field]: valid ? null : message,
        }));
    }, []);

    /**
     * Updates the name field.
     */
    const handleNameChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            setData('name', event.target.value);
        },
        [setData],
    );

    /**
     * Updates the email field.
     */
    const handleEmailChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            setData('email', event.target.value);
        },
        [setData],
    );

    /**
     * Updates the password field.
     */
    const handlePasswordChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            setData('password', event.target.value);
        },
        [setData],
    );

    /**
     * Updates the password confirmation field.
     */
    const handlePasswordConfirmationChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            setData('password_confirmation', event.target.value);
        },
        [setData],
    );

    /**
     * Marks password confirmation as touched.
     *
     * Mismatch feedback is intentionally delayed until the user has
     * interacted with the confirmation field to avoid presenting an
     * error before there is enough context for the user to act on it.
     */
    const handleConfirmBlur = useCallback(() => {
        setConfirmTouched(true);
    }, []);

    /**
     * Toggles terms and privacy acceptance.
     */
    const handleTermsToggle = useCallback(() => {
        setData('terms', !data.terms);
    }, [data.terms, setData]);

    /**
     * Stores a successful reCAPTCHA token.
     */
    const handleRecaptchaVerify = useCallback((token: string) => {
        setRecaptchaToken(token);
    }, []);

    /**
     * Clears the reCAPTCHA token after it expires.
     */
    const handleRecaptchaExpired = useCallback(() => {
        setRecaptchaToken('');
    }, []);

    /**
     * Clears the reCAPTCHA token when verification fails.
     */
    const handleRecaptchaError = useCallback(() => {
        setRecaptchaToken('');
    }, []);

    /**
     * Performs the final client-side checks and submits the registration
     * request through Inertia.
     *
     * The checks here intentionally duplicate the critical password
     * confirmation and terms requirements as a defensive boundary before
     * the request is sent.
     */
    const handleSubmit = useCallback(
        (event: SubmitEvent<HTMLFormElement>) => {
            event.preventDefault();

            const passwordsDoNotMatch = data.password !== data.password_confirmation;

            if (passwordsDoNotMatch) {
                setConfirmTouched(true);
            }

            if (passwordsDoNotMatch || !data.terms || hasClientErrors) {
                return;
            }

            post(route('sign-up'), {
                data: {
                    ...data,
                    // recaptcha_token: recaptchaToken,
                },
                onFinish: () => {
                    reset('password', 'password_confirmation');
                },
            });
        },
        [data, hasClientErrors, post, reset],
    );

    // const termsUrl = `${createKakbimaExternalUrl('www')}${languageFromCookie}/trust/terms-of-service/`;
    // const privacyUrl = `${createKakbimaExternalUrl('www')}${languageFromCookie}/trust/privacy-policy/`;

    const termsUrl = `${createKakbimaExternalUrl('legal')}${languageFromCookie}/terms-of-use/`;
    const privacyUrl = `${createKakbimaExternalUrl('legal')}${languageFromCookie}/privacy-policy/`;

    return (
        <AuthLayout title={translate('Create your Kakbima account')}>
            <form autoComplete="off" noValidate onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-5">
                    {/* Full name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            {translate('Full name')}{' '}
                            <span aria-hidden="true" className="text-destructive">
                                *
                            </span>
                        </Label>

                        <Input
                            inputIdentifier="name"
                            inputType="text"
                            inputMode="text"
                            required
                            autoComplete="name"
                            value={data.name}
                            onChange={handleNameChange}
                            onValidate={(valid, message) => {
                                handleValidate('name', valid, message);
                            }}
                            aria-invalid={Boolean(clientErrors.name)}
                            aria-describedby={clientErrors.name ? 'name-error' : undefined}
                        />

                        {clientErrors.name && (
                            <p id="name-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
                                {clientErrors.name}
                            </p>
                        )}
                    </div>

                    {/* Work email */}
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
                            onChange={handleEmailChange}
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

                    {/* Password */}
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
                            onChange={handlePasswordChange}
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

                    {/* Password confirmation */}
                    <div className="space-y-2">
                        <Label htmlFor="password_confirmation">
                            {translate('Confirm password')}{' '}
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
                            onChange={handlePasswordConfirmationChange}
                            onValidate={(valid, message) => {
                                handleValidate('password_confirmation', valid, message);
                            }}
                            onBlur={handleConfirmBlur}
                            aria-invalid={Boolean(clientErrors.password_confirmation) || passwordMismatch}
                            aria-describedby={clientErrors.password_confirmation || passwordMismatch ? 'password-confirmation-error' : undefined}
                        />

                        {(clientErrors.password_confirmation || passwordMismatchMessage) && (
                            <p id="password-confirmation-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
                                {clientErrors.password_confirmation ?? passwordMismatchMessage}
                            </p>
                        )}
                    </div>

                    {/* Terms and privacy */}
                    <div className="space-y-2">
                        <div className="flex items-start gap-2">
                            <Checkbox
                                id="terms"
                                name="terms"
                                checked={data.terms}
                                onClick={handleTermsToggle}
                                aria-describedby={termsError ? 'terms-error' : undefined}
                                aria-invalid={Boolean(termsError)}
                                className="rounded border-neutral-300"
                            />

                            <Label htmlFor="terms" className="text-muted-foreground text-sm leading-5">
                                {translate('I agree to the')}{' '}
                                <a
                                    href={termsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-foreground hover:text-primary font-medium underline underline-offset-4 transition-colors"
                                >
                                    {translate('Terms')}
                                </a>{' '}
                                {translate('and')}{' '}
                                <a
                                    href={privacyUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-foreground hover:text-primary font-medium underline underline-offset-4 transition-colors"
                                >
                                    {translate('Privacy')}
                                </a>
                            </Label>
                        </div>

                        {termsError && (
                            <p id="terms-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
                                {termsError}
                            </p>
                        )}
                    </div>
                </div>

                <Recaptcha onVerify={handleRecaptchaVerify} onExpired={handleRecaptchaExpired} onError={handleRecaptchaError} />

                <AccountButton processing={processing} disabled={isSubmitDisabled}>
                    {translate('Create account')}
                </AccountButton>

                <p className="text-muted-foreground text-center text-sm">
                    {translate('Already have an account?')}{' '}
                    <TextLink href={route('sign-in')} className="font-medium">
                        {translate('Sign in')}
                    </TextLink>
                </p>
            </form>
        </AuthLayout>
    );
}
