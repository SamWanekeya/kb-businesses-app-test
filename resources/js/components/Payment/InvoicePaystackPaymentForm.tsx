import { toast } from '@components/CustomToast';
import { usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface InvoicePaystackPaymentFormProps {
    invoiceId: number;
    amount: number;
    paymentType: 'full' | 'partial';
    paystackKey: string;
    currency?: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function InvoicePaystackPaymentForm({
    invoiceId,
    amount,
    paymentType,
    paystackKey,
    currency = 'NGN',
    onSuccess,
    onCancel,
}: InvoicePaystackPaymentFormProps) {
    const { t: translate } = useTranslation();
    const { csrfToken } = usePage().props;

    const initialized = useRef(false);

    useEffect(() => {
        if (!paystackKey || initialized.current) return;

        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.async = true;

        script.onload = () => {
            initialized.current = true;

            // Hide parent modal temporarily
            const modalBackdrop = document.querySelector('[data-radix-dialog-overlay]');

            if (modalBackdrop) {
                (modalBackdrop as HTMLElement).style.display = 'none';
            }

            const handler = (window as any).PaystackPop.setup({
                key: paystackKey,
                email: 'customer@kakbima.dev',
                amount: Math.round(Number(amount) * 100),
                currency: currency.toUpperCase(),

                callback: async function (response: any) {
                    // Restore modal backdrop
                    if (modalBackdrop) {
                        (modalBackdrop as HTMLElement).style.display = '';
                    }

                    try {
                        const serverResponse = await fetch(route('customer-facing.invoice.paystack.payment'), {
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
                                payment_id: response.reference,
                            }),
                        });

                        const data = await serverResponse.json();

                        if (!serverResponse.ok || data.error) {
                            toast.error(data.error || translate('Payment processing failed'));
                            return;
                        }

                        onSuccess();
                    } catch (error: any) {
                        toast.error(error.message || translate('Payment processing failed'));
                    }
                },

                onClose: function () {
                    // Restore modal backdrop
                    if (modalBackdrop) {
                        (modalBackdrop as HTMLElement).style.display = '';
                    }

                    onCancel();
                },
            });

            handler.openIframe();
        };

        script.onerror = () => {
            toast.error(translate('Failed to load Paystack checkout. Please try again.'));
        };

        document.head.appendChild(script);

        return () => {
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
        };
    }, [paystackKey, invoiceId, amount, paymentType, currency, onSuccess, translate, onCancel]);

    if (!paystackKey) {
        return <div className="p-4 text-center text-red-500">{translate('Paystack not configured')}</div>;
    }

    return (
        <div className="p-4 text-center">
            <p>{translate('Redirecting to Paystack...')}</p>
        </div>
    );
}
