import { toast } from '@/components/CustomToast';
import { PageTemplate } from '@/components/page-template';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Head, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { route } from '@/utils/Routes';
import { useTranslation } from 'react-i18next';

interface NotificationTemplate {
    id: number;
    name: string;
    notification_template_langs: Array<{
        id: number;
        lang: string;
        title: string;
        content: string;
    }>;
}

interface Props {
    template: NotificationTemplate;
    languages: Record<string, string>;
    variables: Record<string, string>;
}

export default function NotificationTemplateShow({ template, languages, variables }: Props) {
    const { t: translate } = useTranslation();
    const { flash } = usePage().props;
    const [currentLang, setCurrentLang] = useState(Object.keys(languages)[0] || 'en');
    const [templateLangs, setTemplateLangs] = useState(
        template.notification_template_langs.reduce(
            (acc, lang) => {
                acc[lang.lang] = {
                    title: lang.title,
                    content: lang.content,
                };
                return acc;
            },
            {} as Record<string, { title: string; content: string }>,
        ),
    );

    const handleTitleChange = (lang: string, title: string) => {
        setTemplateLangs((prev) => ({
            ...prev,
            [lang]: { ...prev[lang], title },
        }));
    };

    const handleContentChange = (lang: string, content: string) => {
        setTemplateLangs((prev) => ({
            ...prev,
            [lang]: { ...prev[lang], content },
        }));
    };

    // Handle flash messages
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Notification Templates'), href: route('notification-templates.index') },
        { title: template.name },
    ];

    return (
        <PageTemplate
            title={template.name}
            description={translate('Notification template details and related information')}
            url={route('notification-templates.show', template.id)}
            breadcrumbs={breadcrumbs}
            actions={[
                {
                    label: translate('Back'),
                    icon: <ArrowLeft className="mr-2 h-4 w-4" />,
                    variant: 'outline',
                    onClick: () => router.visit(route('notification-templates.index')),
                },
            ]}
        >
            <Head title={`${template.name} - Notification Templates`} />

            <div className="grid w-full min-w-0 gap-6 lg:grid-cols-3">
                <div className="w-full min-w-0 space-y-6 lg:col-span-2">
                    <Card className="w-full min-w-0">
                        <CardHeader className="p-4 sm:p-6">
                            <div className="flex items-center justify-between">
                                <CardTitle>{translate('Template Settings')}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 p-4 pt-0 sm:p-6">
                            <div className="grid gap-2">
                                <Label>{translate('Template Name')}</Label>
                                <Input value={template.name} placeholder={translate('Enter template name')} disabled />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="w-full min-w-0">
                        <CardHeader className="p-4 sm:p-6">
                            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                <div>
                                    <CardTitle>{translate('Notification Content')}</CardTitle>
                                    <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                                        {translate('Customize notification content for different languages')}
                                    </p>
                                </div>
                                <Button
                                    onClick={() => {
                                        const currentContent = templateLangs[currentLang];
                                        if (currentContent) {
                                            router.put(route('notification-templates.update-content', template.id), {
                                                lang: currentLang,
                                                title: currentContent.title,
                                                content: currentContent.content,
                                            });
                                        }
                                    }}
                                    size="sm"
                                    className="w-full shrink-0 sm:w-auto"
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    {translate('Save Content')}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 sm:p-6">
                            <Tabs defaultValue={Object.keys(languages)[0]} onValueChange={setCurrentLang} className="w-full">
                                <div className="mb-4">
                                    <div className="overflow-x-auto">
                                        <TabsList className="inline-flex h-auto w-max p-1">
                                            {Object.entries(languages).map(([code, name]) => (
                                                <TabsTrigger
                                                    key={code}
                                                    value={code}
                                                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground cursor-pointer px-3 py-2 text-xs whitespace-nowrap"
                                                >
                                                    {code.toUpperCase()}
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>
                                    </div>
                                </div>

                                {Object.entries(languages).map(([code, name]) => (
                                    <TabsContent key={code} value={code} className="mt-6 space-y-6">
                                        <div className="bg-muted/50 flex items-center gap-3 rounded-lg p-3">
                                            <Badge variant="default" className="px-3 py-1">
                                                {code.toUpperCase()}
                                            </Badge>
                                            <div>
                                                <span className="font-medium">{name}</span>
                                                <p className="text-muted-foreground text-xs">
                                                    {translate('Edit notification content for this language')}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="grid gap-3">
                                                <Label htmlFor={`title-${code}`} className="text-sm font-medium" required>
                                                    {translate('Notification Title')}
                                                </Label>
                                                <Input
                                                    id={`title-${code}`}
                                                    value={templateLangs[code]?.title || ''}
                                                    onChange={(e) => handleTitleChange(code, e.target.value)}
                                                    placeholder={translate(
                                                        'Enter notification title (you can use variables like {organization_name})',
                                                    )}
                                                    className="focus:ring-primary focus:ring-2"
                                                />
                                            </div>

                                            <div className="space-y-3">
                                                <Label htmlFor={`content-${code}`} className="text-sm font-medium" required>
                                                    {translate('Notification Content')}
                                                </Label>
                                                <Textarea
                                                    id={`content-${code}`}
                                                    value={templateLangs[code]?.content || ''}
                                                    onChange={(e) => handleContentChange(code, e.target.value)}
                                                    placeholder={translate('Write your notification content here. You can use variables...')}
                                                    className="focus:ring-primary min-h-[200px] focus:ring-2"
                                                    rows={8}
                                                />
                                                <p className="text-muted-foreground text-xs">
                                                    💡 {translate('Tip: Use the variables from the sidebar to personalize your notifications')}
                                                </p>
                                            </div>
                                        </div>
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>

                <div className="w-full min-w-0">
                    <Card className="w-full min-w-0">
                        <CardHeader className="p-4 sm:p-6">
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <span>{translate('Available Variables')}</span>
                                <Badge variant="secondary" className="text-xs">
                                    {Object.keys(variables).length}
                                </Badge>
                            </CardTitle>
                            <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                                {translate('Click to copy variables to use in your notification content')}
                            </p>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 sm:p-6">
                            <div className="space-y-3">
                                {Object.entries(variables).map(([variable, description]) => (
                                    <div
                                        key={variable}
                                        className="group bg-muted/50 hover:bg-muted/80 cursor-pointer rounded-lg border p-3 transition-colors"
                                        onClick={() => {
                                            navigator.clipboard.writeText(variable);
                                            toast.success(translate('Variable copied to clipboard'));
                                        }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <code className="text-primary bg-background rounded px-1.5 py-0.5 font-mono text-sm font-medium">
                                                {variable}
                                            </code>
                                            <div className="opacity-0 transition-opacity group-hover:opacity-100">
                                                <Badge variant="outline" className="text-xs">
                                                    {translate('Click to copy')}
                                                </Badge>
                                            </div>
                                        </div>
                                        <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{description}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                                <p className="text-xs text-blue-700">
                                    💡 <strong>{translate('Tip')}:</strong>{' '}
                                    {translate('These variables will be automatically replaced with actual values when notifications are sent.')}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageTemplate>
    );
}
