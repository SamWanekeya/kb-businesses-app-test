import { toast } from '@components/CustomToast';
import IframePortal from '@components/IframePortal';
import MediaPicker from '@components/MediaPicker';
import SettingsSection from '@components/SettingsSection';
import { Button } from '@components/UserInterface/Button';
import { Label } from '@components/UserInterface/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/UserInterface/Select';
import { Switch } from '@components/UserInterface/Switch';
import { useForm, usePage } from '@inertiajs/react';
import Template1 from '@pages/SalesOrders/Templates/Template1';
import Template10 from '@pages/SalesOrders/Templates/Template10';
import Template2 from '@pages/SalesOrders/Templates/Template2';
import Template3 from '@pages/SalesOrders/Templates/Template3';
import Template4 from '@pages/SalesOrders/Templates/Template4';
import Template5 from '@pages/SalesOrders/Templates/Template5';
import Template6 from '@pages/SalesOrders/Templates/Template6';
import Template7 from '@pages/SalesOrders/Templates/Template7';
import Template8 from '@pages/SalesOrders/Templates/Template8';
import Template9 from '@pages/SalesOrders/Templates/Template9';
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
    salesOrder: {
        sales_order_id: '00001',
        sales_order_number: 'SO-2025-000001',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        order_date: new Date().toISOString().split('T')[0],
        delivery_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
        salesOrderLogo: null,
    },
};

