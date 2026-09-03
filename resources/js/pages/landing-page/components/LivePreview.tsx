import { useBrand } from '@/contexts/BrandContext';
import { THEME_COLORS } from '@/hooks/use-appearance';
import { AlertCircle, CheckCircle, Eye, Globe, Layout, Mail, Palette, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LivePreviewProps {
    data: any;
    activeSection: string;
}

export default function LivePreview({ data, activeSection }: LivePreviewProps) {
    const { t } = useTranslation();
    const { themeColor, customColor } = useBrand();
    const brandColor = themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS];
    const getSectionData = (key: string) => {
        return data.config_sections?.sections?.find((section: any) => section.key === key) || {};
    };

    const getCompletionStatus = () => {
        const requiredFields = [
            { key: 'organization_name', value: data.organization_name, label: t('Organization Name') },
            { key: 'hero_title', value: getSectionData('hero').title, label: t('Hero Title') },
            { key: 'contact_email', value: data.contact_email, label: t('Contact Email') },
        ];

        const completed = requiredFields.filter((field) => field.value).length;
        return { completed, total: requiredFields.length, fields: requiredFields };
    };

    const status = getCompletionStatus();
    const completionPercentage = Math.round((status.completed / status.total) * 100);

    const renderSectionPreview = () => {
        switch (activeSection) {
            case 'hero':
                const heroData = getSectionData('hero');
                return (
                    <div className="space-y-3">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('Hero Section')}</div>
                        <div className="rounded-lg border bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-700">
                            <div className="mb-1 text-xs font-semibold text-gray-900 dark:text-gray-100">{heroData.title || 'Your Hero Title'}</div>
                            <div className="mb-2 text-xs text-gray-600 dark:text-gray-300">
                                {heroData.subtitle || 'Your hero subtitle will appear here...'}
                            </div>
                            <div className="flex gap-1">
                                <div
                                    className="rounded px-2 py-1 text-xs"
                                    style={{ backgroundColor: data.config_sections?.theme?.primary_color || '#A12582', color: 'white' }}
                                >
                                    {heroData.primary_button_text || 'Primary Button'}
                                </div>
                                <div className="rounded border px-2 py-1 text-xs">{heroData.secondary_button_text || 'Secondary'}</div>
                            </div>
                        </div>
                    </div>
                );

            case 'features':
                const featuresData = getSectionData('features');
                return (
                    <div className="space-y-3">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('Features Section')}</div>
                        <div className="rounded-lg border bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-700">
                            <div className="mb-1 text-xs font-semibold text-gray-900 dark:text-gray-100">
                                {featuresData.title || 'Features Title'}
                            </div>
                            <div className="mb-2 text-xs text-gray-600 dark:text-gray-300">
                                {featuresData.description || 'Features description...'}
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                                {(featuresData.features_list || []).slice(0, 4).map((feature: any, index: number) => (
                                    <div key={index} className="rounded bg-white p-1 text-xs dark:bg-gray-800 dark:text-gray-300">
                                        {feature.title || `Feature ${index + 1}`}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'about':
                const aboutData = getSectionData('about');
                return (
                    <div className="space-y-3">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('About Section')}</div>
                        <div className="rounded-lg border bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-700">
                            <div className="mb-1 text-xs font-semibold text-gray-900 dark:text-gray-100">{aboutData.title || 'About Title'}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-300">{aboutData.description || 'About description...'}</div>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="space-y-3">
                        <div className="text-sm font-medium text-gray-700">{t('Section Preview')}</div>
                        <div className="rounded-lg border bg-gray-50 p-3 text-center dark:border-gray-600 dark:bg-gray-700">
                            <div className="text-xs text-gray-500 dark:text-gray-400">{t('Select a section to see live preview')}</div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="sticky top-20 space-y-6">
            {/* Completion Status */}
            <div
                className="rounded-xl border bg-gradient-to-br p-6 shadow-sm"
                style={{ backgroundColor: brandColor + '10', borderColor: brandColor + '30' }}
            >
                <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg p-2" style={{ backgroundColor: brandColor + '20' }}>
                        <Eye className="h-5 w-5" style={{ color: brandColor }} />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('Setup Progress')}</h3>
                </div>

                <div className="mb-4">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{t('Completion')}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{completionPercentage}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200">
                        <div
                            className="h-2 rounded-full transition-all duration-300"
                            style={{ width: `${completionPercentage}%`, backgroundColor: brandColor }}
                        ></div>
                    </div>
                </div>

                <div className="space-y-2">
                    {status.fields.map((field, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                            {field.value ? <CheckCircle className="h-3 w-3 text-green-600" /> : <AlertCircle className="h-3 w-3 text-red-500" />}
                            <span className={field.value ? 'text-green-700' : 'text-red-600'}>{field.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Live Section Preview */}
            {['hero', 'features', 'about'].includes(activeSection) && (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="rounded-lg bg-purple-100 p-2">
                            <Layout className="h-5 w-5 text-purple-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('Live Preview')}</h3>
                    </div>

                    {renderSectionPreview()}
                </div>
            )}

            {/* Theme Colors */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg bg-pink-100 p-2">
                        <Palette className="h-5 w-5 text-pink-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('Color Scheme')}</h3>
                </div>

                <div className="flex gap-3">
                    <div className="flex flex-col items-center gap-1">
                        <div
                            className="h-8 w-8 rounded-lg border-2 border-white shadow-sm"
                            style={{ backgroundColor: data.config_sections?.theme?.primary_color || '#A12582' }}
                        ></div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{t('Primary')}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <div
                            className="h-8 w-8 rounded-lg border-2 border-white shadow-sm"
                            style={{ backgroundColor: data.config_sections?.theme?.secondary_color || '#8b5cf6' }}
                        ></div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{t('Secondary')}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <div
                            className="h-8 w-8 rounded-lg border-2 border-white shadow-sm"
                            style={{ backgroundColor: data.config_sections?.theme?.accent_color || '#10b77f' }}
                        ></div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{t('Accent')}</span>
                    </div>
                </div>
            </div>

            {/* Contact Info */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg bg-green-100 p-2">
                        <Phone className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('Contact Info')}</h3>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <span className={data.contact_email ? 'text-gray-700 dark:text-gray-300' : 'text-red-500'}>
                            {data.contact_email || 'Email not set'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <Phone className="h-3 w-3 text-gray-400" />
                        <span className={data.contact_phone ? 'text-gray-700 dark:text-gray-300' : 'text-red-500'}>
                            {data.contact_phone || 'Phone not set'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <Globe className="h-3 w-3 text-gray-400" />
                        <span className={data.contact_address ? 'text-gray-700 dark:text-gray-300' : 'text-red-500'}>
                            {data.contact_address || 'Address not set'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
