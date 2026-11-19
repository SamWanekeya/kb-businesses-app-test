import { toast } from '@components/CustomToast';
import SettingsSection from '@components/SettingsSection';
import { Button } from '@components/UserInterface/Button';
import { Checkbox } from '@components/UserInterface/Checkbox';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/UserInterface/Tabs';
import { router } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { Cloud, HardDrive, Search, Server } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Supported storage backends.
 *
 * Keep these values aligned with the backend's accepted storage_type values.
 */
type StorageType = 'local' | 'aws_s3' | 'wasabi';

/**
 * Storage configuration managed by this settings screen.
 *
 * Credentials are kept as strings to support controlled inputs and empty
 * values returned by the server. The upload limit remains a string while
 * editing so partially entered numeric values are not lost.
 */
interface StorageSettings {
    storage_type: StorageType;
    allowed_file_types: string;
    maximum_upload_size: string;

    aws_access_key_id: string;
    aws_secret_access_key: string;
    aws_default_region: string;
    aws_bucket: string;
    aws_url: string;
    aws_endpoint: string;

    wasabi_access_key: string;
    wasabi_secret_key: string;
    wasabi_region: string;
    wasabi_bucket: string;
    wasabi_url: string;
    wasabi_root: string;
}

interface StorageSettingsProps {
    settings?: Record<string, string>;
}

interface FieldDefinition {
    name: keyof StorageSettings;
    label: string;
    type?: 'text' | 'password';
    placeholder?: string;
    autoComplete?: string;
}

const FILE_EXTENSIONS = [
    '3dmf',
    '3dm',
    'avi',
    'ai',
    'bin',
    'bmp',
    'cab',
    'c',
    'c++',
    'class',
    'css',
    'csv',
    'cdr',
    'doc',
    'dot',
    'docx',
    'dwg',
    'eps',
    'exe',
    'gif',
    'gz',
    'gtar',
    'flv',
    'fh4',
    'fh5',
    'fhc',
    'help',
    'hlp',
    'html',
    'htm',
    'ico',
    'imap',
    'inf',
    'jpe',
    'jpeg',
    'jpg',
    'js',
    'java',
    'latex',
    'log',
    'm3u',
    'midi',
    'mid',
    'mov',
    'mp4',
    'mp3',
    'mpeg',
    'mpg',
    'mp2',
    'ogg',
    'phtml',
    'php',
    'pdf',
    'pgp',
    'png',
    'pps',
    'ppt',
    'ppz',
    'pot',
    'ps',
    'qt',
    'qd3d',
    'qd3',
    'qxd',
    'rar',
    'ra',
    'ram',
    'rm',
    'rtf',
    'spr',
    'sprite',
    'stream',
    'swf',
    'svg',
    'sgml',
    'sgm',
    'tar',
    'tiff',
    'tif',
    'tgz',
    'tex',
    'txt',
    'vob',
    'wav',
    'wrl',
    'xla',
    'xls',
    'xlc',
    'xml',
    'zip',
    'json',
    'webp',
] as const;

const AWS_FIELDS: FieldDefinition[] = [
    {
        name: 'aws_access_key_id',
        label: 'AWS access key ID',
        autoComplete: 'off',
    },
    {
        name: 'aws_secret_access_key',
        label: 'AWS secret access key',
        type: 'password',
        autoComplete: 'new-password',
    },
    {
        name: 'aws_default_region',
        label: 'AWS default region',
        placeholder: 'af-south-1',
    },
    {
        name: 'aws_bucket',
        label: 'AWS bucket',
    },
    {
        name: 'aws_url',
        label: 'AWS URL',
        placeholder: 'https://...',
    },
    {
        name: 'aws_endpoint',
        label: 'AWS endpoint',
        placeholder: 'https://...',
    },
];

const WASABI_FIELDS: FieldDefinition[] = [
    {
        name: 'wasabi_access_key',
        label: 'Wasabi access key',
        autoComplete: 'off',
    },
    {
        name: 'wasabi_secret_key',
        label: 'Wasabi secret key',
        type: 'password',
        autoComplete: 'new-password',
    },
    {
        name: 'wasabi_region',
        label: 'Wasabi region',
        placeholder: 'eu-central-2',
    },
    {
        name: 'wasabi_bucket',
        label: 'Wasabi bucket',
    },
    {
        name: 'wasabi_url',
        label: 'Wasabi URL',
        placeholder: 'https://...',
    },
    {
        name: 'wasabi_root',
        label: 'Wasabi root',
    },
];

/**
 * Creates the initial editable configuration from server-provided settings.
 *
 * Existing defaults are preserved to avoid changing the application's
 * storage behavior when optional settings are missing.
 */
