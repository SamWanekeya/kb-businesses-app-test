import { toast } from '@components/CustomToast';
import SettingsSection from '@components/SettingsSection';
import { Button } from '@components/UserInterface/Button';
import { Card, CardContent } from '@components/UserInterface/Card';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/UserInterface/Select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@components/UserInterface/Tooltip';
import { router, usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { AlertCircle, Lock, Mail, Send } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function EmailSettings() {
    const { t: translate } = useTranslation();
    const { settings = {} } = usePage().props;

    // Email Settings form state
    const [emailSettings, setEmailSettings] = useState({
        provider: settings.email_provider || 'smtp',
        driver: settings.email_driver || 'smtp',
        host: settings.email_host || 'smtp.kakbima.dev',
        port: settings.email_port || '587',
        username: settings.email_username || 'user@kakbima.dev',
        password: settings.email_password ? '••••••••••••' : '',
        encryption: settings.email_encryption || 'tls',
        fromAddress: settings.email_from_address || 'noreply@kakbima.dev',
        fromName: settings.email_from_name || 'Kakbima System',
    });

    // Test email state
    const [testEmail, setTestEmail] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [processing, setProcessing] = useState(false);

    // Handle email settings form changes
    const handleEmailSettingsChange = (field: string, value: string) => {
        setEmailSettings((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // Handle email settings form submission
    const submitEmailSettings = (e: React.FormEvent) => {
        e.preventDefault();

        const toastId = toast.loading(translate('Saving email settings...'));
        setProcessing(true);

        router.post(route('settings.email.update'), emailSettings, {
            preserveScroll: true,
            onSuccess: () => {
                setProcessing(false);
                toast.dismiss(toastId);
            },
            onError: (errors) => {
                setProcessing(false);
                toast.dismiss(toastId);
                Object.values(errors).forEach((message) => toast.error(translate(message)));
            },
        });
    };

    // Handle test email submission
    const sendTestEmail = (e: React.FormEvent) => {
        e.preventDefault();
        if (!testEmail) return;

        setIsSending(true);
        setTestResult(null);
        const toastId = toast.loading(translate('Sending test email...'));

        router.post(
            route('settings.email.test'),
            { email: testEmail },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSending(false);
                    toast.dismiss(toastId);
                },
                onError: (errors) => {
                    toast.dismiss(toastId);
                    Object.values(errors).forEach((message) => toast.error(translate(message)));
                },
            },
        );
    };

    return (
        <SettingsSection
            title={translate('Email Settings')}
            description={translate('Configure email server settings for system notifications and communications')}
            action={
                <Button type="submit" disabled={processing} form="email-settings-form" size="sm" className="max-[1300px]:px-2.5">
                    <span className="max-[1300px]:hidden">{processing ? translate('Saving...') : translate('Save changes')}</span>
                </Button>
            }
        >
            <div className="grid grid-cols-1 gap-6 min-[1600px]:grid-cols-3">
                {/* Main Email Settings */}
                <div className="min-[1600px]:col-span-2">
                    <form id="email-settings-form" onSubmit={submitEmailSettings}>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <Mail className="text-foreground/75 h-4 w-4" />
                                            <Label htmlFor="provider" className="font-medium">
                                                {translate('Email Provider')}
                                            </Label>
                                        </div>
                                        <Select
                                            value={emailSettings.provider}
                                            onValueChange={(value) => {
                                                handleEmailSettingsChange('provider', value);
                                                // Set default values based on provider
                                                if (value === 'smtp') {
                                                    handleEmailSettingsChange('driver', 'smtp');
                                                } else if (value === 'mailgun') {
                                                    handleEmailSettingsChange('driver', 'mailgun');
                                                } else if (value === 'ses') {
                                                    handleEmailSettingsChange('driver', 'ses');
                                                }
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="smtp">SMTP</SelectItem>
                                                <SelectItem value="mailgun">Mailgun</SelectItem>
                                                <SelectItem value="ses">Amazon SES</SelectItem>
                                                <SelectItem value="sendmail">Sendmail</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Input
                                            inputIdentifier="driver"
                                            label={translate('Mail driver')}
                                            required
                                            value={emailSettings.driver}
                                            onChange={(e) => {
                                                handleEmailSettingsChange('driver', e.target.value);
                                            }}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Input
                                            inputIdentifier="host"
                                            label={translate('SMTP host')}
                                            required
                                            value={emailSettings.host}
                                            onChange={(e) => {
                                                handleEmailSettingsChange('host', e.target.value);
                                            }}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <AlertCircle className="text-foreground/75 h-4 w-4" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{translate('Common ports: 25, 465, 587, 2525')}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                        <Input
                                            inputIdentifier="port"
                                            label={translate('SMTP port')}
                                            required
                                            value={emailSettings.port}
                                            onChange={(e) => {
                                                handleEmailSettingsChange('port', e.target.value);
                                            }}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Input
                                            inputIdentifier="username"
                                            label={translate('SMTP username')}
                                            required
                                            value={emailSettings.username}
                                            onChange={(e) => {
                                                handleEmailSettingsChange('username', e.target.value);
                                            }}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Input
                                            inputIdentifier="password"
                                            label={translate('SMTP password')}
                                            inputType="password"
                                            value={emailSettings.password}
                                            onChange={(e) => {
                                                handleEmailSettingsChange('password', e.target.value);
                                            }}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <Lock className="text-foreground/75 h-4 w-4" />
                                            <Label htmlFor="encryption" className="font-medium">
                                                {translate('Mail Encryption')}
                                            </Label>
                                        </div>
                                        <Select
                                            value={emailSettings.encryption}
                                            onValueChange={(value) => {
                                                handleEmailSettingsChange('encryption', value);
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="tls">TLS</SelectItem>
                                                <SelectItem value="ssl">SSL</SelectItem>
                                                <SelectItem value="none">None</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Input
                                            inputIdentifier="fromAddress"
                                            label={translate('From address')}
                                            required
                                            value={emailSettings.fromAddress}
                                            onChange={(e) => {
                                                handleEmailSettingsChange('fromAddress', e.target.value);
                                            }}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Input
                                            inputIdentifier="fromName"
                                            label={translate('From name')}
                                            required
                                            value={emailSettings.fromName}
                                            onChange={(e) => {
                                                handleEmailSettingsChange('fromName', e.target.value);
                                            }}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </form>
                </div>

                {/* Test Email Section */}
                <div className="min-[1600px]:col-span-1">
                    <Card>
                        <CardContent className="pt-6">
                            <form autoComplete="off" onSubmit={sendTestEmail} className="space-y-4">
                                <div className="mb-4 flex items-center gap-2">
                                    <Send className="text-primary h-4 w-4" />
                                    <h3 className="text-base font-medium">{translate('Test Email Configuration')}</h3>
                                </div>

                                <div className="space-y-1.5">
                                    <Input
                                        inputIdentifier="testEmail"
                                        label={translate('Send test email to')}
                                        inputType="email"
                                        inputMode="email"
                                        value={testEmail}
                                        onChange={(e) => {
                                            setTestEmail(e.target.value);
                                        }}
                                        required
                                    />
                                    <p className="text-foreground/75 text-xs">{translate('Enter an email address to send a test message')}</p>
                                </div>

                                <Button type="submit" className="w-full" disabled={isSending || !testEmail}>
                                    {isSending ? (
                                        <>
                                            <span className="mr-2 animate-spin">◌</span>
                                            {translate('Sending...')}
                                        </>
                                    ) : (
                                        <>
                                            <Send className="mr-2 h-4 w-4" />
                                            {translate('Send Test Email')}
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </SettingsSection>
    );
}
