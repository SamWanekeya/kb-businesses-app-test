import { useTranslation } from 'react-i18next';

const getBaseUrl = (): string => {
    return window.appSettings?.baseUrl || window.location.origin;
};

const getGlobalSettings = () => {
    return (window as any).page.props.globalSettings;
};

const getDisplayUrl = (path: string, pageProps?: any): string => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrl = getBaseUrl();
    // If path already contains screenshots, just prepend domain
    if (path.includes('screenshots')) {
        return path.startsWith('/') ? `${baseUrl}${path}` : `${baseUrl}/${path}`;
    }

    try {
        const dynamicPath = `${baseUrl}`;
        const globalSettings = (window as any).page.props.globalSettings;
        let imageUrlPrefix = globalSettings?.image_url || dynamicPath + '/storage/media';

        path = path.replace('storage/media', '');

        // Handle slash concatenation
        const prefixEndsWithSlash = imageUrlPrefix.endsWith('/');
        const pathStartsWithSlash = path.startsWith('/');

        if (prefixEndsWithSlash && pathStartsWithSlash) {
            return imageUrlPrefix + path.substring(1);
        } else if (!prefixEndsWithSlash && !pathStartsWithSlash) {
            return imageUrlPrefix + '/' + path;
        } else {
            return imageUrlPrefix + path;
        }
    } catch {
        const fallbackPrefix = `${window.location.origin}`;
        return path.startsWith('/') ? fallbackPrefix + path.substring(1) : fallbackPrefix + path;
    }
};

const formatRelativeTime = (dateString: string) => {
    const { t: translate } = useTranslation();
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return translate('Just now');
    if (diffInMinutes < 60)
        return translate('{{count}} {{unit}} ago', {
            count: diffInMinutes,
            unit: diffInMinutes === 1 ? translate('minute') : translate('minutes'),
        });

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24)
        return translate('{{count}} {{unit}} ago', {
            count: diffInHours,
            unit: diffInHours === 1 ? translate('hour') : translate('hours'),
        });

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7)
        return translate('{{count}} {{unit}} ago', {
            count: diffInDays,
            unit: diffInDays === 1 ? translate('day') : translate('days'),
        });

    return window?.appSettings?.formatDateTime(date, false);
};

const capitalize = (str: string) => {
    if (!str) return '';

    return str
        .toLowerCase() // Convert everything to lowercase first
        .replace(/_/g, ' ') // Replace underscores with spaces
        .split(' ') // Split into words
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter of each word
        .join(' '); // Join back with spaces
};

export { capitalize, formatRelativeTime, getDisplayUrl };
