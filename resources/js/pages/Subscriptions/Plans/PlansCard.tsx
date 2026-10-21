import { useCallback } from 'react';

import { CurrentPlan, Plan } from '@/types/payment';
import { Button } from '@components/UserInterface/Button';
import { Switch } from '@components/UserInterface/Switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@components/UserInterface/Tooltip';
import { usePage } from '@inertiajs/react';
import { formatCurrencySimple } from '@utils/Helpers/NumberFormatters';
import { CheckCircle2, Crown, Edit, HardDrive, Trash2, Users, X } from 'lucide-react';
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
 * PlansCard
 *
 * Displays an individual subscription plan and its available actions.
 *
 * Responsibilities:
 * - Display pricing, limits, features, and plan status.
 * - Present customer subscription actions.
 * - Present administrator plan-management controls.
 *
 * Accessibility:
 * - Uses semantic article, header, section, and footer elements.
 * - Status is communicated with text rather than color alone.
 * - Icon-only controls include accessible labels.
 *
 * Performance:
 * - Kept as a separate component so plan rendering is isolated from
 *   page-level state and orchestration.
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
            className={[
                'bg-card text-card-foreground relative flex h-full flex-col overflow-hidden rounded-2xl border shadow-sm',
                'transition-[border-color,box-shadow,transform] duration-200',
                'motion-reduce:transition-none',
                plan.recommended
                    ? 'border-primary/50 shadow-primary/10 shadow-lg lg:-translate-y-1'
                    : 'border-border hover:border-primary/30 hover:shadow-md',
                isSuperAdmin && !plan.status ? 'opacity-60 grayscale-[0.2]' : '',
            ]
                .filter(Boolean)
                .join(' ')}
            aria-labelledby={`plan-${plan.id}-name`}
        >
            {plan.recommended && (
                <>
                    <div className="bg-primary absolute inset-x-0 top-0 h-1" aria-hidden="true" />

                    <div className="absolute top-0 left-1/2 z-10 -translate-x-1/2">
                        <span className="border-primary/20 bg-primary text-primary-foreground inline-flex -translate-y-1/2 items-center rounded-full border px-3 py-1 text-xs font-semibold shadow-sm">
                            {translate('Recommended')}
                        </span>
                    </div>
                </>
            )}

            <header className="border-border border-b px-6 pt-8 pb-7 text-center sm:px-8">
                <div className="mb-3 flex min-h-7 flex-wrap items-center justify-center gap-2">
                    {isSuperAdmin && plan.is_default && (
                        <span className="inline-flex items-center rounded-md border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-sm text-green-700 dark:text-green-400">
                            {translate('Default')}
                        </span>
                    )}

                    {isSuperAdmin && (
                        <span
                            className={
                                plan.status
                                    ? 'inline-flex items-center rounded-md border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-sm text-green-700 dark:text-green-400'
                                    : 'border-destructive/20 bg-destructive/10 text-destructive inline-flex items-center rounded-md border px-2.5 py-1 text-sm'
                            }
                        >
                            {plan.status ? translate('Active') : translate('Inactive')}
                        </span>
                    )}
                </div>

                <h2 id={`plan-${plan.id}-name`} className="text-foreground text-2xl font-semibold tracking-tight">
                    {plan.name}
                </h2>

                <div className="mt-5 flex items-end justify-center gap-1">
                    <span className="text-foreground text-4xl font-bold tracking-tight sm:text-5xl">
                        {formatCurrencySimple(plan.price, 'USD', 'en-US')}
                    </span>

                    <span className="text-foreground/75 pb-1.5 text-sm">/{plan.duration == 'monthly' ? translate('Month') : translate('Year')}</span>
                </div>

                <p className="text-foreground/75 mx-auto mt-4 max-w-sm text-sm leading-6">{plan.description}</p>

                {plan.trial_days > 0 && (
                    <div className="mt-5 inline-flex items-center gap-2 rounded-md border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-sm text-green-700 dark:text-green-400">
                        {translate('{{days}} days free trial', {
                            days: plan.trial_days,
                        })}
                    </div>
                )}
            </header>

            <div className="flex flex-1 flex-col p-6 sm:p-8">
                <section aria-labelledby={`plan-${plan.id}-limits`} className="border-border border-b pb-7">
                    <h3 id={`plan-${plan.id}-limits`} className="text-foreground/75 text-xs font-semibold tracking-[0.16em] uppercase">
                        {translate('Usage limits')}
                    </h3>

                    <dl className="mt-5 space-y-4">
                        <div className="flex items-center justify-between gap-4">
                            <dt className="text-foreground/75 flex items-center gap-3 text-sm">
                                <span className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg" aria-hidden="true">
                                    <Users className="h-4 w-4" />
                                </span>

                                {translate('Users')}
                            </dt>

                            <dd className="text-foreground text-sm font-semibold">{plan.stats.users}</dd>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <dt className="text-foreground/75 flex items-center gap-3 text-sm">
                                <span
                                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-600 dark:text-green-400"
                                    aria-hidden="true"
                                >
                                    <Users className="h-4 w-4" />
                                </span>

                                {translate('Staff')}
                            </dt>

                            <dd className="text-foreground text-sm font-semibold">{plan.stats.staffs.toLocaleString()}</dd>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <dt className="text-foreground/75 flex items-center gap-3 text-sm">
                                <span
                                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400"
                                    aria-hidden="true"
                                >
                                    <HardDrive className="h-4 w-4" />
                                </span>

                                {translate('Storage')}
                            </dt>

                            <dd className="text-foreground text-sm font-semibold">{plan.stats.storage} GB</dd>
                        </div>
                    </dl>
                </section>

                <section aria-labelledby={`plan-${plan.id}-features`} className="flex-1 py-7">
                    <h3 id={`plan-${plan.id}-features`} className="text-foreground/75 text-xs font-semibold tracking-[0.16em] uppercase">
                        {translate('Features')}
                    </h3>

                    <ul className="mt-5 space-y-3">
                        {commonFeatures.map((feature) => {
                            const included = plan.features.includes(feature);

                            return (
                                <li key={feature} className="flex items-start gap-3">
                                    <span
                                        className={
                                            included
                                                ? 'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-600 dark:text-green-400'
                                                : 'bg-muted text-foreground/75 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full'
                                        }
                                        aria-hidden="true"
                                    >
                                        {included ? <CheckCircle2 className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                                    </span>

                                    <span className={included ? 'text-foreground text-sm leading-6' : 'text-foreground/75 text-sm leading-6'}>
                                        {translate(feature)}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </section>

                <footer className="mt-auto">
                    {!isSuperAdmin && plan.is_current && (
                        <div className="pb-6 text-center">
                            <span className="inline-flex gap-1.5 rounded-sm border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-sm text-amber-700 dark:text-amber-400">
                                {translate('Expires')} {window.hfSettings.formatDateTimeSimple(planExpiryDate, false)}
                            </span>
                        </div>
                    )}
                    {isSuperAdmin ? (
                        <div className="border-border bg-muted/40 flex items-center justify-between gap-3 rounded-xl border p-3">
                            <div className="flex items-center gap-3">
                                <Switch checked={plan.status} onCheckedChange={handleToggleStatus} aria-label={translate('Toggle plan status')} />

                                <span className="text-foreground/75 text-sm">{plan.status ? translate('Active') : translate('Inactive')}</span>
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
                                            className="text-foreground/75 hover:bg-muted hover:text-foreground"
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
                                                size="icon"
                                                variant="ghost"
                                                onClick={handleDelete}
                                                aria-label={translate('Delete {{name}}', {
                                                    name: plan.name,
                                                })}
                                                className="text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
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
                        <Button type="button" size="lg" disabled className="w-full">
                            <Crown aria-hidden="true" className="mr-2 h-4 w-4" />
                            {translate('Already subscribed')}
                        </Button>
                    ) : plan.is_current ? (
                        <Button type="button" size="lg" disabled className="w-full">
                            {translate('Current plan')}
                        </Button>
                    ) : plan.is_trial_available && !userTrialUsed ? (
                        <div className="space-y-3">
                            <Button
                                type="button"
                                size="lg"
                                variant="outline"
                                onClick={handleStartTrial}
                                disabled={isSubmitting}
                                className="h-12 w-full"
                            >
                                {translate('Start {{days}} day trial', {
                                    days: plan.trial_days,
                                })}
                            </Button>

                            <Button type="button" size="lg" onClick={handleSubscribe} disabled={isSubmitting} className="h-12 w-full">
                                {translate('Subscribe now')}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <Button type="button" size="lg" variant="outline" onClick={handleRequestPlan} disabled={isSubmitting} className="w-full">
                                {translate('Request plan')}
                            </Button>

                            <Button
                                type="button"
                                size="lg"
                                onClick={handleSubscribe}
                                disabled={isSubmitting || isCurrentlySubscribed}
                                className="h-12 w-full"
                            >
                                {isCurrentlySubscribed ? translate('Already subscribed') : translate('Subscribe now')}
                            </Button>
                        </div>
                    )}
                </footer>
            </div>
        </article>
    );
};

export default PlansCard;
