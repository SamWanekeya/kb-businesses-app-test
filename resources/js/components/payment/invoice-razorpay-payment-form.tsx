import { toast } from '@/components/custom-toast';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface InvoiceRazorpayPaymentFormProps {
    invoiceId: number;
    amount: number;
    paymentType: 'full' | 'partial';
    razorpayKey: string;
    currency?: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function InvoiceRazorpayPaymentForm({
    invoiceId,
    amount,
    paymentType,
    razorpayKey,
    currency = 'INR',
    onSuccess,
    onCancel,
}: InvoiceRazorpayPaymentFormProps) {
    const { t: translate } = useTranslation();
    const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);

    useEffect(() => {
        // Check if Razorpay script is already loaded
        if (window && (window as any).Razorpay) {
            setIsRazorpayLoaded(true);
            return;
        }

        // Load Razorpay script
        const script = document.createElementranslate('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
            setIsRazorpayLoaded(true);
        };
        script.onerror = () => {
            toast.error(translate('Failed to load Razorpay checkout. Please try again.'));
        };
        document.body.appendChild(script);

        return () => {
            // Only remove if we added it
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    const handlePayment = async () => {
        try {
            // Create order on the server first
            const response = await axios.post(route('invoice.razorpay.create-order'), {
                invoice_id: invoiceId,
                amount: amount,
                payment_type: paymentType,
            });

            if (response.data.error) {
                toast.error(response.data.error);
                return;
            }

            const { order_id, amount: orderAmount } = response.data;

            if (!order_id || !orderAmount) {
                toast.error(translate('Invalid response from server'));
                return;
            }

            const options = {
                key: razorpayKey,
                amount: orderAmount,
                currency: currency,
                name: 'Invoice Payment',
                description: `Invoice Payment - ${paymentType}`,
                order_id: order_id,
                handler: function (response: any) {
                    // Process payment on server
                    axios
                        .post(route('invoice.razorpay.payment'), {
                            invoice_id: invoiceId,
                            amount: amount,
                            payment_type: paymentType,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                        })
                        .then(() => {
                            onSuccess();
                        })
                        .catch((error) => {
                            const errorMsg = error.response?.data?.error || translate('Payment processing failed');
                            toast.error(errorMsg);
                        });
                },
                prefill: {
                    name: '',
                    email: '',
                    contact: '',
                },
                theme: {
                    color: '#3B82F6',
                },
                modal: {
                    ondismiss: onCancel,
                },
            };

            const razorpay = new (window as any).Razorpay(options);
            razorpay.open();
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || translate('Failed to initialize payment');
            toast.error(errorMsg);
        }
    };

    return (
        <div className="space-y-4">
            <p className="text-muted-foreground text-sm">{translate('You will be redirected to Razorpay to complete your payment.')}</p>

            <div className="flex gap-3">
                <Button variant="outline" onClick={onCancel} className="flex-1">
                    {translate('Cancel')}
                </Button>
                <Button onClick={handlePayment} disabled={!isRazorpayLoaded} className="flex-1">
                    {isRazorpayLoaded ? translate('Pay with Razorpay') : translate('Loading...')}
                </Button>
            </div>
        </div>
    );
}