function createInitialSettings(settings: Record<string, string>): StorageSettings {
    const storageType = settings.storage_type;

    return {
        storage_type: storageType === 'aws_s3' || storageType === 'wasabi' ? storageType : 'local',

        allowed_file_types: settings.storage_file_types ?? 'jpg,png,webp,gif',

        maximum_upload_size: settings.storage_maximum_upload_size ?? '2048',

        aws_access_key_id: settings.aws_access_key_id ?? '',
        aws_secret_access_key: settings.aws_secret_access_key ?? '',
        aws_default_region: settings.aws_default_region || 'af-south-1',
        aws_bucket: settings.aws_bucket ?? '',
        aws_url: settings.aws_url ?? '',
        aws_endpoint: settings.aws_endpoint ?? '',

        wasabi_access_key: settings.wasabi_access_key ?? '',
        wasabi_secret_key: settings.wasabi_secret_key ?? '',
        wasabi_region: settings.wasabi_region || 'eu-central-2',
        wasabi_bucket: settings.wasabi_bucket ?? '',
        wasabi_url: settings.wasabi_url ?? '',
        wasabi_root: settings.wasabi_root ?? '',
    };
}

/**
 * StorageSettings
 *
 * Provides a unified configuration interface for local, AWS S3 and Wasabi
 * file storage.
 *
 * Responsibilities:
 * - Manage editable storage configuration.
 * - Configure permitted file extensions and upload limits.
 * - Submit provider-specific settings through Inertia.
 * - Communicate saving and validation feedback.
 *
 * Architecture:
 * - Provider fields are declared as typed metadata.
 * - Shared file restrictions are rendered once for every provider.
 * - Storage credentials are included in the payload only for the active
 *   provider, preserving the existing conditional submission behavior.
 *
 * Accessibility:
 * - Uses labeled inputs, semantic headings and keyboard-accessible tabs.
 * - Search and selection controls have accessible names.
 * - Focus indicators and reduced-motion preferences are respected by
 *   the underlying design system.
 *
 * Performance:
 * - File extensions are defined outside the component.
 * - Filtered extensions and selected values are memoized.
 * - Event handlers are memoized where they are passed between renderers.
 *
 * Extension points:
 * - Add a provider by extending StorageType, StorageSettings and the
 *   provider field definitions, then adding its payload branch.
 */
