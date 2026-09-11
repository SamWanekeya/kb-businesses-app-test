import { toast } from '@components/CustomToast';
import { SettingsSection } from '@components/settings-section';
import { Badge } from '@components/UserInterface/Badge';
import { Button } from '@components/UserInterface/Button';
import { Card, CardContent, CardHeader } from '@components/UserInterface/Card';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/UserInterface/Select';
import { Switch } from '@components/UserInterface/Switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@components/UserInterface/Tooltip';
import { router, usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { Check, DollarSign, Info, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface CurrencyProps {
    id: number;
    name: string;
    code: string;
    symbol: string;
    description?: string;
    is_default: boolean;
}

export default function CurrencySettings() {
    const { t: translate } = useTranslation();
    const { currencies = [], systemSettings = {} } = usePage().props;

    // Currency Settings form state
    const [currencySettings, setCurrencySettings] = useState({
        decimal_format: systemSettings.decimal_format || '2',
        default_currency: systemSettings.default_currency || 'USD',
        decimal_separator: systemSettings.decimal_separator || '.',
        thousands_separator: systemSettings.thousands_separator || ',',
        float_number: systemSettings.float_number === '0' ? false : true,
        currency_symbol_space: systemSettings.currency_symbol_space === '1',
        currency_symbol_position: systemSettings.currency_symbol_position || 'before',
        currency_name: '',
    });

    // Preview amount
    const [previewAmount, setPreviewAmount] = useState(1234.56);

    const [processing, setProcessing] = useState(false);

    // Set currency name based on selected currency
    useEffect(() => {
        if (currencies && currencies.length > 0) {
            const selectedCurrency = currencies.find((c: CurrencyProps) => c.code === currencySettings.default_currency);
            if (selectedCurrency) {
                setCurrencySettings((prev) => ({
                    ...prev,
                    currency_name: selectedCurrency.name,
                }));
            }
        }
    }, [currencies, currencySettings.default_currency]);

    // Handle currency settings form changes
    const handleCurrencySettingsChange = (field: string, value: string | boolean) => {
        setCurrencySettings((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // Handle currency selection change
    const handleCurrencyChange = (value: string) => {
        const selectedCurrency = currencies.find((c: CurrencyProps) => c.code === value);

        setCurrencySettings((prev) => ({
            ...prev,
            default_currency: value,
            currency_name: selectedCurrency?.name || value,
        }));
    };

    // Format the preview amount based on current settings
    const formattedPreview = () => {
        try {
            // Parse the preview amount
            let amount = previewAmount;

            // Format the number with the specified decimal places
            const decimalPlaces = parseInt(currencySettings.decimal_format);

            // Handle float number setting
            if (!currencySettings.float_number) {
                amount = Math.floor(amount);
            }

            // Format the number with the specified separators
            const parts = amount.toFixed(decimalPlaces).split('.');

            // Format the integer part with thousands separator
            if (currencySettings.thousands_separator !== 'none') {
                parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, currencySettings.thousands_separator);
            }

            // Join with decimal separator
            let formattedNumber = parts.join(currencySettings.decimal_separator);

            // Get currency symbol from the currencies array
            const selectedCurrency = currencies.find((c: CurrencyProps) => c.code === currencySettings.default_currency);
            const symbol = selectedCurrency?.symbol || '$';

            // Add currency symbol with proper positioning and spacing
            const space = currencySettings.currency_symbol_space ? ' ' : '';

            if (currencySettings.currency_symbol_position === 'before') {
                return `${symbol}${space}${formattedNumber}`;
            } else {
                return `${formattedNumber}${space}${symbol}`;
            }
        } catch (error) {
            return 'Invalid format';
        }
    };

    // Handle currency settings form submission
    const submitCurrencySettings = (e: React.FormEvent) => {
        e.preventDefault();

        const toastId = toast.loading(translate('Saving currency settings...'));
        setProcessing(true);

        router.post(route('settings.currency.update'), currencySettings, {
            preserveScroll: true,
            onSuccess: (page) => {
                setProcessing(false);
                toast.dismiss(toastId);
                const successMessage = page.props.flash?.success;
                const errorMessage = page.props.flash?.error;

                if (successMessage) {
                    toast.success(successMessage);
                } else if (errorMessage) {
                    toast.error(errorMessage);
                } else {
                    toast.success(translate('Currency settings updated successfully'));
                }
            },
            onError: (errors) => {
                setProcessing(false);
                toast.dismiss(toastId);
                const errorMessage = errors.error || Object.values(errors).join(', ') || translate('Failed to update currency settings');
                toast.error(errorMessage);
            },
        });
    };

    return (
        <SettingsSection
            title={translate('Currency Settings')}
            description={translate('Configure how currency values are displayed throughout the application')}
            action={
                <Button type="submit" disabled={processing} form="currency-settings-form" size="sm">
                    <Save className="mr-2 h-4 w-4" />
                    {processing ? translate('Saving...') : translate('Save Changes')}
                </Button>
            }
        >
            <form id="currency-settings-form" onSubmit={submitCurrencySettings}>
                <div className="grid grid-cols-1 gap-6">
                    {/* Format Settings with Live Preview */}
                    <div>
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <DollarSign className="text-primary h-5 w-5" />
                                        <h3 className="text-base font-medium">{translate('Format Options')}</h3>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 gap-6">
                                    {/* Live Preview Section */}
                                    <div className="bg-muted/30 flex flex-col items-center justify-between gap-4 rounded-md border p-4 xl:flex-row">
                                        <div className="mb-3 flex flex-col items-center xl:mb-0 xl:items-start">
                                            <div className="mb-1 font-mono text-2xl font-semibold">{formattedPreview()}</div>
                                            <div className="text-muted-foreground text-xs">
                                                {currencySettings.currency_name} ({currencySettings.default_currency})
                                            </div>
                                        </div>
                                        <div className="w-full xl:w-auto xl:max-w-[200px]">
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    className="h-8 text-right text-sm"
                                                    value={previewAmount}
                                                    onChange={(e) => setPreviewAmount(parseFloat(e.target.value) || 0)}
                                                    placeholder="Test amount"
                                                />
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setPreviewAmount(1234.56)}
                                                    type="button"
                                                    size="sm"
                                                    className="h-8 text-xs"
                                                >
                                                    Reset
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Format Options */}
                                    <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2">
                                        <div className="min-w-0 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="default_currency" className="font-medium">
                                                    {translate('Default Currency')}
                                                </Label>
                                                <Badge variant="outline" className="font-mono">
                                                    {currencySettings.default_currency}
                                                </Badge>
                                            </div>
                                            <Select value={currencySettings.default_currency} onValueChange={handleCurrencyChange}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={translate('Select currency')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <div className="max-h-[300px] overflow-y-auto">
                                                        {currencies && currencies.length > 0 ? (
                                                            currencies.map((currency: CurrencyProps) => (
                                                                <SelectItem key={currency.id} value={currency.code}>
                                                                    <div className="flex items-center">
                                                                        <span className="w-8 text-center">{currency.symbol}</span>
                                                                        <span>
                                                                            {currency.code} - {currency.name}
                                                                        </span>
                                                                        {currency.is_default && (
                                                                            <span className="text-primary ml-2 text-xs">(Default)</span>
                                                                        )}
                                                                    </div>
                                                                </SelectItem>
                                                            ))
                                                        ) : (
                                                            <div className="text-muted-foreground p-2 text-center">
                                                                {translate('No currencies found')}
                                                            </div>
                                                        )}
                                                    </div>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="min-w-0 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="decimal_format" className="font-medium">
                                                    {translate('Decimal Places')}
                                                </Label>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Info className="text-muted-foreground h-4 w-4" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{translate('Number of digits after decimal point')}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                            <Select
                                                value={currencySettings.decimal_format}
                                                onValueChange={(value) => handleCurrencySettingsChange('decimal_format', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select decimal format" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="0">0 (e.g., 1234)</SelectItem>
                                                    <SelectItem value="1">1 (e.g., 1234.5)</SelectItem>
                                                    <SelectItem value="2">2 (e.g., 1234.56)</SelectItem>
                                                    <SelectItem value="3">3 (e.g., 1234.567)</SelectItem>
                                                    <SelectItem value="4">4 (e.g., 1234.5678)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="currency_symbol_position" className="font-medium">
                                                    {translate('Symbol Position')}
                                                </Label>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Info className="text-muted-foreground h-4 w-4" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{translate('Where to place the currency symbol')}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button
                                                    type="button"
                                                    variant={currencySettings.currency_symbol_position === 'before' ? 'default' : 'outline'}
                                                    className="justify-center"
                                                    onClick={() => handleCurrencySettingsChange('currency_symbol_position', 'before')}
                                                >
                                                    <span className="mr-2">$</span>100
                                                    {currencySettings.currency_symbol_position === 'before' && <Check className="ml-2 h-4 w-4" />}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={currencySettings.currency_symbol_position === 'after' ? 'default' : 'outline'}
                                                    className="justify-center"
                                                    onClick={() => handleCurrencySettingsChange('currency_symbol_position', 'after')}
                                                >
                                                    100<span className="ml-2">$</span>
                                                    {currencySettings.currency_symbol_position === 'after' && <Check className="ml-2 h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="decimal_separator" className="font-medium">
                                                    {translate('Decimal Separator')}
                                                </Label>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Info className="text-muted-foreground h-4 w-4" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{translate('Character used to separate decimal places')}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button
                                                    type="button"
                                                    variant={currencySettings.decimal_separator === '.' ? 'default' : 'outline'}
                                                    className="justify-center"
                                                    onClick={() => handleCurrencySettingsChange('decimal_separator', '.')}
                                                >
                                                    {translate('Dot')} (123.45)
                                                    {currencySettings.decimal_separator === '.' && <Check className="ml-2 h-4 w-4" />}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={currencySettings.decimal_separator === ',' ? 'default' : 'outline'}
                                                    className="justify-center"
                                                    onClick={() => handleCurrencySettingsChange('decimal_separator', ',')}
                                                >
                                                    {translate('Comma')} (123,45)
                                                    {currencySettings.decimal_separator === ',' && <Check className="ml-2 h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="thousands_separator" className="font-medium">
                                                    {translate('Thousands Separator')}
                                                </Label>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Info className="text-muted-foreground h-4 w-4" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{translate('Character used to group thousands')}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                            <Select
                                                value={currencySettings.thousands_separator}
                                                onValueChange={(value) => handleCurrencySettingsChange('thousands_separator', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={translate('Select thousands separator')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value=",">Comma (1,234.56)</SelectItem>
                                                    <SelectItem value=".">Dot (1.234,56)</SelectItem>
                                                    <SelectItem value=" ">Space (1 234.56)</SelectItem>
                                                    <SelectItem value="none">None (123456.78)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-3 rounded-md border p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <Label htmlFor="float_number" className="font-medium">
                                                        {translate('Show Decimals')}
                                                    </Label>
                                                    <p className="text-muted-foreground mt-1 text-xs">
                                                        {translate('Display decimal places in amounts')}
                                                    </p>
                                                </div>
                                                <Switch
                                                    id="float_number"
                                                    checked={currencySettings.float_number}
                                                    onCheckedChange={(checked) => handleCurrencySettingsChange('float_number', checked)}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3 rounded-md border p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <Label htmlFor="currency_symbol_space" className="font-medium">
                                                        {translate('Add Space')}
                                                    </Label>
                                                    <p className="text-muted-foreground mt-1 text-xs">
                                                        {translate('Space between amount and symbol')}
                                                    </p>
                                                </div>
                                                <Switch
                                                    id="currency_symbol_space"
                                                    checked={currencySettings.currency_symbol_space}
                                                    onCheckedChange={(checked) => handleCurrencySettingsChange('currency_symbol_space', checked)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </SettingsSection>
    );
}
