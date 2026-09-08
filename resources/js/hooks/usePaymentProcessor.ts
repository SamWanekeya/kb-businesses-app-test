import { useState } from 'react';

import { toast } from '@/components/CustomToast';
import { route } from '@/utils/Routes';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

interface PaymentData {
    planId: number;
    billingCycle: string;
    couponCode?: string;
    paymentMethod: string;

    [key: string]: any;
}

interface UsePaymentProcessorOptions {
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

export default function usePaymentProcessor(options: UsePaymentProcessorOptions = {}) {
    const { t: translate } = useTranslation();
    const [processing, setProcessing] = useState(false);

    const processPayment = async (paymentMethod: string, data: PaymentData) => {
        setProcessing(true);

        const routes = {
            stripe: 'stripe.payment',
            paypal: 'paypal.payment',
            bank: 'bank.payment',
            razorpay: 'razorpay.payment',
            mercadopago: 'mercadopago.payment',
            paystack: 'paystack.payment',
            flutterwave: 'flutterwave.payment',
        };

        const routeName = routes[paymentMethod as keyof typeof routes];

        if (!routeName) {
            toast.error(translate('Invalid payment method'));
            setProcessing(false);
            return;
        }

        const formattedData = formatPaymentData(paymentMethod, data);
        const toastId = toast.loading(translate('Loading...'));

        router.post(route(routeName), formattedData, {
            onSuccess: () => {
                toast.dismiss(toastId);
                options.onSuccess?.();
            },
            onError: (errors) => {
                toast.dismiss(toastId);
                Object.values(errors).forEach((message) => toast.error(translate(message)));
            },
            onFinish: () => {
                setProcessing(false);
            },
        });
    };

    const validatePaymentData = (paymentMethod: string, data: PaymentData): boolean => {
        const requiredFields = {
            stripe: ['payment_method_id', 'cardholder_name'],
            paypal: ['order_id', 'payment_id'],
            bank: ['amount'],
            razorpay: ['payment_id', 'order_id', 'signature'],
            mercadopago: ['payment_id', 'status'],
            paystack: ['payment_id'],
            flutterwave: ['payment_id'],
        };

        const required = requiredFields[paymentMethod as keyof typeof requiredFields] || [];

        for (const field of required) {
            if (!data[field]) {
                toast.error(translate(`${field} is required`));
                return false;
            }
        }

        return true;
    };

    const formatPaymentData = (paymentMethod: string, data: PaymentData) => {
        return {
            plan_id: data.planId,
            billing_cycle: data.billingCycle,
            coupon_code: data.couponCode ?? '',
            ...data,
        };
    };

    return {
        processing,
        processPayment,
        validatePaymentData,
        formatPaymentData,
    };
}
