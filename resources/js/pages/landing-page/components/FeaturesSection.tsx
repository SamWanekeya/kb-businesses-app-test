import { BarChart3, Globe, Heart, Lock, QrCode, Share2, Shield, Smartphone, Star, TrendingUp, Users, Wifi, Zap } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useScrollAnimation } from '../../../hooks/useScrollAnimation';

interface Feature {
    title: string;
    description: string;
    icon: string;
}

interface FeaturesSectionProps {
    brandColor?: string;
    settings: any;
    sectionData: {
        title?: string;
        description?: string;
        features_list?: Feature[];
        layout?: string;
        columns?: number;
        background_color?: string;
        image?: string;
        show_icons?: boolean;
    };
}

// Icon mapping for dynamic icons
const iconMap: Record<string, React.ComponentType<any>> = {
    'qr-code': QrCode,
    smartphone: Smartphone,
    share: Share2,
    'bar-chart': BarChart3,
    globe: Globe,
    shield: Shield,
    star: Star,
    zap: Zap,
    users: Users,
    lock: Lock,
    wifi: Wifi,
    heart: Heart,
    'trending-up': TrendingUp,
};

export default function FeaturesSection({ settings, sectionData, brandColor = '#A12582' }: FeaturesSectionProps) {
    const { ref, isVisible } = useScrollAnimation();
    const { t } = useTranslation();

    const getImageUrl = (path: string) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${window.appSettings.imageUrl}${path}`;
    };

    const sectionImage = getImageUrl(sectionData.image);
    const backgroundColor = sectionData.background_color || '#f9fafb';
    const columns = sectionData.columns || 3;
    const layout = sectionData.layout || 'grid';

    const defaultFeatures = [
        {
            icon: 'users',
            title: t('CRM & Lead Management'),
            description: t(
                'Capture, nurture, and convert leads with smart automation tools. Perfect for business cards, flyers, and networking events.',
            ),
        },
        {
            icon: 'zap',
            title: t('Opportunity & Pipeline'),
            description: t('Track every deal stage and source to close more sales.'),
        },
        {
            icon: 'globe',
            title: t('Quotes & Orders'),
            description: t('Create professional quotes, manage sales and purchase orders with ease.'),
        },
        {
            icon: 'smartphone',
            title: t('Invoices & Payments'),
            description: t('Automate invoices, track payments, and simplify your billing process.'),
        },
        {
            icon: 'star',
            title: t('Projects & Tasks'),
            description: t('Collaborate on projects, assign tasks, and deliver work on time.'),
        },
        {
            icon: 'bar-chart',
            title: t('Reports & Analytics'),
            description: t('Gain deep insights with customizable reports and dashboards.'),
        },
    ];

    const features = sectionData.features_list && sectionData.features_list.length > 0 ? sectionData.features_list : defaultFeatures;

    // Render based on layout
    const renderFeatures = () => {
        if (layout === 'list') {
            return (
                <div className="space-y-6">
                    {features.map((feature, index) => {
                        const IconComponent = iconMap[feature.icon] || QrCode;
                        return (
                            <div key={index} className="flex gap-6 rounded-xl border border-gray-200 bg-white p-6 transition-all hover:shadow-lg">
                                {sectionData.show_icons && (
                                    <div
                                        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg"
                                        style={{ backgroundColor: `${brandColor}15` }}
                                    >
                                        <IconComponent className="h-6 w-6" style={{ color: brandColor }} />
                                    </div>
                                )}
                                <div>
                                    <h3 className="mb-2 text-xl font-bold text-gray-900">{feature.title}</h3>
                                    <p className="leading-relaxed text-gray-600">{feature.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        }

        if (layout === 'cards') {
            return (
                <div
                    className={`grid grid-cols-1 ${columns >= 2 ? 'sm:grid-cols-2' : ''} ${columns >= 3 ? 'lg:grid-cols-3' : ''} ${columns >= 4 ? 'xl:grid-cols-4' : ''} gap-6 sm:gap-8`}
                >
                    {features.map((feature, index) => {
                        const IconComponent = iconMap[feature.icon] || QrCode;
                        return (
                            <div
                                key={index}
                                className="rounded-2xl border-t-4 bg-white p-8 shadow-lg transition-all duration-200 hover:shadow-xl"
                                style={{ borderTopColor: brandColor }}
                            >
                                {sectionData.show_icons && (
                                    <div
                                        className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full"
                                        style={{ backgroundColor: `${brandColor}15` }}
                                    >
                                        <IconComponent className="h-7 w-7" style={{ color: brandColor }} />
                                    </div>
                                )}
                                <h3 className="mb-4 text-center text-xl font-bold text-gray-900">{feature.title}</h3>
                                <p className="text-center leading-relaxed text-gray-600">{feature.description}</p>
                            </div>
                        );
                    })}
                </div>
            );
        }

        if (layout === 'alternating') {
            return (
                <div className="space-y-12">
                    {features.map((feature, index) => {
                        const IconComponent = iconMap[feature.icon] || QrCode;
                        const isEven = index % 2 === 0;
                        return (
                            <div
                                key={index}
                                className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-8 rounded-xl border border-gray-200 bg-white p-8`}
                            >
                                <div className="flex w-full justify-center lg:w-1/3">
                                    {sectionData.show_icons && (
                                        <div
                                            className="flex h-24 w-24 items-center justify-center rounded-2xl"
                                            style={{ backgroundColor: `${brandColor}15` }}
                                        >
                                            <IconComponent className="h-12 w-12" style={{ color: brandColor }} />
                                        </div>
                                    )}
                                </div>
                                <div className="w-full lg:w-2/3">
                                    <h3 className="mb-4 text-2xl font-bold text-gray-900">{feature.title}</h3>
                                    <p className="text-lg leading-relaxed text-gray-600">{feature.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        }

        // Default: grid layout
        return (
            <div
                className={`grid grid-cols-1 ${columns >= 2 ? 'sm:grid-cols-2' : ''} ${columns >= 3 ? 'lg:grid-cols-3' : ''} ${columns >= 4 ? 'xl:grid-cols-4' : ''} gap-6 sm:gap-8`}
            >
                {features.map((feature, index) => {
                    const IconComponent = iconMap[feature.icon] || QrCode;
                    return (
                        <div
                            key={index}
                            className="rounded-xl border border-gray-200 bg-white p-8 transition-all duration-200 hover:border-gray-300 hover:shadow-lg"
                            role="article"
                            aria-labelledby={`feature-${index}-title`}
                        >
                            {sectionData.show_icons && (
                                <div
                                    className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg"
                                    style={{ backgroundColor: `${brandColor}15` }}
                                    role="img"
                                    aria-label={`${feature.title} icon`}
                                >
                                    <IconComponent className="h-6 w-6" style={{ color: brandColor }} aria-hidden="true" />
                                </div>
                            )}
                            <h3 className="mb-4 text-xl font-bold text-gray-900" id={`feature-${index}-title`}>
                                {feature.title}
                            </h3>
                            <p className="leading-relaxed text-gray-600">{feature.description}</p>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <section id="features" className="py-12 sm:py-16 lg:py-20" style={{ backgroundColor }} ref={ref}>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div
                    className={`mb-8 text-center transition-all duration-700 sm:mb-12 lg:mb-16 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                >
                    <h2 className="mb-4 text-3xl font-bold md:text-4xl dark:text-gray-400">
                        {sectionData.title || t('Powerful Features to Streamline Your Sales')}
                    </h2>
                    <p className="mx-auto max-w-3xl text-lg leading-relaxed font-medium text-gray-600">
                        {sectionData.description ||
                            t(
                                'From lead management to invoicing, get everything you need to manage and grow your sales pipeline in one platform.. Built for professionals who value efficiency and innovation.',
                            )}
                    </p>
                </div>

                {sectionImage && (
                    <div className="mb-8 text-center sm:mb-12">
                        <img src={sectionImage} alt={t('Features')} className="mx-auto h-auto max-w-full rounded-xl shadow-lg" />
                    </div>
                )}

                <div className={`transition-all delay-200 duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                    {renderFeatures()}
                </div>
            </div>
        </section>
    );
}
