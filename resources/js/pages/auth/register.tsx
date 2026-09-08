import { useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

import AuthButton from '@/components/auth/auth-button';
import InputError from '@/components/input-error';
import Recaptcha from '@/components/recaptcha';
import TextLink from '@/components/text-link';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBrand } from '@/contexts/BrandContext';
import { THEME_COLORS } from '@/hooks/use-appearance';
import AuthLayout from '@/layouts/auth-layout';
import { getCookie } from '@/utils/Helpers/Cookies';
import { createKakbimaExternalUrl } from '@/utils/Helpers/Url';
import { route } from '@/utils/Routes';
import { useTranslation } from 'react-i18next';

type RegisterForm = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    terms: boolean;
    recaptcha_token?: string;
    plan_id?: string;
    referral_code?: string;
};

export default function Register({ referralCode, planId }: { referralCode?: string; planId?: string }) {
    const { t: translate } = useTranslation();
    const languageFromCookie = getCookie('__kb_lcl');
    const [recaptchaToken, setRecaptchaToken] = useState<string>('');
    const { themeColor, customColor } = useBrand();
    const primaryColor = themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS];
    const { data, setData, post, processing, errors, reset } = useForm<RegisterForm>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        terms: false,
        plan_id: planId,
        referral_code: referralCode,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), {
            data: { ...data, recaptcha_token: recaptchaToken },
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout title={translate('Create your account')} description={translate('Enter your details below to get started')}>
            <form className="space-y-5" onSubmit={submit}>
                <div className="space-y-4">
                    <div className="relative">
                        <Label htmlFor="name" className="mb-2 block font-medium text-gray-700 dark:text-gray-300" required>
                            {translate('Full name')}
                        </Label>
                        <div className="relative">
                            <Input
                                id="name"
                                type="text"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder={translate('Enter your full name')}
                                className="h-11 w-full rounded-lg border-gray-300 bg-white text-gray-900 transition-all duration-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                            />
                        </div>
                        <InputError message={errors.name} />
                    </div>

                    <div className="relative">
                        <Label htmlFor="email" className="mb-2 block font-medium text-gray-700 dark:text-gray-300" required>
                            {translate('Email address')}
                        </Label>
                        <div className="relative">
                            <Input
                                id="email"
                                type="email"
                                required
                                tabIndex={2}
                                autoComplete="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder={translate('Enter your email')}
                                className="h-11 w-full rounded-lg border-gray-300 bg-white text-gray-900 transition-all duration-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                            />
                        </div>
                        <InputError message={errors.email} />
                    </div>

                    <div>
                        <Label htmlFor="password" className="mb-2 block font-medium text-gray-700 dark:text-gray-300" required>
                            {translate('Password')}
                        </Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type="password"
                                required
                                tabIndex={3}
                                autoComplete="new-password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder={translate('Enter your password')}
                                className="h-11 w-full rounded-lg border-gray-300 bg-white text-gray-900 transition-all duration-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                            />
                        </div>
                        <InputError message={errors.password} />
                    </div>

                    <div>
                        <Label htmlFor="password_confirmation" className="mb-2 block font-medium text-gray-700 dark:text-gray-300" required>
                            {translate('Confirm password')}
                        </Label>
                        <div className="relative">
                            <Input
                                id="password_confirmation"
                                type="password"
                                required
                                tabIndex={4}
                                autoComplete="new-password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                placeholder={translate('Confirm your password')}
                                className="h-11 w-full rounded-lg border-gray-300 bg-white text-gray-900 transition-all duration-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                            />
                        </div>
                        <InputError message={errors.password_confirmation} />
                    </div>

                    <div className="!mt-4 !mb-5 flex items-center">
                        <Checkbox
                            id="terms"
                            checked={data.terms}
                            onClick={() => setData('terms', !data.terms)}
                            tabIndex={5}
                            className="h-[14px] w-[14px] rounded border border-gray-300 dark:border-gray-600"
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
                    <InputError message={errors.terms} />
                </div>

                <Recaptcha onVerify={setRecaptchaToken} onExpired={() => setRecaptchaToken('')} onError={() => setRecaptchaToken('')} />

                <AuthButton
                    tabIndex={6}
                    processing={processing}
                    className="w-full transform rounded-md py-2.5 text-sm font-medium tracking-wide text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                    style={{ backgroundColor: primaryColor }}
                >
                    {translate('Create Account')}
                </AuthButton>

                <div className="text-center">
                    <p className="text-sm text-gray-500">
                        {translate('Already have an account?')}{' '}
                        <TextLink href={route('login')} className="font-medium hover:underline" style={{ color: primaryColor }} tabIndex={7}>
                            {translate('Sign in')}
                        </TextLink>
                    </p>
                </div>
            </form>
        </AuthLayout>
    );
}
