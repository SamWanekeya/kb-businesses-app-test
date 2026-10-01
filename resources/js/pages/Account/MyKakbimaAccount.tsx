import { router, usePage } from '@inertiajs/react';
import { Camera, Lock, User } from 'lucide-react';
import type { ChangeEvent, SubmitEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { toast } from '@components/CustomToast';
import PageTemplate from '@components/PageTemplate';
import { Avatar, AvatarFallback, AvatarImage } from '@components/UserInterface/Avatar';
import { Button } from '@components/UserInterface/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/UserInterface/Card';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import useInitials from '@hooks/useInitials';
import defaultUserIcon from '@images/defaults/default_user_icon.png';
import { cn } from '@lib/utils';
import { route } from '@utils/Routes';

interface MyKakbimaAccountProps {
    /** Whether email verification is required for the current account. */
    mustVerifyEmail?: boolean;

    /** Account verification status returned by the server. */
    status?: string;
}

interface ProfileData {
    name: string;
    email: string;
    avatar: File | null;
}

interface PasswordData {
    current_password: string;
    password: string;
    password_confirmation: string;
}

type FormErrors = Record<string, string>;

const sidebarNavItems = [
    {
        title: 'Personal information',
        href: '#profile',
        icon: User,
    },
    {
        title: 'Password',
        href: '#password',
        icon: Lock,
    },
] as const;

/**
 * MyKakbimaAccount
 *
 * Provides account management functionality for personal information,
 * profile imagery, email verification, and password changes.
 *
 * Responsibilities:
 * - Update the user's personal information.
 * - Handle profile image selection and preview.
 * - Display email verification state and resend verification emails.
 * - Allow the user to change their password.
 * - Provide navigation between account sections.
 *
 * Accessibility:
 * - Uses semantic forms, sections, labels, and buttons.
 * - Associates field-level validation messages with their inputs.
 * - Exposes invalid state through `aria-invalid`.
 * - Exposes validation messages through `aria-describedby`.
 * - Indicates the active account section through `aria-current`.
 * - Respects the user's reduced-motion preference.
 *
 * Performance:
 * - Uses IntersectionObserver rather than a scroll event listener.
 * - Memoizes handlers passed to child components.
 * - Creates avatar object URLs only when a local file is selected.
 * - Revokes temporary avatar object URLs during cleanup.
 */
export default function MyKakbimaAccount({ mustVerifyEmail = false, status }: MyKakbimaAccountProps) {
    const { t: translate } = useTranslation();
    const { auth } = usePage().props;
    const getInitials = useInitials();

    const [activeSection, setActiveSection] = useState('profile');

    const profileRef = useRef<HTMLElement>(null);
    const passwordRef = useRef<HTMLElement>(null);

    const [profileData, setProfileData] = useState<ProfileData>({
        name: auth?.user?.name ?? '',
        email: auth?.user?.email ?? '',
        avatar: null,
    });
    const [profileErrors, setProfileErrors] = useState<FormErrors>({});
    const [profileProcessing, setProfileProcessing] = useState(false);
    const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);

    const [passwordData, setPasswordData] = useState<PasswordData>({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const [passwordErrors, setPasswordErrors] = useState<FormErrors>({});
    const [passwordProcessing, setPasswordProcessing] = useState(false);

    /**
     * Creates a temporary browser URL for locally selected avatar files.
     * The URL is revoked automatically when the file changes or the component
     * unmounts.
     */
    useEffect(() => {
        if (!profileData.avatar) {
            setAvatarPreviewUrl(null);
            return;
        }

        const objectUrl = URL.createObjectURL(profileData.avatar);

        setAvatarPreviewUrl(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [profileData.avatar]);

    const avatarUrl = avatarPreviewUrl ?? auth?.user?.avatar ?? defaultUserIcon;

    /**
     * Updates a profile text field.
     */
    const handleProfileFieldChange = useCallback((field: 'name' | 'email', value: string) => {
        setProfileData((current) => ({
            ...current,
            [field]: value,
        }));
    }, []);

    /**
     * Updates a profile field's validation state.
     *
     * Server-side validation errors and client-side validation errors share
     * the same state so the latest validation result always represents the
     * current field value.
     */
    const handleProfileValidate = useCallback((field: 'name' | 'email', valid: boolean, message: string | null) => {
        setProfileErrors((current) => {
            const next = { ...current };

            if (valid || message === null) {
                delete next[field];
            } else {
                next[field] = message;
            }

            return next;
        });
    }, []);

    /**
     * Handles profile image selection.
     */
    const handleAvatarChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;

        setProfileData((current) => ({
            ...current,
            avatar: file,
        }));

        setProfileErrors((current) => {
            if (!current.avatar) {
                return current;
            }

            const next = { ...current };
            delete next.avatar;

            return next;
        });
    }, []);

    /**
     * Submits the personal information form.
     */
    const submitProfile = useCallback(
        (event: SubmitEvent<HTMLFormElement>) => {
            event.preventDefault();

            const toastId = toast.loading(translate('Updating profile information...'));

            setProfileProcessing(true);

            const formData = new FormData();

            formData.append('name', profileData.name);
            formData.append('email', profileData.email);
            formData.append('_method', 'PATCH');

            if (profileData.avatar) {
                formData.append('avatar', profileData.avatar);
            }

            router.post(route('my-kakbima-account.update'), formData, {
                preserveScroll: true,
                forceFormData: true,

                onSuccess: () => {
                    setProfileData((current) => ({
                        ...current,
                        avatar: null,
                    }));
                    setProfileErrors({});
                    toast.dismiss(toastId);
                },

                onError: (errors) => {
                    setProfileErrors(errors);
                    toast.dismiss(toastId);

                    Object.values(errors).forEach((message) => {
                        toast.error(translate(message));
                    });
                },

                onFinish: () => {
                    setProfileProcessing(false);
                },
            });
        },
        [profileData, translate],
    );

    /**
     * Updates a password form field.
     */
    const handlePasswordFieldChange = useCallback((field: keyof PasswordData, value: string) => {
        setPasswordData((current) => ({
            ...current,
            [field]: value,
        }));
    }, []);

    /**
     * Updates validation state for a new-password field.
     */
    const handlePasswordValidate = useCallback((field: 'password' | 'password_confirmation', valid: boolean, message: string | null) => {
        setPasswordErrors((current) => {
            const next = { ...current };

            if (valid || message === null) {
                delete next[field];
            } else {
                next[field] = message;
            }

            return next;
        });
    }, []);

    /**
     * Submits the password change form.
     */
    const updatePassword = useCallback(
        (event: SubmitEvent<HTMLFormElement>) => {
            event.preventDefault();

            const toastId = toast.loading(translate('Updating password information...'));

            setPasswordProcessing(true);

            router.put(route('my-kakbima-account.password.update'), passwordData, {
                preserveScroll: true,

                onSuccess: () => {
                    setPasswordData({
                        current_password: '',
                        password: '',
                        password_confirmation: '',
                    });
                    setPasswordErrors({});
                    toast.dismiss(toastId);
                },

                onError: (errors) => {
                    setPasswordErrors(errors);
                    toast.dismiss(toastId);

                    Object.values(errors).forEach((message) => {
                        toast.error(translate(message));
                    });
                },

                onFinish: () => {
                    setPasswordProcessing(false);
                },
            });
        },
        [passwordData, translate],
    );

    /**
     * Resends the user's email verification message.
     */
    const handleResendVerification = useCallback(() => {
        router.post(
            route('authenticated.verification.send'),
            {},
            {
                preserveScroll: true,
            },
        );
    }, []);

    /**
     * Navigates to an account section.
     */
    const handleNavClick = useCallback((href: string) => {
        const id = href.replace('#', '');
        const element = document.getElementById(id);

        if (!element) {
            return;
        }

        setActiveSection(id);

        element.scrollIntoView({
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
            block: 'start',
        });

        window.history.replaceState(null, '', `#${id}`);
    }, []);

    /**
     * Tracks the account section currently visible in the viewport.
     */
    useEffect(() => {
        const sections = [profileRef.current, passwordRef.current].filter((section): section is HTMLElement => section !== null);

        if (sections.length === 0) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const visibleEntry = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];

                if (visibleEntry) {
                    setActiveSection(visibleEntry.target.id);
                }
            },
            {
                rootMargin: '-20% 0px -65% 0px',
                threshold: [0, 0.25, 0.5, 0.75, 1],
            },
        );

        sections.forEach((section) => observer.observe(section));

        return () => {
            observer.disconnect();
        };
    }, []);

    /**
     * Scrolls to the section represented by the current URL hash.
     */
    useEffect(() => {
        const hash = window.location.hash.replace('#', '');

        if (!hash) {
            return;
        }

        const element = document.getElementById(hash);

        if (!element) {
            return;
        }

        setActiveSection(hash);

        requestAnimationFrame(() => {
            element.scrollIntoView({
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
                block: 'start',
            });
        });
    }, []);

    return (
        <PageTemplate
            title={translate('My Kakbima account')}
            description={translate('Manage your personal information, account credentials, and profile settings.')}
            url="/my-kakbima-account"
        >
            <div className="flex flex-col gap-8 md:flex-row">
                <aside aria-label={translate('Account settings navigation')} className="flex-shrink-0 md:w-64">
                    <nav className="sticky top-20">
                        <div className="flex gap-1 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0">
                            {sidebarNavItems.map((item) => {
                                const id = item.href.replace('#', '');
                                const Icon = item.icon;
                                const isActive = activeSection === id;

                                return (
                                    <Button
                                        key={item.href}
                                        type="button"
                                        variant="ghost"
                                        aria-current={isActive ? 'page' : undefined}
                                        className={cn('shrink-0 justify-start text-sm md:w-full', isActive && 'bg-muted font-semibold')}
                                        onClick={() => handleNavClick(item.href)}
                                    >
                                        <Icon aria-hidden="true" className="mr-2 h-4 w-4" />
                                        {translate(item.title)}
                                    </Button>
                                );
                            })}
                        </div>
                    </nav>
                </aside>

                <main className="min-w-0 flex-1">
                    <section id="profile" ref={profileRef} aria-labelledby="profile-title" className="mb-16 scroll-mt-24">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle id="profile-title" className="text-lg font-semibold">
                                    {translate('Personal information')}
                                </CardTitle>

                                <CardDescription>{translate('Update your profile picture, name, and work email.')}</CardDescription>
                            </CardHeader>

                            <CardContent>
                                <form autoComplete="off" id="profile-form" onSubmit={submitProfile} noValidate className="space-y-6">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                                        <Avatar className="h-20 w-20">
                                            <AvatarImage
                                                src={avatarUrl}
                                                alt={
                                                    auth?.user?.name
                                                        ? translate('Profile picture for {{name}}', {
                                                              name: auth.user.name,
                                                          })
                                                        : translate('Profile picture')
                                                }
                                            />

                                            <AvatarFallback className="text-lg">{getInitials(auth?.user?.name ?? '')}</AvatarFallback>
                                        </Avatar>

                                        <div className="flex flex-col gap-2">
                                            <Label
                                                htmlFor="avatar"
                                                className="border-input bg-background hover:bg-accent hover:text-accent-foreground focus-within:ring-ring/50 inline-flex cursor-pointer items-center rounded-md border px-4 py-2 text-sm font-medium transition-colors focus-within:ring-2 focus-within:ring-offset-2"
                                            >
                                                <Camera aria-hidden="true" className="mr-2 h-4 w-4" />
                                                {translate('Change profile picture')}
                                            </Label>

                                            <Input
                                                id="avatar"
                                                inputType="file"
                                                accept="image/*"
                                                onChange={handleAvatarChange}
                                                className="hidden"
                                                aria-invalid={Boolean(profileErrors.avatar)}
                                                aria-describedby={profileErrors.avatar ? 'avatar-error' : undefined}
                                            />

                                            <p className="text-muted-foreground text-xs">
                                                {translate('Choose an image to use as your profile picture.')}
                                            </p>

                                            {profileErrors.avatar && (
                                                <p id="avatar-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
                                                    {profileErrors.avatar}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="name">{translate('Name')}</Label>

                                        <Input
                                            inputType="text"
                                            inputMode="text"
                                            inputIdentifier="name"
                                            value={profileData.name}
                                            onChange={(event) => handleProfileFieldChange('name', event.target.value)}
                                            onValidate={(valid, message) => handleProfileValidate('name', valid, message)}
                                            required
                                            autoComplete="name"
                                            aria-invalid={Boolean(profileErrors.name)}
                                            aria-describedby={profileErrors.name ? 'name-error' : undefined}
                                        />

                                        {profileErrors.name && (
                                            <p id="name-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
                                                {profileErrors.name}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="email">{translate('Work email')}</Label>

                                        <Input
                                            inputIdentifier="email"
                                            inputType="email"
                                            inputMode="email"
                                            value={profileData.email}
                                            onChange={(event) => handleProfileFieldChange('email', event.target.value)}
                                            onValidate={(valid, message) => handleProfileValidate('email', valid, message)}
                                            required
                                            autoComplete="email"
                                            aria-invalid={Boolean(profileErrors.email)}
                                            aria-describedby={profileErrors.email ? 'email-error' : undefined}
                                        />

                                        {profileErrors.email && (
                                            <p id="email-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
                                                {profileErrors.email}
                                            </p>
                                        )}
                                    </div>

                                    {mustVerifyEmail && auth?.user?.email_verified_at === null && (
                                        <div
                                            className="rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20"
                                            role="status"
                                        >
                                            <p className="text-sm text-amber-900 dark:text-amber-200">
                                                {translate('Your email address is unverified.')}{' '}
                                                <button
                                                    type="button"
                                                    onClick={handleResendVerification}
                                                    className="focus-visible:ring-ring font-medium underline decoration-amber-400 underline-offset-4 transition-colors hover:decoration-current focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none dark:decoration-amber-600"
                                                >
                                                    {translate('Resend the verification email.')}
                                                </button>
                                            </p>

                                            {status === 'verification-link-sent' && (
                                                <p className="mt-2 text-sm font-medium text-green-700 dark:text-green-400">
                                                    {translate('A new verification link has been sent to your email address.')}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4">
                                        <Button type="submit" size="lg" disabled={profileProcessing}>
                                            {translate('Save changes')}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </section>

                    <section id="password" ref={passwordRef} aria-labelledby="password-title" className="mb-16 scroll-mt-24">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle id="password-title" className="text-lg font-semibold">
                                    {translate('Password')}
                                </CardTitle>

                                <CardDescription>
                                    {translate(
                                        'Choose a strong password and don’t reuse it for other accounts. You will be signed out of your account on all your devices.',
                                    )}
                                </CardDescription>
                            </CardHeader>

                            <CardContent>
                                <form autoComplete="off" id="password-form" onSubmit={updatePassword} noValidate className="space-y-6">
                                    <div className="grid gap-2">
                                        <Label htmlFor="current_password">{translate('Current password')}</Label>

                                        <Input
                                            inputIdentifier="current_password"
                                            inputType="password"
                                            value={passwordData.current_password}
                                            onChange={(event) => handlePasswordFieldChange('current_password', event.target.value)}
                                            required
                                            autoComplete="current-password"
                                            aria-invalid={Boolean(passwordErrors.current_password)}
                                            aria-describedby={passwordErrors.current_password ? 'current-password-error' : undefined}
                                        />

                                        {passwordErrors.current_password && (
                                            <p id="current-password-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
                                                {passwordErrors.current_password}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="password">{translate('New password')}</Label>

                                        <Input
                                            inputIdentifier="password"
                                            inputType="password"
                                            value={passwordData.password}
                                            onChange={(event) => handlePasswordFieldChange('password', event.target.value)}
                                            onValidate={(valid, message) => handlePasswordValidate('password', valid, message)}
                                            required
                                            autoComplete="new-password"
                                            aria-invalid={Boolean(passwordErrors.password)}
                                            aria-describedby={passwordErrors.password ? 'password-error' : undefined}
                                        />

                                        {passwordErrors.password && (
                                            <p id="password-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
                                                {passwordErrors.password}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="password_confirmation">{translate('Confirm new password')}</Label>

                                        <Input
                                            inputIdentifier="password_confirmation"
                                            inputType="password"
                                            value={passwordData.password_confirmation}
                                            onChange={(event) => handlePasswordFieldChange('password_confirmation', event.target.value)}
                                            onValidate={(valid, message) => handlePasswordValidate('password_confirmation', valid, message)}
                                            required
                                            autoComplete="new-password"
                                            aria-invalid={Boolean(passwordErrors.password_confirmation)}
                                            aria-describedby={passwordErrors.password_confirmation ? 'password-confirmation-error' : undefined}
                                        />

                                        {passwordErrors.password_confirmation && (
                                            <p id="password-confirmation-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
                                                {passwordErrors.password_confirmation}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <Button type="submit" size="lg" disabled={passwordProcessing}>
                                            {translate('Change password')}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </section>
                </main>
            </div>
        </PageTemplate>
    );
}
