import { toast } from '@/components/CustomToast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { router } from '@inertiajs/react';
import { AlertCircle, CreditCard, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { route } from '@/utils/Routes';
import { useTranslation } from 'react-i18next';

interface InvoiceKhaltiPaymentFormProps {
    invoiceId: number;
    amount: number;
    paymentType: string;
    khaltiPublicKey: string;
    currency?: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function InvoiceKhaltiPaymentForm({
    invoiceId,
    amount,
    paymentType,
    khaltiPublicKey,
    currency = 'NPR',
    onSuccess,
    onCancel,
}: InvoiceKhaltiPaymentFormProps) {
    const { t: translate } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePayment = async () => {
        if (!khaltiPublicKey) {
            setError(translate('Khalti not configured'));
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(route('invoice.khalti.create-payment'), {
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
                initializeKhaltiCheckout(data);
            } else {
                throw new Error(data.error || translate('Payment creation failed'));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : translate('Payment initialization failed'));
            setIsLoading(false);
        }
    };

    const initializeKhaltiCheckout = (paymentData: any) => {
        if (!window.KhaltiCheckout) {
            const script = document.createElementranslate('script');
            script.src = 'https://khalti.s3.ap-south-1.amazonaws.com/KPG/dist/2020.12.17.0.0.0/khalti-checkout.iffe.js';
            script.onload = () => {
                createKhaltiCheckout(paymentData);
            };
            document.head.appendChild(script);
        } else {
            createKhaltiCheckout(paymentData);
        }
    };

    const createKhaltiCheckout = (paymentData: any) => {
        const config = {
            publicKey: paymentData.public_key,
            productIdentity: paymentData.product_identity,
            productName: paymentData.product_name,
            productUrl: paymentData.product_url,
            paymentPreference: ['KHALTI', 'EBANKING', 'MOBILE_BANKING', 'CONNECT_IPS', 'SCT'],
            eventHandler: {
                onSuccess(payload: any) {
                    handlePaymentSuccess(payload.token, payload.amount);
                },
                onError(error: any) {
                    setError(translate('Payment failed'));
                    setIsLoading(false);
                },
                onClose() {
                    setIsLoading(false);
                },
            },
        };

        const checkout = new window.KhaltiCheckout(config);
        checkout.show({ amount: paymentData.amount });
    };

    const handlePaymentSuccess = (token: string, amount: number) => {
        router.post(
            route('invoice.khalti.payment'),
            {
                invoice_id: invoiceId,
                amount: amount / 100, // Convert from paisa to rupees
                payment_type: paymentType,
                token: token,
            },
            {
                onSuccess: () => {
                    toast.success(translate('Payment successful'));
                    onSuccess();
                },
                onError: (errors) => {
                    setError(Object.values(errors).flat().join(', '));
                    setIsLoading(false);
                },
            },
        );
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormatranslate('en-NP', {
            style: 'currency',
            currency: currency,
        }).format(price);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {translate('Khalti Payment')}
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
                        {translate('Payment Type')}: {translate(paymentType)}
                    </div>
                </div>

                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{translate("Khalti is Nepal's most popular digital wallet and payment gateway.")}</AlertDescription>
                </Alert>

                <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                    <h4 className="mb-2 font-medium text-purple-900">{translate('Supported Payment Methods')}</h4>
                    <ul className="space-y-1 text-sm text-purple-800">
                        <li>• Khalti Wallet</li>
                        <li>• eBanking</li>
                        <li>• Mobile Banking</li>
                        <li>• Connect IPS</li>
                        <li>• SCT Cards</li>
                    </ul>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" onClick={onCancel} disabled={isLoading} className="flex-1">
                        {translate('Cancel')}
                    </Button>
                    <Button onClick={handlePayment} disabled={isLoading || !khaltiPublicKey} className="flex-1">
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {translate('Processing...')}
                            </>
                        ) : (
                            <>
                                <CreditCard className="mr-2 h-4 w-4" />
                                {translate('Pay with Khalti')}
                            </>
                        )}
                    </Button>
                </div>

                <div className="text-muted-foreground text-center text-xs">{translate("Powered by Khalti - Nepal's digital wallet")}</div>
            </CardContent>
        </Card>
    );
}

declare global {
    interface Window {
        KhaltiCheckout?: any;
    }
}
