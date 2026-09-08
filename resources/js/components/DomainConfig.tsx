import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import React from 'react';

import { route } from '@/utils/Routes';
import { useTranslation } from 'react-i18next';

interface DomainConfigProps {
    data: {
        slug: string;
        custom_domain?: string;
        url_prefix?: string;
        password?: string;
        password_enabled?: boolean;
        domain_type?: 'slug' | 'subdomain' | 'domain';
    };
    onUpdate: (field: string, value: any) => void;
    slugStatus?: { available: boolean; checking: boolean };
    onSlugChange?: (slug: string) => void;
    onPrefixChange?: (prefix: string) => void;
    businessId?: number;
    canUseCustomDomain?: boolean;
    canUseSubdomain?: boolean;
}

export default function DomainConfig({
    data,
    onUpdate,
    slugStatus,
    onSlugChange,
    onPrefixChange,
    businessId,
    canUseCustomDomain = true,
    canUseSubdomain = true,
}: DomainConfigProps) {
    const { t: translate } = useTranslation();
    const [domainType, setDomainType] = React.useState(data.domain_type || 'slug');
    const [domainStatus, setDomainStatus] = React.useState({ available: true, checking: false });

    React.useEffect(() => {
        const newDomainType = data.domain_type || 'slug';
        // Reset to slug if user doesn't have access to selected domain type
        if ((newDomainType === 'domain' && !canUseCustomDomain) || (newDomainType === 'subdomain' && !canUseSubdomain)) {
            setDomainType('slug');
            onUpdate('domain_type', 'slug');
        } else {
            setDomainType(newDomainType);
        }
    }, [data.domain_type, canUseCustomDomain, canUseSubdomain]);

    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    const checkDomainAvailability = React.useCallback(
        debounce(async (domain) => {
            if (!domain || domain.length < 3) {
                setDomainStatus({ available: true, checking: false });
                return;
            }

            setDomainStatus({ available: true, checking: true });

            try {
                const response = await fetch(route('api.check-domain'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                    body: JSON.stringify({ domain, business_id: businessId }),
                });

                const result = await response.json();
                setDomainStatus({ available: result.available, checking: false });
            } catch (error) {
                setDomainStatus({ available: true, checking: false });
            }
        }, 500),
        [],
    );

    React.useEffect(() => {
        if (domainType === 'domain' && data.custom_domain) {
            checkDomainAvailability(data.custom_domain);
        }
    }, [data.custom_domain, domainType, checkDomainAvailability]);

    const getPreviewUrl = () => {
        switch (domainType) {
            case 'domain':
                return data.custom_domain ? `https://${data.custom_domain}` : 'https://yourdomain.com';
            case 'subdomain':
                return data.slug ? `https://${data.slug}.${window.location.hostname}` : `https://your-slug.${window.location.hostname}`;
            case 'slug':
            default:
                return data.url_prefix
                    ? `${window.location.origin}/${data.url_prefix}/${data.slug || 'your-slug'}`
                    : `${window.location.origin}/${data.slug || 'your-slug'}`;
        }
    };

    return (
        <Card>
            <div className="border-b p-3">
                <h3 className="text-base font-medium">
                    <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-xs dark:bg-gray-700">
                        2
                    </span>
                    {translate('Domain & URL Settings')}
                </h3>
            </div>
            <div className="space-y-3 p-3">
                {/* Domain Type Selection */}
                <div>
                    <Label className="mb-1 block text-sm">{translate('URL Type')}</Label>
                    <div className="flex space-x-3">
                        <div className="flex items-center">
                            <input
                                type="radio"
                                id="slug"
                                name="domain_type"
                                value="slug"
                                checked={domainType === 'slug'}
                                onChange={() => {
                                    setDomainType('slug');
                                    onUpdate('domain_type', 'slug');
                                }}
                                className="h-3 w-3 text-blue-600"
                            />
                            <Label htmlFor="slug" className="ml-1 cursor-pointer text-sm">
                                {translate('Slug')}
                            </Label>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="radio"
                                id="subdomain"
                                name="domain_type"
                                value="subdomain"
                                checked={domainType === 'subdomain'}
                                disabled={!canUseSubdomain}
                                onChange={() => {
                                    setDomainType('subdomain');
                                    onUpdate('domain_type', 'subdomain');
                                }}
                                className="h-3 w-3 text-blue-600 disabled:opacity-50"
                            />
                            <Label htmlFor="subdomain" className={`ml-1 cursor-pointer text-sm ${!canUseSubdomain ? 'opacity-50' : ''}`}>
                                {translate('Subdomain')}
                                {!canUseSubdomain && <span className="ml-1 text-xs text-amber-600">({translate('Plan upgrade required')})</span>}
                            </Label>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="radio"
                                id="domain"
                                name="domain_type"
                                value="domain"
                                checked={domainType === 'domain'}
                                disabled={!canUseCustomDomain}
                                onChange={() => {
                                    setDomainType('domain');
                                    onUpdate('domain_type', 'domain');
                                }}
                                className="h-3 w-3 text-blue-600 disabled:opacity-50"
                            />
                            <Label htmlFor="domain" className={`ml-1 cursor-pointer text-sm ${!canUseCustomDomain ? 'opacity-50' : ''}`}>
                                {translate('Domain')}
                                {!canUseCustomDomain && <span className="ml-1 text-xs text-amber-600">({translate('Plan upgrade required')})</span>}
                            </Label>
                        </div>
                    </div>
                </div>

                {/* Configuration Fields */}
                <div className="space-y-3">
                    {domainType === 'domain' && (
                        <div>
                            <Label className="mb-1 block text-sm">{translate('Custom Domain')}</Label>
                            <Input
                                value={data.custom_domain || ''}
                                onChange={(e) => {
                                    onUpdate('custom_domain', e.target.value);
                                    checkDomainAvailability(e.target.value);
                                }}
                                placeholder="yourdomain.com"
                                className={`h-9 text-sm ${domainStatus && !domainStatus.available ? 'border-red-500' : ''}`}
                            />
                            {domainStatus && (
                                <div className="mt-1 flex items-center">
                                    {domainStatus.checking && <span className="text-xs text-gray-500">{translate('Checking...')}</span>}
                                    {!domainStatus.checking && !domainStatus.available && (
                                        <span className="text-xs text-red-500">{translate('Not available')}</span>
                                    )}
                                    {!domainStatus.checking && domainStatus.available && data.custom_domain && (
                                        <span className="text-xs text-green-500">{translate('Available')}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {domainType === 'slug' && (
                        <div>
                            <Label className="mb-1 block text-sm">{translate('URL Prefix')}</Label>
                            <Input
                                value={data.url_prefix || ''}
                                onChange={(e) => {
                                    onUpdate('url_prefix', e.target.value);
                                    if (onPrefixChange) onPrefixChange(e.target.value);
                                }}
                                placeholder="v"
                                className="h-9 text-sm"
                            />
                        </div>
                    )}

                    {(domainType === 'slug' || domainType === 'subdomain') && (
                        <div>
                            <Label className="mb-1 block text-sm">{translate('Slug')}</Label>
                            <Input
                                value={data.slug || ''}
                                onChange={(e) => (onSlugChange ? onSlugChange(e.target.value) : onUpdate('slug', e.target.value))}
                                placeholder="your-organization-name"
                                className={`h-9 text-sm ${slugStatus && !slugStatus.available ? 'border-red-500' : ''}`}
                            />
                            {slugStatus && (
                                <div className="mt-1 flex items-center">
                                    {slugStatus.checking && <span className="text-xs text-gray-500">{translate('Checking...')}</span>}
                                    {!slugStatus.checking && !slugStatus.available && (
                                        <span className="text-xs text-red-500">{translate('Not available')}</span>
                                    )}
                                    {!slugStatus.checking && slugStatus.available && data.slug && (
                                        <span className="text-xs text-green-500">{translate('Available')}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Password Protection */}
                <div className="border-t pt-3">
                    <div className="mb-2 flex items-center justify-between">
                        <Label className="text-sm">{translate('Password Protection')}</Label>
                        <Switch
                            checked={data.password_enabled || false}
                            onCheckedChange={(checked) => onUpdate('password_enabled', checked)}
                            className="scale-75"
                        />
                    </div>

                    {data.password_enabled && (
                        <div>
                            <Label className="mb-1 block text-sm">{translate('Password')}</Label>
                            <Input
                                type="password"
                                value={data.password || ''}
                                onChange={(e) => onUpdate('password', e.target.value)}
                                placeholder={translate('Enter password')}
                                className="h-9 text-sm"
                                minLength={4}
                            />
                        </div>
                    )}
                </div>

                {/* Preview URL */}
                <div>
                    <div className="mb-1 flex items-center justify-between">
                        <Label className="text-sm">{translate('Public URL')}</Label>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-sm"
                            onClick={() => {
                                navigator.clipboard.writeText(getPreviewUrl());
                            }}
                        >
                            {translate('Copy')}
                        </Button>
                    </div>
                    <div className="rounded border bg-gray-50 p-2 text-sm dark:bg-gray-800">
                        <p className="font-mono break-all text-blue-600 dark:text-blue-400">
                            {getPreviewUrl()}
                            {data.password_enabled && <span className="ml-1 text-orange-500">🔒</span>}
                        </p>
                    </div>
                </div>
            </div>
        </Card>
    );
}
