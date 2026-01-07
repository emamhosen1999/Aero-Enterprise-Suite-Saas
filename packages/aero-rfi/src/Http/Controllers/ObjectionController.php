<?php

namespace Aero\Rfi\Http\Controllers;

use Aero\Core\Models\User;
use Aero\Rfi\Http\Requests\Objection\StoreObjectionRequest;
use Aero\Rfi\Http\Requests\Objection\UpdateObjectionRequest;
use Aero\Rfi\Models\Objection;
use Aero\Rfi\Services\ObjectionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ObjectionController
 *
 * Handles Objection CRUD and workflow operations.
 */
class ObjectionController extends Controller
{
    public function __construct(
        protected ObjectionService $objectionService
    ) {}

    /**
     * Display a listing of objections.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only([
            'search', 'status', 'category', 'created_by', 'resolved_by',
            'active_only', 'resolved_only', 'created_from', 'created_to',
            'sort_by', 'sort_direction',
        ]);

        $perPage = $request->input('per_page', 15);
        $objections = $this->objectionService->getPaginated($filters, $perPage);

        return Inertia::render('Rfi/Objections/Index', [
            'title' => 'Objections',
            'objections' => $objections,
            'filters' => $filters,
            'statuses' => Objection::$statuses,
            'statusLabels' => Objection::$statusLabels,
            'categories' => Objection::$categories,
            'categoryLabels' => Objection::$categoryLabels,
            'users' => User::select(['id', 'name'])->orderBy('name')->get(),
        ]);
    }

    /**
     * Show the form for creating a new objection.
     */
    public function create(): Response
    {
        return Inertia::render('Rfi/Objections/Create/Index', [
            'title' => 'Create Objection',
            'categories' => Objection::$categories,
            'categoryLabels' => Objection::$categoryLabels,
        ]);
    }

    /**
     * Store a newly created objection.
     */
    public function store(StoreObjectionRequest $request): RedirectResponse
    {
        $objection = $this->objectionService->create(
            $request->validated(),
            $request->input('attach_to_rfi_ids')
        );

        // Handle file uploads if present
        if ($request->hasFile('files')) {
            $this->objectionService->uploadFiles($objection, $request->file('files'));
        }

        return redirect()
            ->route('rfi.objections.show', $objection)
            ->with('success', 'Objection created successfully.');
    }

    /**
     * Display the specified objection.
     */
    public function show(Objection $objection): Response
    {
        $objection->load([
            'createdByUser',
            'updatedByUser',
            'resolvedByUser',
            'overriddenByUser',
            'rfis.inchargeUser',
            'statusLogs.changedByUser',
        ]);

        return Inertia::render('Rfi/Objections/Show/Index', [
            'title' => "Objection: {$objection->title}",
            'objection' => $objection,
            'files' => $objection->files,
            'statuses' => Objection::$statuses,
            'statusLabels' => Objection::$statusLabels,
            'categoryLabels' => Objection::$categoryLabels,
        ]);
    }

    /**
     * Show the form for editing the objection.
     */
    public function edit(Objection $objection): Response
    {
        // Only allow editing of draft objections
        if ($objection->status !== Objection::STATUS_DRAFT) {
            return Inertia::render('Error/Index', [
                'status' => 403,
                'message' => 'Only draft objections can be edited.',
            ]);
        }

        return Inertia::render('Rfi/Objections/Edit/Index', [
            'title' => "Edit Objection: {$objection->title}",
            'objection' => $objection,
            'categories' => Objection::$categories,
            'categoryLabels' => Objection::$categoryLabels,
        ]);
    }

    /**
     * Update the specified objection.
     */
    public function update(UpdateObjectionRequest $request, Objection $objection): RedirectResponse
    {
        $this->objectionService->update($objection, $request->validated());

        return redirect()
            ->route('rfi.objections.show', $objection)
            ->with('success', 'Objection updated successfully.');
    }

