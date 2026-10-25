import { PaymentMethod } from '@/types/payment';
import { usePage } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { toast } from '@components/CustomToast';
import BankTransferForm from '@components/Payment/BankTransferForm';
import PaystackPaymentForm from '@components/Payment/PaystackPaymentForm';
import { Button } from '@components/UserInterface/Button';
import { Card, CardContent } from '@components/UserInterface/Card';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import { formatCurrencySimple } from '@utils/Helpers/NumberFormatters';
import { formatSentenceCase } from '@utils/Helpers/StringFormatters';
import { route } from '@utils/Routes';

interface PaymentSettings {
    [key: string]: string | null | undefined;
}

interface PlanDetails {
    id: number;
    name: string;
    price: string | number;
    duration: string;
    paymentMethods?: PaymentSettings;
}

interface Coupon {
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
}

interface CouponValidationResponse {
    valid: boolean;
    message?: string;
    coupon?: Coupon;
}

interface PaymentProcessorProps {
    plan: PlanDetails;
    billingCycle: 'monthly' | 'yearly';
    paymentMethods: PaymentMethod[];
    onSuccess: () => void;
    onCancel: () => void;
}

interface CommonPaymentProps {
    planId: number;
    couponCode: string;
    billingCycle: 'monthly' | 'yearly';
    onSuccess: () => void;
    onCancel: () => void;
}

/**
 * Handles subscription payment selection, coupon validation, pricing, and
 * rendering of the configured payment provider.
 *
 * Responsibilities:
 * - Display the selected subscription and calculated price.
 * - Validate and apply subscription coupons.
 * - Allow the customer to select an enabled payment method.
 * - Render the payment form associated with the selected provider.
 * - Coordinate payment cancellation and completion with the parent modal.
 */
