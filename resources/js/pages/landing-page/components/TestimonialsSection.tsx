import { Quote, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useScrollAnimation } from '../../../hooks/useScrollAnimation';

interface Testimonial {
    id: number;
    name: string;
    role: string;
    organization?: string;
    content: string;
    avatar?: string;
    rating: number;
}

interface TestimonialsSectionProps {
    brandColor?: string;
    testimonials: Testimonial[];
    settings?: any;
    sectionData?: {
        title?: string;
        subtitle?: string;
        trust_title?: string;
        trust_stats?: Array<{
            value: string;
            label: string;
            color: string;
        }>;
        default_testimonials?: Array<{
            name: string;
            role: string;
            organization?: string;
            content: string;
            rating: number;
        }>;
    };
}

export default function TestimonialsSection({ testimonials, settings, sectionData, brandColor = '#A12582' }: TestimonialsSectionProps) {
    const { ref, isVisible } = useScrollAnimation();
    const { t } = useTranslation();
    // Fallback testimonials if none provided
    const defaultTestimonials = sectionData?.testimonials?.map((testimonial, index) => ({
        id: index + 1,
        ...testimonial,
    })) || [
        {
            name: 'Alex Thompson',
            role: t('Sales Director'),
            organization: 'TechCorp Inc.',
            content: t('This platform has transformed how we manage leads and opportunities. Our conversion rate has doubled since adopting it!'),
            rating: '5',
        },
        {
            name: 'Maria Lopez',
            role: t('Operations Manager'),
            organization: 'Global Enterprises',
            content: t(
                'Invoices and orders are now automated, saving us hours every week. The reports feature gives us clear insights into performance.',
            ),
            rating: '5',
        },
        {
            name: 'Ravi Patel',
            role: t('Founder & CEO'),
            organization: 'StartUp Hub',
            content: t('This platform has transformed how we manage leads and opportunities. Our conversion rate has doubled since adopting it!'),
            rating: '5',
        },
    ];

    const displayTestimonials = testimonials.length > 0 ? testimonials : defaultTestimonials;

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, index) => (
            <Star
                key={index}
                className={`h-4 w-4 ${index < rating ? 'fill-current text-current' : 'text-gray-300'}`}
                style={index < rating ? { color: brandColor } : {}}
                fill={index < rating ? brandColor : 'none'}
            />
        ));
    };

    return (
        <section className="bg-gray-50 py-12 sm:py-16 lg:py-20" ref={ref}>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div
                    className={`mb-8 text-center transition-all duration-700 sm:mb-12 lg:mb-16 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                >
                    <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">{sectionData?.title || t('What Our Clients Say')}</h2>
                    <p className="mx-auto max-w-3xl text-lg leading-relaxed font-medium text-gray-600">
                        {sectionData?.subtitle || t("Don't just take our word for it — hear from businesses using our Kakbima.")}
                    </p>
                </div>

                <div
                    className={`grid grid-cols-1 gap-6 transition-all delay-200 duration-700 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                >
                    {displayTestimonials.map((testimonial) => (
                        <div
                            key={testimonial.id}
                            className="relative rounded-xl border border-gray-200 bg-white p-6 transition-colors hover:border-gray-300"
                        >
                            {/* Quote Icon */}
                            <div className="absolute -top-3 left-6">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: brandColor }}>
                                    <Quote className="h-3 w-3 text-white" />
                                </div>
                            </div>

                            {/* Rating */}
                            <div className="mb-4 flex items-center gap-1 pt-2">{renderStars(testimonial.rating)}</div>

                            {/* Testimonial Content */}
                            <p className="mb-6 leading-relaxed text-gray-700">"{testimonial.content}"</p>

                            {/* Author Info */}
                            <div className="flex items-center gap-4">
                                <div
                                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full"
                                    style={{ backgroundColor: brandColor }}
                                >
                                    {testimonial.avatar ? (
                                        <img src={testimonial.avatar} alt={testimonial.name} className="h-12 w-12 rounded-full object-cover" />
                                    ) : (
                                        <span className="font-semibold text-white">
                                            {testimonial.name
                                                .split(' ')
                                                .map((n) => n[0])
                                                .join('')}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                                    <p className="text-sm text-gray-600">
                                        {testimonial.role}
                                        {testimonial.organization && <span className="text-gray-400"> • {testimonial.organization}</span>}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Trust Indicators */}
                {sectionData?.trust_stats && sectionData.trust_stats.length > 0 && (
                    <div className="mt-8 text-center sm:mt-12 lg:mt-16">
                        <div className="rounded-xl border border-gray-200 bg-white p-8">
                            <h3 className="mb-6 text-2xl font-bold text-gray-900">
                                {sectionData?.trust_title || t('Trusted by Businesses Worldwide')}
                            </h3>
                            <div className="flex flex-wrap items-center justify-center gap-8">
                                {sectionData.trust_stats.map((stat, index) => (
                                    <div key={index} className="text-center">
                                        <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                                        <div className="text-gray-600">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