const templates = {
    template1: 'Sales order template 1',
    template2: 'Sales order template 2',
    template3: 'Sales order template 3',
    template4: 'Sales order template 4',
    template5: 'Sales order template 5',
    template6: 'Sales order template 6',
    template7: 'Sales order template 7',
    template8: 'Sales order template 8',
    template9: 'Sales order template 9',
    template10: 'Sales order template 10',
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

export default function SalesOrderTemplateSettings() {
    const { t: translate } = useTranslation();
    const { settings } = usePage().props;

    const [saving, setSaving] = useState(false);
    const [settingsHeight, setSettingsHeight] = useState(0);

    const { data, setData, errors, reset } = useForm({
        salesOrderTemplate: settings.salesOrderTemplate || 'template1',
        salesOrderColor: settings.salesOrderColor || 'ffffff',
        salesOrderQrEnabled: settings.salesOrderQrEnabled === 'on' || settings.salesOrderQrEnabled === true,
        salesOrderLogoId: settings.salesOrderLogoId || null,
        salesOrderLogoUrl: settings.salesOrderLogo || null,
    });

    // const settingsRef = useCallback((node: HTMLDivElement | null) => {
    //     if (node) {
    //         const measure = () => setSettingsHeight(node.offsetHeight - 25);
    //         measure();
    //         setTimeout(measure, 100);
    //     }
    // }, [data.salesOrderLogoId]);
    const settingsRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!settingsRef.current) return;

        const observer = new ResizeObserver(([entry]) => {
            setSettingsHeight(entry.contentRect.height);
        });

        observer.observe(settingsRef.current);

        return () => {
            observer.disconnect();
        };
    }, [data.salesOrderLogoUrl]);

    const SelectedTemplate = templateComponents[data.salesOrderTemplate as keyof typeof templateComponents];

    const renderPreview = () => {
        if (!SelectedTemplate) return null;

        const previewSettings = {
            ...mockData.settings,
            salesOrderLogo: data.salesOrderLogoUrl,
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
                        salesOrder={mockData.salesOrder}
                        items={mockData.items}
                        taxesData={mockData.taxesData}
                        settings={previewSettings}
                        color={data.salesOrderColor}
                        qr_invoice={data.salesOrderQrEnabled ? 'on' : 'off'}
                        qrCodeSvg={null}
                        styles={styles}
                    />
                </IframePortal>
            </div>
        );
    };

    const handleLogoSelect = (value: number | '') => {
        setData('salesOrderLogoId', value);

        if (!value) {
            setData('salesOrderLogoUrl', null);
        } else {
            fetch(route('media-library.media.index'))
                .then((res) => res.json())
                .then((media) => {
                    const item = media.find((m: any) => m.id === Number(value));
                    if (item) {
                        setData('salesOrderLogoUrl', item.url);
                    }
                });
        }

        setTimeout(() => {
            const node = document.querySelector('[ref]') as HTMLDivElement;
            if (node) setSettingsHeight(node.offsetHeight);
        }, 150);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const { data: result } = await fetch(route('settings.sales-order-template'), {
                salesOrderTemplate: data.salesOrderTemplate,
                salesOrderColor: data.salesOrderColor,
                salesOrderQrEnabled: data.salesOrderQrEnabled,
                salesOrderLogoId: data.salesOrderLogoId,
            });

            if (result.success) {
                toast.success(result.success);
                reset('salesOrderLogo');
            } else if (result.error) {
                toast.error(result.error);
            } else {
                toast.error(translate(result.message));
            }
        } catch (e: any) {
            toast.error(translate(e.response?.data?.message || 'Failed to update sales order template settings'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <SettingsSection
            title={translate('Sales order templates')}
            description={translate('Configure sales orders template, colors, and display options')}
            action={
                <Button type="submit" disabled={saving} form="sales-orders-template-settings-form" size="lg">
                    {translate('Save')}
                </Button>
            }
        >
            <form autoComplete="off" onSubmit={handleSubmit} id="sales-orders-template-settings-form" className="space-y-6">
                <div aria-hidden="true" className="border-border border-t" />

                <div className="grid grid-cols-1 gap-6 min-[1300px]:grid-cols-[320px_1fr] min-[1300px]:items-start">
                    {/* Template settings */}
                    <div ref={settingsRef} className="space-y-6">
                        <div className="space-y-2">
                            <Select
                                value={data.salesOrderTemplate}
                                onValueChange={(value) => {
                                    setData('salesOrderTemplate', value);
                                }}
                            >
                                <SelectTrigger label={translate('Sales order template')}>
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

                            {errors.salesOrderTemplate && <p className="text-destructive text-sm">{errors.salesOrderTemplate}</p>}
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

                                <p className="text-muted-foreground text-xs">{translate('Include a QR code on generated sales orders')}</p>
                            </div>

                            <Switch
                                id="sales_order_qr_enabled"
                                checked={data.salesOrderQrEnabled}
                                onCheckedChange={(checked) => {
                                    setData('salesOrderQrEnabled', checked);
                                }}
                            />
                        </div>

                        {/* Brand customization */}
                        <div className="border-border space-y-4 border-t pt-5">
                            <div>
                                <h3 className="text-foreground text-sm font-semibold">{translate('Brand customization')}</h3>

                                <p className="text-muted-foreground mt-1 text-sm">
                                    {translate('Personalize your sales order with your preferred colors and logo')}
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
                                                name="salesOrderColor"
                                                value={color}
                                                checked={data.salesOrderColor === color}
                                                onChange={(e) => {
                                                    setData('salesOrderColor', e.target.value);
                                                }}
                                                aria-label={`#${color}`}
                                                className="peer sr-only"
                                            />

                                            <div
                                                className={`flex size-9 items-center justify-center rounded-lg border-2 transition-all ${
                                                    data.salesOrderColor === color
                                                        ? 'border-primary ring-primary/20 ring-offset-background ring-2 ring-offset-2'
                                                        : 'border-border hover:scale-105'
                                                }`}
                                                style={{
                                                    backgroundColor: `#${color}`,
                                                }}
                                            >
                                                {data.salesOrderColor === color && (
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
                                    label={translate('Sales order logo')}
                                    value={data.salesOrderLogoId || ''}
                                    onChange={handleLogoSelect}
                                    showPreview={true}
                                    returnType="id"
                                />

                                {errors.salesOrderLogo && <p className="text-destructive text-sm">{errors.salesOrderLogo}</p>}

                                <p className="text-muted-foreground text-xs">{translate('Select a logo for sales order')}</p>
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
