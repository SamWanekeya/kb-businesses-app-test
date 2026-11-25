import { toast } from '@components/CustomToast';
import SettingsSection from '@components/SettingsSection';
import { Button } from '@components/UserInterface/Button';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/UserInterface/Select';
import { Switch } from '@components/UserInterface/Switch';
import { router, usePage } from '@inertiajs/react';
import { cn } from '@lib/utils';
import { route } from '@utils/Routes';
import { Check, Coins, ListFilter, SlidersHorizontal, Wallet } from 'lucide-react';
import { ComponentProps, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Currency {
    id: number;
    name: string;
    code: string;
    symbol: string;
    description?: string;
    is_default: boolean;
}

type CurrencySettingsData = {
    decimal_format: number;
    default_currency: string;
    decimal_separator: '.' | ',';
    thousands_separator: ',' | '.' | ' ' | 'none';
    float_number: number;
    currency_symbol_space: number;
    currency_symbol_position: 'before' | 'after';
};

type CurrencySettingUpdate = {
    [K in keyof CurrencySettingsData]: {
        field: K;
        value: CurrencySettingsData[K];
    };
}[keyof CurrencySettingsData];

const DEFAULT_PREVIEW_AMOUNT = 1234.5689;

const DEFAULT_CURRENCY_SETTINGS: CurrencySettingsData = {
    decimal_format: 1,
    default_currency: 'USD',
    decimal_separator: '.',
    thousands_separator: ',',
    float_number: 0,
    currency_symbol_space: 0,
    currency_symbol_position: 'before',
};

const DECIMAL_OPTIONS = [
    { value: '0', label: '0 (1234)' },
    { value: '1', label: '1 (1234.5)' },
    { value: '2', label: '2 (1234.56)' },
    { value: '3', label: '3 (1234.567)' },
    { value: '4', label: '4 (1234.5678)' },
    { value: '5', label: '5 (1234.56789)' },
] as const;

/**
 * Normalizes persisted settings into the values expected by the form.
 *
 * Invalid or missing formatting options fall back to the existing defaults.
 * Numeric flags remain numeric to preserve the server request contract.
 */
function normalizeCurrencySettings(settings: Partial<CurrencySettingsData> | undefined): CurrencySettingsData {
    const decimalFormat = (settings?.decimal_format ?? DEFAULT_CURRENCY_SETTINGS.decimal_format) satisfies number;

    const thousandsSeparator = settings?.thousands_separator;

    return {
        decimal_format:
            Number.isInteger(decimalFormat) && decimalFormat >= 0 && decimalFormat <= 5 ? decimalFormat : DEFAULT_CURRENCY_SETTINGS.decimal_format,

        default_currency: settings?.default_currency || DEFAULT_CURRENCY_SETTINGS.default_currency,

        decimal_separator: settings?.decimal_separator === ',' ? ',' : DEFAULT_CURRENCY_SETTINGS.decimal_separator,

        thousands_separator:
            thousandsSeparator === ',' || thousandsSeparator === '.' || thousandsSeparator === ' ' || thousandsSeparator === 'none'
                ? thousandsSeparator
                : DEFAULT_CURRENCY_SETTINGS.thousands_separator,

        float_number: Number(settings?.float_number) === 1 ? 1 : 0,

        currency_symbol_space: Number(settings?.currency_symbol_space) === 1 ? 1 : 0,

        currency_symbol_position: settings?.currency_symbol_position === 'after' ? 'after' : 'before',
    };
}

/**
 * Formats a monetary amount using the configured separators and symbol position.
 *
 * This intentionally uses the application's existing custom formatting rules
 * rather than locale-based formatting, which could override user preferences.
 */
function formatCurrencyPreview(amount: number, settings: CurrencySettingsData, symbol: string): string {
    const decimalPlaces = settings.decimal_format;

    const displayAmount = settings.float_number ? amount : Math.floor(amount);

    const [integerPart = '0', decimalPart] = displayAmount.toFixed(decimalPlaces).split('.');

    const formattedInteger =
        settings.thousands_separator === 'none' ? integerPart : integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, settings.thousands_separator);

    const formattedNumber = decimalPart !== undefined ? `${formattedInteger}${settings.decimal_separator}${decimalPart}` : formattedInteger;

    const spacing = settings.currency_symbol_space ? ' ' : '';

    return settings.currency_symbol_position === 'before' ? `${symbol}${spacing}${formattedNumber}` : `${formattedNumber}${spacing}${symbol}`;
}

