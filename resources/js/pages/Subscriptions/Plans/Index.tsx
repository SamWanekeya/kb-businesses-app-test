import { useCallback, useEffect, useMemo, useState } from 'react';

import { CurrentPlan, PaymentMethod, Plan } from '@/types/payment';
import CrudDeleteModal from '@components/CrudDeleteModal';
import { toast } from '@components/CustomToast';
import PageTemplate from '@components/PageTemplate';
import PlanSubscriptionModal from '@components/PlanSubscriptionModal';
import { Badge } from '@components/UserInterface/Badge';
import { Button } from '@components/UserInterface/Button';
import { Tabs, TabsList, TabsTrigger } from '@components/UserInterface/Tabs';
import { router, usePage } from '@inertiajs/react';
import PlansCard from '@pages/Subscriptions/Plans/PlansCard';
import { PAYMENT_METHOD_LABELS, PAYMENT_METHODS } from '@utils/Payment';
import { route } from '@utils/Routes';
import type { LucideIcon } from 'lucide-react';
import { Banknote, CreditCard, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PaymentSettings {
    is_bank_payment_mode_enabled?: boolean | string;
    // is_stripe_payment_mode_enabled?: boolean | string;
    // is_paypal_payment_mode_enabled?: boolean | string;
    // is_razorpay_payment_mode_enabled?: boolean | string;
    // is_mercadopago_payment_mode_enabled?: boolean | string;
    // mercadopago_access_token?: string | null;
    is_paystack_payment_mode_enabled?: boolean | string;
    // is_flutterwave_payment_mode_enabled?: boolean | string;
    // is_paytabs_payment_mode_enabled?: boolean | string;
    // is_skrill_payment_mode_enabled?: boolean | string;
    // is_coingate_payment_mode_enabled?: boolean | string;
    // is_payfast_payment_mode_enabled?: boolean | string;
    // is_tap_payment_mode_enabled?: boolean | string;
    // is_xendit_payment_mode_enabled?: boolean | string;
    // is_paytr_payment_mode_enabled?: boolean | string;
    // is_mollie_payment_mode_enabled?: boolean | string;
    // is_toyyibpay_payment_mode_enabled?: boolean | string;
    // is_cashfree_payment_mode_enabled?: boolean | string;
    // is_khalti_payment_mode_enabled?: boolean | string;
    // is_iyzipay_payment_mode_enabled?: boolean | string;
    // is_benefit_payment_mode_enabled?: boolean | string;
    // is_ozow_payment_mode_enabled?: boolean | string;
    // is_easebuzz_payment_mode_enabled?: boolean | string;
    // is_authorizenet_payment_mode_enabled?: boolean | string;
    // is_fedapay_payment_mode_enabled?: boolean | string;
    // is_payhere_payment_mode_enabled?: boolean | string;
    // is_cinetpay_payment_mode_enabled?: boolean | string;
    // is_paiement_payment_mode_enabled?: boolean | string;
    // is_nepalste_payment_mode_enabled?: boolean | string;
    // is_yookassa_payment_mode_enabled?: boolean | string;
    // is_aamarpay_payment_mode_enabled?: boolean | string;
    // is_midtrans_payment_mode_enabled?: boolean | string;
}

interface SelectedPlan extends Plan {
    paymentMethods: PaymentSettings;
}

interface Props {
    plans: Plan[];
    billingCycle: 'monthly' | 'yearly';
    hasDefaultPlan?: boolean;
    currentPlan?: CurrentPlan | null;
    userTrialUsed?: boolean;
    paymentMethods?: PaymentSettings[];
    currency?: string;
}

interface PaymentMethodDefinition {
    id: string;
    settingKey: keyof PaymentSettings;
    name: string;
    icon: LucideIcon;
    requiresAccessToken?: boolean;
}

/**
 * Supported payment-provider configuration.
 *
 * The configuration keeps provider-specific settings declarative while
 * preserving the existing PaymentMethod contract consumed by
 * PlanSubscriptionModal and PaymentProcessor.
 */
const PAYMENT_METHOD_DEFINITIONS: readonly PaymentMethodDefinition[] = [
    {
        id: 'bank',
        settingKey: 'is_bank_payment_mode_enabled',
        name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.BANK],
        icon: Banknote,
    },
    // {
    //     id: 'stripe',
    //     settingKey: 'is_stripe_payment_mode_enabled',
    //     name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.STRIPE],
    //     icon: CreditCard,
    // },
    // {
    //     id: 'paypal',
    //     settingKey: 'is_paypal_payment_mode_enabled',
    //     name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.PAYPAL],
    //     icon: CreditCard,
    // },
    // {
    //     id: 'razorpay',
    //     settingKey: 'is_razorpay_payment_mode_enabled',
    //     name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.RAZORPAY],
    //     icon: IndianRupee,
    // },
    // {
    //     id: 'mercadopago',
    //     settingKey: 'is_mercadopago_payment_mode_enabled',
    //     name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.MERCADOPAGO],
    //     icon: Wallet,
    //     requiresAccessToken: true,
    // },
    {
        id: 'paystack',
        settingKey: 'is_paystack_payment_mode_enabled',
        name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.PAYSTACK],
        icon: CreditCard,
    },
    // {
    //     id: 'flutterwave',
    //     settingKey: 'is_flutterwave_payment_mode_enabled',
    //     name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.FLUTTERWAVE],
    //     icon: CreditCard,
    // },
    // {
    //     id: 'paytabs',
    //     settingKey: 'is_paytabs_payment_mode_enabled',
    //     name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.PAYTABS],
    //     icon: CreditCard,
    // },
    // {
    //     id: 'skrill',
    //     settingKey: 'is_skrill_payment_mode_enabled',
    //     name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.SKRILL],
    //     icon: Wallet,
    // },
    // {
    //     id: 'coingate',
    //     settingKey: 'is_coingate_payment_mode_enabled',
    //     name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.COINGATE],
    //     icon: Coins,
    // },
    // {
    //     id: 'payfast',
    //     settingKey: 'is_payfast_payment_mode_enabled',
    //     name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.PAYFAST],
    //     icon: CreditCard,
    // },
    // {
    //     id: 'tap',
    //     settingKey: 'is_tap_payment_mode_enabled',
    //     name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.TAP],
    //     icon: CreditCard,
    // },
    // {
    //     id: 'xendit',
    //     settingKey: 'is_xendit_payment_mode_enabled',
    //     name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.XENDIT],
    //     icon: CreditCard,
    // },
    // {
    //     id: 'paytr',
    //     settingKey: 'is_paytr_payment_mode_enabled',
    //     name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.PAYTR],
    //     icon: CreditCard,
    // },
    // {
    //     id: 'mollie',
    //     settingKey: 'is_mollie_payment_mode_enabled',
    //     name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.MOLLIE],
    //     icon: CreditCard,
    // },
    // {
    //     id: 'toyyibpay',
    //     settingKey: 'is_toyyibpay_payment_mode_enabled',
    //     name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.TOYYIBPAY],
    //     icon: CreditCard,
    // },
    // {
    //     id: 'cashfree',
    //     settingKey: 'is_cashfree_payment_mode_enabled',
    //     name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.CASHFREE],
    //     icon: IndianRupee,
    // },
    // {
    //     id: 'khalti',
    //     settingKey: 'is_khalti_payment_mode_enabled',
    //     name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.KHALTI],
    //     icon: CreditCard,
    // },
    // {
    //     id: 'iyzipay',
    //     settingKey: 'is_iyzipay_payment_mode_enabled',
    //     name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.IYZIPAY],
    //     icon: CreditCard,
    // },
    // {
    //     id: 'benefit',
    //     settingKey: 'is_benefit_payment_mode_enabled',
    //     name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.BENEFIT],
    //     icon: CreditCard,
    // },
    // {
    //     id: 'ozow',
    //     settingKey: 'is_ozow_payment_mode_enabled',
    //     name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.OZOW],
    //     icon: CreditCard,
    // },
    // {
    //     id: 'easebuzz',
    //     settingKey: 'is_easebuzz_payment_mode_enabled',
    //     name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.EASEBUZZ],
    //     icon: IndianRupee,
    // },
    // {
    //     id: 'authorizenet',
    //     settingKey: 'is_authorizenet_payment_mode_enabled',
    //     name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.AUTHORIZENET],
    //     icon: CreditCard,
    // },
    // {
    //     id: 'fedapay',
    //     settingKey: 'is_fedapay_payment_mode_enabled',
    //     name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.FEDAPAY],
    //     icon: CreditCard,
    // },
    // {
    //     id: 'payhere',
    //     settingKey: 'is_payhere_payment_mode_enabled',
    //     name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.PAYHERE],
    //     icon: CreditCard,
    // },
    // {
    //     id: 'cinetpay',
    //     settingKey: 'is_cinetpay_payment_mode_enabled',
    //     name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.CINETPAY],
    //     icon: CreditCard,
    // },
    // {
    //     id: 'paiement',
    //     settingKey: 'is_paiement_payment_mode_enabled',
    //     name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.PAIEMENT],
    //     icon: CreditCard,
    // },
    // {
    //     id: 'nepalste',
    //     settingKey: 'is_nepalste_payment_mode_enabled',
    //     name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.NEPALSTE],
    //     icon: CreditCard,
    // },
    // {
    //     id: 'yookassa',
    //     settingKey: 'is_yookassa_payment_mode_enabled',
    //     name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.YOOKASSA],
    //     icon: CreditCard,
    // },
    // {
    //     id: 'aamarpay',
    //     settingKey: 'is_aamarpay_payment_mode_enabled',
    //     name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.AAMARPAY],
    //     icon: CreditCard,
    // },
    // {
    //     id: 'midtrans',
    //     settingKey: 'is_midtrans_payment_mode_enabled',
    //     name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.MIDTRANS],
    //     icon: CreditCard,
    // },
];

