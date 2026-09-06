import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CreditCard, ExternalLink, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface AamarpayPaymentFormProps {
    planId: number;
    planPrice: number;
    couponCode?: string;
    billingCycle: 'monthly' | 'yearly';
    aamarpayStoreId: string;
    currency?: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function AamarpayPaymentForm({
    planId,
    planPrice,
    couponCode,
    billingCycle,
    aamarpayStoreId,
    currency = 'BDT',
    onSuccess,
    onCancel,
}: AamarpayPaymentFormProps) {
    const { t: translate } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePayment = async () => {
        if (!aamarpayStoreId) {
            setError(translate('Aamarpay not configured'));
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Create form and submit directly to avoid CORS/redirect issues
            const form = document.createElementranslate('form');
            form.method = 'POST';
            form.action = route('aamarpay.create-payment');

            // Add CSRF token
            const csrfInput = document.createElementranslate('input');
            csrfInput.type = 'hidden';
            csrfInput.name = '_token';
            csrfInput.value = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            form.appendChild(csrfInput);

            // Add form data
            const planIdInput = document.createElementranslate('input');
            planIdInput.type = 'hidden';
            planIdInput.name = 'plan_id';
            planIdInput.value = planId.toString();
            form.appendChild(planIdInput);

            const billingCycleInput = document.createElementranslate('input');
            billingCycleInput.type = 'hidden';
            billingCycleInput.name = 'billing_cycle';
            billingCycleInput.value = billingCycle;
            form.appendChild(billingCycleInput);

            if (couponCode) {
                const couponInput = document.createElementranslate('input');
                couponInput.type = 'hidden';
                couponInput.name = 'coupon_code';
                couponInput.value = couponCode;
                form.appendChild(couponInput);
            }

            document.body.appendChild(form);
            form.submit();
        } catch (err) {
            setError(err instanceof Error ? err.message : translate('Payment initialization failed'));
            setIsLoading(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormatranslate('bn-BD', {
            style: 'currency',
            currency: currency,
        }).format(price);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {translate('Aamarpay Payment')}
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

                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <h4 className="mb-2 font-medium text-green-900">{translate('Supported Payment Methods')}</h4>
                    <ul className="space-y-1 text-sm text-green-800">
                        <li>• bKash</li>
                        <li>• Nagad</li>
                        <li>• Rocket</li>
                        <li>• Bank Cards</li>
                    </ul>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" onClick={onCancel} disabled={isLoading} className="flex-1">
                        {translate('Cancel')}
                    </Button>
                    <Button onClick={handlePayment} disabled={isLoading || !aamarpayStoreId} className="flex-1">
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {translate('Redirecting...')}
                            </>
                        ) : (
                            <>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                {translate('Pay with Aamarpay')}
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
