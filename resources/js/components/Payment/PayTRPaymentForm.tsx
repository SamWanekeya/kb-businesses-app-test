import { toast } from '@components/CustomToast';
import { Button } from '@components/UserInterface/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/UserInterface/Card';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import { route } from '@utils/Routes';
import axios from 'axios';
import { CreditCard, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PayTRPaymentFormProps {
    planId: number;
    couponCode: string;
    billingCycle: 'monthly' | 'yearly';
    planPrice: number;
    paytrMerchantId: string;
    currency: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function PayTRPaymentForm({
    planId,
    couponCode,
    billingCycle,
    planPrice,
    paytrMerchantId,
    currency,
    onSuccess,
    onCancel,
}: PayTRPaymentFormProps) {
    const { t: translate } = useTranslation();
    const [isProcessing, setIsProcessing] = useState(false);
    const [showIframe, setShowIframe] = useState(false);
    const [iframeUrl, setIframeUrl] = useState('');
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [customerDetails, setCustomerDetails] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
    });

    useEffect(() => {
        // Listen for iframe messages
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== 'https://www.paytr.com') return;

            if (event.data === 'success') {
                setShowIframe(false);
                onSuccess();
            } else if (event.data === 'fail') {
                setShowIframe(false);
                toast.error(translate('Payment failed'));
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onSuccess, t]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!customerDetails.name || !customerDetails.email || !customerDetails.phone) {
            toast.error(translate('Please fill in required customer details'));
            return;
        }

        setIsProcessing(true);

        try {
            const response = await axios.post(route('paytr.create-token'), {
                plan_id: planId,
                billing_cycle: billingCycle,
                coupon_code: couponCode,
                user_name: customerDetails.name,
                user_email: customerDetails.email,
                user_phone: customerDetails.phone,
                user_address: customerDetails.address,
            });

            if (response.data.success) {
                setIframeUrl(response.data.iframe_url);
                setShowIframe(true);
            } else {
                throw new Error(response.data.error || 'Token creation failed');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || translate('Payment failed. Please try again.'));
        } finally {
            setIsProcessing(false);
        }
    };

    if (showIframe) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            {translate('PayTR Payment')}
                        </span>
                        <Button variant="outline" size="sm" onClick={() => setShowIframe(false)}>
                            {translate('Back')}
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[600px] w-full overflow-hidden rounded-lg border">
                        <iframe ref={iframeRef} src={iframeUrl} width="100%" height="100%" frameBorder="0" scrolling="auto" title="PayTR Payment" />
                    </div>
                    <p className="text-muted-foreground mt-2 text-center text-xs">
                        {translate('Complete your payment in the secure PayTR iframe above')}
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {translate('PayTR Payment')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">{translate('Full Name')} *</Label>
                        <Input
                            id="name"
                            value={customerDetails.name}
                            onChange={(e) => setCustomerDetails((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder={translate('Enter full name')}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">{translate('Email Address')} *</Label>
                        <Input
                            id="email"
                            type="email"
                            value={customerDetails.email}
                            onChange={(e) => setCustomerDetails((prev) => ({ ...prev, email: e.target.value }))}
                            placeholder={translate('Enter email address')}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">{translate('Phone Number')} *</Label>
                        <Input
                            id="phone"
                            value={customerDetails.phone}
                            onChange={(e) => setCustomerDetails((prev) => ({ ...prev, phone: e.target.value }))}
                            placeholder="+905xxxxxxxxx"
                            required
                        />
                        <p className="text-muted-foreground text-xs">{translate('Turkish phone number format: +905xxxxxxxxx')}</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">{translate('Address')}</Label>
                        <Input
                            id="address"
                            value={customerDetails.address}
                            onChange={(e) => setCustomerDetails((prev) => ({ ...prev, address: e.target.value }))}
                            placeholder={translate('Enter address (optional)')}
                        />
                    </div>

                    <div className="bg-muted rounded-lg p-3">
                        <p className="text-sm font-medium">{translate('Secure Payment via PayTR')}</p>
                        <p className="text-muted-foreground mt-1 text-xs">{translate('Credit Card, Debit Card - Real-time payment processing')}</p>
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
                                translate('Pay {{amount}}', { amount: `${planPrice} ${currency}` })
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
