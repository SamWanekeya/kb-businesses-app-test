import { getDisplayUrl } from '@/utils/helper';
import { Link } from '@inertiajs/react';
import { Linkedin, Mail, Twitter } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface TeamSectionProps {
    brandColor?: string;
    settings?: any;
    sectionData?: {
        title?: string;
        subtitle?: string;
        members?: Array<{
            name: string;
            role: string;
            bio: string;
            image?: string;
            linkedin?: string;
            twitter?: string;
            email?: string;
        }>;
        cta_title?: string;
        cta_description?: string;
        cta_button_text?: string;
    };
}

export default function TeamSection({ settings, sectionData, brandColor = '#A12582' }: TeamSectionProps) {
    const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());

    const handleImgError = (index: number) => {
        setImgErrors((prev) => new Set(prev).add(index));
    };
    const { t } = useTranslation();
    const defaultMembers = [
        {
            name: 'Sarah Johnson',
            role: t('CEO & Founder'),
            bio: t('Sales strategist and former tech executive with 15+ years of experience in scaling SaaS organizations.'),
            image: '',
            linkedin: '#',
            email: 'sarah@sales.com',
        },
        {
            name: 'Michael Lee',
            role: t('CTO'),
            bio: t('Full-stack engineer specializing in Laravel and React with a passion for building scalable SaaS platforms.'),
            image: '',
            linkedin: '#',
            email: 'michael@sales.com',
        },
        {
            name: 'Priya Sharma',
            role: t('Head of Product'),
            bio: t('Product leader focused on delivering user-friendly sales solutions that solve real-world challenges.'),
            image: '',
            linkedin: '#',
            email: 'priya@sales.com',
        },
        {
            name: 'David Kim',
            role: t('Head of Marketing'),
            bio: t('Growth marketer with expertise in SaaS positioning, customer acquisition, and brand strategy.'),
            image: '',
            linkedin: '#',
            email: 'david@sales.com',
        },
    ];

    const teamMembers = sectionData?.members && sectionData.members.length > 0 ? sectionData.members : defaultMembers;

    return (
        <section className="bg-white py-12 sm:py-16 lg:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-8 text-center sm:mb-12 lg:mb-16">
                    <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">{sectionData?.title || t('Meet Our Team')}</h2>
                    <p className="mx-auto max-w-3xl text-lg leading-relaxed font-medium text-gray-600">
                        {sectionData?.subtitle ||
                            t('We are a passionate group of sales experts, developers, and innovators building the future of sales automation.')}
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
                    {teamMembers.map((member, index) => (
                        <div key={index} className="rounded-xl border border-gray-200 bg-gray-50 p-6 transition-colors hover:border-gray-300">
                            {/* Profile Image */}
                            <div
                                className="mx-auto mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full"
                                style={{ backgroundColor: brandColor }}
                            >
                                {member?.image && !imgErrors.has(index) ? (
                                    <img
                                        src={getDisplayUrl(member.image)}
                                        alt={member?.name || 'Team Member'}
                                        className="h-full w-full object-cover"
                                        onError={() => handleImgError(index)}
                                    />
                                ) : (
                                    <span className="text-lg font-bold text-white">
                                        {member.name
                                            .split(' ')
                                            .map((n) => n[0])
                                            .join('')}
                                    </span>
                                )}
                            </div>

                            {/* Member Info */}
                            <div className="text-center">
                                <h3 className="mb-1 text-lg font-semibold text-gray-900">{member.name}</h3>
                                <p className="mb-3 font-medium text-gray-700">{member.role}</p>
                                <p className="mb-4 text-sm leading-relaxed text-gray-600">{member.bio}</p>

                                {/* Social Links */}
                                <div className="flex justify-center gap-2">
                                    {member.linkedin && (
                                        <a
                                            href={member.linkedin}
                                            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white transition-colors hover:border-gray-300"
                                        >
                                            <Linkedin className="h-4 w-4 text-gray-600" />
                                        </a>
                                    )}
                                    {member.twitter && (
                                        <a
                                            href={member.twitter}
                                            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white transition-colors hover:border-gray-300"
                                        >
                                            <Twitter className="h-4 w-4 text-gray-600" />
                                        </a>
                                    )}
                                    {member.email && (
                                        <a
                                            href={`mailto:${member.email}`}
                                            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white transition-colors hover:border-gray-300"
                                        >
                                            <Mail className="h-4 w-4 text-gray-600" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Join Team CTA */}
                {(sectionData?.cta_title || sectionData?.cta_description || sectionData?.cta_button_text) && (
                    <div className="mt-8 text-center sm:mt-12 lg:mt-16">
                        <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-gray-50 p-8">
                            <h3 className="mb-4 text-2xl font-bold text-gray-900">{sectionData?.cta_title || t('Want to Join Our Team?')}</h3>
                            <p className="mb-6 text-gray-600">
                                {sectionData?.cta_description ||
                                    t('We are always looking for talented individuals to help us shape the next generation of sales technology.')}
                            </p>
                            <Link
                                href={'#contact'}
                                className="inline-flex items-center rounded-lg border px-8 py-3 font-semibold transition-all"
                                style={{ backgroundColor: brandColor, color: 'white', borderColor: brandColor }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'white';
                                    e.currentTarget.style.color = brandColor;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = brandColor;
                                    e.currentTarget.style.color = 'white';
                                }}
                            >
                                {sectionData?.cta_button_text || 'View Open Positions'}
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
