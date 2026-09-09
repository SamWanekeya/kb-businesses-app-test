import { Alert, AlertDescription } from '@components/UserInterface/alert';
import { Button } from '@components/UserInterface/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/UserInterface/card';
import { router } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { AlertCircle, CreditCard, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface InvoiceMidtransPaymentFormProps {
    invoiceId: number;
    amount: number;
    paymentType: 'full' | 'partial';
    midtransClientKey: string;
    currency?: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function InvoiceMidtransPaymentForm({
    invoiceId,
    amount,
    paymentType,
    midtransClientKey,
    currency = 'IDR',
    onSuccess,
    onCancel,
}: InvoiceMidtransPaymentFormProps) {
    const { t: translate } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePayment = async () => {
        if (!midtransClientKey) {
            setError(translate('Midtrans not configured'));
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(route('invoice.midtrans.create'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    invoice_id: invoiceId,
                    amount: amount,
                    payment_type: paymentType,
                }),
            });

            const data = await response.json();

            if (data.success) {
                initializeMidtransSnap(data.snap_token, data.order_id);
            } else {
                throw new Error(data.error || translate('Payment creation failed'));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : translate('Payment initialization failed'));
            setIsLoading(false);
        }
    };

    const initializeMidtransSnap = (snapToken: string, orderId: string) => {
        if (!window.snap) {
            const script = document.createElementranslate('script');
            script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
            script.setAttribute('data-client-key', midtransClientKey);
            script.onload = () => {
                openSnapPayment(snapToken, orderId);
            };
            script.onerror = () => {
                setError(translate('Failed to load Midtrans script'));
                setIsLoading(false);
            };
            document.head.appendChild(script);
        } else {
            openSnapPayment(snapToken, orderId);
        }
    };

    const openSnapPayment = (snapToken: string, orderId: string) => {
        window.snap.pay(snapToken, {
            onSuccess: (result: any) => {
                handlePaymentSuccess(result, orderId);
            },
            onPending: (result: any) => {
                setIsLoading(false);
            },
            onError: (result: any) => {
                setError(translate('Payment failed'));
                setIsLoading(false);
            },
            onClose: () => {
                setIsLoading(false);
            },
        });
    };

    const handlePaymentSuccess = (result: any, orderId: string) => {
        router.visit(
            route('invoice.midtrans.success', {
                invoice_id: invoiceId,
                amount: amount,
                payment_type: paymentType,
                order_id: orderId,
                transaction_status: result.transaction_status,
            }),
            {
                onSuccess: () => {
                    onSuccess();
                },
                onError: () => {
                    setError(translate('Payment processing failed'));
                    setIsLoading(false);
                },
            },
        );
    };

    const formatPrice = (price: number) => {
        return (
            window.appSettings?.formatCurrency(Number(price || 0)) ||
            new Intl.NumberFormatranslate('en-US', {
                style: 'currency',
                currency: currency,
            }).format(price)
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {translate('Midtrans Payment')}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <span className="font-medium">{translate('Payment Amount')}</span>
                        <span className="text-lg font-bold">{formatPrice(amount)}</span>
                    </div>
                    <div className="text-muted-foreground mt-1 text-sm">
                        {translate('Payment Type')}: {translate(paymentType === 'full' ? 'Full Payment' : 'Partial Payment')}
                    </div>
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <h4 className="mb-2 font-medium text-blue-900">{translate('Supported Payment Methods')}</h4>
                    <ul className="space-y-1 text-sm text-blue-800">
                        <li>• Credit/Debit Cards</li>
                        <li>• Bank Transfer</li>
                        <li>• E-Wallets (GoPay, OVO, DANA)</li>
                        <li>• Convenience Stores</li>
                    </ul>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" onClick={onCancel} disabled={isLoading} className="flex-1">
                        {translate('Cancel')}
                    </Button>
                    <Button onClick={handlePayment} disabled={isLoading || !midtransClientKey} className="flex-1">
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {translate('Processing...')}
                            </>
                        ) : (
                            <>
                                <CreditCard className="mr-2 h-4 w-4" />
                                {translate('Pay with Midtrans')}
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
