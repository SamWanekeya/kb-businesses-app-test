import { Alert, AlertDescription } from '@components/UserInterface/Alert';
import { Button } from '@components/UserInterface/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/UserInterface/Card';
import { usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { AlertCircle, CreditCard, ExternalLink, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PaiementPaymentFormProps {
    planId: number;
    planPrice: number;
    couponCode?: string;
    billingCycle: 'monthly' | 'yearly';
    paiementMerchantId: string;
    currency?: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function PaiementPaymentForm({
    planId,
    planPrice,
    couponCode,
    billingCycle,
    paiementMerchantId,
    currency = 'XOF',
    onSuccess,
    onCancel,
}: PaiementPaymentFormProps) {
    const { t: translate } = useTranslation();
    const { csrf_token } = usePage().props;

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePayment = async () => {
        if (!paiementMerchantId) {
            setError(translate('Paiement Pro not configured'));
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(route('paiement.create-payment'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf_token,
                },
                body: JSON.stringify({
                    plan_id: planId,
                    billing_cycle: billingCycle,
                    coupon_code: couponCode,
                }),
            });

            const data = await response.json();

            if (data.success) {
                // solutation :
                const url = data.payment_response.url;
                window.location.href = url;

                // Old :
                // const form = document.createElementranslate('form');
                // form.method = 'POST';
                // form.action = data.payment_url;

                // Object.keys(data.payment_data).forEach(key => {
                //   const input = document.createElementranslate('input');
                //   input.type = 'hidden';
                //   input.name = key;
                //   input.value = data.payment_data[key];
                //   form.appendChild(input);
                // });

                // document.body.appendChild(form);
                // form.submit();
            } else {
                throw new Error(data.error || translate('Payment creation failed'));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : translate('Payment initialization failed'));
            setIsLoading(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormatranslate('fr-FR', {
            style: 'currency',
            currency: currency,
        }).format(price);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {translate('Paiement Pro Payment')}
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

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <h4 className="mb-2 font-medium text-blue-900">{translate('Supported Payment Methods')}</h4>
                    <ul className="space-y-1 text-sm text-blue-800">
                        <li>• Mobile Money</li>
                        <li>• Bank Cards</li>
                        <li>• Bank Transfers</li>
                    </ul>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" onClick={onCancel} disabled={isLoading} className="flex-1">
                        {translate('Cancel')}
                    </Button>
                    <Button onClick={handlePayment} disabled={isLoading || !paiementMerchantId} className="flex-1">
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {translate('Redirecting...')}
                            </>
                        ) : (
                            <>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                {translate('Pay with Paiement Pro')}
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
