import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { toast } from '@components/CustomToast';
import usePaymentProcessor from '@hooks/usePaymentProcessor';
import { usePage } from '@inertiajs/react';

interface PaystackPaymentFormProps {
    planId: number;
    planPrice: number;
    couponCode: string;
    billingCycle: string;
    paystackKey: string;
    currency: string;
    onSuccess: () => void;
    onCancel: () => void;
}

interface PaystackResponse {
    reference: string;
}

interface PaystackHandler {
    openIframe: () => void;
}

interface PaystackCustomField {
    display_name: string;
    variable_name: string;
    value: string | number;
}

interface PaystackMetadata {
    custom_fields: PaystackCustomField[];
}

interface PaystackResponse {
    reference: string;
    status: string;
    trans: string;
    transaction: string;
    message: string;
}

interface PaystackOptions {
    key: string;
    email: string;
    amount: number;
    currency: string;
    metadata: PaystackMetadata;
    callback: (response: PaystackResponse) => void;
    onClose: () => void;
}

interface PaystackPop {
    setup: (options: PaystackOptions) => PaystackHandler;
}

declare global {
    interface Window {
        PaystackPop?: PaystackPop;
    }
}

const PAYSTACK_SCRIPT_URL = 'https://js.paystack.co/v1/inline.js';

/**
 * Initializes Paystack InlineJS V1 for a subscription payment.
 *
 * Paystack owns the payment popup while the parent application remains
 * responsible for submitting the completed transaction to the backend.
 *
 * Radix dialog modality is intentionally handled by the parent subscription
 * modal; this component does not manipulate the surrounding dialog or DOM.
 */
export default function PaystackPaymentForm({
    planId,
    planPrice,
    couponCode,
    billingCycle,
    paystackKey,
    currency,
    onSuccess,
    onCancel,
}: PaystackPaymentFormProps) {
    const { t: translate } = useTranslation();
    const { auth } = usePage().props;

    const handlePaymentError = useCallback((error: string) => {
        toast.error(error);
    }, []);

    const { processPayment } = usePaymentProcessor({
        onSuccess,
        onError: handlePaymentError,
    });

    useEffect(() => {
        if (!paystackKey) {
            return;
        }

        let cancelled = false;

        const initializePaystack = () => {
            if (cancelled) {
                return;
            }

            if (!window.PaystackPop) {
                toast.error(translate('Unable to initialize Paystack payment'));
                onCancel();
                return;
            }

            const userEmail = auth?.user?.email;

            if (!userEmail) {
                toast.error(translate('Unable to determine your account email'));
                onCancel();
                return;
            }

            const fullName: string = auth.user?.name || 'Customer';
            const nameParts: string[] = fullName.trim().split(' ');
            const firstName: string = nameParts[0];
            const lastName: string = nameParts.slice(1).join(' ') || '';

            const options: PaystackOptions = {
                key: paystackKey,
                email: userEmail,
                amount: Math.round((planPrice satisfies number) * 100),
                currency: currency.toUpperCase(),

                metadata: {
                    custom_fields: [
                        {
                            display_name: 'First Name',
                            variable_name: 'first_name',
                            value: firstName,
                        },
                        {
                            display_name: 'Last Name',
                            variable_name: 'last_name',
                            value: lastName,
                        },
                    ],
                },

                callback: (response) => {
                    processPayment('paystack', {
                        planId,
                        billingCycle,
                        couponCode,
                        payment_id: response.reference,
                    });
                },

                onClose: onCancel,
            };

            const handler = window.PaystackPop.setup(options);

            handler.openIframe();
        };

        if (window.PaystackPop) {
            initializePaystack();

            return () => {
                cancelled = true;
            };
        }

        const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${PAYSTACK_SCRIPT_URL}"]`);

        if (existingScript) {
            const handleLoad = () => {
                initializePaystack();
            };

            existingScript.addEventListener('load', handleLoad, {
                once: true,
            });

            return () => {
                cancelled = true;
                existingScript.removeEventListener('load', handleLoad);
            };
        }

        const script = document.createElement('script');

        script.src = PAYSTACK_SCRIPT_URL;
        script.async = true;

        script.onload = initializePaystack;

        script.onerror = () => {
            if (cancelled) {
                return;
            }

            toast.error(translate('Unable to load Paystack payment'));
            onCancel();
        };

        document.head.appendChild(script);

        return () => {
            cancelled = true;
        };
    }, [auth.user?.email, auth.user?.name, billingCycle, couponCode, currency, onCancel, paystackKey, planId, planPrice, processPayment, translate]);

    if (!paystackKey) {
        return <div className="text-destructive p-4 text-center">{translate('Paystack not configured')}</div>;
    }

    return (
        <div className="p-4 text-center">
            <p className="text-foreground/75 text-sm">{translate('Redirecting to Paystack...')}</p>
        </div>
    );
}
