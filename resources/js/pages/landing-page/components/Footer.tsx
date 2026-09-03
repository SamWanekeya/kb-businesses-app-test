import { toast } from '@/components/custom-toast';
import { useBrand } from '@/contexts/BrandContext';
import { getDisplayUrl } from '@/utils/helper';
import { Link, useForm } from '@inertiajs/react';
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Twitter } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface FooterProps {
    brandColor?: string;
    settings: {
        organization_name: string;
        contact_email: string;
        contact_phone: string;
        contact_address: string;
        footerText?: string;
        config_sections: {
            theme: {
                logo_dark: string;
                logo_light: string;
            };
            brand: {
                footerText: string;
            };
        };
    };
    sectionData?: {
        description?: string;
        newsletter_title?: string;
        newsletter_subtitle?: string;
        links?: any;
        footerText?: string;
        social_links?: Array<{
            name: string;
            icon: string;
            href: string;
        }>;
        section_titles?: {
            product: string;
            organization: string;
            support: string;
            legal: string;
        };
    };
}

export default function Footer({ settings, sectionData = {}, brandColor = '#A12582' }: FooterProps) {
    const currentYear = new Date().getFullYear();
    const { t } = useTranslation();
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
    });
    const { logoLight, logoDark, updateBrandSettings } = useBrand();

    const footerLinks = sectionData.links || {
        product: [
            { name: t('Features'), href: '#features' },
            { name: t('Pricing'), href: '#pricing' },
            { name: t('Integrations'), href: '#integrations' },
        ],
        organization: [
            { name: t('About Us'), href: '#about' },
            { name: t('Careers'), href: '#careers' },
            { name: t('Contact'), href: '#contact' },
        ],
        support: [
            { name: t('Help Center'), href: '#help-center' },
            { name: t('FAQs'), href: '#faqs' },
        ],
        legal: [
            { name: t('Privacy Policy'), href: '#privacy-policy' },
            { name: t('Terms of Service'), href: '#terms-of-service' },
        ],
    };

    const iconMap: Record<string, any> = {
        Facebook,
        Twitter,
        Linkedin,
        Instagram,
    };

    const socialLinks = sectionData.social_links || [
        { name: 'Facebook', icon: 'Facebook', href: '#' },
        { name: 'Twitter', icon: 'Twitter', href: '#' },
        { name: 'LinkedIn', icon: 'Linkedin', href: '#' },
        { name: 'Instagram', icon: 'Instagram', href: '#' },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('landing-page.subscribe'), {
            preserveScroll: true,
            onSuccess: (page) => {
                reset();
                const success = page?.props?.flash?.success;
                const error = page?.props?.flash?.error;
                if (success) {
                    toast.success(success);
                }
                if (error) {
                    toast.error(error);
                }
            },
            onError: () => {
                toast.error(t('Please check your email and try again.'));
            },
        });
    };

    return (
        <footer className="bg-gray-900 text-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Main Footer Content */}
                <div className="py-12 sm:py-16">
                    <div className="grid gap-8 sm:gap-12 lg:grid-cols-6">
                        {/* Organization Info */}
                        <div className="lg:col-span-2">
                            <Link href="/" className="mb-4 inline-block max-w-[140px] text-2xl font-bold lg:max-w-[180px]">
                                {(() => {
                                    const currentLogo = settings.config_sections.theme.logo_light;
                                    const displayUrl = currentLogo ? getDisplayUrl(currentLogo) : '';

                                    return displayUrl ? (
                                        <img
                                            key={`${currentLogo}-${Date.now()}`}
                                            src={displayUrl}
                                            alt={settings.organization_name || 'Sales Saas'}
                                            className="h-8 w-auto transition-all duration-200"
                                        />
                                    ) : (
                                        <div className="flex h-12 items-center text-lg font-semibold tracking-tight text-inherit">Sales Saas</div>
                                    );
                                })()}
                            </Link>
                            <p className="mb-8 leading-relaxed text-gray-400">
                                {sectionData.description ||
                                    t('Empowering businesses to boost sales and grow faster with our all-in-one Kakbima platform.')}
                            </p>

                            {/* Contact Info */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-400">{settings.contact_email}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-400">{settings.contact_phone}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <MapPin className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-400">{settings.contact_address}</span>
                                </div>
                            </div>
                        </div>

                        {/* Product Links */}
                        <div>
                            <h3 className="mb-4 font-semibold text-white">{sectionData.section_titles?.product || t('Product')}</h3>
                            <ul className="space-y-3">
                                {(footerLinks.product || []).map((link) => (
                                    <li key={link.name}>
                                        <a href={link.href} className="text-sm text-gray-400 transition-colors hover:text-white">
                                            {link.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Organization Links */}
                        <div>
                            <h3 className="mb-4 font-semibold text-white">{sectionData.section_titles?.organization || t('Organization')}</h3>
                            <ul className="space-y-3">
                                {(footerLinks.organization || []).map((link) => (
                                    <li key={link.name}>
                                        <a href={link.href} className="text-sm text-gray-400 transition-colors hover:text-white">
                                            {link.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Support Links */}
                        <div>
                            <h3 className="mb-4 font-semibold text-white">{sectionData.section_titles?.support || t('Support')}</h3>
                            <ul className="space-y-3">
                                {(footerLinks.support || []).map((link) => (
                                    <li key={link.name}>
                                        <a href={link.href} className="text-sm text-gray-400 transition-colors hover:text-white">
                                            {link.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Legal Links */}
                        <div>
                            <h3 className="mb-4 font-semibold text-white">{sectionData.section_titles?.legal || t('Legal')}</h3>
                            <ul className="space-y-3">
                                {(footerLinks.legal || []).map((link) => (
                                    <li key={link.name}>
                                        <a href={link.href} className="text-sm text-gray-400 transition-colors hover:text-white">
                                            {link.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Newsletter Section */}
                {(sectionData.newsletter_title || sectionData.newsletter_subtitle) && (
                    <div className="border-t border-gray-800 py-8 sm:py-12">
                        <div className="mx-auto max-w-2xl text-center">
                            <h3 className="mb-4 text-xl font-bold text-white">
                                {sectionData.newsletter_title || t('Stay Updated with Our Latest Features')}
                            </h3>
                            <p className="mb-6 text-gray-400">
                                {sectionData.newsletter_subtitle || t('Join our newsletter for product updates and networking tips')}
                            </p>
                            <form onSubmit={handleSubmit} className="mx-auto max-w-md">
                                <div className="mx-auto flex max-w-md flex-col gap-4 sm:flex-row">
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder={t('Enter your email')}
                                        className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-400 focus:border-gray-600 focus:ring-2 focus:ring-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                                        required
                                        disabled={processing}
                                        aria-label={t('Email address for newsletter subscription')}
                                        aria-describedby="newsletter-description"
                                    />
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex min-w-[120px] cursor-pointer items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                                        style={{ backgroundColor: brandColor }}
                                        aria-label={processing ? t('Subscribing to newsletter') : t('Subscribe to newsletter')}
                                    >
                                        {processing && (
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                        )}
                                        {processing ? t('Subscribing...') : t('Subscribe')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Bottom Footer */}
                <div className="border-t border-gray-800 py-4 sm:py-6">
                    <div className="flex flex-col items-center justify-between gap-3 sm:gap-4 md:flex-row">
                        {/* Copyright */}
                        <div className="text-sm text-gray-400">{sectionData.footerText}</div>

                        {/* Social Links */}
                        {socialLinks.length > 0 && (
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-400">{t('Follow us:')}</span>
                                <div className="flex gap-3">
                                    {socialLinks.map((social) => {
                                        const IconComponent = iconMap[social.icon] || Facebook;
                                        return (
                                            <a
                                                key={social.name}
                                                href={social.href}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-800 transition-colors hover:bg-gray-700"
                                                aria-label={social.name}
                                            >
                                                <IconComponent className="h-4 w-4 text-gray-400" />
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </footer>
    );
}
