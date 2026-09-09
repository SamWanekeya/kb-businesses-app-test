import { Card, CardContent } from '@components/UserInterface/card';
import { ReactNode } from 'react';

interface SummaryCardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
    iconColor: string; // Used for icon color if iconCls is not provided
    blobCls?: string;
    iconCls?: string;
    valueColor?: string;
}

interface SummaryCardsProps {
    cards: SummaryCardProps[];
}

export function SummaryCard({ title, value, icon, iconColor, blobCls, iconCls, valueColor = 'text-foreground' }: SummaryCardProps) {
    // If blobCls isn't provided, use iconColor as a fallback for the background blob
    const actualBlobCls = blobCls || iconColor;

    return (
        <Card className="relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50">
            <div className={`absolute top-0 right-0 h-20 w-20 ${actualBlobCls} rounded-bl-full opacity-70`} />
            <CardContent className="relative p-4 min-[1450px]:p-6">
                <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1 pr-2">
                        <p className="text-muted-foreground mb-1 text-sm font-medium" title={title}>
                            {title}
                        </p>
                        <p
                            className={`font-mono text-2xl font-bold tracking-tight min-[1450px]:text-3xl ${valueColor} truncate`}
                            title={String(value)}
                        >
                            {value}
                        </p>
                    </div>
                    <div className={`relative z-10 p-2.5 ${actualBlobCls} mt-0.5 flex-shrink-0 rounded-xl shadow-sm`}>
                        {iconCls ? <div className={iconCls}>{icon}</div> : <div className="text-current [&>svg]:h-5 [&>svg]:w-5">{icon}</div>}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function SummaryCards({ cards }: SummaryCardsProps) {
    return (
        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card, index) => (
                <SummaryCard key={index} {...card} />
            ))}
        </div>
    );
}
