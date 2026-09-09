import { toast } from '@components/CustomToast';
import { Button } from '@components/UserInterface/Button';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import { route } from '@utils/Routes';
import axios from 'axios';
import { ExternalLink, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface InvoiceToyyibPayPaymentFormProps {
    invoiceId: number;
    amount: number;
    paymentType: 'full' | 'partial';
    toyyibpayCategoryCode: string;
    currency?: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function InvoiceToyyibPayPaymentForm({
    invoiceId,
    amount,
    paymentType,
    toyyibpayCategoryCode,
    currency = 'MYR',
    onSuccess,
    onCancel,
}: InvoiceToyyibPayPaymentFormProps) {
    const { t: translate } = useTranslation();
    const [isProcessing, setIsProcessing] = useState(false);
    const [customerDetails, setCustomerDetails] = useState({
        billName: '',
        billTo: '',
        billEmail: '',
        billPhone: '',
    });

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!customerDetails.billName || !customerDetails.billTo || !customerDetails.billEmail || !customerDetails.billPhone) {
            toast.error(translate('Please fill in all required fields'));
            return;
        }

        setIsProcessing(true);

        try {
            const response = await axios.post(
                route('invoice.toyyibpay.payment'),
                {
                    invoice_id: invoiceId,
                    amount: amount,
                    payment_type: paymentType,
                    billName: customerDetails.billName,
                    billTo: customerDetails.billTo,
                    billEmail: customerDetails.billEmail,
                    billPhone: customerDetails.billPhone,
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

            if (response.data.success && response.data.redirect_url) {
                toast.success(translate('Redirecting to ToyyibPay payment page...'));
                setTimeout(() => {
                    window.location.href = response.data.redirect_url;
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
                        <h4 className="mb-1 font-medium text-blue-900">{translate('Secure Payment with ToyyibPay')}</h4>
                        <p className="text-sm text-blue-700">
                            {translate('You will be redirected to ToyyibPay secure payment page to complete your transaction.')}
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

            <form onSubmit={handlePayment} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="billName">{translate('Bill Name')} *</Label>
                    <Input
                        id="billName"
                        value={customerDetails.billName}
                        onChange={(e) => setCustomerDetails((prev) => ({ ...prev, billName: e.target.value }))}
                        placeholder={translate('Enter bill name')}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="billTo">{translate('Bill To (Name)')} *</Label>
                    <Input
                        id="billTo"
                        value={customerDetails.billTo}
                        onChange={(e) => setCustomerDetails((prev) => ({ ...prev, billTo: e.target.value }))}
                        placeholder={translate('Enter customer name')}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="billEmail">{translate('Email Address')} *</Label>
                    <Input
                        id="billEmail"
                        type="email"
                        value={customerDetails.billEmail}
                        onChange={(e) => setCustomerDetails((prev) => ({ ...prev, billEmail: e.target.value }))}
                        placeholder={translate('Enter email address')}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="billPhone">{translate('Phone Number')} *</Label>
                    <Input
                        id="billPhone"
                        value={customerDetails.billPhone}
                        onChange={(e) => setCustomerDetails((prev) => ({ ...prev, billPhone: e.target.value }))}
                        placeholder="60123456789"
                        required
                    />
                    <p className="text-muted-foreground text-xs">{translate('Malaysian phone number format: 60123456789')}</p>
                </div>

                <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={onCancel} className="flex-1" disabled={isProcessing}>
                        {translate('Cancel')}
                    </Button>
                    <Button type="submit" disabled={isProcessing} className="flex-1">
                        {isProcessing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {translate('Redirecting...')}
                            </>
                        ) : (
                            <>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                {translate('Pay with ToyyibPay')}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
