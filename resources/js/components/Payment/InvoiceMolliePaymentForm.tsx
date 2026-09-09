import { toast } from '@components/CustomToast';
import { Button } from '@components/UserInterface/button';
import { route } from '@utils/Routes';
import axios from 'axios';
import { ExternalLink, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface InvoiceMolliePaymentFormProps {
    invoiceId: number;
    amount: number;
    paymentType: 'full' | 'partial';
    mollieApiKey: string;
    currency?: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function InvoiceMolliePaymentForm({
    invoiceId,
    amount,
    paymentType,
    mollieApiKey,
    currency = 'EUR',
    onSuccess,
    onCancel,
}: InvoiceMolliePaymentFormProps) {
    const { t: translate } = useTranslation();
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePayment = async () => {
        setIsProcessing(true);

        try {
            const response = await axios.post(
                route('invoice.mollie.payment'),
                {
                    invoice_id: invoiceId,
                    amount: amount,
                    payment_type: paymentType,
                    _token: document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                },
            );

            if (response.data.success && response.data.checkout_url) {
                toast.success(translate('Redirecting to Mollie payment page...'));
                setTimeout(() => {
                    window.location.href = response.data.checkout_url;
                }, 1000);
            } else {
                throw new Error(response.data.message || 'Payment initialization failed');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || translate('Payment failed. Please try again.'));
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                    <ExternalLink className="mt-0.5 h-5 w-5 text-blue-600" />
                    <div>
                        <h4 className="mb-1 font-medium text-blue-900">{translate('Secure Payment with Mollie')}</h4>
                        <p className="text-sm text-blue-700">
                            {translate('You will be redirected to Mollie secure payment page to complete your transaction.')}
                        </p>
                    </div>
                </div>
            </div>

            <div className="rounded-lg border bg-gray-50 p-4">
                <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">{translate('Payment Type')}:</span>
                    <span className="text-sm text-gray-900 capitalize">{paymentType}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">{translate('Amount')}:</span>
                    <span className="text-lg font-bold text-gray-900">
                        {currency} {amount}
                    </span>
                </div>
            </div>

            <div className="flex gap-3">
                <Button variant="outline" onClick={onCancel} className="flex-1" disabled={isProcessing}>
                    {translate('Cancel')}
                </Button>
                <Button onClick={handlePayment} disabled={isProcessing} className="flex-1">
                    {isProcessing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {translate('Redirecting...')}
                        </>
                    ) : (
                        <>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            {translate('Pay with Mollie')}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
