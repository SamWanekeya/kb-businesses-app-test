import { toast } from '@components/CustomToast';
import PageTemplate from '@components/PageTemplate';
import { Button } from '@components/UserInterface/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/UserInterface/Card';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import { Switch } from '@components/UserInterface/Switch';
import { Textarea } from '@components/UserInterface/Textarea';
import { router } from '@inertiajs/react';
import { formatNumberInput } from '@utils/Helpers/NumberFormatters';
import { route } from '@utils/Routes';
import type { ChangeEvent, SubmitEvent } from 'react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Plan {
    id: number;
    name: string;
    price: number;
    yearly_price: number | null;
    duration: string;
    description: string | null;
    maximum_users: number;
    maximum_staffs: number;
    storage_limit: number;
    enable_hafinen_intelligence: string;
    is_trial: string | null;
    trial_days: number;
    is_plan_enabled: string;
    is_default: boolean;
}

interface PlanCreateEditFormData {
    name: string;
    price: number | string | null;
    yearly_price: number | string | null;
    duration: string;
    description: string;
    maximum_users: number | string | null;
    maximum_staffs: number | string | null;
    storage_limit: number | string | null;
    enable_hafinen_intelligence: string;
    is_trial: string | null;
    trial_days: number | string | null;
    is_plan_enabled: string;
    is_default: boolean;
}

interface Props {
    plan?: Plan;
    hasDefaultPlan?: boolean;
    otherDefaultPlanExists?: boolean;
}

type FormErrors = Record<string, string>;

/**
 * Provides the create and edit form for subscription plans.
 *
 * Handles plan field state, client-side validation, server-side validation
 * feedback, feature and setting toggles, form submission, and navigation.
 *
 * Client-side validation provides immediate feedback while backend validation
 * remains authoritative before a plan is persisted.
 */
