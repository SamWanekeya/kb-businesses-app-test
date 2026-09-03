import { getDisplayUrl } from '@/utils/helper';
import { Monitor } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useScrollAnimation } from '../../../hooks/useScrollAnimation';

interface ScreenshotsSectionProps {
    brandColor?: string;
    settings?: any;
    sectionData?: {
        title?: string;
        subtitle?: string;
        screenshots_list?: Array<{
            src: string;
            alt: string;
            title: string;
            description: string;
        }>;
    };
}

export default function ScreenshotsSection({ brandColor = '#A12582', settings, sectionData }: ScreenshotsSectionProps) {
    const { ref, isVisible } = useScrollAnimation();
    const { t } = useTranslation();

    // Default screenshots if none provided in settings
    const defaultScreenshots = [
        {
            src: '/screenshots/dashboard.png',
            alt: t('Kakbima Dashboard Overview'),
            title: t('Dashboard Overview'),
            description: t('Get a complete view of leads, employees, projects, sales, projects, and performance insights in one place.analytics'),
        },
        {
            src: '/screenshots/crm.png',
            alt: t('CRM & Lead Management'),
            title: t('CRM & Lead Management'),
            description: t('Easily manage accounts, contacts, and leads with a user-friendly CRM system'),
        },
        {
            src: '/screenshots/orders.png',
            alt: t('Quotes & Orders'),
            title: t('Quotes & Orders'),
            description: t('Quickly generate quotes, process orders, and track every transaction with ease'),
        },
        {
            src: '/screenshots/invoices.png',
            alt: t('Invoices & Payments'),
            title: t('Invoices & Payments'),
            description: t('Automate billing, manage payments, and simplify your financial workflows'),
        },
        {
            src: '/screenshots/projects.png',
            alt: t('Projects & Task Management'),
            title: t('Projects & Tasks'),
            description: t('Plan, assign, and track tasks to deliver projects on time and boost team productivity.'),
        },
        {
            src: '/screenshots/reports.png',
            alt: t('Reports & Analytics'),
            title: t('Reports & Analytics'),
            description: t('Visualize your sales performance with powerful reports and real-time analytics.'),
        },
    ];

    const screenshots =
        sectionData?.screenshots_list && sectionData.screenshots_list.length > 0
            ? sectionData.screenshots_list
                  .map((screenshot) => ({
                      ...screenshot,
                      src: getDisplayUrl(screenshot.src),
                  }))
                  .filter((screenshot) => screenshot.src)
            : defaultScreenshots
                  .map((screenshot) => ({
                      ...screenshot,
                      src: getDisplayUrl(screenshot.src),
                  }))
                  .filter((screenshot) => screenshot.src);

    return (
        <section id="screenshots" className="bg-white py-12 sm:py-16 lg:py-20" ref={ref}>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div
                    className={`mb-8 text-center transition-all duration-700 sm:mb-12 lg:mb-16 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                >
                    <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">{sectionData?.title || t('See Our Kakbima in Action')}</h2>
                    <p className="mx-auto max-w-3xl text-lg leading-relaxed font-medium text-gray-600">
                        {sectionData?.subtitle ||
                            t('Explore the modern interface and powerful modules that make managing your sales process effortless.')}
                    </p>
                </div>

                {screenshots.length > 0 ? (
                    <div
                        className={`grid grid-cols-1 gap-6 transition-all delay-200 duration-700 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                    >
                        {screenshots.map((screenshot, index) => (
                            <div
                                key={index}
                                className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                            >
                                <div className="aspect-video overflow-hidden bg-gray-100">
                                    {screenshot.src ? (
                                        <img
                                            src={screenshot.src}
                                            alt={screenshot.alt}
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            loading="lazy"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.nextElementSibling.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}
                                    <div
                                        className="flex h-full w-full items-center justify-center text-gray-400"
                                        style={{ display: screenshot.src ? 'none' : 'flex' }}
                                    >
                                        <Monitor className="h-12 w-12" />
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h3 className="mb-2 text-lg font-semibold text-gray-900">{screenshot.title}</h3>
                                    <p className="text-sm leading-relaxed text-gray-600">{screenshot.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div
                        className={`py-12 text-center transition-all delay-200 duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                    >
                        <div className="mb-4 text-gray-400">
                            <Monitor className="mx-auto h-16 w-16" />
                        </div>
                        <p className="text-gray-500">{t('No screenshots configured yet. Add some in the admin settings.')}</p>
                    </div>
                )}

                <div
                    className={`mt-12 text-center transition-all delay-400 duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                >
                    <div
                        className="inline-flex items-center rounded-full border-2 px-6 py-3 text-sm font-medium"
                        style={{ borderColor: brandColor, color: brandColor }}
                    >
                        {t('✨ And many more features to discover')}
                    </div>
                </div>
            </div>
        </section>
    );
}
