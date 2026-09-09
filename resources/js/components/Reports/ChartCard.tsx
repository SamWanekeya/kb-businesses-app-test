import { Card } from '@components/UserInterface/card';
import { ReactNode } from 'react';

interface ChartCardProps {
    title: string;
    children: ReactNode;
    actions?: ReactNode;
    className?: string;
}

export function ChartCard({ title, children, actions, className = '' }: ChartCardProps) {
    return (
        <Card className={`p-6 ${className}`}>
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">{title}</h3>
                {actions && <div className="flex gap-2">{actions}</div>}
            </div>
            {children}
        </Card>
    );
}
