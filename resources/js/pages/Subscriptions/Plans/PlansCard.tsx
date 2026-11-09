import { useCallback } from 'react';

import { CurrentPlan, Plan } from '@/types/payment';
import { Button } from '@components/UserInterface/Button';
import { Switch } from '@components/UserInterface/Switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@components/UserInterface/Tooltip';
import { usePage } from '@inertiajs/react';
import { formatCurrencySimple } from '@utils/Helpers/NumberFormatters';
import { Check, Crown, Edit, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
    plan: Plan;
    isSuperAdmin: boolean;
    currentPlan?: CurrentPlan | null;
    userTrialUsed: boolean;
    commonFeatures: string[];
    isSubmitting: boolean;
    onStartTrial: (planId: number) => void;
    onSubscribe: (planId: number) => void;
    onRequestPlan: (planId: number) => void;
    onToggleStatus: (planId: number) => void;
    onEdit: (planId: number) => void;
    onDelete: (plan: Plan) => void;
}

/**
 * Displays subscription plan details, features, and available actions.
 */
const PlansCard = ({
    plan,
    isSuperAdmin,
    currentPlan,
    userTrialUsed,
    commonFeatures,
    isSubmitting,
    onStartTrial,
    onSubscribe,
    onRequestPlan,
    onToggleStatus,
    onEdit,
    onDelete,
}: Props) => {
    const { t: translate } = useTranslation();

    const { auth } = usePage().props;
    const planExpiryDate = auth?.user?.plan_expiry_date ?? auth?.user?.trial_expiry_date;

    const isCurrentlySubscribed = currentPlan?.id === plan.id && Boolean(currentPlan.expires_at) && new Date(currentPlan.expires_at) > new Date();

    const handleStartTrial = useCallback(() => onStartTrial(plan.id), [onStartTrial, plan.id]);

    const handleSubscribe = useCallback(() => onSubscribe(plan.id), [onSubscribe, plan.id]);

    const handleRequestPlan = useCallback(() => onRequestPlan(plan.id), [onRequestPlan, plan.id]);

    const handleToggleStatus = useCallback(() => onToggleStatus(plan.id), [onToggleStatus, plan.id]);

    const handleEdit = useCallback(() => onEdit(plan.id), [onEdit, plan.id]);

    const handleDelete = useCallback(() => onDelete(plan), [onDelete, plan]);

    return (
        <article
            aria-labelledby={`plan-${plan.id}-name`}
            className={[
                'bg-card text-card-foreground relative flex h-full flex-col rounded-xl border',
                'transition-[border-color,box-shadow] duration-200',
                'motion-reduce:transition-none',
                plan.recommended ? 'border-primary shadow-primary/5 shadow-sm' : 'border-border hover:border-foreground/20',
                isSuperAdmin && !plan.status ? 'opacity-70' : '',
            ]
                .filter(Boolean)
                .join(' ')}
        >
            <header className={['border-border flex flex-col border-b px-5 pt-6 pb-6 sm:px-6', plan.recommended ? 'pt-7' : ''].join(' ')}>
                <div className="mb-4 flex min-h-5 items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        {plan.recommended && <span className="text-primary text-xs font-bold">{translate('Recommended')}</span>}

                        {isSuperAdmin && plan.is_default && (
                            <span className="bg-muted text-muted-foreground rounded-md px-2 py-1 text-xs font-medium">{translate('Default')}</span>
                        )}
                    </div>

                    {isSuperAdmin && (
                        <span
                            className={[
                                'shrink-0 text-xs font-medium',
                                plan.status ? 'text-emerald-700 dark:text-emerald-400' : 'text-destructive',
                            ].join(' ')}
                        >
                            {plan.status ? translate('Active') : translate('Inactive')}
                        </span>
                    )}
                </div>

                <h2 id={`plan-${plan.id}-name`} className="text-foreground text-lg font-bold tracking-tight">
                    {plan.name}
                </h2>

                <p className="text-muted-foreground mt-2 min-h-10 text-sm leading-5">{plan.description}</p>

                <div className="mt-6 flex flex-wrap items-baseline gap-x-1.5">
                    <span className="text-foreground text-4xl font-bold tracking-tight tabular-nums sm:text-[2.75rem]">
                        {formatCurrencySimple(plan.price, 'USD', 'en-US')}
                    </span>

                    <span className="text-muted-foreground text-sm">/{plan.duration === 'monthly' ? translate('Month') : translate('Year')}</span>
                </div>

                {plan.trial_days > 0 && (
                    <p className="text-muted-foreground mt-3 text-sm">
                        {translate('{{days}} days free trial', {
                            days: plan.trial_days,
                        })}
                    </p>
                )}
            </header>

            <div className="flex flex-1 flex-col px-5 py-6 sm:px-6">
                <section aria-labelledby={`plan-${plan.id}-limits`} className="border-border border-b pb-6">
                    <h3 id={`plan-${plan.id}-limits`} className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                        {translate('Usage limits')}
                    </h3>

                    <dl className="mt-4 space-y-3.5">
                        <div className="flex items-center justify-between gap-4">
                            <dt className="text-muted-foreground text-sm">{translate('Users')}</dt>
                            <dd className="text-foreground text-sm font-medium tabular-nums">{plan.stats.maximum_users}</dd>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <dt className="text-muted-foreground text-sm">{translate('Projects')}</dt>
                            <dd className="text-foreground text-sm font-medium tabular-nums">{plan.stats.maximum_projects.toLocaleString()}</dd>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <dt className="text-muted-foreground text-sm">{translate('Contacts')}</dt>
                            <dd className="text-foreground text-sm font-medium tabular-nums">{plan.stats.maximum_contacts.toLocaleString()}</dd>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <dt className="text-muted-foreground text-sm">{translate('Accounts')}</dt>
                            <dd className="text-foreground text-sm font-medium tabular-nums">{plan.stats.maximum_accounts.toLocaleString()}</dd>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <dt className="text-muted-foreground text-sm">{translate('Storage')}</dt>
                            <dd className="text-foreground text-sm font-medium tabular-nums">{plan.stats.maximum_storage} GB</dd>
                        </div>
                    </dl>
                </section>

                <section aria-labelledby={`plan-${plan.id}-features`} className="flex-1 py-6">
                    <h3 id={`plan-${plan.id}-features`} className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                        {translate('Features')}
                    </h3>

                    <ul className="mt-4 space-y-3">
                        {commonFeatures.map((feature) => {
                            const included = plan.features.includes(feature);

                            return (
                                <li key={feature} className="flex items-start gap-2.5">
                                    {included ? (
                                        <Check aria-hidden="true" className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                                    ) : (
                                        <X aria-hidden="true" className="text-muted-foreground/50 mt-0.5 h-4 w-4 shrink-0" />
                                    )}

                                    <span className={['text-sm leading-5', included ? 'text-foreground' : 'text-muted-foreground'].join(' ')}>
                                        {translate(feature)}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </section>

                <footer className="border-border mt-auto border-t pt-5">
                    {!isSuperAdmin && plan.is_current && (
                        <p className="text-muted-foreground mb-4 text-center text-xs">
                            {translate('Expires')} {window.kbSettings.formatDateTimeSimple(planExpiryDate, false)}
                        </p>
                    )}

                    {isSuperAdmin ? (
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                                <Switch checked={plan.status} onCheckedChange={handleToggleStatus} aria-label={translate('Toggle plan status')} />

                                <span className="text-muted-foreground text-sm">{plan.status ? translate('Active') : translate('Inactive')}</span>
                            </div>

                            <div className="flex items-center gap-1">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={handleEdit}
                                            aria-label={translate('Edit {{name}}', {
                                                name: plan.name,
                                            })}
                                            className="text-muted-foreground hover:text-foreground"
                                        >
                                            <Edit aria-hidden="true" className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>

                                    <TooltipContent>{translate('Edit')}</TooltipContent>
                                </Tooltip>

                                {!plan.is_default && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={handleDelete}
                                                aria-label={translate('Delete {{name}}', {
                                                    name: plan.name,
                                                })}
                                                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                            >
                                                <Trash2 aria-hidden="true" className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>

                                        <TooltipContent>{translate('Delete')}</TooltipContent>
                                    </Tooltip>
                                )}
                            </div>
                        </div>
                    ) : isCurrentlySubscribed ? (
                        <Button type="button" size="lg" disabled className="h-11 w-full">
                            <Crown aria-hidden="true" className="mr-2 h-4 w-4" />
                            {translate('Already subscribed')}
                        </Button>
                    ) : plan.is_current ? (
                        <Button type="button" size="lg" disabled className="h-11 w-full">
                            {translate('Current plan')}
                        </Button>
                    ) : plan.is_trial_available && !userTrialUsed ? (
                        <div className="space-y-2.5">
                            <Button type="button" size="lg" onClick={handleSubscribe} disabled={isSubmitting} className="h-11 w-full">
                                {translate('Subscribe now')}
                            </Button>

                            <Button
                                type="button"
                                size="lg"
                                variant="outline"
                                onClick={handleStartTrial}
                                disabled={isSubmitting}
                                className="h-11 w-full"
                            >
                                {translate('Start {{days}} day trial', {
                                    days: plan.trial_days,
                                })}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            <Button
                                type="button"
                                size="lg"
                                onClick={handleSubscribe}
                                disabled={isSubmitting || isCurrentlySubscribed}
                                className="h-11 w-full"
                            >
                                {isCurrentlySubscribed ? translate('Already subscribed') : translate('Subscribe now')}
                            </Button>

                            <Button
                                type="button"
                                size="lg"
                                variant="outline"
                                onClick={handleRequestPlan}
                                disabled={isSubmitting}
                                className="h-11 w-full"
                            >
                                {translate('Request plan')}
                            </Button>
                        </div>
                    )}
                </footer>
            </div>
        </article>
    );
};

export default PlansCard;
