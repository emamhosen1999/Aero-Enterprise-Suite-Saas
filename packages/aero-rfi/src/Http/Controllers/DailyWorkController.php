<?php

namespace Aero\Rfi\Http\Controllers;

use Aero\Core\Models\User;
use Aero\Rfi\Http\Requests\DailyWork\StoreDailyWorkRequest;
use Aero\Rfi\Http\Requests\DailyWork\UpdateDailyWorkRequest;
use Aero\Rfi\Models\DailyWork;
use Aero\Rfi\Models\WorkLocation;
use Aero\Rfi\Services\DailyWorkService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

/**
 * DailyWorkController
 *
 * Handles Daily Work (RFI) CRUD operations.
 */
class DailyWorkController extends Controller
{
    public function __construct(
        protected DailyWorkService $dailyWorkService
    ) {}

    /**
     * Display a listing of daily works.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only([
            'search', 'status', 'type', 'inspection_result',
            'incharge_user_id', 'assigned_user_id', 'work_location_id',
            'date_from', 'date_to', 'has_objections', 'without_objections',
            'sort_by', 'sort_direction',
        ]);

        $perPage = $request->input('per_page', 15);
        $dailyWorks = $this->dailyWorkService->getPaginated($filters, $perPage);

        return Inertia::render('Rfi/DailyWorks/Index', [
            'title' => 'Daily Works',
            'dailyWorks' => $dailyWorks,
            'filters' => $filters,
            'statuses' => DailyWork::$statuses,
            'types' => DailyWork::$types,
            'inspectionResults' => DailyWork::$inspectionResults,
            'workLocations' => WorkLocation::active()->get(['id', 'name']),
            'users' => User::select(['id', 'name'])->orderBy('name')->get(),
        ]);
    }

    /**
     * Show the form for creating a new daily work.
     */
    public function create(): Response
    {
        return Inertia::render('Rfi/DailyWorks/Create/Index', [
            'title' => 'Create Daily Work',
            'statuses' => DailyWork::$statuses,
            'types' => DailyWork::$types,
            'sides' => DailyWork::$sides,
            'workLocations' => WorkLocation::active()->get(),
            'users' => User::select(['id', 'name'])->orderBy('name')->get(),
        ]);
    }

    /**
     * Store a newly created daily work.
     */
    public function store(StoreDailyWorkRequest $request): RedirectResponse
    {
        $dailyWork = $this->dailyWorkService->create($request->validated());

        // Handle file uploads if present
        if ($request->hasFile('files')) {
            $this->dailyWorkService->uploadFiles($dailyWork, $request->file('files'));
        }

        return redirect()
            ->route('rfi.daily-works.show', $dailyWork)
            ->with('success', 'Daily work created successfully.');
    }

    /**
     * Display the specified daily work.
     */
    public function show(DailyWork $dailyWork): Response
    {
        $dailyWork->load([
            'inchargeUser',
            'assignedUser',
            'workLocation',
            'objections.createdByUser',
            'submissionOverrideLogs.overriddenByUser',
        ]);

        return Inertia::render('Rfi/DailyWorks/Show/Index', [
            'title' => "Daily Work #{$dailyWork->number}",
            'dailyWork' => $dailyWork,
            'rfiFiles' => $dailyWork->rfi_files,
            'statuses' => DailyWork::$statuses,
            'inspectionResults' => DailyWork::$inspectionResults,
        ]);
    }

    /**
     * Show the form for editing the daily work.
     */
    public function edit(DailyWork $dailyWork): Response
    {
        $dailyWork->load(['inchargeUser', 'assignedUser', 'workLocation']);

        return Inertia::render('Rfi/DailyWorks/Edit/Index', [
            'title' => "Edit Daily Work #{$dailyWork->number}",
            'dailyWork' => $dailyWork,
            'statuses' => DailyWork::$statuses,
            'types' => DailyWork::$types,
            'sides' => DailyWork::$sides,
            'workLocations' => WorkLocation::active()->get(),
            'users' => User::select(['id', 'name'])->orderBy('name')->get(),
        ]);
    }

    /**
     * Update the specified daily work.
     */
    public function update(UpdateDailyWorkRequest $request, DailyWork $dailyWork): RedirectResponse
    {
        $this->dailyWorkService->update($dailyWork, $request->validated());

        return redirect()
            ->route('rfi.daily-works.show', $dailyWork)
            ->with('success', 'Daily work updated successfully.');
    }

