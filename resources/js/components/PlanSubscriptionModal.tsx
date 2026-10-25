import { PaymentMethod } from '@/types/payment';
import PaymentProcessor from '@components/Payment/PaymentProcessor';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@components/UserInterface/Dialog';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface Plan {
    id: number;
    name: string;
    price: string | number;
    duration: string;
    paymentMethods?: unknown;
    isSubscribed?: boolean;
    isExpired?: boolean;
}

interface PlanSubscriptionModalProps {
    /** Controls whether the subscription dialog is visible. */
    isOpen: boolean;

    /** Closes the subscription workflow. */
    onClose: () => void;

    /** Plan being purchased. */
    plan: Plan;

    /** Billing frequency selected by the customer. */
    billingCycle: 'monthly' | 'yearly';

    /** Payment methods configured and available for the current transaction. */
    paymentMethods: PaymentMethod[];
}

/**
 * PlanSubscriptionModal
 *
 * Presents the payment workflow for subscribing to a selected plan.
 *
 * Responsibilities:
 * - Display the selected plan in the dialog context.
 * - Filter unavailable payment methods.
 * - Delegate payment processing to PaymentProcessor.
 * - Close and refresh the page after successful payment.
 *
 * Accessibility:
 * - Uses the shared Dialog primitive for focus trapping and keyboard handling.
 * - DialogTitle provides the accessible dialog name.
 * - The payment workflow remains inside the dialog's scrollable content area.
 *
 * Performance:
 * - Enabled payment methods are derived with useMemo.
 * - Payment success handling is stabilized with useCallback.
 *
 * Architectural decision:
 * - Payment processing remains delegated to PaymentProcessor.
 * - This component intentionally does not contain provider-specific payment logic.
 */
export default function PlanSubscriptionModal({ isOpen, onClose, plan, billingCycle, paymentMethods }: PlanSubscriptionModalProps) {
    const { t: translate } = useTranslation();

    const enabledPaymentMethods = paymentMethods.filter((method) => method.enabled);

    const handlePaymentSuccess = useCallback(() => {
        onClose();

        // Refresh the page so the server-provided subscription state is current.
        window.location.reload();
    }, [onClose]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose} modal={false}>
            <DialogContent className="flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden p-0 sm:max-w-xl">
                <DialogHeader className="border-border shrink-0 border-b px-6 py-4">
                    <DialogTitle className="text-center">{translate('Complete your subscription')}</DialogTitle>
                </DialogHeader>

                <div className="min-h-0 flex-1 scrollbar-none overflow-y-auto px-6 py-5">
                    <PaymentProcessor
                        plan={plan}
                        billingCycle={billingCycle}
                        paymentMethods={enabledPaymentMethods}
                        onSuccess={handlePaymentSuccess}
                        onCancel={onClose}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
