// types/index.d.ts
import { Page } from '@inertiajs/core';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

/**
 * Navigation node used by sidebar, header menus, and nested dropdowns.
 *
 * Design goals:
 * - Supports both flat and deeply nested navigation trees.
 * - Allows non-clickable grouping nodes (no `href`).
 * - Enables early client-side permission filtering (non-authoritative).
 *
 * Important:
 * - Server-side authorization MUST still be enforced.
 * - When `external = true`, `target` should typically be `_blank`
 *   to prevent Inertia interception.
 *
 * `icon` supports:
 * - Lucide component references (preferred for consistency)
 * - Pre-rendered React nodes (fallback for custom icons)
 */
export interface NavItem {
    title: string;
    href?: string;
    icon?: ReactNode | LucideIcon;
    requiredPermission?: string;
    children?: NavItem[];
    target?: '_blank' | '_self' | '_parent' | '_top';
    external?: boolean;
    defaultOpen?: boolean;
    badge?: {
        label: string;
        variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
    };
}

/**
 * Global page props injected via Laravel `HandleInertiaRequests`.
 *
 * This represents the **minimum guaranteed contract** available
 * across all Inertia responses.
 *
 * Notes (Inertia v3):
 * - Props may be **partially reloaded**, so fields must be treated as optional.
 * - Do NOT assume presence unless enforced server-side.
 *
 * `permissions`:
 * - Flattened list of ability strings for fast UI checks.
 * - May be omitted on partial reloads → always null-safe in usage.
 */
export interface SharedData {
    auth?: {
        user?: {
            id: number;
            name: string;
            email: string;
            type?: string;
            role?: string;
            lang?: string;
            email_verified_at: string;
            avatar: string;
        } | null;
        permissions?: string[];
    };
    organizations: Organization[];
    filters: Filters;

    /**
     * Extendable index signature for additional shared props.
     *
     * This prevents TypeScript friction when backend adds new
     * shared values (e.g., flash messages, settings, feature flags).
     */
    [key: string]: unknown;
}

/**
 * Normalized breadcrumb item consumed by layout-level components.
 *
 * `href` is optional to allow the final segment to be non-clickable.
 */
export interface BreadcrumbItemTypes {
    title: string;
    href?: string;
}

/**
 * Utility type for safely extending page-specific props.
 *
 * Usage:
 * type MyPageProps = PageProps<{
 *   organizations: Organization[];
 *   filters: Filters;
 * }>;
 */
export type PageProps<T extends Record<string, unknown> = {}> = SharedData & T;

declare module '@inertiajs/react' {
    /**
     * Typed wrapper for Inertia's `usePage`.
     *
     * Key behavior:
     * - Defaults to `SharedData`
     * - Supports extension via generics for page-level props
     *
     * Example:
     * const { props } = usePage<PageProps<{ organizations: Org[] }>>();
     *
     * v3 Note:
     * - Always treat props as **partially available**
     * - Prefer optional chaining + nullish coalescing
     */
    function usePage<T extends Record<string, unknown> = {}>(): Page<PageProps<T>>;
}

export interface TableColumn {
    label: string;
    key: string;
    isImage?: boolean;
    isAction?: boolean;
    className?: string;
    type?: string;
    sortable?: boolean;
    sortKey?: string;
}

export interface ActionConfig {
    label: string;
    icon: keyof typeof LucidIcons;
    action: string;
    className: string;
    permission?: string;
}

export interface TableConfig {
    columns: TableColumn[];
    actions: ActionConfig[];
    statusColors?: Record<string, string>;
}

export interface FormField {
    name: string;
    label: string;
    type: 'text' | 'email' | 'password' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'file';
    placeholder?: string;
    required?: boolean;
    validation?: string;
    options?: { value: string; label: string }[];
}

export interface FormConfig {
    fields: FormField[];
}

export interface BreadcrumbItem {
    title: string;
    href?: string;
}

export interface PageAction {
    label: string;
    icon: React.ReactNode;
    variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    onClick: () => void;
}
