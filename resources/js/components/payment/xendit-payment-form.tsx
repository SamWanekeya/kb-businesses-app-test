import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CreditCard, ExternalLink, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { route } from '@/utils/Routes';
import { useTranslation } from 'react-i18next';

interface XenditPaymentFormProps {
    planId: number;
    planPrice: number;
    couponCode?: string;
    billingCycle: 'monthly' | 'yearly';
    xenditApiKey: string;
    currency?: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function XenditPaymentForm({
    planId,
    planPrice,
    couponCode,
    billingCycle,
    xenditApiKey,
    currency = 'PHP',
    onSuccess,
    onCancel,
}: XenditPaymentFormProps) {
    const { t: translate } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePayment = async () => {
        if (!xenditApiKey) {
            setError(translate('Xendit not configured'));
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(route('xendit.create-payment'), {
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
                window.location.href = data.payment_url;
            } else {
                throw new Error(data.error || translate('Payment creation failed'));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : translate('Payment initialization failed'));
            setIsLoading(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormatranslate('id-ID', {
            style: 'currency',
            currency: currency,
        }).format(price);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {translate('Xendit Payment')}
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
                    <AlertDescription>{translate('You will be redirected to Xendit to complete your payment securely.')}</AlertDescription>
                </Alert>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <h4 className="mb-2 font-medium text-blue-900">{translate('Supported Payment Methods')}</h4>
                    <ul className="space-y-1 text-sm text-blue-800">
                        <li>• Credit/Debit Cards</li>
                        <li>• Bank Transfer</li>
                        <li>• E-Wallets (OVO, DANA, LinkAja)</li>
                        <li>• Virtual Accounts</li>
                        <li>• Retail Outlets</li>
                    </ul>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" onClick={onCancel} disabled={isLoading} className="flex-1">
                        {translate('Cancel')}
                    </Button>
                    <Button onClick={handlePayment} disabled={isLoading || !xenditApiKey} className="flex-1">
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {translate('Redirecting...')}
                            </>
                        ) : (
                            <>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                {translate('Pay with Xendit')}
                            </>
                        )}
                    </Button>
                </div>

                <div className="text-muted-foreground text-center text-xs">{translate('Powered by Xendit - Secure payment processing')}</div>
            </CardContent>
        </Card>
    );
}
