import { getCookie, isDemoMode } from '@/utils/cookie-utils';
import { getDisplayUrl, isRegistrationEnabled } from '@/utils/helper';
import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface HeroSectionProps {
    brandColor?: string;
    settings: any;
    sectionData: {
        title?: string;
        subtitle?: string;
        announcement_text?: string;
        primary_button_text?: string;
        secondary_button_text?: string;
        image?: string;
        stats?: Array<{ value: string; label: string }>;
        background_color?: string;
        text_color?: string;
        height?: number;
        layout?: string;
        overlay?: boolean;
        overlay_color?: string;
        image_position?: string;
        card?: {
            name: string;
            title: string;
            organization: string;
            initials: string;
        };
    };
}

export default function HeroSection({ settings, sectionData, brandColor = '#A12582' }: HeroSectionProps) {
    const { t } = useTranslation();
    const { globalSettings } = usePage().props as any;
    const isDemo = isDemoMode();

    let themeMode = 'light';
    if (isDemo) {
        const themeSettings = getCookie('themeSettings');
        if (themeSettings) {
            try {
                const parsed = JSON.parse(themeSettings);
                themeMode = parsed.appearance || 'light';
            } catch {
                themeMode = 'light';
            }
        }
    } else {
        themeMode = globalSettings?.themeMode || 'light';
    }

    const isDark = themeMode === 'dark';

    // Apply sectionData settings
    const backgroundColor = sectionData.background_color || (isDark ? '#111827' : '#f9fafb');
    const textColor = sectionData.text_color || (isDark ? '#ffffff' : '#111827');
    const subtitleColor = sectionData.text_color || (isDark ? '#d1d5db' : '#4b5563');
    const minHeight = sectionData.height ? `${sectionData.height}px` : '100vh';
    const layout = sectionData.layout || 'image-right';
    const hasOverlay = sectionData.overlay === true;
    const overlayColor = sectionData.overlay_color || 'rgba(0,0,0,0.45)';
    const imagePosition = sectionData.image_position || 'center';

    const heroImage = getDisplayUrl(sectionData?.image);
    const defaultImage = getDisplayUrl('/screenshots/hero-default.png');

    // Reusable text content block
    const textContent = (
        <div className={`space-y-6 sm:space-y-8 ${layout === 'centered' || layout === 'full-width' ? 'text-center' : 'text-center lg:text-left'}`}>
            {sectionData.announcement_text && (
                <div
                    className="inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium"
                    style={{ borderColor: brandColor, color: brandColor, backgroundColor: `${brandColor}15` }}
                >
                    {sectionData.announcement_text}
                </div>
            )}
            <h1
                className="text-4xl leading-tight font-bold md:text-5xl lg:text-6xl"
                style={{ color: textColor }}
                role="banner"
                aria-label="Main heading"
            >
                {sectionData.title || t('All-in-One Kakbima to Power Your Business Growth')}
            </h1>
            <p
                className={`text-lg leading-relaxed font-medium md:text-xl ${
                    layout === 'centered' || layout === 'full-width' ? 'mx-auto max-w-2xl' : 'max-w-2xl'
                }`}
                style={{ color: subtitleColor, opacity: 0.85 }}
            >
                {sectionData.subtitle || t('Manage leads, opportunities, quotes, orders, invoices, projects, and reports — all from one platform.')}
            </p>
            <div
                className={`flex flex-col gap-3 sm:flex-row sm:gap-4 ${
                    layout === 'centered' || layout === 'full-width' ? 'justify-center' : 'justify-center lg:justify-start'
                }`}
            >
                {isRegistrationEnabled() && (
                    <Link
                        href={route('register')}
                        className="flex items-center justify-center gap-2 rounded-lg border px-8 py-4 text-base font-semibold transition-all"
                        style={{ backgroundColor: brandColor, color: 'white', borderColor: brandColor }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'white';
                            e.currentTarget.style.color = brandColor;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = brandColor;
                            e.currentTarget.style.color = 'white';
                        }}
                        aria-label="Start free trial - Register for Sales"
                    >
                        {sectionData.primary_button_text || t('Start Free Trial')}
                        <ArrowRight size={18} />
                    </Link>
                )}
                <Link
                    href={route('login')}
                    className="flex items-center justify-center gap-2 rounded-lg border px-8 py-4 text-base font-semibold transition-colors hover:bg-white/10"
                    style={{ borderColor: brandColor, color: brandColor }}
                    aria-label="Sign in to existing Sales account"
                >
                    <Play size={18} />
                    {sectionData.secondary_button_text || t('Sign in')}
                </Link>
            </div>
            {sectionData.stats && sectionData.stats.length > 0 && (
                <div
                    className={`grid grid-cols-3 gap-4 pt-8 sm:gap-6 sm:pt-12 lg:gap-8 ${
                        layout === 'centered' || layout === 'full-width' ? 'mx-auto max-w-lg' : ''
                    }`}
                >
                    {sectionData.stats.map((stat, index) => (
                        <div key={index} className="text-center">
                            <div className="text-3xl font-bold md:text-4xl" style={{ color: textColor }}>
                                {stat.value}
                            </div>
                            <div className="text-sm font-medium" style={{ color: subtitleColor, opacity: 0.8 }}>
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    // Reusable image block
    const imageAlignClass = imagePosition === 'left' ? 'mr-auto' : imagePosition === 'right' ? 'ml-auto' : 'mx-auto'; // center (default)

    const imageContent =
        imagePosition === 'background' ? null : (
            <div className={`relative ${imageAlignClass}`}>
                <img src={heroImage || defaultImage} alt="Hero" className="h-auto w-full rounded-2xl shadow-xl" />
                <div className="absolute -top-4 -right-4 h-16 w-16 rounded-full bg-gray-200 opacity-50"></div>
                <div className="absolute -bottom-4 -left-4 h-12 w-12 rounded-full bg-gray-300 opacity-40"></div>
            </div>
        );

    // Render layout based on layout type
    const renderLayout = () => {
        switch (layout) {
            // Text centered, image below
            case 'centered':
                return (
                    <div className="flex flex-col items-center gap-10">
                        {textContent}
                        <div className="w-full max-w-3xl">{imageContent}</div>
                    </div>
                );

            // Full width - text centered, image full width below
            case 'full-width':
                return (
                    <div className="flex flex-col gap-10">
                        {textContent}
                        <div className="w-full">{imageContent}</div>
                    </div>
                );

            // Image on left, text on right
            case 'image-left':
                return (
                    <div className="grid items-center gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16">
                        {imageContent}
                        {textContent}
                    </div>
                );

            // Default: image on right, text on left
            case 'image-right':
            default:
                return (
                    <div className="grid items-center gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16">
                        {textContent}
                        {imageContent}
                    </div>
                );
        }
    };

    return (
        <section
            id="hero"
            className="relative flex items-center pt-16"
            style={{
                backgroundColor: hasOverlay ? overlayColor : backgroundColor,
                minHeight,
                ...(imagePosition === 'background' && (heroImage || defaultImage)
                    ? {
                          backgroundImage: `url(${heroImage || defaultImage})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat',
                      }
                    : {}),
            }}
        >
            {/* Overlay - only shown when overlay is true and image is background */}
            {hasOverlay && imagePosition === 'background' && <div className="absolute inset-0 z-0" style={{ backgroundColor: overlayColor }} />}

            <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">{renderLayout()}</div>
        </section>
    );
}
