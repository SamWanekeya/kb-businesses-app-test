import { Alert, AlertDescription } from '@components/UserInterface/alert';
import { usePage } from '@inertiajs/react';
import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function DemoModeBanner() {
    const { t: translate } = useTranslation();
    const { props } = usePage();
    const isDemo = (props as any).globalSettings?.is_demo;

    if (!isDemo) return null;

    return (
        <Alert className="mb-4 border-blue-200 bg-blue-50 text-blue-800">
            <Info className="h-4 w-4" />
            <AlertDescription>
                <strong>{translate('Demo Mode')}</strong> - {translate('You can create new data but cannot modify or delete existing demo data.')}
            </AlertDescription>
        </Alert>
    );
}
