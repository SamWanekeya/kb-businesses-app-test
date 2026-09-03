import { InvoicePaymentProcessor } from '@/components/payment/invoice-payment-processor';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';

interface Invoice {
    id: number;
    invoice_number: string;
    name: string;
    total_amount: number;
}

interface InvoicePaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: Invoice;
    amount: number;
    onAmountChange: (amount: number) => void;
}

export function InvoicePaymentModal({ isOpen, onClose, invoice, amount, onAmountChange }: InvoicePaymentModalProps) {
    const { t } = useTranslation();

    const handlePaymentSuccess = () => {
        onClose();
        window.location.reload();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="flex max-h-[90vh] max-w-lg flex-col print:hidden">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle>
                        {t('Pay Invoice')} #{invoice.invoice_number}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2">
                    <InvoicePaymentProcessor
                        invoice={invoice}
                        amount={amount}
                        onAmountChange={onAmountChange}
                        onSuccess={handlePaymentSuccess}
                        onCancel={onClose}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