export default function StorageSettings({ settings = {} }: StorageSettingsProps) {
    const { t: translate } = useTranslation();

    const [storageSettings, setStorageSettings] = useState<StorageSettings>(() => createInitialSettings(settings));

    const [searchTerm, setSearchTerm] = useState('');

    const selectedExtensions = useMemo(
        () =>
            new Set(
                storageSettings.allowed_file_types
                    .split(',')
                    .map((extension) => extension.trim())
                    .filter(Boolean),
            ),
        [storageSettings.allowed_file_types],
    );

    const filteredExtensions = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        if (!query) {
            return FILE_EXTENSIONS;
        }

        return FILE_EXTENSIONS.filter((extension) => extension.toLowerCase().includes(query));
    }, [searchTerm]);

    const handleSettingChange = useCallback((field: keyof StorageSettings, value: string) => {
        setStorageSettings((previous) => ({
            ...previous,
            [field]: value,
        }));
    }, []);

    const handleStorageTypeChange = useCallback((value: string) => {
        if (value !== 'local' && value !== 'aws_s3' && value !== 'wasabi') {
            return;
        }

        setStorageSettings((previous) => ({
            ...previous,
            storage_type: value,
        }));
    }, []);

    const handleFileTypeChange = useCallback((extension: string, checked: boolean) => {
        setStorageSettings((previous) => {
            const currentTypes = new Set(
                previous.allowed_file_types
                    .split(',')
                    .map((type) => type.trim())
                    .filter(Boolean),
            );

            if (checked) {
                currentTypes.add(extension);
            } else {
                currentTypes.delete(extension);
            }

            return {
                ...previous,
                allowed_file_types: [...currentTypes].join(','),
            };
        });
    }, []);

    const handleSelectAll = useCallback(() => {
        setStorageSettings((previous) => ({
            ...previous,
            allowed_file_types: FILE_EXTENSIONS.join(','),
        }));
    }, []);

    const handleUnselectAll = useCallback(() => {
        setStorageSettings((previous) => ({
            ...previous,
            allowed_file_types: '',
        }));
    }, []);

    /**
     * Submits common settings and only the credentials relevant to the
     * currently selected provider.
     *
     * The event type is inferred from the form's onSubmit prop, avoiding
     * an explicit dependency on deprecated React form event aliases.
     */
    const submitStorageSettings = useCallback(() => {
        const formData: Record<string, string> = {
            storage_type: storageSettings.storage_type,
            allowed_file_types: storageSettings.allowed_file_types,
            maximum_upload_size: storageSettings.maximum_upload_size,
        };

        if (storageSettings.storage_type === 'aws_s3') {
            Object.assign(formData, {
                aws_access_key_id: storageSettings.aws_access_key_id,
                aws_secret_access_key: storageSettings.aws_secret_access_key,
                aws_default_region: storageSettings.aws_default_region,
                aws_bucket: storageSettings.aws_bucket,
                aws_url: storageSettings.aws_url,
                aws_endpoint: storageSettings.aws_endpoint,
            });
        }

        if (storageSettings.storage_type === 'wasabi') {
            Object.assign(formData, {
                wasabi_access_key: storageSettings.wasabi_access_key,
                wasabi_secret_key: storageSettings.wasabi_secret_key,
                wasabi_region: storageSettings.wasabi_region,
                wasabi_bucket: storageSettings.wasabi_bucket,
                wasabi_url: storageSettings.wasabi_url,
                wasabi_root: storageSettings.wasabi_root,
            });
        }

        const toastId = toast.loading(translate('Saving storage settings...'));

        router.post(route('settings.storage.update'), formData, {
            preserveScroll: true,

            onSuccess: () => {
                toast.dismiss(toastId);
                toast.dismiss(toastId);
            },

            onError: (errors) => {
                toast.dismiss(toastId);

                Object.values(errors).forEach((message) => {
                    toast.error(translate(message));
                });
            },

            onFinish: () => {
                toast.dismiss(toastId);
            },
        });
    }, [storageSettings, translate]);

    /**
     * Renders a consistent set of labeled provider configuration fields.
     * Metadata controls field labels, input types and autocomplete behavior.
     */
    const renderProviderFields = useCallback(
        (fields: FieldDefinition[]) => (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {fields.map((field) => {
                    const id = field.name;
                    const value = storageSettings[field.name];

                    return (
                        <div key={field.name} className="min-w-0 space-y-2">
                            <Input
                                inputIdentifier={id}
                                label={translate(field.label)}
                                name={id}
                                inputType={field.type ?? 'text'}
                                value={value}
                                placeholder={field.placeholder ? translate(field.placeholder) : undefined}
                                autoComplete={field.autoComplete ?? 'off'}
                                onChange={(event) => handleSettingChange(field.name, event.target.value)}
                            />
                        </div>
                    );
                })}
            </div>
        ),
        [handleSettingChange, storageSettings, translate],
    );

    /**
     * Renders shared file restrictions.
     *
     * Selection actions intentionally apply to the entire supported
     * extension list, not only the currently filtered search results.
     */
    const renderFileTypeSelector = () => (
        <fieldset className="min-w-0 space-y-4">
            <div className="flex flex-col gap-1">
                <legend className="text-sm font-semibold">{translate('Allowed file types')}</legend>

                <p className="text-foreground/75 text-sm">{translate('Choose which file formats users can upload.')}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative min-w-0 flex-1">
                    <Search aria-hidden="true" className="text-foreground/75 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />

                    <Input
                        inputIdentifier="storage-extension-search"
                        type="search"
                        inputType="text"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder={translate('Search file extensions')}
                        label={translate('Search file extensions')}
                        className="pl-9"
                    />
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="lg" onClick={handleSelectAll}>
                        {translate('Select all')}
                    </Button>

                    <Button type="button" variant="outline" size="lg" onClick={handleUnselectAll}>
                        {translate('Unselect all')}
                    </Button>
                </div>
            </div>

            <div
                className="border-border bg-muted/20 max-h-64 overflow-y-auto rounded-lg border p-3 sm:p-4"
                role="group"
                aria-label={translate('Available file extensions')}
            >
                {filteredExtensions.length > 0 ? (
                    <div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
                        {filteredExtensions.map((extension) => (
                            <div
                                key={extension}
                                className="hover:bg-accent/60 flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 transition-colors"
                            >
                                <Checkbox
                                    id={`storage-extension-${extension}`}
                                    checked={selectedExtensions.has(extension)}
                                    onCheckedChange={(checked) => handleFileTypeChange(extension, checked === true)}
                                />

                                <Label htmlFor={`storage-extension-${extension}`} className="cursor-pointer font-mono text-sm font-normal">
                                    {extension}
                                </Label>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-foreground/75 py-6 text-center text-sm" role="status">
                        {translate('No file extensions found.')}
                    </p>
                )}
            </div>

            <div className="text-foreground/75 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span aria-live="polite">
                    {translate('{{count}} file types selected', {
                        count: selectedExtensions.size,
                    })}
                </span>

                <span>
                    {translate('{{count}} supported formats', {
                        count: FILE_EXTENSIONS.length,
                    })}
                </span>
            </div>
        </fieldset>
    );

    /**
     * Renders the shared upload-size field.
     *
     * Native numeric input constraints provide basic client-side feedback;
     * server-side validation remains authoritative.
     */
    const renderMaximumUploadSize = () => (
        <div className="max-w-sm space-y-2">
            <Input
                inputIdentifier="maximum_upload_size"
                label={translate('Maximum upload size (KB)')}
                name="maximum_upload_size"
                inputType="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={storageSettings.maximum_upload_size}
                onChange={(event) => handleSettingChange('maximum_upload_size', event.target.value)}
                aria-describedby="maximum-upload-size-help"
            />

            <p id="maximum-upload-size-help" className="text-foreground/75 text-xs leading-relaxed">
                {translate('Set the maximum permitted size for an individual upload.')}
            </p>
        </div>
    );

    return (
        <SettingsSection
            title={translate('Storage')}
            description={translate('Configure file storage, upload restrictions and provider credentials.')}
            action={
                <Button type="submit" form="storage-settings-form" size="lg">
                    {translate('Save')}
                </Button>
            }
        >
            <form
                id="storage-settings-form"
                autoComplete="off"
                onSubmit={(event) => {
                    event.preventDefault();
                    submitStorageSettings();
                }}
                className="space-y-6"
            >
                <div className="border-border border-t" />
                <Tabs value={storageSettings.storage_type} onValueChange={handleStorageTypeChange} className="w-full">
                    <TabsList
                        aria-label={translate('Storage provider')}
                        className="bg-muted/60 grid h-auto w-full grid-cols-1 gap-1 p-1 sm:grid-cols-3"
                    >
                        <TabsTrigger value="local" className="flex min-h-11 items-center justify-center gap-2 px-3 py-2">
                            <HardDrive aria-hidden="true" className="size-4 shrink-0" />
                            <span>{translate('Local storage')}</span>
                        </TabsTrigger>

                        <TabsTrigger value="aws_s3" className="flex min-h-11 items-center justify-center gap-2 px-3 py-2">
                            <Cloud aria-hidden="true" className="size-4 shrink-0" />
                            <span>{translate('AWS S3')}</span>
                        </TabsTrigger>

                        <TabsTrigger value="wasabi" className="flex min-h-11 items-center justify-center gap-2 px-3 py-2">
                            <Server aria-hidden="true" className="size-4 shrink-0" />
                            <span>{translate('Wasabi')}</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="local" className="mt-6 space-y-6 focus-visible:outline-none">
                        <section aria-labelledby="local-storage-heading" className="space-y-5">
                            {renderFileTypeSelector()}
                            {renderMaximumUploadSize()}
                        </section>
                    </TabsContent>

                    <TabsContent value="aws_s3" className="mt-6 space-y-6 focus-visible:outline-none">
                        <section aria-labelledby="aws-storage-heading" className="space-y-6">
                            <div className="space-y-1">
                                <h3 id="aws-storage-heading" className="text-base font-semibold tracking-tight">
                                    {translate('AWS S3 storage')}
                                </h3>

                                <p className="text-foreground/75 text-sm">
                                    {translate('Configure your AWS bucket, region and connection credentials.')}
                                </p>
                            </div>

                            {renderProviderFields(AWS_FIELDS)}

                            <div className="border-border border-t" />

                            {renderFileTypeSelector()}
                            {renderMaximumUploadSize()}
                        </section>
                    </TabsContent>

                    <TabsContent value="wasabi" className="mt-6 space-y-6 focus-visible:outline-none">
                        <section aria-labelledby="wasabi-storage-heading" className="space-y-6">
                            <div className="space-y-1">
                                <h3 id="wasabi-storage-heading" className="text-base font-semibold tracking-tight">
                                    {translate('Wasabi storage')}
                                </h3>

                                <p className="text-foreground/75 text-sm">
                                    {translate('Configure your Wasabi bucket, region and connection credentials.')}
                                </p>
                            </div>

                            {renderProviderFields(WASABI_FIELDS)}

                            <div className="border-border border-t" />

                            {renderFileTypeSelector()}
                            {renderMaximumUploadSize()}
                        </section>
                    </TabsContent>
                </Tabs>
            </form>
        </SettingsSection>
    );
}
