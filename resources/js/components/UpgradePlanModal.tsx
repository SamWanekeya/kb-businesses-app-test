import { Badge } from '@components/UserInterface/badge';
import { Button } from '@components/UserInterface/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/UserInterface/dialog';
import { RadioGroup, RadioGroupItem } from '@components/UserInterface/radio-group';
import { Switch } from '@components/UserInterface/switch';
import { CheckCircle2, CreditCard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Plan {
    id: number;
    name: string;
    price: string | number;
    duration: string;
    description?: string;
    features?: string[];
    organization?: number;
    maximum_users?: number;
    storage_limit?: string;
    is_active?: boolean;
    is_current?: boolean;
    is_default?: boolean;
}

interface UpgradePlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (planId: number, duration: string) => void;
    plans: Plan[];
    currentPlanId?: number;
    organizationName: string;
}

export function UpgradePlanModal({ isOpen, onClose, onConfirm, plans, currentPlanId, organizationName }: UpgradePlanModalProps) {
    const { t: translate } = useTranslation();
    const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
    const [isYearly, setIsYearly] = useState(false);

    // Filter plans based on billing period
    const filteredPlans = plans.filter((plan) => {
        const duration = plan.duration.toLowerCase();
        return isYearly ? duration === 'yearly' : duration === 'monthly';
    });

    // Initialize with current plan ID when modal opens
    useEffect(() => {
        if (isOpen && filteredPlans && filteredPlans.length > 0) {
            const currentPlan = filteredPlans.find((plan) => plan.is_current === true);

            if (currentPlan) {
                setSelectedPlanId(currentPlan.id);
            } else if (currentPlanId) {
                const planExists = filteredPlans.find((plan) => plan.id === currentPlanId);
                setSelectedPlanId(planExists ? currentPlanId : filteredPlans[0].id);
            } else {
                setSelectedPlanId(filteredPlans[0].id);
            }
        }
    }, [isOpen, plans, isYearly]);

    // Reset selected plan when switching billing periods if current selection is not available
    useEffect(() => {
        if (filteredPlans.length > 0 && selectedPlanId) {
            const currentSelected = filteredPlans.find((plan) => plan.id === selectedPlanId);
            if (!currentSelected) {
                setSelectedPlanId(filteredPlans[0].id);
            }
        }
    }, [isYearly]);

    const handleConfirm = () => {
        if (selectedPlanId) {
            onConfirm(selectedPlanId, isYearly ? 'yearly' : 'monthly');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold text-gray-900">{translate('Upgrade Plan for Organization')}</DialogTitle>
                    <DialogDescription className="text-sm text-gray-600">{translate('Select a new plan for this organization')}</DialogDescription>
                </DialogHeader>

                {/* Billing Period Toggle */}
                <div className="flex items-center justify-center gap-3 rounded-lg bg-gray-50 px-4 py-2">
                    <span className={`text-sm font-medium transition-colors ${!isYearly ? 'text-primary' : 'text-gray-600'}`}>
                        {translate('Monthly')}
                    </span>
                    <Switch checked={isYearly} onCheckedChange={setIsYearly} className="data-[state=checked]:bg-primary" />
                    <span className={`text-sm font-medium transition-colors ${isYearly ? 'text-primary' : 'text-gray-600'}`}>
                        {translate('Yearly')}
                    </span>
                    {isYearly && (
                        <Badge variant="secondary" className="ml-2 border-0 bg-green-100 text-xs font-medium text-green-700">
                            {translate('Save up to 20%')}
                        </Badge>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto py-2 pr-2">
                    <RadioGroup
                        value={selectedPlanId?.toString() || ''}
                        onValueChange={(value) => setSelectedPlanId(parseInt(value))}
                        className="space-y-2 pr-2"
                    >
                        {filteredPlans.length > 0 ? (
                            filteredPlans.map((plan) => (
                                <div
                                    key={plan.id}
                                    className={`relative cursor-pointer rounded-lg border-2 p-3 transition-all ${
                                        selectedPlanId === plan.id ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}
                                    onClick={() => setSelectedPlanId(plan.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Radio Button */}
                                        <div className="flex items-center pt-0.5">
                                            <RadioGroupItem value={plan.id.toString()} id={`plan-${plan.id}`} className="h-4 w-4" />
                                        </div>

                                        {/* Plan Content */}
                                        <div className="min-w-0 flex-1">
                                            {/* Plan Header */}
                                            <div className="mb-1 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-base leading-tight font-semibold text-gray-900">{plan.name}</h3>
                                                    {plan.is_current && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="border-0 bg-blue-100 px-2 py-0 text-xs leading-tight font-medium text-blue-700"
                                                        >
                                                            {translate('Current')}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Price */}
                                            <div className="mb-1 flex items-baseline gap-1">
                                                <CreditCard className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                                                <span className="text-base leading-tight font-bold text-gray-900">
                                                    {window.appSettings?.formatCurrency(plan.price) || `$${plan.price}`}
                                                </span>
                                                <span className="text-sm leading-tight text-gray-600">/ {plan.duration.toLowerCase()}</span>
                                            </div>

                                            {/* Description */}
                                            {plan.description && <p className="mb-1.5 text-sm leading-snug text-gray-600">{plan.description}</p>}

                                            {/* Feature Tags */}
                                            {plan.features && plan.features.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {plan.features.slice(0, 3).map((feature, index) => (
                                                        <Badge
                                                            key={`${plan.id}-${index}`}
                                                            variant="outline"
                                                            className="border-gray-200 bg-gray-50 px-2 py-0.5 text-xs leading-tight font-normal text-gray-700"
                                                        >
                                                            <CheckCircle2 className="mr-1 h-3 w-3 flex-shrink-0 text-green-500" />
                                                            <span className="truncate">{feature}</span>
                                                        </Badge>
                                                    ))}
                                                    {plan.features.length > 3 && (
                                                        <Badge
                                                            variant="outline"
                                                            className="border-gray-200 bg-gray-50 px-2 py-0.5 text-xs leading-tight font-normal text-gray-600"
                                                        >
                                                            +{plan.features.length - 3} more
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-8 text-center text-gray-500">
                                <p className="text-sm">
                                    {translate('No plans available for')} {isYearly ? translate('yearly') : translate('monthly')}{' '}
                                    {translate('billing')}
                                </p>
                            </div>
                        )}
                    </RadioGroup>
                </div>

                <DialogFooter className="border-t pt-3">
                    <Button variant="outline" onClick={onClose} className="text-sm font-medium">
                        {translate('Cancel')}
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!selectedPlanId || filteredPlans.length === 0}
                        className="bg-primary hover:bg-primary/90 text-sm font-medium"
                    >
                        {translate('Upgrade Plan')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
