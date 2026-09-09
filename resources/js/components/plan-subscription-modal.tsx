import { PaymentProcessor } from '@components/Payment/PaymentProcessor';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@components/UserInterface/dialog';
import { useTranslation } from 'react-i18next';

interface PaymentMethod {
    id: string;
    name: string;
    icon: React.ReactNode;
    enabled: boolean;
}

interface PlanSubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    plan: {
        id: number;
        name: string;
        price: string | number;
        duration: string;
        paymentMethods?: any;
        isSubscribed?: boolean;
        isExpired?: boolean;
    };
    billingCycle: 'monthly' | 'yearly';
    paymentMethods: PaymentMethod[];
    currencySymbol?: string;
}

export function PlanSubscriptionModal({ isOpen, onClose, plan, billingCycle, paymentMethods, currencySymbol }: PlanSubscriptionModalProps) {
    const { t: translate } = useTranslation();

    const handlePaymentSuccess = () => {
        onClose();
    };

    const enabledPaymentMethods = paymentMethods.filter((method) => method.enabled);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="flex max-h-[90vh] max-w-lg flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle>{translate('Subscribe to {{planName}}', { planName: plan.name })}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2">
                    <PaymentProcessor
                        plan={plan}
                        billingCycle={billingCycle}
                        paymentMethods={enabledPaymentMethods}
                        currencySymbol={currencySymbol}
                        onSuccess={handlePaymentSuccess}
                        onCancel={onClose}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
