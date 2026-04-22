<?php

namespace Aero\HRM\Services\Attendance;

use Aero\Core\Models\User;
use Aero\HRM\Models\ShiftMarketplaceListing;
use Aero\HRM\Models\ShiftSchedule;
use Aero\HRM\Models\ShiftSwapRequest;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Service for managing shift marketplace operations.
 *
 * Handles creation, acceptance, approval, and rejection of shift swap requests.
 */
class ShiftMarketplaceService
{
    /**
     * Create a new shift swap request (open pickup or specific swap).
     *
     * @param int $requesterUserId The user offering their shift
     * @param int $shiftScheduleId The shift being offered
     * @param string $requestType 'open_pickup' or 'specific_swap'
     * @param string $reason Why the employee wants to swap
     * @param int|null $acceptorUserId Employee accepting the swap (for specific_swap)
     * @param int|null $replacementShiftId Shift offered in exchange (for two-way swap)
     */
    public function createSwapRequest(
        int $requesterUserId,
        int $shiftScheduleId,
        string $requestType,
        string $reason,
        ?int $acceptorUserId = null,
        ?int $replacementShiftId = null
    ): ShiftSwapRequest {
        return ShiftSwapRequest::query()->create([
            'requester_id' => $requesterUserId,
            'shift_schedule_id' => $shiftScheduleId,
            'acceptor_id' => $acceptorUserId,
            'replacement_shift_id' => $replacementShiftId,
            'request_type' => $requestType,
            'reason' => $reason,
            'status' => $requestType === 'specific_swap' ? 'pending' : 'open',
        ]);
    }

    /**
     * Accept a pending swap request (employee side).
     *
     * @param ShiftSwapRequest $request The swap request to accept
     * @param int $acceptorUserId The employee accepting the swap
     */
    public function acceptSwapRequest(ShiftSwapRequest $request, int $acceptorUserId): ShiftSwapRequest
    {
        $request->update([
            'acceptor_id' => $acceptorUserId,
            'status' => 'pending',
        ]);

        return $request->fresh();
    }

    /**
     * Approve a swap request (manager side).
     *
     * @param ShiftSwapRequest $request The swap request to approve
     * @param int $managerId The manager approving the swap
     */
    public function approveSwapRequest(ShiftSwapRequest $request, int $managerId): bool
    {
        return $request->update([
            'status' => 'approved',
            'approved_by' => $managerId,
            'started_at' => now(),
        ]);
    }

    /**
     * Reject a swap request (manager side).
     *
     * @param ShiftSwapRequest $request The swap request to reject
     * @param int $managerId The manager rejecting the swap
     * @param string $reason Why the swap was rejected
     */
    public function rejectSwapRequest(ShiftSwapRequest $request, int $managerId, string $reason): bool
    {
        return $request->update([
            'status' => 'rejected',
            'approved_by' => $managerId,
            'rejected_reason' => $reason,
        ]);
    }

    /**
     * Cancel a swap request (before approval).
     *
     * @param ShiftSwapRequest $request The swap request to cancel
     * @param int $cancelledBy The user cancelling the request
     */
    public function cancelSwapRequest(ShiftSwapRequest $request, int $cancelledBy): bool
    {
        return $request->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);
    }

    /**
     * Get open listings for the shift marketplace (paginated).
     *
     * @param array $filters Optional filters: search, status, department_id, shift_date, per_page
     */
    public function getOpenListings(array $filters = []): LengthAwarePaginator
    {
        $perPage = $filters['per_page'] ?? 30;

        $query = ShiftSwapRequest::query()
            ->with([
                'requester:id,name,email,avatar_url',
                'shiftSchedule:id,name,start_time,end_time',
                'acceptor:id,name',
            ])
            ->whereIn('status', ['open', 'pending']);

        // Filter by status
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // Filter by search (employee name or shift name)
        if (!empty($filters['search'])) {
            $query->whereHas('requester', function ($q) use ($filters) {
                $q->where('name', 'like', "%{$filters['search']}%")
                    ->orWhere('email', 'like', "%{$filters['search']}%");
            })
            ->orWhereHas('shiftSchedule', function ($q) use ($filters) {
                $q->where('name', 'like', "%{$filters['search']}%");
            });
        }

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    /**
     * Get a user's active and completed swaps.
     */
    public function getUserSwaps(int $userId): Collection
    {
        return ShiftSwapRequest::query()
            ->where(function ($q) use ($userId) {
                $q->where('requester_id', $userId)
                    ->orWhere('acceptor_id', $userId);
            })
            ->whereIn('status', ['approved', 'completed'])
            ->with([
                'requester:id,name,email',
                'acceptor:id,name,email',
                'shiftSchedule:id,name,start_time,end_time',
            ])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get user's active swap requests (pending or awaiting approval).
     */
    public function getUserActiveRequests(int $userId): Collection
    {
        return ShiftSwapRequest::query()
            ->requestedBy($userId)
            ->whereIn('status', ['open', 'pending'])
            ->with([
                'requester:id,name,email',
                'acceptor:id,name,email',
                'shiftSchedule:id,name,start_time,end_time',
            ])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Mark a swap as completed (after shift day has passed).
     */
    public function completeSwap(ShiftSwapRequest $request): bool
    {
        return $request->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);
    }
}
