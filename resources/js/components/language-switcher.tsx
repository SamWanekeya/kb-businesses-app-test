import { CreateLanguageModal } from '@/components/create-language-modal';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLayout } from '@/contexts/LayoutContext';
import { storeCookie } from '@/utils/Helpers/Cookies';
import { router, usePage } from '@inertiajs/react';
import { Globe, Plus, Settings } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import ReactCountryFlag from 'react-country-flag';
import { useTranslation } from 'react-i18next';

interface Language {
    code: string;
    name: string;
    countryCode: string;
    enabled?: boolean;
}

export const LanguageSwitcher: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { auth, globalSettings } = usePage().props;
    const { updatePosition } = useLayout();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [currentLanguage, setCurrentLanguage] = useState<Language | null>(null);

    const availableLanguages = globalSettings?.availableLanguages || [];

    useEffect(() => {
        const languages = (availableLanguages || []).filter((l: any) => l.enabled !== false);
        const lang = languages.find((l: Language) => l.code === i18n.language) || languages[0];
        setCurrentLanguage(lang);
    }, [i18n.language, availableLanguages]);

    const isAuthenticated = auth?.user;
    const userRoles = auth?.roles || [];
    const isSuperAdmin = auth?.user?.type === 'super_admin';

    // RTL languages list
    const rtlLanguages = ['ar', 'he'];

    const handleLanguageChange = async (languageCode: string) => {
        const lang = availableLanguages.find((l: Language) => l.code === languageCode);
        if (lang) {
            setCurrentLanguage(lang);
            try {
                await i18n.changeLanguage(languageCode);

                const isRtl = rtlLanguages.includes(languageCode);
                const newDirection = isRtl ? 'right' : 'left';

                document.documentElement.dir = 'ltr';
                document.documentElement.setAttribute('dir', 'ltr');
                updatePosition(newDirection as 'left' | 'right');

                // Save layoutDirection to database/cookies when RTL language is selected
                if (isAuthenticated) {
                    // Save language change for authenticated non-demo users
                    router.post(
                        route('languages.change'),
                        {
                            language: languageCode,
                        },
                        {
                            preserveScroll: true,
                            onSuccess: () => {},
                            onError: (errors) => {},
                        },
                    );
                } else {
                    // For demo mode or non-authenticated users, save to cookies
                    storeCookie('app_language', languageCode);
                    storeCookie('layoutDirection', newDirection);
                }

                window.dispatchEvent(
                    new CustomEventranslate('languageChanged', {
                        detail: { language: languageCode, direction: newDirection },
                    }),
                );

                window.dispatchEvent(new Eventranslate('resize'));
            } catch (error) {}
        }
    };

    const isRtl = typeof document !== 'undefined' ? document.documentElement.dir === 'rtl' : false;

    return (
        <DropdownMenu dir={isRtl ? 'rtl' : 'ltr'}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 rounded-md border bg-white px-2 shadow-sm md:px-3" dir="ltr">
                    <Globe className="hidden h-4 w-4 md:block" />
                    {currentLanguage && (
                        <>
                            <span className="hidden text-sm font-medium md:inline-block">{currentLanguage.name}</span>
                            <ReactCountryFlag
                                countryCode={currentLanguage.countryCode}
                                svg
                                style={{
                                    width: '1.2em',
                                    height: '1.2em',
                                }}
                            />
                        </>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuGroup>
                    <div className="max-h-48 overflow-y-auto">
                        {(availableLanguages || [])
                            .filter((language: any) => language.enabled !== false)
                            .map((language: Language) => (
                                <DropdownMenuItem
                                    key={language.code}
                                    onClick={() => handleLanguageChange(language.code)}
                                    className={`flex items-center gap-2 ${currentLanguage?.code === language.code ? 'bg-accent' : ''}`}
                                    dir="ltr"
                                >
                                    <ReactCountryFlag
                                        countryCode={language.countryCode}
                                        svg
                                        style={{
                                            width: '1.2em',
                                            height: '1.2em',
                                        }}
                                    />
                                    <span>{language.name}</span>
                                </DropdownMenuItem>
                            ))}
                    </div>
                </DropdownMenuGroup>
                {isSuperAdmin && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => setShowCreateModal(true)}
                            className="text-primary cursor-pointer justify-start font-semibold"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            {translate('Create Language')}
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="text-primary cursor-pointer justify-start font-semibold">
                            <a href={route('manage-language')} rel="noopener noreferrer">
                                <Settings className="mr-2 h-4 w-4" />
                                {translate('Manage Language')}
                            </a>
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
            <CreateLanguageModal open={showCreateModal} onOpenChange={setShowCreateModal} onSuccess={() => setShowCreateModal(false)} />
        </DropdownMenu>
    );
};
