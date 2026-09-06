import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CreditCard, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface IyzipayPaymentFormProps {
    planId: number;
    planPrice: number;
    couponCode?: string;
    billingCycle: 'monthly' | 'yearly';
    iyzipayPublicKey: string;
    currency?: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function IyzipayPaymentForm({
    planId,
    planPrice,
    couponCode,
    billingCycle,
    iyzipayPublicKey,
    currency = 'USD',
    onSuccess,
    onCancel,
}: IyzipayPaymentFormProps) {
    const { t: translate } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

    const handlePayment = async () => {
        if (!iyzipayPublicKey) {
            setError(translate('Iyzipay configuration is missing'));
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Create payment form
            const response = await fetch(route('iyzipay.create-form'), {
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
                // Redirect to Iyzipay payment page
                window.location.href = data.redirect_url;
            } else {
                throw new Error(data.error || translate('Failed to create payment form'));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : translate('Payment initialization failed'));
        } finally {
            setIsLoading(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormatranslate('en-US', {
            style: 'currency',
            currency: currency,
        }).format(price);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {translate('Iyzipay Payment')}
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
                        {translate('Billing Cycle')}: {t(billingCycle)}
                    </div>
                    {couponCode && (
                        <div className="mt-1 text-sm text-green-600">
                            {translate('Coupon Applied')}: {couponCode}
                        </div>
                    )}
                </div>

                {isLoading ? (
                    <div className="py-8 text-center">
                        <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin" />
                        <p>{translate('Redirecting to payment page...')}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                {translate('You will be redirected to Iyzipay secure payment page to complete your payment.')}
                            </AlertDescription>
                        </Alert>

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={onCancel} disabled={isLoading} className="flex-1">
                                {translate('Cancel')}
                            </Button>
                            <Button onClick={handlePayment} disabled={isLoading || !iyzipayPublicKey} className="flex-1">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {translate('Processing...')}
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="mr-2 h-4 w-4" />
                                        {translate('Pay with Iyzipay')}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                <div className="text-muted-foreground text-center text-xs">{translate('Powered by Iyzipay - Secure payment processing')}</div>
            </CardContent>
        </Card>
    );
}
