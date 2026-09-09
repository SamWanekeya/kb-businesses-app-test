import { useForm } from '@inertiajs/react';
import { Mail } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import AccountButton from '@components/Account/AccountButton';
import InputError from '@components/input-error';
import Recaptcha from '@components/recaptcha';
import TextLink from '@components/text-link';
import { Input } from '@components/UserInterface/input';
import { Label } from '@components/UserInterface/label';
import { useBrand } from '@contexts/BrandContext';
import { THEME_COLORS } from '@hooks/use-appearance';
import AuthLayout from '@layouts/auth-layout';
import { route } from '@utils/Routes';
import { useTranslation } from 'react-i18next';

export default function ForgotPassword({ status, error }: { status?: string; error?: string }) {
    const { t: translate } = useTranslation();
    const [recaptchaToken, setRecaptchaToken] = useState<string>('');
    const { themeColor, customColor } = useBrand();
    const primaryColor = themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS];
    const { data, setData, post, processing, errors } = useForm<{ email: string; recaptcha_token?: string }>({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.email'), {
            data: { ...data, recaptcha_token: recaptchaToken },
        });
    };

    return (
        <AuthLayout
            title={translate('Forgot your password?')}
            description={translate('Enter your email to receive a password reset link')}
            icon={<Mail className="h-7 w-7" style={{ color: primaryColor }} />}
            status={error || status}
            statusType={error ? 'error' : 'success'}
        >
            <form className="space-y-5" onSubmit={submit}>
                <div className="space-y-4">
                    <div className="relative">
                        <Label htmlFor="email" className="mb-2 block font-medium text-gray-700 dark:text-gray-300" required>
                            {translate('Email address')}
                        </Label>
                        <div className="relative">
                            <Input
                                id="email"
                                type="email"
                                required
                                autoFocus
                                tabIndex={1}
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
                </div>

                <Recaptcha onVerify={setRecaptchaToken} onExpired={() => setRecaptchaToken('')} onError={() => setRecaptchaToken('')} />

                <AccountButton
                    tabIndex={2}
                    processing={processing}
                    className="w-full transform rounded-md py-2.5 text-sm font-medium tracking-wide text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                    style={{ backgroundColor: primaryColor }}
                >
                    {translate('Send Reset Link')}
                </AccountButton>

                <div className="text-center">
                    <p className="text-sm text-gray-500">
                        {translate('Remember your password?')}{' '}
                        <TextLink href={route('login')} className="font-medium hover:underline" style={{ color: primaryColor }} tabIndex={3}>
                            {translate('Back to sign in')}
                        </TextLink>
                    </p>
                </div>
            </form>
        </AuthLayout>
    );
}
