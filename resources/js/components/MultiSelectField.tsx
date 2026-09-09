// components/multi-select-field.tsx

import { FormField } from '@/types/crud.d';
import SimpleMultiSelect from '@components/SimpleMultiSelect';
import { useTranslation } from 'react-i18next';

interface MultiSelectFieldProps {
    field: FormField;
    formData: Record<string, any>;
    handleChange: (name: string, value: any) => void;
}

export default function MultiSelectField({ field, formData, handleChange }: MultiSelectFieldProps) {
    const { t: translate } = useTranslation();
    // Ensure selected value is always an array of strings
    const selectedValues = Array.isArray(formData[field.name]) ? formData[field.name] : formData[field.name] ? [formData[field.name].toString()] : [];

    return (
        <SimpleMultiSelect
            options={field.options || []}
            selected={selectedValues}
            onChange={(selected) => {
                handleChange(field.name, selected);
            }}
            placeholder={field.placeholder || translate('Select one or more...')}
        />
    );
}
