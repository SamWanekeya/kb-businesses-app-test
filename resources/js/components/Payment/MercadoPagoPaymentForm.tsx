import { toast } from '@components/CustomToast';
import { Button } from '@components/UserInterface/Button';
import { route } from '@utils/Routes';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface MercadoPagoPaymentFormProps {
    planId: number;
    planPrice: number;
    couponCode: string;
    billingCycle: 'monthly' | 'yearly';
    accessToken: string;
    currency?: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function MercadoPagoPaymentForm({
    planId,
    planPrice,
    couponCode,
    billingCycle,
    accessToken,
    currency = 'BRL',
    onSuccess,
    onCancel,
}: MercadoPagoPaymentFormProps) {
    const { t: translate } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);

    // Payment method using redirect flow
    const handlePayment = async () => {
        try {
            setIsLoading(true);

            // Create a preference and redirect to Mercado Pago checkout
            const response = await fetch(
                route('mercadopago.create-preference'),
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({
                        plan_id: planId,
                        billing_cycle: billingCycle,
                        coupon_code: couponCode ?? undefined,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.error ||
                    translate('Failed to create payment preference')
                );
            }

            if (data.redirect_url) {
                // Redirect to Mercado Pago checkout
                window.location.href = data.redirect_url;
            } else {
                toast.error(
                    translate('Failed to create payment preference')
                );
                setIsLoading(false);
            }
        } catch (error: any) {
            toast.error(
                error.message ||
                translate('Failed to create payment preference')
            );
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <p className="text-muted-foreground text-sm">{translate('You will be redirected to Mercado Pago to complete your payment.')}</p>

            <div className="mt-4 flex gap-3">
                <Button variant="outline" onClick={onCancel} className="flex-1" disabled={isLoading}>
                    {translate('Cancel')}
                </Button>
                <Button onClick={handlePayment} className="flex-1" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {translate('Processing...')}
                        </>
                    ) : (
                        translate('Pay with Mercado Pago')
                    )}
                </Button>
            </div>
        </div>
    );
}
