import { toast } from '@/components/custom-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CreditCard, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ToyyibPayPaymentFormProps {
    planId: number;
    couponCode: string;
    billingCycle: 'monthly' | 'yearly';
    planPrice: number;
    toyyibpayCategoryCode: string;
    currency: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function ToyyibPayPaymentForm({
    planId,
    couponCode,
    billingCycle,
    planPrice,
    toyyibpayCategoryCode,
    currency,
    onSuccess,
    onCancel,
}: ToyyibPayPaymentFormProps) {
    const { t: translate } = useTranslation();
    const [isProcessing, setIsProcessing] = useState(false);
    const [customerDetails, setCustomerDetails] = useState({
        name: '',
        email: '',
        phone: '',
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!customerDetails.name.trim()) {
            newErrors.name = translate('Full name is required');
        }

        if (!customerDetails.email.trim()) {
            newErrors.email = translate('Email address is required');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerDetails.email)) {
            newErrors.email = translate('Please enter a valid email address');
        }

        if (!customerDetails.phone.trim()) {
            newErrors.phone = translate('Phone number is required');
        } else if (customerDetails.phone.length < 10) {
            newErrors.phone = translate('Please enter a valid Malaysian phone number');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error(translate('Please fix the form errors'));
            return;
        }

        setIsProcessing(true);
        setErrors({});

        try {
            const formData = {
                plan_id: planId,
                billing_cycle: billingCycle,
                coupon_code: couponCode || '',
                billName: `Plan Subscription - ${planId}`,
                billDescription: `${billingCycle} subscription for ${customerDetails.name}`,
                billAmount: planPrice,
                billTo: customerDetails.name.trim(),
                billEmail: customerDetails.email.trim(),
                billPhone: customerDetails.phone.trim(),
            };

            // Create form and submit to handle redirect properly
            const form = document.createElementranslate('form');
            form.method = 'POST';
            form.action = route('toyyibpay.payment');

            // Add CSRF token
            const csrfInput = document.createElementranslate('input');
            csrfInput.type = 'hidden';
            csrfInput.name = '_token';
            csrfInput.value = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            form.appendChild(csrfInput);

            // Add form data
            Object.entries(formData).forEach(([key, value]) => {
                const input = document.createElementranslate('input');
                input.type = 'hidden';
                input.name = key;
                input.value = value.toString();
                form.appendChild(input);
            });

            document.body.appendChild(form);
            form.submit();
        } catch (error) {
            toast.error(translate('Payment failed. Please try again.'));
            setIsProcessing(false);
        }
    };

    const formatPhoneNumber = (value: string) => {
        // Remove all non-digits
        const digits = value.replace(/[^0-9]/g, '');

        // If starts with 60, keep as is
        if (digits.startsWith('60')) {
            return digits.slice(0, 12); // Limit to 12 digits
        }

        // If starts with 0, replace with 60
        if (digits.startsWith('0')) {
            return '60' + digits.slice(1, 11); // Limit to 12 digits total
        }

        // If doesn't start with 60 or 0, add 60 prefix
        return '60' + digits.slice(0, 10); // Limit to 12 digits total
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {translate('toyyibPay Payment')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {translate('You will be redirected to toyyibPay to complete your payment securely via FPX (Malaysian Online Banking)')}
                    </AlertDescription>
                </Alert>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">{translate('Full Name')} *</Label>
                        <Input
                            id="name"
                            value={customerDetails.name}
                            onChange={(e) => {
                                setCustomerDetails((prev) => ({ ...prev, name: e.target.value }));
                                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                            }}
                            placeholder={translate('Enter your full name')}
                            className={errors.name ? 'border-red-500' : ''}
                            required
                        />
                        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">{translate('Email Address')} *</Label>
                        <Input
                            id="email"
                            type="email"
                            value={customerDetails.email}
                            onChange={(e) => {
                                setCustomerDetails((prev) => ({ ...prev, email: e.target.value }));
                                if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                            }}
                            placeholder={translate('Enter your email address')}
                            className={errors.email ? 'border-red-500' : ''}
                            required
                        />
                        {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">{translate('Phone Number')} *</Label>
                        <Input
                            id="phone"
                            value={customerDetails.phone}
                            onChange={(e) => {
                                const formatted = formatPhoneNumber(e.target.value);
                                setCustomerDetails((prev) => ({ ...prev, phone: formatted }));
                                if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                            }}
                            placeholder="60123456789"
                            className={errors.phone ? 'border-red-500' : ''}
                            maxLength={12}
                            required
                        />
                        <p className="text-muted-foreground text-xs">{translate('Malaysian format: 60123456789 (numbers only)')}</p>
                        {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                    </div>

                    <div className="bg-muted rounded-lg p-4">
                        <div className="mb-2 flex items-center gap-2">
                            <CreditCard className="text-primary h-4 w-4" />
                            <p className="text-sm font-medium">{translate('Payment Method: FPX (Online Banking)')}</p>
                        </div>
                        <p className="text-muted-foreground text-xs">
                            {translate('Secure payment via Malaysian banks including Maybank, CIMB, Public Bank, RHB, and more')}
                        </p>
                    </div>

                    <div className="border-t pt-4">
                        <div className="mb-4 flex items-center justify-between">
                            <span className="text-muted-foreground text-sm">{translate('Total Amount')}:</span>
                            <span className="text-lg font-bold">
                                {currency} {planPrice.toFixed(2)}
                            </span>
                        </div>

                        <div className="flex gap-3">
                            <Button type="button" variant="outline" onClick={onCancel} className="flex-1" disabled={isProcessing}>
                                {translate('Cancel')}
                            </Button>
                            <Button type="submit" disabled={isProcessing} className="flex-1">
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {translate('Processing...')}
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="mr-2 h-4 w-4" />
                                        {translate('Pay Now')}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
