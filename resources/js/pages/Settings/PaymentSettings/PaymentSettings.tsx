import type { PaymentMethodDefinition, PaymentSettingsInput } from '@/types/payment-settings';
import { toast } from '@components/CustomToast';
import PaymentInputField from '@components/Payment/PaymentInputField';
import PaymentMethodCard from '@components/Payment/PaymentMethodCard';
import SettingsSection from '@components/SettingsSection';
import { Button } from '@components/UserInterface/Button';
import { Label } from '@components/UserInterface/Label';
import { Textarea } from '@components/UserInterface/Textarea';
import { useForm } from '@inertiajs/react';
import PaymentSettingsSummary from '@pages/Settings/PaymentSettings/PaymentSettingsSummary';
import PaymentSettingsToolbar from '@pages/Settings/PaymentSettings/PaymentSettingsToolbar';
import { PAYMENT_METHOD_HELP_URLS, PAYMENT_METHOD_LABELS, PAYMENT_METHODS } from '@utils/Payment';
import { route } from '@utils/Routes';
import { Banknote, CreditCard } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PaymentSettingsProps {
    /** Serialized payment settings supplied by the Laravel page response. */
    settings?: PaymentSettingsInput;
}

/** Reads a string setting without allowing serialized non-string values into controlled inputs. */
function getStringSetting(settings: PaymentSettingsInput, key: string, fallback = ''): string {
    const value = settings[key];
    return typeof value === 'string' ? value : fallback;
}

/** Normalizes legacy Laravel boolean representations. */
function getBooleanSetting(settings: PaymentSettingsInput, key: string): boolean {
    const value = settings[key];
    return value === true || value === 1 || value === '1';
}

/** Keeps gateway environments within the supported sandbox/live domain. */
function getPaymentMode(settings: PaymentSettingsInput, key: string): 'sandbox' | 'live' {
    return settings[key] === 'live' ? 'live' : 'sandbox';
}

/**
 * PaymentSettings
 *
 * Configures the payment methods available to the application while keeping
 * the existing Laravel/Inertia payload and provider-specific field names.
 * Gateway forms remain explicit because providers differ in credential shape,
 * environment settings, regional requirements, and setup guidance.
 *
 * Accessibility: the search/filter toolbar announces result changes; gateway
 * inputs retain their labels and validation messages; save state is exposed
 * through the form's busy state and the disabled submit action.
 *
 * Performance: gateway metadata and derived filters are memoized; callbacks
 * are stabilized where passed to extracted UI components.
 */
