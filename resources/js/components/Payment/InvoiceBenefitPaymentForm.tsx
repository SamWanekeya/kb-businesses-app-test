import { Alert, AlertDescription } from '@components/UserInterface/Alert';
import { Button } from '@components/UserInterface/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/UserInterface/Card';
import { route } from '@utils/Routes';
import { AlertCircle, CreditCard, ExternalLink, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface InvoiceBenefitPaymentFormProps {
    invoiceId: number;
    amount: number;
    paymentType: string;
    benefitSecretKey: string;
    currency: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function InvoiceBenefitPaymentForm({
    invoiceId,
    amount,
    paymentType,
    benefitSecretKey,
    currency,
    onSuccess,
    onCancel,
}: InvoiceBenefitPaymentFormProps) {
    const { t: translate } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePayment = async () => {
        if (!benefitSecretKey) {
            setError(translate('Benefit payment not configured'));
            return;
        }

        if (amount <= 0) {
            setError(translate('Invalid payment amount'));
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(route('invoice.benefit.payment'), {
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

            if (data.success && data.redirect_url) {
                // Redirect to Benefit payment page
                window.location.href = data.redirect_url;
            } else {
                throw new Error(data.message || translate('Failed to create payment session'));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : translate('Payment initialization failed'));
            setIsLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return (
            window.appSettings?.formatCurrency(Number(amount || 0)) ||
            new Intl.NumberFormatranslate('en-BH', {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 3,
            }).format(amount)
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {translate('Benefit Payment')}
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
                        <span className="text-lg font-bold">{formatCurrency(amount)}</span>
                    </div>
                    <div className="text-muted-foreground mt-1 text-sm">
                        {translate('Payment Type')}: {translate(paymentType)}
                    </div>
                </div>

                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {translate(
                            'You will be redirected to Benefit to complete your payment securely. Benefit is the leading payment gateway in Bahrain.',
                        )}
                    </AlertDescription>
                </Alert>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <h4 className="mb-2 font-medium text-blue-900">{translate('Supported Payment Methods')}</h4>
                    <ul className="space-y-1 text-sm text-blue-800">
                        <li>• {translate('Benefit Debit Cards')}</li>
                        <li>• {translate('Visa Credit/Debit Cards')}</li>
                        <li>• {translate('Mastercard Credit/Debit Cards')}</li>
                        <li>• {translate('Benefit Pay Mobile Wallet')}</li>
                    </ul>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" onClick={onCancel} disabled={isLoading} className="flex-1">
                        {translate('Cancel')}
                    </Button>
                    <Button onClick={handlePayment} disabled={isLoading || !benefitSecretKey || amount <= 0} className="flex-1">
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {translate('Redirecting...')}
                            </>
                        ) : (
                            <>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                {translate('Pay with Benefit')}
                            </>
                        )}
                    </Button>
                </div>

                <div className="text-muted-foreground text-center text-xs">{translate("Powered by Benefit - Bahrain's trusted payment gateway")}</div>
            </CardContent>
        </Card>
    );
}
