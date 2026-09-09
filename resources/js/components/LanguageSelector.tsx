import { Button } from '@components/UserInterface/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@components/UserInterface/DropdownMenu';
import languageJson from '@lang/language.json';
import { rtlLanguages } from '@utils/Constants';
import { Languages } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

type Language = {
    code: string;
    name: string;
    countryCode: string;
};

const languageData = languageJson as Language[];

export const LanguageSelector: React.FC = () => {
    const { i18n } = useTranslation();

    const currentLanguage = React.useMemo<Language>(
        () => languageData.find((lang) => lang.code === i18n.language) ?? languageData[0],
        [i18n.language],
    );

    const handleLanguageChange = React.useCallback(
        (code: string) => {
            if (code !== i18n.language) {
                void i18n.changeLanguage(code);
            }
        },
        [i18n],
    );

    React.useEffect(() => {
        const html = document.documentElement;

        if (html.lang !== currentLanguage.code) {
            html.lang = currentLanguage.code;
        }

        const newDir = rtlLanguages.includes(currentLanguage.code) ? 'rtl' : 'ltr';
        if (html.dir !== newDir) {
            html.dir = newDir;
        }
    }, [currentLanguage.code]);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="link">
                    <Languages className="h-4 w-4" />
                    <span className="hidden text-sm font-medium md:inline-block">{currentLanguage.name}</span>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="h-auto max-h-120 w-56 overflow-y-auto" align="end" forceMount>
                <DropdownMenuGroup>
                    {languageData.map((lang) => (
                        <DropdownMenuItem
                            key={lang.code}
                            onSelect={() => {
                                handleLanguageChange(lang.code);
                            }}
                            className="flex items-center gap-2"
                        >
                            <span>{lang.name}</span>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
