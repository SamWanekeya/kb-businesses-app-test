import { Button } from '@components/UserInterface/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/UserInterface/Card';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import { route } from '@utils/Routes';
import { CreditCard, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '../custom-toast';

interface MolliePaymentFormProps {
    planId: number;
    couponCode: string;
    billingCycle: 'monthly' | 'yearly';
    planPrice: number;
    mollieApiKey: string;
    currency: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function MolliePaymentForm({
    planId,
    couponCode,
    billingCycle,
    planPrice,
    mollieApiKey,
    currency,
    onSuccess,
    onCancel,
}: MolliePaymentFormProps) {
    const { t: translate } = useTranslation();
    const [isProcessing, setIsProcessing] = useState(false);
    const [customerDetails, setCustomerDetails] = useState({
        firstName: '',
        lastName: '',
        email: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        if (!customerDetails.firstName || !customerDetails.lastName || !customerDetails.email) {
            e.preventDefault();
            toast.error(translate('Please fill in all customer details'));
            return;
        }
        setIsProcessing(true);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {translate('Mollie Payment')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form action={route('mollie.payment')} method="POST" onSubmit={handleSubmit} className="space-y-4">
                    <input type="hidden" name="_token" value={document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''} />
                    <input type="hidden" name="plan_id" value={planId} />
                    <input type="hidden" name="billing_cycle" value={billingCycle} />
                    <input type="hidden" name="coupon_code" value={couponCode || ''} />
                    <input type="hidden" name="payment_id" value={`mollie_${Date.now()}`} />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">{translate('First Name')}</Label>
                            <Input
                                id="firstName"
                                name="customer_details[firstName]"
                                value={customerDetails.firstName}
                                onChange={(e) => setCustomerDetails((prev) => ({ ...prev, firstName: e.target.value }))}
                                placeholder={translate('Enter first name')}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">{translate('Last Name')}</Label>
                            <Input
                                id="lastName"
                                name="customer_details[lastName]"
                                value={customerDetails.lastName}
                                onChange={(e) => setCustomerDetails((prev) => ({ ...prev, lastName: e.target.value }))}
                                placeholder={translate('Enter last name')}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">{translate('Email Address')}</Label>
                        <Input
                            id="email"
                            name="customer_details[email]"
                            type="email"
                            value={customerDetails.email}
                            onChange={(e) => setCustomerDetails((prev) => ({ ...prev, email: e.target.value }))}
                            placeholder={translate('Enter email address')}
                            required
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                            {translate('Cancel')}
                        </Button>
                        <Button type="submit" disabled={isProcessing} className="flex-1">
                            {isProcessing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {translate('Processing...')}
                                </>
                            ) : (
                                translate('Pay {{amount}}', { amount: `€${planPrice}` })
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
