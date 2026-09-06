import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';
import { SettingsSection } from '@/components/settings-section';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import axios from 'axios';
import { Edit, Link2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Webhook {
    id: number;
    module: string;
    method: string;
    url: string;
    created_at: string;
}

interface WebhookSettingsProps {
    webhooks?: Webhook[];
}

export default function WebhookSettings({ webhooks = [] }: WebhookSettingsProps) {
    const { t: translate } = useTranslation();
    const [webhookList, setWebhookList] = useState<Webhook[]>(webhooks);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [webhookToDelete, setWebhookToDelete] = useState<Webhook | null>(null);
    const [formData, setFormData] = useState({
        module: '',
        method: 'GET',
        url: '',
    });

    const resetForm = () => {
        setFormData({ module: '', method: 'GET', url: '' });
        setEditingWebhook(null);
    };

    const handleCreate = () => {
        resetForm();
        setIsDialogOpen(true);
    };

    const handleEdit = (webhook: Webhook) => {
        setFormData({
            module: webhook.module,
            method: webhook.method,
            url: webhook.url,
        });
        setEditingWebhook(webhook);
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingWebhook) {
                const response = await axios.put(route('settings.webhooks.update', editingWebhook.id), formData);
                setWebhookList((prev) => prev.map((w) => (w.id === editingWebhook.id ? response.data.webhook : w)));
                toast.success(response.data.message);
            } else {
                const response = await axios.post(route('settings.webhooks.store'), formData);
                setWebhookList((prev) => [...prev, response.data.webhook]);
                toast.success(response.data.message);
            }
            setIsDialogOpen(false);
            resetForm();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || translate('An error occurred');
            toast.error(errorMessage);
        }
    };

    const handleDeleteClick = (webhook: Webhook) => {
        setWebhookToDelete(webhook);
        setDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!webhookToDelete) return;

        try {
            const response = await axios.delete(route('settings.webhooks.destroy', webhookToDelete.id));
            setWebhookList((prev) => prev.filter((w) => w.id !== webhookToDelete.id));
            toast.success(response.data.message);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || translate('An error occurred');
            toast.error(errorMessage);
        } finally {
            setDeleteModalOpen(false);
            setWebhookToDelete(null);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteModalOpen(false);
        setWebhookToDelete(null);
    };

    return (
        <SettingsSection
            title={translate('Webhook Settings')}
            description={translate('Manage webhooks for external integrations')}
            action={
                <Button onClick={handleCreate} size="sm" className="max-[1300px]:px-2.5">
                    <Plus className="mr-2 h-4 w-4 max-[1300px]:mr-0" />
                    <span className="max-[1300px]:hidden">{translate('Add Webhook')}</span>
                </Button>
            }
        >
            <Card>
                <CardContent className="mt-6">
                    <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b bg-[#F0F0F1] hover:!bg-[#F0F0F1] dark:bg-gray-800 dark:hover:!bg-gray-800">
                                    <TableHead className="py-2.5 font-semibold">{translate('Module')}</TableHead>
                                    <TableHead className="py-2.5 font-semibold">{translate('Method')}</TableHead>
                                    <TableHead className="py-2.5 font-semibold">{translate('URL')}</TableHead>
                                    <TableHead className="w-24 py-2.5 text-right font-semibold">{translate('Actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {webhookList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-muted-foreground h-24 text-center dark:text-gray-400">
                                            {translate('No webhooks configured')}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    webhookList.map((webhook) => (
                                        <TableRow
                                            key={webhook.id}
                                            className="border-b hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-700"
                                        >
                                            <TableCell className="py-2.5">
                                                <div className="flex items-center">
                                                    <Link2 className="text-muted-foreground mr-2 h-4 w-4" />
                                                    <span className="text-sm font-medium">{webhook.module}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-2.5">
                                                <span
                                                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                                        webhook.method === 'GET'
                                                            ? 'bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-400/30'
                                                            : 'bg-green-50 text-green-700 ring-green-700/10 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-400/30'
                                                    }`}
                                                >
                                                    {webhook.method}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-2.5">
                                                <div className="text-muted-foreground max-w-xs truncate font-mono text-sm dark:text-gray-400">
                                                    {webhook.url}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8"
                                                                    onClick={() => handleEdit(webhook)}
                                                                >
                                                                    <Edit className="h-4 w-4 text-gray-500" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>{translate('Edit')}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8"
                                                                    onClick={() => handleDeleteClick(webhook)}
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-gray-500" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>{translate('Delete')}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{editingWebhook ? translate('Edit Webhook') : translate('Add Webhook')}</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="module" required>
                                            {translate('Module')}
                                        </Label>
                                        <Select
                                            value={formData.module}
                                            onValueChange={(value) => setFormData((prev) => ({ ...prev, module: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={translate('Select module')} />
                                            </SelectTrigger>
                                            <SelectContent className="z-[60000]">
                                                <SelectItem value="New User">{translate('New User')}</SelectItem>
                                                <SelectItem value="Lead Assigned">{translate('Lead Create')}</SelectItem>
                                                <SelectItem value="Case Created">{translate('Case Create')}</SelectItem>
                                                <SelectItem value="Meeting Invitation">{translate('Meeting Invitation')}</SelectItem>
                                                <SelectItem value="Opportunity Created">{translate('Opportunity Create')}</SelectItem>
                                                <SelectItem value="Quote Created">{translate('Quote Create')}</SelectItem>
                                                <SelectItem value="Task Assigned">{translate('Task Create')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="method">{translate('Method')}</Label>
                                        <Select
                                            value={formData.method}
                                            onValueChange={(value) => setFormData((prev) => ({ ...prev, method: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={translate('Select method')} />
                                            </SelectTrigger>
                                            <SelectContent className="z-[60000]">
                                                <SelectItem value="GET">GET</SelectItem>
                                                <SelectItem value="POST">POST</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="url" required>
                                            {translate('URL')}
                                        </Label>
                                        <Input
                                            id="url"
                                            placeholder="https://kakbima.dev/webhook"
                                            value={formData.url}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                                        />
                                    </div>

                                    <div className="flex justify-end gap-2">
                                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                            {translate('Cancel')}
                                        </Button>
                                        <Button type="submit">{translate('Save')}</Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>

                        <CrudDeleteModal
                            isOpen={deleteModalOpen}
                            onClose={handleDeleteCancel}
                            onConfirm={handleDeleteConfirm}
                            itemName={webhookToDelete?.module || ''}
                            entityName={translate('Webhook')}
                        />
                    </div>
                </CardContent>
            </Card>
        </SettingsSection>
    );
}
