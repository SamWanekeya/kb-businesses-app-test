import { toast } from '@components/CustomToast';
import { Button } from '@components/UserInterface/Button';
import { route } from '@utils/Routes';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface RazorpayPaymentFormProps {
    planId: number;
    planPrice: number;
    couponCode: string;
    billingCycle: 'monthly' | 'yearly';
    razorpayKey: string;
    currency?: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function RazorpayPaymentForm({
    planId,
    couponCode,
    billingCycle,
    razorpayKey,
    currency = 'INR',
    onSuccess,
    onCancel,
}: RazorpayPaymentFormProps) {
    const { t: translate } = useTranslation();

    useEffect(() => {
        // Check if Razorpay script is already loaded
        if (window && (window as any).Razorpay) {
            return;
        }

        // Load Razorpay script
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
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
    }, [translate]);

    const handlePayment = async () => {
        try {
            // Create order on the server
            const response = await fetch(route('razorpay.create-order'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    plan_id: planId,
                    billing_cycle: billingCycle,
                    coupon_code: couponCode,
                }),
            });

            const data = await response.json();

            if (data.error) {
                toast.error(data.error);
                return;
            }

            const { order_id, amount } = data;

            if (!order_id || !amount) {
                toast.error(translate('Invalid response from server'));
                return;
            }

            const options = {
                key: razorpayKey,
                amount: amount,
                currency: currency,
                name: 'Kakbima',
                description: translate('Plan subscription'),
                order_id: order_id,
                handler: async function (response: any) {
                    try {
                        const verifyResponse = await fetch(route('razorpay.verify-payment'), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Requested-With': 'XMLHttpRequest',
                            },
                            body: JSON.stringify({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature,
                                plan_id: planId,
                                billing_cycle: billingCycle,
                                coupon_code: couponCode,
                            }),
                        });

                        const verifyData = await verifyResponse.json();

                        if (!verifyResponse.ok || verifyData.error) {
                            throw new Error(verifyData.error || translate('Payment verification failed'));
                        }

                        onSuccess();
                    } catch (error: any) {
                        toast.error(error.message || translate('Payment verification failed'));
                    }
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
                    onDismiss: onCancel,
                },
            };

            if (!(window as any).Razorpay) {
                toast.error(translate('Razorpay SDK not loaded'));
                return;
            }

            const razorpay = new (window as any).Razorpay(options);
            razorpay.open();
        } catch (error: any) {
            toast.error(error.message || translate('Something went wrong'));
            console.error('Razorpay error:', error);
        }
    };

    return (
        <div className="space-y-4">
            <p className="text-muted-foreground text-sm">{translate('You will be redirected to Razorpay to complete your payment.')}</p>

            <div className="flex gap-3">
                <Button variant="outline" onClick={onCancel} className="flex-1">
                    {translate('Cancel')}
                </Button>
                <Button onClick={handlePayment} className="flex-1">
                    {translate('Pay with Razorpay')}
                </Button>
            </div>
        </div>
    );
}
