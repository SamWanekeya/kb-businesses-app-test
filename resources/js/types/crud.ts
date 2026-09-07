// types/crud.d.ts

/**
 * Core descriptor for a CRUD-backed resource.
 *
 * This is the canonical contract between:
 * - routing
 * - permission gates
 * - table rendering
 * - form generation
 *
 * `name` and `endpoint` must align with backend route conventions.
 * `permissions` should map directly to ability strings returned in `SharedData`.
 */
export interface EntityConfig {
    name: string;
    endpoint: string;
    permissions: {
        view: string;
        create: string;
        edit: string;
        delete: string;
    };
    breadcrumbs?: {
        title: string;
        href?: string;
    }[];
}

/**
 * Declarative table column definition consumed by the generic data table.
 *
 * `type` drives default rendering behavior. Use `render` only when the
 * value cannot be expressed through a built-in type.
 *
 * `href` is evaluated only when `type === 'link'`.
 * When a function is provided, it must be deterministic and side-effect free.
 */
export interface TableColumn {
    key: string;
    label: string;
    sortable?: boolean;
    type?: 'text' | 'badge' | 'image' | 'date' | 'currency' | 'boolean' | 'link' | 'custom';
    className?: string;
    linkClassName?: string;
    href?: string | ((row: any) => string);
    openInNewTab?: boolean;
    render?: (value: any, row?: any) => React.ReactNode | any;
}

/**
 * Row-level action descriptor.
 *
 * Either `action` or `href` should be provided.
 * - `action` is dispatched through the table handler layer.
 * - `href` bypasses action handling and renders as a link.
 *
 * `requiredPermission` is evaluated client-side for visibility only.
 * Backend enforcement is still required.
 */
export interface TableAction {
    label: string;
    icon: string;
    action?: string;
    href?: string | ((row: any) => string | any);
    openInNewTab?: boolean;
    className?: string;
    requiredPermission?: string;
    condition?: (row: any) => boolean;
}

/**
 * Table behavior contract for a resource index view.
 *
 * `statusColors` provides a lightweight mapping layer so status rendering
 * remains declarative and not hardcoded inside cell components.
 */
export interface TableConfig {
    columns: TableColumn[];
    actions: TableAction[];
    statusColors?: Record<string, string>;
}

/**
 * Normalized option shape reused across filters and form selects.
 *
 * Keep this minimal to ensure compatibility with generic select components.
 */
export interface FilterOption {
    value: string;
    label: string;
}

/**
 * Declarative filter definition used to construct query parameters.
 *
 * `key` must match backend query expectations exactly.
 *
 * When `relation` is provided, options are expected to be fetched remotely.
 * Static `options` and `relation` should not be used together.
 */
export interface FilterField {
    key: string;
    label: string;
    type: 'select' | 'date' | 'daterange' | 'text' | 'number' | 'boolean';
    options?: FilterOption[];
    relation?: {
        endpoint: string;
        valueField: string;
        labelField: string;
    };
}

/**
 * File constraint contract shared by upload inputs.
 *
 * This mirrors backend validation rules but does not replace them.
 * Values here are used for client-side pre-validation only.
 */
export interface FileValidation {
    accept?: string;
    maximumSize?: number; // in bytes
    mimeTypes?: string[]; // e.g. ['image/jpeg', 'image/png']
    extensions?: string[]; // e.g. ['.jpg', '.png']
}

/**
 * Declarative field definition used by the generic CRUD form renderer.
 *
 * This structure intentionally supports both simple inputs and
 * highly dynamic fields (relations, dependencies, custom rendering).
 *
 * If `render` is provided, it overrides the default renderer entirely.
 * Use it sparingly to avoid fragmenting form behavior.
 *
 * `conditional` must be pure and depend only on provided arguments.
 * Avoid async logic inside field definitions.
 */
export interface FormField {
    name: string;
    label: string;
    type:
        | 'text'
        | 'email'
        | 'password'
        | 'select'
        | 'textarea'
        | 'radio'
        | 'checkbox'
        | 'switch'
        | 'file'
        | 'date'
        | 'number'
        | 'multi-select'
        | 'media-picker'
        | 'array'
        | 'custom'
        | 'calculated'
        | 'time'
        | 'color';
    placeholder?: string;
    required?: boolean;
    multiple?: boolean; // For media-picker and multi-select fields
    options?: FilterOption[];
    fields?: FormField[]; // For array type fields
    productOptions?: any[]; // For array fields that need product data
    renderFooter?: (arrayValue: any[], field: FormField) => React.ReactNode; // Custom footer renderer for array fields in view mode
    renderSummary?: (arrayValue: any[], field: FormField) => React.ReactNode; // Custom summary renderer for array fields in edit mode
    relation?: {
        endpoint: string;
        valueField: string;
        labelField: string;
    };
    validation?: {
        pattern?: string;
        min?: number;
        max?: number;
        minLength?: number;
        maxLength?: number;
    };
    fileValidation?: FileValidation;
    returnType?: string;
    description?: string;
    colSpan?: number; // Number of columns this field should span (1-12)
    width?: string; // CSS width value (e.g., '50%', '200px')
    row?: number; // Optional row number for grouping fields
    step?: string; // For number inputs
    min?: string; // For number inputs
    defaultValue?: any; // Default value for fields
    render?: (field: FormField, formData: any, onChange: (name: string, value: any) => void) => React.ReactNode;
    conditional?: (mode: string, formData: any) => boolean;
    disabled?: boolean | ((mode: string, formData: any) => boolean); // For disabled fields
    readOnly?: boolean; // For read-only fields
    hidden?: boolean; // For conditionally hidden fields
    onChange?: (value: any) => void; // Callback when field value changes
    calculate?: (item: any) => string; // For calculated fields in array type
}

/**
 * Form container configuration for create/edit flows.
 *
 * `columns` and `layout` affect only presentation.
 * Field behavior must remain independent of layout decisions.
 */
export interface FormConfig {
    fields: FormField[];
    modalSize?: string;
    columns?: number; // Number of columns in the form grid (default: 1)
    layout?: 'grid' | 'flex' | 'default'; // Layout type
    productOptions?: any[]; // For forms that need product data
}

/**
 * Lifecycle hooks for side effects after successful mutations.
 *
 * These are intentionally post-success only.
 * Error handling belongs in the request layer.
 */
export interface CrudHooks {
    afterCreate?: (data: any, response: any) => void;
    afterUpdate?: (data: any, response: any) => void;
    afterDelete?: (id: any) => void;
}

/**
 * Search configuration for keyword-based filtering.
 *
 * `fields` must correspond to backend-searchable attributes.
 * This does not implement search — it only defines the contract.
 */
export interface CrudSearchConfig {
    enabled: boolean;
    placeholder?: string;
    fields: string[];
}

/**
 * Aggregate configuration object that drives an entire CRUD module.
 *
 * This structure is consumed by the generic CRUD page abstraction.
 * Adding properties here affects all resource implementations.
 *
 * Keep this surface area stable and intentional.
 */
export interface CrudConfig {
    entity: EntityConfig;
    table: TableConfig;
    filters: FilterField[];
    form: FormConfig;
    search?: CrudSearchConfig;
    hooks?: CrudHooks;
    modalSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
    description?: string; // Description for accessibility in dialogs
}
