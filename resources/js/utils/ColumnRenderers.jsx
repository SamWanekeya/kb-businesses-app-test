import { Badge } from '@/components/UserInterface/Badge';
import { Switch } from '@/components/UserInterface/Switch';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';

/**
 * Predefined column renderers for tables.
 * Each function returns a render function that receives (value, row).
 */
export const columnRenderers = {
    /**
     * Renders a status as a colored badge.
     * Handles boolean and string statuses.
     */
    status:
        (translate, colorMap = {}, defaultColor = 'bg-neutral-100 text-neutral-800') =>
        (value) => {
            if (value === null || value === undefined) return <span>-</span>;

            if (typeof value === 'boolean') {
                return (
                    <Badge className={cn('capitalize', value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                        {value ? translate('Active') : translate('Inactive')}
                    </Badge>
                );
            }

            const color = colorMap[value] || defaultColor;
            return <Badge className={cn('capitalize', color)}>{value}</Badge>;
        },

    /**
     * Renders an image thumbnail or a fallback message.
     */
    image:
        (translate, className = 'h-16 w-20 rounded-md object-cover shadow-sm', fallbackSrc = 'https://placehold.co/200x150?text=Image+Not+Found') =>
        (value) => {
            if (!value) return <div className="text-center text-neutral-400">{translate('No image')}</div>;

            const imageSrc = typeof value === 'string' && value.startsWith('http') ? value : `/storage/${value}`;
            return (
                <div className="flex justify-center">
                    <img
                        src={imageSrc}
                        alt="Thumbnail"
                        className={className}
                        onError={(e) => {
                            e.currentTarget.src = fallbackSrc;
                        }}
                    />
                </div>
            );
        },

    /**
     * Renders a numeric value as a formatted price.
     */
    price:
        (currency = 'USD', locale = 'en-US') =>
        (value) => {
            if (value === null || value === undefined) return <span>-</span>;
            const numValue = typeof value === 'string' ? parseFloat(value) : value;
            return <span className="text-sm font-medium">{numValue.toLocaleString(locale, { style: 'currency', currency })}</span>;
        },

    /**
     * Renders a date, optionally including time.
     */
    date:
        (includeTime = false) =>
        (value) => {
            if (!value) return <span>-</span>;

            try {
                if (typeof window !== 'undefined' && window.hfSettings) {
                    const formatted = window.hfSettings.formatDateTime(value, false);
                    return <span className="text-sm">{formatted}</span>;
                }
                const date = new Date(value);
                const options = includeTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' };
                return <span className="text-sm">{date.toLocaleDateString('en-US', options)}</span>;
            } catch {
                return <span className="text-sm">{value}</span>;
            }
        },

    /**
     * Renders a boolean as "Yes" or "No".
     */
    boolean: (translate) => (value) => <span>{value ? translate('Yes') : translate('No')}</span>,

    /**
     * Displays a related field from the row object.
     */
    relation: (field) => (value, row) => {
        if (!row) return <span>-</span>;
        return row[field] ? <span>{row[field]}</span> : <span>-</span>;
    },

    /**
     * Renders a value as a clickable link.
     */
    link:
        (getUrl, className = 'text-blue-600 hover:underline', newTab = false) =>
        (value, row) => {
            if (!value) return <span>-</span>;
            const url = typeof getUrl === 'function' ? getUrl(row) : getUrl.replace(':id', row.id);
            return (
                <Link href={url} className={className} target={newTab ? '_blank' : undefined}>
                    {value}
                </Link>
            );
        },

    /**
     * Renders a button inside a table cell.
     */
    button:
        (label, getUrl, className = 'px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600', newTab = false) =>
        (value, row) => {
            const url = typeof getUrl === 'function' ? getUrl(row) : getUrl.replace(':id', row.id);
            return (
                <Link href={url} className={className} target={newTab ? '_blank' : undefined}>
                    {label}
                </Link>
            );
        },

    /**
     * Renders a toggle switch for boolean values.
     */
    switch:
        (onToggle, disabled = false) =>
        (value, row) => {
            const handleToggle = () => {
                if (!disabled && onToggle) {
                    onToggle(row.id, !value);
                }
            };

            return (
                <div className="flex items-center justify-center">
                    <Switch key="switch" checked={!!value} onCheckedChange={handleToggle} disabled={disabled} />
                </div>
            );
        },
};
