import { useForm } from '@inertiajs/react';
import { FormEventHandler, useCallback, useEffect, useState } from 'react';

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
import { useTranslation } from 'react-i18next';

type SignUpForm = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    terms: boolean;
    recaptcha_token?: string;
    plan_id?: string;
    referral_code?: string;
};

/**

 * SignUp component — renders the Kakbima registration form and handles client-side
 * validation (including password confirmation), Google reCAPTCHA token management, terms
 * acceptance, and submission via Inertia `post`.
 *
 * Validation notes:
 * * Password confirmation is validated after the confirm field is blurred and again
 * defensively on submit.
 * * Client-side input validators update `clientErrors` and `requiredEmpty` state.
 *
 * @param {{ referralCode?: string; planId?: string }} props - Component props.
 * @param {string} [props.referralCode] - Optional referral code to prefill the form.
 * @param {string} [props.planId] - Optional plan identifier to attach to the registration.
 * @returns {JSX.Element} The SignUp form wrapped in AuthLayout.
 */
export default function SignUp({ referralCode, planId }: { referralCode?: string; planId?: string }) {
    const { t: translate } = useTranslation();
    const [recaptchaToken, setRecaptchaToken] = useState('');
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

    const [clientErrors, setClientErrors] = useState({
        name: null as string | null,
        email: null as string | null,
        password: null as string | null,
        password_confirmation: null as string | null,
    });

    const [passwordMismatchError, setPasswordMismatchError] = useState<string | null>(null);
    const [termsError, setTermsError] = useState<string | null>(null);
    const [confirmTouched, setConfirmTouched] = useState(false);

    const [requiredEmpty, setRequiredEmpty] = useState({
        name: true,
        email: true,
        password: true,
        password_confirmation: true,
    });

    const hasErrors = Object.values(clientErrors).some((e) => e !== null);
    const requiredFieldsEmpty = Object.values(requiredEmpty).some(Boolean);

    /**
     * Handles updating form state for input fields.
     */
    const handleChange = useCallback(
        (field: keyof SignUpForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
            setData(field, e.target.value);
        },
        [setData],
    );

    /**
     * Handles validation messages emitted from Input component.
     */
    const handleValidate = useCallback(
        (field: keyof typeof clientErrors) => (valid: boolean, message: string | null) => {
            setClientErrors((prev) => ({ ...prev, [field]: valid ? null : message }));
        },
        [],
    );

    /**
     * Handles required field empty state.
     */
    const handleRequiredChange = useCallback(
        (field: keyof typeof requiredEmpty) => (isEmpty: boolean) => {
            setRequiredEmpty((prev) => ({ ...prev, [field]: isEmpty }));
        },
        [],
    );

    /**
     * Handles checkbox toggle for Terms acceptance.
     */
    const handleTermsToggle = useCallback(() => {
        setData('terms', !data.terms);
    }, [data.terms, setData]);

    /**
     * User finished interacting with confirm password input (for UX).
     */
    const handleConfirmBlur = useCallback(() => {
        setConfirmTouched(true);
    }, []);

    /**
     * Recaptcha handlers
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

    /**
     * Real-time password match validation, but only after confirm field touched.
     */
    useEffect(() => {
        if (!confirmTouched) {
            setPasswordMismatchError(null);
            return;
        }
        if (data.password !== data.password_confirmation) {
            setPasswordMismatchError(translate('Passwords do not match'));
        } else {
            setPasswordMismatchError(null);
        }
    }, [data.password, data.password_confirmation, confirmTouched, translate]);

    /**
     * Prevent submission when invalid; final defensive validation.
     */
    const handleSubmit: FormEventHandler = useCallback(
        (e) => {
            e.preventDefault();

            let hasClientSideErrors = false;

            if (data.password !== data.password_confirmation) {
                setPasswordMismatchError(translate('Passwords do not match'));
                setConfirmTouched(true);
                hasClientSideErrors = true;
            }

            if (!data.terms) {
                setTermsError(translate('You must read and agree to the terms and privacy statements in order to create an account'));
                hasClientSideErrors = true;
            } else {
                setTermsError(null);
            }

            if (hasErrors || hasClientSideErrors) return;

            post(route('register'), {
                data: { ...data, recaptcha_token: recaptchaToken },
                onFinish: () => {
                    reset('Password', 'password_confirmation');
                },
            });
        },
        [data, hasErrors, post, recaptchaToken, reset, translate],
    );

    const isSubmitDisabled = hasErrors || requiredFieldsEmpty || processing || !data.terms || Boolean(passwordMismatchError);

    return (
        <AuthLayout title={translate('Create your Kakbima account')}>
            <form className="space-y-5" autoComplete="off" onSubmit={handleSubmit}>
                <div className="space-y-4">
                    {/* Name */}
                    <div className="relative">
                        <Label htmlFor="name" className="mb-2 block font-medium text-neutral-700 dark:text-neutral-300">
                            {translate('Full name')} <span className="text-red-600">*</span>
                        </Label>
                        <Input
                            id="name"
                            type="text"
                            required
                            tabIndex={1}
                            autoComplete="name"
                            value={data.name}
                            onChange={handleChange('name')}
                            onValidate={handleValidate('name')}
                            onRequiredStateChange={handleRequiredChange('name')}
                        />
                        {clientErrors.name && <p className="mt-1 text-sm text-red-600">{clientErrors.name}</p>}
                    </div>

                    {/* Email */}
                    <div className="relative">
                        <Label htmlFor="email" className="mb-2 block font-medium text-neutral-700 dark:text-neutral-300">
                            {translate('Work email')} <span className="text-red-600">*</span>
                        </Label>
                        <Input
                            inputIdentifier="email"
                            inputType="email"
                            inputMode="email"
                            required
                            tabIndex={2}
                            autoComplete="email"
                            value={data.email}
                            onChange={handleChange('email')}
                            onValidate={handleValidate('email')}
                            onRequiredStateChange={handleRequiredChange('email')}
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
                            tabIndex={3}
                            autoComplete="new-password"
                            value={data.password}
                            onChange={handleChange('password')}
                            onValidate={handleValidate('password')}
                            onRequiredStateChange={handleRequiredChange('password')}
                        />
                        {clientErrors.password && <p className="mt-1 text-sm text-red-600">{clientErrors.password}</p>}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <Label htmlFor="password_confirmation" className="mb-2 block font-medium text-neutral-700 dark:text-neutral-300">
                            {translate('Confirm password')} <span className="text-red-600">*</span>
                        </Label>
                        <Input
                            id="password_confirmation"
                            inputType="password"
                            required
                            tabIndex={4}
                            autoComplete="new-password"
                            value={data.password_confirmation}
                            onChange={handleChange('password_confirmation')}
                            onValidate={handleValidate('password_confirmation')}
                            onRequiredStateChange={handleRequiredChange('password_confirmation')}
                            onBlur={handleConfirmBlur}
                        />

                        {(clientErrors.password_confirmation || passwordMismatchError) && (
                            <p className="mt-1 text-sm text-red-600">{clientErrors.password_confirmation ?? passwordMismatchError}</p>
                        )}
                    </div>

                    {/* Terms */}
                    <div className="flex items-start">
                        <Checkbox
                            id="terms"
                            name="terms"
                            checked={data.terms}
                            onClick={handleTermsToggle}
                            tabIndex={5}
                            className="rounded border-neutral-300"
                        />
                        <Label htmlFor="terms" className="ml-2 text-sm text-neutral-600 dark:text-neutral-400">
                            {translate('I agree to the')}{' '}
                            <a
                                href={`${createKakbimaExternalUrl('www')}${languageFromCookie}/trust/terms-of-service/`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-foreground underline"
                            >
                                {translate('Terms')}
                            </a>{' '}
                            {translate('and')}{' '}
                            <a
                                href={`${createKakbimaExternalUrl('www')}${languageFromCookie}/trust/privacy-policy/`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-foreground underline"
                            >
                                {translate('Privacy')}
                            </a>
                        </Label>
                    </div>
                    {termsError && <p className="mt-1 text-sm text-red-600">{termsError}</p>}
                </div>

                <Recaptcha onVerify={handleRecaptchaVerify} onExpired={handleRecaptchaExpired} onError={handleRecaptchaError} />

                <AccountButton tabIndex={6} processing={processing} disabled={isSubmitDisabled}>
                    {translate('Create account')}
                </AccountButton>

                <div className="mt-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
                    {translate('Already have an account?')}{' '}
                    <TextLink href={route('login')} className="font-medium" tabIndex={7}>
                        {translate('Sign in')}
                    </TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}