export default function PlanCreateEditForm({ plan, hasDefaultPlan = false }: Props) {
    const { t: translate } = useTranslation();
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const isEdit = Boolean(plan);

    const [formData, setFormData] = useState<PlanCreateEditFormData>({
        name: plan?.name ?? '',
        price: formatNumberInput(plan?.price),
        yearly_price: formatNumberInput(plan?.yearly_price),
        duration: plan?.duration ?? 'monthly',
        description: plan?.description ?? '',
        maximum_users: plan?.maximum_users ?? null,
        maximum_staffs: plan?.maximum_staffs ?? null,
        storage_limit: formatNumberInput(plan?.storage_limit),
        enable_hafinen_intelligence: plan?.enable_hafinen_intelligence ?? 'off',
        is_trial: plan?.is_trial ?? null,
        trial_days: plan?.trial_days ?? null,
        is_plan_enabled: plan?.is_plan_enabled ?? 'on',
        is_default: plan?.is_default ?? false,
    });

    /**
     * Updates standard form fields and clears any existing server-side error
     * for the field being edited.
     */
    const handleChange = useCallback((event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = event.target;

        setFormData((current) => ({
            ...current,
            [name]: value,
        }));

        setErrors((current) => {
            if (!current[name]) {
                return current;
            }

            const next = { ...current };
            delete next[name];

            return next;
        });
    }, []);

    /**
     * Updates validation state for an individual form field.
     *
     * Input-level validation and server-side validation share the same error
     * state so the latest validation result represents the current value.
     */
    const handleValidate = useCallback((field: keyof PlanCreateEditFormData, valid: boolean, message: string | null) => {
        setErrors((current) => {
            const next = { ...current };

            if (valid || message === null) {
                delete next[field];
            } else {
                next[field] = message;
            }

            return next;
        });
    }, []);

    /**
     * Updates boolean-style settings represented by "on"/"off" values.
     */
    const handleSwitchChange = useCallback((name: keyof PlanCreateEditFormData, checked: boolean) => {
        setFormData((current) => ({
            ...current,
            [name]: checked ? 'on' : 'off',
        }));

        setErrors((current) => {
            if (!current[name]) {
                return current;
            }

            const next = { ...current };
            delete next[name];

            return next;
        });
    }, []);

    /**
     * Updates the default-plan setting.
     */
    const handleDefaultChange = useCallback((checked: boolean) => {
        setFormData((current) => ({
            ...current,
            is_default: checked,
        }));
    }, []);

    /**
     * Validates a non-negative decimal value with up to two decimal places.
     */
    const isValidDecimal = (value: number | string): boolean => {
        const stringValue = String(value).trim();

        if (!stringValue) {
            return false;
        }

        return /^\d+(?:\.\d{1,2})?$/.test(stringValue);
    };

    /**
     * Validates an integer value greater than or equal to the supplied minimum.
     */
    const isValidInteger = (value: number | string, minimum: number): boolean => {
        const stringValue = String(value).trim();

        if (!stringValue || !/^\d+$/.test(stringValue)) {
            return false;
        }

        return Number(stringValue) >= minimum;
    };

    /**
     * Validates plan-specific numeric constraints that are outside the generic
     * Input component's responsibility.
     */
    const validateForm = useCallback((): boolean => {
        const validationErrors: FormErrors = {};

        if (!formData.name.trim()) {
            validationErrors.name = translate('This field is required');
        } else if (formData.name.trim().length < 2) {
            validationErrors.name = translate('Are you sure you entered the name correctly?');
        } else if (formData.name.trim().length > 255) {
            validationErrors.name = translate('The maximum characters allowed for the name field is 255');
        }

        if (!isValidDecimal(formData.price) || Number(formData.price) < 0) {
            validationErrors.price = translate('Monthly price must be 1 or greater and have no more than 2 decimal places');
        }

        if (
            formData.yearly_price !== null &&
            String(formData.yearly_price).trim() !== '' &&
            (!isValidDecimal(formData.yearly_price) || Number(formData.yearly_price) < 0)
        ) {
            validationErrors.yearly_price = translate('Yearly price must be 1 or greater and have no more than 2 decimal places');
        }

        if (!isValidInteger(formData.maximum_users, 1)) {
            validationErrors.maximum_users = translate('Maximum users must be at least 1');
        }

        if (!isValidInteger(formData.maximum_staffs, 1)) {
            validationErrors.maximum_staffs = translate('Maximum staff members must be at least 1');
        }

        if (!isValidDecimal(formData.storage_limit) || Number(formData.storage_limit) < 0) {
            validationErrors.storage_limit = translate('Storage limit must be 1 or greater and have no more than 2 decimal places');
        }

        if (!isValidInteger(formData.trial_days, 0)) {
            validationErrors.trial_days = translate('Trial days must be 0 or greater and must be a whole number');
        }

        setErrors((current) => ({
            ...current,
            ...validationErrors,
        }));

        return Object.keys(validationErrors).length === 0 && Object.keys(errors).length === 0;
    }, [errors, formData, translate]);

    /**
     * Submits the plan through the appropriate create or update endpoint.
     */
    const handleSubmit = useCallback(
        (event: SubmitEvent<HTMLFormElement>) => {
            event.preventDefault();

            if (!validateForm()) {
                return;
            }

            setProcessing(true);

            if (isEdit && plan) {
                const toastId = toast.loading(translate('Updating plan...'));

                router.put(route('subscriptions.plans.update', plan.id), formData, {
                    onSuccess: () => {
                        setErrors({});
                        toast.dismiss(toastId);
                        router.get(route('subscriptions.plans.index'));
                    },
                    onError: (serverErrors) => {
                        setErrors(serverErrors);
                        toast.dismiss(toastId);

                        Object.values(serverErrors).forEach((message) => {
                            toast.error(translate(message));
                        });
                    },
                    onFinish: () => {
                        setProcessing(false);
                    },
                });

                return;
            }

            const toastId = toast.loading(translate('Creating a new plan...'));

            router.post(route('subscriptions.plans.store'), formData, {
                onSuccess: () => {
                    setErrors({});
                    toast.dismiss(toastId);
                    router.get(route('subscriptions.plans.index'));
                },
                onError: (serverErrors) => {
                    setErrors(serverErrors);
                    toast.dismiss(toastId);

                    Object.values(serverErrors).forEach((message) => {
                        toast.error(translate(message));
                    });
                },
                onFinish: () => {
                    setProcessing(false);
                },
            });
        },
        [formData, isEdit, plan, translate, validateForm],
    );

    const handleCancel = useCallback(() => {
        router.get(route('subscriptions.plans.index'));
    }, []);

    return (
        <PageTemplate
            title={translate(isEdit ? 'Edit plan' : 'Create plan')}
            description={translate(isEdit ? 'Update subscription plan details' : 'Add a new subscription plan')}
            url={isEdit ? route('subscriptions.plans.update', plan.id) : route('subscriptions.plans.create')}
            breadcrumbs={[
                {
                    title: translate('Dashboard'),
                    href: route('dashboard.index'),
                },
                {
                    title: translate('Plans'),
                    href: route('subscriptions.plans.index'),
                },
                {
                    title: translate(isEdit ? 'Edit Plan' : 'Create Plan'),
                },
            ]}
        >
            <form id="plan-form" autoComplete="off" noValidate className="space-y-6" onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>{translate('Plan information')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name" required>
                                        {translate('Plan name')}
                                    </Label>

                                    <Input
                                        inputIdentifier="name"
                                        inputType="text"
                                        inputMode="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        onValidate={(valid, message) => handleValidate('name', valid, message)}
                                        required
                                        aria-invalid={Boolean(errors.name)}
                                        aria-describedby={errors.name ? 'name-error' : undefined}
                                    />

                                    {errors.name && (
                                        <p id="name-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="price" required>
                                        {translate('Monthly price')}
                                    </Label>

                                    <Input
                                        inputIdentifier="price"
                                        name="price"
                                        inputType="number"
                                        inputMode="decimal"
                                        min={0}
                                        step="0.01"
                                        value={formData.price}
                                        onChange={handleChange}
                                        onValidate={(valid, message) => handleValidate('price', valid, message)}
                                        required
                                        aria-invalid={Boolean(errors.price)}
                                        aria-describedby={errors.price ? 'price-error' : undefined}
                                    />

                                    {errors.price && (
                                        <p id="price-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
                                            {errors.price}
                                        </p>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="yearly_price">
                                        {translate('Yearly price')} <span className="text-foreground/75 text-sm">({translate('Optional')})</span>
                                    </Label>

                                    <Input
                                        inputIdentifier="yearly_price"
                                        name="yearly_price"
                                        inputType="number"
                                        inputMode="decimal"
                                        min={0}
                                        step="0.01"
                                        value={formData.yearly_price ?? ''}
                                        onChange={handleChange}
                                        onValidate={(valid, message) => handleValidate('yearly_price', valid, message)}
                                        aria-invalid={Boolean(errors.yearly_price)}
                                        aria-describedby={errors.yearly_price ? 'yearly-price-error' : undefined}
                                    />

                                    <p className="text-foreground/75 text-xs">
                                        {translate('If left empty, yearly price will be calculated as 80% of monthly price × 12')}
                                    </p>

                                    {errors.yearly_price && (
                                        <p id="yearly-price-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
                                            {errors.yearly_price}
                                        </p>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="description">{translate('Description')}</Label>

                                    <Textarea id="description" name="description" value={formData.description} onChange={handleChange} />

                                    {errors.description && (
                                        <p id="description-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
                                            {errors.description}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="maximum_users" required>
                                        {translate('Maximum users')}
                                    </Label>

                                    <Input
                                        inputIdentifier="maximum_users"
                                        name="maximum_users"
                                        inputType="number"
                                        inputMode="numeric"
                                        min={1}
                                        step={1}
                                        value={formData.maximum_users}
                                        onChange={handleChange}
                                        onValidate={(valid, message) => handleValidate('maximum_users', valid, message)}
                                        required
                                        aria-invalid={Boolean(errors.maximum_users)}
                                        aria-describedby={errors.maximum_users ? 'maximum-users-error' : undefined}
                                    />

                                    {errors.maximum_users && (
                                        <p id="maximum-users-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
                                            {errors.maximum_users}
                                        </p>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="maximum_staffs" required>
                                        {translate('Maximum staff members')}
                                    </Label>

                                    <Input
                                        inputIdentifier="maximum_staffs"
                                        name="maximum_staffs"
                                        inputType="number"
                                        inputMode="numeric"
                                        min={1}
                                        step={1}
                                        value={formData.maximum_staffs}
                                        onChange={handleChange}
                                        onValidate={(valid, message) => handleValidate('maximum_staffs', valid, message)}
                                        required
                                        aria-invalid={Boolean(errors.maximum_staffs)}
                                        aria-describedby={errors.maximum_staffs ? 'maximum-staffs-error' : undefined}
                                    />

                                    {errors.maximum_staffs && (
                                        <p id="maximum-staffs-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
                                            {errors.maximum_staffs}
                                        </p>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="storage_limit" required>
                                        {translate('Storage limit (GB)')}
                                    </Label>

                                    <Input
                                        inputIdentifier="storage_limit"
                                        name="storage_limit"
                                        inputType="number"
                                        inputMode="decimal"
                                        min={0}
                                        step="0.01"
                                        value={formData.storage_limit}
                                        onChange={handleChange}
                                        onValidate={(valid, message) => handleValidate('storage_limit', valid, message)}
                                        required
                                        aria-invalid={Boolean(errors.storage_limit)}
                                        aria-describedby={errors.storage_limit ? 'storage-limit-error' : undefined}
                                    />

                                    {errors.storage_limit && (
                                        <p id="storage-limit-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
                                            {errors.storage_limit}
                                        </p>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="trial_days">{translate('Trial days')}</Label>

                                    <Input
                                        inputIdentifier="trial_days"
                                        name="trial_days"
                                        inputType="number"
                                        inputMode="numeric"
                                        min={0}
                                        step={1}
                                        value={formData.trial_days}
                                        onChange={handleChange}
                                        onValidate={(valid, message) => handleValidate('trial_days', valid, message)}
                                        aria-invalid={Boolean(errors.trial_days)}
                                        aria-describedby={errors.trial_days ? 'trial-days-error' : undefined}
                                    />

                                    {errors.trial_days && (
                                        <p id="trial-days-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
                                            {errors.trial_days}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 rounded-lg border p-4">
                            <h3 className="font-medium">{translate('Features')}</h3>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="flex items-center justify-between gap-4">
                                    <Label htmlFor="enable_hafinen_intelligence">{translate('Hafinen Intelligence')}</Label>

                                    <Switch
                                        id="enable_hafinen_intelligence"
                                        checked={formData.enable_hafinen_intelligence === 'on'}
                                        onCheckedChange={(checked) => handleSwitchChange('enable_hafinen_intelligence', checked)}
                                    />
                                </div>

                                <div className="flex items-center justify-between gap-4">
                                    <Label htmlFor="is_trial">{translate('Enable trial')}</Label>

                                    <Switch
                                        id="is_trial"
                                        checked={formData.is_trial === 'on'}
                                        onCheckedChange={(checked) => handleSwitchChange('is_trial', checked)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 rounded-lg border p-4">
                            <h3 className="font-medium">{translate('Settings')}</h3>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="flex items-center justify-between gap-4">
                                    <Label htmlFor="is_plan_enabled">{translate('Active')}</Label>

                                    <Switch
                                        id="is_plan_enabled"
                                        checked={formData.is_plan_enabled === 'on'}
                                        onCheckedChange={(checked) => handleSwitchChange('is_plan_enabled', checked)}
                                    />
                                </div>

                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <Label htmlFor="is_default">{translate('Default plan')}</Label>

                                        {(isEdit ? !plan.is_default : hasDefaultPlan) && (
                                            <p className="mt-1 text-xs text-amber-600">
                                                {translate('Setting this as default will remove default status from the current default plan')}
                                            </p>
                                        )}
                                    </div>

                                    <Switch id="is_default" checked={formData.is_default} onCheckedChange={handleDefaultChange} />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                            <Button type="button" size="lg" variant="outline" onClick={handleCancel} className="w-full sm:w-auto">
                                {translate('Cancel')}
                            </Button>

                            <Button type="submit" size="lg" disabled={processing} className="w-full sm:w-auto">
                                {processing ? translate(isEdit ? 'Updating...' : 'Creating...') : translate(isEdit ? 'Update' : 'Create')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </PageTemplate>
    );
}
