import { useForm } from '@inertiajs/react';
import { Lock } from 'lucide-react';
import { FormEventHandler } from 'react';

import AuthButton from '@/components/auth/auth-button';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBrand } from '@/contexts/BrandContext';
import { THEME_COLORS } from '@/hooks/use-appearance';
import AuthLayout from '@/layouts/auth-layout';
import { route } from '@/utils/Routes';
import { useTranslation } from 'react-i18next';

interface ResetPasswordProps {
    token: string;
    email: string;
}

type ResetPasswordForm = {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
};

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    const { t: translate } = useTranslation();
    const { themeColor, customColor } = useBrand();
    const primaryColor = themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS];
    const { data, setData, post, processing, errors, reset } = useForm<Required<ResetPasswordForm>>({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout
            title={translate('Reset your password')}
            description={translate('Please enter your new password below')}
            icon={<Lock className="h-7 w-7" style={{ color: primaryColor }} />}
        >
            <form onSubmit={submit} className="space-y-5">
                <div className="space-y-4">
                    <div className="relative">
                        <Label htmlFor="email" className="mb-2 block font-medium text-gray-700 dark:text-gray-300" required>
                            {translate('Email')}
                        </Label>
                        <div className="relative">
                            <Input
                                id="email"
                                type="email"
                                readOnly
                                value={data.email}
                                className="h-11 w-full rounded-lg border-gray-300 bg-white text-gray-900 transition-all duration-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                            />
                        </div>
                        <InputError message={errors.email} />
                    </div>

                    <div className="relative">
                        <Label htmlFor="password" className="mb-2 block font-medium text-gray-700 dark:text-gray-300" required>
                            {translate('Password')}
                        </Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type="password"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="new-password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="••••••••"
                                className="h-11 w-full rounded-lg border-gray-300 bg-white text-gray-900 transition-all duration-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                            />
                        </div>
                        <InputError message={errors.password} />
                    </div>

                    <div className="relative">
                        <Label htmlFor="password_confirmation" className="mb-2 block font-medium text-gray-700 dark:text-gray-300" required>
                            {translate('Confirm password')}
                        </Label>
                        <div className="relative">
                            <Input
                                id="password_confirmation"
                                type="password"
                                required
                                tabIndex={2}
                                autoComplete="new-password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                placeholder="••••••••"
                                className="h-11 w-full rounded-lg border-gray-300 bg-white text-gray-900 transition-all duration-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                            />
                        </div>
                        <InputError message={errors.password_confirmation} />
                    </div>
                </div>

                <AuthButton
                    tabIndex={3}
                    processing={processing}
                    className="w-full transform rounded-md py-2.5 text-sm font-medium tracking-wide text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                    style={{ backgroundColor: primaryColor }}
                >
                    {translate('Reset Password')}
                </AuthButton>
            </form>
        </AuthLayout>
    );
}
