import React from 'react';

import { Input } from '@components/UserInterface/Input';
import { format } from 'date-fns';

interface DatePickerProps {
    selected?: Date;
    onSelect?: (date: Date | undefined) => void;
    onChange?: (date: Date | undefined) => void;
    placeholder?: string;
    disabled?: boolean;
}

export default function DatePicker({ selected, onSelect, onChange, disabled = false }: DatePickerProps) {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [date, setDate] = React.useState(selected ? format(selected, 'yyyy-MM-dd') : '');

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDate(e.target.value);

        if (e.target.value) {
            const newDate = new Date(e.target.value);
            if (onSelect) onSelect(newDate);
            if (onChange) onChange(newDate);
        } else {
            if (onSelect) onSelect(undefined);
            if (onChange) onChange(undefined);
        }
    };

    React.useEffect(() => {
        if (selected) {
            setDate(format(selected, 'yyyy-MM-dd'));
        } else {
            setDate('');
        }
    }, [selected]);

    const openPicker = () => {
        if (!disabled && inputRef.current) {
            inputRef.current.showPicker();
            inputRef.current.focus();
        }
    };

    return (
        <div className="relative cursor-pointer" onClick={openPicker}>
            <Input
                ref={inputRef}
                type="date"
                value={date}
                onChange={handleDateChange}
                className="border-input bg-background ring-offset-background w-[240px] cursor-pointer pl-9"
                disabled={disabled}
            />
        </div>
    );
}
