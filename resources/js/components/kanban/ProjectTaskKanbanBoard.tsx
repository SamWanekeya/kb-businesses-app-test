import { toast } from '@/components/custom-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useHasPermission } from '@/utils/Permissions';
import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd';
import { router } from '@inertiajs/react';
import { Calendar, Edit, Eye, MoreHorizontal, Plus, Trash2, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ProjectTask {
    id: number;
    title: string;
    description?: string;
    task_status_id: string;
    priority: string;
    progress: number;
    due_date?: string;
    start_date?: string;
    assigned_user?: { id: number; name: string };
    created_at: string;
}

interface KanbanStatus {
    id: string;
    name: string;
    color: string;
}

interface KanbanData {
    [key: string]: {
        status: KanbanStatus;
        tasks: ProjectTask[];
    };
}

interface ProjectTaskKanbanBoardProps {
    initialData: KanbanData;
    statuses: KanbanStatus[];
    onItemAction: (action: string, item: ProjectTask) => void;
    permissions: string[];
    projectId: number;
    onAddTask: (status: string) => void;
    onDataUpdate?: (data: KanbanData) => void;
}

export const ProjectTaskKanbanBoard: React.FC<ProjectTaskKanbanBoardProps> = ({
    initialData,
    statuses,
    onItemAction,
    permissions,
    projectId,
    onAddTask,
    onDataUpdate,
}) => {
    const { t } = useTranslation();
    const [kanbanData, setKanbanData] = useState<KanbanData>(initialData);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setKanbanData(initialData);
    }, [initialData]);

    const handleDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
            return;
        }

        if (!useHasPermission('edit-project-tasks')) {
            toast.error(t('Permission denied.'));
            return;
        }

        const sourceColumn = kanbanData[source.droppableId];
        const destColumn = kanbanData[destination.droppableId];
        const draggedItem = sourceColumn.tasks.find((item) => item.id.toString() === draggableId);

        if (!draggedItem) return;

        const newKanbanData = { ...kanbanData };

        newKanbanData[source.droppableId] = {
            ...sourceColumn,
            tasks: sourceColumn.tasks.filter((item) => item.id.toString() !== draggableId),
        };

        const updatedItem = {
            ...draggedItem,
            task_status_id: destination.droppableId,
        };

        const destTasks = [...destColumn.tasks];
        destTasks.splice(destination.index, 0, updatedItem);

        newKanbanData[destination.droppableId] = {
            ...destColumn,
            tasks: destTasks,
        };

        setKanbanData(newKanbanData);

        try {
            setIsLoading(true);

            router.put(
                route('project-tasks.update-status', draggedItem.id),
                { task_status_id: destination.droppableId },
                {
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: (page) => {
                        if (page.props.flash.success) {
                            toast.success(t(page.props.flash.success));
                        } else if (page.props.flash.error) {
                            toast.error(t(page.props.flash.error));
                        }
                        if (onDataUpdate) {
                            onDataUpdate(newKanbanData);
                        }
                    },
                    onError: (errors) => {
                        if (typeof errors === 'string') {
                            toast.error(errors);
                        } else {
                            toast.error(`Failed to update task status: ${Object.values(errors).join(', ')}`);
                        }
                        setKanbanData(initialData);
                    },
                },
            );
        } catch (error) {
            toast.error(t('Failed to update task status'));
            setKanbanData(initialData);
        } finally {
            setIsLoading(false);
        }
    };

    const renderTaskActions = (task: ProjectTask) => {
        return (
            <DropdownMenuContent align="end" className="z-50 w-48" sideOffset={5}>
                {useHasPermission('view-project-tasks') && (
                    <DropdownMenuItem onClick={() => onItemAction('view', task)}>
                        <Eye className="mr-2 h-4 w-4" />
                        <span>{t('View Task')}</span>
                    </DropdownMenuItem>
                )}
                {useHasPermission('edit-project-tasks') && (
                    <DropdownMenuItem onClick={() => onItemAction('edit', task)}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>{t('Edit')}</span>
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {useHasPermission('delete-project-tasks') && (
                    <DropdownMenuItem onClick={() => onItemAction('delete', task)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>{t('Delete')}</span>
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        );
    };

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="kanban-scroll flex h-full gap-4 overflow-x-auto pb-4">
                    {statuses.map((status) => (
                        <div key={status.id} className="flex-shrink-0" style={{ minWidth: '380px', width: '380px' }}>
                            <div className="flex flex-col rounded-lg bg-gray-100" style={{ height: 'calc(100vh - 280px)' }}>
                                <div className="border-b border-gray-200 p-3">
                                    <div className="mb-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: status.color }} />
                                            <h3 className="text-sm font-semibold text-gray-700">{status.name}</h3>
                                        </div>
                                        <span className="rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-500">
                                            {kanbanData[status.id]?.tasks?.length || 0}
                                        </span>
                                    </div>
                                    {useHasPermission('create-project-tasks') && (
                                        <Button variant="ghost" size="sm" className="h-7 w-full text-xs" onClick={() => onAddTask(status.id)}>
                                            <Plus className="mr-1 h-3 w-3" />
                                            {t('Add Task')}
                                        </Button>
                                    )}
                                </div>

                                <Droppable droppableId={status.id}>
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className="column-scroll flex-1 space-y-2 overflow-y-auto p-2"
                                            style={{ height: 'calc(100vh - 380px)' }}
                                        >
                                            {(kanbanData[status.id]?.tasks || []).map((task, index) => (
                                                <Draggable
                                                    key={task.id}
                                                    draggableId={task.id.toString()}
                                                    index={index}
                                                    isDragDisabled={isLoading || !useHasPermission('edit-project-tasks')}
                                                >
                                                    {(provided, snapshot) => (
                                                        <Card
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`border border-gray-200 p-3 transition-all duration-200 ${
                                                                snapshot.isDragging
                                                                    ? 'z-50 scale-105 rotate-2 border-blue-300 bg-white shadow-2xl'
                                                                    : 'hover:scale-[1.02] hover:border-blue-200 hover:shadow-lg'
                                                            } ${isLoading ? 'cursor-not-allowed opacity-50' : ''} ${
                                                                useHasPermission('edit-project-tasks')
                                                                    ? 'cursor-grab active:cursor-grabbing'
                                                                    : 'cursor-default'
                                                            }`}
                                                        >
                                                            <div className="space-y-2">
                                                                <div className="mb-2 flex justify-center">
                                                                    <div className="h-1 w-8 rounded-full bg-gray-300 opacity-50 transition-opacity hover:opacity-100" />
                                                                </div>

                                                                <div className="mb-3 flex items-start justify-between">
                                                                    <div className="flex min-w-0 flex-1 items-center gap-2">
                                                                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-medium text-white shadow-sm">
                                                                            {task.title.charAt(0).toUpperCase()}
                                                                        </div>
                                                                        <div className="min-w-0 flex-1">
                                                                            <h4 className="line-clamp-2 text-sm font-medium text-gray-900 transition-colors hover:text-blue-600">
                                                                                {task.title}
                                                                            </h4>
                                                                            {task.description && (
                                                                                <p className="mt-1 truncate text-xs text-gray-500">
                                                                                    {task.description}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                                                                            >
                                                                                <MoreHorizontal className="h-4 w-4" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        {renderTaskActions(task)}
                                                                    </DropdownMenu>
                                                                </div>

                                                                <div className="mb-4 rounded-md border border-gray-200 p-3 dark:border-gray-700">
                                                                    <div className="mb-2 space-y-1">
                                                                        <div className="flex items-center justify-between text-xs">
                                                                            <span className="text-gray-500">Progress:</span>
                                                                            <span className="font-medium">{task.progress}%</span>
                                                                        </div>
                                                                        <div className="h-1 w-full rounded-full bg-gray-200">
                                                                            <div
                                                                                className="h-1 rounded-full bg-blue-600 transition-all duration-300"
                                                                                style={{ width: `${task.progress}%` }}
                                                                            ></div>
                                                                        </div>
                                                                    </div>

                                                                    {task.assigned_user && (
                                                                        <div className="mb-2 flex items-center gap-1">
                                                                            <User className="h-3 w-3 text-gray-400" />
                                                                            <span className="truncate text-xs text-gray-600">
                                                                                {task.assigned_user.name}
                                                                            </span>
                                                                        </div>
                                                                    )}

                                                                    {task.start_date && (
                                                                        <div className="mb-2 flex items-center gap-1">
                                                                            <Calendar className="h-3 w-3 text-green-400" />
                                                                            <span className="text-xs text-green-600">
                                                                                Start: {new Date(task.start_date).toLocaleDateString()}
                                                                            </span>
                                                                        </div>
                                                                    )}

                                                                    {task.due_date && (
                                                                        <div className="mb-2 flex items-center gap-1">
                                                                            <Calendar className="h-3 w-3 text-red-400" />
                                                                            <span className="text-xs text-red-600">
                                                                                Due: {new Date(task.due_date).toLocaleDateString()}
                                                                            </span>
                                                                        </div>
                                                                    )}

                                                                    <div className="flex flex-wrap gap-1">
                                                                        <span
                                                                            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                                                                                task.priority === 'urgent'
                                                                                    ? 'bg-red-50 text-red-700 ring-1 ring-red-600/20 ring-inset'
                                                                                    : task.priority === 'high'
                                                                                      ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-600/20 ring-inset'
                                                                                      : task.priority === 'medium'
                                                                                        ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20 ring-inset'
                                                                                        : 'bg-gray-50 text-gray-700 ring-1 ring-gray-600/20 ring-inset'
                                                                            }`}
                                                                        >
                                                                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div className="mb-4 text-xs text-gray-500 dark:text-gray-400">
                                                                    {t('Created')}:{' '}
                                                                    {window.appSettings?.formatDateTime(task.created_at, false) ||
                                                                        new Date(task.created_at).toLocaleDateString()}
                                                                </div>
                                                            </div>
                                                        </Card>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}

                                            {(kanbanData[status.id]?.tasks?.length || 0) === 0 && (
                                                <div className="py-12 text-center text-gray-500">
                                                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                                                        <span className="text-lg">📋</span>
                                                    </div>
                                                    <p className="mb-1 text-sm font-medium">{t('No tasks here')}</p>
                                                    <p className="text-xs opacity-75">{t('Drag tasks here or add new ones')}</p>
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
