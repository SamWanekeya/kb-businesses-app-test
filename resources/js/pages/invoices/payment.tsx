import { toast } from '@/components/CustomToast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Head } from '@inertiajs/react';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { route } from '@/utils/Routes';
import { useTranslation } from 'react-i18next';

interface Invoice {
    id: number;
    invoice_number: string;
    name: string;
    total_amount: number;
}

interface Props {
    invoice: Invoice;
    paymentMethod: string;
    amount: number;
    paymentType: string;
    paymentSettings: any;
    currency: string;
}

const StripeCheckoutForm = ({ invoice, amount, paymentType }: any) => {
    const { t: translate } = useTranslation();
    const stripe = useStripe();
    const elements = useElements();
    const [cardholderName, setCardholderName] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements || !cardholderName.trim()) {
            toast.error(translate('Please fill in all required fields'));
            return;
        }

        setProcessing(true);

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
            toast.error(error.message || translate('Payment failed'));
            setProcessing(false);
            return;
        }

        const form = document.createElementranslate('form');
        form.method = 'POST';
        form.action = route('invoice.stripe.payment');

        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (csrfToken) {
            const csrfInput = document.createElementranslate('input');
            csrfInput.type = 'hidden';
            csrfInput.name = '_token';
            csrfInput.value = csrfToken;
            form.appendChild(csrfInput);
        }

        const fields = {
            payment_method_id: paymentMethod.id,
            cardholder_name: cardholderName,
            invoice_id: invoice.id,
            amount: amount,
            payment_type: paymentType,
        };

        Object.entries(fields).forEach(([key, value]) => {
            const input = document.createElementranslate('input');
            input.type = 'hidden';
            input.name = key;
            input.value = value.toString();
            form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="cardholder-name">{translate('Name on card')}</Label>
                <Input
                    id="cardholder-name"
                    type="text"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    placeholder={translate('Enter cardholder name')}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label>{translate('Card details')}</Label>
                <div className="rounded-md border p-3">
                    <CardElement />
                </div>
            </div>

            <div className="flex gap-3 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => (window.location.href = route('invoices.public', invoice.id))}
                    disabled={processing}
                    className="flex-1"
                >
                    {translate('Cancel')}
                </Button>
                <Button type="submit" disabled={!stripe || processing} className="flex-1">
                    {processing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {translate('Processing...')}
                        </>
                    ) : (
                        translate('Pay {{amount}}', {
                            amount: window.appSettings?.formatCurrency(Number(amount || 0)) || `$${Number(amount || 0).toFixed(2)}`,
                        })
                    )}
                </Button>
            </div>
        </form>
    );
};

export default function InvoicePayment({ invoice, paymentMethod, amount, paymentType, paymentSettings, currency }: Props) {
    const { t: translate } = useTranslation();
    const [stripePromise, setStripePromise] = useState<any>(null);

    useEffect(() => {
        if (paymentMethod === 'stripe' && paymentSettings.key) {
            setStripePromise(loadStripe(paymentSettings.key));
        }
    }, [paymentMethod, paymentSettings]);

    const formatCurrency = (amount: number) => {
        return window.appSettings?.formatCurrency(Number(amount || 0)) || `$${Number(amount || 0).toFixed(2)}`;
    };

    return (
        <>
            <Head title={translate('Pay Invoice {{invoiceNumber}}', { invoiceNumber: invoice.invoice_number })} />

            <div className="min-h-screen bg-gray-50 py-8">
                <div className="mx-auto max-w-2xl px-4">
                    <div className="mb-6">
                        <Button
                            variant="outline"
                            onClick={() => (window.location.href = route('invoices.public', invoice.id))}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {translate('Back')}
                        </Button>
                    </div>

                    <div className="mb-6 rounded-lg border bg-white shadow-sm">
                        <div className="p-6">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="rounded-lg bg-blue-100 p-2">
                                    <CreditCard className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold">
                                        {translate('Payment for Invoice #{{invoiceNumber}}', { invoiceNumber: invoice.invoice_number })}
                                    </h1>
                                    <p className="text-gray-600">{invoice.name}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 rounded-lg bg-gray-50 p-4 md:grid-cols-3">
                                <div>
                                    <p className="text-sm text-gray-600">{translate('Payment Type')}</p>
                                    <p className="font-semibold capitalize">{translate('{{paymentType}} Payment', { paymentType })}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">{translate('Amount')}</p>
                                    <p className="font-semibold">{formatCurrency(amount)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">{translate('Total Invoice')}</p>
                                    <p className="font-semibold">{formatCurrency(invoice.total_amount)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                {translate('Payment Details')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {paymentMethod === 'stripe' && paymentSettings.key && stripePromise ? (
                                <Elements stripe={stripePromise}>
                                    <StripeCheckoutForm invoice={invoice} amount={amount} paymentType={paymentType} />
                                </Elements>
                            ) : (
                                <div className="p-4 text-center text-red-500">{translate('Payment method not configured')}</div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