    /**
     * Remove the specified objection.
     */
    public function destroy(Objection $objection): RedirectResponse
    {
        try {
            $this->objectionService->delete($objection);

            return redirect()
                ->route('rfi.objections.index')
                ->with('success', 'Objection deleted successfully.');
        } catch (\InvalidArgumentException $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Submit objection for review.
     */
    public function submit(Request $request, Objection $objection): RedirectResponse
    {
        try {
            $this->objectionService->submit($objection, $request->input('notes'));

            return redirect()
                ->route('rfi.objections.show', $objection)
                ->with('success', 'Objection submitted for review.');
        } catch (\InvalidArgumentException $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Start review of objection.
     */
    public function startReview(Request $request, Objection $objection): RedirectResponse
    {
        try {
            $this->objectionService->startReview($objection, $request->input('notes'));

            return redirect()
                ->route('rfi.objections.show', $objection)
                ->with('success', 'Objection is now under review.');
        } catch (\InvalidArgumentException $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Resolve the objection.
     */
    public function resolve(Request $request, Objection $objection): RedirectResponse
    {
        $request->validate([
            'resolution_notes' => ['required', 'string', 'max:5000'],
        ]);

        try {
            $this->objectionService->resolve($objection, $request->input('resolution_notes'));

            return redirect()
                ->route('rfi.objections.show', $objection)
                ->with('success', 'Objection resolved successfully.');
        } catch (\InvalidArgumentException $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Reject the objection.
     */
    public function reject(Request $request, Objection $objection): RedirectResponse
    {
        $request->validate([
            'rejection_reason' => ['required', 'string', 'max:5000'],
        ]);

        try {
            $this->objectionService->reject($objection, $request->input('rejection_reason'));

            return redirect()
                ->route('rfi.objections.show', $objection)
                ->with('success', 'Objection rejected.');
        } catch (\InvalidArgumentException $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Upload files to objection.
     */
    public function uploadFiles(Request $request, Objection $objection): JsonResponse
    {
        $request->validate([
            'files' => ['required', 'array'],
            'files.*' => ['file', 'mimes:jpeg,jpg,png,webp,gif,pdf,doc,docx,xls,xlsx,dwg,dxf', 'max:20480'],
        ]);

        $uploaded = $this->objectionService->uploadFiles($objection, $request->file('files'));

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
     * Delete a file from objection.
     */
    public function deleteFile(Objection $objection, int $mediaId): JsonResponse
    {
        $deleted = $this->objectionService->deleteFile($objection, $mediaId);

        if (! $deleted) {
            return response()->json(['message' => 'File not found.'], 404);
        }

        return response()->json(['message' => 'File deleted successfully.']);
    }

    /**
     * Attach objection to RFIs.
     */
    public function attachToRfis(Request $request, Objection $objection): JsonResponse
    {
        $request->validate([
            'rfi_ids' => ['required', 'array'],
            'rfi_ids.*' => ['integer', 'exists:daily_works,id'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $this->objectionService->attachToRfis(
            $objection,
            $request->input('rfi_ids'),
            $request->input('notes')
        );

        return response()->json(['message' => 'Objection attached to RFIs successfully.']);
    }

    /**
     * Detach objection from RFIs.
     */
    public function detachFromRfis(Request $request, Objection $objection): JsonResponse
    {
        $request->validate([
            'rfi_ids' => ['required', 'array'],
            'rfi_ids.*' => ['integer', 'exists:daily_works,id'],
        ]);

        $count = $this->objectionService->detachFromRfis($objection, $request->input('rfi_ids'));

        return response()->json(['message' => "{$count} RFI(s) detached successfully."]);
    }

    /**
     * Get suggested RFIs based on chainage.
     */
    public function suggestRfis(Objection $objection): JsonResponse
    {
        $suggestions = $this->objectionService->getSuggestedRfis($objection);

        return response()->json([
            'suggestions' => $suggestions->map(fn ($rfi) => [
                'id' => $rfi->id,
                'number' => $rfi->number,
                'location' => $rfi->location,
                'type' => $rfi->type,
                'status' => $rfi->status,
            ]),
        ]);
    }

    /**
     * Get objections pending review.
     */
    public function pendingReview(Request $request): Response
    {
        $perPage = $request->input('per_page', 15);
        $objections = $this->objectionService->getPendingReview($perPage);

        return Inertia::render('Rfi/Objections/PendingReview/Index', [
            'title' => 'Objections Pending Review',
            'objections' => $objections,
            'categoryLabels' => Objection::$categoryLabels,
        ]);
    }

    /**
     * Get objection statistics.
     */
    public function statistics(): JsonResponse
    {
        $stats = $this->objectionService->getStatistics();

        return response()->json($stats);
    }
}
