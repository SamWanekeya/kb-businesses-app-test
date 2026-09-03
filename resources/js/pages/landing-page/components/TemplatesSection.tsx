import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Template {
    name: string;
    category: string;
}

interface TemplatesSectionProps {
    settings: any;
    sectionData: {
        title: string;
        subtitle: string;
        background_color: string;
        layout: string;
        columns: number;
        templates_list: Template[];
        cta_text: string;
        cta_link: string;
    };
    brandColor: string;
}

export default function TemplatesSection({ settings, sectionData, brandColor }: TemplatesSectionProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const sliderRef = useRef<HTMLDivElement>(null);

    const {
        title = 'Explore Our Templates',
        subtitle = 'Choose from our professionally designed templates to create your perfect digital business card.',
        background_color = '#f8fafc',
        layout = 'carousel', // Default to carousel
        columns = 3,
        templates_list = [],
        cta_text = 'View All Templates',
        cta_link = '#',
    } = sectionData || {};

    // Number of templates to show per slide
    const templatesPerSlide = 3;
    const totalSlides = Math.ceil(templates_list.length / templatesPerSlide);

    // Navigate to previous slide
    const prevSlide = () => {
        setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
    };

    // Navigate to next slide
    const nextSlide = () => {
        setCurrentSlide((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
    };

    // Update slider position when currentSlide changes
    useEffect(() => {
        if (sliderRef.current) {
            sliderRef.current.style.transform = `translateX(-${currentSlide * 100}%)`;
        }
    }, [currentSlide]);

    // Template card component
    const TemplateCard = ({ template, inSlider = false }: { template: Template; inSlider?: boolean }) => {
        return (
            <div className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md transition-transform hover:shadow-lg">
                <div className="relative h-80 overflow-hidden">
                    {/* Template Preview placeholder */}
                    <div className="h-full w-full overflow-hidden border-b border-gray-200 bg-gray-50">
                        <div className="flex h-full w-full items-center justify-center">
                            <div className="p-4 text-center">
                                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
                                    <span className="text-2xl font-semibold" style={{ color: brandColor }}>
                                        {template.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <h3 className="mb-2 text-lg font-medium capitalize">{template.name.replace(/-/g, ' ')}</h3>
                                <span
                                    className="inline-block rounded-full px-3 py-1 text-sm capitalize"
                                    style={{ backgroundColor: `${brandColor}15`, color: brandColor }}
                                >
                                    {template.category}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="border-t border-gray-100 p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <div className="mr-2 flex-1">
                            <h3 className="truncate text-lg font-semibold capitalize">{template.name.replace(/-/g, ' ')}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <span
                                className="inline-block rounded-full px-2 py-1 text-xs capitalize"
                                style={{ backgroundColor: `${brandColor}15`, color: brandColor }}
                            >
                                {template.category}
                            </span>
                            <button
                                className="cursor-pointer rounded-full border border-gray-200 bg-white p-1.5 shadow-sm transition-colors hover:bg-gray-50"
                                aria-label="Preview template"
                            >
                                <Eye className="h-3.5 w-3.5 text-gray-600" />
                            </button>
                        </div>
                    </div>
                    <p className="mb-2 line-clamp-2 text-sm text-gray-600">
                        {template.category === 'business'
                            ? 'Professional business card template'
                            : template.category === 'creative'
                              ? 'Creative and unique design'
                              : template.category === 'technology'
                                ? 'Modern tech-focused template'
                                : template.category === 'professional'
                                  ? 'Clean professional layout'
                                  : template.category === 'medical'
                                    ? 'Healthcare professional template'
                                    : template.category === 'food'
                                      ? 'Restaurant and food service template'
                                      : template.category === 'health'
                                        ? 'Health and wellness template'
                                        : template.category === 'beauty'
                                          ? 'Beauty and cosmetics template'
                                          : template.category === 'services'
                                            ? 'Service provider template'
                                            : template.category === 'leisure'
                                              ? 'Travel and leisure template'
                                              : template.category === 'entertainment'
                                                ? 'Entertainment industry template'
                                                : 'Professionally designed template'}
                    </p>
                </div>
            </div>
        );
    };

    return (
        <section id="templates" className="py-16 md:py-24" style={{ backgroundColor: background_color }}>
            <div className="mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-12 text-center">
                    <h2 className="mb-4 text-3xl font-bold md:text-4xl">{title}</h2>
                    <p className="mx-auto max-w-3xl text-lg text-gray-600">{subtitle}</p>
                </div>

                {/* Templates container based on layout */}
                {(layout === 'carousel' || layout === 'slider') && (
                    // Carousel/Slider layout
                    <div className="relative mb-12">
                        {/* Slider navigation */}
                        <div className="absolute top-1/2 left-0 z-10 -translate-x-6 -translate-y-1/2 transform">
                            <button
                                onClick={prevSlide}
                                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-white shadow-lg transition-colors hover:bg-gray-50"
                                aria-label="Previous slide"
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="absolute top-1/2 right-0 z-10 translate-x-6 -translate-y-1/2 transform">
                            <button
                                onClick={nextSlide}
                                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-white shadow-lg transition-colors hover:bg-gray-50"
                                aria-label="Next slide"
                            >
                                <ChevronRight className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Slider wrapper */}
                        <div className="overflow-hidden">
                            <div
                                ref={sliderRef}
                                className="flex transition-transform duration-500 ease-in-out"
                                style={{ width: `${totalSlides * 100}%` }}
                            >
                                {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                                    <div key={slideIndex} className="flex-shrink-0" style={{ width: `${100 / totalSlides}%` }}>
                                        <div className="grid grid-cols-1 gap-6 px-4 md:grid-cols-3">
                                            {templates_list
                                                .slice(slideIndex * templatesPerSlide, (slideIndex + 1) * templatesPerSlide)
                                                .filter((template) => template && template.name)
                                                .map((template, index) => (
                                                    <TemplateCard key={index} template={template} inSlider={true} />
                                                ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Slider pagination */}
                        <div className="mt-6 flex justify-center gap-2">
                            {Array.from({ length: totalSlides }).map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentSlide(index)}
                                    className={`h-2.5 w-2.5 cursor-pointer rounded-full transition-all ${currentSlide === index ? 'w-6 bg-gray-800' : 'bg-gray-300'}`}
                                    aria-label={`Go to slide ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {layout === 'grid' && (
                    // Grid layout
                    <div className="mb-12">
                        <div
                            className={`grid grid-cols-1 ${
                                columns === 1
                                    ? ''
                                    : columns === 2
                                      ? 'md:grid-cols-2'
                                      : columns === 3
                                        ? 'md:grid-cols-2 lg:grid-cols-3'
                                        : 'md:grid-cols-2 lg:grid-cols-4'
                            } gap-6`}
                        >
                            {templates_list
                                .filter((template) => template && template.name)
                                .map((template, index) => (
                                    <TemplateCard key={index} template={template} />
                                ))}
                        </div>
                    </div>
                )}

                {layout === 'list' && (
                    // List layout
                    <div className="mb-12">
                        <div className="space-y-6">
                            {templates_list
                                .filter((template) => template && template.name)
                                .map((template, index) => (
                                    <div
                                        key={index}
                                        className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-md transition-all hover:shadow-lg md:flex-row"
                                    >
                                        <div className="relative h-48 overflow-hidden md:h-72 md:w-2/5">
                                            {/* Template Preview placeholder */}
                                            <div className="h-full w-full overflow-hidden border-r border-gray-200 bg-gray-50">
                                                <div className="flex h-full w-full items-center justify-center">
                                                    <div className="p-4 text-center">
                                                        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
                                                            <span className="text-2xl font-semibold" style={{ color: brandColor }}>
                                                                {template.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <h3 className="mb-2 text-lg font-medium capitalize">{template.name.replace(/-/g, ' ')}</h3>
                                                        <span
                                                            className="inline-block rounded-full px-3 py-1 text-sm capitalize"
                                                            style={{ backgroundColor: `${brandColor}15`, color: brandColor }}
                                                        >
                                                            {template.category}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Preview button overlay */}
                                            <div className="bg-opacity-0 hover:bg-opacity-30 absolute inset-0 flex items-center justify-center bg-black opacity-0 transition-all hover:opacity-100">
                                                <button
                                                    className="cursor-pointer rounded-full bg-white p-2 shadow-sm transition-colors hover:bg-gray-50"
                                                    aria-label="Preview template"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-6 md:w-3/5">
                                            <div className="mb-2 flex items-center justify-between">
                                                <h3 className="text-xl font-semibold capitalize">{template.name.replace(/-/g, ' ')}</h3>
                                                <span
                                                    className="inline-block rounded-full px-2 py-1 text-xs capitalize"
                                                    style={{ backgroundColor: `${brandColor}15`, color: brandColor }}
                                                >
                                                    {template.category}
                                                </span>
                                            </div>
                                            <p className="mb-4 text-gray-600">
                                                {template.category === 'business'
                                                    ? 'Professional business card template'
                                                    : template.category === 'creative'
                                                      ? 'Creative and unique design'
                                                      : template.category === 'technology'
                                                        ? 'Modern tech-focused template'
                                                        : template.category === 'professional'
                                                          ? 'Clean professional layout'
                                                          : template.category === 'medical'
                                                            ? 'Healthcare professional template'
                                                            : template.category === 'food'
                                                              ? 'Restaurant and food service template'
                                                              : template.category === 'health'
                                                                ? 'Health and wellness template'
                                                                : template.category === 'beauty'
                                                                  ? 'Beauty and cosmetics template'
                                                                  : template.category === 'services'
                                                                    ? 'Service provider template'
                                                                    : template.category === 'leisure'
                                                                      ? 'Travel and leisure template'
                                                                      : template.category === 'entertainment'
                                                                        ? 'Entertainment industry template'
                                                                        : 'Professionally designed template'}
                                            </p>
                                            <button
                                                className="inline-flex cursor-pointer items-center text-sm font-medium transition-colors"
                                                style={{ color: brandColor }}
                                            >
                                                Preview Template
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="ml-1 h-4 w-4"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {cta_text && (
                    <div className="text-center">
                        <Link
                            href={cta_link}
                            className="inline-flex items-center justify-center rounded-md border border-transparent px-6 py-3 text-base font-medium text-white shadow-sm transition-opacity hover:opacity-90"
                            style={{ backgroundColor: brandColor }}
                        >
                            {cta_text}
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
}
