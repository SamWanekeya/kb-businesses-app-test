import { Button } from '@components/UserInterface/Button';
import { DialogContent, DialogHeader, DialogTitle } from '@components/UserInterface/Dialog';
import { formatCurrencySimple } from '@utils/Helpers/NumberFormatters';
import type { LucideIcon } from 'lucide-react';
import { CheckCircle, Clock, Download, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type PlanOrderStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

interface PlanOrderUser {
    name: string | null;
}

interface PlanOrderPlan {
    name: string | null;
}

/**
 * Defines the order data required by the details dialog.
 *
 * Nullable fields reflect information that may not yet exist,
 * particularly for pending or unprocessed orders.
 */
interface PlanOrder {
    order_number: string | number;
    status: string;
    user?: PlanOrderUser | null;
    plan?: PlanOrderPlan | null;
    billing_cycle: string | null;
    payment_method: string | null;
    original_price: number | string;
    discount_amount: number | string;
    final_price: number | string;
    coupon_code?: string | null;
    payment_id?: string | null;
    ordered_at: string | null;
    processed_at: string | null;
    processed_by?: PlanOrderUser | null;
    notes?: string | null;
    receipt?: string | null;
}

interface ViewPlanOrderProps {
    planOrder: PlanOrder;
}

interface DetailRowProps {
    label: string;
    value?: ReactNode;
    children?: ReactNode;
}

interface StatusPresentation {
    icon: LucideIcon;
    className: string;
}

/**
 * Maps known order statuses to semantic visual treatments.
 * Unknown statuses intentionally use the neutral fallback.
 */
const STATUS_PRESENTATION: Record<PlanOrderStatus, StatusPresentation> = {
    pending: {
        icon: Clock,
        className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    },
    approved: {
        icon: CheckCircle,
        className: 'bg-green-500/10 text-green-700 dark:text-green-400',
    },
    rejected: {
        icon: XCircle,
        className: 'bg-red-500/10 text-red-700 dark:text-red-400',
    },
    cancelled: {
        icon: XCircle,
        className: 'bg-muted text-foreground/75',
    },
};

const DEFAULT_STATUS_PRESENTATION: StatusPresentation = {
    icon: Clock,
    className: 'bg-muted text-foreground/75',
};

/**
 * Renders a consistently formatted label/value pair.
 *
 * The optional children prop supports custom presentations,
 * such as the emphasized final price.
 */
function DetailRow({ label, value, children }: DetailRowProps) {
    return (
        <div className="min-w-0 space-y-1 py-3">
            <p className="text-foreground/75 text-sm">{label}</p>

            {children ?? <p className="text-foreground text-sm break-words">{value ?? '—'}</p>}
        </div>
    );
}

/**
 * Formats a nullable order date using the application's
 * existing date formatter.
 */
function formatOrderDate(value: string | null, unavailableLabel: string): string {
    if (!value) {
        return unavailableLabel;
    }

    return window.hfSettings.formatDateTimeSimple(value);
}

/**
 * Extracts a readable filename from a receipt URL or path.
 */
function getReceiptFilename(receipt: string): string {
    const pathname = receipt.split(/[?#]/, 1)[0];
    const filename = pathname.split('/').pop();

    return filename || 'receipt';
}

/**
 * Displays the details of an existing plan order.
 *
 * Responsibilities:
 * - Present order status, identity, billing, pricing and metadata.
 * - Render optional payment information only when available.
 * - Provide access to the associated receipt.
 *
 * Accessibility:
 * - Uses semantic sections and descriptive labels.
 * - Preserves the dialog primitive's default focus management.
 * - Communicates order status through text as well as color and icon.
 * - Uses a native download link for keyboard-accessible receipt access.
 *
 * Performance:
 * - Keeps static status configuration outside the component.
 * - Avoids unnecessary state, effects and memoization.
 *
 * Extension points:
 * - Additional order metadata can be added through DetailRow.
 * - Receipt access can be adapted to an authenticated download route
 *   if the backend stores receipts privately.
 */
export default function View({ planOrder }: ViewPlanOrderProps) {
    const { t: translate } = useTranslation();

    const statusPresentation = STATUS_PRESENTATION[planOrder.status as PlanOrderStatus] ?? DEFAULT_STATUS_PRESENTATION;

    const StatusIcon = statusPresentation.icon;

    const receipt = planOrder.receipt;
    const receiptFilename = receipt ? getReceiptFilename(receipt) : null;

    const unavailableLabel = translate('Not available');

    return (
        <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden rounded-xl p-0 sm:max-w-xl">
            <DialogHeader className="border-border shrink-0 border-b px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <DialogTitle className="text-base font-semibold tracking-tight">{translate('Plan order details')}</DialogTitle>

                    <span
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-sm capitalize ${statusPresentation.className}`}
                    >
                        <StatusIcon className="size-3.5" aria-hidden="true" />
                        {translate(planOrder.status)}
                    </span>
                </div>

                <p className="text-foreground/75 text-sm">
                    {translate('Order number')}: <span className="text-foreground font-medium">{planOrder.order_number}</span>
                </p>
            </DialogHeader>

            <div className="divide-border min-h-0 flex-1 scrollbar-none divide-y overflow-y-auto px-5 pb-3 sm:px-6">
                {/* User and plan */}
                <section aria-label={translate('User and plan')} className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                    <DetailRow label={translate('User')} value={planOrder.user?.name} />

                    <DetailRow label={translate('Plan')} value={planOrder.plan?.name} />
                </section>

                {/* Billing information */}
                <section aria-label={translate('Billing information')} className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                    <DetailRow label={translate('Billing cycle')} value={planOrder.billing_cycle ? translate(planOrder.billing_cycle) : undefined} />

                    <DetailRow
                        label={translate('Payment method')}
                        value={planOrder.payment_method ? translate(planOrder.payment_method) : undefined}
                    />
                </section>

                {/* Order pricing */}
                <section aria-label={translate('Order pricing')} className="grid grid-cols-1 gap-x-6 sm:grid-cols-3">
                    <DetailRow label={translate('Original price')} value={formatCurrencySimple(planOrder.original_price, 'USD', 'en-US')} />

                    <DetailRow label={translate('Discount')} value={formatCurrencySimple(planOrder.discount_amount, 'USD', 'en-US')} />

                    <DetailRow label={translate('Final price')}>
                        <p className="text-primary text-base font-semibold">{formatCurrencySimple(planOrder.final_price, 'USD', 'en-US')}</p>
                    </DetailRow>
                </section>

                {/* Optional payment metadata */}
                {(planOrder.coupon_code || planOrder.payment_id) && (
                    <section aria-label={translate('Payment details')} className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                        {planOrder.coupon_code && <DetailRow label={translate('Coupon code')} value={planOrder.coupon_code} />}

                        {planOrder.payment_id && <DetailRow label={translate('Payment ID')} value={planOrder.payment_id} />}
                    </section>
                )}

                {/* Order dates */}
                <section aria-label={translate('Order dates')} className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                    <DetailRow label={translate('Order date')} value={formatOrderDate(planOrder.ordered_at, unavailableLabel)} />

                    <DetailRow label={translate('Processed date')} value={formatOrderDate(planOrder.processed_at, unavailableLabel)} />
                </section>

                {/* Processing metadata */}
                {planOrder.processed_by && (
                    <section>
                        <DetailRow label={translate('Processed by')} value={planOrder.processed_by.name} />
                    </section>
                )}

                {/* Order notes */}
                {planOrder.notes && (
                    <section>
                        <DetailRow label={translate('Notes')} value={planOrder.notes} />
                    </section>
                )}

                {/* Receipt */}
                {receipt && receiptFilename && (
                    <section className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                            <p className="text-foreground/75 mb-1 text-sm">{translate('Receipt')}</p>

                            <p className="text-foreground text-sm break-all">{receiptFilename}</p>
                        </div>

                        <Button asChild size="lg" className="shrink-0">
                            <a href={receipt} download={receiptFilename}>
                                <Download className="mr-2 size-4" aria-hidden="true" />
                                {translate('Download receipt')}
                            </a>
                        </Button>
                    </section>
                )}
            </div>
        </DialogContent>
    );
}
