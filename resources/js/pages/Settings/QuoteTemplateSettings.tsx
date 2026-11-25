import { toast } from '@components/CustomToast';
import IframePortal from '@components/IframePortal';
import MediaPicker from '@components/MediaPicker';
import SettingsSection from '@components/SettingsSection';
import { Button } from '@components/UserInterface/Button';
import { Label } from '@components/UserInterface/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/UserInterface/Select';
import { Switch } from '@components/UserInterface/Switch';
import { useForm, usePage } from '@inertiajs/react';
import Template1 from '@pages/quotes/Templates/Template1';
import Template10 from '@pages/quotes/Templates/Template10';
import Template2 from '@pages/quotes/Templates/Template2';
import Template3 from '@pages/quotes/Templates/Template3';
import Template4 from '@pages/quotes/Templates/Template4';
import Template5 from '@pages/quotes/Templates/Template5';
import Template6 from '@pages/quotes/Templates/Template6';
import Template7 from '@pages/quotes/Templates/Template7';
import Template8 from '@pages/quotes/Templates/Template8';
import Template9 from '@pages/quotes/Templates/Template9';
import { route } from '@utils/Routes';
import { Check } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const templateComponents = {
    template1: Template1,
    template2: Template2,
    template3: Template3,
    template4: Template4,
    template5: Template5,
    template6: Template6,
    template7: Template7,
    template8: Template8,
    template9: Template9,
    template10: Template10,
};

const mockData = {
    quote: {
        quote_id: '00001',
        quote_number: 'QT-2026-000001',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        date_quoted: new Date().toISOString().split('T')[0],
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        total_tax: 60,
        total_discount: 150,
        sub_total: 300,
        total_amount: 210,
        totalQuantity: 3,
        totalRate: 300,
        totalTaxPrice: 60,
        totalDiscount: 150,
        creator: {
            name: '<Creator Name>',
            email: '<Creator Email>',
        },
        billing_contact: {
            name: '<Billing Contact>',
            email: '<Billing Email>',
            phone: '<Billing Phone>',
        },
        shipping_contact: {
            name: '<Shipping Contact>',
            email: '<Shipping Email>',
            phone: '<Shipping Phone>',
        },
        billing_address: '<Billing Address>',
        billing_city: '<Billing City>',
        billing_state: '<Billing State>',
        billing_postal_code: '<Billing Zip>',
        billing_country: '<Billing Country>',
        shipping_address: '<Shipping Address>',
        shipping_city: '<Shipping City>',
        shipping_state: '<Shipping State>',
        shipping_postal_code: '<Shipping Zip>',
        shipping_country: '<Shipping Country>',
    },
    items: [
        {
            name: 'Item 1',
            quantity: 1,
            price: 100,
            discount: 50,
            itemTax: [{ name: 'Tax 0', rate: '10 %', price: '$10' }],
        },
        {
            name: 'Item 2',
            quantity: 1,
            price: 100,
            discount: 50,
            itemTax: [{ name: 'Tax 1', rate: '10 %', price: '$10' }],
        },
        {
            name: 'Item 3',
            quantity: 1,
            price: 100,
            discount: 50,
            itemTax: [{ name: 'Tax 0', rate: '10 %', price: '$10' }],
        },
    ],
    taxesData: {
        'Tax 0': 30,
        'Tax 1': 30,
    },
    settings: {
        quoteLogo: null,
    },
};

const templates = {
    template1: 'Quote template 1',
    template2: 'Quote template 2',
    template3: 'Quote template 3',
    template4: 'Quote template 4',
    template5: 'Quote template 5',
    template6: 'Quote template 6',
    template7: 'Quote template 7',
    template8: 'Quote template 8',
    template9: 'Quote template 9',
    template10: 'Quote template 10',
};

const colors = [
    '003580',
    '666666',
    '6676ef',
    'f50102',
    'f9b034',
    'fbdd03',
    'c1d82f',
    '37a4e4',
    '8a7966',
    '6a737b',
    '050f2c',
    '0e3666',
    '3baeff',
    '3368e6',
    'b84592',
    'f64f81',
    'f66c5f',
    'fac168',
    '46de98',
    '40c7d0',
    'be0028',
    '2f9f45',
    '371676',
    '52325d',
    '511378',
    '0f3866',
    '48c0b6',
    '297cc0',
    'ffffff',
    '000000',
];

