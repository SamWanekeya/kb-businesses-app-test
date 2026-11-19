import { toast } from '@components/CustomToast';
import MediaPicker from '@components/MediaPicker';
import SettingsSection from '@components/SettingsSection';
import { Button } from '@components/UserInterface/Button';
import Input from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';

import { useBrand } from '@contexts/BrandContext';
import useTheme from '@hooks/useTheme';

import useEmailValidation from '@hooks/useEmailValidation';
import { router, usePage } from '@inertiajs/react';
import { resolveImageUrl } from '@utils/Helpers/Url';
import { route } from '@utils/Routes';
import { Appearance } from '@utils/Theme';

import { Building2, Check, Image as ImageIcon, Monitor, Moon, Sun } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import kakbimaIcon from '@images/logos/kakbima_icon.png';
import kakbimaLogoLight from '@images/logos/kakbima_logo.png';
import kakbimaLogoDark from '@images/logos/kakbima_logo_dark.png';

export interface BrandSettings {
    logo_light: string;
    logo_dark: string;
    favicon: string;
    theme_mode: Appearance;
    organization_name: string;
    organization_tax_id_pin_number: string;
    organization_phone_number: string;
    organization_email: string;
    organization_physical_address: string;
}

type OrganizationField = Pick<
    BrandSettings,
    'organization_name' | 'organization_tax_id_pin_number' | 'organization_phone_number' | 'organization_email' | 'organization_physical_address'
>;

type OrganizationFieldName = keyof OrganizationField;
type BrandAssetField = 'logo_light' | 'logo_dark' | 'favicon';
type BrandSettingsFieldName = keyof BrandSettings;

interface ThemeOption {
    value: Appearance;
    label: string;
    description: string;
    Icon: typeof Sun;
}

type FormErrors = Partial<Record<BrandSettingsFieldName, string>>;

/**
 * Laravel validation errors are keyed by the submitted field name.
 * Nested Inertia forms may prefix these keys with `settings.`.
 */
type ServerValidationErrors = Record<string, string>;

/**
 * Checks whether a validation error belongs to a known brand setting.
 *
 * This keeps server-provided field names from being treated as arbitrary
 * keys when updating the strongly typed form error state.
 */
function isBrandSettingsField(field: string): field is BrandSettingsFieldName {
    return [
        'logo_light',
        'logo_dark',
        'favicon',
        'theme_mode',
        'organization_name',
        'organization_tax_id_pin_number',
        'organization_phone_number',
        'organization_email',
        'organization_physical_address',
    ].includes(field);
}

/**
 * Converts Laravel validation errors into the field names used by
 * BrandSettings. Unrecognized fields are excluded from inline errors.
 */
function normalizeValidationErrors(validationErrors: ServerValidationErrors): FormErrors {
    const normalizedErrors: FormErrors = {};

    for (const [key, message] of Object.entries(validationErrors)) {
        const field = key.startsWith('settings.') ? key.slice('settings.'.length) : key;

        if (isBrandSettingsField(field)) {
            normalizedErrors[field] = message;
        }
    }

    return normalizedErrors;
}

const THEME_OPTIONS: ThemeOption[] = [
    {
        value: 'light',
        label: 'Light',
        description: 'Use a light appearance.',
        Icon: Sun,
    },
    {
        value: 'dark',
        label: 'Dark',
        description: 'Use a dark appearance.',
        Icon: Moon,
    },
    {
        value: 'system',
        label: 'System',
        description: 'Follow your device settings.',
        Icon: Monitor,
    },
];

const ORGANIZATION_FIELDS: {
    name: Exclude<OrganizationFieldName, 'organization_physical_address'>;
    label: string;
    type: 'text' | 'tel' | 'email';
    required?: boolean;
    inputMode?: 'text' | 'tel' | 'email';
}[] = [
    {
        name: 'organization_name',
        label: 'Organization name',
        type: 'text',
        required: true,
    },
    {
        name: 'organization_tax_id_pin_number',
        label: 'Tax ID/PIN number',
        type: 'text',
    },
    {
        name: 'organization_phone_number',
        label: 'Phone number',
        type: 'tel',
        inputMode: 'tel',
    },
    {
        name: 'organization_email',
        label: 'Email',
        type: 'email',
        inputMode: 'email',
    },
];

