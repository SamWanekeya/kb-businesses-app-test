import { Award, CheckCircle, Clock, Heart, Shield, Star, Users, Zap } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useScrollAnimation } from '../../../hooks/useScrollAnimation';

interface WhyChooseUsProps {
    brandColor?: string;
    settings: any;
    sectionData: {
        title?: string;
        subtitle?: string;
        reasons?: Array<{
            title: string;
            description: string;
            icon: string;
        }>;
        stats?: Array<{
            value: string;
            label: string;
            color: string;
        }>;
        stats_title?: string;
        stats_subtitle?: string;
        cta_title?: string;
        cta_subtitle?: string;
    };
}

// Icon mapping for dynamic icons
const iconMap: Record<string, React.ComponentType<any>> = {
    clock: Clock,
    users: Users,
    zap: Zap,
    'check-circle': CheckCircle,
    star: Star,
    shield: Shield,
    heart: Heart,
    award: Award,
};

export default function WhyChooseUs({ settings, sectionData, brandColor = '#A12582' }: WhyChooseUsProps) {
    const { ref, isVisible } = useScrollAnimation();
    const { t } = useTranslation();
    // Default data if none provided
    const defaultReasons = [
        {
            icon: 'clock',
            title: t('Quick Setup'),
            description: t('Get started in minutes with a user-friendly interface and ready-to-use modules.'),
        },
        {
            icon: 'check-circle',
            title: t('All-in-One Solution'),
            description: t('From leads to invoices, manage your entire sales process in one place.'),
        },
        {
            icon: 'zap',
            title: t('Boost Productivity'),
            description: t('Streamline tasks, automate workflows, and close deals faster.'),
        },
        {
            icon: 'shield',
            title: t('Scalable & Secure'),
            description: t('Built with enterprise-grade security and flexibility to grow with your business.'),
        },
    ];

    const defaultStats = [
        { value: '10K+', label: t('Organizations Powered'), color: 'blue' },
        { value: '99%', label: t('Customer Satisfaction'), color: 'green' },
    ];

    const reasons = sectionData.reasons && sectionData.reasons.length > 0 ? sectionData.reasons : defaultReasons;

    const stats = sectionData.stats && sectionData.stats.length > 0 ? sectionData.stats : defaultStats;

    return (
        <section className="bg-white py-12 sm:py-16 lg:py-20" ref={ref}>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid items-center gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16">
                    {/* Left Content */}
                    <div className={`transition-all duration-700 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'}`}>
                        <h2 className="mb-6 text-3xl font-bold text-gray-900 md:text-4xl">{sectionData.title || t('Why Choose Our Kakbima?')}</h2>
                        <p className="mb-8 text-lg leading-relaxed font-medium text-gray-600">
                            {sectionData.subtitle || t("We're more than just CRM — we're your complete sales growth platform.")}
                        </p>

                        <div className="space-y-4 sm:space-y-6">
                            {reasons.map((reason, index) => {
                                const IconComponent = iconMap[reason.icon] || Clock;
                                return (
                                    <div key={index} className="flex items-start gap-4">
                                        <div
                                            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
                                            style={{ backgroundColor: `${brandColor}15` }}
                                        >
                                            <IconComponent className="h-5 w-5" style={{ color: brandColor }} />
                                        </div>
                                        <div>
                                            <h3 className="mb-2 text-lg font-semibold text-gray-900">{reason.title}</h3>
                                            <p className="text-gray-600">{reason.description}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Content - Stats/Visual */}
                    <div
                        className={`rounded-xl border border-gray-200 bg-gray-50 p-8 transition-all delay-300 duration-700 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}
                    >
                        <div className="mb-8 text-center">
                            <h3 className="mb-2 text-2xl font-bold text-gray-900">{sectionData.stats_title || t('Trusted by Industry Leaders')}</h3>
                            <p className="text-gray-600">{sectionData.stats_subtitle || t('Join the growing community of professionals')}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 sm:gap-6">
                            {stats.map((stat, index) => (
                                <div key={index} className="rounded-lg border border-gray-200 bg-white p-6 text-center">
                                    <div className="mb-2 text-3xl font-bold text-gray-900">{stat.value}</div>
                                    <div className="font-medium text-gray-600">{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        {(sectionData.cta_title || sectionData.cta_subtitle) && (
                            <div className="mt-8 rounded-lg p-6 text-center text-white" style={{ backgroundColor: brandColor }}>
                                <div className="mb-2 text-xl font-bold">{sectionData.cta_title || t('Ready to get started?')}</div>
                                <div className="text-gray-300">{sectionData.cta_subtitle || t('Join thousands of satisfied users today')}</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
