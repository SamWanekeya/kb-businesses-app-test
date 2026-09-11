import { type NavItem } from '@/types';
import InputError from '@components/InputError';
import PageTemplate from '@components/PageTemplate';
import { Button } from '@components/UserInterface/Button';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import { cn } from '@lib/utils';
import { useEffect, useRef, useState } from 'react';

import { Camera, Lock, User } from 'lucide-react';

// Profile components
import { Avatar, AvatarFallback, AvatarImage } from '@components/UserInterface/Avatar';
import { router, usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { useTranslation } from 'react-i18next';

import { toast } from '@components/CustomToast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/UserInterface/Card';
import useInitials from '@hooks/useInitials';
import defaultUserIcon from '@images/defaults/default_user_icon.png';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Personal information',
        href: '#profile',
        icon: <User className="mr-2 h-4 w-4" />,
    },
    {
        title: 'Password',
        href: '#password',
        icon: <Lock className="mr-2 h-4 w-4" />,
    },
];

export default function ProfileSettings({ mustVerifyEmail, status }: { mustVerifyEmail?: boolean; status?: string }) {
    const { t: translate } = useTranslation();
    const { auth } = usePage().props;
    const getInitials = useInitials();

    const [activeSection, setActiveSection] = useState('my-kakbima-account');

    // Refs for each section
    const profileRef = useRef<HTMLDivElement>(null);
    const passwordRef = useRef<HTMLDivElement>(null);

    // Password form refs
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    // Profile form state
    const [profileData, setProfileData] = useState({
        name: auth?.user?.name || '',
        email: auth?.user?.email || '',
        avatar: null as File | null,
    });
    const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
    const [profileProcessing, setProfileProcessing] = useState(false);

    // Password form state
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
    const [passwordProcessing, setPasswordProcessing] = useState(false);

    // Handle profile form submission
    const submitProfile = (e: React.FormEvent) => {
        e.preventDefault();

        const toastId = toast.loading(translate('Updating profile information...'));

        setProfileProcessing(true);

        const formData = new FormData();
        formData.append('name', profileData.name);
        formData.append('email', profileData.email);
        formData.append('_method', 'PATCH');
        if (profileData.avatar) formData.append('avatar', profileData.avatar);

        router.post(route('my-kakbima-account.update'), formData, {
            preserveScroll: true,
            forceFormData: true,

            onSuccess: () => {
                setProfileData((prev) => ({ ...prev, avatar: null }));
                setProfileErrors({});
                toast.dismiss(toastId);
            },
            onError: (errors) => {
                setProfileErrors(errors);
                toast.dismiss(toastId);
                Object.values(errors).forEach((message) => toast.error(translate(message)));
            },
        });
    };

    // Handle avatar file selection
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setProfileData((prev) => ({ ...prev, avatar: file }));
    };

    // Get avatar URL
    const getAvatarUrl = () => {
        if (profileData.avatar) return URL.createObjectURL(profileData.avatar);
        if (auth?.user?.avatar) return auth.user.avatar;
        return defaultUserIcon;
    };

    // Handle password form submission
    const updatePassword = (e: React.FormEvent) => {
        e.preventDefault();

        const toastId = toast.loading(translate('Updating password information...'));

        setPasswordProcessing(true);

        router.put(route('my-kakbima-account.password.update'), passwordData, {
            preserveScroll: true,

            onSuccess: () => {
                setPasswordData({ current_password: '', password: '', password_confirmation: '' });
                setPasswordErrors({});
                toast.dismiss(toastId);
            },
            onError: (errors) => {
                setPasswordErrors(errors);
                toast.dismiss(toastId);
                Object.values(errors).forEach((message) => toast.error(translate(message)));
            },
        });
    };

    // Smart scroll functionality
    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 100; // Add offset for better UX

            // Get positions of each section
            const passwordPosition = passwordRef.current?.offsetTop || 0;

            // Determine active section based on scroll position
            if (scrollPosition >= passwordPosition) {
                setActiveSection('password');
            } else {
                setActiveSection('my-kakbima-account');
            }
        };

        // Add scroll event listener
        window.addEventListener('scroll', handleScroll);

        // Initial check for hash in URL
        const hash = window.location.hash?.replace('#', '');
        if (hash) {
            const element = document.getElementById(hash);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
                setActiveSection(hash);
            }
        }

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Handle navigation click
    const handleNavClick = (href: string) => {
        const id = href?.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setActiveSection(id);
        }
    };

    return (
        <PageTemplate
            title={translate('My Kakbima account')}
            description={translate('Stores and manages your profile information, account credentials, and profile settings.')}
            url="/my-kakbima-account"
        >
            <div className="flex flex-col gap-8 md:flex-row">
                {/* Sidebar */}
                <div className="flex-shrink-0 md:w-64">
                    <div className="sticky top-20">
                        <div className="space-y-1">
                            {sidebarNavItems.map((item) => (
                                <Button
                                    key={item.href}
                                    variant="ghost"
                                    className={cn('w-full justify-start text-sm', {
                                        'bg-muted font-semibold': activeSection === item.href?.replace('#', ''),
                                    })}
                                    onClick={() => {
                                        handleNavClick(item.href);
                                    }}
                                >
                                    {item.icon}
                                    {translate(item.title)}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                    {/* Profile Section */}
                    <section id="profile" ref={profileRef} className="mb-16">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold">{translate('Personal information')}</CardTitle>
                                <CardDescription>{translate('Change your Kakbima account picture, name & work email.')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form id="profile-form" autoComplete="off" onSubmit={submitProfile} className="space-y-6">
                                    {/* Avatar Upload Section */}
                                    <div className="flex items-center space-x-6">
                                        <Avatar className="h-20 w-20">
                                            <AvatarImage src={getAvatarUrl()} alt={auth?.user?.name} />
                                            <AvatarFallback className="text-lg">{getInitials(auth?.user?.name || '')}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col space-y-2">
                                            <Label
                                                htmlFor="avatar"
                                                className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex cursor-pointer items-center rounded-md border px-4 py-2 text-sm font-medium transition-colors"
                                            >
                                                <Camera className="mr-2 h-4 w-4" />
                                                {translate('Change profile picture')}
                                            </Label>
                                            <Input id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                                        </div>
                                    </div>
                                    <InputError className="mt-2" message={profileErrors.avatar} />

                                    <div className="grid gap-2">
                                        <Label htmlFor="name">{translate('Name')}</Label>
                                        <Input
                                            id="name"
                                            className="mt-1 block w-full"
                                            value={profileData.name}
                                            onChange={(e) => {
                                                setProfileData((prev) => ({
                                                    ...prev,
                                                    name: e.target.value,
                                                }));
                                            }}
                                            required
                                            autoComplete="name"
                                        />
                                        <InputError className="mt-2" message={profileErrors.name} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="email">{translate('Work email')}</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            className="mt-1 block w-full"
                                            value={profileData.email}
                                            onChange={(e) => {
                                                setProfileData((prev) => ({
                                                    ...prev,
                                                    email: e.target.value,
                                                }));
                                            }}
                                            required
                                            autoComplete="username"
                                        />
                                        <InputError className="mt-2" message={profileErrors.email} />
                                    </div>

                                    {mustVerifyEmail && auth?.user?.email_verified_at === null && (
                                        <div>
                                            <p className="text-muted-foreground -mt-4 text-sm">
                                                {translate('Your email address is unverified.')}{' '}
                                                <button
                                                    type="button"
                                                    onClick={() => route('verification.send')}
                                                    className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current dark:decoration-neutral-500"
                                                >
                                                    {translate('Click here to resend the verification email.')}
                                                </button>
                                            </p>

                                            {status === 'verification-link-sent' && (
                                                <div className="mt-2 text-sm font-medium text-green-600">
                                                    {translate('A new verification link has been sent to your email address.')}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4">
                                        <Button size="lg" disabled={profileProcessing}>
                                            {translate('Save')}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Password Section */}
                    <section id="password" ref={passwordRef} className="mb-16">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold">{translate('Password')}</CardTitle>
                                <CardDescription>
                                    {translate(
                                        'Choose a strong password and don’t reuse it for other accounts. You will be signed out of your account on all your devices.',
                                    )}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form id="password-form" autoComplete="off" onSubmit={updatePassword} className="space-y-6">
                                    <div className="grid gap-2">
                                        <Label htmlFor="current_password">{translate('Current password')}</Label>
                                        <Input
                                            id="current_password"
                                            ref={currentPasswordInput}
                                            value={passwordData.current_password}
                                            onChange={(e) => {
                                                setPasswordData((prev) => ({
                                                    ...prev,
                                                    current_password: e.target.value,
                                                }));
                                            }}
                                            type="password"
                                            className="mt-1 block w-full"
                                            autoComplete="current-password"
                                        />
                                        <InputError message={passwordErrors.current_password} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="password">{translate('New password')}</Label>
                                        <Input
                                            id="password"
                                            ref={passwordInput}
                                            value={passwordData.password}
                                            onChange={(e) => {
                                                setPasswordData((prev) => ({
                                                    ...prev,
                                                    password: e.target.value,
                                                }));
                                            }}
                                            type="password"
                                            className="mt-1 block w-full"
                                            autoComplete="new-password"
                                        />
                                        <InputError message={passwordErrors.password} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="password_confirmation">{translate('Confirm new password')}</Label>
                                        <Input
                                            id="password_confirmation"
                                            value={passwordData.password_confirmation}
                                            onChange={(e) => {
                                                setPasswordData((prev) => ({
                                                    ...prev,
                                                    password_confirmation: e.target.value,
                                                }));
                                            }}
                                            type="password"
                                            className="mt-1 block w-full"
                                            autoComplete="new-password"
                                        />
                                        <InputError message={passwordErrors.password_confirmation} />
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <Button size="lg" disabled={passwordProcessing}>
                                            {translate('Change password')}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </section>
                </div>
            </div>
        </PageTemplate>
    );
}
