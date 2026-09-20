import { toast } from '@components/CustomToast';
import { route } from '@utils/Routes';
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

        const script = document.createElement('script');
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
                    email: 'customer@kakbima.dev',
                    phone_number: '',
                    name: 'Customer',
                },
                customizations: {
                    title: 'Invoice Payment',
                    description: `Invoice payment - ${paymentType}`,
                    logo: '',
                },
                callback: async function (data: any) {
                    if (data.status === 'successful') {
                        try {
                            const response = await fetch(route('customer-facing.invoice.flutterwave.payment'), {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-CSRF-TOKEN': csrfToken,
                                    Accept: 'application/json',
                                },
                                body: JSON.stringify({
                                    invoice_id: invoiceId,
                                    amount: amount,
                                    payment_type: paymentType,
                                    payment_id: data.transaction_id,
                                    tx_ref: data.tx_ref,
                                }),
                            });

                            const responseData = await response.json();

                            if (!response.ok || responseData.error) {
                                toast.error(responseData.error || translate('Payment processing failed'));
                                return;
                            }

                            onSuccess();
                        } catch (error: any) {
                            toast.error(error.message || translate('Payment processing failed'));
                        }
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
    }, [flutterwaveKey, invoiceId, amount, paymentType, currency, onSuccess, translate, onCancel]);

    if (!flutterwaveKey) {
        return <div className="p-4 text-center text-red-500">{translate('Flutterwave not configured')}</div>;
    }

    return (
        <div className="p-4 text-center">
            <p>{translate('Redirecting to Flutterwave...')}</p>
        </div>
    );
}