/**
 * Determines whether a payment-provider setting is enabled.
 *
 * The backend can return either boolean values or string representations.
 */
const isPaymentMethodEnabled = (value: boolean | string | undefined): boolean => value === true || value === '1';

/**
 * Converts backend payment settings into the payment-method contract expected
 * by PlanSubscriptionModal.
 *
 * Important:
 * The returned `icon` is a React element, not a Lucide component reference.
 * PlanSubscriptionModal expects `React.ReactNode`.
 */
const formatPaymentMethods = (paymentSettings: PaymentSettings, translate: (key: string) => string): PaymentMethod[] =>
    PAYMENT_METHOD_DEFINITIONS.filter((definition) => {
        if (!isPaymentMethodEnabled(paymentSettings[definition.settingKey])) {
            return false;
        }

        // if (
        //     definition.requiresAccessToken &&
        //     !paymentSettings.mercadopago_access_token
        // ) {
        //     return false;
        // }

        return true;
    }).map((definition) => {
        const Icon = definition.icon;

        return {
            id: definition.id,
            name: definition.id === 'bank' ? translate(definition.name) : translate(definition.name),
            icon: <Icon className="h-5 w-5" aria-hidden="true" />,
            enabled: true,
        };
    });

/**
 * Plans
 *
 * Displays and manages available subscription plans.
 *
 * Responsibilities:
 * - Coordinate billing-cycle navigation.
 * - Handle customer subscription and trial actions.
 * - Handle administrator plan management.
 * - Load payment settings for the subscription workflow.
 * - Coordinate delete and subscription dialogs.
 *
 * Architectural decisions:
 * - Page-level server interactions remain here.
 * - Plan presentation is isolated in PlansCard.
 * - Payment-provider configuration is declarative.
 * - Existing Inertia route contracts and subscription behavior are preserved.
 *
 * Accessibility:
 * - Provides semantic page and plan sections.
 * - Uses accessible Tabs, Switch, Dialog, and Button primitives.
 * - Icon-only controls receive accessible labels.
 * - Decorative icons are hidden from assistive technology.
 *
 * Performance:
 * - Event handlers passed to PlansCard are stabilized.
 * - Static payment-provider configuration lives outside the component.
 * - No unnecessary form abstraction is introduced for router requests.
 */
