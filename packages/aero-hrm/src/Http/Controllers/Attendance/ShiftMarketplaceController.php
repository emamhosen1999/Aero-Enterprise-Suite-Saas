<?php

namespace Aero\HRM\Http\Controllers\Attendance;

use Aero\HRM\Http\Controllers\Controller;
use Aero\HRM\Http\Requests\CreateShiftSwapRequest;
use Aero\HRM\Models\Department;
use Aero\HRM\Models\ShiftSwapRequest;
use Aero\HRM\Services\Attendance\ShiftMarketplaceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Controller for shift marketplace operations.
 *
 * Manages shift swap requests, open pickups, and marketplace listings.
 */
class ShiftMarketplaceController extends Controller
{
    public function __construct(protected ShiftMarketplaceService $service) {}

    /**
     * Display shift marketplace with open listings.
     */
    public function index(Request $request): Response
    {
        $filters = [
            'search' => $request->get('search'),
            'status' => $request->get('status'),
            'per_page' => $request->get('per_page', 30),
        ];

        $listings = $this->service->getOpenListings($filters);
        $userSwaps = $this->service->getUserActiveRequests(auth()->id());
        $departments = Department::query()->select(['id', 'name'])->get();

        return Inertia::render('HRM/Attendance/ShiftMarketplace', [
            'title' => 'Shift Marketplace',
            'listings' => [
                'data' => $listings->items(),
                'total' => $listings->total(),
                'per_page' => $listings->perPage(),
                'current_page' => $listings->currentPage(),
                'last_page' => $listings->lastPage(),
            ],
            'userSwaps' => $userSwaps,
            'departments' => $departments,
            'filters' => $filters,
        ]);
    }

    /**
     * Store a new shift swap request.
     */
    public function store(CreateShiftSwapRequest $request): JsonResponse
    {
        try {
            $swap = $this->service->createSwapRequest(
                requesterUserId: auth()->id(),
                shiftScheduleId: (int)$request->shift_schedule_id,
                requestType: $request->request_type,
                reason: $request->reason,
                acceptorUserId: $request->acceptor_id ? (int)$request->acceptor_id : null,
                replacementShiftId: $request->replacement_shift_id ? (int)$request->replacement_shift_id : null,
            );

            return response()->json([
                'success' => true,
                'swap' => $swap->load([
                    'requester:id,name,email,avatar_url',
                    'shiftSchedule:id,name,start_time,end_time',
                    'acceptor:id,name',
                ]),
                'message' => 'Shift swap request created successfully.',
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to create shift swap request', [
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create shift swap request.',
            ], 500);
        }
    }

    /**
     * Accept a shift swap request (employee side).
     */
    public function accept(ShiftSwapRequest $swap, Request $request): JsonResponse
    {
        try {
            // Verify swap is still open for accepting
            if (!$swap->isOpen() && !$swap->isPending()) {
                return response()->json([
                    'success' => false,
                    'message' => 'This swap request is no longer available.',
                ], 400);
            }

            // Prevent requester from accepting their own request
            if ($swap->requester_id === auth()->id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'You cannot accept your own swap request.',
                ], 403);
            }

            // For two-way swaps, require replacement shift confirmation
            if ($swap->isSpecificSwap() && $swap->replacement_shift_id && !$request->has('accept_shift_id')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Confirmation of exchange shift is required.',
                ], 400);
            }

            $updatedSwap = $this->service->acceptSwapRequest($swap, auth()->id());

            return response()->json([
                'success' => true,
                'swap' => $updatedSwap->load([
                    'requester:id,name,email,avatar_url',
                    'shiftSchedule:id,name,start_time,end_time',
                    'acceptor:id,name',
                ]),
                'message' => 'You have accepted this shift swap.',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to accept shift swap request', [
                'user_id' => auth()->id(),
                'swap_id' => $swap->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to accept shift swap request.',
            ], 500);
        }
    }

    /**
     * Approve a shift swap request (manager side).
     */
    public function approve(ShiftSwapRequest $swap): JsonResponse
    {
        try {
            // Verify swap is pending approval
            if (!$swap->isPending()) {
                return response()->json([
                    'success' => false,
                    'message' => 'This swap request cannot be approved in its current state.',
                ], 400);
            }

            // Authorization: check if user has approval permission via HRMAC middleware (already checked by route)
            $this->service->approveSwapRequest($swap, auth()->id());

            return response()->json([
                'success' => true,
                'swap' => $swap->fresh()->load([
                    'requester:id,name,email,avatar_url',
                    'shiftSchedule:id,name,start_time,end_time',
                    'acceptor:id,name',
                ]),
                'message' => 'Shift swap approved successfully.',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to approve shift swap request', [
                'user_id' => auth()->id(),
                'swap_id' => $swap->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to approve shift swap request.',
            ], 500);
        }
    }

    /**
     * Reject a shift swap request (manager side).
     */
    public function reject(ShiftSwapRequest $swap, Request $request): JsonResponse
    {
        try {
            // Validate rejection reason
            $request->validate([
                'rejection_reason' => ['required', 'string', 'max:500'],
            ]);

            // Verify swap is pending approval
            if (!$swap->isPending()) {
                return response()->json([
                    'success' => false,
                    'message' => 'This swap request cannot be rejected in its current state.',
                ], 400);
            }

            // Authorization: check if user has rejection permission via HRMAC middleware (already checked by route)
            $this->service->rejectSwapRequest(
                $swap,
                auth()->id(),
                $request->rejection_reason
            );

            return response()->json([
                'success' => true,
                'swap' => $swap->fresh()->load([
                    'requester:id,name,email,avatar_url',
                    'shiftSchedule:id,name,start_time,end_time',
                    'acceptor:id,name',
                ]),
                'message' => 'Shift swap rejected successfully.',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to reject shift swap request', [
                'user_id' => auth()->id(),
                'swap_id' => $swap->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to reject shift swap request.',
            ], 500);
        }
    }

    /**
     * Cancel a shift swap request (before approval).
     */
    public function cancel(ShiftSwapRequest $swap): JsonResponse
    {
        try {
            // Verify swap can be cancelled (not already approved/rejected)
            if (!in_array($swap->status, ['open', 'pending'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'This swap request cannot be cancelled.',
                ], 400);
            }

            // Authorization: only requester can cancel their own request
            if ($swap->requester_id !== auth()->id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to cancel this request.',
                ], 403);
            }

            $this->service->cancelSwapRequest($swap, auth()->id());

            return response()->json([
                'success' => true,
                'message' => 'Shift swap request cancelled.',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to cancel shift swap request', [
                'user_id' => auth()->id(),
                'swap_id' => $swap->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel shift swap request.',
            ], 500);
        }
    }

    /**
     * Show shift swap request details.
     */
    public function show(ShiftSwapRequest $swap): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'swap' => $swap->load([
                    'requester:id,name,email,avatar_url',
                    'shiftSchedule:id,name,start_time,end_time',
                    'acceptor:id,name,email',
                    'replacementShift:id,name,start_time,end_time',
                    'approvedByUser:id,name,email',
                ]),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch shift swap details', [
                'swap_id' => $swap->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch shift swap details.',
            ], 500);
        }
    }
}
