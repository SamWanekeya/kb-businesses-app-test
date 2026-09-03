import { toast } from '@/components/custom-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePaymentProcessor } from '@/hooks/usePaymentProcessor';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface StripePaymentFormProps {
    planId?: number;
    couponCode?: string;
    billingCycle?: string;
    stripeKey: string;
    onSuccess: () => void;
    onCancel: () => void;
    // Invoice-specific props
    invoiceId?: number;
    amount?: number;
    paymentType?: string;
}

const CheckoutForm = ({
    planId,
    couponCode,
    billingCycle,
    invoiceId,
    amount,
    paymentType,
    onSuccess,
    onCancel,
}: Omit<StripePaymentFormProps, 'stripeKey'>) => {
    const { t } = useTranslation();
    const stripe = useStripe();
    const elements = useElements();
    const [cardholderName, setCardholderName] = useState('');

    const { processing, processPayment } = usePaymentProcessor({
        onSuccess,
        onError: (error) => toast.error(error),
    });

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements || !cardholderName.trim()) {
            toast.error(t('Please fill in all required fields'));
            return;
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) return;

        const { error, paymentMethod } = await stripe.createPaymentMethod({
            type: 'card',
            card: cardElement,
            billing_details: {
                name: cardholderName,
            },
        });

        if (error) {
            toast.error(error.message || t('Payment failed'));
            return;
        }

        if (invoiceId && amount && paymentType) {
            // Invoice payment
            processPayment('stripe', {
                invoiceId,
                amount,
                paymentType,
                payment_method_id: paymentMethod.id,
                cardholder_name: cardholderName,
            });
        } else {
            // Plan payment
            processPayment('stripe', {
                planId,
                billingCycle,
                couponCode,
                payment_method_id: paymentMethod.id,
                cardholder_name: cardholderName,
            });
        }
    };

    const cardElementOptions = {
        style: {
            base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                    color: '#aab7c4',
                },
            },
            invalid: {
                color: '#9e2146',
            },
        },
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="cardholder-name">{t('Name on card')}</Label>
                <Input
                    id="cardholder-name"
                    type="text"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    placeholder={t('Enter cardholder name')}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label>{t('Card details')}</Label>
                <div className="rounded-md border p-3">
                    <CardElement options={cardElementOptions} />
                </div>
            </div>

            <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} disabled={processing} className="flex-1">
                    {t('Cancel')}
                </Button>
                <Button type="submit" disabled={!stripe || processing} className="flex-1">
                    {processing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('Processing...')}
                        </>
                    ) : (
                        t('Pay Now')
                    )}
                </Button>
            </div>
        </form>
    );
};

export function StripePaymentForm({
    planId,
    couponCode,
    billingCycle,
    stripeKey,
    onSuccess,
    onCancel,
    invoiceId,
    amount,
    paymentType,
}: StripePaymentFormProps) {
    const { t } = useTranslation();
    const [stripePromise, setStripePromise] = useState<any>(null);

    useEffect(() => {
        if (stripeKey && stripeKey.startsWith('pk_')) {
            setStripePromise(loadStripe(stripeKey));
        }
    }, [stripeKey]);

    if (!stripeKey) {
        return (
            <div className="bg-muted/50 rounded-md border p-4 text-center">
                <p className="text-muted-foreground mb-2 text-sm">{t('Stripe not configured')}</p>
                <p className="text-muted-foreground text-xs">{t('Please contact the organization to configure Stripe payment settings.')}</p>
            </div>
        );
    }

    if (!stripeKey.startsWith('pk_')) {
        return (
            <div className="bg-destructive/10 rounded-md border p-4 text-center">
                <p className="text-destructive mb-2 text-sm">{t('Invalid Stripe configuration')}</p>
                <p className="text-muted-foreground text-xs">{t('Stripe publishable key must start with "pk_".')}</p>
            </div>
        );
    }

    if (!stripePromise) {
        return (
            <div className="p-4 text-center">
                <p className="text-muted-foreground text-sm">{t('Loading Stripe...')}</p>
            </div>
        );
    }

    return (
        <Elements stripe={stripePromise}>
            <CheckoutForm
                planId={planId}
                couponCode={couponCode}
                billingCycle={billingCycle}
                invoiceId={invoiceId}
                amount={amount}
                paymentType={paymentType}
                onSuccess={onSuccess}
                onCancel={onCancel}
            />
        </Elements>
    );
}
