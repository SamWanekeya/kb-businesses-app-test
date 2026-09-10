import AccountButton from '@components/Account/AccountButton';
import { toast } from '@components/CustomToast';
import TextLink from '@components/TextLink';
import { useForm, usePage } from '@inertiajs/react';
import AuthLayout from '@layouts/AuthLayout';
import { route } from '@utils/Routes';
import { FormEvent, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * VerifyEmail component allows a user to resend the email verification link
 * and provides an option to sign out.
 *
 * @returns JSX.Element
 */
export default function VerifyEmail() {
    const { t: translate } = useTranslation();
    const { auth } = usePage().props;

    const { post, processing } = useForm();

    /**
     * Handle the submission of the resend verification email form.
     *
     * @param {FormEvent<HTMLFormElement>} e - Form submit event
     */
    const handleSubmit = useCallback(
        (e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const toastId = toast.loading(translate('Sending...'));

            post(route('verification.send'), {
                onSuccess: () => {
                    toast.dismiss(toastId);
                },
                onError: (errors) => {
                    toast.dismiss(toastId);
                    Object.values(errors).forEach((message) => toast.error(translate(message)));
                },
            });
        },
        [post, translate],
    );

    return (
        <AuthLayout title={translate('Verify your email')}>
            <form autoComplete="off" onSubmit={handleSubmit} className="space-y-5">
                <div className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
                    <p>
                        <b>{translate('Check your inbox!')}</b> {translate('We’ve sent a verification link to')} <i>{auth?.user?.email}</i>.{' '}
                        {translate('Please click the link to activate your account and get started.')}
                    </p>

                    <p className="mt-2">
                        <b>{translate('Didn’t get the email?')}</b> {translate('Check your spam folder or click the button below to try again.')}
                    </p>
                </div>
                <AccountButton processing={processing}>{translate('Resend verification email')}</AccountButton>

                <div className="text-center">
                    <TextLink href={route('logout')} method="post" className="font-medium transition-colors duration-200">
                        {translate('Sign out')}
                    </TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}
