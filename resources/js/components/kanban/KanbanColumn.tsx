import { Droppable } from '@hello-pangea/dnd';
import { User } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { KanbanCard } from './KanbanCard';

interface Lead {
    id: number;
    name: string;
    email: string;
    phone: string;
    organization: string;
    value: string;
    lead_status_id: number;
    lead_status: {
        id: number;
        name: string;
        color: string;
    };
    lead_source: {
        id: number;
        name: string;
    };
    assigned_user: {
        id: number;
        name: string;
    };
    created_at: string;
}

interface LeadStatus {
    id: number;
    name: string;
    color: string;
}

interface KanbanColumnProps {
    status: LeadStatus;
    leads: Lead[];
    onLeadAction: (action: string, lead: Lead) => void;
    permissions: string[];
    isLoading: boolean;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ status, leads, onLeadAction, permissions, isLoading }) => {
    const { t } = useTranslation();

    return (
        <div className="flex-shrink-0" style={{ minWidth: 'calc(20% - 16px)', width: 'calc(20% - 16px)' }}>
            <div className="flex h-full flex-col rounded-lg bg-gray-100">
                {/* Column Header */}
                <div className="border-b border-gray-200 p-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: status.color }} />
                            <h3 className="text-sm font-semibold text-gray-700">{status.name}</h3>
                        </div>
                        <span className="rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-500">{leads.length}</span>
                    </div>
                </div>

                {/* Column Content */}
                <Droppable droppableId={status.id.toString()}>
                    {(provided, snapshot) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="column-scroll flex-1 space-y-2 overflow-y-auto p-2"
                            style={{ maxHeight: 'calc(100vh - 350px)' }}
                        >
                            {leads.map((lead, index) => (
                                <KanbanCard
                                    key={lead.id}
                                    lead={lead}
                                    index={index}
                                    onLeadAction={onLeadAction}
                                    permissions={permissions}
                                    isLoading={isLoading}
                                />
                            ))}
                            {provided.placeholder}

                            {leads.length === 0 && (
                                <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                                        <User className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <p className="mb-1 text-sm font-medium">{t('No leads here')}</p>
                                    <p className="text-xs opacity-75">{t('Drag leads here to update status')}</p>
                                </div>
                            )}
                        </div>
                    )}
                </Droppable>
            </div>
        </div>
    );
};
