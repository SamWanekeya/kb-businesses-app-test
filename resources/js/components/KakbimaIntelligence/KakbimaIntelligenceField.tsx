import { KakbimaIntelligenceButton } from '@components/KakbimaIntelligence/KakbimaIntelligenceButton';
import { KakbimaIntelligenceModal } from '@components/KakbimaIntelligence/KakbimaIntelligenceModal';
import { Input } from '@components/UserInterface/Input';
import { Textarea } from '@components/UserInterface/Textarea';
import { useState } from 'react';

interface KakbimaIntelligenceFieldProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: 'input' | 'textarea';
    rows?: number;
    className?: string;
    required?: boolean;
    disabled?: boolean;
    modalTitle?: string;
    modalPlaceholder?: string;
    buttonText?: string;
    buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost';
}

export function KakbimaIntelligenceField({
    value,
    onChange,
    placeholder,
    type = 'input',
    rows = 3,
    className = '',
    required = false,
    disabled = false,
    modalTitle = 'AI Content Generator',
    modalPlaceholder = 'Describe what you want to generate...',
    buttonText = 'Auto Generate',
    buttonVariant = 'outline',
}: KakbimaIntelligenceFieldProps) {
    const [showModal, setShowModal] = useState(false);

    const handleGenerate = (content: string) => {
        onChange(content);
        setShowModal(false);
    };

    const InputComponent = type === 'textarea' ? Textarea : Input;

    return (
        <>
            <div className={`flex gap-2 ${className}`}>
                <InputComponent
                    value={value}
                    onChange={(e: any) => {
                        onChange(e.target.value);
                    }}
                    placeholder={placeholder}
                    className="flex-1"
                    required={required}
                    disabled={disabled}
                    rows={type === 'textarea' ? rows : undefined}
                />
                <KakbimaIntelligenceButton
                    onClick={() => {
                        setShowModal(true);
                    }}
                    text={buttonText}
                    variant={buttonVariant}
                    className="shrink-0"
                />
            </div>

            <KakbimaIntelligenceModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                }}
                onGenerate={handleGenerate}
                title={modalTitle}
                placeholder={modalPlaceholder}
            />
        </>
    );
}
