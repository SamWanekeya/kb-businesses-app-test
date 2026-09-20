import { toast } from '@components/CustomToast';
import { Button } from '@components/UserInterface/Button';
import { usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../../../css/cashfree-modal-fix.css';

interface InvoiceCashfreePaymentFormProps {
    invoiceId: number;
    amount: number;
    paymentType: 'full' | 'partial';
    cashfreeAppId: string;
    mode?: 'sandbox' | 'production';
    currency?: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function InvoiceCashfreePaymentForm({
    invoiceId,
    amount,
    paymentType,
    cashfreeAppId,
    mode = 'sandbox',
    currency = 'INR',
    onSuccess,
    onCancel,
}: InvoiceCashfreePaymentFormProps) {
    const { t: translate } = useTranslation();
    const { csrfToken } = usePage().props;

    useEffect(() => {
        if (window && (window as any).Cashfree) {
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
        script.async = true;
        script.onerror = () => {
            toast.error(translate('Failed to load Cashfree SDK. Please try again.'));
        };
        document.body.appendChild(script);

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, [mode]);

    const handlePayment = async () => {
        try {
            const response = await fetch(route('customer-facing.invoice.cashfree.create-session'), {
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
                    _token: csrfToken,
                }),
            });

            const data = await response.json();

            if (data.error) {
                toast.error(data.error);
                return;
            }

            const { payment_session_id, order_id, amount: orderAmount, mode: serverMode } = data;

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

            const cashfreeMode = serverMode === 'production' ? 'PROD' : 'SANDBOX';

            let cashfree;

            try {
                cashfree = (window as any).Cashfree({
                    mode: cashfreeMode,
                });
            } catch (error: any) {
                toast.error('Failed to initialize Cashfree: ' + error.message);
                return;
            }

            const checkoutOptions = {
                paymentSessionId: payment_session_id,
                returnUrl: window.location.href,
                redirectTarget: '_modal',
                mode: cashfreeMode,
                style: {
                    zIndex: 99999,
                },
            };

            cashfree
                .checkout(checkoutOptions)
                .then(async (result: any) => {
                    if (result.error) {
                        toast.error(result.error.message || translate('Payment failed'));
                        return;
                    }

                    if (result.paymentDetails) {
                        try {
                            const verifyResponse = await fetch(route('customer-facing.invoice.cashfree.verify-payment'), {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-CSRF-TOKEN': csrfToken,
                                    Accept: 'application/json',
                                },
                                body: JSON.stringify({
                                    order_id: order_id,
                                    invoice_id: invoiceId,
                                    amount: amount,
                                    payment_type: paymentType,
                                    _token: csrfToken,
                                }),
                            });

                            const verifyData = await verifyResponse.json();

                            if (!verifyResponse.ok || verifyData.error) {
                                toast.error(verifyData.error || translate('Payment verification failed'));
                                return;
                            }

                            toast.success(translate('Payment successful'));
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
            try {
                const errorData = await error?.response?.json?.();
                toast.error(errorData?.error || translate('Failed to initialize payment'));
            } catch {
                toast.error(error?.message || translate('Failed to initialize payment'));
            }
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
