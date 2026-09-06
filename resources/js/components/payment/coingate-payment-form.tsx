import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, Info, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface CoinGatePaymentFormProps {
    planId: number;
    couponCode: string;
    billingCycle: 'monthly' | 'yearly';
    planPrice: number;
    currency: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function CoinGatePaymentForm({ planId, couponCode, billingCycle, planPrice, currency, onSuccess, onCancel }: CoinGatePaymentFormProps) {
    const { t: translate } = useTranslation();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);

        // Create form and submit directly to avoid CORS
        const form = document.createElementranslate('form');
        form.method = 'POST';
        form.action = route('coingate.payment');

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
            plan_id: planId,
            billing_cycle: billingCycle,
            coupon_code: couponCode || '',
            crypto_currency: 'BTC',
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
                    <Coins className="h-5 w-5 text-orange-500" />
                    {translate('CoinGate Cryptocurrency Payment')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Alert className="mb-4">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        {translate('You will be redirected to CoinGate to complete your cryptocurrency payment securely.')}
                    </AlertDescription>
                </Alert>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="bg-muted rounded-lg p-4">
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm font-medium">{translate('Plan')}</span>
                            <span className="text-sm">
                                {translate(billingCycle)} {translate('billing')}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{translate('Amount')}</span>
                            <span className="text-lg font-bold">
                                {currency} {planPrice}
                            </span>
                        </div>
                        <p className="text-muted-foreground mt-2 text-xs">
                            {translate('Final cryptocurrency amount will be calculated at checkout based on current exchange rates')}
                        </p>
                    </div>

                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                        <div className="flex items-start gap-2">
                            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                            <div className="text-xs text-blue-800">
                                <p className="mb-1 font-medium">{translate('Payment Process:')}</p>
                                <ul className="list-inside list-disc space-y-1">
                                    <li>{translate('Click "Pay with Crypto" to proceed to CoinGate')}</li>
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
                        <Button type="submit" disabled={isProcessing} className="flex-1 bg-orange-600 hover:bg-orange-700">
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
