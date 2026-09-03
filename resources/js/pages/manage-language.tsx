import { toast } from '@/components/custom-toast';
import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { hasRole } from '@/utils/authorization';
import { router, usePage } from '@inertiajs/react';
import { Lock, Power, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import ReactCountryFlag from 'react-country-flag';
import { useTranslation } from 'react-i18next';

interface Language {
    code: string;
    name: string;
    countryCode?: string;
    enabled?: boolean;
}

interface PageProps {
    languages: Language[];
    defaultLang: string;
    defaultData: Record<string, string>;
    availableLanguages: Array<{
        code: string;
        name: string;
        countryCode: string;
        flag: string;
        enabled?: boolean;
    }>;
    isCurrentLanguageEnabled: boolean;
    auth?: {
        user?: {
            roles?: Array<{ name: string }>;
        };
    };
    [key: string]: any; // Fix for Inertia PageProps constraint
}

export default function ManageLanguagePage() {
    const { t } = useTranslation();
    const { languages, defaultLang, defaultData, availableLanguages, isCurrentLanguageEnabled, auth } = usePage<PageProps>().props;

    // Initialize selectedLang from props
    const [selectedLang, setSelectedLang] = useState(defaultLang);
    const [labels, setLabels] = useState<{ [key: string]: string }>(defaultData);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isToggling, setIsToggling] = useState(false);

    const userRoles = auth?.user?.roles || [];
    const isSuperAdmin = hasRole('super_admin', userRoles);

    // Update selectedLang when defaultLang changes (from Inertia navigation)
    useEffect(() => {
        setSelectedLang(defaultLang);
    }, [defaultLang]);

    // Load language data from backend when component mounts or language changes
    useEffect(() => {
        // If defaultData is already available for the current language, use it
        if (selectedLang === defaultLang && Object.keys(defaultData).length > 0) {
            setLabels(defaultData);
            return;
        }

        setLoading(true);
        fetch(`${route('language.load')}?lang=${selectedLang}`)
            .then((res) => res.json())
            .then((res) => {
                if (res.data) {
                    setLabels(res.data);
                } else {
                    setLabels({});
                }
                setLoading(false);
            })
            .catch(() => {
                setLabels({});
                setLoading(false);
                toast.error(t('Failed to load language file'));
            });
    }, [selectedLang, defaultLang, defaultData, t]);

    const handleLabelChange = (key: string, value: string) => {
        setLabels((prev) => ({ ...prev, [key]: value }));
    };

    // Save language data to backend
    const handleSave = (e: React.FormEvent) => {
        // Prevent default form submission behavior
        if (e) e.preventDefault();

        setSaving(true);

        // Use fetch instead of Inertia to prevent page refresh
        fetch(route('language.save'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest', // Add this to ensure Laravel detects AJAX request
            },
            body: JSON.stringify({
                _method: 'PATCH', // Laravel method spoofing for PATCH
                lang: selectedLang,
                data: labels,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    toast.success(data.success || t('Language updated successfully'));
                } else if (data.error) {
                    toast.error(data.error);
                } else {
                    toast.error(t(data.message));
                }
                setSaving(false);
            })
            .catch((error) => {
                toast.error(t('Failed to update language file'));
                setSaving(false);
            });

        // Return false to prevent any form submission
        return false;
    };

    // Handle delete language
    const handleDeleteLanguage = async () => {
        try {
            const response = await fetch(route('languages.delete', selectedLang), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    Accept: 'application/json',
                },
            });

            if (response.ok) {
                toast.success('Language deleted successfully');
                setShowDeleteConfirm(false);
                // Redirect to English after deletion
                router.get(route('manage-language', { lang: 'en' }));
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to delete language');
            }
        } catch (error) {
            toast.error('Failed to delete language');
        }
    };

    // Handle toggle language status
    const handleToggleLanguage = async () => {
        setIsToggling(true);
        try {
            const response = await fetch(route('languages.toggle', selectedLang), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    Accept: 'application/json',
                },
            });

            if (response.ok) {
                toast.success('Language status updated successfully');
                // Redirect to English after disabling current language
                router.get(route('manage-language', { lang: 'en' }));
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to update language status');
            }
        } catch (error) {
            toast.error('Failed to update language status');
        } finally {
            setIsToggling(false);
        }
    };

    return (
        <PageTemplate
            title={t('Manage Language')}
            url="/manage-language"
            actions={[
                ...(selectedLang !== 'en' && isSuperAdmin
                    ? [
                          {
                              label: isToggling ? t('Updating...') : isCurrentLanguageEnabled ? t('Disable Language') : t('Enable Language'),
                              icon: isToggling ? (
                                  <RefreshCw className="mr-0 h-4 w-4 animate-spin lg:mr-2" />
                              ) : (
                                  <Power className="mr-0 h-4 w-4 lg:mr-2" />
                              ),
                              variant: 'outline' as const,
                              onClick: handleToggleLanguage,
                              className: 'h-8 w-8 lg:h-9 lg:w-auto px-0 lg:px-4',
                              labelClassName: 'hidden lg:inline',
                              tooltip: isCurrentLanguageEnabled ? t('Disable Language') : t('Enable Language'),
                              tooltipClassName: 'lg:hidden',
                          },
                          {
                              label: t('Delete Language'),
                              icon: <Trash2 className="mr-0 h-4 w-4 lg:mr-2" />,
                              variant: 'destructive' as const,
                              onClick: () => setShowDeleteConfirm(true),
                              className: 'h-8 w-8 lg:h-9 lg:w-auto px-0 lg:px-4',
                              labelClassName: 'hidden lg:inline',
                              tooltip: t('Delete Language'),
                              tooltipClassName: 'lg:hidden',
                          },
                      ]
                    : []),
            ]}
        >
            <style>{`
            main {
            max-width: 100vw;
            overflow-x: clip !important;
            }
            body {
            overflow-x: clip !important;
            }
        `}</style>
            <div className="flex w-full flex-col gap-8 lg:flex-row">
                {/* Mobile Language Selector (Select Dropdown) */}
                <div className="block w-full lg:hidden">
                    <div className="bg-card text-card-foreground rounded-lg border p-4 shadow-sm">
                        <label className="mb-2 block text-sm font-medium">{t('Select Language')}</label>
                        <Select
                            value={selectedLang}
                            onValueChange={(value) => {
                                if (selectedLang !== value) {
                                    router.get(route('manage-language', { lang: value }));
                                }
                            }}
                        >
                            <SelectTrigger className="bg-background border-input w-full">
                                <SelectValue placeholder={t('Select Language')} />
                            </SelectTrigger>
                            <SelectContent>
                                {availableLanguages.map((lang) => {
                                    const isEnabled = lang.enabled === true || (lang.enabled === undefined && !lang.hasOwnProperty('enabled'));
                                    return (
                                        <SelectItem
                                            key={lang.code}
                                            value={lang.code}
                                            disabled={!isEnabled}
                                            className={cn('flex items-center gap-2', !isEnabled && 'opacity-50')}
                                        >
                                            <div className="flex items-center gap-2">
                                                {lang.countryCode && (
                                                    <ReactCountryFlag
                                                        countryCode={lang.countryCode}
                                                        svg
                                                        style={{ width: '1.2em', height: '1.2em' }}
                                                    />
                                                )}
                                                <span>{lang.name}</span>
                                                {!isEnabled && <span className="text-muted-foreground ml-1 text-xs">({t('Disabled')})</span>}
                                            </div>
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Sidebar: Language List (Desktop Only) */}
                <div className="hidden h-fit w-64 flex-shrink-0 lg:sticky lg:top-20 lg:block">
                    <div className="bg-card text-card-foreground rounded-lg border p-3 shadow-sm">
                        <div className="h-auto scrollbar-thin overflow-y-auto pr-1 lg:h-[calc(100vh-12rem)]">
                            <div className="flex flex-col gap-2">
                                {availableLanguages.map((lang) => {
                                    const isEnabled = lang.enabled === true || (lang.enabled === undefined && !lang.hasOwnProperty('enabled'));
                                    return (
                                        <Button
                                            key={lang.code}
                                            variant="ghost"
                                            className={cn(
                                                'text-card-foreground hover:bg-muted w-full justify-start gap-3 rounded-lg text-sm font-normal hover:font-normal',
                                                {
                                                    'bg-muted text-card-foreground font-medium': selectedLang === lang.code,
                                                    'text-muted-foreground': !isEnabled,
                                                },
                                            )}
                                            onClick={() => {
                                                if (selectedLang !== lang.code) {
                                                    // Navigate to the language page using Inertia
                                                    router.get(route('manage-language', { lang: lang.code }));
                                                }
                                            }}
                                        >
                                            {lang.countryCode && (
                                                <ReactCountryFlag countryCode={lang.countryCode} svg style={{ width: '1.2em', height: '1.2em' }} />
                                            )}
                                            <span className={!isEnabled ? 'text-muted-foreground' : ''}>{lang.name}</span>
                                            {!isEnabled && <Lock className="text-muted-foreground ms-auto h-3 w-3" />}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
                {/* Main Content: Language Labels */}
                <div className="w-full min-w-0 flex-1">
                    <Card className="border-border border p-4 shadow-sm sm:p-6">
                        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="text-lg font-semibold tracking-tight">
                                {t('Edit Labels for')} {languages.find((l) => l.code === selectedLang)?.name}
                            </h2>
                            <Input
                                placeholder={t('Search labels...')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full sm:w-72"
                            />
                        </div>
                        {loading ? (
                            <div className="text-muted-foreground flex justify-center py-8 text-sm">{t('Loading...')}</div>
                        ) : (
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSave(e);
                                    return false;
                                }}
                            >
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {Object.entries(labels)
                                            .filter(
                                                ([key, value]) =>
                                                    key.toLowerCase().includes(search.toLowerCase()) ||
                                                    value.toLowerCase().includes(search.toLowerCase()),
                                            )
                                            .map(([key, value]) => (
                                                <div key={key} className="flex min-w-0 flex-col gap-1.5">
                                                    <label
                                                        className="text-muted-foreground/80 mb-0.5 block text-xs font-medium break-all select-all"
                                                        title={key}
                                                    >
                                                        {key}
                                                    </label>
                                                    <Input
                                                        className="h-9 w-full"
                                                        value={value}
                                                        onChange={(e) => handleLabelChange(key, e.target.value)}
                                                    />
                                                </div>
                                            ))}
                                    </div>
                                    <div className="flex justify-end border-t pt-6">
                                        <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                                            {saving ? (
                                                <span className="flex items-center gap-2">
                                                    <span className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></span>
                                                    {t('Saving...')}
                                                </span>
                                            ) : (
                                                t('Save Changes')
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </Card>
                </div>
            </div>

            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('Delete Language')}</DialogTitle>
                    </DialogHeader>
                    <p>
                        {t('Are you sure you want to delete the')} <strong>{selectedLang}</strong>{' '}
                        {t('language? This will remove all translation files and cannot be undone.')}.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                            {t('Cancel')}
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteLanguage}>
                            {t('Delete Language')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PageTemplate>
    );
}
