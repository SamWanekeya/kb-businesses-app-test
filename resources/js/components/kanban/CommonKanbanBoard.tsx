import { toast } from '@/components/CustomToast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useInitials } from '@/hooks/use-initials';
import { useHasPermission } from '@/utils/Permissions';
import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd';
import { router } from '@inertiajs/react';
import { Building2, Edit, Eye, MoreHorizontal, Trash2, User, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { route } from '@/utils/Routes';
import { useTranslation } from 'react-i18next';

interface KanbanItem {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    organization?: string;
    value?: string;
    amount?: string;
    close_date?: string;
    lead_status_id?: number;
    opportunity_stage_id?: number;
    lead_status?: { id: number; name: string; color: string };
    opportunity_stage?: { id: number; name: string; color: string };
    lead_source?: { id: number; name: string };
    opportunity_source?: { id: number; name: string };
    account?: { id: number; name: string };
    assigned_user?: { id: number; name: string };
    created_at: string;
    is_converted?: boolean;
}

interface KanbanStatus {
    id: number;
    name: string;
    color: string;
}

interface KanbanData {
    [key: string]: {
        status: KanbanStatus;
        leads: KanbanItem[];
    };
}

interface CommonKanbanBoardProps {
    initialData: KanbanData;
    statuses: KanbanStatus[];
    onItemAction: (action: string, item: KanbanItem) => void;
    permissions: string[];
    searchTerm?: string;
    onDataUpdate?: (data: KanbanData) => void;
    type: 'lead' | 'opportunity';
}

export const CommonKanbanBoard: React.FC<CommonKanbanBoardProps> = ({
    initialData,
    statuses,
    onItemAction,
    permissions,
    searchTerm = '',
    onDataUpdate,
    type,
}) => {
    const { t: translate } = useTranslation();
    const getInitials = useInitials();
    const [kanbanData, setKanbanData] = useState<KanbanData>(initialData);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Keep optimistic update
    }, [initialData]);

    const filteredKanbanData = React.useMemo(() => {
        if (!searchTerm) return kanbanData;

        const filtered: KanbanData = {};
        Object.keys(kanbanData).forEach((statusId) => {
            const column = kanbanData[statusId];
            const filteredItems = column.leads.filter(
                (item) =>
                    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.organization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.account?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
            );

            filtered[statusId] = {
                ...column,
                leads: filteredItems,
            };
        });

        return filtered;
    }, [kanbanData, searchTerm]);

    const handleDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
            return;
        }

        const sourceColumn = kanbanData[source.droppableId];
        const destColumn = kanbanData[destination.droppableId];
        const draggedItem = sourceColumn.leads.find((item) => item.id.toString() === draggableId);

        if (!draggedItem) return;

        const newKanbanData = { ...kanbanData };

        newKanbanData[source.droppableId] = {
            ...sourceColumn,
            leads: sourceColumn.leads.filter((item) => item.id.toString() !== draggableId),
        };

        const statusField = type === 'lead' ? 'lead_status_id' : 'opportunity_stage_id';
        const statusObj = type === 'lead' ? 'lead_status' : 'opportunity_stage';

        const updatedItem = {
            ...draggedItem,
            [statusField]: parseInt(destination.droppableId),
            [statusObj]: destColumn.status,
        };

        const destLeads = [...destColumn.leads];
        destLeads.splice(destination.index, 0, updatedItem);

        newKanbanData[destination.droppableId] = {
            ...destColumn,
            leads: destLeads,
        };

        setKanbanData(newKanbanData);

        try {
            setIsLoading(true);
            const endpoint = type === 'lead' ? 'leads.update-status' : 'opportunities.update-status';
            const payload =
                type === 'lead' ? { lead_status_id: parseInt(destination.droppableId) } : { opportunity_stage_id: parseInt(destination.droppableId) };

            router.put(route(endpoint, draggedItem.id), payload, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(t(`${type} status updated successfully`));
                    if (onDataUpdate) {
                        onDataUpdate(newKanbanData);
                    }
                },
                onError: (errors) => {
                    toast.error(typeof errors === 'string' ? errors : t(`Failed to update ${type} status`));
                },
                onFinish: () => {
                    setIsLoading(false);
                },
            });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t(`Failed to update ${type} status`));
            setIsLoading(false);
        }
    };

    const renderItemActions = (item: KanbanItem) => {
        const viewPermission = type === 'lead' ? 'view-leads' : 'view-opportunities';
        const editPermission = type === 'lead' ? 'edit-leads' : 'edit-opportunities';
        const deletePermission = type === 'lead' ? 'delete-leads' : 'delete-opportunities';

        return (
            <DropdownMenuContent align="end" className="z-50 w-48" sideOffset={5}>
                {useHasPermission(viewPermission) && (
                    <DropdownMenuItem onClick={() => onItemAction('view', item)}>
                        <Eye className="mr-2 h-4 w-4" />
                        <span>{translate(`View ${type}`)}</span>
                    </DropdownMenuItem>
                )}
                {useHasPermission(editPermission) && (
                    <DropdownMenuItem onClick={() => onItemAction('edit', item)}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>{translate('Edit')}</span>
                    </DropdownMenuItem>
                )}
                {type === 'lead' && useHasPermission('convert-leads') && !item.is_converted && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onItemAction('convert-to-account', item)} className="text-green-600">
                            <Building2 className="mr-2 h-4 w-4" />
                            <span>{translate('Convert to Account')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onItemAction('convert-to-contact', item)} className="text-blue-600">
                            <Users className="mr-2 h-4 w-4" />
                            <span>{translate('Convert to Contact')}</span>
                        </DropdownMenuItem>
                    </>
                )}
                <DropdownMenuSeparator />
                {useHasPermission(deletePermission) && (
                    <DropdownMenuItem onClick={() => onItemAction('delete', item)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>{translate('Delete')}</span>
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        );
    };

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="kanban-scroll flex gap-4 overflow-x-auto pb-4" style={{ height: 'calc(100vh - 120px)', width: '100%' }}>
                    {statuses.map((status) => (
                        <div key={status.id} className="flex-shrink-0" style={{ minWidth: 'calc(20% - 16px)', width: 'calc(20% - 16px)' }}>
                            <div className="flex h-full flex-col rounded-lg bg-gray-100">
                                <div className="border-b border-gray-200 p-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: status.color }} />
                                            <h3 className="text-sm font-semibold text-gray-700">{status.name}</h3>
                                        </div>
                                        <span className="rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-500">
                                            {filteredKanbanData[status.id]?.leads?.length || 0}
                                        </span>
                                    </div>
                                </div>

                                <Droppable droppableId={status.id.toString()}>
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className="column-scroll flex-1 space-y-2 overflow-y-auto p-2"
                                            style={{ maxHeight: 'calc(100vh - 190px)' }}
                                        >
                                            {(filteredKanbanData[status.id]?.leads || []).map((item, index) => (
                                                <Draggable key={item.id} draggableId={item.id.toString()} index={index} isDragDisabled={isLoading}>
                                                    {(provided, snapshot) => (
                                                        <Card
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`cursor-grab border-l-4 transition-all duration-200 active:cursor-grabbing ${
                                                                snapshot.isDragging
                                                                    ? 'z-50 scale-105 rotate-2 border-blue-300 bg-white shadow-2xl'
                                                                    : 'border-gray-200 hover:scale-[1.02] hover:border-blue-200 hover:shadow-lg'
                                                            } ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
                                                            style={{
                                                                borderLeftColor:
                                                                    type === 'lead'
                                                                        ? item.lead_status?.color || '#6b7280'
                                                                        : item.opportunity_stage?.color || '#6b7280',
                                                            }}
                                                        >
                                                            <div className="space-y-3 p-3">
                                                                <div className="mb-1 flex justify-center">
                                                                    <div className="h-1 w-8 rounded-full bg-gray-300 opacity-50 transition-opacity hover:opacity-100" />
                                                                </div>

                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex min-w-0 flex-1 items-center gap-3">
                                                                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-sm font-semibold text-white shadow-md ring-2 ring-white">
                                                                            {getInitials(item.name)}
                                                                        </div>
                                                                        <div className="min-w-0 flex-1">
                                                                            <h4 className="truncate text-sm leading-tight font-semibold text-gray-900 transition-colors hover:text-indigo-600">
                                                                                {item.name}
                                                                            </h4>
                                                                            <p className="mt-0.5 truncate text-xs text-gray-500">
                                                                                {type === 'lead'
                                                                                    ? item.email || translate('No email')
                                                                                    : item.account?.name || 'No account'}
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-7 w-7 rounded-full p-0 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                                                            >
                                                                                <MoreHorizontal className="h-4 w-4" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        {renderItemActions(item)}
                                                                    </DropdownMenu>
                                                                </div>

                                                                <div className="space-y-2">
                                                                    {type === 'lead' && item.organization && (
                                                                        <div className="flex items-center gap-2 rounded-md bg-gray-50 px-2 py-1">
                                                                            <Building2 className="h-3 w-3 flex-shrink-0 text-indigo-500" />
                                                                            <span className="truncate text-xs font-medium text-gray-700">
                                                                                {item.organization}
                                                                            </span>
                                                                        </div>
                                                                    )}

                                                                    {(item.value || item.amount) && (
                                                                        <div className="flex items-center justify-between rounded-md bg-green-50 px-2 py-1">
                                                                            <span className="text-xs font-medium text-green-700">
                                                                                {type === 'lead' ? translate('Value') : translate('Amount')}:
                                                                            </span>
                                                                            <span className="text-xs font-bold text-green-800">
                                                                                ${parseFloat(item.value || item.amount || '0').toFixed(2)}
                                                                            </span>
                                                                        </div>
                                                                    )}

                                                                    {item.assigned_user && (
                                                                        <div className="flex items-center gap-2 rounded-md bg-blue-50 px-2 py-1">
                                                                            <User className="h-3 w-3 flex-shrink-0 text-blue-500" />
                                                                            <span className="truncate text-xs font-medium text-blue-700">
                                                                                {item.assigned_user.name}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                                                                    {(item.lead_source || item.opportunity_source) && (
                                                                        <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
                                                                            {(item.lead_source || item.opportunity_source)?.name}
                                                                        </span>
                                                                    )}
                                                                    <span className="text-xs font-medium text-gray-500">
                                                                        {type === 'opportunity' && item.close_date
                                                                            ? new Date(item.close_date).toLocaleDateString()
                                                                            : window.appSettings?.formatDateTime(item.created_at, false) ||
                                                                              new Date(item.created_at).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </Card>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}

                                            {(filteredKanbanData[status.id]?.leads?.length || 0) === 0 && (
                                                <div className="py-8 text-center text-gray-400">
                                                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 shadow-sm">
                                                        <span className="text-lg">{type === 'lead' ? '👤' : '💼'}</span>
                                                    </div>
                                                    <p className="mb-1 text-sm font-medium text-gray-500">{translate(`No ${type}s here`)}</p>
                                                    <p className="text-xs text-gray-400">{translate(`Drag ${type}s here to update status`)}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        </div>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
};
