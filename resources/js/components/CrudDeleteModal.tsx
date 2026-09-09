// components/CrudDeleteModal.tsx
import { Button } from '@components/UserInterface/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/UserInterface/Dialog';
import { useTranslation } from 'react-i18next';

interface CrudDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemName: string;
    entityName: string;
}

export default function CrudDeleteModal({ isOpen, onClose, onConfirm, itemName, entityName }: CrudDeleteModalProps) {
    const { t: translate } = useTranslation();
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {translate('Delete')} {entityName}
                    </DialogTitle>
                    <DialogDescription>
                        {translate('Are you sure you want to delete')} {itemName || `this ${entityName}`}? {translate('This action cannot be undone')}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-end">
                    <Button type="button" variant="outline" size="lg" onClick={onClose}>
                        {translate('Cancel')}
                    </Button>
                    <Button type="button" variant="destructive" size="lg" onClick={onConfirm}>
                        {translate('Delete')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
