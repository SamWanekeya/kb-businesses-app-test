// components/simple-multi-select.tsx
import { Badge } from '@components/UserInterface/badge';
import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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

export function SimpleMultiSelect({ options, selected, onChange, placeholder = 'Select options', className }: MultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Handle click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Handle selection
    const handleSelect = (value: string) => {
        if (!selected.includes(value)) {
            onChange([...selected, value]);
        }
        setSearchTerm('');
        // Keep focus on the input
        setTimeout(() => {
            const input = containerRef.current?.querySelector('input');
            if (input) input.focus();
        }, 10);
    };

    // Handle removal
    const handleRemove = (value: string) => {
        onChange(selected.filter((item) => item !== value));
    };

    // Filter options based on search term
    const filteredOptions = options.filter(
        (option) =>
            // Allow showing already selected options when searching
            (searchTerm || !selected.includes(option.value)) && option.label.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <div className="flex min-h-[38px] cursor-text flex-wrap gap-1 rounded-md border p-2" onClick={() => setIsOpen(true)}>
                {selected.map((value) => {
                    const option = options.find((o) => o.value === value);
                    return (
                        <Badge key={value} variant="secondary" className="rounded-sm px-1 font-normal">
                            {option?.label || value}
                            <button
                                type="button"
                                className="ml-1 cursor-pointer rounded-sm"
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
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    placeholder={selected.length === 0 ? placeholder : ''}
                    className="min-w-[50px] flex-1 bg-transparent outline-none"
                />
            </div>

            {isOpen && filteredOptions.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-[200px] w-full overflow-y-auto rounded-md border bg-white shadow-lg">
                    {filteredOptions.map((option) => (
                        <div
                            key={option.value}
                            className="cursor-pointer px-3 py-2 hover:bg-gray-100"
                            onClick={() => {
                                handleSelect(option.value);
                                setIsOpen(true); // Keep dropdown open after selection
                            }}
                        >
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
