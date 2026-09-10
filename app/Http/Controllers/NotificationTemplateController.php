<?php

namespace App\Http\Controllers;

use App\Models\NotificationTemplate;
use Exception;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NotificationTemplateController extends Controller
{
    public function index(Request $request)
    {
        $types = NotificationTemplate::getAvailableTypes();
        $defaultType = $types[0] ?? null;

        $query = NotificationTemplate::with('notificationTemplateLangs');

        // Filter by type if provided, otherwise use default
        $selectedType = $request->filled('type') ? $request->type : $defaultType;
        if ($selectedType) {
            $query->where('type', $selectedType);
        }

        // Search functionality
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        // Sorting
        $sortField = $request->input('sort_field', 'id');
        $sortDirection = $request->input('sort_direction', 'desc');
        $allowedSorts = ['id', 'name'];
        $allowedDirection = ['asc', 'desc'];
        if (!in_array($sortDirection, $allowedDirection)) {
            $sortDirection = 'desc';
        }
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortDirection);
        }

        // Pagination
        $perPage = max(1, min(100, (int)$request->input('per_page', 10)));
        $templates = $query->paginate($perPage)->withQueryString();

        return Inertia::render('NotificationTemplates/Index', [
            'templates' => $templates,
            'filters' => array_merge(
                $request->only(['search', 'sort_field', 'sort_direction', 'per_page', 'page']),
                ['type' => $selectedType]
            ),
            'types' => $types,
        ]);
    }

    public function show(NotificationTemplate $notificationTemplate)
    {
        // Load organization-specific content
        $template = $notificationTemplate->load(['notificationTemplateLangs' => function ($query) {
            if (auth()->user()->type === 'organization') {
                $query->where('created_by', createdBy());
            }
        }]);
        $languagesArray = json_decode(file_get_contents(resource_path('lang/language.json')), true);
        $languages = [];
        foreach ($languagesArray as $lang) {
            $languages[$lang['code']] = $lang['name'];
        }

        // Template-specific variables based on notification type
        $variables = [];

        if ($template->name === 'Lead Create') {
            $variables = [
                '{lead_name}' => 'Lead Name',
                '{organization_name}' => 'Organization Name',
            ];
        } elseif ($template->name === 'Opportunity create') {
            $variables = [
                '{opportunity_name}' => 'Opportunity Name',
                '{amount}' => 'Opportunity Amount',
                '{account_name}' => 'Account Name',
                '{close_date}' => 'Close Date',
                '{organization_name}' => 'Organization Name',

            ];
        } elseif ($template->name === 'Account create') {
            $variables = [
                '{account_name}' => 'Account Name',
                '{organization_name}' => 'Organization Name',

            ];
        } elseif ($template->name === 'Quote Create') {
            $variables = [
                '{quote_number}' => 'Quote Number',
                '{account_name}' => 'Account Name',
                '{total_amount}' => 'Total Amount',
                '{valid_until}' => 'Valid Until Date',
                '{organization_name}' => 'Organization Name',
            ];
        } elseif ($template->name === 'Case Create') {
            $variables = [
                '{case_subject}' => 'Case Subject',
                '{organization_name}' => 'Organization Name',
            ];
        } elseif ($template->name === 'Meeting Create') {
            $variables = [
                '{meeting_subject}' => 'Meeting Subject',
                '{meeting_date}' => 'Meeting Date',
                '{meeting_time}' => 'Meeting Time',
                '{attendee_count}' => 'Attendee Count',
                '{organization_name}' => 'Organization Name',
            ];
        }

        return Inertia::render('NotificationTemplates/Show', [
            'template' => $template,
            'languages' => $languages,
            'variables' => $variables,
        ]);
    }

    public function updateContent(NotificationTemplate $notificationTemplate, Request $request)
    {
        try {
            $request->validate([
                'lang' => 'required|string|max:10',
                'title' => 'required|string|max:255',
                'notification_template_content' => 'required|string',
            ]);

            $notificationTemplate->notificationTemplateLangs()
                ->where('lang', $request->lang)
                ->where('created_by', createdBy())
                ->updateOrCreate(
                    [
                        'parent_id' => $notificationTemplate->id,
                        'lang' => $request->lang,
                        'created_by' => createdBy(),
                    ],
                    [
                        'title' => $request->title,
                        'notification_template_content' => $request->notification_template_content,
                    ]
                );

            return redirect()->back()->with('success', __('Notification content updated successfully.'));
        } catch (Exception $e) {
            return redirect()->back()->with('error', __('Failed to update notification content: :error', ['error' => $e->getMessage()]));
        }
    }
}
