import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useInitials } from '@/hooks/use-initials';
import { useHasPermission } from '@/utils/Permissions';
import { Draggable } from '@hello-pangea/dnd';
import { Building2, Edit, Eye, MoreHorizontal, Trash2, User, Users } from 'lucide-react';
import React from 'react';
import { route } from '@/utils/Routes';
import { useTranslation } from 'react-i18next';

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

interface KanbanCardProps {
    lead: Lead;
    index: number;
    onLeadAction: (action: string, lead: Lead) => void;
    permissions: string[];
    isLoading: boolean;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ lead, index, onLeadAction, permissions, isLoading }) => {
    const { t: translate } = useTranslation();
    const getInitials = useInitials();

    const formatValue = (value: string) => {
        if (!value) return null;
        return `$${parseFloat(value).toFixed(2)}`;
    };

    const formatDate = (dateString: string) => {
        return window.appSettings?.formatDateTime(dateString, false) || new Date(dateString).toLocaleDateString();
    };

    return (
        <Draggable draggableId={lead.id.toString()} index={index} isDragDisabled={isLoading}>
            {(provided, snapshot) => (
                <Card
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`cursor-grab border border-gray-200 p-3 transition-all duration-200 active:cursor-grabbing dark:border-gray-700 ${
                        snapshot.isDragging
                            ? 'z-50 scale-105 rotate-2 border-blue-300 bg-white shadow-2xl dark:border-blue-600 dark:bg-gray-900'
                            : 'hover:scale-[1.02] hover:border-blue-200 hover:shadow-lg dark:hover:border-blue-700'
                    } ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                    <div className="space-y-2">
                        {/* Drag indicator */}
                        <div className="mb-1 flex justify-center">
                            <div className="h-1 w-8 rounded-full bg-gray-300 opacity-50 transition-opacity hover:opacity-100 dark:bg-gray-600" />
                        </div>

                        {/* Header with avatar and actions */}
                        <div className="flex items-start justify-between">
                            <div className="flex min-w-0 flex-1 items-center gap-2">
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-medium text-white shadow-sm">
                                    {getInitials(lead.name)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="truncate text-sm font-medium text-gray-900 transition-colors hover:text-blue-600 dark:text-white dark:hover:text-blue-400">
                                        {lead.name}
                                    </h4>
                                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{lead.email || translate('No email')}</p>
                                </div>
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="z-50 w-48" sideOffset={5}>
                                    {useHasPermission('view-leads') && (
                                        <DropdownMenuItem onClick={() => onLeadAction('view', lead)}>
                                            <Eye className="mr-2 h-4 w-4" />
                                            <span>{translate('View Lead')}</span>
                                        </DropdownMenuItem>
                                    )}
                                    {useHasPermission('edit-leads') && (
                                        <DropdownMenuItem onClick={() => onLeadAction('edit', lead)}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            <span>{translate('Edit')}</span>
                                        </DropdownMenuItem>
                                    )}
                                    {useHasPermission('convert-leads') && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => onLeadAction('convert-to-account', lead)} className="text-green-600">
                                                <Building2 className="mr-2 h-4 w-4" />
                                                <span>{translate('Convert to Account')}</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onLeadAction('convert-to-contact', lead)} className="text-blue-600">
                                                <Users className="mr-2 h-4 w-4" />
                                                <span>{translate('Convert to Contact')}</span>
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                    <DropdownMenuSeparator />
                                    {useHasPermission('delete-leads') && (
                                        <DropdownMenuItem onClick={() => onLeadAction('delete', lead)} className="text-red-600">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            <span>{translate('Delete')}</span>
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Lead details */}
                        <div className="space-y-1">
                            {lead.organization && (
                                <div className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3 text-gray-400" />
                                    <span className="truncate text-xs text-gray-600 dark:text-gray-300">{lead.organization}</span>
                                </div>
                            )}

                            {lead.value && (
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{translate('Value')}:</span>
                                    <span className="text-xs font-medium text-green-600 dark:text-green-400">{formatValue(lead.value)}</span>
                                </div>
                            )}

                            {lead.assigned_user && (
                                <div className="flex items-center gap-1">
                                    <User className="h-3 w-3 text-gray-400" />
                                    <span className="truncate text-xs text-gray-600 dark:text-gray-300">{lead.assigned_user.name}</span>
                                </div>
                            )}
                        </div>

                        {/* Footer with source and date */}
                        <div className="flex items-center justify-between border-t border-gray-100 pt-1 dark:border-gray-700">
                            {lead.lead_source && (
                                <Badge variant="outline" className="px-1 py-0 text-xs">
                                    {lead.lead_source.name}
                                </Badge>
                            )}
                            <span className="text-xs text-gray-400">{formatDate(lead.created_at)}</span>
                        </div>
                    </div>
                </Card>
            )}
        </Draggable>
    );
};