export default function Plans({ plans: initialPlans, billingCycle: initialBillingCycle, currentPlan, userTrialUsed = false }: Props) {
    const { t: translate } = useTranslation();
    const { auth } = usePage().props;

    const [plans, setPlans] = useState<Plan[]>(initialPlans);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(initialBillingCycle);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
    const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isSuperAdmin = auth?.user?.type === 'super_admin';

    /**
     * Synchronizes local plan state with fresh server-provided plans.
     */
    useEffect(() => {
        setPlans(initialPlans);
    }, [initialPlans]);

    const breadcrumbs = useMemo(
        () => [
            {
                title: translate('Subscriptions'),
            },
            {
                title: translate('Plans'),
                href: route('subscriptions.plans.index'),
            },
        ],
        [translate],
    );

    const commonFeatures = useMemo(() => ['Kakbima Intelligence'], []);

    /**
     * Changes the billing cycle and requests the corresponding server state.
     */
    const handleBillingCycleChange = useCallback((value: string) => {
        if (value !== 'monthly' && value !== 'yearly') {
            return;
        }

        const nextBillingCycle = value as 'monthly' | 'yearly';

        setBillingCycle(nextBillingCycle);

        router.get(
            route('subscriptions.plans.index'),
            {
                billing_cycle: nextBillingCycle,
            },
            {
                preserveState: true,
            },
        );
    }, []);

    /**
     * Requests a plan on behalf of the organization.
     */
    const handlePlanRequest = useCallback(
        (planId: number) => {
            setIsSubmitting(true);

            const toastId = toast.loading(translate('Submitting plan request...'));

            router.post(
                route('subscriptions.plans.request'),
                {
                    plan_id: planId,
                    billing_cycle: billingCycle,
                },
                {
                    onSuccess: () => {
                        toast.dismiss(toastId);
                    },
                    onError: (errors) => {
                        toast.dismiss(toastId);
                        Object.values(errors).forEach((message) => toast.error(translate(message)));
                    },
                    onFinish: () => {
                        setIsSubmitting(false);
                    },
                },
            );
        },
        [billingCycle, translate],
    );

    /**
     * Starts the trial associated with a plan.
     */
    const handleStartTrial = useCallback(
        (planId: number) => {
            setIsSubmitting(true);

            const toastId = toast.loading(translate('Starting trial...'));

            router.post(
                route('subscriptions.plans.trial'),
                {
                    plan_id: planId,
                },
                {
                    onSuccess: () => {
                        toast.dismiss(toastId);
                    },
                    onError: (errors) => {
                        toast.dismiss(toastId);
                        Object.values(errors).forEach((message) => toast.error(translate(message)));
                    },
                    onFinish: () => {
                        setIsSubmitting(false);
                    },
                },
            );
        },
        [translate],
    );

    /**
     * Loads payment settings for the selected plan and opens the subscription
     * workflow.
     *
     * The raw payment settings are intentionally retained on selectedPlan.
     * They are formatted only when passed to PlanSubscriptionModal, preserving
     * the existing component contract.
     */
    const handleSubscribe = useCallback(
        async (planId: number) => {
            const plan = plans.find((item) => item.id === planId);

            if (!plan) {
                return;
            }

            setIsSubmitting(true);

            try {
                const response = await fetch(route('payment.methods'));

                if (!response.ok) {
                    throw new Error('Unable to load payment methods.');
                }

                const paymentSettings = (await response.json()) as PaymentSettings;

                setSelectedPlan({
                    ...plan,
                    paymentMethods: paymentSettings,
                });

                setIsSubscriptionModalOpen(true);
            } catch (error) {
                if (error instanceof Error) {
                    toast.error(translate(error.message));
                } else {
                    toast.error(translate('Unable to load payment methods.'));
                }
            } finally {
                setIsSubmitting(false);
            }
        },
        [plans, translate],
    );

    /**
     * Toggles the active state of an administrative plan.
     */
    const handleTogglePlanStatus = useCallback(
        (planId: number) => {
            const toastId = toast.loading(translate('Updating status...'));

            router.post(
                route('subscriptions.plans.toggle-status', planId),
                {},
                {
                    preserveState: true,
                    onSuccess: () => {
                        setPlans((currentPlans) =>
                            currentPlans.map((plan) =>
                                plan.id === planId
                                    ? {
                                          ...plan,
                                          status: !plan.status,
                                      }
                                    : plan,
                            ),
                        );

                        toast.dismiss(toastId);
                    },
                    onError: (errors) => {
                        toast.dismiss(toastId);
                        Object.values(errors).forEach((message) => toast.error(translate(message)));
                    },
                },
            );
        },
        [translate],
    );

    /**
     * Opens the plan deletion confirmation dialog.
     */
    const handleDelete = useCallback((plan: Plan) => {
        setPlanToDelete(plan);
        setIsDeleteModalOpen(true);
    }, []);

    /**
     * Closes the deletion dialog and clears the selected plan.
     */
    const handleDeleteClose = useCallback(() => {
        setIsDeleteModalOpen(false);
        setPlanToDelete(null);
    }, []);

    /**
     * Deletes the selected administrative plan after confirmation.
     */
    const handleDeleteConfirm = useCallback(() => {
        if (!planToDelete) {
            return;
        }

        const toastId = toast.loading(translate('Deleting plan...'));

        router.delete(route('subscriptions.plans.destroy', planToDelete.id), {
            onSuccess: () => {
                handleDeleteClose();
                toast.dismiss(toastId);
            },
            onError: (errors) => {
                toast.dismiss(toastId);

                Object.values(errors).forEach((message) => toast.error(translate(message)));
            },
        });
    }, [handleDeleteClose, planToDelete, translate]);

    /**
     * Navigates to the plan-editing page.
     */
    const handleEdit = useCallback((planId: number) => {
        router.get(route('subscriptions.plans.edit', planId));
    }, []);

    /**
     * Navigates to the plan-creation page.
     */
    const handleCreatePlan = useCallback(() => {
        router.get(route('subscriptions.plans.create'));
    }, []);

    /**
     * Closes the subscription dialog and clears its selected plan.
     */
    const handleSubscriptionModalClose = useCallback(() => {
        setIsSubscriptionModalOpen(false);
        setSelectedPlan(null);
    }, []);

    return (
        <PageTemplate
            title={translate('Plans')}
            breadcrumbs={breadcrumbs}
            description={translate('Compare subscription plans and choose the right option for your organization.')}
            url="/subscriptions/plans"
        >
            <div className="space-y-8">
                <header className="mx-auto max-w-6xl text-center">
                    <div className="mx-auto max-w-3xl">
                        <h1 className="text-foreground text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                            {isSuperAdmin ? translate('Manage Kakbima subscription plans') : translate('Choose the right plan for your organization')}
                        </h1>
                    </div>

                    <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                        <Tabs value={billingCycle} onValueChange={handleBillingCycleChange} className="w-full sm:w-auto">
                            <TabsList className="bg-muted grid h-auto w-full grid-cols-2 rounded-lg p-1 sm:w-auto">
                                <TabsTrigger value="monthly" className="rounded-lg px-5 py-2.5 text-sm">
                                    {translate('Monthly')}
                                </TabsTrigger>

                                <TabsTrigger value="yearly" className="rounded-lg px-5 py-2.5 text-sm">
                                    <span>{translate('Yearly')}</span>

                                    <Badge className="ml-2 border-0 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400">
                                        {translate('2 months free')}
                                    </Badge>
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        {isSuperAdmin && (
                            <Button type="button" size="lg" onClick={handleCreatePlan}>
                                {translate('Add a new plan')}
                            </Button>
                        )}
                    </div>

                    <div className="text-foreground/75 mt-4 min-h-5 text-sm" aria-live="polite" aria-atomic="true">
                        {isSubmitting && translate('Processing your request...')}
                    </div>
                </header>

                {plans.length > 0 ? (
                    <section
                        aria-labelledby="available-plans-heading"
                        className="mx-auto grid max-w-7xl grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
                    >
                        <h2 id="available-plans-heading" className="sr-only">
                            {translate('Available plans')}
                        </h2>

                        {plans.map((plan) => (
                            <PlansCard
                                key={plan.id}
                                plan={plan}
                                isSuperAdmin={isSuperAdmin}
                                currentPlan={currentPlan}
                                userTrialUsed={userTrialUsed}
                                commonFeatures={commonFeatures}
                                isSubmitting={isSubmitting}
                                onStartTrial={handleStartTrial}
                                onSubscribe={handleSubscribe}
                                onRequestPlan={handlePlanRequest}
                                onToggleStatus={handleTogglePlanStatus}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </section>
                ) : (
                    <section
                        aria-labelledby="empty-plans-heading"
                        className="border-border bg-muted/20 mx-auto max-w-2xl rounded-2xl border border-dashed px-6 py-12 text-center"
                    >
                        <div className="bg-muted mx-auto flex h-12 w-12 items-center justify-center rounded-full" aria-hidden="true">
                            <CreditCard className="text-foreground/75 h-5 w-5" />
                        </div>

                        <h2 id="empty-plans-heading" className="text-foreground mt-4 text-lg font-bold">
                            {translate('No plans available')}
                        </h2>

                        <p className="text-foreground/75 mx-auto mt-2 max-w-md text-sm leading-6">
                            {isSuperAdmin
                                ? translate('Create your first subscription plan to make it available to customers.')
                                : translate('There are currently no subscription plans available for your organization.')}
                        </p>

                        {isSuperAdmin && (
                            <Button type="button" onClick={handleCreatePlan} className="mt-6">
                                <Plus aria-hidden="true" className="mr-2 h-4 w-4" />
                                {translate('Create plan')}
                            </Button>
                        )}
                    </section>
                )}

                {isSuperAdmin && (
                    <CrudDeleteModal
                        isOpen={isDeleteModalOpen}
                        onClose={handleDeleteClose}
                        onConfirm={handleDeleteConfirm}
                        itemName={planToDelete?.name ?? ''}
                        entityName="plan"
                    />
                )}

                {!isSuperAdmin && selectedPlan && (
                    <PlanSubscriptionModal
                        isOpen={isSubscriptionModalOpen}
                        onClose={handleSubscriptionModalClose}
                        plan={selectedPlan}
                        billingCycle={billingCycle}
                        paymentMethods={formatPaymentMethods(selectedPlan.paymentMethods, translate)}
                    />
                )}
            </div>
        </PageTemplate>
    );
}
