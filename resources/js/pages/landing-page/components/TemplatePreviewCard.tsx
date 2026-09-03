import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

interface TemplatePreviewCardProps {
    template: {
        name: string;
        category: string;
    };
    isSelected?: boolean;
    onClick?: () => void;
    previewButtonText?: string;
}

export default function TemplatePreviewCard({
    template,
    isSelected = false,
    onClick,
    previewButtonText = 'Preview Template',
}: TemplatePreviewCardProps) {
    // Format template name for display
    const displayName = template.name ? template.name.replace(/-/g, ' ') : '';
    const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

    return (
        <>
            <div
                className={`cursor-pointer overflow-hidden rounded-lg border transition-all ${isSelected ? 'ring-2 ring-green-500' : 'hover:border-gray-400'}`}
                onClick={onClick}
            >
                <div className="relative h-32 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                    {/* Template preview */}
                    <div className="flex h-full w-full items-center justify-center">
                        <div className="p-2 text-center">
                            <div className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                                <span className="text-base font-semibold" style={{ color: '#10b77f' }}>
                                    {template.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <h4 className="mb-1 truncate text-xs font-medium capitalize">{template.name.replace(/-/g, ' ')}</h4>
                            <span
                                className="inline-block rounded-full px-1.5 py-0.5 text-[10px] capitalize"
                                style={{ backgroundColor: '#10b77f15', color: '#10b77f' }}
                            >
                                {template.category}
                            </span>
                        </div>
                    </div>

                    {/* Preview button overlay */}
                    <div
                        className="bg-opacity-0 hover:bg-opacity-30 absolute inset-0 flex items-center justify-center bg-black opacity-0 transition-all hover:opacity-100"
                        onClick={(e) => {
                            e.stopPropagation();
                            // Preview functionality removed
                        }}
                    >
                        <Button size="sm" variant="secondary" className="bg-white text-xs shadow-sm hover:bg-gray-100">
                            <Eye className="mr-1 h-3 w-3" />
                            {previewButtonText}
                        </Button>
                    </div>
                </div>
                <div className="p-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium capitalize">{capitalizedName}</h4>
                        {isSelected && (
                            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="10"
                                    height="10"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-white"
                                >
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 capitalize">{template.category}</p>
                </div>
            </div>
        </>
    );
}