export default function QuoteTemplateSettings() {
    const { t: translate } = useTranslation();
    const { settings } = usePage().props;

    const [saving, setSaving] = useState(false);
    const [settingsHeight, setSettingsHeight] = useState(0);

    const settingsRef = useRef<HTMLDivElement | null>(null);

    const { data, setData, errors } = useForm({
        quoteTemplate: settings.quoteTemplate || 'template1',
        quoteColor: settings.quoteColor || 'ffffff',
        quoteQrEnabled: settings.quoteQrEnabled === 'on' || settings.quoteQrEnabled === true,
        quoteLogoId: settings.quoteLogoId || null,
        quoteLogoUrl: settings.quoteLogo || null,
    });

    // Observe only the configuration column.
    // The preview must not be included in this measurement.
    useEffect(() => {
        const element = settingsRef.current;

        if (!element) return;

        const observer = new ResizeObserver(([entry]) => {
            const height = Math.ceil(entry.contentRect.height);

            setSettingsHeight((previousHeight) => (previousHeight === height ? previousHeight : height));
        });

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, []);

    const SelectedTemplate = templateComponents[data.quoteTemplate as keyof typeof templateComponents];

    const renderPreview = () => {
        if (!SelectedTemplate) return null;

        const previewSettings = {
            ...mockData.settings,
            quoteLogo: data.quoteLogoUrl,
            logoDark: settings.logoDark,
        };

        const styles = {
            invoicePreviewMain: {
                maxWidth: '1000px',
            },
        };

        return (
            <div className="w-full origin-top scale-90 transform pt-10">
                <IframePortal>
                    <SelectedTemplate
                        quote={mockData.quote}
                        items={mockData.items}
                        taxesData={mockData.taxesData}
                        settings={previewSettings}
                        color={data.quoteColor}
                        qr_invoice={data.quoteQrEnabled ? 'on' : 'off'}
                        qrCodeSvg={null}
                        styles={styles}
                    />
                </IframePortal>
            </div>
        );
    };

    const handleLogoSelect = async (logoId: string | null) => {
        setData('quoteLogoId', logoId);

        if (!logoId) {
            setData('quoteLogoUrl', null);
            return;
        }

        try {
            const response = await fetch(route('media-library.media.index'), {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to retrieve media.');
            }

            const result = await response.json();

            const selectedMedia = result.data?.find((media: { id: number | string; original_url: string }) => String(media.id) === String(logoId));

            setData('quoteLogoUrl', selectedMedia?.original_url ?? null);
        } catch (error) {
            console.error('Failed to retrieve selected logo:', error);
            setData('quoteLogoUrl', null);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);

        try {
            const response = await fetch(route('settings.quote-template'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    quoteTemplate: data.quoteTemplate,
                    quoteColor: data.quoteColor,
                    quoteQrEnabled: data.quoteQrEnabled,
                    quoteLogoId: data.quoteLogoId,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to update quote template settings');
            }

            if (result.success) {
                toast.success(result.success);
            } else if (result.error) {
                toast.error(result.error);
            } else {
                toast.error(translate(result.message));
            }
        } catch (error) {
            toast.error(error instanceof Error ? translate(error.message) : translate('Failed to update quote template settings'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <SettingsSection
            title={translate('Quote templates')}
            description={translate('Configure quote template, colors, and display options')}
            action={
                <Button type="submit" disabled={saving} form="quote-template-settings-form" size="lg">
                    {translate('Save')}
                </Button>
            }
        >
            <form autoComplete="off" onSubmit={handleSubmit} id="quote-template-settings-form">
                <div aria-hidden="true" className="border-border border-t" />
                <div className="grid grid-cols-1 gap-6 space-y-6 py-7 min-[1300px]:grid-cols-[320px_minmax(0,1fr)] min-[1300px]:items-start">
                    {/* Configuration column */}
                    <div ref={settingsRef} className="space-y-6">
                        {/* Template selection */}
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-foreground text-sm font-semibold">{translate('Template settings')}</h3>

                                <p className="text-muted-foreground mt-1 text-sm">{translate('Choose the appearance and layout of your quotes')}</p>
                            </div>

                            <div className="space-y-2">
                                <Select
                                    value={data.quoteTemplate}
                                    onValueChange={(value) => {
                                        setData('quoteTemplate', value);
                                    }}
                                >
                                    <SelectTrigger label={translate('Quote template')}>
                                        <SelectValue placeholder={translate('Select...')} />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {Object.entries(templates).map(([key, name]) => (
                                            <SelectItem key={key} value={key}>
                                                {name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {errors.quoteTemplate && <p className="text-destructive text-sm">{errors.quoteTemplate}</p>}
                            </div>
                        </div>

                        {/* Display options */}
                        <div>
                            <h3 className="text-foreground text-sm font-semibold">{translate('Display options')}</h3>

                            <p className="text-muted-foreground mt-1 text-sm">
                                {translate('Customize additional elements displayed on your quotes')}
                            </p>
                        </div>

                        <div className="border-border bg-card flex items-center justify-between gap-4 rounded-xl border p-4">
                            <div className="space-y-1">
                                <Label htmlFor="quote_qr_enabled" className="text-sm font-medium">
                                    {translate('Display QR code?')}
                                </Label>

                                <p className="text-muted-foreground text-xs">{translate('Include a QR code on generated quotes')}</p>
                            </div>

                            <Switch
                                id="quote_qr_enabled"
                                checked={data.quoteQrEnabled}
                                onCheckedChange={(checked) => {
                                    setData('quoteQrEnabled', checked);
                                }}
                            />
                        </div>

                        {/* Brand customization */}
                        <div className="border-border space-y-4 border-t pt-5">
                            <div>
                                <h3 className="text-foreground text-sm font-semibold">{translate('Brand customization')}</h3>

                                <p className="text-muted-foreground mt-1 text-sm">
                                    {translate('Personalize your quotes with your preferred colors and logo')}
                                </p>
                            </div>

                            {/* Color selection */}
                            <div className="space-y-3">
                                <Label>{translate('Color input')}</Label>

                                <div className="flex flex-wrap gap-2">
                                    {colors.map((color) => (
                                        <label key={color} className="cursor-pointer">
                                            <input
                                                type="radio"
                                                name="quoteColor"
                                                value={color}
                                                checked={data.quoteColor === color}
                                                onChange={(e) => {
                                                    setData('quoteColor', e.target.value);
                                                }}
                                                aria-label={`#${color}`}
                                                className="peer sr-only"
                                            />

                                            <div
                                                className={`flex size-9 items-center justify-center rounded-lg border-2 transition-all ${
                                                    data.quoteColor === color
                                                        ? 'border-primary ring-primary/20 ring-offset-background ring-2 ring-offset-2'
                                                        : 'border-border hover:scale-105'
                                                }`}
                                                style={{
                                                    backgroundColor: `#${color}`,
                                                }}
                                            >
                                                {data.quoteColor === color && (
                                                    <Check
                                                        aria-hidden="true"
                                                        className={`size-4 drop-shadow ${color === 'ffffff' ? 'text-black' : 'text-white'}`}
                                                    />
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Logo selection */}
                            <div className="space-y-3">
                                <MediaPicker
                                    label={translate('Quote logo')}
                                    value={data.quoteLogoId || ''}
                                    onChange={handleLogoSelect}
                                    showPreview={true}
                                    returnType="id"
                                />

                                {errors.quoteLogo && <p className="text-destructive text-sm">{errors.quoteLogo}</p>}

                                <p className="text-muted-foreground text-xs">{translate('Select a logo for quotes')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Preview column */}
                    <div className="min-w-0 space-y-3">
                        <div>
                            <h3 className="text-foreground text-sm font-semibold">{translate('Preview')}</h3>

                            <p className="text-muted-foreground mt-1 text-sm">{translate('See how your quote template will look')}</p>
                        </div>

                        <div
                            className="border-border overflow-auto rounded-xl border bg-white min-[1300px]:sticky min-[1300px]:top-6"
                            style={{
                                height: settingsHeight > 25 ? `${settingsHeight - 25}px` : 'auto',
                            }}
                        >
                            {renderPreview()}
                        </div>
                    </div>
                </div>
            </form>
        </SettingsSection>
    );
}
