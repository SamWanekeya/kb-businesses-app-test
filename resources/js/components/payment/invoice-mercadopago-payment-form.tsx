import { toast } from '@/components/custom-toast';
import { Button } from '@/components/ui/button';
import axios from 'axios';
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

            // Create preference and redirect to MercadoPago checkout
            const response = await axios.post(
                route('invoice.mercadopago.create-preference'),
                {
                    invoice_id: invoiceId,
                    amount: amount,
                    payment_type: paymentType,
                },
                {
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                },
            );

            if (response.data.redirect_url) {
                // Redirect to MercadoPago checkout
                window.location.href = response.data.redirect_url;
            } else {
                toast.error(translate('Failed to create payment preference'));
                setIsLoading(false);
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || error.message || translate('Failed to create payment preference');
            toast.error(errorMsg);
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <p className="text-muted-foreground text-sm">{translate('You will be redirected to MercadoPago to complete your payment.')}</p>

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
                        translate('Pay with MercadoPago')
                    )}
                </Button>
            </div>
        </div>
    );
}
