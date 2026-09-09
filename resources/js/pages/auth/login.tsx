import { useForm } from '@inertiajs/react';
import { Building2, Copy, Eye, EyeOff, ShieldCheck, User, Users } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import AccountButton from '@components/Account/AccountButton';
import InputError from '@components/InputError';
import Recaptcha, { useRecaptchaSettings } from '@components/recaptcha';
import TextLink from '@components/text-link';
import { Checkbox } from '@components/UserInterface/Checkbox';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import { useBrand } from '@contexts/BrandContext';
import { THEME_COLORS } from '@hooks/use-appearance';
import AuthLayout from '@layouts/auth-layout';
import { route } from '@utils/Routes';
import { useTranslation } from 'react-i18next';

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
    recaptcha_token?: string;
};

interface Business {
    id: number;
    name: string;
    slug: string;
    business_type: string;
}

interface LoginProps {
    status?: string;
    canResetPassword?: boolean;
    demoOrganizations?: Business[];
    demoUsers?: { super_admin: string; organization: string; user: string };
    demoPassword?: string;
}

export default function Login({ status, canResetPassword, demoOrganizations = [], demoUsers, demoPassword = 'password' }: LoginProps) {
    const { t: translate } = useTranslation();
    const [recaptchaToken, setRecaptchaToken] = useState<string>('');
    const { themeColor, customColor } = useBrand();
    const primaryColor = themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS];
    const [isDemo, setIsDemo] = useState<boolean>(false);
    const { recaptchaEnabled } = useRecaptchaSettings();
    const [showRecaptchaError, setShowRecaptchaError] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);

    // Always show organization buttons by default
    const [showBusinessButtons, setShowBusinessButtons] = useState<boolean>(true);

    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        // Check if reCAPTCHA is enabled and token is missing
        if (recaptchaEnabled && !recaptchaToken) {
            setShowRecaptchaError(true);
            return;
        }

        setShowRecaptchaError(false);
        const formData = { ...data, recaptcha_token: recaptchaToken };
        post(route('login'), {
            data: formData,
            onFinish: () => reset('password'),
        });
    };

    // No longer needed as we're using router.post directly in the button handlers

    const handleCopyCredentials = (email: string) => {
        setData({
            ...data,
            email: email,
            password: demoPassword || 'password',
        });

        if (navigator.clipboard) {
            navigator.clipboard.writeText(email);
        }
    };

    const openBusinessInNewTab = (businessId: number, slug: string, e: React.MouseEvent) => {
        // Prevent the default form submission
        e.preventDefault();
        e.stopPropagation();

        // Use the same URL structure as in vcard-builder/index.tsx
        const url = route('public.vcard.show.direct', slug);
        window.open(url, '_blank');
    };
    const planExpiredMessage = (errors as any).plan_expired;
    const displayStatus = planExpiredMessage || status;
    const displayStatusType = planExpiredMessage ? 'error' : 'success';

    return (
        <AuthLayout
            title={translate('Welcome back!')}
            description={translate('Sign in to continue to your account')}
            status={displayStatus}
            statusType={displayStatusType}
        >
            <form className="space-y-3 sm:space-y-4" onSubmit={submit}>
                <div className="space-y-4">
                    <div className="relative">
                        <Label htmlFor="email" className="mb-2 block font-medium text-gray-700 dark:text-gray-300" required>
                            {translate('Email address')}
                        </Label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 flex items-center ltr:left-0 ltr:pl-3 rtl:right-0 rtl:pr-3">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                    ></path>
                                </svg>
                            </div>
                            <Input
                                id="email"
                                type="email"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="organization@kakbima.dev"
                                className="h-11 w-full rounded-lg border-gray-200 bg-white text-gray-900 transition-all duration-200 ltr:pl-10 rtl:pr-10 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                            />
                        </div>
                        <InputError message={errors.email} />
                    </div>

                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <Label htmlFor="password" className="font-medium text-gray-700 dark:text-gray-300" required>
                                {translate('Password')}
                            </Label>
                            {canResetPassword && (
                                <TextLink
                                    href={route('password.request')}
                                    className="hover:underline-primary text-sm no-underline transition-colors duration-200 hover:underline"
                                    style={{ color: primaryColor }}
                                    tabIndex={5}
                                >
                                    {translate('Forgot password?')}
                                </TextLink>
                            )}
                        </div>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 flex items-center ltr:left-0 ltr:pl-3 rtl:right-0 rtl:pr-3">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                    ></path>
                                </svg>
                            </div>
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                tabIndex={2}
                                autoComplete="current-password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="••••••••••••"
                                className="h-11 w-full rounded-lg border-gray-200 bg-white px-10 text-gray-900 transition-all duration-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                            />
                            <div className="absolute inset-y-0 flex items-center ltr:right-0 ltr:pr-3 rtl:left-0 rtl:pl-3">
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <InputError message={errors.password} />
                    </div>

                    <div className="!mt-2.5 !mb-3 flex items-center">
                        <Checkbox
                            id="remember"
                            name="remember"
                            checked={data.remember}
                            onClick={() => setData('remember', !data.remember)}
                            tabIndex={3}
                            className="h-[14px] w-[14px] rounded border border-gray-300 dark:border-gray-600"
                        />
                        <Label htmlFor="remember" className="text-sm text-gray-600 ltr:ml-2 rtl:mr-2 dark:text-gray-400">
                            {translate('Remember me')}
                        </Label>
                    </div>
                </div>

                <Recaptcha
                    onVerify={(token) => {
                        setRecaptchaToken(token);
                        setShowRecaptchaError(false);
                    }}
                    onExpired={() => setRecaptchaToken('')}
                    onError={() => setRecaptchaToken('')}
                />

                {showRecaptchaError && recaptchaEnabled && !recaptchaToken && (
                    <p className="-mt-2 text-center text-sm text-red-600 dark:text-red-400">
                        {translate('Please complete the reCAPTCHA verification')}
                    </p>
                )}

                <AccountButton
                    tabIndex={4}
                    processing={processing}
                    className="w-full transform rounded-md py-2.5 text-sm font-medium tracking-wide text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                    style={{ backgroundColor: primaryColor }}
                >
                    {translate('Sign in')}
                </AccountButton>
                <div className="text-center">
                    <p className="text-sm text-gray-500">
                        {translate("Don't have an account?")}{' '}
                        <TextLink href={route('register')} className="font-medium hover:underline" style={{ color: primaryColor }} tabIndex={6}>
                            {translate('Sign up')}
                        </TextLink>
                    </p>
                </div>

                {isDemo && (
                    <>
                        <div className="mt-3 border-t border-gray-100/60 pt-3 sm:mt-4 sm:pt-4 dark:border-gray-700">
                            <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4 dark:border-gray-700 dark:bg-gray-800">
                                <div className="mb-2 flex items-center sm:mb-3">
                                    <Users className="h-4 w-4 ltr:mr-2 rtl:ml-2" style={{ color: primaryColor }} />
                                    <h3 className="text-xs font-semibold text-gray-900 sm:text-sm dark:text-white">
                                        {translate('Demo Sign in Credentials')}
                                    </h3>
                                </div>

                                <div className="w-full overflow-hidden rounded-lg border border-gray-100 dark:border-gray-700">
                                    <table className="w-full table-fixed text-xs sm:text-[13px] ltr:text-left rtl:text-right">
                                        <thead style={{ backgroundColor: `${primaryColor}10` }}>
                                            <tr className="border-b border-gray-100 text-gray-900 dark:border-gray-700 dark:text-gray-100">
                                                <th className="w-[35%] py-2 font-semibold ltr:pl-3 rtl:pr-3">{translate('Role')}</th>
                                                <th className="w-[35%] truncate py-2 font-semibold">{translate('Email')}</th>
                                                <th className="w-[20%] py-2 font-semibold">{translate('Password')}</th>
                                                <th className="w-[10%] py-2 ltr:pr-3 rtl:pl-3"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100/80 dark:divide-gray-700">
                                            <tr>
                                                <td className="py-2 ltr:pl-3 rtl:pr-3">
                                                    <div className="flex items-center">
                                                        <div className="hidden h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-50 sm:flex ltr:mr-2 rtl:ml-2 dark:bg-green-900/30">
                                                            <ShieldCheck className="h-3 w-3" style={{ color: primaryColor }} />
                                                        </div>
                                                        <span className="truncate font-medium text-gray-900 dark:text-gray-100">
                                                            {translate('Super Admin')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td
                                                    className="truncate py-2 text-gray-600 ltr:pr-2 rtl:pl-2 dark:text-gray-300"
                                                    title="super_admin@kakbima.dev"
                                                >
                                                    super_admin@kakbima.dev
                                                </td>
                                                <td className="truncate py-2 font-mono text-sm text-gray-600 dark:text-gray-300">password</td>
                                                <td className="py-2 ltr:pr-3 ltr:text-right rtl:pl-3 rtl:text-left">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopyCredentials('super_admin@kakbima.dev')}
                                                        className="inline-flex cursor-pointer items-center justify-center rounded p-1.5 transition-colors hover:opacity-80"
                                                        style={{ backgroundColor: `${primaryColor}15` }}
                                                    >
                                                        <Copy className="h-3.5 w-3.5" style={{ color: primaryColor }} />
                                                    </button>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="py-2 ltr:pl-3 rtl:pr-3">
                                                    <div className="flex items-center">
                                                        <div className="hidden h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-50 sm:flex ltr:mr-2 rtl:ml-2 dark:bg-green-900/30">
                                                            <Building2 className="h-3 w-3" style={{ color: primaryColor }} />
                                                        </div>
                                                        <span className="truncate font-medium text-gray-900 dark:text-gray-100">
                                                            {translate('Organization')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td
                                                    className="truncate py-2 text-gray-600 ltr:pr-2 rtl:pl-2 dark:text-gray-300"
                                                    title="organization@kakbima.dev"
                                                >
                                                    organization@kakbima.dev
                                                </td>
                                                <td className="truncate py-2 font-mono text-sm text-gray-600 dark:text-gray-300">password</td>
                                                <td className="py-2 ltr:pr-3 ltr:text-right rtl:pl-3 rtl:text-left">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopyCredentials('organization@kakbima.dev')}
                                                        className="inline-flex cursor-pointer items-center justify-center rounded p-1.5 transition-colors hover:opacity-80"
                                                        style={{ backgroundColor: `${primaryColor}15` }}
                                                    >
                                                        <Copy className="h-3.5 w-3.5" style={{ color: primaryColor }} />
                                                    </button>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="py-2 ltr:pl-3 rtl:pr-3">
                                                    <div className="flex items-center">
                                                        <div className="hidden h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 sm:flex ltr:mr-2 rtl:ml-2 dark:bg-blue-900/30">
                                                            <User className="h-3 w-3" style={{ color: primaryColor }} />
                                                        </div>
                                                        <span className="truncate font-medium text-gray-900 dark:text-gray-100">
                                                            {translate('User')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td
                                                    className="truncate py-2 text-gray-600 ltr:pr-2 rtl:pl-2 dark:text-gray-300"
                                                    title="sarahjohnson@kakbima.dev"
                                                >
                                                    sarahjohnson@kakbima.dev
                                                </td>
                                                <td className="truncate py-2 font-mono text-sm text-gray-600 dark:text-gray-300">password</td>
                                                <td className="py-2 ltr:pr-3 ltr:text-right rtl:pl-3 rtl:text-left">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopyCredentials('sarahjohnson@kakbima.dev')}
                                                        className="inline-flex cursor-pointer items-center justify-center rounded p-1.5 transition-colors hover:opacity-80"
                                                        style={{ backgroundColor: `${primaryColor}15` }}
                                                    >
                                                        <Copy className="h-3.5 w-3.5" style={{ color: primaryColor }} />
                                                    </button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </form>
        </AuthLayout>
    );
}
