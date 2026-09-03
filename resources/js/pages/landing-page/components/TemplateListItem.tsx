import { Button } from '@/components/ui/button';
import { Layout, Trash2 } from 'lucide-react';

interface TemplateListItemProps {
    template: {
        name: string;
        category: string;
    };
    onRemove: () => void;
}

export default function TemplateListItem({ template, onRemove }: TemplateListItemProps) {
    // Format template name for display
    const displayName = template.name ? template.name.replace(/-/g, ' ') : '';
    const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

    return (
        <div className="flex items-center justify-between rounded-lg border bg-gray-50 p-3">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
                    <Layout className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                    <h5 className="font-medium capitalize">{capitalizedName}</h5>
                    <p className="text-xs text-gray-500 capitalize">{template.category}</p>
                </div>
            </div>
            <Button type="button" variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={onRemove}>
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
}
