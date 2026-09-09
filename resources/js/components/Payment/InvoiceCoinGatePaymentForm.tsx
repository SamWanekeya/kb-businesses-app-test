import { Button } from '@components/UserInterface/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/UserInterface/card';
import { route } from '@utils/Routes';
import { Coins, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface InvoiceCoingatePaymentFormProps {
    invoiceId: number;
    amount: number;
    paymentType: 'full' | 'partial';
    coingateApiToken: string;
    currency: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function InvoiceCoingatePaymentForm({
    invoiceId,
    amount,
    paymentType,
    coingateApiToken,
    currency,
    onSuccess,
    onCancel,
}: InvoiceCoingatePaymentFormProps) {
    const { t: translate } = useTranslation();
    const [isProcessing, setIsProcessing] = useState(false);

    const formatCurrency = (amount: number) => {
        return window.appSettings?.formatCurrency(Number(amount || 0)) || `${currency} ${Number(amount || 0).toFixed(2)}`;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);

        // Create form and submit directly to avoid CORS
        const form = document.createElementranslate('form');
        form.method = 'POST';
        form.action = route('invoice.coingate.payment');

        // Add CSRF token
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (csrfToken) {
            const csrfInput = document.createElementranslate('input');
            csrfInput.type = 'hidden';
            csrfInput.name = '_token';
            csrfInput.value = csrfToken;
            form.appendChild(csrfInput);
        }

        // Add form data
        const formData = {
            invoice_id: invoiceId,
            amount: amount,
            payment_type: paymentType,
        };

        Object.entries(formData).forEach(([key, value]) => {
            const input = document.createElementranslate('input');
            input.type = 'hidden';
            input.name = key;
            input.value = String(value);
            form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Coins className="h-5 w-5" />
                    {translate('Coingate Payment')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Payment Summary */}
                    <div className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{translate('Payment Amount')}:</span>
                            <span className="font-bold">{formatCurrency(amount)}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                            <span className="text-muted-foreground text-sm">{translate('Payment Type')}:</span>
                            <span className="text-sm capitalize">
                                {paymentType} {translate('Payment')}
                            </span>
                        </div>
                    </div>

                    {/* Coingate Information */}
                    <div className="rounded-lg border bg-orange-50 p-3 dark:bg-orange-950/20">
                        <div className="flex items-start gap-2">
                            <Coins className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-600" />
                            <div className="text-sm">
                                <p className="font-medium text-orange-900 dark:text-orange-100">{translate('Secure Cryptocurrency Payment')}</p>
                                <p className="mt-1 text-orange-700 dark:text-orange-300">
                                    {translate('You will be redirected to Coingate to complete your payment with cryptocurrency.')}
                                </p>
                                <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                                    {translate('Supports Bitcoin, Ethereum, Litecoin and 70+ other cryptocurrencies')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                        <div className="flex items-start gap-2">
                            <Coins className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                            <div className="text-xs text-blue-800">
                                <p className="mb-1 font-medium">{translate('Payment Process:')}</p>
                                <ul className="list-inside list-disc space-y-1">
                                    <li>{translate('Click "Pay with Crypto" to proceed to Coingate')}</li>
                                    <li>{translate('Complete payment using your selected cryptocurrency')}</li>
                                    <li>{translate('You will be redirected back after payment completion')}</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onCancel} className="flex-1" disabled={isProcessing}>
                            {translate('Cancel')}
                        </Button>
                        <Button type="submit" disabled={isProcessing} className="flex-1">
                            {isProcessing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {translate('Redirecting...')}
                                </>
                            ) : (
                                <>
                                    <Coins className="mr-2 h-4 w-4" />
                                    {translate('Pay with Crypto')}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
