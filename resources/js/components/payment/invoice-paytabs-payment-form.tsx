import { toast } from '@/components/custom-toast';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { ExternalLink, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface InvoicePayTabsPaymentFormProps {
    invoiceId: number;
    amount: number;
    paymentType: 'full' | 'partial';
    paytabsClientKey: string;
    currency?: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function InvoicePayTabsPaymentForm({
    invoiceId,
    amount,
    paymentType,
    paytabsClientKey,
    currency = 'AED',
    onSuccess,
    onCancel,
}: InvoicePayTabsPaymentFormProps) {
    const { t: translate } = useTranslation();
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePayment = async () => {
        setIsProcessing(true);

        try {
            const paymentData = {
                invoice_id: invoiceId,
                amount: amount,
                payment_type: paymentType,
                payment_id: `inv_pt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                transaction_id: `inv_txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                _token: document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
            };

            const response = await axios.post(route('invoice.paytabs.payment'), paymentData, {
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                timeout: 30000,
            });

            if (response.data.success && response.data.redirect_url) {
                toast.success(translate('Redirecting to PayTabs payment page...'));
                setTimeout(() => {
                    window.location.href = response.data.redirect_url;
                }, 1000);
            } else {
                throw new Error(response.data.message || 'Payment initialization failed');
            }
        } catch (error: any) {
            let errorMessage = translate('Payment failed. Please try again.');

            if (error.response?.status === 400) {
                errorMessage = error.response.data?.message || translate('Invalid payment request. Please check your details.');
            } else if (error.response?.status === 500) {
                errorMessage = translate('Server error. Please try again later.');
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            } else if (error.code === 'ECONNABORTED') {
                errorMessage = translate('Request timeout. Please try again.');
            }

            toast.error(errorMessage);
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                    <ExternalLink className="mt-0.5 h-5 w-5 text-blue-600" />
                    <div>
                        <h4 className="mb-1 font-medium text-blue-900">{translate('Secure Payment with PayTabs')}</h4>
                        <p className="text-sm text-blue-700">
                            {translate('You will be redirected to PayTabs secure payment page to complete your transaction.')}
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
                            {translate('Pay with PayTabs')}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
