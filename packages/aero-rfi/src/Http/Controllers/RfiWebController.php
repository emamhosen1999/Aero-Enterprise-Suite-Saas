<?php

namespace Aero\Rfi\Http\Controllers;

use Aero\Core\Models\User;
use Aero\Rfi\Http\Requests\Rfi\StoreRfiRequest;
use Aero\Rfi\Http\Requests\Rfi\UpdateRfiRequest;
use Aero\Rfi\Models\Rfi;
use Aero\Rfi\Models\WorkLocation;
use Aero\Rfi\Services\RfiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

/**
 * RfiWebController
 *
 * Handles RFI CRUD operations via Inertia pages.
 */
class RfiWebController extends Controller
{
    public function __construct(
        protected RfiService $rfiService
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
        $rfis = $this->rfiService->getPaginated($filters, $perPage);

        // Get users
        $users = User::select(['id', 'name'])->orderBy('name')->get();
        
        // Prepare allData structure expected by the Inertia page
        $allData = [
            'juniors' => $users, // Junior engineers/staff
            'allInCharges' => $users, // In-charge staff (can be same as juniors)
            'workLayers' => [], // Work layers if needed
        ];

        return Inertia::render('Rfi/Rfis/Index', [
            'title' => 'RFIs',
            'allData' => $allData,
            'jurisdictions' => [], // Add jurisdictions if needed
            'users' => $users,
            'reports' => $rfis, // RFIs data
            'reports_with_rfis' => $rfis, // Same data for compatibility
            'overallEndDate' => now()->format('Y-m-d'),
            'overallStartDate' => now()->subDays(30)->format('Y-m-d'),
        ]);
    }

    /**
     * Show the form for creating a new daily work.
     */
    public function create(): Response
    {
        return Inertia::render('Rfi/Create/Index', [
            'title' => 'Create Daily Work',
            'statuses' => Rfi::$statuses,
            'types' => Rfi::$types,
            'sides' => Rfi::$sides,
            'workLocations' => WorkLocation::active()->get(),
            'users' => User::select(['id', 'name'])->orderBy('name')->get(),
        ]);
    }

    /**
     * Store a newly created daily work.
     */
    public function store(StoreRfiRequest $request): RedirectResponse
    {
        $rfi = $this->rfiService->create($request->validated());

        // Handle file uploads if present
        if ($request->hasFile('files')) {
            $this->rfiService->uploadFiles($rfi, $request->file('files'));
        }

        return redirect()
            ->route('rfi.rfis.show', $rfi)
            ->with('success', 'RFI created successfully.');
    }

    /**
     * Display the specified daily work.
     */
    public function show(Rfi $rfi): Response
    {
        $rfi->load([
            'inchargeUser',
            'assignedUser',
            'workLocation',
            'objections.createdByUser',
            'submissionOverrideLogs.overriddenByUser',
        ]);

        return Inertia::render('Rfi/Show/Index', [
            'title' => "RFI #{$rfi->number}",
            'rfi' => $rfi,
            'rfiFiles' => $rfi->rfi_files,
            'statuses' => Rfi::$statuses,
            'inspectionResults' => Rfi::$inspectionResults,
        ]);
    }

    /**
     * Show the form for editing the daily work.
     */
    public function edit(Rfi $rfi): Response
    {
        $rfi->load(['inchargeUser', 'assignedUser', 'workLocation']);

        return Inertia::render('Rfi/Edit/Index', [
            'title' => "Edit RFI #{$rfi->number}",
            'rfi' => $rfi,
            'statuses' => Rfi::$statuses,
            'types' => Rfi::$types,
            'sides' => Rfi::$sides,
            'workLocations' => WorkLocation::active()->get(),
            'users' => User::select(['id', 'name'])->orderBy('name')->get(),
        ]);
    }

    /**
     * Update the specified RFI.
     */
    public function update(UpdateRfiRequest $request, Rfi $rfi): RedirectResponse
    {
        $this->rfiService->update($rfi, $request->validated());

        return redirect()
            ->route('rfi.rfis.show', $rfi)
            ->with('success', 'RFI updated successfully.');
    }

    /**
     * Remove the specified RFI.
     */
    public function destroy(Rfi $rfi): RedirectResponse
    {
        $this->rfiService->delete($rfi);

        return redirect()
            ->route('rfi.rfis.index')
            ->with('success', 'RFI deleted successfully.');
    }

