import { toast } from '@components/CustomToast';
import SettingsSection from '@components/SettingsSection';
import { Alert, AlertDescription } from '@components/UserInterface/Alert';
import { Button } from '@components/UserInterface/Button';
import { CardContent } from '@components/UserInterface/Card';
import { Input } from '@components/UserInterface/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/UserInterface/Select';
import { router, usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function EmailSettings() {
    const { t: translate } = useTranslation();
    const { settings = {} } = usePage().props;

    const [emailSettings, setEmailSettings] = useState({
        provider: settings.email_provider || '',
        driver: settings.email_driver || '',
        host: settings.email_host || '',
        port: settings.email_port || '',
        username: settings.email_username || '',
        password: settings.email_password || '',
        encryption: settings.email_encryption || '',
        fromAddress: settings.email_from_address || '',
        fromName: settings.email_from_name || 'Kakbima',
    });

    const [testEmail, setTestEmail] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [testResult, setTestResult] = useState<{
        success: boolean;
        message: string;
    } | null>(null);

    const handleEmailSettingsChange = (field: string, value: string) => {
        setEmailSettings((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const submitEmailSettings = (e: React.FormEvent) => {
        e.preventDefault();

        const toastId = toast.loading(translate('Saving email settings...'));

        router.post(route('settings.email.update'), emailSettings, {
            preserveScroll: true,
            onSuccess: () => {
                toast.dismiss(toastId);
            },
            onError: (errors) => {
                toast.dismiss(toastId);
                Object.values(errors).forEach((message) => toast.error(translate(message)));
            },
        });
    };

    const sendTestEmail = (e: React.FormEvent) => {
        e.preventDefault();

        if (!testEmail) return;

        setIsSending(true);
        setTestResult(null);

        const toastId = toast.loading(translate('Sending...'));

        router.post(
            route('settings.email.test'),
            { email: testEmail },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.dismiss(toastId);
                },
                onError: (errors) => {
                    toast.dismiss(toastId);
                    Object.values(errors).forEach((message) => toast.error(translate(message)));
                },
                onFinish: () => {
                    setIsSending(false);
                },
            },
        );
    };

    return (
        <SettingsSection
            title={translate('Email address')}
            description={translate('Configure email server settings for notifications and communications')}
            action={
                <Button type="submit" form="email-settings-form" size="lg">
                    {translate('Save')}
                </Button>
            }
        >
            <div className="border-border border-t pb-6" />
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
                {/* Email settings */}
                <div className="min-w-0 lg:col-span-2">
                    <form
                        id="email-settings-form"
                        autoComplete="off"
                        onSubmit={submitEmailSettings}
                        className="grid grid-cols-1 gap-5 md:grid-cols-2"
                    >
                        <div className="grid content-start gap-2">
                            <Select
                                value={emailSettings.provider}
                                onValueChange={(value) => {
                                    handleEmailSettingsChange('provider', value);

                                    if (value === 'smtp' || value === 'mailgun' || value === 'ses') {
                                        handleEmailSettingsChange('driver', value);
                                    }
                                }}
                            >
                                <SelectTrigger label={translate('Email provider')}>
                                    <SelectValue placeholder={translate('Select...')} />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="smtp">SMTP</SelectItem>
                                    <SelectItem value="mailgun">Mailgun</SelectItem>
                                    <SelectItem value="ses">Amazon SES</SelectItem>
                                    <SelectItem value="sendmail">Sendmail</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid content-start gap-2">
                            <Input
                                inputIdentifier="driver"
                                label={translate('Mail driver')}
                                value={emailSettings.driver}
                                onChange={(e) => handleEmailSettingsChange('driver', e.target.value)}
                            />
                        </div>

                        <div className="grid content-start gap-2">
                            <Input
                                inputIdentifier="host"
                                label={translate('SMTP host')}
                                value={emailSettings.host}
                                onChange={(e) => handleEmailSettingsChange('host', e.target.value)}
                            />
                        </div>

                        <div className="grid content-start gap-2">
                            <Input
                                inputIdentifier="port"
                                label={translate('SMTP port')}
                                value={emailSettings.port}
                                onChange={(e) => handleEmailSettingsChange('port', e.target.value)}
                            />
                        </div>

                        <div className="grid content-start gap-2">
                            <Input
                                inputIdentifier="username"
                                label={translate('SMTP username')}
                                value={emailSettings.username}
                                onChange={(e) => handleEmailSettingsChange('username', e.target.value)}
                            />
                        </div>

                        <div className="grid content-start gap-2">
                            <Input
                                inputIdentifier="password"
                                label={translate('SMTP password')}
                                inputType="password"
                                value={emailSettings.password}
                                onChange={(e) => handleEmailSettingsChange('password', e.target.value)}
                            />
                        </div>

                        <div className="grid content-start gap-2">
                            <Select value={emailSettings.encryption} onValueChange={(value) => handleEmailSettingsChange('encryption', value)}>
                                <SelectTrigger label={translate('Mail encryption')}>
                                    <SelectValue placeholder={translate('Select...')} />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="tls">TLS</SelectItem>
                                    <SelectItem value="ssl">SSL</SelectItem>
                                    <SelectItem value="none">{translate('None')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid content-start gap-2">
                            <Input
                                inputIdentifier="fromAddress"
                                label={translate('From address')}
                                value={emailSettings.fromAddress}
                                onChange={(e) => handleEmailSettingsChange('fromAddress', e.target.value)}
                            />
                        </div>

                        <div className="grid content-start gap-2 md:col-span-2">
                            <Input
                                inputIdentifier="fromName"
                                label={translate('From name')}
                                value={emailSettings.fromName}
                                onChange={(e) => handleEmailSettingsChange('fromName', e.target.value)}
                            />
                        </div>
                    </form>
                </div>

                {/* Test email */}
                <div className="border-border min-w-0 rounded-lg border">
                    <CardContent className="space-y-4 p-4">
                        <div className="space-y-1">
                            <h3 className="text-foreground text-sm font-semibold">{translate('Test email configuration')}</h3>

                            <p className="text-foreground/75 text-sm">{translate('Send a test message to verify your email configuration.')}</p>
                        </div>

                        <form autoComplete="off" onSubmit={sendTestEmail} className="space-y-4">
                            <div className="grid gap-2">
                                <Input
                                    inputIdentifier="testEmail"
                                    label={translate('Send test to')}
                                    inputType="email"
                                    inputMode="email"
                                    value={testEmail}
                                    onChange={(e) => setTestEmail(e.target.value)}
                                    required
                                />

                                <p className="text-foreground/75 text-xs">{translate('Enter an email address to send a test message')}</p>
                            </div>

                            {testResult && (
                                <Alert variant={testResult.success ? 'success' : 'destructive'}>
                                    <AlertDescription>{testResult.message}</AlertDescription>
                                </Alert>
                            )}

                            <Button type="submit" size="lg" block disabled={isSending || !testEmail}>
                                {isSending ? translate('Sending...') : translate('Send test email')}
                            </Button>
                        </form>
                    </CardContent>
                </div>
            </div>
        </SettingsSection>
    );
}
