import { Alert, AlertDescription } from '@components/UserInterface/Alert';
import { Button } from '@components/UserInterface/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/UserInterface/Card';
import { route } from '@utils/Routes';
import { AlertCircle, CreditCard, ExternalLink, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PayHerePaymentFormProps {
    planId: number;
    planPrice: number;
    couponCode?: string;
    billingCycle: 'monthly' | 'yearly';
    payhereMerchantId: string;
    currency?: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function PayHerePaymentForm({
    planId,
    planPrice,
    couponCode,
    billingCycle,
    payhereMerchantId,
    currency = 'LKR',
    onSuccess,
    onCancel,
}: PayHerePaymentFormProps) {
    const { t: translate } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePayment = async () => {
        if (!payhereMerchantId) {
            setError(translate('PayHere not configured'));
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(route('payhere.create-payment'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    plan_id: planId,
                    billing_cycle: billingCycle,
                    coupon_code: couponCode,
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Create form and submit
                const form = document.createElementranslate('form');
                form.method = 'POST';
                form.action = data.payment_url;

                Object.keys(data.payment_data).forEach((key) => {
                    const input = document.createElementranslate('input');
                    input.type = 'hidden';
                    input.name = key;
                    input.value = data.payment_data[key];
                    form.appendChild(input);
                });

                document.body.appendChild(form);
                form.submit();
            } else {
                throw new Error(data.error || translate('Payment creation failed'));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : translate('Payment initialization failed'));
            setIsLoading(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormatranslate('en-LK', {
            style: 'currency',
            currency: currency,
        }).format(price);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {translate('PayHere Payment')}
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
                        <span className="font-medium">{translate('Total Amount')}</span>
                        <span className="text-lg font-bold">{formatPrice(planPrice)}</span>
                    </div>
                    <div className="text-muted-foreground mt-1 text-sm">
                        {translate('Billing Cycle')}: {translate(billingCycle)}
                    </div>
                    {couponCode && (
                        <div className="mt-1 text-sm text-green-600">
                            {translate('Coupon Applied')}: {couponCode}
                        </div>
                    )}
                </div>

                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{translate('You will be redirected to PayHere to complete your payment securely.')}</AlertDescription>
                </Alert>

                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                    <h4 className="mb-2 font-medium text-orange-900">{translate('Supported Payment Methods')}</h4>
                    <ul className="space-y-1 text-sm text-orange-800">
                        <li>• Visa/Mastercard</li>
                        <li>• Lanka QR</li>
                        <li>• eZ Cash</li>
                        <li>• mCash</li>
                        <li>• Bank Transfers</li>
                    </ul>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" onClick={onCancel} disabled={isLoading} className="flex-1">
                        {translate('Cancel')}
                    </Button>
                    <Button onClick={handlePayment} disabled={isLoading || !payhereMerchantId} className="flex-1">
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {translate('Redirecting...')}
                            </>
                        ) : (
                            <>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                {translate('Pay with PayHere')}
                            </>
                        )}
                    </Button>
                </div>

                <div className="text-muted-foreground text-center text-xs">{translate("Powered by PayHere - Sri Lanka's payment gateway")}</div>
            </CardContent>
        </Card>
    );
}
