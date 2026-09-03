import { toast } from '@/components/custom-toast';
import { useForm, usePage } from '@inertiajs/react';
import { CheckCircle, Mail } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface NewsletterSectionProps {
    brandColor?: string;
    flash?: {
        success?: string;
        error?: string;
    };
    settings?: any;
    sectionData?: {
        title?: string;
        subtitle?: string;
        privacy_text?: string;
        benefits?: Array<{
            icon: string;
            title: string;
            description: string;
        }>;
    };
}

export default function NewsletterSection({ flash, settings, sectionData, brandColor = '#A12582' }: NewsletterSectionProps) {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { t } = useTranslation();

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
    });

    const { props } = usePage();
    const [newsLetterSuccessMessage, setNewsLetterSuccessMessage] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('landing-page.subscribe'), {
            preserveScroll: true,
            onSuccess: (page) => {
                setIsSubmitted(true);
                reset();
                const success = page.props.flash?.success;
                const error = page.props.flash?.error;
                if (success) {
                    setNewsLetterSuccessMessage(success);
                }
                if (error) {
                    setNewsLetterSuccessMessage(false);
                    toast.error(error);
                }
                setTimeout(() => setIsSubmitted(false), 3000);
            },
            onError: () => {
                toast.error(t('Please check your email and try again.'));
            },
        });
    };

    return (
        <section className="bg-gray-50 py-12 sm:py-16 lg:py-20">
            <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                <div className="rounded-xl border border-gray-200 bg-white p-8 md:p-12">
                    <div
                        className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${brandColor}15` }}
                    >
                        <Mail className="h-8 w-8" style={{ color: brandColor }} />
                    </div>

                    <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">{sectionData?.title || t('Stay Updated with Kakbima')}</h2>
                    <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed font-medium text-gray-600" id="newsletter-description">
                        {sectionData?.subtitle || t('Get the latest sales strategies, product updates, and growth insights.')}
                    </p>

                    {newsLetterSuccessMessage && (
                        <div className="mx-auto mb-6 max-w-md rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5" />
                                <span>{newsLetterSuccessMessage}</span>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="mx-auto max-w-md">
                        <div className="flex flex-col gap-4 sm:flex-row">
                            <div className="flex-1">
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder={t('Enter your email address')}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-gray-500 focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100"
                                    style={{ '--tw-ring-color': brandColor } as React.CSSProperties}
                                    required
                                    disabled={processing}
                                    aria-label={t('Email address for newsletter subscription')}
                                    aria-describedby="newsletter-description"
                                />
                                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                            </div>
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex min-w-[120px] cursor-pointer items-center justify-center gap-2 rounded-lg px-8 py-3 font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                                style={{ backgroundColor: brandColor }}
                                aria-label={processing ? t('Subscribing to newsletter') : t('Subscribe to newsletter')}
                            >
                                {processing && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>}
                                {processing ? t('Subscribing...') : t('Subscribe')}
                            </button>
                        </div>
                    </form>

                    <p className="mt-4 text-sm text-gray-500">
                        {sectionData?.privacy_text || t('We value your privacy — no spam, unsubscribe anytime.')}
                    </p>

                    {/* Benefits */}
                    {sectionData?.benefits && sectionData.benefits.length > 0 && (
                        <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-3 sm:gap-6">
                            {sectionData.benefits.map((benefit, index) => (
                                <div key={index} className="text-center">
                                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                                        <span className="text-xl text-gray-700">{benefit.icon}</span>
                                    </div>
                                    <h3 className="mb-2 font-semibold text-gray-900">{benefit.title}</h3>
                                    <p className="text-sm text-gray-600">{benefit.description}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
