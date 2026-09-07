import { toast } from '@/components/custom-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { router } from '@inertiajs/react';
import { CheckCircle, Copy, FileText, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface BankTransferFormProps {
    planId: number;
    planPrice: number;
    couponCode: string;
    billingCycle: string;
    bankDetails: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function BankTransferForm({ planId, planPrice, couponCode, billingCycle, bankDetails, onSuccess, onCancel }: BankTransferFormProps) {
    const { t: translate } = useTranslation();
    const [processing, setProcessing] = useState(false);
    const [receipt, setReceipt] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
            const maximumSize = 5 * 1024 * 1024; // 5MB
            if (!allowedTypes.includes(file.type)) {
                toast.error(translate('Only JPG, PNG, and PDF files are allowed'));
                return;
            }
            if (file.size > maximumSize) {
                toast.error(translate('File size must not exceed 5MB'));
                return;
            }
            setReceipt(file);
        }
    };
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success(translate('Copied to clipboard'));
    };

    const handleRemoveFile = () => {
        setReceipt(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleConfirmPayment = () => {
        if (!receipt) {
            toast.error(translate('Please upload your bank transfer receipt'));
            return;
        }

        setProcessing(true);

        const formData = new FormData();
        formData.append('plan_id', planId.toString());
        formData.append('billing_cycle', billingCycle);
        formData.append('coupon_code', couponCode || '');
        formData.append('amount', planPrice.toString());
        formData.append('receipt', receipt);

        router.post(route('bank.payment'), formData, {
            onSuccess: () => {
                toast.success(translate('Payment request submitted successfully'));
                onSuccess();
            },
            onError: (errors) => {
                const message = typeof errors === 'string' ? errors : Object.values(errors).flat().join(', ');
                toast.error(message || translate('Failed to submit payment request'));
            },
            onFinish: () => {
                setProcessing(false);
            },
        });
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardContent className="p-4">
                    <h3 className="mb-3 font-medium">{translate('Bank Transfer Details')}</h3>
                    <div className="space-y-3 text-sm">
                        <div className="whitespace-pre-line">{bankDetails}</div>
                        <div className="flex items-center justify-between rounded bg-gray-50 p-2">
                            <span className="font-medium">
                                {translate('Amount')}: {window.appSettings.formatCurrency(planPrice)}
                            </span>
                            <Button variant="outline" size="sm" onClick={() => copyToClipboard(planPrice.toString())}>
                                <Copy className="mr-1 h-3 w-3" />
                                {translate('Copy')}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                        <CheckCircle className="mt-0.5 h-5 w-5 text-orange-600" />
                        <div className="text-sm text-orange-800">
                            <p className="mb-1 font-medium">{translate('Important Instructions')}</p>
                            <ul className="space-y-1 text-xs">
                                <li>• {translate('Transfer the exact amount shown above')}</li>
                                <li>• {translate('Include your order reference in the transfer description')}</li>
                                <li>• {translate('Your plan will be activated after payment verification')}</li>
                                <li>• {translate('Verification may take 1-3 business days')}</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Receipt Upload */}
            <div className="space-y-2">
                <Label htmlFor="bank-receipt" required>
                    {translate('Bank Transfer Receipt')}
                </Label>
                <Input
                    id="bank-receipt"
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                />
                {!receipt ? (
                    <label
                        htmlFor="bank-receipt"
                        className="hover:border-primary hover:bg-primary/5 flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 transition-colors"
                    >
                        <Upload className="mb-1 h-5 w-5 text-gray-400" />
                        <span className="text-xs text-gray-500">{translate('Click to upload receipt')}</span>
                        <span className="text-xs text-gray-400">{translate('JPG, PNG, PDF up to 5MB')}</span>
                    </label>
                ) : (
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="text-primary h-4 w-4 flex-shrink-0" />
                            <span className="truncate text-sm text-gray-700">{receipt.name}</span>
                        </div>
                        <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="flex-shrink-0 rounded p-1 hover:bg-gray-200"
                            title={translate('Remove')}
                        >
                            <X className="h-4 w-4 text-gray-500" />
                        </button>
                    </div>
                )}
            </div>

            <div className="flex gap-3">
                <Button variant="outline" onClick={onCancel} className="flex-1">
                    {translate('Cancel')}
                </Button>
                <Button onClick={handleConfirmPayment} disabled={processing} className="flex-1">
                    {processing ? translate('Processing...') : translate('I have made the payment')}
                </Button>
            </div>
        </div>
    );
}
