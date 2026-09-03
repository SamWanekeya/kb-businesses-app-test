import { toast } from '@/components/custom-toast';
import { useForm } from '@inertiajs/react';
import { CheckCircle, Mail, MapPin, Phone, Send } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ContactSectionProps {
    brandColor?: string;
    flash?: {
        success?: string;
        error?: string;
    };
    settings?: {
        contact_email?: string;
        contact_phone?: string;
        contact_address?: string;
    };
    sectionData?: {
        title?: string;
        subtitle?: string;
        form_title?: string;
        info_title?: string;
        info_description?: string;
        faqs?: Array<{
            question: string;
            answer: string;
        }>;
    };
}

export default function ContactSection({ flash, settings, sectionData, brandColor = '#A12582' }: ContactSectionProps) {
    const { t } = useTranslation();
    const [contactSuccessMessage, setContactSuccessMessage] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        subject: '',
        message: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('landing-page.contact'), {
            preserveScroll: true,
            onSuccess: (page) => {
                reset();
                const success = page.props.flash?.success;
                if (success) {
                    setContactSuccessMessage(success);
                }
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).join(', ');
                setContactSuccessMessage(false);
                toast.error(errorMessage || t('Failed to send message. Please try again.'));
            },
        });
    };

    const contactInfo = [
        {
            icon: Mail,
            title: t('Email Us'),
            content: settings?.contact_email || 'support@sales.com',
            description: t('Send us an email anytime!'),
        },
        {
            icon: Phone,
            title: t('Call Us'),
            content: settings?.contact_phone || '+1 (555) 123-4567',
            description: t('Mon-Fri from 8am to 5pm'),
        },
        {
            icon: MapPin,
            title: t('Visit Us'),
            content: settings?.contact_address || '123 Business Ave, Suite 100',
            description: t('San Francisco, CA 94105'),
        },
    ].filter((info) => info.content); // Only show items that have content

    return (
        <section id="contact" className="bg-gray-50 py-12 sm:py-16 lg:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-8 text-center sm:mb-12 lg:mb-16">
                    <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">{sectionData?.title || t('Connect with Kakbima')}</h2>
                    <p className="mx-auto max-w-3xl text-lg leading-relaxed font-medium text-gray-600">
                        {sectionData?.subtitle || t('Have questions about Kakbima? Our team is here to help you succeed.')}
                    </p>
                </div>

                <div className="grid gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16">
                    {/* Contact Form */}
                    <div>
                        <div className="rounded-xl border border-gray-200 bg-white p-8">
                            <h3 className="mb-6 text-2xl font-bold text-gray-900">{sectionData?.form_title || t('Send us a Message')}</h3>

                            {contactSuccessMessage && (
                                <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5" />
                                        <span>{contactSuccessMessage}</span>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6" role="form" aria-label="Contact form">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                                    <div>
                                        <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">
                                            {t('Full Name')}{' '}
                                            <span className="text-red-500" aria-label={t('required')}>
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100"
                                            style={{ '--tw-ring-color': brandColor } as React.CSSProperties}
                                            placeholder={t('Your full name')}
                                            required
                                            disabled={processing}
                                        />
                                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                                            {t('Email Address')}{' '}
                                            <span className="text-red-500" aria-label={t('required')}>
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100"
                                            style={{ '--tw-ring-color': brandColor } as React.CSSProperties}
                                            placeholder="your@email.com"
                                            required
                                            disabled={processing}
                                        />
                                        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="subject" className="mb-2 block text-sm font-medium text-gray-700">
                                        {t('Subject')}{' '}
                                        <span className="text-red-500" aria-label={t('required')}>
                                            *
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        id="subject"
                                        value={data.subject}
                                        onChange={(e) => setData('subject', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100"
                                        style={{ '--tw-ring-color': brandColor } as React.CSSProperties}
                                        placeholder={t("What's this about?")}
                                        required
                                        disabled={processing}
                                    />
                                    {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject}</p>}
                                </div>

                                <div>
                                    <label htmlFor="message" className="mb-2 block text-sm font-medium text-gray-700">
                                        {t('Message')}{' '}
                                        <span className="text-red-500" aria-label={t('required')}>
                                            *
                                        </span>
                                    </label>
                                    <textarea
                                        id="message"
                                        rows={6}
                                        value={data.message}
                                        onChange={(e) => setData('message', e.target.value)}
                                        className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100"
                                        style={{ '--tw-ring-color': brandColor } as React.CSSProperties}
                                        placeholder={t('Tell us more about your inquiry...')}
                                        required
                                        disabled={processing}
                                    />
                                    {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-8 py-4 font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                                    style={{ backgroundColor: brandColor }}
                                    aria-label={processing ? t('Sending message') : t('Send contact message')}
                                >
                                    {processing ? (
                                        <>
                                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                            {t('Sending...')}
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-5 w-5" />
                                            {t('Send Message')}
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div>
                        <div className="space-y-8">
                            <div>
                                <h3 className="mb-6 text-2xl font-bold text-gray-900">{sectionData?.info_title || t('Contact Information')}</h3>
                                <p className="mb-8 text-gray-600">
                                    {sectionData?.info_description ||
                                        t("We're here to help and answer any question you might have. We look forward to hearing from you.")}
                                </p>
                            </div>

                            <div className="space-y-6">
                                {contactInfo.map((info, index) => {
                                    const IconComponent = info.icon;
                                    return (
                                        <div key={index} className="flex items-start gap-4">
                                            <div
                                                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg"
                                                style={{ backgroundColor: `${brandColor}15` }}
                                            >
                                                <IconComponent className="h-6 w-6" style={{ color: brandColor }} />
                                            </div>
                                            <div>
                                                <h4 className="mb-1 text-lg font-semibold text-gray-900">{info.title}</h4>
                                                <p className="mb-1 font-medium text-gray-900">{info.content}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* FAQ Section */}
                            {sectionData?.faqs && sectionData.faqs.length > 0 && (
                                <div className="rounded-xl border border-gray-200 bg-white p-6">
                                    <h4 className="mb-4 text-lg font-semibold text-gray-900">{t('Frequently Asked Questions')}</h4>
                                    <div className="space-y-4">
                                        {sectionData.faqs.map((faq, index) => (
                                            <div key={index}>
                                                <h5 className="mb-1 font-medium text-gray-900">{faq.question}</h5>
                                                <p className="text-sm text-gray-600">{faq.answer}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
