import { CrudTable } from '@/components/CrudTable';
import { toast } from '@/components/CustomToast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { router, useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { route } from '@/utils/Routes';
import { useTranslation } from 'react-i18next';

interface PayoutRequestsProps {
    userType: string;
    payoutRequests: any;
    settings: any;
    stats: any;
    currencySymbol?: string;
}

export default function PayoutRequests({ userType, payoutRequests, settings, stats, currencySymbol }: PayoutRequestsProps) {
    const { t: translate } = useTranslation();

    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        amount: '',
    });

    const handleCreatePayout = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('referral.payout-request.create'), {
            onSuccess: (page) => {
                setShowCreateDialog(false);
                reset();
                if (page.props.flash.success) {
                    toast.success(t(page.props.flash.success));
                } else if (page.props.flash.error) {
                    toast.error(t(page.props.flash.error));
                }
            },
            onError: (errors) => {
                if (typeof errors === 'string') {
                    toast.error(t(errors));
                }
            },
        });
    };

    const handleAction = (action: string, item: any) => {
        if (action === 'approve') {
            router.post(
                route('referral.payout-request.approve', item.id),
                {},
                {
                    onSuccess: (page) => {
                        if (page.props.flash.success) {
                            toast.success(t(page.props.flash.success));
                        } else if (page.props.flash.error) {
                            toast.error(t(page.props.flash.error));
                        }
                    },
                    onError: (errors) => {
                        if (typeof errors === 'string') {
                            toast.error(t(errors));
                        }
                    },
                },
            );
        } else if (action === 'reject') {
            setCurrentItem(item);
            setIsRejectModalOpen(true);
        }
    };

    const handleRejectConfirm = (notes: string) => {
        router.post(
            route('referral.payout-request.reject', currentItem.id),
            { notes },
            {
                onSuccess: (page) => {
                    setIsRejectModalOpen(false);
                    if (page.props.flash.success) {
                        toast.success(t(page.props.flash.success));
                    } else if (page.props.flash.error) {
                        toast.error(t(page.props.flash.error));
                    }
                },
                onError: (errors) => {
                    if (typeof errors === 'string') {
                        toast.error(t(errors));
                    }
                },
            },
        );
    };

    // Define table columns
    const columns = [
        ...(userType === 'super_admin'
            ? [
                  {
                      key: 'organization.name',
                      label: translate('Organization'),
                      render: (_, row) => (
                          <div>
                              <p className="text-sm font-semibold">{row.organization?.name}</p>
                              <p className="text-muted-foreground text-xs">{row.organization?.email}</p>
                          </div>
                      ),
                  },
              ]
            : []),
        {
            key: 'amount',
            label: translate('Amount'),
            render: (value) => (
                <span className="font-mono">
                    {currencySymbol}
                    {value}
                </span>
            ),
        },
        {
            key: 'status',
            label: translate('Status'),
            render: (value) => {
                const statusColors: Record<string, string> = {
                    pending: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
                    approved: 'bg-green-50 text-green-700 ring-green-600/20',
                    rejected: 'bg-red-50 text-red-700 ring-red-600/20',
                };
                return (
                    <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium capitalize ring-1 ring-inset ${statusColors[value] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}
                    >
                        {translate(value)}
                    </span>
                );
            },
        },
        {
            key: 'created_at',
            label: translate('Date'),
            type: 'date',
            // render: (value) => window.appSettings?.formatDateTime(value, false) || new Date(value).toLocaleDateString()
        },
    ];

    // Define table actions
    const actions =
        userType === 'super_admin'
            ? [
                  {
                      label: translate('Approve'),
                      icon: 'Check',
                      action: 'approve',
                      className: 'text-green-500',
                      condition: (row) => row.status === 'pending',
                  },
                  {
                      label: translate('Reject'),
                      icon: 'X',
                      action: 'reject',
                      className: 'text-red-500',
                      condition: (row) => row.status === 'pending',
                  },
              ]
            : [];

    return (
        <div className="space-y-6">
            {userType === 'organization' && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base font-semibold">{translate('Create Payout Request')}</CardTitle>
                        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                            <DialogTrigger asChild>
                                <Button disabled={stats.availableBalance < settings.threshold_amount}>
                                    <Plus className="me-2 h-4 w-4" />
                                    {translate('Request Payout')}
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{translate('Create Payout Request')}</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleCreatePayout} className="space-y-4">
                                    <div>
                                        <Label htmlFor="amount">{translate('Amount')}</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            step="0.01"
                                            min={settings.threshold_amount}
                                            max={stats.availableBalance}
                                            value={data.amount}
                                            onChange={(e) => setData('amount', e.target.value)}
                                            placeholder={`Min: $${settings.threshold_amount}`}
                                        />
                                        {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}
                                    </div>
                                    <div className="text-muted-foreground text-sm">
                                        <p>
                                            {translate('Available Balance')}:{' '}
                                            <span className="font-mono">
                                                {currencySymbol}
                                                {stats.availableBalance}
                                            </span>
                                        </p>
                                        <p>
                                            {translate('Minimum Amount')}:{' '}
                                            <span className="font-mono">
                                                {currencySymbol}
                                                {settings.threshold_amount}
                                            </span>
                                        </p>
                                    </div>
                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                                            {translate('Cancel')}
                                        </Button>
                                        <Button type="submit" disabled={processing}>
                                            {translate('Submit Request')}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground text-sm">
                            {stats.availableBalance < settings.threshold_amount
                                ? translate('You need at least {{amount}} to request a payout', {
                                      amount: `${currencySymbol}${settings.threshold_amount}`,
                                  })
                                : translate('You can request up to {{amount}} for payout', { amount: `${currencySymbol}${stats.availableBalance}` })}
                        </p>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-semibold">
                        {userType === 'super_admin' ? translate('All Payout Requests') : translate('Your Payout Requests')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-900">
                        <CrudTable
                            columns={columns}
                            actions={actions}
                            data={payoutRequests?.data || []}
                            from={payoutRequests?.from || 1}
                            onAction={handleAction}
                            permissions={[]}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Reject Modal */}
            <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{translate('Reject Payout Request')}</DialogTitle>
                    </DialogHeader>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const notes = formData.getranslate('notes') as string;
                            handleRejectConfirm(notes);
                        }}
                    >
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="notes">{translate('Rejection Reason (Optional)')}</Label>
                                <Textarea id="notes" name="notes" placeholder={translate('Enter rejection reason...')} className="mt-1" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsRejectModalOpen(false)}>
                                {translate('Cancel')}
                            </Button>
                            <Button type="submit" variant="destructive">
                                {translate('Reject')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
