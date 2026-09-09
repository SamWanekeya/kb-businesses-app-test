import useTheme from '@hooks/useTheme';
import { rtlLanguages } from '@utils/Constants';
import { getCookie } from '@utils/Helpers/Cookies';
import { Toaster as Sonner, ToasterProps } from 'sonner';

/**
 * A wrapper around the `sonner` Toaster that automatically applies:
 * - The current UI theme from the `useTheme` hook.
 * - The correct text direction (`ltr` or `rtl`) based on the user's language cookie.
 *
 * @component
 * @param {ToasterProps} props - Props forwarded to the underlying `sonner` Toaster component.
 * @returns {JSX.Element} A themed and direction-aware Toaster instance.
 *
 * @example
 * ```tsx
 * <SonnerToaster position="top-right" richColors />
 * ```
 *
 * @remarks
 * - The language is read from the `__kb_lcl` cookie.
 * - If the language exists in `rtlLanguages`, the `dir` is set to `'rtl'`; otherwise `'ltr'`.
 * - The theme is resolved via `useTheme()` and cast to match `ToasterProps['theme']`.
 *
 * @see {@link ToasterProps} for all available props.
 */
const SonnerToaster = ({ ...props }: ToasterProps) => {
    const { resolved } = useTheme();
    const languageFromCookie = getCookie('__kb_lcl');
    const currentLanguageDirection = rtlLanguages.includes(languageFromCookie) ? 'rtl' : 'ltr';

    return <Sonner theme={resolved} className="toaster group" dir={currentLanguageDirection} {...props} />;
};

export { SonnerToaster };