/**
 * BrandSettings
 *
 * Configures organization identity, brand assets, and appearance preferences.
 *
 * Responsibilities:
 * - Manage editable organization details and branding settings.
 * - Preview theme changes before explicitly saving the settings form.
 * - Update selected brand assets through the existing brand context.
 * - Persist settings through the existing Inertia endpoint.
 * - Display client-side and server-side validation errors consistently.
 *
 * State:
 * - `form` is the source of truth for editable settings and asset previews.
 * - `saving` tracks the lifecycle of the Inertia submission.
 * - `errors` contains normalized validation errors for individual fields.
 * - Server-provided settings are synchronized when they change, except
 *   while a save is in progress.
 *
 * Accessibility:
 * - Uses semantic sections and explicitly labelled form controls.
 * - Exposes theme selection through `aria-pressed`.
 * - Provides descriptive alternative text for brand asset previews.
 * - Associates field errors with their respective input controls.
 * - Retains visible keyboard focus indicators.
 *
 * Performance:
 * - Memoizes normalized initial settings.
 * - Uses stable callbacks for state transitions and submission.
 * - Avoids redundant state for individual asset previews.
 *
 * Extension points:
 * - Additional organization fields can be registered in
 *   `ORGANIZATION_FIELDS`.
 * - Theme options can be extended through `THEME_OPTIONS`.
 */
