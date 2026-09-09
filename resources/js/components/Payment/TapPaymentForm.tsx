import { Alert, AlertDescription } from '@components/UserInterface/Alert';
import { Button } from '@components/UserInterface/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/UserInterface/Card';
import { route } from '@utils/Routes';
import { AlertCircle, CreditCard, ExternalLink, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface TapPaymentFormProps {
    planId: number;
    planPrice: number;
    couponCode?: string;
    billingCycle: 'monthly' | 'yearly';
    tapSecretKey: string;
    currency?: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function TapPaymentForm({
    planId,
    planPrice,
    couponCode,
    billingCycle,
    tapSecretKey,
    currency = 'USD',
    onSuccess,
    onCancel,
}: TapPaymentFormProps) {
    const { t: translate } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePayment = async () => {
        if (!tapSecretKey) {
            setError(translate('Tap not configured'));
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Create form and submit to handle redirect properly
            const form = document.createElementranslate('form');
            form.method = 'POST';
            form.action = route('tap.create-payment');

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
                    {translate('Tap Payment')}
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
                    <AlertDescription>{translate('You will be redirected to Tap to complete your payment securely.')}</AlertDescription>
                </Alert>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <h4 className="mb-2 font-medium text-blue-900">{translate('Supported Payment Methods')}</h4>
                    <ul className="space-y-1 text-sm text-blue-800">
                        <li>• Credit/Debit Cards</li>
                        <li>• Apple Pay</li>
                        <li>• Google Pay</li>
                        <li>• KNET</li>
                        <li>• Benefit Pay</li>
                    </ul>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" onClick={onCancel} disabled={isLoading} className="flex-1">
                        {translate('Cancel')}
                    </Button>
                    <Button onClick={handlePayment} disabled={isLoading || !tapSecretKey} className="flex-1">
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {translate('Redirecting...')}
                            </>
                        ) : (
                            <>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                {translate('Pay with Tap')}
                            </>
                        )}
                    </Button>
                </div>

                <div className="text-muted-foreground text-center text-xs">{translate('Powered by Tap - Secure payment processing')}</div>
            </CardContent>
        </Card>
    );
}
