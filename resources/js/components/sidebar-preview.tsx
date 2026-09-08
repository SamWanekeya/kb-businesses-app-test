import { FileText, Home, Settings, ShoppingCart, Sidebar as SidebarIcon, Users } from 'lucide-react';
import { route } from '@/utils/Routes';
import { useTranslation } from 'react-i18next';

interface SidebarPreviewProps {
    variant: string;
    style: string;
    themeColor: string;
    customColor: string;
}

export function SidebarPreview({ variant, style, themeColor, customColor }: SidebarPreviewProps) {
    const { t: translate } = useTranslation();
    // Get the color based on theme color - use CSS variable for primary color
    const getColor = () => {
        // Use the CSS variable for primary color to ensure it matches the theme
        if (typeof window !== 'undefined') {
            const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
            if (primaryColor) return primaryColor;
        }

        // Fallback colors if CSS variable isn't available
        switch (themeColor) {
            case 'blue':
                return '#A12582';
            case 'green':
                return '#10b77f';
            case 'purple':
                return '#8b5cf6';
            case 'orange':
                return '#f97316';
            case 'red':
                return '#ef4444';
            case 'custom':
                return customColor;
            default:
                return '#A12582';
        }
    };

    // Get background style based on style type
    const getBackgroundStyle = () => {
        switch (style) {
            case 'colored':
                return { backgroundColor: 'var(--primary)' };
            case 'gradient':
                return {
                    background: 'linear-gradient(to bottom, var(--primary), color-mix(in srgb, var(--primary), transparent 20%))',
                };
            default:
                return {};
        }
    };

    const isColoredStyle = style === 'colored' || style === 'gradient';

    // Get variant class
    const getVariantClass = () => {
        switch (variant) {
            case 'inset':
                return 'border';
            case 'floating':
                return 'shadow-md';
            case 'minimal':
                return 'border-r';
            default:
                return 'border';
        }
    };

    return (
        <div className={`overflow-hidden rounded-md p-3 ${getVariantClass()}`} style={getBackgroundStyle()}>
            <div className="mb-4 flex items-center gap-2">
                <SidebarIcon className={`h-4 w-4 ${isColoredStyle ? 'text-white' : 'text-primary'}`} />
                <span className={`font-medium ${isColoredStyle ? 'text-white' : 'text-foreground'}`}>{translate('Sidebar')}</span>
            </div>

            <div className="space-y-1">
                <div className={`flex items-center gap-2 rounded px-2 py-1.5 ${isColoredStyle ? 'bg-white/20' : 'bg-primary/10'}`}>
                    <Home className={`h-4 w-4 ${isColoredStyle ? 'text-white' : 'text-primary'}`} />
                    <span className={`text-sm ${isColoredStyle ? 'text-white' : 'text-foreground'}`}>{translate('Dashboard')}</span>
                </div>

                <div className="flex items-center gap-2 rounded px-2 py-1.5">
                    <Users className={`h-4 w-4 ${isColoredStyle ? 'text-white' : 'text-primary'}`} />
                    <span className={`text-sm ${isColoredStyle ? 'text-white' : 'text-foreground'}`}>{translate('Users')}</span>
                </div>

                <div className="flex items-center gap-2 rounded px-2 py-1.5">
                    <FileText className={`h-4 w-4 ${isColoredStyle ? 'text-white' : 'text-primary'}`} />
                    <span className={`text-sm ${isColoredStyle ? 'text-white' : 'text-foreground'}`}>{translate('Reports')}</span>
                </div>

                <div className="flex items-center gap-2 rounded px-2 py-1.5">
                    <ShoppingCart className={`h-4 w-4 ${isColoredStyle ? 'text-white' : 'text-primary'}`} />
                    <span className={`text-sm ${isColoredStyle ? 'text-white' : 'text-foreground'}`}>{translate('Products')}</span>
                </div>

                <div className="flex items-center gap-2 rounded px-2 py-1.5">
                    <Settings className={`h-4 w-4 ${isColoredStyle ? 'text-white' : 'text-primary'}`} />
                    <span className={`text-sm ${isColoredStyle ? 'text-white' : 'text-foreground'}`}>{translate('Settings')}</span>
                </div>
            </div>
        </div>
    );
}