    /**
     * Submit RFI for inspection.
     */
    public function submit(Request $request, Rfi $rfi): RedirectResponse
    {
        $overrideReason = $request->input('override_reason');

        try {
            $this->rfiService->submitRfi($rfi, $overrideReason);

            return redirect()
                ->route('rfi.rfis.show', $rfi)
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
    public function inspect(Request $request, Rfi $rfi): RedirectResponse
    {
        $request->validate([
            'result' => ['required', 'string', 'in:'.implode(',', Rfi::$inspectionResults)],
            'details' => ['nullable', 'string', 'max:5000'],
        ]);

        $this->rfiService->recordInspection($rfi, [
            'result' => $request->input('result'),
            'details' => $request->input('details'),
        ]);

        return redirect()
            ->route('rfi.rfis.show', $rfi)
            ->with('success', 'Inspection recorded successfully.');
    }

    /**
     * Upload files to RFI.
     */
    public function uploadFiles(Request $request, Rfi $rfi): JsonResponse
    {
        $request->validate([
            'files' => ['required', 'array'],
            'files.*' => ['file', 'mimes:jpeg,jpg,png,webp,gif,pdf', 'max:10240'],
        ]);

        $uploaded = $this->rfiService->uploadFiles($rfi, $request->file('files'));

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
     * Delete a file from RFI.
     */
    public function deleteFile(Rfi $rfi, int $mediaId): JsonResponse
    {
        $deleted = $this->rfiService->deleteFile($rfi, $mediaId);

        if (! $deleted) {
            return response()->json(['message' => 'File not found.'], 404);
        }

        return response()->json(['message' => 'File deleted successfully.']);
    }

    /**
     * Attach objections to RFI.
     */
    public function attachObjections(Request $request, Rfi $rfi): JsonResponse
    {
        $request->validate([
            'objection_ids' => ['required', 'array'],
            'objection_ids.*' => ['integer', 'exists:objections,id'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $this->rfiService->attachObjections(
            $rfi,
            $request->input('objection_ids'),
            $request->input('notes')
        );

        return response()->json(['message' => 'Objections attached successfully.']);
    }

    /**
     * Detach objections from RFI.
     */
    public function detachObjections(Request $request, Rfi $rfi): JsonResponse
    {
        $request->validate([
            'objection_ids' => ['required', 'array'],
            'objection_ids.*' => ['integer', 'exists:objections,id'],
        ]);

        $count = $this->rfiService->detachObjections($rfi, $request->input('objection_ids'));

        // Get updated active count
        $activeCount = $rfi->refresh()
            ->objections()
            ->whereIn('status', ['draft', 'submitted', 'under_review'])
            ->count();

        return response()->json([
            'message' => "{$count} objection(s) detached successfully.",
            'active_objections_count' => $activeCount,
        ]);
    }

    /**
     * Get objections attached to this RFI.
     */
    public function getObjections(Rfi $rfi): JsonResponse
    {
        $objections = $rfi->objections()
            ->with(['createdByUser', 'media'])
            ->get()
            ->map(function ($objection) {
                return [
                    'id' => $objection->id,
                    'title' => $objection->title,
                    'description' => $objection->description,
                    'reason' => $objection->reason,
                    'category' => $objection->category,
                    'status' => $objection->status,
                    'chainage_from' => $objection->chainage_from,
                    'chainage_to' => $objection->chainage_to,
                    'resolution_notes' => $objection->resolution_notes,
                    'created_at' => $objection->created_at,
                    'created_by' => $objection->createdByUser ? [
                        'name' => $objection->createdByUser->name,
                    ] : null,
                    'files' => $objection->getMedia('attachments')->map(fn ($m) => [
                        'id' => $m->id,
                        'name' => $m->file_name,
                        'url' => $m->getUrl(),
                        'is_image' => str_starts_with($m->mime_type ?? '', 'image/'),
                    ]),
                ];
            });

        return response()->json([
            'objections' => $objections,
        ]);
    }

    /**
     * Get available objections that can be attached to this daily work.
     * Filters by chainage overlap and excludes already attached objections.
     */
    public function getAvailableObjections(Rfi $rfi): JsonResponse
    {
        $rfi->load('workLocation');

        // Get already attached objection IDs
        $attachedIds = $rfi->objections()->pluck('objections.id')->toArray();

        // Find objections that aren't already attached
        $query = \Aero\Rfi\Models\Objection::query()
            ->whereNotIn('id', $attachedIds)
            ->whereIn('status', ['draft', 'submitted', 'under_review']); // Only show active objections

        // If daily work has chainage info, filter by chainage overlap
        if ($rfi->workLocation) {
            $chainageFrom = $rfi->workLocation->chainage_from;
            $chainageTo = $rfi->workLocation->chainage_to;

            if ($chainageFrom && $chainageTo) {
                // Find objections with overlapping chainage range
                $query->where(function ($q) use ($chainageFrom, $chainageTo) {
                    $q->where(function ($inner) use ($chainageFrom, $chainageTo) {
                        // Objection range overlaps with RFI range
                        $inner->where('chainage_from', '<=', $chainageTo)
                            ->where('chainage_to', '>=', $chainageFrom);
                    })->orWhereNull('chainage_from'); // Include objections without chainage
                });
            }
        }

        $objections = $query->with('createdByUser')
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get()
            ->map(function ($objection) {
                return [
                    'id' => $objection->id,
                    'title' => $objection->title,
                    'description' => $objection->description,
                    'category' => $objection->category,
                    'status' => $objection->status,
                    'chainage_from' => $objection->chainage_from,
                    'chainage_to' => $objection->chainage_to,
                    'created_at' => $objection->created_at,
                ];
            });

        return response()->json([
            'objections' => $objections,
        ]);
    }

    /**
     * Display RFI summary.
     */
    public function summary(Request $request): Response
    {
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $summary = $this->rfiService->getPaginated([
            'date_from' => $startDate,
            'date_to' => $endDate,
        ], 50);

        return Inertia::render('Rfi/Summary/Index', [
            'title' => 'RFI Summary',
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
            'status' => ['required', 'string', 'in:'.implode(',', Rfi::$statuses)],
        ]);

        $count = $this->rfiService->bulkUpdateStatus(
            $request->input('ids'),
            $request->input('status')
        );

        return response()->json(['message' => "{$count} RFI(s) updated successfully."]);
    }

    /**
     * Export RFIs.
     */
    public function export(Request $request)
    {
        // TODO: Implement export functionality
        return response()->json(['message' => 'Export functionality coming soon.']);
    }

    /**
     * Display the current user's RFIs (self-service).
     */
    public function myRfis(Request $request): Response
    {
        $userId = auth()->id();

        $filters = array_merge(
            $request->only([
                'search', 'status', 'type', 'inspection_result',
                'date_from', 'date_to',
            ]),
            ['user_id' => $userId]
        );

        $perPage = $request->input('per_page', 15);

        try {
            // Filter RFIs where user is incharge or assigned
            $rfis = Rfi::query()
                ->with(['workLocation', 'inchargeUser', 'assignedUser'])
                ->where(function ($q) use ($userId) {
                    $q->where('incharge_user_id', $userId)
                        ->orWhere('assigned_user_id', $userId);
                })
                ->when($filters['search'] ?? null, function ($q, $search) {
                    $q->where('number', 'like', "%{$search}%");
                })
                ->when($filters['status'] ?? null, function ($q, $status) {
                    $q->where('status', $status);
                })
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);

            // Stats
            $stats = [
                'total' => Rfi::where(function ($q) use ($userId) {
                    $q->where('incharge_user_id', $userId)
                        ->orWhere('assigned_user_id', $userId);
                })->count(),
                'pending' => Rfi::where('status', 'pending')
                    ->where(function ($q) use ($userId) {
                        $q->where('incharge_user_id', $userId)
                            ->orWhere('assigned_user_id', $userId);
                    })->count(),
                'approved' => Rfi::where('status', 'approved')
                    ->where(function ($q) use ($userId) {
                        $q->where('incharge_user_id', $userId)
                            ->orWhere('assigned_user_id', $userId);
                    })->count(),
            ];
            $statuses = Rfi::$statuses;
        } catch (\Exception $e) {
            // Handle case where table might not exist or have issues
            $rfis = new \Illuminate\Pagination\LengthAwarePaginator([], 0, $perPage, 1);
            $stats = ['total' => 0, 'pending' => 0, 'approved' => 0];
            $statuses = [];
        }

        return Inertia::render('Rfi/SelfService/MyRfis', [
            'title' => 'My RFIs',
            'rfis' => $rfis,
            'stats' => $stats,
            'filters' => $filters,
            'statuses' => $statuses,
        ]);
    }

    /**
     * Display the current user's inspections (self-service).
     */
    public function myInspections(Request $request): Response
    {
        $userId = auth()->id();

        $filters = $request->only(['search', 'inspection_result', 'date_from', 'date_to']);

        try {
            // Inspections are RFIs where user performed the inspection
            $inspections = Rfi::query()
                ->with(['workLocation', 'inchargeUser'])
                ->where('assigned_user_id', $userId)
                ->whereNotNull('inspection_result')
                ->when($filters['inspection_result'] ?? null, function ($q, $result) {
                    $q->where('inspection_result', $result);
                })
                ->when($filters['search'] ?? null, function ($q, $search) {
                    $q->where('number', 'like', "%{$search}%");
                })
                ->orderBy('date', 'desc')
                ->paginate(15);

            $stats = [
                'total' => Rfi::where('assigned_user_id', $userId)->whereNotNull('inspection_result')->count(),
                'passed' => Rfi::where('assigned_user_id', $userId)->where('inspection_result', 'passed')->count(),
                'failed' => Rfi::where('assigned_user_id', $userId)->where('inspection_result', 'failed')->count(),
                'on_hold' => Rfi::where('assigned_user_id', $userId)->where('inspection_result', 'on_hold')->count(),
            ];
            $inspectionResults = Rfi::$inspectionResults;
        } catch (\Exception $e) {
            // Handle case where table might not exist or have issues
            $inspections = new \Illuminate\Pagination\LengthAwarePaginator([], 0, 15, 1);
            $stats = ['total' => 0, 'passed' => 0, 'failed' => 0, 'on_hold' => 0];
            $inspectionResults = [];
        }

        return Inertia::render('Rfi/SelfService/MyInspections', [
            'title' => 'My Inspections',
            'inspections' => $inspections,
            'stats' => $stats,
            'filters' => $filters,
            'inspectionResults' => $inspectionResults,
        ]);
    }
}