export default function PaymentProcessor({
    plan,
    billingCycle,
    paymentMethods,
    onSuccess,
    onCancel,
}: PaymentProcessorProps) {
    const { t: translate } = useTranslation();
    const { csrfToken } = usePage().props;

    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
    const [couponLoading, setCouponLoading] = useState(false);
    const [showPaymentForm, setShowPaymentForm] = useState(false);

    const originalPrice = Number(plan.price);

    const discountAmount = appliedCoupon
        ? appliedCoupon.type === 'percentage'
            ? (originalPrice * appliedCoupon.value) / 100
            : appliedCoupon.value
        : 0;

    const finalPrice = Math.max(0, originalPrice - discountAmount);

    const enabledPaymentMethods = paymentMethods.filter(
        (method) => method.enabled,
    );

    /**
     * Validates and applies the entered coupon code.
     */
    const handleApplyCoupon = useCallback(async () => {
        const normalizedCouponCode = couponCode.trim();

        if (!normalizedCouponCode) {
            toast.error(translate('Please enter a coupon code'));
            return;
        }

        setCouponLoading(true);

        const toastId = toast.loading(
            translate('Validating provided coupon...'),
        );

        try {
            const response = await fetch(
                route('subscriptions.coupons.validate'),
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                    },
                    body: JSON.stringify({
                        coupon_code: normalizedCouponCode,
                        plan_id: plan.id,
                        amount: originalPrice,
                    }),
                },
            );

            const data = (await response.json()) as CouponValidationResponse;

            toast.dismiss(toastId);

            if (response.ok && data.valid && data.coupon) {
                setAppliedCoupon(data.coupon);
                toast.success(translate('Coupon applied successfully'));
                return;
            }

            setAppliedCoupon(null);
            toast.error(data.message || translate('Invalid coupon code'));
        } catch {
            toast.dismiss(toastId);
            setAppliedCoupon(null);
            toast.error(translate('Failed to validate coupon'));
        } finally {
            setCouponLoading(false);
        }
    }, [couponCode, csrfToken, originalPrice, plan.id, translate]);

    /**
     * Removes the currently applied coupon.
     */
    const handleRemoveCoupon = useCallback(() => {
        setAppliedCoupon(null);
        setCouponCode('');
    }, []);

    /**
     * Selects a payment method.
     */
    const handlePaymentMethodSelect = useCallback((methodId: string) => {
        setSelectedPaymentMethod(methodId);
    }, []);

    /**
     * Opens the selected payment provider.
     */
    const handlePayNow = useCallback(() => {
        if (!selectedPaymentMethod) {
            toast.error(translate('Please select a payment method'));
            return;
        }

        setShowPaymentForm(true);
    }, [selectedPaymentMethod, translate]);

    /**
     * Returns the customer to payment-method selection.
     */
    const handlePaymentCancel = useCallback(() => {
        setShowPaymentForm(false);
        setSelectedPaymentMethod('');
    }, []);

    /**
     * Renders the payment form for the currently selected provider.
     */
    const renderPaymentForm = (): ReactNode => {
        const paymentSettings = plan.paymentMethods ?? {};

        const commonProps: CommonPaymentProps = {
            planId: plan.id,
            couponCode,
            billingCycle,
            onSuccess,
            onCancel: handlePaymentCancel,
        };

        switch (selectedPaymentMethod) {
            case 'bank':
                return (
                    <BankTransferForm
                        {...commonProps}
                        planPrice={finalPrice}
                        bankDetails={paymentSettings.bank_detail || ''}
                    />
                );

            case 'paystack':
                return (
                    <PaystackPaymentForm
                        {...commonProps}
                        planPrice={finalPrice}
                        paystackKey={
                            paymentSettings.paystack_public_key || ''
                        }
                        currency={paymentSettings.currency || 'USD'}
                    />
                );

            default:
                return null;
        }
    };

    if (showPaymentForm) {
        return <div className="space-y-4">{renderPaymentForm()}</div>;
    }

    return (
        <div className="space-y-7">
            {/* Selected plan */}
            <section aria-labelledby="checkout-plan-heading">
                <div className="mb-3">
                    <h2
                        id="checkout-plan-heading"
                        className="text-sm font-semibold text-foreground"
                    >
                        {translate('Selected plan')}
                    </h2>
                </div>

                <Card className="rounded-xl border-border bg-card shadow-none">
                    <CardContent className="flex items-center justify-between gap-4 p-4 sm:p-5">
                        <div className="min-w-0">
                            <h3 className="truncate font-semibold text-foreground">
                                {plan.name}
                            </h3>

                            <p className="mt-1 text-sm text-muted-foreground">
                                {translate('Pay')}{' '}
                                {translate(formatSentenceCase(billingCycle))}
                            </p>
                        </div>

                        <div className="shrink-0 text-right">
                            <p className="text-xl font-semibold tracking-tight text-foreground tabular-nums">
                                {formatCurrencySimple(
                                    originalPrice,
                                    'USD',
                                    'en-US',
                                )}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Payment methods */}
            <section
                aria-labelledby="payment-method-label"
                className="space-y-3"
            >
                <div className="flex items-center justify-between gap-3">
                    <Label
                        id="payment-method-label"
                        className="text-sm font-semibold text-foreground"
                    >
                        {translate('Payment method')}
                    </Label>
                </div>

                {enabledPaymentMethods.length === 0 ? (
                    <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                        <p className="text-sm text-muted-foreground">
                            {translate('No payment methods available')}
                        </p>
                    </div>
                ) : (
                    <div
                        className="grid grid-cols-1 gap-2.5 sm:grid-cols-2"
                        role="group"
                        aria-labelledby="payment-method-label"
                    >
                        {enabledPaymentMethods.map((method) => {
                            const isSelected =
                                selectedPaymentMethod === method.id;

                            return (
                                <button
                                    key={method.id}
                                    type="button"
                                    aria-pressed={isSelected}
                                    onClick={() =>
                                        handlePaymentMethodSelect(method.id)
                                    }
                                    className={[
                                        'flex min-h-16 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left',
                                        'transition-colors duration-150',
                                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                                        isSelected
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border bg-card hover:border-foreground/20 hover:bg-muted/30',
                                    ].join(' ')}
                                >
                                    <span
                                        className={[
                                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                                            isSelected
                                                ? 'bg-primary/10 text-primary'
                                                : 'bg-muted text-muted-foreground',
                                        ].join(' ')}
                                        aria-hidden="true"
                                    >
                                        {method.icon}
                                    </span>

                                    <span
                                        className={[
                                            'min-w-0 flex-1 text-sm font-medium',
                                            isSelected
                                                ? 'text-foreground'
                                                : 'text-foreground/90',
                                        ].join(' ')}
                                    >
                                        {method.name}
                                    </span>

                                    <span
                                        className={[
                                            'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                                            isSelected
                                                ? 'border-primary'
                                                : 'border-muted-foreground/40',
                                        ].join(' ')}
                                        aria-hidden="true"
                                    >
                                        {isSelected && (
                                            <span className="h-2 w-2 rounded-full bg-primary" />
                                        )}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Discount code */}
            <section
                aria-labelledby="discount-code-heading"
                className="space-y-3"
            >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                    <div className="min-w-0 flex-1">
                        <Input
                            id="coupon"
                            label={translate('Discount code')}
                            value={couponCode}
                            onChange={(event) =>
                                setCouponCode(event.target.value)
                            }
                            disabled={Boolean(appliedCoupon)}
                        />
                    </div>

                    {!appliedCoupon ? (
                        <Button
                            type="button"
                            size="lg"
                            variant="outline"
                            onClick={handleApplyCoupon}
                            disabled={!couponCode.trim() || couponLoading}
                            className="h-14"
                        >
                            {couponLoading ? (
                                <>
                                    <Loader2
                                        aria-hidden="true"
                                        className="mr-2 h-4 w-4 animate-spin"
                                    />
                                    {translate('Apply')}
                                </>
                            ) : (
                                translate('Apply')
                            )}
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            size="lg"
                            variant="outline"
                            onClick={handleRemoveCoupon}
                            className="h-14"
                        >
                            {translate('Remove')}
                        </Button>
                    )}
                </div>

                {appliedCoupon && (
                    <div
                        className="flex items-center justify-between gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-3"
                        role="status"
                    >
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                                {translate('Coupon applied')}
                            </p>

                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                {appliedCoupon.code}
                            </p>
                        </div>

                        <span
                            className="shrink-0 text-sm font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                            {appliedCoupon.type === 'percentage'
                                ? `${appliedCoupon.value}%`
                                : formatCurrencySimple(
                                    appliedCoupon.value,
                                    'USD',
                                    'en-US',
                                )}
                        </span>
                    </div>
                )}
            </section>

            {/* Order summary */}
            <section aria-labelledby="order-summary-heading">
                <Card className="rounded-xl border-border bg-card shadow-none">
                    <CardContent className="p-4 sm:p-5">
                        <h2
                            id="order-summary-heading"
                            className="text-sm font-semibold text-foreground"
                        >
                            {translate('Order summary')}
                        </h2>

                        <dl className="mt-5 space-y-3">
                            <div className="flex items-center justify-between gap-4 text-sm">
                                <dt className="text-muted-foreground">
                                    {translate('Subtotal')}
                                </dt>

                                <dd className="font-medium tabular-nums text-foreground">
                                    {formatCurrencySimple(
                                        originalPrice,
                                        'USD',
                                        'en-US',
                                    )}
                                </dd>
                            </div>

                            {appliedCoupon && (
                                <div className="flex items-center justify-between gap-4 text-sm">
                                    <dt className="text-muted-foreground">
                                        {translate('Discount')}
                                    </dt>

                                    <dd className="font-medium tabular-nums text-emerald-700 dark:text-emerald-400">
                                        −
                                        {formatCurrencySimple(
                                            discountAmount,
                                            'USD',
                                            'en-US',
                                        )}
                                    </dd>
                                </div>
                            )}
                        </dl>

                        <div className="mt-5 border-t border-border pt-4">
                            <div className="flex items-end justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">
                                        {translate('Total')}
                                    </p>
                                </div>

                                <p className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                                    {formatCurrencySimple(
                                        finalPrice,
                                        'USD',
                                        'en-US',
                                    )}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Checkout actions */}
            <footer className="flex flex-col-reverse gap-3 sm:flex-row">
                <Button type="button" size="lg" variant="outline" onClick={onCancel} className="w-full">
                    {translate('Cancel')}
                </Button>

                <Button type="button" size="lg" onClick={handlePayNow} disabled={enabledPaymentMethods.length === 0}
                        className="w-full">
                    {translate('Pay now')}
                </Button>
            </footer>
        </div>
    );
}
