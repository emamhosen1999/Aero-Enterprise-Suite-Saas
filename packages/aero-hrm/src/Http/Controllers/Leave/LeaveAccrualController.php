<?php

namespace Aero\HRM\Http\Controllers\Leave;

use Aero\HRM\Http\Controllers\Controller;
use Aero\HRM\Http\Requests\StoreLeaveAccrualRuleRequest;
use Aero\HRM\Http\Requests\UpdateLeaveAccrualRuleRequest;
use Aero\HRM\Models\LeaveAccrualRule;
use Aero\HRM\Models\LeaveSetting;
use Aero\HRM\Services\Leave\LeaveAccrualService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LeaveAccrualController extends Controller
{
    public function __construct(protected LeaveAccrualService $accrualService) {}

    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'status', 'per_page']);
        $perPage = (int) ($filters['per_page'] ?? 15);

        $rulesQuery = LeaveAccrualRule::query()->with('leaveType');

        if (! empty($filters['search'])) {
            $rulesQuery->where('name', 'like', '%'.$filters['search'].'%');
        }

        if (isset($filters['status']) && $filters['status'] !== '') {
            $rulesQuery->where('is_active', (bool) $filters['status']);
        }

        $rules = $rulesQuery->latest()->paginate($perPage)->withQueryString();

        return Inertia::render('HRM/Leaves/AccrualRules', [
            'title' => 'Leave Accrual Engine',
            'rules' => $rules,
            'leaveTypes' => LeaveSetting::query()->where('is_active', true)->orderBy('name')->get(),
            'stats' => $this->accrualService->getStats(),
            'filters' => $filters,
        ]);
    }

    public function store(StoreLeaveAccrualRuleRequest $request): RedirectResponse
    {
        LeaveAccrualRule::query()->create($request->validated());

        return redirect()->route('hrm.leaves.accrual.index')
            ->with('success', 'Accrual rule created successfully.');
    }

    public function update(UpdateLeaveAccrualRuleRequest $request, LeaveAccrualRule $rule): RedirectResponse
    {
        $rule->update($request->validated());

        return redirect()->route('hrm.leaves.accrual.index')
            ->with('success', 'Accrual rule updated successfully.');
    }

    public function destroy(LeaveAccrualRule $rule): RedirectResponse
    {
        $rule->delete();

        return redirect()->route('hrm.leaves.accrual.index')
            ->with('success', 'Accrual rule deleted successfully.');
    }

    public function processAccruals(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'month' => ['nullable', 'string', 'date_format:Y-m'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'dry_run' => ['boolean'],
        ]);

        $month = $validated['month'] ?? now()->format('Y-m');
        $userId = $validated['user_id'] ?? null;
        $dryRun = $validated['dry_run'] ?? false;

        $result = $this->accrualService->processAccruals($month, $userId, $dryRun);

        return response()->json([
            'data' => $result,
            'message' => $dryRun
                ? "Dry run complete for {$month}."
                : "Accruals processed for {$month}.",
        ]);
    }

    public function history(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'leave_type_id' => ['nullable', 'integer', 'exists:leave_settings,id'],
            'from_date' => ['nullable', 'date'],
            'to_date' => ['nullable', 'date', 'after_or_equal:from_date'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        /** @var \Aero\Core\Models\User $authUser */
        $authUser = $request->user();

        // Admins may filter by any user; regular employees only see their own history
        $targetUserId = (isset($validated['user_id']) && $authUser->hasRole('admin'))
            ? (int) $validated['user_id']
            : $authUser->id;

        $paginated = $this->accrualService->getHistory($targetUserId, $validated);

        return response()->json([
            'items' => $paginated->items(),
            'total' => $paginated->total(),
            'currentPage' => $paginated->currentPage(),
            'lastPage' => $paginated->lastPage(),
            'perPage' => $paginated->perPage(),
        ]);
    }

    public function manualAdjustment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'leave_type_id' => ['required', 'integer', 'exists:leave_settings,id'],
            'days' => ['required', 'numeric'],
            'notes' => ['required', 'string', 'max:1000'],
        ]);

        $transaction = $this->accrualService->manualAdjustment(
            (int) $validated['user_id'],
            (int) $validated['leave_type_id'],
            (float) $validated['days'],
            $validated['notes'],
            $request->user()->id
        );

        return response()->json([
            'data' => $transaction->load(['leaveType', 'creator']),
            'message' => 'Manual adjustment recorded successfully.',
        ]);
    }
}
