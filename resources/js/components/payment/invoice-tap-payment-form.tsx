import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CreditCard, ExternalLink, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface InvoiceTapPaymentFormProps {
    invoiceId: number;
    amount: number;
    paymentType: string;
    tapSecretKey: string;
    currency: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function InvoiceTapPaymentForm({ invoiceId, amount, paymentType, tapSecretKey, currency, onSuccess, onCancel }: InvoiceTapPaymentFormProps) {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePayment = async () => {
        if (!tapSecretKey) {
            setError(t('Tap not configured'));
            return;
        }

        if (amount <= 0) {
            setError(t('Invalid payment amount'));
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Create form and submit to handle redirect properly
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = route('invoice.tap.payment');

            // Add CSRF token
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = '_token';
            csrfInput.value = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            form.appendChild(csrfInput);

            // Add form data
            const invoiceIdInput = document.createElement('input');
            invoiceIdInput.type = 'hidden';
            invoiceIdInput.name = 'invoice_id';
            invoiceIdInput.value = invoiceId.toString();
            form.appendChild(invoiceIdInput);

            const amountInput = document.createElement('input');
            amountInput.type = 'hidden';
            amountInput.name = 'amount';
            amountInput.value = amount.toString();
            form.appendChild(amountInput);

            const paymentTypeInput = document.createElement('input');
            paymentTypeInput.type = 'hidden';
            paymentTypeInput.name = 'payment_type';
            paymentTypeInput.value = paymentType;
            form.appendChild(paymentTypeInput);

            document.body.appendChild(form);
            form.submit();
        } catch (err) {
            setError(err instanceof Error ? err.message : t('Payment initialization failed'));
            setIsLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return (
            window.appSettings?.formatCurrency(Number(amount || 0)) ||
            new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency,
            }).format(amount)
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {t('Tap Payment')}
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
                        <span className="font-medium">{t('Payment Amount')}</span>
                        <span className="text-lg font-bold">{formatCurrency(amount)}</span>
                    </div>
                    <div className="text-muted-foreground mt-1 text-sm">
                        {t('Payment Type')}: {t(paymentType)}
                    </div>
                </div>

                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{t('You will be redirected to Tap to complete your payment securely.')}</AlertDescription>
                </Alert>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <h4 className="mb-2 font-medium text-blue-900">{t('Supported Payment Methods')}</h4>
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
                        {t('Cancel')}
                    </Button>
                    <Button onClick={handlePayment} disabled={isLoading || !tapSecretKey || amount <= 0} className="flex-1">
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t('Redirecting...')}
                            </>
                        ) : (
                            <>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                {t('Pay with Tap')}
                            </>
                        )}
                    </Button>
                </div>

                <div className="text-muted-foreground text-center text-xs">{t('Powered by Tap - Secure payment processing')}</div>
            </CardContent>
        </Card>
    );
}
