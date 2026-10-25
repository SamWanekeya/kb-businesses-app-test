/** Status values supported by the payment gateway filter. */
export type PaymentStatusFilter = 'all' | 'enabled' | 'disabled';

/** Serialized values received from the Laravel settings payload. */
export type PaymentSettingsInput = Record<string, unknown>;

/** Metadata used to filter gateways without constructing form keys dynamically. */
export interface PaymentMethodDefinition<EnabledField extends string = string> {
    key: string;
    name: string;
    enabledField: EnabledField;
}
