<?php

namespace Aero\Rfi\Http\Controllers;

use Aero\Core\Models\User;
use Aero\Rfi\Http\Requests\WorkLocation\StoreWorkLocationRequest;
use Aero\Rfi\Http\Requests\WorkLocation\UpdateWorkLocationRequest;
use Aero\Rfi\Models\WorkLocation;
use Aero\Rfi\Services\DailyWorkService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

/**
 * WorkLocationController
 *
 * Handles Work Location CRUD operations.
 */
class WorkLocationController extends Controller
{
    public function __construct(
        protected DailyWorkService $dailyWorkService
    ) {}

    /**
     * Display a listing of work locations.
     */
    public function index(Request $request): Response
    {
        $query = WorkLocation::query()
            ->with(['inchargeUser'])
            ->withCount('dailyWorks');

        // Apply filters
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('start_chainage', 'like', "%{$search}%")
                    ->orWhere('end_chainage', 'like', "%{$search}%");
            });
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->filled('incharge_user_id')) {
            $query->where('incharge_user_id', $request->input('incharge_user_id'));
        }

        $workLocations = $query->orderBy('name')->paginate($request->input('per_page', 15));

        return Inertia::render('Rfi/WorkLocations/Index', [
            'title' => 'Work Locations',
            'workLocations' => $workLocations,
            'filters' => $request->only(['search', 'is_active', 'incharge_user_id']),
            'users' => User::select(['id', 'name'])->orderBy('name')->get(),
        ]);
    }

    /**
     * Show the form for creating a new work location.
     */
    public function create(): Response
    {
        return Inertia::render('Rfi/WorkLocations/Create/Index', [
            'title' => 'Create Work Location',
            'users' => User::select(['id', 'name'])->orderBy('name')->get(),
        ]);
    }

    /**
     * Store a newly created work location.
     */
    public function store(StoreWorkLocationRequest $request): RedirectResponse
    {
        $workLocation = WorkLocation::create($request->validated());

        return redirect()
            ->route('rfi.work-locations.show', $workLocation)
            ->with('success', 'Work location created successfully.');
    }

    /**
     * Display the specified work location.
     */
    public function show(WorkLocation $workLocation): Response
    {
        $workLocation->load(['inchargeUser']);

        return Inertia::render('Rfi/WorkLocations/Show/Index', [
            'title' => "Work Location: {$workLocation->name}",
            'workLocation' => $workLocation,
            'dailyWorksCount' => $workLocation->dailyWorks()->count(),
            'pendingCount' => $workLocation->dailyWorks()->pending()->count(),
            'completedCount' => $workLocation->dailyWorks()->completed()->count(),
        ]);
    }

    /**
     * Show the form for editing the work location.
     */
    public function edit(WorkLocation $workLocation): Response
    {
        return Inertia::render('Rfi/WorkLocations/Edit/Index', [
            'title' => "Edit Work Location: {$workLocation->name}",
            'workLocation' => $workLocation,
            'users' => User::select(['id', 'name'])->orderBy('name')->get(),
        ]);
    }

    /**
     * Update the specified work location.
     */
    public function update(UpdateWorkLocationRequest $request, WorkLocation $workLocation): RedirectResponse
    {
        $workLocation->update($request->validated());

        return redirect()
            ->route('rfi.work-locations.show', $workLocation)
            ->with('success', 'Work location updated successfully.');
    }

    /**
     * Remove the specified work location.
     */
    public function destroy(WorkLocation $workLocation): RedirectResponse
    {
        // Prevent deletion if has daily works
        if ($workLocation->dailyWorks()->count() > 0) {
            return redirect()
                ->back()
                ->with('error', 'Cannot delete work location with associated daily works.');
        }

        $workLocation->delete();

        return redirect()
            ->route('rfi.work-locations.index')
            ->with('success', 'Work location deleted successfully.');
    }

    /**
     * Get daily works for a work location.
     */
    public function dailyWorks(Request $request, WorkLocation $workLocation): Response
    {
        $filters = $request->only([
            'search', 'status', 'type', 'date_from', 'date_to',
            'sort_by', 'sort_direction',
        ]);

        $dailyWorks = $this->dailyWorkService->getByWorkLocation(
            $workLocation->id,
            $filters,
            $request->input('per_page', 15)
        );

        return Inertia::render('Rfi/WorkLocations/DailyWorks/Index', [
            'title' => "Daily Works - {$workLocation->name}",
            'workLocation' => $workLocation,
            'dailyWorks' => $dailyWorks,
            'filters' => $filters,
        ]);
    }

    /**
     * Find work locations by chainage.
     */
    public function findByChainage(Request $request): JsonResponse
    {
        $request->validate([
            'chainage' => ['required', 'string'],
        ]);

        $locations = WorkLocation::findByChainageRange($request->input('chainage'));

        return response()->json([
            'locations' => $locations->map(fn ($loc) => [
                'id' => $loc->id,
                'name' => $loc->name,
                'chainage_range' => $loc->chainage_range,
                'incharge' => $loc->inchargeUser?->name,
            ]),
        ]);
    }
}
