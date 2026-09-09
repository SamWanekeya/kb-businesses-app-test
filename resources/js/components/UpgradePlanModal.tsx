import { useEffect, useState } from 'react';

import { Badge } from '@components/UserInterface/Badge';
import { Button } from '@components/UserInterface/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/UserInterface/Dialog';
import { RadioGroup, RadioGroupItem } from '@components/UserInterface/RadioGroup';
import { Switch } from '@components/UserInterface/Switch';
import { formatSentenceCase } from '@utils/Helpers/StringFormatters';
import { CheckCircle2, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Plan {
    id: number;
    name: string;
    price: string | number;
    duration: string;
    description?: string;
    features?: string[];
    business?: number;
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
}

export default function UpgradePlanModal({ isOpen, onClose, onConfirm, plans, currentPlanId }: UpgradePlanModalProps) {
    const { t: translate } = useTranslation();
    const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
    const [isYearly, setIsYearly] = useState(false);

    // Filter plans based on billing period
    const filteredPlans = plans.filter((plan) => {
        const duration = plan.duration;
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
    }, [isOpen, plans, isYearly, filteredPlans, currentPlanId]);

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
                    <DialogTitle className="text-lg font-semibold text-neutral-500">{translate('Upgrade plan for organization')}</DialogTitle>
                    <DialogDescription className="text-sm text-neutral-600">{translate('Select a new plan for this organization')}</DialogDescription>
                </DialogHeader>

                {/* Billing Period Toggle */}
                <div className="flex items-center justify-center gap-3 rounded-lg bg-neutral-50 px-4 py-2">
                    <span className={`text-sm font-medium transition-colors ${!isYearly ? 'text-primary' : 'text-neutral-600'}`}>
                        {translate('Monthly')}
                    </span>
                    <Switch checked={isYearly} onCheckedChange={setIsYearly} className="data-[state=checked]:bg-primary" />
                    <span className={`text-sm font-medium transition-colors ${isYearly ? 'text-primary' : 'text-neutral-600'}`}>
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
                        onValueChange={(value) => {
                            setSelectedPlanId(parseInt(value));
                        }}
                        className="space-y-2 pr-2"
                    >
                        {filteredPlans.length > 0 ? (
                            filteredPlans.map((plan) => (
                                <div
                                    key={plan.id}
                                    className={`relative cursor-pointer rounded-lg border-2 p-3 transition-all ${
                                        selectedPlanId === plan.id
                                            ? 'border-primary bg-primary/5'
                                            : 'border-neutral-200 bg-white hover:border-neutral-300'
                                    }`}
                                    onClick={() => {
                                        setSelectedPlanId(plan.id);
                                    }}
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
                                                    <h3 className="text-base leading-tight font-semibold text-neutral-500">{plan.name}</h3>
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
                                                <CreditCard className="h-3.5 w-3.5 flex-shrink-0 text-neutral-400" />
                                                <span className="text-base leading-tight font-bold text-neutral-500">
                                                    {window.hfSettings.formatCurrency(plan.price) || `$${plan.price}`}
                                                </span>
                                                <span className="text-sm leading-tight text-neutral-600">
                                                    / {translate(formatSentenceCase(plan.duration))}
                                                </span>
                                            </div>

                                            {/* Description */}
                                            {plan.description && <p className="mb-1.5 text-sm leading-snug text-neutral-600">{plan.description}</p>}

                                            {/* Feature Tags */}
                                            {plan.features && plan.features.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {plan.features.slice(0, 3).map((feature, index) => (
                                                        <Badge
                                                            key={`${plan.id}-${index}`}
                                                            variant="outline"
                                                            className="border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs leading-tight font-normal text-neutral-700"
                                                        >
                                                            <CheckCircle2 className="mr-1 h-3 w-3 flex-shrink-0 text-green-500" />
                                                            <span className="truncate">{feature}</span>
                                                        </Badge>
                                                    ))}
                                                    {plan.features.length > 3 && (
                                                        <Badge
                                                            variant="outline"
                                                            className="border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs leading-tight font-normal text-neutral-600"
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
                            <div className="py-8 text-center text-neutral-500">
                                <p className="text-sm">
                                    {translate('No plans available for')} {isYearly ? translate('Yearly') : translate('Monthly')}{' '}
                                    {translate('Billing')}
                                </p>
                            </div>
                        )}
                    </RadioGroup>
                </div>

                <DialogFooter>
                    <Button variant="outline" size="lg" onClick={onClose}>
                        {translate('Cancel')}
                    </Button>
                    <Button size="lg" onClick={handleConfirm} disabled={!selectedPlanId || filteredPlans.length === 0}>
                        {translate('Upgrade plan')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
