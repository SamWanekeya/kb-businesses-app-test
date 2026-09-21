<?php

namespace App\Http\Controllers;

use App\Events\TaskAssigned;
use App\Exports\ProjectTaskExport;
use App\Models\Project;
use App\Models\ProjectTask;
use App\Models\TaskStatus;
use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class ProjectTaskController extends Controller
{
    public function index(Request $request)
    {
        $query = ProjectTask::query()
            ->with(['project', 'assignedUser', 'creator', 'parent', 'taskStatus'])
            ->where('created_by', createdBy());

        if ($request->has('search') && !empty($request->search)) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%')
                    ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->has('status') && !empty($request->status) && $request->status !== 'all') {
            $query->where('task_status_id', $request->status);
        }

        if ($request->has('priority') && !empty($request->priority) && $request->priority !== 'all') {
            $query->where('priority', $request->priority);
        }

        if ($request->has('project_id') && !empty($request->project_id) && $request->project_id !== 'all') {
            $query->where('project_id', $request->project_id);
        }

        if ($request->has('assigned_to') && !empty($request->assigned_to) && $request->assigned_to !== 'all') {
            $query->where('assigned_to', $request->assigned_to);
        }

        $sortField = $request->input('sort_field', 'id');
        $sortDirection = $request->input('sort_direction', 'desc');
        $allowedSorts = ['id', 'title'];
        $allowedDirection = ['asc', 'desc'];
        if (!in_array($sortDirection, $allowedDirection)) {
            $sortDirection = 'desc';
        }
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortDirection);
        }

        $allTasks = $query->get();

        $projectQuery = Project::where('created_by', createdBy());
        $allProjects = (clone $projectQuery)->get(['id', 'name']);
        $projects = (clone $projectQuery)->where('status', 'active')->get(['id', 'name']);

        $userQuery = User::where('created_by', createdBy());
        $allUsers = (clone $userQuery)->select('id', 'name', 'email')->get();
        $users = (clone $userQuery)->where('status', 'active')->select('id', 'name', 'email')->get();

        $parentTasks = [];

        $taskStatusQuery = TaskStatus::where('created_by', createdBy());
        $allTaskStatuses = (clone $taskStatusQuery)->select('id', 'name', 'color')->get();
        $taskStatuses = (clone $taskStatusQuery)->where('status', 'active')->select('id', 'name', 'color')->get();

        $groupedTasks = $allTasks->map(fn ($task) => [
            'id' => $task->id,
            'title' => $task->title,
            'description' => $task->description,
            'priority' => $task->priority,
            'progress' => $task->progress,
            'start_date' => $task->start_date,
            'due_date' => $task->due_date,
            'task_status_id' => $task->task_status_id,
            'project' => $task->project,
            'assigned_user' => $task->assignedUser,
            'parent' => $task->parent,
            'parent_id' => $task->parent_id,
            'estimated_hours' => $task->estimated_hours,
            'actual_hours' => $task->actual_hours,
            'created_at' => $task->created_at,
        ])->groupBy('task_status_id');
        $kanbanData = [];
        foreach ($taskStatuses as $status) {
            $kanbanData[$status->id] = [
                'status' => $status,
                'tasks' => $groupedTasks->get($status->id, collect())->values()->toArray(),
            ];
        }

        return Inertia::render('ProjectsTasks/Index', [
            'kanbanData' => $kanbanData,
            'statuses' => $taskStatuses,
            'projects' => $projects,
            'allProjects' => $allProjects,
            'users' => $users,
            'allUsers' => $allUsers,
            'parentTasks' => $parentTasks,
            'taskStatuses' => $taskStatuses,
            'allTaskStatuses' => $allTaskStatuses,
            'filters' => $request->all(['search', 'status', 'priority', 'project_id', 'assigned_to']),
        ]);
    }

    public function show($id)
    {
        $task = ProjectTask::with(['project', 'assignedUser', 'creator', 'parent', 'subtasks.assignedUser', 'taskStatus'])
            ->where('created_by', createdBy())
            ->findOrFail($id);

        $taskStatuses = TaskStatus::where('created_by', createdBy())
            ->where('status', 'active')
            ->select('id', 'name', 'color')
            ->get();

        return Inertia::render('ProjectsTasks/Show', [
            'task' => $task,
            'taskStatuses' => $taskStatuses,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'project_id' => 'required|exists:projects,id',
            'parent_id' => 'nullable|exists:project_tasks,id',
            'assigned_to' => 'required|exists:users,id',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date|after_or_equal:start_date',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'task_status_id' => 'required|integer|exists:task_statuses,id',
            'estimated_hours' => 'nullable|numeric|min:0',
            'actual_hours' => 'nullable|numeric|min:0',
            'progress' => 'nullable|integer|min:0|max:100',
        ]);

        $validated['created_by'] = createdBy();

        // Convert empty string or 'unassigned' to null
        if (empty($validated['assigned_to']) || $validated['assigned_to'] === 'unassigned') {
            $validated['assigned_to'] = null;
        }

        // Set default task status if not provided
        if (!isset($validated['task_status_id'])) {
            $defaultStatus = TaskStatus::where('created_by', createdBy())
                ->where('name', 'To Do')
                ->first();
            if ($defaultStatus) {
                $validated['task_status_id'] = $defaultStatus->id;
            }
        }

        $task = ProjectTask::create($validated);
        if (isEmailTemplateEnabled('Task Assigned', createdBy()) && $task && $task->assigned_to) {
            event(new TaskAssigned($task));
        }

        return redirect()->back()->with('success', __('Task created successfully.'));
    }

    public function destroy($taskId)
    {
        $task = ProjectTask::with('taskStatus')
            ->where('id', $taskId)
            ->where('created_by', createdBy())
            ->first();

        if ($task) {
            // Prevent deletion if task is in specific status
            if ($task->taskStatus && in_array($task->taskStatus->name, ['In Progress', 'Review'])) {
                return redirect()->back()->with('error', __('Cannot delete task in ' . $task->taskStatus->name . ' status.'));
            }

            try {
                $task->delete();

                return redirect()->back()->with('success', __('Task deleted successfully.'));
            } catch (Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to delete task.'));
            }
        } else {
            return redirect()->back()->with('error', __('Task not found.'));
        }
    }

    public function toggleStatus(Request $request, $taskId)
    {
        $task = ProjectTask::where('id', $taskId)
            ->where('created_by', createdBy())
            ->first();

        if ($task) {
            try {
                $validated = $request->validate([
                    'task_status_id' => 'required|integer|exists:task_statuses,id',
                ]);

                // Validate task_status_id belongs to current user
                $statusExists = TaskStatus::where('id', $validated['task_status_id'])
                    ->where('created_by', createdBy())
                    ->where('status', 'active')
                    ->exists();

                if (!$statusExists) {
                    return redirect()->back()->with('error', __('Invalid task status.'));
                }

                $task->update(['task_status_id' => $validated['task_status_id']]);

                return redirect()->back()->with('success', __('Task status updated successfully.'));
            } catch (Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update task status.'));
            }
        } else {
            return redirect()->back()->with('error', __('Task not found.'));
        }
    }

    public function update(Request $request, $taskId)
    {
        $task = ProjectTask::where('id', $taskId)
            ->where('created_by', createdBy())
            ->first();

        if ($task) {
            try {
                $validated = $request->validate([
                    'title' => 'required|string|max:255',
                    'description' => 'nullable|string',
                    'project_id' => 'required|exists:projects,id',
                    'parent_id' => 'nullable|exists:project_tasks,id',
                    'assigned_to' => 'required|exists:users,id',
                    'start_date' => 'nullable|date',
                    'due_date' => 'nullable|date|after_or_equal:start_date',
                    'priority' => 'nullable|in:low,medium,high,urgent',
                    'task_status_id' => 'required|integer',
                    'estimated_hours' => 'nullable|numeric|min:0',
                    'actual_hours' => 'nullable|numeric|min:0',
                    'progress' => 'nullable|integer|min:0|max:100',
                ]);

                // Convert empty string or 'unassigned' to null
                if (empty($validated['assigned_to']) || $validated['assigned_to'] === 'unassigned') {
                    $validated['assigned_to'] = null;
                }

                // Validate task_status_id belongs to current user
                if (!empty($validated['task_status_id'])) {
                    $statusExists = TaskStatus::where('id', $validated['task_status_id'])
                        ->where('created_by', createdBy())
                        ->where('status', 'active')
                        ->exists();

                    if (!$statusExists) {
                        return redirect()->back()->with('error', __('Invalid task status.'));
                    }
                }

                $task->update($validated);

                return redirect()->back()->with('success', __('Task updated successfully.'));
            } catch (Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update task.'));
            }
        } else {
            return redirect()->back()->with('error', __('Task not found.'));
        }
    }

    public function kanban(Request $request, $projectId)
    {
        $project = Project::where('id', $projectId)
            ->where('created_by', createdBy())
            ->firstOrFail();

        $statuses = TaskStatus::where('created_by', createdBy())
            ->where('status', 'active')
            ->select('id', 'name', 'color')
            ->get()
            ->map(fn ($s) => ['id' => $s->id, 'name' => $s->name, 'color' => $s->color])
            ->toArray();

        $taskQuery = ProjectTask::with(['assignedUser', 'taskStatus'])
            ->where('project_id', $projectId)
            ->where('created_by', createdBy());

        if (!empty($request->search)) {
            $taskQuery->where(fn ($q) => $q->where('title', 'like', '%' . $request->search . '%')
                ->orWhere('description', 'like', '%' . $request->search . '%'));
        }

        if (!empty($request->status) && $request->status !== 'all') {
            $taskQuery->where('task_status_id', $request->status);
        }

        if (!empty($request->priority) && $request->priority !== 'all') {
            $taskQuery->where('priority', $request->priority);
        }

        $tasks = $taskQuery->get()
            ->map(fn ($task) => [
                'id' => $task->id,
                'title' => $task->title,
                'description' => $task->description,
                'priority' => $task->priority,
                'progress' => $task->progress,
                'start_date' => $task->start_date,
                'due_date' => $task->due_date,
                'task_status_id' => $task->task_status_id,
                'assigned_user' => $task->assignedUser,
                'created_at' => $task->created_at,
            ])
            ->groupBy('task_status_id');

        $kanbanData = [];
        foreach ($statuses as $status) {
            $kanbanData[$status['id']] = [
                'status' => $status,
                'tasks' => $tasks->get($status['id'], collect())->values()->toArray(),
            ];
        }

        $users = User::where('created_by', createdBy())
            ->where('status', 'active')
            ->select('id', 'name', 'email')
            ->get();

        return Inertia::render('Projects/Kanban', [
            'project' => $project,
            'kanbanData' => $kanbanData,
            'statuses' => $statuses,
            'users' => $users,
            'filters' => $request->only(['search', 'status', 'priority']),
        ]);
    }

    public function gantt(Request $request, $projectId)
    {
        $project = Project::where('id', $projectId)
            ->where('created_by', createdBy())
            ->firstOrFail();

        $taskQuery = ProjectTask::with(['assignedUser', 'taskStatus'])
            ->where('project_id', $projectId)
            ->where('created_by', createdBy());

        if (!empty($request->search)) {
            $taskQuery->where(fn ($q) => $q->where('title', 'like', '%' . $request->search . '%')
                ->orWhere('description', 'like', '%' . $request->search . '%'));
        }

        if (!empty($request->status) && $request->status !== 'all') {
            $taskQuery->where('task_status_id', $request->status);
        }

        if (!empty($request->priority) && $request->priority !== 'all') {
            $taskQuery->where('priority', $request->priority);
        }

        $tasks = $taskQuery->orderBy('start_date')->get();

        $users = User::where('created_by', createdBy())
            ->where('status', 'active')
            ->select('id', 'name', 'email')
            ->get();

        $taskStatuses = TaskStatus::where('created_by', createdBy())
            ->where('status', 'active')
            ->select('id', 'name', 'color')
            ->get();

        return Inertia::render('Projects/Gantt', [
            'project' => $project,
            'tasks' => $tasks,
            'users' => $users,
            'taskStatuses' => $taskStatuses,
            'filters' => $request->only(['search', 'status', 'priority']),
        ]);
    }

    public function updateStatus($taskId)
    {
        $task = ProjectTask::where('id', $taskId)
            ->where('created_by', createdBy())
            ->first();

        if (!$task) {
            return back()->with('error', __('Task not found.'));
        }

        $validated = request()->validate([
            'task_status_id' => 'required|exists:task_statuses,id',
        ]);

        $task->update(['task_status_id' => $validated['task_status_id']]);

        return back()->with('success', __('Task status updated successfully.'));
    }

    public function getParentTasks($projectId)
    {
        $parentTasks = ProjectTask::where('created_by', createdBy())
            ->where('project_id', $projectId)
            ->whereNull('parent_id')
            ->select('id', 'title')
            ->get();

        return response()->json($parentTasks);
    }

    public function fileExport()
    {
        if (!auth()->user()->can('export-project-tasks')) {
            return redirect()->back()->with('error', __('Permission denied.'));
        }

        $name = 'project_tasks_' . date('Y-m-d_H-i-s');

        return Excel::download(new ProjectTaskExport(), $name . '.xlsx');
    }

    public function getProjectDetails($projectId)
    {
        $parentTasks = ProjectTask::where('created_by', createdBy())
            ->where('project_id', $projectId)
            ->whereNull('parent_id')
            ->select('id', 'title')
            ->get();

        return response()->json([
            'parent_tasks' => $parentTasks,
        ]);
    }
}
