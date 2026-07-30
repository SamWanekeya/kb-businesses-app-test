import { PageTemplate } from '@/components/page-template';
import { usePage, router, Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, ArrowLeft } from 'lucide-react';
import { hasPermission } from '@/utils/authorization';

export default function ShowReceiptOrder() {
  const { t } = useTranslation();
  const { receiptOrder } = usePage().props as any;
  const permissions = (usePage().props as any).auth?.permissions;

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Receipt Orders'), href: route('receipt-orders.index') },
    { title: receiptOrder.receipt_number }
  ];

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      received: 'bg-blue-100 text-blue-800',
      partial: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const formatDate = (date: string) => {
    return window.appSettings?.formatDateTime(date, false) || new Date(date).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return window.appSettings?.formatCurrency(Number(amount || 0)) || `$${Number(amount || 0).toFixed(2)}`;
  };

  return (
    <PageTemplate
      title={`Receipt Order: ${receiptOrder.receipt_number}`}
      url={`/receipt-orders/${receiptOrder.id}`}
      breadcrumbs={breadcrumbs}
      actions={[
        {
          label: t('Back'),
          icon: <ArrowLeft className="h-4 w-4 mr-2" />,
          variant: 'outline',
          onClick: () => router.visit(route('receipt-orders.index'))
        }
      ]}
    >
      <div className="space-y-6">
        {/* Header Information */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg font-bold">{receiptOrder.name}</CardTitle>
                <p className="text-base text-gray-600 mt-2 leading-relaxed">{receiptOrder.description || receiptOrder.receipt_number}</p>
              </div>
              <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                receiptOrder.status === 'completed' ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' :
                receiptOrder.status === 'received' ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20' :
                receiptOrder.status === 'partial' ? 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20' :
                receiptOrder.status === 'cancelled' ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20' :
                'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20'
              }`}>
                {t(receiptOrder.status.charAt(0).toUpperCase() + receiptOrder.status.slice(1))}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h4 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">{t('Receipt Information')}</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('Receipt Date')}</label>
                    <p className="text-sm mt-1">{formatDate(receiptOrder.receipt_date)}</p>
                  </div>
                  {receiptOrder.expected_date && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('Expected Date')}</label>
                      <p className="text-sm mt-1">{formatDate(receiptOrder.expected_date)}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('Created')}</label>
                    <p className="text-sm mt-1">{formatDate(receiptOrder.created_at)}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">{t('Related Information')}</h4>
                <div className="space-y-4">
                  {receiptOrder.account && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('Account')}</label>
                      <p className="text-sm mt-1">{receiptOrder.account.name}</p>
                    </div>
                  )}
                  {receiptOrder.purchase_order && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('Purchase Order')}</label>
                      {hasPermission(permissions, 'view-purchase-orders') ? (
                        <Link
                          href={route('purchase-orders.show', receiptOrder.purchase_order.id)}
                          className="block text-sm hover:underline mt-1 cursor-pointer" style={{ color: '#2563eb' }}
                        >
                          {receiptOrder.purchase_order.name}
                        </Link>
                      ) : (
                        <p className="text-sm mt-1">{receiptOrder.purchase_order.name}</p>
                      )}
                    </div>
                  )}
                  {receiptOrder.return_order && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('Return Order')}</label>
                      {hasPermission(permissions, 'view-return-orders') ? (
                        <Link
                          href={route('return-orders.show', receiptOrder.return_order.id)}
                          className="block text-sm hover:underline mt-1 cursor-pointer" style={{ color: '#2563eb' }}
                        >
                          {receiptOrder.return_order.name}
                        </Link>
                      ) : (
                        <p className="text-sm mt-1">{receiptOrder.return_order.name}</p>
                      )}
                    </div>
                  )}
                  {receiptOrder.contact && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('Contact')}</label>
                      <p className="text-sm mt-1">{receiptOrder.contact.name}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">{t('Assignment')}</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('Created By')}</label>
                    <p className="text-sm mt-1">{receiptOrder.creator?.name || t('-')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('Assigned To')}</label>
                    <p className="text-sm mt-1">{receiptOrder.assigned_user?.name || t('Unassigned')}</p>
                  </div>
                </div>
              </div>
            </div>

            {receiptOrder.description && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-2">{t('Description')}</h4>
                <p className="text-sm">{receiptOrder.description}</p>
              </div>
            )}

            {receiptOrder.notes && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-2">{t('Notes')}</h4>
                <p className="text-sm">{receiptOrder.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Products */}
        {receiptOrder.products && receiptOrder.products.length > 0 && (
          <Card>
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="flex items-center text-lg font-semibold">
                <Package className="h-5 w-5 mr-3 text-muted-foreground" />
                {t('Products')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-100">
                      <TableHead className="text-left text-base font-bold text-gray-900 py-4 px-6 w-1/3">{t('Product')}</TableHead>
                      <TableHead className="text-right text-base font-bold text-gray-900 py-4 px-4">{t('Quantity')}</TableHead>
                      <TableHead className="text-right text-base font-bold text-gray-900 py-4 px-4">{t('Unit Price')}</TableHead>
                      <TableHead className="text-right text-base font-bold text-gray-900 py-4 px-4">{t('Discount')}</TableHead>
                      <TableHead className="text-right text-base font-bold text-gray-900 py-4 px-4">{t('Tax')}</TableHead>
                      <TableHead className="text-right text-base font-bold text-gray-900 py-4 px-4 w-1/6">{t('Total')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receiptOrder.products.map((product: any, index: number) => {
                      const quantity = product.pivot?.quantity || 0;
                      const unitPrice = product.pivot?.unit_price || 0;
                      const discountAmount = Number(product.pivot?.discount_amount) || 0;
                      const lineTotal = Number(product.pivot?.total_price) || (quantity * unitPrice);
                      const finalLineTotal = lineTotal - discountAmount;
                      const taxAmount = product.tax ? (finalLineTotal * Number(product.tax.rate)) / 100 : 0;

                      return (
                        <TableRow key={index} className="border-b hover:bg-gray-50">
                          <TableCell className="font-semibold text-base text-gray-900 py-4 px-6">{product.name}</TableCell>
                          <TableCell className="text-right text-base font-medium py-4 px-4">{quantity}</TableCell>
                          <TableCell className="text-right text-base font-semibold py-4 px-4">{formatCurrency(unitPrice)}</TableCell>
                          <TableCell className="text-right py-4 px-4">
                            {product.pivot?.discount_type && product.pivot.discount_type !== 'none' && discountAmount > 0 ? (
                              <div className="text-base">
                                <div className="font-semibold text-gray-700">{product.pivot.discount_type === 'percentage' ? `${Number(product.pivot.discount_value)}%` : formatCurrency(Number(product.pivot.discount_value))}</div>
                                <div className="text-red-600 font-bold">(-{formatCurrency(discountAmount)})</div>
                              </div>
                            ) : (
                              <span className="text-gray-500 font-medium">{t('No Discount')}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right py-4 px-4">
                            {product.tax ? (
                              <div>
                                <div className="text-sm font-medium text-gray-700">{product.tax.name} ({parseFloat(product.tax.rate).toFixed(2)}%)</div>
                                <div className="text-sm text-gray-400 font-medium">{formatCurrency(taxAmount)}</div>
                              </div>
                            ) : (
                              <span className="text-gray-500 font-medium">{t('No Tax')}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-bold text-base py-4 px-4">
                            <span className="text-green-600 font-semibold">{formatCurrency(finalLineTotal + taxAmount)}</span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="bg-gray-50 border-t-2">
                      <TableCell colSpan={4} className="py-3 px-4"></TableCell>
                      <TableCell className="text-right font-semibold text-base py-3 px-4">{t('Subtotal')}:</TableCell>
                      <TableCell className="text-right font-semibold text-base py-3 px-4">{formatCurrency(receiptOrder.subtotal)}</TableCell>
                    </TableRow>
                    <TableRow className="bg-gray-50">
                      <TableCell colSpan={4} className="py-3 px-4"></TableCell>
                      <TableCell className="text-right font-semibold text-base py-3 px-4">{t('Discount')}:</TableCell>
                      <TableCell className="text-right font-semibold text-base text-red-600 py-3 px-4">-{formatCurrency(receiptOrder.discount_amount || 0)}</TableCell>
                    </TableRow>
                    <TableRow className="bg-gray-50">
                      <TableCell colSpan={4} className="py-3 px-4"></TableCell>
                      <TableCell className="text-right font-semibold text-base py-3 px-4">{t('Tax')}:</TableCell>
                      <TableCell className="text-right font-semibold text-base py-3 px-4">{formatCurrency(receiptOrder.tax_amount)}</TableCell>
                    </TableRow>
                    <TableRow className="bg-green-50 border-t-2">
                      <TableCell colSpan={4} className="py-4 px-4"></TableCell>
                      <TableCell className="text-right font-bold text-lg py-4 px-4">{t('Grand Total')}:</TableCell>
                      <TableCell className="text-right py-4 px-4"><span className="text-green-600 font-bold text-xl">{formatCurrency(receiptOrder.total_amount)}</span></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageTemplate>
  );
}
