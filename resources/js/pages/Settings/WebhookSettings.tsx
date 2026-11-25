import CrudDeleteModal from '@components/CrudDeleteModal';
import { toast } from '@components/CustomToast';
import SettingsSection from '@components/SettingsSection';
import { Button } from '@components/UserInterface/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@components/UserInterface/Dialog';
import { Input } from '@components/UserInterface/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/UserInterface/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/UserInterface/Table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@components/UserInterface/Tooltip';
import { usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { Edit, Link2, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
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
    const { csrfToken } = usePage().props;

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
                const response = await fetch(route('settings.webhooks.update', editingWebhook.id), {
                    method: 'PUT',
                    headers: {
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                    },
                    body: formData,
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data?.message || translate('An error occurred'));
                }

                setWebhookList((prev) => prev.map((w) => (w.id === editingWebhook.id ? data.webhook : w)));

                toast.success(data.message);
            } else {
                const response = await fetch(route('settings.webhooks.store'), {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                    },
                    body: formData,
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data?.message || translate('An error occurred'));
                }

                setWebhookList((prev) => [...prev, data.webhook]);
                toast.success(data.message);
            }

            setIsDialogOpen(false);
            resetForm();
        } catch (error: any) {
            toast.error(error?.message || translate('An error occurred'));
        }
    };

    const handleDeleteClick = (webhook: Webhook) => {
        setWebhookToDelete(webhook);
        setDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!webhookToDelete) return;

        try {
            const response = await fetch(route('settings.webhooks.destroy', webhookToDelete.id), {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || translate('An error occurred'));
            }

            setWebhookList((prev) => prev.filter((w) => w.id !== webhookToDelete.id));
            toast.success(data.message);
        } catch (error: any) {
            toast.error(error.message || translate('An error occurred'));
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
            title={translate('Webhook')}
            description={translate('Manage webhooks for external integrations')}
            action={
                <Button onClick={handleCreate} size="lg">
                    {translate('Add a new webhook')}
                </Button>
            }
        >
            <div aria-hidden="true" className="border-border border-t pb-3" />
            <div className="overflow-hidden rounded-lg">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead className="py-3 font-semibold">{translate('Module')}</TableHead>
                                <TableHead className="py-3 font-semibold">{translate('Method')}</TableHead>
                                <TableHead className="py-3 font-semibold">{translate('URL')}</TableHead>
                                <TableHead className="w-24 py-3 text-right font-semibold">{translate('Actions')}</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {webhookList.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-40 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
                                                <Link2 className="text-muted-foreground h-5 w-5" />
                                            </div>
                                            <p className="text-sm font-medium">{translate('No webhooks configured')}</p>
                                            <p className="text-muted-foreground text-xs">
                                                {translate('Add a webhook to connect external integrations')}
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                webhookList.map((webhook) => (
                                    <TableRow key={webhook.id} className="border-border hover:bg-muted/30 transition-colors">
                                        <TableCell className="py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
                                                    <Link2 className="text-muted-foreground h-4 w-4" />
                                                </div>
                                                <span className="text-sm font-medium">{webhook.module}</span>
                                            </div>
                                        </TableCell>

                                        <TableCell className="py-3">
                                            <span
                                                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                                    webhook.method === 'GET'
                                                        ? 'bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-400/30'
                                                        : 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-700/10 dark:bg-fuchsia-900/30 dark:text-fuchsia-400 dark:ring-fuchsia-400/30'
                                                }`}
                                            >
                                                {webhook.method}
                                            </span>
                                        </TableCell>

                                        <TableCell className="py-3">
                                            <div className="text-muted-foreground max-w-xs truncate font-mono text-xs" title={webhook.url}>
                                                {webhook.url}
                                            </div>
                                        </TableCell>

                                        <TableCell className="py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() => {
                                                                    handleEdit(webhook);
                                                                }}
                                                            >
                                                                <Edit className="text-muted-foreground h-4 w-4" />
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
                                                                className="text-muted-foreground hover:text-destructive h-8 w-8"
                                                                onClick={() => {
                                                                    handleDeleteClick(webhook);
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
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
                </div>
            </div>

            {/* Add / Edit webhook dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingWebhook ? translate('Edit webhook') : translate('Add webhook')}</DialogTitle>
                    </DialogHeader>

                    <form autoComplete="off" onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Select
                                value={formData.module}
                                onValueChange={(value) => {
                                    setFormData((prev) => ({ ...prev, module: value }));
                                }}
                            >
                                <SelectTrigger label={translate('Module')}>
                                    <SelectValue placeholder={translate('Select...')} />
                                </SelectTrigger>

                                <SelectContent className="z-[60000]">
                                    <SelectItem value="New User">{translate('New user')}</SelectItem>
                                    <SelectItem value="Lead Assigned">{translate('Lead create')}</SelectItem>
                                    <SelectItem value="Case Created">{translate('Case create')}</SelectItem>
                                    <SelectItem value="Meeting Invitation">{translate('Meeting invitation')}</SelectItem>
                                    <SelectItem value="Opportunity Created">{translate('Opportunity create')}</SelectItem>
                                    <SelectItem value="Quote Created">{translate('Quote create')}</SelectItem>
                                    <SelectItem value="Task Assigned">{translate('Task create')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Select
                                value={formData.method}
                                onValueChange={(value) => {
                                    setFormData((prev) => ({ ...prev, method: value }));
                                }}
                            >
                                <SelectTrigger label={translate('Method')}>
                                    <SelectValue placeholder={translate('Select...')} />
                                </SelectTrigger>

                                <SelectContent className="z-[60000]">
                                    <SelectItem value="GET">GET</SelectItem>
                                    <SelectItem value="POST">POST</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Input
                                inputIdentifier="url"
                                label={translate('URL')}
                                required
                                inputType="url"
                                value={formData.url}
                                onChange={(e) => {
                                    setFormData((prev) => ({
                                        ...prev,
                                        url: e.target.value,
                                    }));
                                }}
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                size="lg"
                                variant="outline"
                                onClick={() => {
                                    setIsDialogOpen(false);
                                }}
                            >
                                {translate('Cancel')}
                            </Button>

                            <Button type="submit" size="lg">
                                {translate('Save')}
                            </Button>
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
        </SettingsSection>
    );
}