export default function PaymentSettings({ settings = {} }: PaymentSettingsProps) {
    const { t: translate } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');

    // Form state
    const { data, setData, post, processing, errors } = useForm({
        currency: getStringSetting(settings, 'currency', 'USD'),
        currencySymbol: getStringSetting(settings, 'currency_symbol', '$'),
        is_manual_payment_mode_enabled: getBooleanSetting(settings, 'is_manual_payment_mode_enabled'),
        is_bank_payment_mode_enabled: getBooleanSetting(settings, 'is_bank_payment_mode_enabled'),
        bank_detail: getStringSetting(settings, 'bank_detail'),
        // is_stripe_payment_mode_enabled: getBooleanSetting(settings, 'is_stripe_payment_mode_enabled'),
        // stripe_key: getStringSetting(settings, 'stripe_key'),
        // stripe_secret: getStringSetting(settings, 'stripe_secret'),
        // is_paypal_payment_mode_enabled: getBooleanSetting(settings, 'is_paypal_payment_mode_enabled'),
        // paypal_mode: getPaymentMode(settings, 'paypal_mode'),
        // paypal_client_id: getStringSetting(settings, 'paypal_client_id'),
        // paypal_secret_key: getStringSetting(settings, 'paypal_secret_key'),
        // is_razorpay_payment_mode_enabled: getBooleanSetting(settings, 'is_razorpay_payment_mode_enabled'),
        // razorpay_key: getStringSetting(settings, 'razorpay_key'),
        // razorpay_secret: getStringSetting(settings, 'razorpay_secret'),
        // is_mercadopago_payment_mode_enabled: getBooleanSetting(settings, 'is_mercadopago_payment_mode_enabled'),
        // mercadopago_mode: getPaymentMode(settings, 'mercadopago_mode'),
        // mercadopago_access_token: getStringSetting(settings, 'mercadopago_access_token'),
        is_paystack_payment_mode_enabled: getBooleanSetting(settings, 'is_paystack_payment_mode_enabled'),
        paystack_public_key: getStringSetting(settings, 'paystack_public_key'),
        paystack_secret_key: getStringSetting(settings, 'paystack_secret_key'),
        // is_flutterwave_payment_mode_enabled: getBooleanSetting(settings, 'is_flutterwave_payment_mode_enabled'),
        // flutterwave_public_key: getStringSetting(settings, 'flutterwave_public_key'),
        // flutterwave_secret_key: getStringSetting(settings, 'flutterwave_secret_key'),
        // is_tap_payment_mode_enabled: getBooleanSetting(settings, 'is_tap_payment_mode_enabled'),
        // tap_secret_key: getStringSetting(settings, 'tap_secret_key'),
        // is_xendit_payment_mode_enabled: getBooleanSetting(settings, 'is_xendit_payment_mode_enabled'),
        // xendit_api_key: getStringSetting(settings, 'xendit_api_key'),
        // is_paytr_payment_mode_enabled: getBooleanSetting(settings, 'is_paytr_payment_mode_enabled'),
        // paytr_merchant_id: getStringSetting(settings, 'paytr_merchant_id'),
        // paytr_merchant_key: getStringSetting(settings, 'paytr_merchant_key'),
        // paytr_merchant_salt: getStringSetting(settings, 'paytr_merchant_salt'),
        // is_mollie_payment_mode_enabled: getBooleanSetting(settings, 'is_mollie_payment_mode_enabled'),
        // mollie_api_key: getStringSetting(settings, 'mollie_api_key'),
        // is_toyyibpay_payment_mode_enabled: getBooleanSetting(settings, 'is_toyyibpay_payment_mode_enabled'),
        // toyyibpay_category_code: getStringSetting(settings, 'toyyibpay_category_code'),
        // toyyibpay_secret_key: getStringSetting(settings, 'toyyibpay_secret_key'),
        // is_benefit_payment_mode_enabled: getBooleanSetting(settings, 'is_benefit_payment_mode_enabled'),
        // benefit_mode: getPaymentMode(settings, 'benefit_mode'),
        // benefit_secret_key: getStringSetting(settings, 'benefit_secret_key'),
        // benefit_public_key: getStringSetting(settings, 'benefit_public_key'),
        // is_iyzipay_payment_mode_enabled: getBooleanSetting(settings, 'is_iyzipay_payment_mode_enabled'),
        // iyzipay_mode: getPaymentMode(settings, 'iyzipay_mode'),
        // iyzipay_secret_key: getStringSetting(settings, 'iyzipay_secret_key'),
        // iyzipay_public_key: getStringSetting(settings, 'iyzipay_public_key'),
        // is_aamarpay_payment_mode_enabled: getBooleanSetting(settings, 'is_aamarpay_payment_mode_enabled'),
        // aamarpay_store_id: getStringSetting(settings, 'aamarpay_store_id'),
        // aamarpay_signature: getStringSetting(settings, 'aamarpay_signature'),
        // is_midtrans_payment_mode_enabled: getBooleanSetting(settings, 'is_midtrans_payment_mode_enabled'),
        // midtrans_mode: getPaymentMode(settings, 'midtrans_mode'),
        // midtrans_secret_key: getStringSetting(settings, 'midtrans_secret_key'),
        // is_yookassa_payment_mode_enabled: getBooleanSetting(settings, 'is_yookassa_payment_mode_enabled'),
        // yookassa_shop_id: getStringSetting(settings, 'yookassa_shop_id'),
        // yookassa_secret_key: getStringSetting(settings, 'yookassa_secret_key'),
        // is_nepalste_payment_mode_enabled: getBooleanSetting(settings, 'is_nepalste_payment_mode_enabled'),
        // nepalste_mode: getPaymentMode(settings, 'nepalste_mode'),
        // nepalste_secret_key: getStringSetting(settings, 'nepalste_secret_key'),
        // nepalste_public_key: getStringSetting(settings, 'nepalste_public_key'),
        // is_paiement_payment_mode_enabled: getBooleanSetting(settings, 'is_paiement_payment_mode_enabled'),
        // paiement_merchant_id: getStringSetting(settings, 'paiement_merchant_id'),
        // is_cinetpay_payment_mode_enabled: getBooleanSetting(settings, 'is_cinetpay_payment_mode_enabled'),
        // cinetpay_site_id: getStringSetting(settings, 'cinetpay_site_id'),
        // cinetpay_api_key: getStringSetting(settings, 'cinetpay_api_key'),
        // cinetpay_secret_key: getStringSetting(settings, 'cinetpay_secret_key'),
        // is_payhere_payment_mode_enabled: getBooleanSetting(settings, 'is_payhere_payment_mode_enabled'),
        // payhere_mode: getPaymentMode(settings, 'payhere_mode'),
        // payhere_merchant_id: getStringSetting(settings, 'payhere_merchant_id'),
        // payhere_merchant_secret: getStringSetting(settings, 'payhere_merchant_secret'),
        // payhere_app_id: getStringSetting(settings, 'payhere_app_id'),
        // payhere_app_secret: getStringSetting(settings, 'payhere_app_secret'),
        // is_fedapay_payment_mode_enabled: getBooleanSetting(settings, 'is_fedapay_payment_mode_enabled'),
        // fedapay_mode: getPaymentMode(settings, 'fedapay_mode'),
        // fedapay_secret_key: getStringSetting(settings, 'fedapay_secret_key'),
        // fedapay_public_key: getStringSetting(settings, 'fedapay_public_key'),
        // is_authorizenet_payment_mode_enabled: getBooleanSetting(settings, 'is_authorizenet_payment_mode_enabled'),
        // authorizenet_mode: getPaymentMode(settings, 'authorizenet_mode'),
        // authorizenet_merchant_id: getStringSetting(settings, 'authorizenet_merchant_id'),
        // authorizenet_transaction_key: getStringSetting(settings, 'authorizenet_transaction_key'),
        // is_khalti_payment_mode_enabled: getBooleanSetting(settings, 'is_khalti_payment_mode_enabled'),
        // khalti_secret_key: getStringSetting(settings, 'khalti_secret_key'),
        // khalti_public_key: getStringSetting(settings, 'khalti_public_key'),
        // is_easebuzz_payment_mode_enabled: getBooleanSetting(settings, 'is_easebuzz_payment_mode_enabled'),
        // easebuzz_merchant_key: getStringSetting(settings, 'easebuzz_merchant_key'),
        // easebuzz_salt_key: getStringSetting(settings, 'easebuzz_salt_key'),
        // easebuzz_environment: getStringSetting(settings, 'easebuzz_environment'),
        // is_ozow_payment_mode_enabled: getBooleanSetting(settings, 'is_ozow_payment_mode_enabled'),
        // ozow_mode: getPaymentMode(settings, 'ozow_mode'),
        // ozow_site_key: getStringSetting(settings, 'ozow_site_key'),
        // ozow_private_key: getStringSetting(settings, 'ozow_private_key'),
        // ozow_api_key: getStringSetting(settings, 'ozow_api_key'),
        // is_cashfree_payment_mode_enabled: getBooleanSetting(settings, 'is_cashfree_payment_mode_enabled'),
        // cashfree_mode: getPaymentMode(settings, 'cashfree_mode'),
        // cashfree_secret_key: getStringSetting(settings, 'cashfree_secret_key'),
        // cashfree_public_key: getStringSetting(settings, 'cashfree_public_key'),
        // is_paytabs_payment_mode_enabled: getBooleanSetting(settings, 'is_paytabs_payment_mode_enabled'),
        // paytabs_profile_id: getStringSetting(settings, 'paytabs_profile_id'),
        // paytabs_server_key: getStringSetting(settings, 'paytabs_server_key'),
        // paytabs_region: getStringSetting(settings, 'paytabs_region', 'ARE'),
        // paytabs_mode: getPaymentMode(settings, 'paytabs_mode'),
        // is_skrill_payment_mode_enabled: getBooleanSetting(settings, 'is_skrill_payment_mode_enabled'),
        // skrill_merchant_id: getStringSetting(settings, 'skrill_merchant_id'),
        // skrill_secret_word: getStringSetting(settings, 'skrill_secret_word'),
        // is_coingate_payment_mode_enabled: getBooleanSetting(settings, 'is_coingate_payment_mode_enabled'),
        // coingate_api_token: getStringSetting(settings, 'coingate_api_token'),
        // coingate_mode: getPaymentMode(settings, 'coingate_mode'),
        // is_payfast_payment_mode_enabled: getBooleanSetting(settings, 'is_payfast_payment_mode_enabled'),
        // payfast_merchant_id: getStringSetting(settings, 'payfast_merchant_id'),
        // payfast_merchant_key: getStringSetting(settings, 'payfast_merchant_key'),
        // payfast_passphrase: getStringSetting(settings, 'payfast_passphrase'),
        // payfast_mode: getPaymentMode(settings, 'payfast_mode')
    });

    /** Explicit metadata keeps gateway identifiers aligned with form enablement fields. */
    const paymentMethods = useMemo(
        () =>
            [
                {
                    key: 'bank',
                    name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.BANK],
                    enabledField: 'is_bank_payment_mode_enabled',
                },
                // { key: 'stripe', name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.STRIPE], enabledField: 'is_stripe_payment_mode_enabled' },
                // { key: 'paypal', name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.PAYPAL], enabledField: 'is_paypal_payment_mode_enabled' },
                // { key: 'razorpay', name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.RAZORPAY], enabledField: 'is_razorpay_payment_mode_enabled' },
                // { key: 'mercadopago', name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.MERCADOPAGO], enabledField: 'is_mercadopago_payment_mode_enabled' },
                {
                    key: 'paystack',
                    name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.PAYSTACK],
                    enabledField: 'is_paystack_payment_mode_enabled',
                },
                // { key: 'flutterwave', name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.FLUTTERWAVE], enabledField: 'is_flutterwave_payment_mode_enabled' },
                // { key: 'paytabs', name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.PAYTABS], enabledField: 'is_paytabs_payment_mode_enabled' },
                // { key: 'skrill', name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.SKRILL], enabledField: 'is_skrill_payment_mode_enabled' },
                // { key: 'coingate', name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.COINGATE], enabledField: 'is_coingate_payment_mode_enabled' },
                // { key: 'payfast', name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.PAYFAST], enabledField: 'is_payfast_payment_mode_enabled' },
                // { key: 'tap', name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.TAP], enabledField: 'is_tap_payment_mode_enabled' },
                // { key: 'xendit', name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.XENDIT], enabledField: 'is_xendit_payment_mode_enabled' },
                // { key: 'paytr', name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.PAYTR], enabledField: 'is_paytr_payment_mode_enabled' },
                // { key: 'mollie', name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.MOLLIE], enabledField: 'is_mollie_payment_mode_enabled' },
                // { key: 'toyyibpay', name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.TOYYIBPAY], enabledField: 'is_toyyibpay_payment_mode_enabled' },
                // { key: 'benefit', name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.BENEFIT], enabledField: 'is_benefit_payment_mode_enabled' },
                // { key: 'iyzipay', name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.IYZIPAY], enabledField: 'is_iyzipay_payment_mode_enabled' },
                // { key: 'aamarpay', name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.AAMARPAY], enabledField: 'is_aamarpay_payment_mode_enabled' },
                // { key: 'midtrans', name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.MIDTRANS], enabledField: 'is_midtrans_payment_mode_enabled' },
                // { key: 'yookassa', name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.YOOKASSA], enabledField: 'is_yookassa_payment_mode_enabled' },
                // { key: 'nepalste', name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.NEPALSTE], enabledField: 'is_nepalste_payment_mode_enabled' },
                // { key: 'paiement', name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.PAIEMENT], enabledField: 'is_paiement_payment_mode_enabled' },
                // { key: 'cinetpay', name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.CINETPAY], enabledField: 'is_cinetpay_payment_mode_enabled' },
                // { key: 'payhere', name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.PAYHERE], enabledField: 'is_payhere_payment_mode_enabled' },
                // { key: 'fedapay', name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.FEDAPAY], enabledField: 'is_fedapay_payment_mode_enabled' },
                // { key: 'authorizenet', name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.AUTHORIZENET], enabledField: 'is_authorizenet_payment_mode_enabled' },
                // { key: 'khalti', name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.KHALTI], enabledField: 'is_khalti_payment_mode_enabled' },
                // { key: 'easebuzz', name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.EASEBUZZ], enabledField: 'is_easebuzz_payment_mode_enabled' },
                // { key: 'ozow', name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.OZOW], enabledField: 'is_ozow_payment_mode_enabled' },
                // { key: 'cashfree', name: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.CASHFREE], enabledField: 'is_cashfree_payment_mode_enabled' }
            ] satisfies readonly PaymentMethodDefinition<keyof typeof data>[],
        [],
    );

    const filteredMethods = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLocaleLowerCase();

        return paymentMethods.filter((method) => {
            const matchesSearch = method.name.toLocaleLowerCase().includes(normalizedSearch);
            const isEnabled = Boolean(data[method.enabledField]);
            const matchesStatus = statusFilter === 'all' || (statusFilter === 'enabled' && isEnabled) || (statusFilter === 'disabled' && !isEnabled);

            return matchesSearch && matchesStatus;
        });
    }, [data, paymentMethods, searchTerm, statusFilter]);

    const enabledCount = useMemo(() => paymentMethods.filter((method) => Boolean(data[method.enabledField])).length, [data, paymentMethods]);

    const clearFilters = useCallback(() => {
        setSearchTerm('');
        setStatusFilter('all');
    }, []);

    const shouldShowMethod = useCallback((methodKey: string) => filteredMethods.some((method) => method.key === methodKey), [filteredMethods]);

    // Handle form submission
    const handleSubmit: NonNullable<React.ComponentProps<'form'>['onSubmit']> = (event) => {
        event.preventDefault();

        const toastId = toast.loading(translate('Updating payment methods...'));

        post(route('payment.settings'), {
            onSuccess: () => {
                toast.dismiss(toastId);
            },
            onError: (errors) => {
                toast.dismiss(toastId);
                Object.values(errors).forEach((message) => toast.error(translate(message)));
            },
            onFinish: () => toast.dismiss(toastId),
        });
    };

    return (
        <SettingsSection
            title={translate('Payment')}
            description={translate('Manage the payment methods available to your customers.')}
            action={
                <Button type="submit" form="payment-settings-form" size="lg" disabled={processing}>
                    {processing ? translate('Saving...') : translate('Save')}
                </Button>
            }
        >
            <form id="payment-settings-form" autoComplete="off" onSubmit={handleSubmit} aria-busy={processing}>
                <div className="border-border border-t pb-6" />
                <div className="space-y-6">
                    <PaymentSettingsSummary
                        totalCount={paymentMethods.length}
                        enabledCount={enabledCount}
                        disabledCount={paymentMethods.length - enabledCount}
                    />

                    <PaymentSettingsToolbar
                        searchTerm={searchTerm}
                        statusFilter={statusFilter}
                        resultCount={filteredMethods.length}
                        totalCount={paymentMethods.length}
                        onSearchChange={setSearchTerm}
                        onStatusChange={setStatusFilter}
                        onClearAll={clearFilters}
                    />

                    {filteredMethods.length === 0 && (
                        <div className="sr-only" role="status" aria-live="polite">
                            {translate('No payment methods found matching your criteria')}
                        </div>
                    )}

                    {/* Bank Transfer */}
                    {shouldShowMethod('bank') && (
                        <PaymentMethodCard
                            title={PAYMENT_METHOD_LABELS[PAYMENT_METHODS.BANK]}
                            icon={<Banknote className="h-5 w-5" />}
                            enabled={data.is_bank_payment_mode_enabled}
                            onToggle={(checked) => {
                                setData('is_bank_payment_mode_enabled', checked);
                            }}
                        >
                            <div className="space-y-2">
                                <Label htmlFor="bank_detail">{translate('Bank details')}</Label>
                                <Textarea
                                    id="bank_detail"
                                    value={data.bank_detail}
                                    onChange={(e) => {
                                        setData('bank_detail', e.target.value);
                                    }}
                                    rows={6}
                                />
                                <p className="text-foreground/75 text-xs">
                                    {translate('Enter your bank details that customers will use for manual transfers')}
                                </p>
                                {errors.bank_detail && <p className="text-destructive text-sm">{errors.bank_detail}</p>}
                            </div>
                        </PaymentMethodCard>
                    )}

                    {/*/!* Stripe *!/*/}
                    {/*{shouldShowMethod('stripe') && (*/}
                    {/*    <PaymentMethodCard*/}
                    {/*        title={PAYMENT_METHOD_LABELS[PAYMENT_METHODS.STRIPE]}*/}
                    {/*        icon={<CreditCard className="h-5 w-5" />}*/}
                    {/*        enabled={data.is_stripe_payment_mode_enabled}*/}
                    {/*        onToggle={(checked) => {*/}
                    {/*            setData('is_stripe_payment_mode_enabled', checked);*/}
                    {/*        }}*/}
                    {/*        helpUrl={PAYMENT_METHOD_HELP_URLS[PAYMENT_METHODS.STRIPE]}*/}
                    {/*        helpText={translate('Get your stripe api keys from your')}*/}
                    {/*    >*/}
                    {/*        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="stripe_key"*/}
                    {/*                label={translate('Publishable key')}*/}
                    {/*                value={data.stripe_key}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('stripe_key', value);*/}
                    {/*                }}*/}
                    {/*                error={errors.stripe_key}*/}
                    {/*            />*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="stripe_secret"*/}
                    {/*                label={translate('Secret key')}*/}
                    {/*                value={data.stripe_secret}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('stripe_secret', value);*/}
                    {/*                }}*/}
                    {/*                isSecret*/}
                    {/*                error={errors.stripe_secret}*/}
                    {/*            />*/}
                    {/*        </div>*/}
                    {/*    </PaymentMethodCard>*/}
                    {/*)}*/}

                    {/*/!* PayPal *!/*/}
                    {/*{shouldShowMethod('paypal') && (*/}
                    {/*    <PaymentMethodCard*/}
                    {/*        title={PAYMENT_METHOD_LABELS[PAYMENT_METHODS.PAYPAL]}*/}
                    {/*        icon={<CreditCard className="h-5 w-5" />}*/}
                    {/*        enabled={data.is_paypal_payment_mode_enabled}*/}
                    {/*        onToggle={(checked) => {*/}
                    {/*            setData('is_paypal_payment_mode_enabled', checked);*/}
                    {/*        }}*/}
                    {/*        helpUrl={PAYMENT_METHOD_HELP_URLS[PAYMENT_METHODS.PAYPAL]}*/}
                    {/*        helpText={translate('Get your paypal api credentials from your')}*/}
                    {/*    >*/}
                    {/*        <div className="space-y-4">*/}
                    {/*            <PaymentModeSelector*/}
                    {/*                value={data.paypal_mode}*/}
                    {/*                onChange={(mode) => {*/}
                    {/*                    setData('paypal_mode', mode);*/}
                    {/*                }}*/}
                    {/*                name="paypal"*/}
                    {/*            />*/}
                    {/*            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">*/}
                    {/*                <PaymentInputField*/}
                    {/*                    id="paypal_client_id"*/}
                    {/*                    label={translate('Client ID')}*/}
                    {/*                    value={data.paypal_client_id}*/}
                    {/*                    onChange={(value) => {*/}
                    {/*                        setData('paypal_client_id', value);*/}
                    {/*                    }}*/}
                    {/*                    error={errors.paypal_client_id}*/}
                    {/*                />*/}
                    {/*                <PaymentInputField*/}
                    {/*                    id="paypal_secret_key"*/}
                    {/*                    label={translate('Secret key')}*/}
                    {/*                    value={data.paypal_secret_key}*/}
                    {/*                    onChange={(value) => {*/}
                    {/*                        setData('paypal_secret_key', value);*/}
                    {/*                    }}*/}
                    {/*                    isSecret*/}
                    {/*                    error={errors.paypal_secret_key}*/}
                    {/*                />*/}
                    {/*            </div>*/}
                    {/*        </div>*/}
                    {/*    </PaymentMethodCard>*/}
                    {/*)}*/}

                    {/*/!* Razorpay *!/*/}
                    {/*{shouldShowMethod('razorpay') && (*/}
                    {/*    <PaymentMethodCard*/}
                    {/*        title={PAYMENT_METHOD_LABELS[PAYMENT_METHODS.RAZORPAY]}*/}
                    {/*        icon={<IndianRupee className="h-5 w-5" />}*/}
                    {/*        enabled={data.is_razorpay_payment_mode_enabled}*/}
                    {/*        onToggle={(checked) => {*/}
                    {/*            setData('is_razorpay_payment_mode_enabled', checked);*/}
                    {/*        }}*/}
                    {/*        helpUrl={PAYMENT_METHOD_HELP_URLS[PAYMENT_METHODS.RAZORPAY]}*/}
                    {/*        helpText={translate('Get your razorpay api credentials from your')}*/}
                    {/*    >*/}
                    {/*        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="razorpay_key"*/}
                    {/*                label={translate('Key ID')}*/}
                    {/*                value={data.razorpay_key}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('razorpay_key', value);*/}
                    {/*                }}*/}
                    {/*                error={errors.razorpay_key}*/}
                    {/*            />*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="razorpay_secret"*/}
                    {/*                label={translate('Secret key')}*/}
                    {/*                value={data.razorpay_secret}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('razorpay_secret', value);*/}
                    {/*                }}*/}
                    {/*                isSecret*/}
                    {/*                error={errors.razorpay_secret}*/}
                    {/*            />*/}
                    {/*        </div>*/}
                    {/*    </PaymentMethodCard>*/}
                    {/*)}*/}

                    {/*/!* Mercado Pago *!/*/}
                    {/*{shouldShowMethod('mercadopago') && (*/}
                    {/*    <PaymentMethodCard*/}
                    {/*        title={PAYMENT_METHOD_LABELS[PAYMENT_METHODS.MERCADOPAGO]}*/}
                    {/*        icon={<Wallet className="h-5 w-5" />}*/}
                    {/*        enabled={data.is_mercadopago_payment_mode_enabled}*/}
                    {/*        onToggle={(checked) => {*/}
                    {/*            setData('is_mercadopago_payment_mode_enabled', checked);*/}
                    {/*        }}*/}
                    {/*        helpUrl={PAYMENT_METHOD_HELP_URLS[PAYMENT_METHODS.MERCADOPAGO]}*/}
                    {/*        helpText={translate('Get your mercado pago api credentials from your')}*/}
                    {/*    >*/}
                    {/*        <div className="space-y-4">*/}
                    {/*            <PaymentModeSelector*/}
                    {/*                value={data.mercadopago_mode}*/}
                    {/*                onChange={(mode) => {*/}
                    {/*                    setData('mercadopago_mode', mode);*/}
                    {/*                }}*/}
                    {/*                name="mercadopago"*/}
                    {/*            />*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="mercadopago_access_token"*/}
                    {/*                label={translate('Access token')}*/}
                    {/*                value={data.mercadopago_access_token}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('mercadopago_access_token', value);*/}
                    {/*                }}*/}
                    {/*                isSecret*/}
                    {/*                error={errors.mercadopago_access_token}*/}
                    {/*            />*/}
                    {/*            <p className="text-foreground/75 text-xs">*/}
                    {/*                {translate(*/}
                    {/*                    'For server-side API integration, use your private access token (not your public key). You can find this in your mercadopago developer dashboard under credentials > production/test credentials > access token'*/}
                    {/*                )}*/}
                    {/*            </p>*/}
                    {/*            <Alert>*/}
                    {/*                <AlertCircle className="h-4 w-4" />*/}
                    {/*                <AlertDescription>*/}
                    {/*                    {translate(*/}
                    {/*                        'Important: do not use your public key here. The access token is different and is required for server-side operations'*/}
                    {/*                    )}*/}
                    {/*                </AlertDescription>*/}
                    {/*            </Alert>*/}
                    {/*        </div>*/}
                    {/*    </PaymentMethodCard>*/}
                    {/*)}*/}

                    {/* Paystack */}
                    {shouldShowMethod('paystack') && (
                        <PaymentMethodCard
                            title={PAYMENT_METHOD_LABELS[PAYMENT_METHODS.PAYSTACK]}
                            icon={<CreditCard className="h-5 w-5" />}
                            enabled={data.is_paystack_payment_mode_enabled}
                            onToggle={(checked) => {
                                setData('is_paystack_payment_mode_enabled', checked);
                            }}
                            helpUrl={PAYMENT_METHOD_HELP_URLS[PAYMENT_METHODS.PAYSTACK]}
                            helpText={translate('Get your Paystack API credentials from your')}
                        >
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <PaymentInputField
                                    id="paystack_public_key"
                                    label={translate('Public key')}
                                    value={data.paystack_public_key}
                                    onChange={(value) => {
                                        setData('paystack_public_key', value);
                                    }}
                                    error={errors.paystack_public_key}
                                />
                                <PaymentInputField
                                    id="paystack_secret_key"
                                    label={translate('Secret key')}
                                    value={data.paystack_secret_key}
                                    onChange={(value) => {
                                        setData('paystack_secret_key', value);
                                    }}
                                    isSecret
                                    error={errors.paystack_secret_key}
                                />
                            </div>
                        </PaymentMethodCard>
                    )}

                    {/*/!* Flutterwave *!/*/}
                    {/*{shouldShowMethod('flutterwave') && (*/}
                    {/*    <PaymentMethodCard*/}
                    {/*        title={PAYMENT_METHOD_LABELS[PAYMENT_METHODS.FLUTTERWAVE]}*/}
                    {/*        icon={<CreditCard className="h-5 w-5" />}*/}
                    {/*        enabled={data.is_flutterwave_payment_mode_enabled}*/}
                    {/*        onToggle={(checked) => {*/}
                    {/*            setData('is_flutterwave_payment_mode_enabled', checked);*/}
                    {/*        }}*/}
                    {/*        helpUrl={PAYMENT_METHOD_HELP_URLS[PAYMENT_METHODS.FLUTTERWAVE]}*/}
                    {/*        helpText={translate('Get your flutterwave api credentials from your')}*/}
                    {/*    >*/}
                    {/*        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="flutterwave_public_key"*/}
                    {/*                label={translate('Public key')}*/}
                    {/*                value={data.flutterwave_public_key}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('flutterwave_public_key', value);*/}
                    {/*                }}*/}
                    {/*                error={errors.flutterwave_public_key}*/}
                    {/*            />*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="flutterwave_secret_key"*/}
                    {/*                label={translate('Secret key')}*/}
                    {/*                value={data.flutterwave_secret_key}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('flutterwave_secret_key', value);*/}
                    {/*                }}*/}
                    {/*                isSecret*/}
                    {/*                error={errors.flutterwave_secret_key}*/}
                    {/*            />*/}
                    {/*        </div>*/}
                    {/*    </PaymentMethodCard>*/}
                    {/*)}*/}

                    {/*/!* PayTabs *!/*/}
                    {/*{shouldShowMethod('paytabs') && (*/}
                    {/*    <PaymentMethodCard*/}
                    {/*        title={PAYMENT_METHOD_LABELS[PAYMENT_METHODS.PAYTABS]}*/}
                    {/*        icon={<CreditCard className="h-5 w-5" />}*/}
                    {/*        enabled={data.is_paytabs_payment_mode_enabled}*/}
                    {/*        onToggle={(checked) => {*/}
                    {/*            setData('is_paytabs_payment_mode_enabled', checked);*/}
                    {/*        }}*/}
                    {/*        helpUrl={PAYMENT_METHOD_HELP_URLS[PAYMENT_METHODS.PAYTABS]}*/}
                    {/*        helpText={translate('Get your paytabs api credentials from your')}*/}
                    {/*    >*/}
                    {/*        <div className="space-y-4">*/}
                    {/*            <PaymentModeSelector*/}
                    {/*                value={data.paytabs_mode}*/}
                    {/*                onChange={(mode) => {*/}
                    {/*                    setData('paytabs_mode', mode);*/}
                    {/*                }}*/}
                    {/*                name="paytabs"*/}
                    {/*            />*/}
                    {/*            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">*/}
                    {/*                <PaymentInputField*/}
                    {/*                    id="paytabs_profile_id"*/}
                    {/*                    label={translate('Profile ID')}*/}
                    {/*                    value={data.paytabs_profile_id}*/}
                    {/*                    onChange={(value) => {*/}
                    {/*                        setData('paytabs_profile_id', value);*/}
                    {/*                    }}*/}
                    {/*                    error={errors.paytabs_profile_id}*/}
                    {/*                />*/}
                    {/*                <PaymentInputField*/}
                    {/*                    id="paytabs_server_key"*/}
                    {/*                    label={translate('Server key')}*/}
                    {/*                    value={data.paytabs_server_key}*/}
                    {/*                    onChange={(value) => {*/}
                    {/*                        setData('paytabs_server_key', value);*/}
                    {/*                    }}*/}
                    {/*                    isSecret*/}
                    {/*                    error={errors.paytabs_server_key}*/}
                    {/*                />*/}
                    {/*            </div>*/}
                    {/*            <div className="space-y-2">*/}
                    {/*                <Label htmlFor="paytabs_region">{translate('Region')}</Label>*/}
                    {/*                <Select*/}
                    {/*                    value={data.paytabs_region}*/}
                    {/*                    onValueChange={(value) => {*/}
                    {/*                        setData('paytabs_region', value);*/}
                    {/*                    }}*/}
                    {/*                >*/}
                    {/*                    <SelectTrigger>*/}
                    {/*                        <SelectValue placeholder={translate('Select...')} />*/}
                    {/*                    </SelectTrigger>*/}
                    {/*                    <SelectContent>*/}
                    {/*                        <SelectItem value="ARE">{translate('Uae')}</SelectItem>*/}
                    {/*                        <SelectItem value="SAU">{translate('Saudi arabia')}</SelectItem>*/}
                    {/*                        <SelectItem value="OMN">{translate('Oman')}</SelectItem>*/}
                    {/*                        <SelectItem value="JOR">{translate('Jordan')}</SelectItem>*/}
                    {/*                        <SelectItem value="EGY">{translate('Egypt')}</SelectItem>*/}
                    {/*                        <SelectItem value="IRQ">{translate('Iraq')}</SelectItem>*/}
                    {/*                        <SelectItem value="GLOBAL">{translate('Global')}</SelectItem>*/}
                    {/*                    </SelectContent>*/}
                    {/*                </Select>*/}
                    {/*                {errors.paytabs_region &&*/}
                    {/*                    <p className="text-destructive text-sm">{errors.paytabs_region}</p>}*/}
                    {/*            </div>*/}
                    {/*        </div>*/}
                    {/*    </PaymentMethodCard>*/}
                    {/*)}*/}

                    {/*/!* Skrill *!/*/}
                    {/*{shouldShowMethod('skrill') && (*/}
                    {/*    <PaymentMethodCard*/}
                    {/*        title={PAYMENT_METHOD_LABELS[PAYMENT_METHODS.SKRILL]}*/}
                    {/*        icon={<Wallet className="h-5 w-5" />}*/}
                    {/*        enabled={data.is_skrill_payment_mode_enabled}*/}
                    {/*        onToggle={(checked) => {*/}
                    {/*            setData('is_skrill_payment_mode_enabled', checked);*/}
                    {/*        }}*/}
                    {/*        helpUrl={PAYMENT_METHOD_HELP_URLS[PAYMENT_METHODS.SKRILL]}*/}
                    {/*        helpText={translate('Get your skrill merchant credentials from your')}*/}
                    {/*    >*/}
                    {/*        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="skrill_merchant_id"*/}
                    {/*                label={translate('Merchant ID')}*/}
                    {/*                value={data.skrill_merchant_id}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('skrill_merchant_id', value);*/}
                    {/*                }}*/}
                    {/*                error={errors.skrill_merchant_id}*/}
                    {/*            />*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="skrill_secret_word"*/}
                    {/*                label={translate('Secret word')}*/}
                    {/*                value={data.skrill_secret_word}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('skrill_secret_word', value);*/}
                    {/*                }}*/}
                    {/*                isSecret*/}
                    {/*                error={errors.skrill_secret_word}*/}
                    {/*            />*/}
                    {/*        </div>*/}
                    {/*    </PaymentMethodCard>*/}
                    {/*)}*/}

                    {/*/!* CoinGate *!/*/}
                    {/*{shouldShowMethod('coingate') && (*/}
                    {/*    <PaymentMethodCard*/}
                    {/*        title={PAYMENT_METHOD_LABELS[PAYMENT_METHODS.COINGATE]}*/}
                    {/*        icon={<Coins className="h-5 w-5" />}*/}
                    {/*        enabled={data.is_coingate_payment_mode_enabled}*/}
                    {/*        onToggle={(checked) => {*/}
                    {/*            setData('is_coingate_payment_mode_enabled', checked);*/}
                    {/*        }}*/}
                    {/*        helpUrl={PAYMENT_METHOD_HELP_URLS[PAYMENT_METHODS.COINGATE]}*/}
                    {/*        helpText={translate('Get your coingate api credentials from your')}*/}
                    {/*    >*/}
                    {/*        <div className="space-y-4">*/}
                    {/*            <PaymentModeSelector*/}
                    {/*                value={data.coingate_mode}*/}
                    {/*                onChange={(mode) => {*/}
                    {/*                    setData('coingate_mode', mode);*/}
                    {/*                }}*/}
                    {/*                name="coingate"*/}
                    {/*            />*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="coingate_api_token"*/}
                    {/*                label={translate('Api token')}*/}
                    {/*                value={data.coingate_api_token}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('coingate_api_token', value);*/}
                    {/*                }}*/}
                    {/*                isSecret*/}
                    {/*                error={errors.coingate_api_token}*/}
                    {/*            />*/}
                    {/*        </div>*/}
                    {/*    </PaymentMethodCard>*/}
                    {/*)}*/}

                    {/*/!* Payfast *!/*/}
                    {/*{shouldShowMethod('payfast') && (*/}
                    {/*    <PaymentMethodCard*/}
                    {/*        title={PAYMENT_METHOD_LABELS[PAYMENT_METHODS.PAYFAST]}*/}
                    {/*        icon={<CreditCard className="h-5 w-5" />}*/}
                    {/*        enabled={data.is_payfast_payment_mode_enabled}*/}
                    {/*        onToggle={(checked) => {*/}
                    {/*            setData('is_payfast_payment_mode_enabled', checked);*/}
                    {/*        }}*/}
                    {/*        helpUrl={PAYMENT_METHOD_HELP_URLS[PAYMENT_METHODS.PAYFAST]}*/}
                    {/*        helpText={translate('Get your payfast merchant credentials from your')}*/}
                    {/*    >*/}
                    {/*        <div className="space-y-4">*/}
                    {/*            <PaymentModeSelector*/}
                    {/*                value={data.payfast_mode}*/}
                    {/*                onChange={(mode) => {*/}
                    {/*                    setData('payfast_mode', mode);*/}
                    {/*                }}*/}
                    {/*                name="payfast"*/}
                    {/*            />*/}
                    {/*            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">*/}
                    {/*                <PaymentInputField*/}
                    {/*                    id="payfast_merchant_id"*/}
                    {/*                    label={translate('Merchant ID')}*/}
                    {/*                    value={data.payfast_merchant_id}*/}
                    {/*                    onChange={(value) => {*/}
                    {/*                        setData('payfast_merchant_id', value);*/}
                    {/*                    }}*/}
                    {/*                    error={errors.payfast_merchant_id}*/}
                    {/*                />*/}
                    {/*                <PaymentInputField*/}
                    {/*                    id="payfast_merchant_key"*/}
                    {/*                    label={translate('Merchant key')}*/}
                    {/*                    value={data.payfast_merchant_key}*/}
                    {/*                    onChange={(value) => {*/}
                    {/*                        setData('payfast_merchant_key', value);*/}
                    {/*                    }}*/}
                    {/*                    isSecret*/}
                    {/*                    error={errors.payfast_merchant_key}*/}
                    {/*                />*/}
                    {/*            </div>*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="payfast_passphrase"*/}
                    {/*                label={translate('Passphrase')}*/}
                    {/*                value={data.payfast_passphrase}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('payfast_passphrase', value);*/}
                    {/*                }}*/}
                    {/*                error={errors.payfast_passphrase}*/}
                    {/*            />*/}
                    {/*        </div>*/}
                    {/*    </PaymentMethodCard>*/}
                    {/*)}*/}

                    {/*/!* Tap *!/*/}
                    {/*{shouldShowMethod('tap') && (*/}
                    {/*    <PaymentMethodCard*/}
                    {/*        title={PAYMENT_METHOD_LABELS[PAYMENT_METHODS.TAP]}*/}
                    {/*        icon={<CreditCard className="h-5 w-5" />}*/}
                    {/*        enabled={data.is_tap_payment_mode_enabled}*/}
                    {/*        onToggle={(checked) => {*/}
                    {/*            setData('is_tap_payment_mode_enabled', checked);*/}
                    {/*        }}*/}
                    {/*        helpUrl={PAYMENT_METHOD_HELP_URLS[PAYMENT_METHODS.TAP]}*/}
                    {/*        helpText={translate('Get your tap api credentials from your')}*/}
                    {/*    >*/}
                    {/*        <PaymentInputField*/}
                    {/*            id="tap_secret_key"*/}
                    {/*            label={translate('Secret key')}*/}
                    {/*            value={data.tap_secret_key}*/}
                    {/*            onChange={(value) => {*/}
                    {/*                setData('tap_secret_key', value);*/}
                    {/*            }}*/}
                    {/*            isSecret*/}
                    {/*            error={errors.tap_secret_key}*/}
                    {/*        />*/}
                    {/*    </PaymentMethodCard>*/}
                    {/*)}*/}

                    {/*/!* Xendit *!/*/}
                    {/*{shouldShowMethod('xendit') && (*/}
                    {/*    <PaymentMethodCard*/}
                    {/*        title={PAYMENT_METHOD_LABELS[PAYMENT_METHODS.XENDIT]}*/}
                    {/*        icon={<CreditCard className="h-5 w-5" />}*/}
                    {/*        enabled={data.is_xendit_payment_mode_enabled}*/}
                    {/*        onToggle={(checked) => {*/}
                    {/*            setData('is_xendit_payment_mode_enabled', checked);*/}
                    {/*        }}*/}
                    {/*        helpUrl={PAYMENT_METHOD_HELP_URLS[PAYMENT_METHODS.XENDIT]}*/}
                    {/*        helpText={translate('Get your xendit api credentials from your')}*/}
                    {/*    >*/}
                    {/*        <PaymentInputField*/}
                    {/*            id="xendit_api_key"*/}
                    {/*            label={translate('Api key')}*/}
                    {/*            value={data.xendit_api_key}*/}
                    {/*            onChange={(value) => {*/}
                    {/*                setData('xendit_api_key', value);*/}
                    {/*            }}*/}
                    {/*            isSecret*/}
                    {/*            error={errors.xendit_api_key}*/}
                    {/*        />*/}
                    {/*    </PaymentMethodCard>*/}
                    {/*)}*/}

                    {/*/!* PayTR *!/*/}
                    {/*{shouldShowMethod('paytr') && (*/}
                    {/*    <PaymentMethodCard*/}
                    {/*        title={PAYMENT_METHOD_LABELS[PAYMENT_METHODS.PAYTR]}*/}
                    {/*        icon={<CreditCard className="h-5 w-5" />}*/}
                    {/*        enabled={data.is_paytr_payment_mode_enabled}*/}
                    {/*        onToggle={(checked) => {*/}
                    {/*            setData('is_paytr_payment_mode_enabled', checked);*/}
                    {/*        }}*/}
                    {/*        helpUrl={PAYMENT_METHOD_HELP_URLS[PAYMENT_METHODS.PAYTR]}*/}
                    {/*        helpText={translate('Get your paytr merchant credentials from your')}*/}
                    {/*    >*/}
                    {/*        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="paytr_merchant_id"*/}
                    {/*                label={translate('Merchant ID')}*/}
                    {/*                value={data.paytr_merchant_id}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('paytr_merchant_id', value);*/}
                    {/*                }}*/}
                    {/*                error={errors.paytr_merchant_id}*/}
                    {/*            />*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="paytr_merchant_key"*/}
                    {/*                label={translate('Merchant key')}*/}
                    {/*                value={data.paytr_merchant_key}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('paytr_merchant_key', value);*/}
                    {/*                }}*/}
                    {/*                isSecret*/}
                    {/*                error={errors.paytr_merchant_key}*/}
                    {/*            />*/}
                    {/*        </div>*/}
                    {/*        <PaymentInputField*/}
                    {/*            id="paytr_merchant_salt"*/}
                    {/*            label={translate('Merchant salt')}*/}
                    {/*            value={data.paytr_merchant_salt}*/}
                    {/*            onChange={(value) => {*/}
                    {/*                setData('paytr_merchant_salt', value);*/}
                    {/*            }}*/}
                    {/*            isSecret*/}
                    {/*            error={errors.paytr_merchant_salt}*/}
                    {/*        />*/}
                    {/*    </PaymentMethodCard>*/}
                    {/*)}*/}

                    {/*/!* Mollie *!/*/}
                    {/*{shouldShowMethod('mollie') && (*/}
                    {/*    <PaymentMethodCard*/}
                    {/*        title={PAYMENT_METHOD_LABELS[PAYMENT_METHODS.MOLLIE]}*/}
                    {/*        icon={<CreditCard className="h-5 w-5" />}*/}
                    {/*        enabled={data.is_mollie_payment_mode_enabled}*/}
                    {/*        onToggle={(checked) => {*/}
                    {/*            setData('is_mollie_payment_mode_enabled', checked);*/}
                    {/*        }}*/}
                    {/*        helpUrl={PAYMENT_METHOD_HELP_URLS[PAYMENT_METHODS.MOLLIE]}*/}
                    {/*        helpText={translate('Get your mollie api credentials from your')}*/}
                    {/*    >*/}
                    {/*        <PaymentInputField*/}
                    {/*            id="mollie_api_key"*/}
                    {/*            label={translate('Api key')}*/}
                    {/*            value={data.mollie_api_key}*/}
                    {/*            onChange={(value) => {*/}
                    {/*                setData('mollie_api_key', value);*/}
                    {/*            }}*/}
                    {/*            isSecret*/}
                    {/*            error={errors.mollie_api_key}*/}
                    {/*        />*/}
                    {/*    </PaymentMethodCard>*/}
                    {/*)}*/}

                    {/*/!* toyyibPay *!/*/}
                    {/*{shouldShowMethod('toyyibpay') && (*/}
                    {/*    <PaymentMethodCard*/}
                    {/*        title={PAYMENT_METHOD_LABELS[PAYMENT_METHODS.TOYYIBPAY]}*/}
                    {/*        icon={<CreditCard className="h-5 w-5" />}*/}
                    {/*        enabled={data.is_toyyibpay_payment_mode_enabled}*/}
                    {/*        onToggle={(checked) => {*/}
                    {/*            setData('is_toyyibpay_payment_mode_enabled', checked);*/}
                    {/*        }}*/}
                    {/*        helpUrl={PAYMENT_METHOD_HELP_URLS[PAYMENT_METHODS.TOYYIBPAY]}*/}
                    {/*        helpText={translate('Get your toyyibpay credentials from your')}*/}
                    {/*    >*/}
                    {/*        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="toyyibpay_category_code"*/}
                    {/*                label={translate('Category code')}*/}
                    {/*                value={data.toyyibpay_category_code}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('toyyibpay_category_code', value);*/}
                    {/*                }}*/}
                    {/*                error={errors.toyyibpay_category_code}*/}
                    {/*            />*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="toyyibpay_secret_key"*/}
                    {/*                label={translate('Secret key')}*/}
                    {/*                value={data.toyyibpay_secret_key}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('toyyibpay_secret_key', value);*/}
                    {/*                }}*/}
                    {/*                isSecret*/}
                    {/*                error={errors.toyyibpay_secret_key}*/}
                    {/*            />*/}
                    {/*        </div>*/}
                    {/*    </PaymentMethodCard>*/}
                    {/*)}*/}

                    {/*/!* Benefit *!/*/}
                    {/*{shouldShowMethod('benefit') && (*/}
                    {/*    <PaymentMethodCard*/}
                    {/*        title={PAYMENT_METHOD_LABELS[PAYMENT_METHODS.BENEFIT]}*/}
                    {/*        icon={<CreditCard className="h-5 w-5" />}*/}
                    {/*        enabled={data.is_benefit_payment_mode_enabled}*/}
                    {/*        onToggle={(checked) => {*/}
                    {/*            setData('is_benefit_payment_mode_enabled', checked);*/}
                    {/*        }}*/}
                    {/*        helpUrl={PAYMENT_METHOD_HELP_URLS[PAYMENT_METHODS.BENEFIT]}*/}
                    {/*        helpText={translate('Get your benefitpay api credentials from your')}*/}
                    {/*    >*/}
                    {/*        <PaymentModeSelector*/}
                    {/*            value={data.benefit_mode as 'sandbox' | 'live'}*/}
                    {/*            onChange={(mode) => {*/}
                    {/*                setData('benefit_mode', mode);*/}
                    {/*            }}*/}
                    {/*            name="benefit"*/}
                    {/*        />*/}
                    {/*        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="benefit_public_key"*/}
                    {/*                label={translate('Public key')}*/}
                    {/*                value={data.benefit_public_key}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('benefit_public_key', value);*/}
                    {/*                }}*/}
                    {/*                error={errors.benefit_public_key}*/}
                    {/*            />*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="benefit_secret_key"*/}
                    {/*                label={translate('Secret key')}*/}
                    {/*                value={data.benefit_secret_key}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('benefit_secret_key', value);*/}
                    {/*                }}*/}
                    {/*                isSecret*/}
                    {/*                error={errors.benefit_secret_key}*/}
                    {/*            />*/}
                    {/*        </div>*/}
                    {/*    </PaymentMethodCard>*/}
                    {/*)}*/}

                    {/*/!* IyziPay *!/*/}
                    {/*{shouldShowMethod('iyzipay') && (*/}
                    {/*    <PaymentMethodCard*/}
                    {/*        title={PAYMENT_METHOD_LABELS[PAYMENT_METHODS.IYZIPAY]}*/}
                    {/*        icon={<CreditCard className="h-5 w-5" />}*/}
                    {/*        enabled={data.is_iyzipay_payment_mode_enabled}*/}
                    {/*        onToggle={(checked) => {*/}
                    {/*            setData('is_iyzipay_payment_mode_enabled', checked);*/}
                    {/*        }}*/}
                    {/*        helpUrl={PAYMENT_METHOD_HELP_URLS[PAYMENT_METHODS.IYZIPAY]}*/}
                    {/*        helpText={translate('Get your iyzipay api credentials from your')}*/}
                    {/*    >*/}
                    {/*        <PaymentModeSelector*/}
                    {/*            value={data.iyzipay_mode as 'sandbox' | 'live'}*/}
                    {/*            onChange={(mode) => {*/}
                    {/*                setData('iyzipay_mode', mode);*/}
                    {/*            }}*/}
                    {/*            name="iyzipay"*/}
                    {/*        />*/}
                    {/*        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="iyzipay_public_key"*/}
                    {/*                label={translate('Public key')}*/}
                    {/*                value={data.iyzipay_public_key}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('iyzipay_public_key', value);*/}
                    {/*                }}*/}
                    {/*                error={errors.iyzipay_public_key}*/}
                    {/*            />*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="iyzipay_secret_key"*/}
                    {/*                label={translate('Secret key')}*/}
                    {/*                value={data.iyzipay_secret_key}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('iyzipay_secret_key', value);*/}
                    {/*                }}*/}
                    {/*                isSecret*/}
                    {/*                error={errors.iyzipay_secret_key}*/}
                    {/*            />*/}
                    {/*        </div>*/}
                    {/*    </PaymentMethodCard>*/}
                    {/*)}*/}

                    {/*/!* AamarPay *!/*/}
                    {/*{shouldShowMethod('aamarpay') && (*/}
                    {/*    <PaymentMethodCard*/}
                    {/*        title={PAYMENT_METHOD_LABELS[PAYMENT_METHODS.AAMARPAY]}*/}
                    {/*        icon={<CreditCard className="h-5 w-5" />}*/}
                    {/*        enabled={data.is_aamarpay_payment_mode_enabled}*/}
                    {/*        onToggle={(checked) => {*/}
                    {/*            setData('is_aamarpay_payment_mode_enabled', checked);*/}
                    {/*        }}*/}
                    {/*        helpUrl={PAYMENT_METHOD_HELP_URLS[PAYMENT_METHODS.AAMARPAY]}*/}
                    {/*        helpText={translate('Get your aamarpay api credentials from your')}*/}
                    {/*    >*/}
                    {/*        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="aamarpay_store_id"*/}
                    {/*                label={translate('Store ID')}*/}
                    {/*                value={data.aamarpay_store_id}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('aamarpay_store_id', value);*/}
                    {/*                }}*/}
                    {/*                error={errors.aamarpay_store_id}*/}
                    {/*            />*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="aamarpay_signature"*/}
                    {/*                label={translate('Signature')}*/}
                    {/*                value={data.aamarpay_signature}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('aamarpay_signature', value);*/}
                    {/*                }}*/}
                    {/*                isSecret*/}
                    {/*                error={errors.aamarpay_signature}*/}
                    {/*            />*/}
                    {/*        </div>*/}
                    {/*    </PaymentMethodCard>*/}
                    {/*)}*/}

                    {/*/!* Midtrans *!/*/}
                    {/*{shouldShowMethod('midtrans') && (*/}
                    {/*    <PaymentMethodCard*/}
                    {/*        title={PAYMENT_METHOD_LABELS[PAYMENT_METHODS.MIDTRANS]}*/}
                    {/*        icon={<CreditCard className="h-5 w-5" />}*/}
                    {/*        enabled={data.is_midtrans_payment_mode_enabled}*/}
                    {/*        onToggle={(checked) => {*/}
                    {/*            setData('is_midtrans_payment_mode_enabled', checked);*/}
                    {/*        }}*/}
                    {/*        helpUrl={PAYMENT_METHOD_HELP_URLS[PAYMENT_METHODS.MIDTRANS]}*/}
                    {/*        helpText={translate('Get your midtrans api credentials from your')}*/}
                    {/*    >*/}
                    {/*        <PaymentModeSelector*/}
                    {/*            value={data.midtrans_mode as 'sandbox' | 'live'}*/}
                    {/*            onChange={(mode) => {*/}
                    {/*                setData('midtrans_mode', mode);*/}
                    {/*            }}*/}
                    {/*            name="midtrans"*/}
                    {/*        />*/}
                    {/*        <PaymentInputField*/}
                    {/*            id="midtrans_secret_key"*/}
                    {/*            label={translate('Secret key')}*/}
                    {/*            value={data.midtrans_secret_key}*/}
                    {/*            onChange={(value) => {*/}
                    {/*                setData('midtrans_secret_key', value);*/}
                    {/*            }}*/}
                    {/*            isSecret*/}
                    {/*            error={errors.midtrans_secret_key}*/}
                    {/*        />*/}
                    {/*    </PaymentMethodCard>*/}
                    {/*)}*/}

                    {/*/!* YooKassa *!/*/}
                    {/*{shouldShowMethod('yookassa') && (*/}
                    {/*    <PaymentMethodCard*/}
                    {/*        title={PAYMENT_METHOD_LABELS[PAYMENT_METHODS.YOOKASSA]}*/}
                    {/*        icon={<CreditCard className="h-5 w-5" />}*/}
                    {/*        enabled={data.is_yookassa_payment_mode_enabled}*/}
                    {/*        onToggle={(checked) => {*/}
                    {/*            setData('is_yookassa_payment_mode_enabled', checked);*/}
                    {/*        }}*/}
                    {/*        helpUrl={PAYMENT_METHOD_HELP_URLS[PAYMENT_METHODS.YOOKASSA]}*/}
                    {/*        helpText={translate('Get your yookassa api credentials from your')}*/}
                    {/*    >*/}
                    {/*        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="yookassa_shop_id"*/}
                    {/*                label={translate('Shop ID')}*/}
                    {/*                value={data.yookassa_shop_id}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('yookassa_shop_id', value);*/}
                    {/*                }}*/}
                    {/*                error={errors.yookassa_shop_id}*/}
                    {/*            />*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="yookassa_secret_key"*/}
                    {/*                label={translate('Secret key')}*/}
                    {/*                value={data.yookassa_secret_key}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('yookassa_secret_key', value);*/}
                    {/*                }}*/}
                    {/*                isSecret*/}
                    {/*                error={errors.yookassa_secret_key}*/}
                    {/*            />*/}
                    {/*        </div>*/}
                    {/*    </PaymentMethodCard>*/}
                    {/*)}*/}

                    {/*/!* Nepalste *!/*/}
                    {/*{shouldShowMethod('nepalste') && (*/}
                    {/*    <PaymentMethodCard*/}
                    {/*        title={PAYMENT_METHOD_LABELS[PAYMENT_METHODS.NEPALSTE]}*/}
                    {/*        icon={<CreditCard className="h-5 w-5" />}*/}
                    {/*        enabled={data.is_nepalste_payment_mode_enabled}*/}
                    {/*        onToggle={(checked) => setData('is_nepalste_payment_mode_enabled', checked)}*/}
                    {/*        helpUrl={PAYMENT_METHOD_HELP_URLS[PAYMENT_METHODS.NEPALSTE]}*/}
                    {/*        helpText={translate('Get your nepalste api credentials from your')}*/}
                    {/*    >*/}
                    {/*        <PaymentModeSelector*/}
                    {/*            value={data.nepalste_mode as 'sandbox' | 'live'}*/}
                    {/*            onChange={(mode) => setData('nepalste_mode', mode)}*/}
                    {/*            name="nepalste"*/}
                    {/*        />*/}
                    {/*        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="nepalste_public_key"*/}
                    {/*                label={translate('Public key')}*/}
                    {/*                value={data.nepalste_public_key}*/}
                    {/*                onChange={(value) => setData('nepalste_public_key', value)}*/}
                    {/*                error={errors.nepalste_public_key}*/}
                    {/*            />*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="nepalste_secret_key"*/}
                    {/*                label={translate('Secret key')}*/}
                    {/*                value={data.nepalste_secret_key}*/}
                    {/*                onChange={(value) => setData('nepalste_secret_key', value)}*/}
                    {/*                isSecret*/}
                    {/*                error={errors.nepalste_secret_key}*/}
                    {/*            />*/}
                    {/*        </div>*/}
                    {/*    </PaymentMethodCard>*/}
                    {/*)}*/}

                    {/*/!* Paiement Pro *!/*/}
                    {/*{shouldShowMethod('paiement') && (*/}
                    {/*    <PaymentMethodCard*/}
                    {/*        title={PAYMENT_METHOD_LABELS[PAYMENT_METHODS.PAIEMENT]}*/}
                    {/*        icon={<CreditCard className="h-5 w-5" />}*/}
                    {/*        enabled={data.is_paiement_payment_mode_enabled}*/}
                    {/*        onToggle={(checked) => {*/}
                    {/*            setData('is_paiement_payment_mode_enabled', checked);*/}
                    {/*        }}*/}
                    {/*        helpUrl={PAYMENT_METHOD_HELP_URLS[PAYMENT_METHODS.PAIEMENT]}*/}
                    {/*        helpText={translate('Get your paiement pro api credentials from your')}*/}
                    {/*    >*/}
                    {/*        <PaymentInputField*/}
                    {/*            id="paiement_merchant_id"*/}
                    {/*            label={translate('Merchant ID')}*/}
                    {/*            value={data.paiement_merchant_id}*/}
                    {/*            onChange={(value) => {*/}
                    {/*                setData('paiement_merchant_id', value);*/}
                    {/*            }}*/}
                    {/*            error={errors.paiement_merchant_id}*/}
                    {/*        />*/}
                    {/*    </PaymentMethodCard>*/}
                    {/*)}*/}

                    {/*/!* CinetPay *!/*/}
                    {/*{shouldShowMethod('cinetpay') && (*/}
                    {/*    <PaymentMethodCard*/}
                    {/*        title={PAYMENT_METHOD_LABELS[PAYMENT_METHODS.CINETPAY]}*/}
                    {/*        icon={<CreditCard className="h-5 w-5" />}*/}
                    {/*        enabled={data.is_cinetpay_payment_mode_enabled}*/}
                    {/*        onToggle={(checked) => {*/}
                    {/*            setData('is_cinetpay_payment_mode_enabled', checked);*/}
                    {/*        }}*/}
                    {/*        helpUrl={PAYMENT_METHOD_HELP_URLS[PAYMENT_METHODS.CINETPAY]}*/}
                    {/*        helpText={translate('Get your cinetpay api credentials from your')}*/}
                    {/*    >*/}
                    {/*        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="cinetpay_site_id"*/}
                    {/*                label={translate('Site ID')}*/}
                    {/*                value={data.cinetpay_site_id}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('cinetpay_site_id', value);*/}
                    {/*                }}*/}
                    {/*                error={errors.cinetpay_site_id}*/}
                    {/*            />*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="cinetpay_api_key"*/}
                    {/*                label={translate('Api key')}*/}
                    {/*                value={data.cinetpay_api_key}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('cinetpay_api_key', value);*/}
                    {/*                }}*/}
                    {/*                error={errors.cinetpay_api_key}*/}
                    {/*            />*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="cinetpay_secret_key"*/}
                    {/*                label={translate('Secret key')}*/}
                    {/*                value={data.cinetpay_secret_key}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('cinetpay_secret_key', value);*/}
                    {/*                }}*/}
                    {/*                isSecret*/}
                    {/*                error={errors.cinetpay_secret_key}*/}
                    {/*            />*/}
                    {/*        </div>*/}
                    {/*    </PaymentMethodCard>*/}
                    {/*)}*/}

                    {/*/!* PayHere *!/*/}
                    {/*{shouldShowMethod('payhere') && (*/}
                    {/*    <PaymentMethodCard*/}
                    {/*        title={PAYMENT_METHOD_LABELS[PAYMENT_METHODS.PAYHERE]}*/}
                    {/*        icon={<CreditCard className="h-5 w-5" />}*/}
                    {/*        enabled={data.is_payhere_payment_mode_enabled}*/}
                    {/*        onToggle={(checked) => {*/}
                    {/*            setData('is_payhere_payment_mode_enabled', checked);*/}
                    {/*        }}*/}
                    {/*        helpUrl={PAYMENT_METHOD_HELP_URLS[PAYMENT_METHODS.PAYHERE]}*/}
                    {/*        helpText={translate('Get your payhere api credentials from your')}*/}
                    {/*    >*/}
                    {/*        <PaymentModeSelector*/}
                    {/*            value={data.payhere_mode as 'sandbox' | 'live'}*/}
                    {/*            onChange={(mode) => {*/}
                    {/*                setData('payhere_mode', mode);*/}
                    {/*            }}*/}
                    {/*            name="payhere"*/}
                    {/*        />*/}
                    {/*        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="payhere_merchant_id"*/}
                    {/*                label={translate('Merchant ID')}*/}
                    {/*                value={data.payhere_merchant_id}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('payhere_merchant_id', value);*/}
                    {/*                }}*/}
                    {/*                error={errors.payhere_merchant_id}*/}
                    {/*            />*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="payhere_merchant_secret"*/}
                    {/*                label={translate('Merchant secret')}*/}
                    {/*                value={data.payhere_merchant_secret}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('payhere_merchant_secret', value);*/}
                    {/*                }}*/}
                    {/*                isSecret*/}
                    {/*                error={errors.payhere_merchant_secret}*/}
                    {/*            />*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="payhere_app_id"*/}
                    {/*                label={translate('App ID')}*/}
                    {/*                value={data.payhere_app_id}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('payhere_app_id', value);*/}
                    {/*                }}*/}
                    {/*                error={errors.payhere_app_id}*/}
                    {/*            />*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="payhere_app_secret"*/}
                    {/*                label={translate('App secret')}*/}
                    {/*                value={data.payhere_app_secret}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('payhere_app_secret', value);*/}
                    {/*                }}*/}
                    {/*                isSecret*/}
                    {/*                error={errors.payhere_app_secret}*/}
                    {/*            />*/}
                    {/*        </div>*/}
                    {/*    </PaymentMethodCard>*/}
                    {/*)}*/}

                    {/*/!* FedaPay *!/*/}
                    {/*{shouldShowMethod('fedapay') && (*/}
                    {/*    <PaymentMethodCard*/}
                    {/*        title={PAYMENT_METHOD_LABELS[PAYMENT_METHODS.FEDAPAY]}*/}
                    {/*        icon={<CreditCard className="h-5 w-5" />}*/}
                    {/*        enabled={data.is_fedapay_payment_mode_enabled}*/}
                    {/*        onToggle={(checked) => {*/}
                    {/*            setData('is_fedapay_payment_mode_enabled', checked);*/}
                    {/*        }}*/}
                    {/*        helpUrl={PAYMENT_METHOD_HELP_URLS[PAYMENT_METHODS.FEDAPAY]}*/}
                    {/*        helpText={translate('Get your fedapay api credentials from your')}*/}
                    {/*    >*/}
                    {/*        <PaymentModeSelector*/}
                    {/*            value={data.fedapay_mode as 'sandbox' | 'live'}*/}
                    {/*            onChange={(mode) => {*/}
                    {/*                setData('fedapay_mode', mode);*/}
                    {/*            }}*/}
                    {/*            name="fedapay"*/}
                    {/*        />*/}
                    {/*        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="fedapay_public_key"*/}
                    {/*                label={translate('Public key')}*/}
                    {/*                value={data.fedapay_public_key}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('fedapay_public_key', value);*/}
                    {/*                }}*/}
                    {/*                error={errors.fedapay_public_key}*/}
                    {/*            />*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="fedapay_secret_key"*/}
                    {/*                label={translate('Secret key')}*/}
                    {/*                value={data.fedapay_secret_key}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('fedapay_secret_key', value);*/}
                    {/*                }}*/}
                    {/*                isSecret*/}
                    {/*                error={errors.fedapay_secret_key}*/}
                    {/*            />*/}
                    {/*        </div>*/}
                    {/*    </PaymentMethodCard>*/}
                    {/*)}*/}

                    {/*/!* AuthorizeNet *!/*/}
                    {/*{shouldShowMethod('authorizenet') && (*/}
                    {/*    <PaymentMethodCard*/}
                    {/*        title={PAYMENT_METHOD_LABELS[PAYMENT_METHODS.AUTHORIZENET]}*/}
                    {/*        icon={<CreditCard className="h-5 w-5" />}*/}
                    {/*        enabled={data.is_authorizenet_payment_mode_enabled}*/}
                    {/*        onToggle={(checked) => {*/}
                    {/*            setData('is_authorizenet_payment_mode_enabled', checked);*/}
                    {/*        }}*/}
                    {/*        helpUrl={PAYMENT_METHOD_HELP_URLS[PAYMENT_METHODS.AUTHORIZENET]}*/}
                    {/*        helpText={translate('Get your authorizenet api credentials from your')}*/}
                    {/*    >*/}
                    {/*        <PaymentModeSelector*/}
                    {/*            value={data.authorizenet_mode as 'sandbox' | 'live'}*/}
                    {/*            onChange={(mode) => {*/}
                    {/*                setData('authorizenet_mode', mode);*/}
                    {/*            }}*/}
                    {/*            name="authorizenet"*/}
                    {/*        />*/}
                    {/*        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="authorizenet_merchant_id"*/}
                    {/*                label={translate('Merchant ID')}*/}
                    {/*                value={data.authorizenet_merchant_id}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('authorizenet_merchant_id', value);*/}
                    {/*                }}*/}
                    {/*                error={errors.authorizenet_merchant_id}*/}
                    {/*            />*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="authorizenet_transaction_key"*/}
                    {/*                label={translate('Transaction key')}*/}
                    {/*                value={data.authorizenet_transaction_key}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('authorizenet_transaction_key', value);*/}
                    {/*                }}*/}
                    {/*                isSecret*/}
                    {/*                error={errors.authorizenet_transaction_key}*/}
                    {/*            />*/}
                    {/*        </div>*/}
                    {/*    </PaymentMethodCard>*/}
                    {/*)}*/}

                    {/*/!* Khalti *!/*/}
                    {/*{shouldShowMethod('khalti') && (*/}
                    {/*    <PaymentMethodCard*/}
                    {/*        title={PAYMENT_METHOD_LABELS[PAYMENT_METHODS.KHALTI]}*/}
                    {/*        icon={<CreditCard className="h-5 w-5" />}*/}
                    {/*        enabled={data.is_khalti_payment_mode_enabled}*/}
                    {/*        onToggle={(checked) => {*/}
                    {/*            setData('is_khalti_payment_mode_enabled', checked);*/}
                    {/*        }}*/}
                    {/*        helpUrl={PAYMENT_METHOD_HELP_URLS[PAYMENT_METHODS.KHALTI]}*/}
                    {/*        helpText={translate('Get your khalti api credentials from your')}*/}
                    {/*    >*/}
                    {/*        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="khalti_public_key"*/}
                    {/*                label={translate('Public key')}*/}
                    {/*                value={data.khalti_public_key}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('khalti_public_key', value);*/}
                    {/*                }}*/}
                    {/*                error={errors.khalti_public_key}*/}
                    {/*            />*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="khalti_secret_key"*/}
                    {/*                label={translate('Secret key')}*/}
                    {/*                value={data.khalti_secret_key}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('khalti_secret_key', value);*/}
                    {/*                }}*/}
                    {/*                isSecret*/}
                    {/*                error={errors.khalti_secret_key}*/}
                    {/*            />*/}
                    {/*        </div>*/}
                    {/*    </PaymentMethodCard>*/}
                    {/*)}*/}

                    {/*/!* Easebuzz *!/*/}
                    {/*{shouldShowMethod('easebuzz') && (*/}
                    {/*    <PaymentMethodCard*/}
                    {/*        title={PAYMENT_METHOD_LABELS[PAYMENT_METHODS.EASEBUZZ]}*/}
                    {/*        icon={<CreditCard className="h-5 w-5" />}*/}
                    {/*        enabled={data.is_easebuzz_payment_mode_enabled}*/}
                    {/*        onToggle={(checked) => {*/}
                    {/*            setData('is_easebuzz_payment_mode_enabled', checked);*/}
                    {/*        }}*/}
                    {/*        helpUrl={PAYMENT_METHOD_HELP_URLS[PAYMENT_METHODS.EASEBUZZ]}*/}
                    {/*        helpText={translate('Get your easebuzz api credentials from your')}*/}
                    {/*    >*/}
                    {/*        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="easebuzz_merchant_key"*/}
                    {/*                label={translate('Merchant key')}*/}
                    {/*                value={data.easebuzz_merchant_key}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('easebuzz_merchant_key', value);*/}
                    {/*                }}*/}
                    {/*                error={errors.easebuzz_merchant_key}*/}
                    {/*            />*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="easebuzz_salt_key"*/}
                    {/*                label={translate('Salt key')}*/}
                    {/*                value={data.easebuzz_salt_key}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('easebuzz_salt_key', value);*/}
                    {/*                }}*/}
                    {/*                isSecret*/}
                    {/*                error={errors.easebuzz_salt_key}*/}
                    {/*            />*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="easebuzz_environment"*/}
                    {/*                label={translate('Environment')}*/}
                    {/*                value={data.easebuzz_environment}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('easebuzz_environment', value);*/}
                    {/*                }}*/}
                    {/*                error={errors.easebuzz_environment}*/}
                    {/*            />*/}
                    {/*        </div>*/}
                    {/*    </PaymentMethodCard>*/}
                    {/*)}*/}

                    {/*/!* Ozow *!/*/}
                    {/*{shouldShowMethod('ozow') && (*/}
                    {/*    <PaymentMethodCard*/}
                    {/*        title={PAYMENT_METHOD_LABELS[PAYMENT_METHODS.OZOW]}*/}
                    {/*        icon={<CreditCard className="h-5 w-5" />}*/}
                    {/*        enabled={data.is_ozow_payment_mode_enabled}*/}
                    {/*        onToggle={(checked) => {*/}
                    {/*            setData('is_ozow_payment_mode_enabled', checked);*/}
                    {/*        }}*/}
                    {/*        helpUrl={PAYMENT_METHOD_HELP_URLS[PAYMENT_METHODS.OZOW]}*/}
                    {/*        helpText={translate('Get your ozow api credentials from your')}*/}
                    {/*    >*/}
                    {/*        <PaymentModeSelector*/}
                    {/*            value={data.ozow_mode as 'sandbox' | 'live'}*/}
                    {/*            onChange={(mode) => {*/}
                    {/*                setData('ozow_mode', mode);*/}
                    {/*            }}*/}
                    {/*            name="ozow"*/}
                    {/*        />*/}
                    {/*        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="ozow_site_key"*/}
                    {/*                label={translate('Site key')}*/}
                    {/*                value={data.ozow_site_key}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('ozow_site_key', value);*/}
                    {/*                }}*/}
                    {/*                error={errors.ozow_site_key}*/}
                    {/*            />*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="ozow_private_key"*/}
                    {/*                label={translate('Private key')}*/}
                    {/*                value={data.ozow_private_key}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('ozow_private_key', value);*/}
                    {/*                }}*/}
                    {/*                isSecret*/}
                    {/*                error={errors.ozow_private_key}*/}
                    {/*            />*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="ozow_api_key"*/}
                    {/*                label={translate('Api key')}*/}
                    {/*                value={data.ozow_api_key}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('ozow_api_key', value);*/}
                    {/*                }}*/}
                    {/*                error={errors.ozow_api_key}*/}
                    {/*            />*/}
                    {/*        </div>*/}
                    {/*    </PaymentMethodCard>*/}
                    {/*)}*/}

                    {/*/!* Cashfree *!/*/}
                    {/*{shouldShowMethod('cashfree') && (*/}
                    {/*    <PaymentMethodCard*/}
                    {/*        title={PAYMENT_METHOD_LABELS[PAYMENT_METHODS.CASHFREE]}*/}
                    {/*        icon={<CreditCard className="h-5 w-5" />}*/}
                    {/*        enabled={data.is_cashfree_payment_mode_enabled}*/}
                    {/*        onToggle={(checked) => {*/}
                    {/*            setData('is_cashfree_payment_mode_enabled', checked);*/}
                    {/*        }}*/}
                    {/*        helpUrl={PAYMENT_METHOD_HELP_URLS[PAYMENT_METHODS.CASHFREE]}*/}
                    {/*        helpText={translate('Get your cashfree api credentials from your')}*/}
                    {/*    >*/}
                    {/*        <PaymentModeSelector*/}
                    {/*            value={data.cashfree_mode as 'sandbox' | 'live'}*/}
                    {/*            onChange={(mode) => {*/}
                    {/*                setData('cashfree_mode', mode);*/}
                    {/*            }}*/}
                    {/*            name="cashfree"*/}
                    {/*        />*/}
                    {/*        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="cashfree_public_key"*/}
                    {/*                label={translate('Public key')}*/}
                    {/*                value={data.cashfree_public_key}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('cashfree_public_key', value);*/}
                    {/*                }}*/}
                    {/*                error={errors.cashfree_public_key}*/}
                    {/*            />*/}
                    {/*            <PaymentInputField*/}
                    {/*                id="cashfree_secret_key"*/}
                    {/*                label={translate('Secret key')}*/}
                    {/*                value={data.cashfree_secret_key}*/}
                    {/*                onChange={(value) => {*/}
                    {/*                    setData('cashfree_secret_key', value);*/}
                    {/*                }}*/}
                    {/*                isSecret*/}
                    {/*                error={errors.cashfree_secret_key}*/}
                    {/*            />*/}
                    {/*        </div>*/}
                    {/*    </PaymentMethodCard>*/}
                    {/*)}*/}
                </div>
            </form>
        </SettingsSection>
    );
}
