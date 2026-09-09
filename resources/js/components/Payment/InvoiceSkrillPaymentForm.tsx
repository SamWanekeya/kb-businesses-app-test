import { toast } from '@components/CustomToast';
import { Button } from '@components/UserInterface/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/UserInterface/Card';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import { router } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { Loader2, Wallet } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface InvoiceSkrillPaymentFormProps {
    invoiceId: number;
    amount: number;
    paymentType: 'full' | 'partial';
    skrillMerchantId: string;
    currency: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function InvoiceSkrillPaymentForm({
    invoiceId,
    amount,
    paymentType,
    skrillMerchantId,
    currency,
    onSuccess,
    onCancel,
}: InvoiceSkrillPaymentFormProps) {
    const { t: translate } = useTranslation();
    const [isProcessing, setIsProcessing] = useState(false);
    const [email, setEmail] = useState('');

    const formatCurrency = (amount: number) => {
        return window.appSettings?.formatCurrency(Number(amount || 0)) || `${currency} ${Number(amount || 0).toFixed(2)}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            toast.error(translate('Please enter your email address'));
            return;
        }

        if (!email.includes('@')) {
            toast.error(translate('Please enter a valid email address'));
            return;
        }

        setIsProcessing(true);

        try {
            const paymentData = {
                invoice_id: invoiceId,
                amount: amount,
                payment_type: paymentType,
                email: email,
            };

            router.post(route('invoice.skrill.payment'), paymentData, {
                onSuccess: () => {
                    // The controller will redirect to Skrill, so we don't need to call onSuccess here
                    // onSuccess will be called when user returns from Skrill
                },
                onError: (errors) => {
                    if (errors.error) {
                        toast.error(errors.error);
                    } else {
                        toast.error(translate('Payment failed. Please try again.'));
                    }
                    setIsProcessing(false);
                },
                onFinish: () => {
                    // Don't set processing to false here as we're redirecting to Skrill
                },
            });
        } catch (error) {
            toast.error(translate('Payment failed. Please try again.'));
            setIsProcessing(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    {translate('Skrill Payment')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Payment Summary */}
                    <div className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{translate('Payment Amount')}:</span>
                            <span className="font-bold">{formatCurrency(amount)}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                            <span className="text-muted-foreground text-sm">{translate('Payment Type')}:</span>
                            <span className="text-sm capitalize">
                                {paymentType} {translate('Payment')}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">{translate('Email Address')}</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={translate('Enter your email address')}
                            required
                            disabled={isProcessing}
                        />
                        <p className="text-muted-foreground text-xs">{translate('You will be redirected to Skrill to complete the payment')}</p>
                    </div>

                    {/* Skrill Information */}
                    <div className="rounded-lg border bg-blue-50 p-3 dark:bg-blue-950/20">
                        <div className="flex items-start gap-2">
                            <Wallet className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                            <div className="text-sm">
                                <p className="font-medium text-blue-900 dark:text-blue-100">{translate('Secure Payment with Skrill')}</p>
                                <p className="mt-1 text-blue-700 dark:text-blue-300">
                                    {translate("You will be redirected to Skrill's secure payment page to complete your transaction.")}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onCancel} className="flex-1" disabled={isProcessing}>
                            {translate('Cancel')}
                        </Button>
                        <Button type="submit" disabled={isProcessing || !email} className="flex-1">
                            {isProcessing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {translate('Processing...')}
                                </>
                            ) : (
                                <>
                                    <Wallet className="mr-2 h-4 w-4" />
                                    {translate('Pay with Skrill')}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
