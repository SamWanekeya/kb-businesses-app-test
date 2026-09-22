import { toast } from '@components/CustomToast';
import { Button } from '@components/UserInterface/Button';
import { usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../../../css/cashfree-modal-fix.css';

interface CashfreePaymentFormProps {
    planId: number;
    planPrice: number;
    couponCode: string;
    billingCycle: 'monthly' | 'yearly';
    cashfreeAppId: string;
    mode?: 'sandbox' | 'production';
    currency?: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function CashfreePaymentForm({
    planId,
    planPrice,
    couponCode,
    billingCycle,
    cashfreeAppId,
    mode = 'sandbox',
    currency = 'INR',
    onSuccess,
    onCancel,
}: CashfreePaymentFormProps) {
    const { t: translate } = useTranslation();
    const { csrfToken } = usePage().props;

    useEffect(() => {
        // Check if Cashfree SDK is already loaded
        if (window && (window as any).Cashfree) {
            return;
        }

        // Load Cashfree SDK
        const script = document.createElement('script');
        script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
        script.async = true;
        script.onerror = () => {
            toast.error(translate('Failed to load Cashfree SDK. Please try again.'));
        };
        document.body.appendChild(script);

        return () => {
            // Only remove if we added it
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, [mode, translate]);

    const handlePayment = async () => {
        try {
            // Create payment session on the server
            const response = await fetch(route('cashfree.create-session'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    plan_id: planId,
                    billing_cycle: billingCycle,
                    coupon_code: couponCode,
                }),
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                toast.error(data.error || translate('Failed to create payment session'));
                return;
            }

            const { payment_session_id, order_id, mode: serverMode } = data;

            if (!payment_session_id || !order_id) {
                toast.error(translate('Invalid response from server'));
                return;
            }

            if (!serverMode) {
                toast.error(translate('Payment mode not configured'));
                return;
            }

            if (!(window as any).Cashfree) {
                toast.error(translate('Cashfree SDK not loaded'));
                return;
            }

            // Initialize Cashfree with mode
            const cashfreeMode = serverMode === 'production' ? 'PROD' : 'SANDBOX';
            try {
                const cashfree = (window as any).Cashfree({
                    mode: cashfreeMode,
                });
            } catch (error) {
                toast.error('Failed to initialize Cashfree: ' + error.message);
                return;
            }

            const cashfree = (window as any).Cashfree({
                mode: cashfreeMode,
            });

            const checkoutOptions = {
                paymentSessionId: payment_session_id,
                returnUrl: window.location.origin + route('dashboard.index'),
                redirectTarget: '_modal',
                mode: cashfreeMode,
                style: {
                    zIndex: 99999,
                },
            };

            // Open Cashfree checkout
            cashfree
                .checkout(checkoutOptions)
                .then((result: any) => {
                    if (result.error) {
                        toast.error(result.error.message || translate('Payment failed'));
                        return;
                    }

                    if (result.paymentDetails) {
                        try {
                            const verifyResponse = await fetch(route('cashfree.verify-payment'), {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-Requested-With': 'XMLHttpRequest',
                                    'X-CSRF-TOKEN': csrfToken,
                                },
                                body: JSON.stringify({
                                    order_id: order_id,
                                    cf_payment_id: result.paymentDetails?.paymentId,
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
                    } else {
                        toast.error(translate('Payment status unclear'));
                    }
                })
                .catch((error: any) => {
                    toast.error(error.message || translate('Payment initialization failed'));
                });
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || translate('Failed to initialize payment');
            toast.error(errorMsg);
        }
    };

    return (
        <div className="space-y-4">
            <p className="text-muted-foreground text-sm">{translate('You will be redirected to Cashfree to complete your payment.')}</p>

            <div className="flex gap-3">
                <Button variant="outline" onClick={onCancel} className="flex-1">
                    {translate('Cancel')}
                </Button>
                <Button onClick={handlePayment} className="flex-1">
                    {translate('Pay with Cashfree')}
                </Button>
            </div>
        </div>
    );
}