/**
 * CurrencySettings
 *
 * Configures the default currency and monetary display preferences.
 *
 * Responsibilities:
 * - Initialize settings from Inertia page props.
 * - Preview formatting changes before saving.
 * - Submit preferences to the existing update endpoint.
 *
 * State:
 * - Currency preferences represent the user's unsaved form changes.
 * - The preview amount is independent of persisted preferences.
 * - Currency metadata is derived from the selected currency.
 *
 * Accessibility:
 * - Preserves the existing semantic form controls and keyboard interaction.
 * - Exposes selected button states and associates controls with labels.
 *
 * Performance:
 * - Memoizes derived currency and preview values.
 * - Uses stable callbacks for state updates and form submission.
 */
export default function CurrencySettings() {
    const { t: translate } = useTranslation();

    const { currencies = [], systemSettings = {} } = usePage().props;

    const [currencySettings, setCurrencySettings] = useState<CurrencySettingsData>(() => normalizeCurrencySettings(systemSettings));

    const [previewAmount, setPreviewAmount] = useState(DEFAULT_PREVIEW_AMOUNT);

    const [isSaving, setIsSaving] = useState(false);

    const selectedCurrency = useMemo(
        () => currencies.find((currency) => currency.code === currencySettings.default_currency),
        [currencies, currencySettings.default_currency],
    );

    const currencyName = selectedCurrency?.name ?? currencySettings.default_currency;

    const currencySymbol = selectedCurrency?.symbol || '$';

    const updateCurrencySetting = useCallback((update: CurrencySettingUpdate) => {
        setCurrencySettings((previous) => ({
            ...previous,
            [update.field]: update.value,
        }));
    }, []);

    const handleCurrencyChange = useCallback(
        (value: string) => {
            updateCurrencySetting({
                field: 'default_currency',
                value,
            });
        },
        [updateCurrencySetting],
    );

    const handleDecimalFormatChange = useCallback(
        (value: string) => {
            const decimalFormat = Number(value);

            if (Number.isInteger(decimalFormat) && decimalFormat >= 0 && decimalFormat <= 5) {
                updateCurrencySetting({
                    field: 'decimal_format',
                    value: decimalFormat,
                });
            }
        },
        [updateCurrencySetting],
    );

    const handleThousandsSeparatorChange = useCallback(
        (value: string) => {
            if (value === ',' || value === '.' || value === ' ' || value === 'none') {
                updateCurrencySetting({
                    field: 'thousands_separator',
                    value,
                });
            }
        },
        [updateCurrencySetting],
    );

    const handlePreviewAmountChange = useCallback((event: Parameters<NonNullable<ComponentProps<'input'>['onChange']>>[0]) => {
        setPreviewAmount(parseFloat(event.target.value) || 0);
    }, []);

    const resetPreviewAmount = useCallback(() => {
        setPreviewAmount(DEFAULT_PREVIEW_AMOUNT);
    }, []);

    const formattedPreview = useMemo(
        () => formatCurrencyPreview(previewAmount, currencySettings, currencySymbol),
        [previewAmount, currencySettings, currencySymbol],
    );

    const setSymbolPositionBefore = useCallback(() => {
        updateCurrencySetting({
            field: 'currency_symbol_position',
            value: 'before',
        });
    }, [updateCurrencySetting]);

    const setSymbolPositionAfter = useCallback(() => {
        updateCurrencySetting({
            field: 'currency_symbol_position',
            value: 'after',
        });
    }, [updateCurrencySetting]);

    const setDecimalSeparatorDot = useCallback(() => {
        updateCurrencySetting({
            field: 'decimal_separator',
            value: '.',
        });
    }, [updateCurrencySetting]);

    const setDecimalSeparatorComma = useCallback(() => {
        updateCurrencySetting({
            field: 'decimal_separator',
            value: ',',
        });
    }, [updateCurrencySetting]);

    const handleFloatNumberChange = useCallback(
        (checked: boolean) => {
            updateCurrencySetting({
                field: 'float_number',
                value: checked ? 1 : 0,
            });
        },
        [updateCurrencySetting],
    );

    const handleSymbolSpaceChange = useCallback(
        (checked: boolean) => {
            updateCurrencySetting({
                field: 'currency_symbol_space',
                value: checked ? 1 : 0,
            });
        },
        [updateCurrencySetting],
    );

    const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = useCallback(
        (event) => {
            event.preventDefault();

            if (isSaving) {
                return;
            }

            setIsSaving(true);

            const toastId = toast.loading(translate('Saving currency settings...'));

            router.post(route('settings.currency.update'), currencySettings, {
                preserveScroll: true,

                onSuccess: () => {
                    toast.dismiss(toastId);
                },

                onError: (errors) => {
                    toast.dismiss(toastId);

                    Object.values(errors).forEach((message) => {
                        toast.error(translate(message));
                    });
                },

                onFinish: () => {
                    setIsSaving(false);
                },
            });
        },
        [currencySettings, isSaving, translate],
    );

    return (
        <SettingsSection
            title={translate('Currency')}
            description={translate('Configure how currency values are displayed throughout the application.')}
            action={
                <Button type="submit" form="currency-settings-form" size="lg" disabled={isSaving} aria-busy={isSaving}>
                    {isSaving ? translate('Saving...') : translate('Save')}
                </Button>
            }
        >
            <div aria-hidden="true" className="border-border border-t" />
            {/* Currency preview */}
            <section aria-labelledby="currency-preview-heading" className="space-y-4 py-7 first:pt-0">
                <div className="flex items-start gap-3">
                    <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
                        <Wallet className="size-[18px]" aria-hidden="true" />
                    </div>

                    <div className="min-w-0 space-y-1">
                        <h3 id="currency-preview-heading" className="text-foreground text-sm font-semibold tracking-tight">
                            {translate('Currency preview')}
                        </h3>

                        <p className="text-muted-foreground text-sm leading-relaxed">
                            {translate('See how monetary values will appear throughout your workspace.')}
                        </p>
                    </div>
                </div>

                <div className="border-border/70 bg-muted/30 rounded-xl border p-4 sm:p-5">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 space-y-1">
                            <p className="text-muted-foreground text-xs font-medium">{translate('Example amount')}</p>

                            <p
                                aria-live="polite"
                                aria-atomic="true"
                                className="text-foreground text-3xl font-semibold tracking-tight break-all sm:text-4xl"
                            >
                                {formattedPreview}
                            </p>

                            <p className="text-muted-foreground text-sm">
                                {currencyName} ({currencySettings.default_currency})
                            </p>
                        </div>

                        <div className="flex w-full items-center gap-2 sm:w-auto sm:shrink-0">
                            <div className="min-w-0 flex-1 sm:w-32 sm:flex-none">
                                <Input
                                    id="currency-preview-amount"
                                    inputType="number"
                                    inputMode="decimal"
                                    value={previewAmount}
                                    onChange={handlePreviewAmountChange}
                                    aria-label={translate('Preview amount')}
                                />
                            </div>

                            <Button type="button" variant="outline" onClick={resetPreviewAmount}>
                                {translate('Reset')}
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
            <div aria-hidden="true" className="border-border border-t" />
            <form id="currency-settings-form" autoComplete="off" onSubmit={handleSubmit} aria-busy={isSaving} className="space-y-7 py-7">
                {/* Currency configuration */}
                <section className="space-y-5">
                    <div className="flex items-start gap-3">
                        <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
                            <Coins className="size-[18px]" aria-hidden="true" />
                        </div>

                        <div className="min-w-0 space-y-1">
                            <h3 className="text-foreground text-sm font-semibold tracking-tight">{translate('Currency configuration')}</h3>

                            <p className="text-muted-foreground text-sm leading-relaxed">
                                {translate('Choose the currency and precision used when displaying monetary amounts.')}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                        {/* Default currency */}
                        <div className="grid content-start gap-2">
                            <Select value={currencySettings.default_currency} onValueChange={handleCurrencyChange} disabled={currencies.length === 0}>
                                <SelectTrigger id="default_currency" label={translate('Default currency')}>
                                    <SelectValue placeholder={translate('Select...')} />
                                </SelectTrigger>

                                <SelectContent>
                                    {currencies.length > 0 ? (
                                        currencies.map((currency) => (
                                            <SelectItem key={currency.id} value={currency.code}>
                                                <span>
                                                    {currency.symbol} {currency.code} - {currency.name}
                                                    {currency.is_default && ` (${translate('Default')})`}
                                                </span>
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value="__no_currencies__" disabled>
                                            {translate('No currencies found')}
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Decimal places */}
                        <div className="grid content-start gap-2">
                            <Select value={String(currencySettings.decimal_format)} onValueChange={handleDecimalFormatChange}>
                                <SelectTrigger id="decimal_format" label={translate('Decimal places')}>
                                    <SelectValue placeholder={translate('Select...')} />
                                </SelectTrigger>

                                <SelectContent>
                                    {DECIMAL_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </section>

                {/* Number formatting */}
                <section className="border-border/70 space-y-5 border-t pt-7">
                    <div className="flex items-start gap-3">
                        <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
                            <ListFilter className="size-[18px]" aria-hidden="true" />
                        </div>

                        <div className="min-w-0 space-y-1">
                            <h3 className="text-foreground text-sm font-semibold tracking-tight">{translate('Number formatting')}</h3>

                            <p className="text-muted-foreground text-sm leading-relaxed">
                                {translate('Customize how currency symbols and numerical values are arranged.')}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                        {/* Symbol position */}
                        <fieldset className="min-w-0 space-y-2.5">
                            <legend className="text-foreground text-sm font-medium">{translate('Symbol position')}</legend>

                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    aria-pressed={currencySettings.currency_symbol_position === 'before'}
                                    onClick={setSymbolPositionBefore}
                                    className={cn(
                                        'h-11 justify-center gap-2 rounded-lg',
                                        currencySettings.currency_symbol_position === 'before' &&
                                            'border-primary bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary',
                                    )}
                                >
                                    <span>{currencySymbol}100</span>

                                    {currencySettings.currency_symbol_position === 'before' && <Check className="size-4" aria-hidden="true" />}
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    aria-pressed={currencySettings.currency_symbol_position === 'after'}
                                    onClick={setSymbolPositionAfter}
                                    className={cn(
                                        'h-11 justify-center gap-2 rounded-lg',
                                        currencySettings.currency_symbol_position === 'after' &&
                                            'border-primary bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary',
                                    )}
                                >
                                    <span>100{currencySymbol}</span>

                                    {currencySettings.currency_symbol_position === 'after' && <Check className="size-4" aria-hidden="true" />}
                                </Button>
                            </div>
                        </fieldset>

                        {/* Decimal separator */}
                        <fieldset className="min-w-0 space-y-2.5">
                            <legend className="text-foreground text-sm font-medium">{translate('Decimal separator')}</legend>

                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    aria-pressed={currencySettings.decimal_separator === '.'}
                                    onClick={setDecimalSeparatorDot}
                                    className={cn(
                                        'h-11 justify-center gap-2 rounded-lg',
                                        currencySettings.decimal_separator === '.' &&
                                            'border-primary bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary',
                                    )}
                                >
                                    <span>{translate('Dot')} (123.45)</span>

                                    {currencySettings.decimal_separator === '.' && <Check className="size-4" aria-hidden="true" />}
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    aria-pressed={currencySettings.decimal_separator === ','}
                                    onClick={setDecimalSeparatorComma}
                                    className={cn(
                                        'h-11 justify-center gap-2 rounded-lg',
                                        currencySettings.decimal_separator === ',' &&
                                            'border-primary bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary',
                                    )}
                                >
                                    <span>{translate('Comma')} (123,45)</span>

                                    {currencySettings.decimal_separator === ',' && <Check className="size-4" aria-hidden="true" />}
                                </Button>
                            </div>
                        </fieldset>

                        {/* Thousands separator */}
                        <div className="grid content-start gap-2">
                            <Select value={currencySettings.thousands_separator} onValueChange={handleThousandsSeparatorChange}>
                                <SelectTrigger id="thousands_separator" label={translate('Thousands separator')}>
                                    <SelectValue placeholder={translate('Select...')} />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value=",">Comma (1,234.56)</SelectItem>

                                    <SelectItem value=".">Dot (1.234,56)</SelectItem>

                                    <SelectItem value=" ">Space (1 234.56)</SelectItem>

                                    <SelectItem value="none">None (123456.78)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </section>

                {/* Display preferences */}
                <section className="border-border/70 space-y-5 border-t pt-7">
                    <div className="flex items-start gap-3">
                        <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
                            <SlidersHorizontal className="size-[18px]" aria-hidden="true" />
                        </div>

                        <div className="min-w-0 space-y-1">
                            <h3 className="text-foreground text-sm font-semibold tracking-tight">{translate('Display preferences')}</h3>

                            <p className="text-muted-foreground text-sm leading-relaxed">
                                {translate('Control how currency values are displayed across the application.')}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {/* Show decimals */}
                        <div className="border-border/70 hover:bg-muted/30 flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors">
                            <div className="min-w-0 space-y-1">
                                <Label htmlFor="float_number" className="text-sm font-medium">
                                    {translate('Show decimals')}
                                </Label>

                                <p className="text-muted-foreground text-xs leading-relaxed">{translate('Display decimal places in amounts')}</p>
                            </div>

                            <Switch id="float_number" checked={currencySettings.float_number === 1} onCheckedChange={handleFloatNumberChange} />
                        </div>

                        {/* Currency symbol spacing */}
                        <div className="border-border/70 hover:bg-muted/30 flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors">
                            <div className="min-w-0 space-y-1">
                                <Label htmlFor="currency_symbol_space" className="text-sm font-medium">
                                    {translate('Add a new space')}
                                </Label>

                                <p className="text-muted-foreground text-xs leading-relaxed">{translate('Space between amount and symbol')}</p>
                            </div>

                            <Switch
                                id="currency_symbol_space"
                                checked={currencySettings.currency_symbol_space === 1}
                                onCheckedChange={handleSymbolSpaceChange}
                            />
                        </div>
                    </div>
                </section>
            </form>
        </SettingsSection>
    );
}
