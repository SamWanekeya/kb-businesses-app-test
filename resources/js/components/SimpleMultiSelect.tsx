// components/simple-multi-select.tsx
import { useEffect, useRef, useState } from 'react';

import { Badge } from '@components/UserInterface/Badge';
import { X } from 'lucide-react';

type Option = {
    value: string;
    label: string;
};

type MultiSelectProps = {
    options: Option[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    className?: string;
};

export default function SimpleMultiSelect({ options, selected, onChange, className }: MultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Handle click outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelect = (value: string) => {
        if (!selected.includes(value)) {
            onChange([...selected, value]);
        }
        setSearchTerm('');
    };

    const handleRemove = (value: string) => {
        onChange(selected.filter((item) => item !== value));
    };

    const filteredOptions = options.filter(
        (option) => !selected.includes(option.value) && option.label.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    return (
        <div ref={containerRef} className={className ?? ''}>
            {/* Input trigger */}
            <div
                className="flex min-h-[38px] cursor-text flex-wrap gap-1 rounded-md border p-2"
                onClick={() => {
                    setIsOpen(true);
                }}
            >
                {selected.map((value) => {
                    const option = options.find((o) => o.value === value);
                    return (
                        <Badge key={value} variant="secondary" className="rounded-sm px-1 font-normal">
                            {option?.label || value}
                            <button
                                type="button"
                                className="ml-1 rounded-sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemove(value);
                                }}
                            >
                                <X className="text-muted-foreground hover:text-foreground h-3 w-3" />
                            </button>
                        </Badge>
                    );
                })}
                <input
                    type="text"
                    inputMode="text"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                    }}
                    onFocus={() => {
                        setIsOpen(true);
                    }}
                    className="min-w-[50px] flex-1 bg-transparent outline-none"
                />
            </div>

            {isOpen && filteredOptions.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-[200px] w-full overflow-y-auto rounded-md border bg-white shadow-lg">
                    <div className="mt-1 w-full rounded-md border border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
                        {filteredOptions.map((option) => (
                            <div
                                key={option.value}
                                className="cursor-pointer px-3 py-2 text-sm text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleSelect(option.value);
                                }}
                            >
                                {option.label}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