export default function BrandSettings() {
    const { auth, userSettings, globalSettings } = usePage().props;
    const userType = auth?.user?.type;

    const { t: translate } = useTranslation();
    const { updateBrandSettings } = useBrand();
    const theme = useTheme();
    const validateEmail = useEmailValidation();

    const initialSettings = useMemo<BrandSettings>(() => {
        const settings = userSettings || globalSettings || {};

        return {
            logo_light: settings.logo_light || '',
            logo_dark: settings.logo_dark || '',
            favicon: settings.favicon || '',
            theme_mode: settings.theme_mode || 'system',
            organization_name: settings.organization_name || '',
            organization_tax_id_pin_number: settings.organization_tax_id_pin_number || '',
            organization_phone_number: settings.organization_phone_number || '',
            organization_email: settings.organization_email || '',
            organization_physical_address: settings.organization_physical_address || '',
        };
    }, [userSettings, globalSettings]);

    const [form, setForm] = useState<BrandSettings>(initialSettings);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});

    /**
     * Synchronizes field validation results with the parent error state.
     *
     * A successful client-side validation clears only the current field's
     * error, leaving validation errors on other fields untouched.
     */
    const handleFieldValidate = useCallback((field: BrandSettingsFieldName, valid: boolean, message: string | null) => {
        setErrors((current) => {
            if (valid || message === null) {
                if (!(field in current)) {
                    return current;
                }

                const next = { ...current };
                delete next[field];

                return next;
            }

            if (current[field] === message) {
                return current;
            }

            return {
                ...current,
                [field]: message,
            };
        });
    }, []);

    useEffect(() => {
        if (saving) {
            return;
        }

        setForm(initialSettings);
        setErrors({});
    }, [initialSettings, saving]);

    const isDirty = useMemo(
        () =>
            Object.keys(initialSettings).some((key) => {
                const field = key as BrandSettingsFieldName;

                return form[field] !== initialSettings[field];
            }),
        [form, initialSettings],
    );

    /**
     * Updates an organization field and clears its previous validation error.
     * The Input component reports the new validation result immediately
     * after the value changes.
     */
    const handleOrganizationChange = useCallback((field: OrganizationFieldName, value: string) => {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    }, []);

    const handleFile = useCallback(
        (url: string, field: BrandAssetField) => {
            setForm((previous) => ({
                ...previous,
                [field]: url,
            }));

            updateBrandSettings({ [field]: url });
        },
        [updateBrandSettings],
    );

    const handleThemePreview = useCallback(
        (mode: Appearance) => {
            setForm((previous) => ({
                ...previous,
                theme_mode: mode,
            }));

            theme.setMode(mode, false);
        },
        [theme],
    );

    const save = useCallback(() => {
        if (saving) {
            return;
        }

        /**
         * Validate every organization field before submitting.
         *
         * This mirrors the existing Input validation rules without modifying
         * the reusable Input component. Validation results are collected first
         * so every invalid field can display its error simultaneously.
         */
        if (userType === 'organization') {
            const validationErrors: FormErrors = {};

            for (const field of ORGANIZATION_FIELDS) {
                const value = form[field.name];

                if (field.required && !value.trim()) {
                    validationErrors[field.name] = translate('This field is required');

                    continue;
                }

                if (value.length > 0 && field.type === 'text') {
                    if (value.length > 255) {
                        validationErrors[field.name] = translate('The maximum characters allowed for the name field is 255');

                        continue;
                    }

                    if (value.length < 2) {
                        validationErrors[field.name] = translate('Are you sure you entered the name correctly?');

                        continue;
                    }
                }

                if (field.type === 'email' && value.length > 0) {
                    const result = validateEmail(value);

                    if (!result.valid) {
                        validationErrors[field.name] = result.message ?? translate('Please provide a valid email address');
                    }
                }
            }

            if (Object.keys(validationErrors).length > 0) {
                setErrors((current) => ({
                    ...current,
                    ...validationErrors,
                }));

                return;
            }
        }

        setSaving(true);

        const toastId = toast.loading(translate('Saving brand settings...'));

        router.post(
            route('settings.brand.update'),
            { settings: form },
            {
                preserveScroll: true,

                onSuccess: () => {
                    setErrors({});
                    theme.setMode(form.theme_mode, true);
                },

                onError: (validationErrors) => {
                    const serverErrors = normalizeValidationErrors(validationErrors as ServerValidationErrors);

                    setErrors((current) => ({
                        ...current,
                        ...serverErrors,
                    }));

                    Object.values(validationErrors).forEach((message) => {
                        if (message) {
                            toast.error(translate(message));
                        }
                    });
                },

                onFinish: () => {
                    setSaving(false);
                    toast.dismiss(toastId);
                },
            },
        );
    }, [form, saving, theme, translate, userType, validateEmail]);

    const lightLogoPreview = resolveImageUrl(form.logo_light) || kakbimaLogoLight;

    const darkLogoPreview = resolveImageUrl(form.logo_dark) || kakbimaLogoDark;

    const faviconPreview = resolveImageUrl(form.favicon) || kakbimaIcon;

    return (
        <SettingsSection
            title={translate('Branding')}
            description={translate(
                'Manage your organization details and branding elements that appear on quotes, invoices, sales orders, and other organization-related documents.',
            )}
            action={
                <div className="flex items-center gap-3">
                    {isDirty && (
                        <span className="text-foreground/75 hidden text-sm sm:inline" role="status">
                            {translate('Unsaved changes')}
                        </span>
                    )}

                    <Button size="lg" onClick={save} disabled={saving} aria-busy={saving}>
                        {saving ? translate('Saving...') : translate('Save')}
                    </Button>
                </div>
            }
        >
            <div className="border-border border-t pb-6" />

            <div className="space-y-10">
                {userType === 'organization' && (
                    <section aria-labelledby="organization-details-heading" className="space-y-5">
                        <div className="flex items-start gap-3">
                            <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
                                <Building2 className="text-foreground/75 size-5" aria-hidden="true" />
                            </div>

                            <div className="min-w-0 space-y-1">
                                <h3 id="organization-details-heading" className="text-base font-semibold tracking-tight">
                                    {translate('Organization details')}
                                </h3>

                                <p className="text-foreground/75 text-sm">
                                    {translate('Keep your organization information accurate across official documents.')}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2">
                            {ORGANIZATION_FIELDS.map((field) => {
                                const error = errors[field.name];
                                const errorId = `${field.name}-error`;

                                return (
                                    <div key={field.name} className="grid content-start gap-2">
                                        <Input
                                            inputIdentifier={field.name}
                                            inputType={field.type}
                                            inputMode={field.inputMode ?? 'text'}
                                            label={translate(field.label)}
                                            name={field.name}
                                            value={form[field.name]}
                                            required={field.required}
                                            error={error}
                                            onChange={(event) => handleOrganizationChange(field.name, event.currentTarget.value)}
                                            onValidate={(valid, message) => handleFieldValidate(field.name, valid, message)}
                                            aria-invalid={Boolean(error)}
                                            aria-describedby={error ? errorId : undefined}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="organization_physical_address">{translate('Physical address')}</Label>

                            <textarea
                                id="organization_physical_address"
                                name="organization_physical_address"
                                value={form.organization_physical_address}
                                onChange={(event) => handleOrganizationChange('organization_physical_address', event.currentTarget.value)}
                                aria-invalid={Boolean(errors.organization_physical_address)}
                                aria-describedby={errors.organization_physical_address ? 'organization_physical_address-error' : undefined}
                                rows={3}
                                className="border-input bg-background placeholder:text-foreground/75 focus-visible:ring-ring w-full resize-y rounded-md border px-3 py-2 text-sm shadow-xs transition-[border-color,box-shadow] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                            />

                            {errors.organization_physical_address && (
                                <p id="organization_physical_address-error" role="alert" className="text-destructive text-sm">
                                    {translate(errors.organization_physical_address)}
                                </p>
                            )}
                        </div>
                    </section>
                )}

                <section aria-labelledby="appearance-heading" className="space-y-5">
                    <div className="flex items-start gap-3">
                        <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
                            <Monitor className="text-foreground/75 size-5" aria-hidden="true" />
                        </div>

                        <div className="min-w-0 space-y-1">
                            <h3 id="appearance-heading" className="text-base font-semibold tracking-tight">
                                {translate('Appearance')}
                            </h3>

                            <p className="text-foreground/75 text-sm">{translate('Choose how the application should look on your device.')}</p>
                        </div>
                    </div>

                    <div role="group" aria-label={translate('Appearance preference')} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {THEME_OPTIONS.map(({ value, label, description, Icon }) => {
                            const selected = form.theme_mode === value;

                            return (
                                <Button
                                    key={value}
                                    type="button"
                                    variant="outline"
                                    aria-pressed={selected}
                                    onClick={() => handleThemePreview(value)}
                                    className={[
                                        'h-auto min-h-28 w-full items-start justify-start gap-3 rounded-xl p-4 text-left whitespace-normal',
                                        'transition-colors motion-reduce:transition-none',
                                        'hover:border-primary/50',
                                        selected ? 'border-primary bg-primary/5 ring-primary/20 ring-1' : 'border-border bg-card',
                                    ].join(' ')}
                                >
                                    <span
                                        className={[
                                            'flex size-9 shrink-0 items-center justify-center rounded-lg',
                                            selected ? 'bg-primary/10 text-primary' : 'bg-muted text-foreground/75',
                                        ].join(' ')}
                                    >
                                        <Icon className="size-4" aria-hidden="true" />
                                    </span>

                                    <span className="min-w-0 flex-1 space-y-1">
                                        <span className="flex items-center justify-between gap-2">
                                            <span className="font-medium">{translate(label)}</span>

                                            {selected && <Check className="text-primary size-4 shrink-0" aria-hidden="true" />}
                                        </span>

                                        <span className="text-foreground/75 block text-xs leading-relaxed">{translate(description)}</span>
                                    </span>
                                </Button>
                            );
                        })}
                    </div>
                </section>

                {userType === 'organization' && (
                    <section aria-labelledby="brand-assets-heading" className="space-y-5">
                        <div className="flex items-start gap-3">
                            <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
                                <ImageIcon className="text-foreground/75 size-5" aria-hidden="true" />
                            </div>

                            <div className="min-w-0 space-y-1">
                                <h3 id="brand-assets-heading" className="text-base font-semibold tracking-tight">
                                    {translate('Brand assets')}
                                </h3>

                                <p className="text-foreground/75 text-sm">
                                    {translate('Upload the logos and favicon used throughout your organization’s workspace and documents.')}
                                </p>
                            </div>
                        </div>

                        <div className="border-border border-t" />

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                            <article className="bg-card min-w-0 space-y-4">
                                <div className="space-y-1">
                                    <h4 className="text-sm">{translate('Light mode logo')}</h4>

                                    <p className="text-foreground/75 text-xs">{translate('Displayed against light backgrounds.')}</p>
                                </div>

                                <div className="flex h-36 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-white p-5">
                                    <img
                                        src={lightLogoPreview}
                                        alt={translate('Light mode logo preview')}
                                        className="max-h-full max-w-full object-contain"
                                        loading="lazy"
                                    />
                                </div>

                                <MediaPicker value={form.logo_light} onChange={(url) => handleFile(url, 'logo_light')} showPreview={false} />
                            </article>

                            <article className="bg-card min-w-0 space-y-4">
                                <div className="space-y-1">
                                    <h4 className="text-sm">{translate('Dark mode logo')}</h4>

                                    <p className="text-foreground/75 text-xs">{translate('Displayed against dark backgrounds.')}</p>
                                </div>

                                <div className="flex h-36 items-center justify-center overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                                    <img
                                        src={darkLogoPreview}
                                        alt={translate('Dark mode logo preview')}
                                        className="max-h-full max-w-full object-contain"
                                        loading="lazy"
                                    />
                                </div>

                                <MediaPicker value={form.logo_dark} onChange={(url) => handleFile(url, 'logo_dark')} showPreview={false} />
                            </article>

                            <article className="bg-card min-w-0 space-y-4">
                                <div className="space-y-1">
                                    <h4 className="text-sm">{translate('Favicon')}</h4>

                                    <p className="text-foreground/75 text-xs">{translate('The small icon shown in browser tabs.')}</p>
                                </div>

                                <div className="bg-muted/30 flex h-36 items-center justify-center overflow-hidden rounded-lg border p-5">
                                    <div className="bg-background flex size-20 items-center justify-center rounded-xl border shadow-xs">
                                        <img
                                            src={faviconPreview}
                                            alt={translate('Favicon preview')}
                                            className="size-12 object-contain"
                                            loading="lazy"
                                        />
                                    </div>
                                </div>

                                <MediaPicker value={form.favicon} onChange={(url) => handleFile(url, 'favicon')} showPreview={false} />
                            </article>
                        </div>
                    </section>
                )}
            </div>
        </SettingsSection>
    );
}
