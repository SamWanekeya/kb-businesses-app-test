import { ReactNode } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/UserInterface/Card';

interface SettingsSectionProps {
    title: string;
    description?: string;
    children?: ReactNode;
    action?: ReactNode;
}

export default function SettingsSection({ title, description, children, action }: SettingsSectionProps) {
    return (
        <Card className="mb-6">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-medium">{title}</CardTitle>
                        {description && <CardDescription className="mt-1.5">{description}</CardDescription>}
                    </div>
                    {action && <div>{action}</div>}
                </div>
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}
