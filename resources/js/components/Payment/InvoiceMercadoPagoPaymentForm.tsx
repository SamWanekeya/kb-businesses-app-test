import { toast } from '@components/CustomToast';
import { Button } from '@components/UserInterface/Button';
import { route } from '@utils/Routes';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface InvoiceMercadoPagoPaymentFormProps {
    invoiceId: number;
    amount: number;
    paymentType: 'full' | 'partial';
    accessToken: string;
    currency?: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function InvoiceMercadoPagoPaymentForm({
    invoiceId,
    amount,
    paymentType,
    accessToken,
    currency = 'BRL',
    onSuccess,
    onCancel,
}: InvoiceMercadoPagoPaymentFormProps) {
    const { t: translate } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);

    const handlePayment = async () => {
        try {
            setIsLoading(true);

            const response = await fetch(route('customer-facing.invoice.mercadopago.create-preference'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    invoice_id: invoiceId,
                    amount: amount,
                    payment_type: paymentType,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.error || translate('Failed to create payment preference'));
            }

            if (data.redirect_url) {
                // Redirect to Mercado Pago checkout
                window.location.href = data.redirect_url;
            } else {
                toast.error(translate('Failed to create payment preference'));
                setIsLoading(false);
            }
        } catch (error: any) {
            toast.error(error.message || translate('Failed to create payment preference'));
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <p className="text-muted-foreground text-sm">{translate('You will be redirected to Mercado Pago to complete your payment.')}</p>

            <div className="flex gap-3">
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
