import { toast } from '@components/CustomToast';
import { SettingsSection } from '@components/settings-section';
import { Button } from '@components/UserInterface/Button';
import { Card, CardContent } from '@components/UserInterface/Card';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/UserInterface/Select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@components/UserInterface/Tooltip';
import { router, usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { AlertCircle, Lock, Mail, Save, Send, Server, User } from 'lucide-react';
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

        toast.loading(translate('Saving email settings...'));
        setProcessing(true);

        router.post(route('settings.email.update'), emailSettings, {
            preserveScroll: true,
            onSuccess: (page) => {
                setProcessing(false);
                toast.dismiss();
                const successMessage = page.props.flash?.success;
                const errorMessage = page.props.flash?.error;

                if (successMessage) {
                    toast.success(successMessage);
                } else if (errorMessage) {
                    toast.error(errorMessage);
                } else {
                    toast.success(translate('Email settings saved successfully'));
                }
            },
            onError: (errors) => {
                setProcessing(false);
                toast.dismiss();
                const errorMessage = errors.error || Object.values(errors).join(', ') || translate('Failed to save email settings');
                toast.error(errorMessage);
            },
        });
    };

    // Handle test email submission
    const sendTestEmail = (e: React.FormEvent) => {
        e.preventDefault();
        if (!testEmail) return;

        setIsSending(true);
        setTestResult(null);
        toast.loading(translate('Sending test email...'));

        router.post(
            route('settings.email.test'),
            { email: testEmail },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    setIsSending(false);
                    toast.dismiss();
                    const successMessage = page.props.flash?.success;
                    const errorMessage = page.props.flash?.error;

                    if (successMessage) {
                        toast.success(successMessage);
                        setTestResult({ success: true, message: successMessage });
                    } else if (errorMessage) {
                        toast.error(errorMessage);
                        setTestResult({ success: false, message: errorMessage });
                    } else {
                        const message = translate('Test email sent successfully to {{email}}', { email: testEmail });
                        toast.success(message);
                        setTestResult({ success: true, message });
                    }

                    // Reset result after 5 seconds
                    setTimeout(() => {
                        setTestResult(null);
                    }, 5000);
                },
                onError: (errors) => {
                    setIsSending(false);
                    toast.dismiss();
                    const errorMessage = errors.error || Object.values(errors).join(', ') || translate('Failed to send test email');
                    toast.error(errorMessage);
                    setTestResult({ success: false, message: errorMessage });

                    // Reset result after 5 seconds
                    setTimeout(() => {
                        setTestResult(null);
                    }, 5000);
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
                    <Save className="mr-2 h-4 w-4 max-[1300px]:mr-0" />
                    <span className="max-[1300px]:hidden">{processing ? translate('Saving...') : translate('Save Changes')}</span>
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
                                            <Mail className="text-muted-foreground h-4 w-4" />
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
                                                <SelectValue placeholder="Select provider" />
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
                                        <div className="flex items-center gap-2">
                                            <Server className="text-muted-foreground h-4 w-4" />
                                            <Label htmlFor="driver" className="font-medium" required>
                                                {translate('Mail Driver')}
                                            </Label>
                                        </div>
                                        <Input
                                            id="driver"
                                            value={emailSettings.driver}
                                            onChange={(e) => handleEmailSettingsChange('driver', e.target.value)}
                                            placeholder="smtp"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <Server className="text-muted-foreground h-4 w-4" />
                                            <Label htmlFor="host" className="font-medium" required>
                                                {translate('SMTP Host')}
                                            </Label>
                                        </div>
                                        <Input
                                            id="host"
                                            value={emailSettings.host}
                                            onChange={(e) => handleEmailSettingsChange('host', e.target.value)}
                                            placeholder="smtp.kakbima.dev"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <Server className="text-muted-foreground h-4 w-4" />
                                            <Label htmlFor="port" className="font-medium" required>
                                                {translate('SMTP Port')}
                                            </Label>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <AlertCircle className="text-muted-foreground h-4 w-4" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{translate('Common ports: 25, 465, 587, 2525')}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                        <Input
                                            id="port"
                                            value={emailSettings.port}
                                            onChange={(e) => handleEmailSettingsChange('port', e.target.value)}
                                            placeholder="587"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <User className="text-muted-foreground h-4 w-4" />
                                            <Label htmlFor="username" className="font-medium" required>
                                                {translate('SMTP Username')}
                                            </Label>
                                        </div>
                                        <Input
                                            id="username"
                                            value={emailSettings.username}
                                            onChange={(e) => handleEmailSettingsChange('username', e.target.value)}
                                            placeholder="user@kakbima.dev"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <Lock className="text-muted-foreground h-4 w-4" />
                                            <Label htmlFor="password" className="font-medium">
                                                {translate('SMTP Password')}
                                            </Label>
                                        </div>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={emailSettings.password}
                                            onChange={(e) => handleEmailSettingsChange('password', e.target.value)}
                                            placeholder="••••••••••••"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <Lock className="text-muted-foreground h-4 w-4" />
                                            <Label htmlFor="encryption" className="font-medium">
                                                {translate('Mail Encryption')}
                                            </Label>
                                        </div>
                                        <Select
                                            value={emailSettings.encryption}
                                            onValueChange={(value) => handleEmailSettingsChange('encryption', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select encryption" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="tls">TLS</SelectItem>
                                                <SelectItem value="ssl">SSL</SelectItem>
                                                <SelectItem value="none">None</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <Mail className="text-muted-foreground h-4 w-4" />
                                            <Label htmlFor="fromAddress" className="font-medium" required>
                                                {translate('From Address')}
                                            </Label>
                                        </div>
                                        <Input
                                            id="fromAddress"
                                            value={emailSettings.fromAddress}
                                            onChange={(e) => handleEmailSettingsChange('fromAddress', e.target.value)}
                                            placeholder="noreply@kakbima.dev"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <User className="text-muted-foreground h-4 w-4" />
                                            <Label htmlFor="fromName" className="font-medium" required>
                                                {translate('From Name')}
                                            </Label>
                                        </div>
                                        <Input
                                            id="fromName"
                                            value={emailSettings.fromName}
                                            onChange={(e) => handleEmailSettingsChange('fromName', e.target.value)}
                                            placeholder="System"
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
                            <form onSubmit={sendTestEmail} className="space-y-4">
                                <div className="mb-4 flex items-center gap-2">
                                    <Send className="text-primary h-4 w-4" />
                                    <h3 className="text-base font-medium">{translate('Test Email Configuration')}</h3>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="testEmail" className="font-medium">
                                        {translate('Send Test To')}
                                    </Label>
                                    <Input
                                        id="testEmail"
                                        type="email"
                                        value={testEmail}
                                        onChange={(e) => setTestEmail(e.target.value)}
                                        placeholder="test@kakbima.dev"
                                        required
                                    />
                                    <p className="text-muted-foreground text-xs">{translate('Enter an email address to send a test message')}</p>
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
