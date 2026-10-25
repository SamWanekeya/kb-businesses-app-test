import { router } from '@inertiajs/react';
import { CheckCircle, Copy, FileText, Upload, X } from 'lucide-react';
import { useCallback, useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { toast } from '@components/CustomToast';
import { Button } from '@components/UserInterface/Button';
import { Card, CardContent } from '@components/UserInterface/Card';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import { formatCurrencySimple } from '@utils/Helpers/NumberFormatters';
import { route } from '@utils/Routes';

interface BankTransferFormProps {
    planId: number;
    planPrice: number;
    couponCode: string;
    billingCycle: string;
    bankDetails: string;
    currencySymbol?: string;
    onSuccess: () => void;
    onCancel: () => void;
}

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'] as const;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // Convert MB to bytes

const ACCEPTED_FILE_EXTENSIONS = '.jpg,.jpeg,.png,.pdf';

/**
 * Collects and submits a bank-transfer receipt for manual payment verification.
 *
 * Responsibilities:
 * - Displays the bank transfer instructions and payment amount.
 * - Validates and manages the uploaded payment receipt.
 * - Submits the payment confirmation through Inertia.
 * - Provides accessible loading, error, and success feedback.
 *
 * The component intentionally keeps payment submission and receipt handling
 * local because the workflow is specific to bank-transfer payments.
 */
export default function BankTransferForm({ planId, planPrice, couponCode, billingCycle, bankDetails, onSuccess, onCancel }: BankTransferFormProps) {
    const { t: translate } = useTranslation();

    const [processing, setProcessing] = useState(false);
    const [receipt, setReceipt] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    /**
     * Copies the supplied value to the clipboard and reports the result.
     */
    const copyToClipboard = useCallback(
        async (text: string) => {
            try {
                await navigator.clipboard.writeText(text);
                toast.success(translate('Copied to clipboard'));
            } catch {
                toast.error(translate('Unable to copy to clipboard'));
            }
        },
        [translate],
    );

    /**
     * Validates and stores the selected payment receipt.
     */
    const handleFileChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];

            if (!file) {
                return;
            }

            if (!ALLOWED_FILE_TYPES.includes(file.type as (typeof ALLOWED_FILE_TYPES)[number])) {
                toast.error(translate('Only JPG, PNG, and PDF files are allowed'));
                return;
            }

            if (file.size > MAX_FILE_SIZE) {
                toast.error(translate('File size must not exceed 5MB'));
                return;
            }

            setReceipt(file);
        },
        [translate],
    );

    /**
     * Removes the selected receipt and resets the native file input.
     */
    const handleRemoveFile = useCallback(() => {
        setReceipt(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    /**
     * Submits the bank-transfer confirmation and uploaded receipt.
     */
    const handleConfirmPayment = useCallback(() => {
        if (!receipt) {
            toast.error(translate('Please upload your bank transfer receipt'));
            return;
        }

        setProcessing(true);

        const formData = new FormData();

        formData.append('plan_id', planId.toString());
        formData.append('billing_cycle', billingCycle);
        formData.append('coupon_code', couponCode);
        formData.append('amount', planPrice.toString());
        formData.append('receipt', receipt);

        const toastId = toast.loading(translate('Confirming payment...'));

        router.post(route('subscriptions.bank.payment'), formData, {
            onSuccess: () => {
                toast.dismiss(toastId);
                onSuccess();
            },

            onError: (errors) => {
                toast.dismiss(toastId);

                Object.values(errors).forEach((message) => {
                    toast.error(translate(message));
                });
            },

            onFinish: () => {
                setProcessing(false);
            },
        });
    }, [billingCycle, couponCode, onSuccess, planId, planPrice, receipt, translate]);

    return (
        <div className="space-y-6">
            {/* Bank transfer details */}
            <section className="space-y-5" aria-labelledby="bank-transfer-details">
                <div>
                    <h3 id="bank-transfer-details" className="text-foreground text-base font-bold tracking-tight">
                        {translate('Bank transfer details')}
                    </h3>

                    <p className="text-foreground/75 mt-1 text-sm">{translate('Use the details below to complete your bank transfer')}</p>
                </div>

                <div className="border-border bg-muted/30 rounded-md border p-4">
                    <p className="text-foreground text-sm leading-6 whitespace-pre-line">{bankDetails}</p>
                </div>

                <div className="border-primary/20 bg-primary/5 flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <p className="text-foreground/75 text-sm tracking-wide uppercase">{translate('Amount to transfer')}</p>

                        <p className="text-foreground mt-1 text-xl font-bold tracking-tight tabular-nums">
                            {formatCurrencySimple(planPrice, 'USD', 'en-US')}
                        </p>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={() => {
                            void copyToClipboard(planPrice.toString());
                        }}
                    >
                        <Copy aria-hidden="true" className="mr-2 h-4 w-4" />
                        {translate('Copy')}
                    </Button>
                </div>
            </section>

            {/* Important instructions */}
            <Card className="rounded-md border-amber-500/20 bg-amber-500/5 shadow-none">
                <CardContent className="p-5 sm:p-6">
                    <div className="flex items-start gap-3">
                        <div
                            aria-hidden="true"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        >
                            <CheckCircle className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                            <h4 className="text-foreground text-sm font-bold">{translate('Important instructions')}</h4>

                            <ul className="text-foreground/75 mt-3 space-y-2.5 text-sm">
                                <li className="flex gap-2">
                                    <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                                    <span>{translate('Transfer the exact amount shown above')}</span>
                                </li>

                                <li className="flex gap-2">
                                    <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                                    <span>{translate('Include your order reference in the transfer description')}</span>
                                </li>

                                <li className="flex gap-2">
                                    <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                                    <span>{translate('Your plan will be activated after payment verification')}</span>
                                </li>

                                <li className="flex gap-2">
                                    <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                                    <span>{translate('Verification may take 1-3 business days')}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Receipt upload */}
            <section className="space-y-2.5" aria-labelledby="bank-receipt-label">
                <Label id="bank-receipt-label" htmlFor="bank-receipt" className="text-foreground pb-1 text-sm font-bold">
                    {translate('Bank transfer receipt')}{' '}
                    <span aria-hidden="true" className="text-destructive">
                        *
                    </span>
                    <span className="sr-only">{translate('Required')}</span>
                </Label>

                <Input
                    inputIdentifier="bank-receipt"
                    ref={fileInputRef}
                    inputType="file"
                    accept={ACCEPTED_FILE_EXTENSIONS}
                    onChange={handleFileChange}
                    className="hidden"
                />

                {!receipt ? (
                    <label
                        htmlFor="bank-receipt"
                        className="group border-border bg-muted/20 hover:border-primary/50 hover:bg-primary/5 focus-within:border-primary focus-within:bg-primary/5 flex min-h-28 w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed px-4 py-5 text-center transition-colors"
                    >
                        <div
                            aria-hidden="true"
                            className="bg-primary/10 text-primary group-hover:bg-primary/15 mb-2 flex h-9 w-9 items-center justify-center rounded-md transition-colors"
                        >
                            <Upload className="h-5 w-5" />
                        </div>

                        <span className="text-foreground text-sm">{translate('Click to upload receipt')}</span>

                        <span className="text-foreground/75 mt-1 text-xs">{translate('JPG, PNG, PDF up to 5MB')}</span>
                    </label>
                ) : (
                    <div className="border-border bg-muted/30 flex items-center justify-between gap-3 rounded-md border p-3">
                        <div className="flex min-w-0 items-center gap-3">
                            <div
                                aria-hidden="true"
                                className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
                            >
                                <FileText className="h-4 w-4" />
                            </div>

                            <div className="min-w-0">
                                <p className="text-foreground truncate text-sm">{receipt.name}</p>

                                <p className="text-foreground/75 text-xs">{translate('Receipt uploaded')}</p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="text-foreground/75 hover:bg-destructive/10 hover:text-destructive focus-visible:ring-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
                            title={translate('Remove')}
                            aria-label={translate('Remove')}
                        >
                            <X aria-hidden="true" className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </section>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <Button type="button" size="lg" variant="outline" onClick={onCancel} disabled={processing} className="w-full">
                    {translate('Back')}
                </Button>

                <Button type="button" size="lg" onClick={handleConfirmPayment} disabled={processing || !receipt} className="w-full">
                    {processing ? translate('Processing...') : translate('Submit')}
                </Button>
            </div>
        </div>
    );
}
