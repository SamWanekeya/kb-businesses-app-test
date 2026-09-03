import { getDisplayUrl } from '@/utils/helper';
import { Award, Heart, Lightbulb, Shield, Star, Target, Users, Zap } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useScrollAnimation } from '../../../hooks/useScrollAnimation';

interface AboutUsProps {
    brandColor?: string;
    settings: any;
    sectionData: {
        title?: string;
        description?: string;
        story_title?: string;
        story_content?: string;
        layout?: 'image-left' | 'image-right' | 'centered';
        image_position?: 'left' | 'right' | 'background';
        stats?: Array<{
            value: string;
            label: string;
            color: string;
        }>;
        values?: Array<{
            title: string;
            description: string;
            icon: string;
        }>;
        image_title?: string;
        image_subtitle?: string;
        image_icon?: string;
        parallax?: boolean;
    };
}

// Icon mapping for dynamic icons
const iconMap: Record<string, React.ComponentType<any>> = {
    target: Target,
    heart: Heart,
    award: Award,
    lightbulb: Lightbulb,
    star: Star,
    shield: Shield,
    users: Users,
    zap: Zap,
};

export default function AboutUs({ settings, sectionData, brandColor = '#A12582' }: AboutUsProps) {
    const { t } = useTranslation();
    const { ref, isVisible } = useScrollAnimation();

    const sectionImage = getDisplayUrl(sectionData.image);
    const backgroundColor = sectionData.background_color || '#f9fafb';
    const layout = sectionData.layout || 'image-right';
    const imagePosition = sectionData.image_position || 'right';
    const parallax = sectionData.parallax === true;

    const parallaxRef = useRef<HTMLDivElement>(null);
    const [parallaxOffset, setParallaxOffset] = useState(0);

    useEffect(() => {
        if (!parallax || !sectionImage) return;
        const handleScroll = () => {
            if (!parallaxRef.current) return;
            const rect = parallaxRef.current.getBoundingClientRect();
            const center = rect.top + rect.height / 2 - window.innerHeight / 2;
            setParallaxOffset(center * 0.2);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, [parallax, sectionImage]);
    // Default data if none provided
    const defaultValues = [
        {
            icon: 'target',
            title: t('Our Mission'),
            description: t(
                'To revolutionize sales management by providing businesses with an all-in-one SaaS platform that simplifies, automates, and accelerates growth.',
            ),
        },
        {
            icon: 'heart',
            title: t('Our Values'),
            description: t('We believe in innovation, transparency, and empowering teams with tools that drive real business success.'),
        },
        {
            icon: 'award',
            title: t('Our Commitment'),
            description: t('Delivering exceptional user experience with robust technology, secure infrastructure, and world-class support.'),
        },
        {
            icon: 'lightbulb',
            title: t('Our Vision'),
            description: t('A future where every business can manage leads, deals, and customers seamlessly — unlocking their full sales potential.'),
        },
    ];

    const defaultStats = [
        { value: '4+ Years', label: t('Industry Experience'), color: 'blue' },
        { value: '10K+', label: t('Happy Users'), color: 'green' },
        { value: '5K+', label: t('Businesses Powered'), color: 'purple' },
    ];

    const values = sectionData.values && sectionData.values.length > 0 ? sectionData.values : defaultValues;

    const stats = sectionData.stats && sectionData.stats.length > 0 ? sectionData.stats : defaultStats;

    // Reusable image block
    const ImageBlock = () => (
        <div className="flex h-96 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white p-8">
            {sectionImage ? (
                <img
                    src={sectionImage}
                    alt={t('About Us')}
                    className="max-h-full max-w-full rounded-lg object-contain"
                    style={parallax ? { transform: `translateY(${parallaxOffset}px)`, transition: 'transform 0.1s linear' } : undefined}
                />
            ) : (
                <div className="text-center">
                    <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
                        <span className="text-3xl">{sectionData.image_icon || '🚀'}</span>
                    </div>
                    <h4 className="mb-2 text-xl font-semibold dark:text-gray-400">{sectionData.image_title || t('Innovation Driven')}</h4>
                    <p className="dark:text-gray-400">{sectionData.image_subtitle || t('Building the future of networking')}</p>
                </div>
            )}
        </div>
    );

    // Reusable text/stats block
    const TextBlock = ({ centered = false }: { centered?: boolean }) => (
        <div className={centered ? 'text-center' : ''}>
            <h3 className="mb-6 text-2xl font-bold dark:text-gray-400">{sectionData.story_title || t('Empowering Sales Teams Since 2020')}</h3>
            <div
                className="mb-8 leading-relaxed dark:text-gray-400"
                dangerouslySetInnerHTML={{
                    __html: (
                        sectionData.story_content ||
                        t(
                            'Founded by a group of sales professionals and technology experts, our Kakbima was created to solve the common challenges businesses face in managing leads, orders, invoices, and projects. Today, we power thousands of businesses worldwide with a reliable, scalable, and easy-to-use platform.',
                        )
                    ).replace(/\n/g, '</p><p className="mb-6">'),
                }}
            />
            {stats.length > 0 && (
                <div className={`flex items-center gap-8 ${centered ? 'justify-center' : ''}`}>
                    {stats.map((stat, index) => (
                        <div key={index} className="text-center">
                            <div className="text-2xl font-bold dark:text-gray-400">{stat.value}</div>
                            <div className="text-sm dark:text-gray-400">{stat.label}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    // Render the story section based on layout + image_position
    const renderStorySection = () => {
        // centered layout: image as background or stacked below text
        if (layout === 'centered') {
            if (imagePosition === 'background' && sectionImage) {
                return (
                    <div ref={parallaxRef} className="relative mb-8 overflow-hidden rounded-xl sm:mb-12 lg:mb-16">
                        <img
                            src={sectionImage}
                            alt="About Us"
                            className="h-96 w-full object-cover"
                            style={
                                parallax
                                    ? {
                                          transform: `translateY(${parallaxOffset}px)`,
                                          transition: 'transform 0.1s linear',
                                          height: '110%',
                                          top: '-5%',
                                          position: 'relative',
                                      }
                                    : undefined
                            }
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 p-8">
                            <div className="max-w-2xl text-center text-white">
                                <h3 className="mb-4 text-2xl font-bold">{sectionData.story_title || t('Empowering Sales Teams Since 2020')}</h3>
                                <div
                                    className="mb-6 leading-relaxed opacity-90"
                                    dangerouslySetInnerHTML={{
                                        __html: (
                                            sectionData.story_content ||
                                            t(
                                                'Founded by a group of sales professionals and technology experts, our Kakbima was created to solve the common challenges businesses face in managing leads, orders, invoices, and projects. Today, we power thousands of businesses worldwide with a reliable, scalable, and easy-to-use platform.',
                                            )
                                        ).replace(/\n/g, '</p><p className="mb-6">'),
                                    }}
                                />
                                {stats.length > 0 && (
                                    <div className="flex items-center justify-center gap-8">
                                        {stats.map((stat, index) => (
                                            <div key={index} className="text-center">
                                                <div className="text-2xl font-bold">{stat.value}</div>
                                                <div className="text-sm opacity-80">{stat.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            }
            return (
                <div className="mx-auto mb-8 max-w-3xl text-center sm:mb-12 lg:mb-16">
                    <TextBlock centered />
                    {(imagePosition === 'left' || imagePosition === 'right') && (
                        <div className="mt-8">
                            <ImageBlock />
                        </div>
                    )}
                </div>
            );
        }

        // image-left: image on left, text on right
        if (layout === 'image-left') {
            return (
                <div className="mb-8 grid items-center gap-8 sm:mb-12 sm:gap-12 lg:mb-16 lg:grid-cols-2 lg:gap-16">
                    {imagePosition === 'background' && sectionImage ? (
                        <div ref={parallaxRef} className="relative h-96 overflow-hidden rounded-xl">
                            <img
                                src={sectionImage}
                                alt="About Us"
                                className="w-full object-cover"
                                style={
                                    parallax
                                        ? {
                                              transform: `translateY(${parallaxOffset}px)`,
                                              transition: 'transform 0.1s linear',
                                              height: '120%',
                                              top: '-10%',
                                              position: 'relative',
                                          }
                                        : { height: '100%' }
                                }
                            />
                            <div className="absolute inset-0 rounded-xl bg-black/30" />
                        </div>
                    ) : (
                        <ImageBlock />
                    )}
                    <TextBlock />
                </div>
            );
        }

        // image-right (default): text on left, image on right
        return (
            <div className="mb-8 grid items-center gap-8 sm:mb-12 sm:gap-12 lg:mb-16 lg:grid-cols-2 lg:gap-16">
                <TextBlock />
                {imagePosition === 'background' && sectionImage ? (
                    <div ref={parallaxRef} className="relative h-96 overflow-hidden rounded-xl">
                        <img
                            src={sectionImage}
                            alt="About Us"
                            className="w-full object-cover"
                            style={
                                parallax
                                    ? {
                                          transform: `translateY(${parallaxOffset}px)`,
                                          transition: 'transform 0.1s linear',
                                          height: '120%',
                                          top: '-10%',
                                          position: 'relative',
                                      }
                                    : { height: '100%' }
                            }
                        />
                        <div className="absolute inset-0 rounded-xl bg-black/30" />
                    </div>
                ) : (
                    <ImageBlock />
                )}
            </div>
        );
    };

    return (
        <section id="about" className="py-12 sm:py-16 lg:py-20" style={{ backgroundColor }} ref={ref}>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div
                    className={`mb-8 text-center transition-all duration-700 sm:mb-12 lg:mb-16 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                >
                    <h2 className="mb-4 text-3xl font-bold md:text-4xl dark:text-gray-400">{sectionData.title || t('About Kakbima')}</h2>
                    <p className="mx-auto max-w-3xl text-lg leading-relaxed font-medium dark:text-gray-400">
                        {sectionData.description ||
                            t('We are dedicated to simplifying and automating the entire sales lifecycle for businesses of all sizes.')}
                    </p>
                </div>

                {renderStorySection()}

                {/* Values Grid */}
                <div
                    className={`grid grid-cols-1 gap-6 transition-all delay-500 duration-700 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                >
                    {values.map((value, index) => {
                        const IconComponent = iconMap[value.icon] || Target;
                        return (
                            <div key={index} className="rounded-xl border border-gray-200 bg-white p-6 text-center">
                                <div
                                    className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg"
                                    style={{ backgroundColor: `${brandColor}15` }}
                                >
                                    <IconComponent className="h-6 w-6" style={{ color: brandColor }} />
                                </div>
                                <h3 className="mb-3 text-lg font-semibold dark:text-gray-400">{value.title}</h3>
                                <p className="text-sm leading-relaxed dark:text-gray-400">{value.description}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
