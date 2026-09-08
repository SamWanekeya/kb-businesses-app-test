import { toast } from '@/components/CustomToast';
import { PageTemplate } from '@/components/page-template';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextField } from '@/components/ui/rich-text-field';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Head, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { route } from '@/utils/Routes';
import { useTranslation } from 'react-i18next';

interface EmailTemplateLang {
    id: number;
    lang: string;
    subject: string;
    content: string;
}

interface EmailTemplate {
    id: number;
    name: string;
    from: string;
    email_template_langs: EmailTemplateLang[];
}

interface Language {
    code: string;
    name: string;
    countryCode: string;
}

interface Props {
    template: EmailTemplate;
    languages: Language[];
    variables: Record<string, string>;
}

export default function EmailTemplateShow({ template, languages, variables }: Props) {
    const { t: translate } = useTranslation();
    const { flash } = usePage().props;
    const [fromName, setFromName] = useState(template.from);
    const [currentLang, setCurrentLang] = useState(languages[0]?.code || 'en');
    const [templateLangs, setTemplateLangs] = useState(
        template.email_template_langs.reduce(
            (acc, lang) => {
                acc[lang.lang] = {
                    subject: lang.subject,
                    content: lang.content,
                };
                return acc;
            },
            {} as Record<string, { subject: string; content: string }>,
        ),
    );

    const handleSubjectChange = (lang: string, subject: string) => {
        setTemplateLangs((prev) => ({
            ...prev,
            [lang]: { ...prev[lang], subject },
        }));
    };

    const handleContentChange = (lang: string, content: string) => {
        setTemplateLangs((prev) => ({
            ...prev,
            [lang]: { ...prev[lang], content },
        }));
    };

    const handleSave = () => {
        toast.info(translate('Save functionality will be implemented later'));
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
        { title: translate('Email Templates'), href: route('email-templates.index') },
        { title: template.name },
    ];

    return (
        <PageTemplate
            title={template.name}
            url={route('email-templates.show', template.id)}
            breadcrumbs={breadcrumbs}
            actions={[
                {
                    label: translate('Back'),
                    icon: <ArrowLeft className="h-4 w-4 ltr:mr-2 rtl:ml-2 rtl:rotate-180" />,
                    variant: 'outline',
                    labelClassName: 'max-[400px]:hidden',
                    onClick: () => router.visit(route('email-templates.index')),
                },
            ]}
        >
            <Head title={`Edit Template - ${template.name}`} />

            <div className="grid w-full min-w-0 gap-6 lg:grid-cols-3">
                <div className="w-full min-w-0 space-y-6 lg:col-span-2">
                    <Card className="w-full min-w-0">
                        <CardHeader className="p-4 sm:p-6">
                            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                <CardTitle className="text-base sm:text-lg">{translate('Template Settings')}</CardTitle>
                                <Button
                                    onClick={() => {
                                        router.put(route('email-templates.update-settings', template.id), {
                                            from: fromName,
                                        });
                                    }}
                                    size="sm"
                                    className="w-full sm:w-auto"
                                >
                                    <Save className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                                    {translate('Save Changes')}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 p-4 pt-0 sm:p-6">
                            <div className="grid gap-2">
                                <Label>{translate('Template Name')}</Label>
                                <Input value={template.name} disabled className="bg-muted" />
                                <p className="text-muted-foreground text-xs">{translate('Template name cannot be changed')}</p>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="from" required>
                                    {translate('From Name')}
                                </Label>
                                <Input
                                    id="from"
                                    value={fromName}
                                    onChange={(e) => setFromName(e.target.value)}
                                    placeholder={translate('Enter from name (e.g., {app_name}, Support Team)')}
                                    className="focus:ring-primary focus:ring-2"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="w-full min-w-0">
                        <CardHeader className="p-4 sm:p-6">
                            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                <div>
                                    <CardTitle className="text-base sm:text-lg">{translate('Email Content')}</CardTitle>
                                    <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                                        {translate('Customize email content for different languages')}
                                    </p>
                                </div>
                                <Button
                                    onClick={() => {
                                        const currentContent = templateLangs[currentLang];
                                        if (currentContent) {
                                            router.put(route('email-templates.update-content', template.id), {
                                                lang: currentLang,
                                                subject: currentContent.subject,
                                                content: currentContent.content,
                                            });
                                        }
                                    }}
                                    size="sm"
                                    className="w-full shrink-0 sm:w-auto"
                                >
                                    <Save className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                                    {translate('Save Content')}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 sm:p-6">
                            <Tabs defaultValue={languages[0]?.code} onValueChange={setCurrentLang} className="w-full min-w-0">
                                <div className="mb-4">
                                    <div className="overflow-x-auto">
                                        <TabsList className="inline-flex h-auto w-max p-1">
                                            {languages.map((language) => (
                                                <TabsTrigger
                                                    key={language.code}
                                                    value={language.code}
                                                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground cursor-pointer px-3 py-2 text-xs whitespace-nowrap"
                                                >
                                                    {language.code.toUpperCase()}
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>
                                    </div>
                                </div>

                                {languages.map((language) => (
                                    <TabsContent key={language.code} value={language.code} className="mt-6 space-y-6">
                                        <div className="bg-muted/50 flex items-center gap-3 rounded-lg p-3">
                                            <Badge variant="default" className="px-3 py-1">
                                                {language.code.toUpperCase()}
                                            </Badge>
                                            <div>
                                                <span className="font-medium">{language.name}</span>
                                                <p className="text-muted-foreground text-xs">{translate('Edit email content for this language')}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="grid gap-3">
                                                <Label htmlFor={`subject-${language.code}`} className="text-sm font-medium" required>
                                                    {translate('Email Subject')}
                                                </Label>
                                                <Input
                                                    id={`subject-${language.code}`}
                                                    value={templateLangs[language.code]?.subject || ''}
                                                    onChange={(e) => handleSubjectChange(language.code, e.target.value)}
                                                    placeholder={translate('Enter email subject (you can use variables like {app_name})')}
                                                    className="focus:ring-primary focus:ring-2"
                                                />
                                            </div>

                                            <div className="space-y-3">
                                                <RichTextField
                                                    label="Email Content"
                                                    value={templateLangs[language.code]?.content || ''}
                                                    onChange={(content) => handleContentChange(language.code, content)}
                                                    placeholder={translate(
                                                        'Write your email content here. You can use HTML formatting and variables...',
                                                    )}
                                                    className="min-h-[300px]"
                                                />
                                                <p className="text-muted-foreground text-xs">
                                                    💡 {translate('Tip: Use the variables from the sidebar to personalize your emails')}
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
                                {translate('Click to copy variables to use in your email content')}
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
                                        }}
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <code className="text-primary bg-background rounded px-1.5 py-0.5 font-mono text-xs font-medium break-all sm:text-sm">
                                                {variable}
                                            </code>
                                            <div className="opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
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
                                    {translate('These variables will be automatically replaced with actual values when emails are sent.')}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageTemplate>
    );
}