    /**
     * Remove the specified daily work.
     */
    public function destroy(DailyWork $dailyWork): RedirectResponse
    {
        $this->dailyWorkService->delete($dailyWork);

        return redirect()
            ->route('rfi.daily-works.index')
            ->with('success', 'Daily work deleted successfully.');
    }

    /**
     * Submit RFI for inspection.
     */
    public function submit(Request $request, DailyWork $dailyWork): RedirectResponse
    {
        $overrideReason = $request->input('override_reason');

        try {
            $this->dailyWorkService->submitRfi($dailyWork, $overrideReason);

            return redirect()
                ->route('rfi.daily-works.show', $dailyWork)
                ->with('success', 'RFI submitted successfully.');
        } catch (\InvalidArgumentException $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Record inspection result.
     */
    public function inspect(Request $request, DailyWork $dailyWork): RedirectResponse
    {
        $request->validate([
            'result' => ['required', 'string', 'in:'.implode(',', DailyWork::$inspectionResults)],
            'details' => ['nullable', 'string', 'max:5000'],
        ]);

        $this->dailyWorkService->recordInspection($dailyWork, [
            'result' => $request->input('result'),
            'details' => $request->input('details'),
        ]);

        return redirect()
            ->route('rfi.daily-works.show', $dailyWork)
            ->with('success', 'Inspection recorded successfully.');
    }

    /**
     * Upload files to daily work.
     */
    public function uploadFiles(Request $request, DailyWork $dailyWork): JsonResponse
    {
        $request->validate([
            'files' => ['required', 'array'],
            'files.*' => ['file', 'mimes:jpeg,jpg,png,webp,gif,pdf', 'max:10240'],
        ]);

        $uploaded = $this->dailyWorkService->uploadFiles($dailyWork, $request->file('files'));

        return response()->json([
            'message' => 'Files uploaded successfully.',
            'files' => $uploaded->map(fn ($media) => [
                'id' => $media->id,
                'name' => $media->file_name,
                'url' => $media->getUrl(),
            ]),
        ]);
    }

    /**
     * Delete a file from daily work.
     */
    public function deleteFile(DailyWork $dailyWork, int $mediaId): JsonResponse
    {
        $deleted = $this->dailyWorkService->deleteFile($dailyWork, $mediaId);

        if (! $deleted) {
            return response()->json(['message' => 'File not found.'], 404);
        }

        return response()->json(['message' => 'File deleted successfully.']);
    }

    /**
     * Attach objections to daily work.
     */
    public function attachObjections(Request $request, DailyWork $dailyWork): JsonResponse
    {
        $request->validate([
            'objection_ids' => ['required', 'array'],
            'objection_ids.*' => ['integer', 'exists:objections,id'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $this->dailyWorkService->attachObjections(
            $dailyWork,
            $request->input('objection_ids'),
            $request->input('notes')
        );

        return response()->json(['message' => 'Objections attached successfully.']);
    }

    /**
     * Detach objections from daily work.
     */
    public function detachObjections(Request $request, DailyWork $dailyWork): JsonResponse
    {
        $request->validate([
            'objection_ids' => ['required', 'array'],
            'objection_ids.*' => ['integer', 'exists:objections,id'],
        ]);

        $count = $this->dailyWorkService->detachObjections($dailyWork, $request->input('objection_ids'));

        return response()->json(['message' => "{$count} objection(s) detached successfully."]);
    }

    /**
     * Display daily work summary.
     */
    public function summary(Request $request): Response
    {
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $summary = $this->dailyWorkService->getPaginated([
            'date_from' => $startDate,
            'date_to' => $endDate,
        ], 50);

        return Inertia::render('Rfi/DailyWorks/Summary/Index', [
            'title' => 'Daily Work Summary',
            'summary' => $summary,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }

    /**
     * Bulk update status.
     */
    public function bulkUpdateStatus(Request $request): JsonResponse
    {
        $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:daily_works,id'],
            'status' => ['required', 'string', 'in:'.implode(',', DailyWork::$statuses)],
        ]);

        $count = $this->dailyWorkService->bulkUpdateStatus(
            $request->input('ids'),
            $request->input('status')
        );

        return response()->json(['message' => "{$count} daily work(s) updated successfully."]);
    }

    /**
     * Export daily works.
     */
    public function export(Request $request)
    {
        // TODO: Implement export functionality
        return response()->json(['message' => 'Export functionality coming soon.']);
    }
}
