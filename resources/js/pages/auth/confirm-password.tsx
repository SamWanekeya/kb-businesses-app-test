import { useForm } from '@inertiajs/react';
import { Lock } from 'lucide-react';
import { FormEventHandler } from 'react';

import AccountButton from '@components/Account/AccountButton';
import InputError from '@components/InputError';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import { useBrand } from '@contexts/BrandContext';
import { THEME_COLORS } from '@hooks/use-appearance';
import AuthLayout from '@layouts/auth-layout';
import { route } from '@utils/Routes';
import { useTranslation } from 'react-i18next';

export default function ConfirmPassword() {
    const { t: translate } = useTranslation();
    const { themeColor, customColor } = useBrand();
    const primaryColor = themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS];
    const { data, setData, post, processing, errors, reset } = useForm<Required<{ password: string }>>({
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout
            title={translate('Confirm your password')}
            description={translate('This is a secure area of the application. Please confirm your password before continuing.')}
            icon={<Lock className="h-7 w-7" style={{ color: primaryColor }} />}
        >
            <form onSubmit={submit} className="space-y-5">
                <div className="space-y-4">
                    <div className="relative">
                        <Label htmlFor="password" className="mb-2 block font-medium text-gray-700 dark:text-gray-300">
                            {translate('Password')}
                        </Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type="password"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="current-password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="••••••••"
                                className="w-full rounded-lg border-gray-300 bg-white transition-all duration-200 dark:border-gray-600 dark:bg-gray-700"
                                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                            />
                        </div>
                        <InputError message={errors.password} />
                    </div>
                </div>

                <AccountButton
                    tabIndex={2}
                    processing={processing}
                    className="w-full transform rounded-md py-2.5 text-sm font-medium tracking-wide text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                    style={{ backgroundColor: primaryColor }}
                >
                    {translate('CONFIRM PASSWORD').toUpperCase()}
                </AccountButton>
            </form>
        </AuthLayout>
    );
}
