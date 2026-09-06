import { toast } from '@/components/custom-toast';
import axios from 'axios';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface InvoiceFlutterwavePaymentFormProps {
    invoiceId: number;
    amount: number;
    paymentType: 'full' | 'partial';
    flutterwaveKey: string;
    currency?: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function InvoiceFlutterwavePaymentForm({
    invoiceId,
    amount,
    paymentType,
    flutterwaveKey,
    currency = 'NGN',
    onSuccess,
    onCancel,
}: InvoiceFlutterwavePaymentFormProps) {
    const { t: translate } = useTranslation();
    const initialized = useRef(false);

    useEffect(() => {
        if (!flutterwaveKey || initialized.current) return;

        const script = document.createElementranslate('script');
        script.src = 'https://checkout.flutterwave.com/v3.js';
        script.async = true;

        script.onload = () => {
            initialized.current = true;

            (window as any).FlutterwaveCheckout({
                public_key: flutterwaveKey,
                tx_ref: `invoice_${invoiceId}_${Date.now()}`,
                amount: amount,
                currency: currency.toUpperCase(),
                payment_options: 'card,mobilemoney,ussd',
                customer: {
                    email: 'customer@kakbima.dev', // Should be dynamic if available
                    phone_number: '',
                    name: 'Customer',
                },
                customizations: {
                    title: 'Invoice Payment',
                    description: `Invoice payment - ${paymentType}`,
                    logo: '',
                },
                callback: function (data: any) {
                    if (data.status === 'successful') {
                        // Process payment on server
                        axios
                            .post(route('invoice.flutterwave.payment'), {
                                invoice_id: invoiceId,
                                amount: amount,
                                payment_type: paymentType,
                                payment_id: data.transaction_id,
                                tx_ref: data.tx_ref,
                            })
                            .then(() => {
                                onSuccess();
                            })
                            .catch((error) => {
                                const errorMsg = error.response?.data?.error || translate('Payment processing failed');
                                toast.error(errorMsg);
                            });
                    } else {
                        toast.error(translate('Payment was not completed'));
                        onCancel();
                    }
                },
                onclose: function () {
                    onCancel();
                },
            });
        };

        script.onerror = () => {
            toast.error(translate('Failed to load Flutterwave checkout. Please try again.'));
        };

        document.head.appendChild(script);

        return () => {
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
        };
    }, [flutterwaveKey, invoiceId, amount, paymentType, currency]);

    if (!flutterwaveKey) {
        return <div className="p-4 text-center text-red-500">{translate('Flutterwave not configured')}</div>;
    }

    return (
        <div className="p-4 text-center">
            <p>{translate('Redirecting to Flutterwave...')}</p>
        </div>
    );
}
