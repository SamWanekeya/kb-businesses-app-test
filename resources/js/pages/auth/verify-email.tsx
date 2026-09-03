import { useForm } from '@inertiajs/react';
import { Mail } from 'lucide-react';
import { FormEventHandler } from 'react';

import AuthButton from '@/components/auth/auth-button';
import { toast } from '@/components/custom-toast';
import TextLink from '@/components/text-link';
import { useBrand } from '@/contexts/BrandContext';
import { THEME_COLORS } from '@/hooks/use-appearance';
import AuthLayout from '@/layouts/auth-layout';
import { useTranslation } from 'react-i18next';

export default function VerifyEmail({ status }: { status?: string }) {
    const { t } = useTranslation();
    const { themeColor, customColor } = useBrand();
    const primaryColor = themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS];
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('verification.send'), {
            onSuccess: () => {
                toast.success(t('A new verification link has been sent to your email address.'));
            },
            onError: () => {
                toast.error(t('Failed to send verification email. Please try again.'));
            },
        });
    };

    return (
        <AuthLayout
            title={t('Verify your email')}
            description={t('Please verify your email address by clicking on the link we just emailed to you.')}
            icon={<Mail className="h-7 w-7" style={{ color: primaryColor }} />}
            status={
                status === 'verification-link-sent'
                    ? t('A new verification link has been sent to the email address you provided during registration.')
                    : undefined
            }
        >
            <form onSubmit={submit} className="space-y-5">
                <AuthButton
                    processing={processing}
                    className="w-full transform rounded-md py-2.5 text-sm font-medium tracking-wide text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                    style={{ backgroundColor: primaryColor }}
                >
                    {t('RESEND EMAIL').toUpperCase()}
                </AuthButton>

                <div className="mt-5 text-center">
                    <p className="text-xs text-gray-500">
                        <TextLink href={route('logout')} method="post" className="font-medium hover:underline" style={{ color: primaryColor }}>
                            {t('Log out')}
                        </TextLink>
                    </p>
                </div>
            </form>
        </AuthLayout>
    );
}
