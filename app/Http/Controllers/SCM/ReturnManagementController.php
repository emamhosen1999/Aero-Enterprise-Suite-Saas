<?php

namespace App\Http\Controllers\SCM;

use App\Http\Controllers\Controller;
use App\Models\SCM\ReturnRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class ReturnManagementController extends Controller
{
    public function index()
    {
        return Inertia::render('SCM/ReturnManagement/Index', [
            'returns' => ReturnRequest::with(['requester', 'approver', 'returnable'])
                ->latest()
                ->paginate(15),
            'stats' => [
                'total_returns' => ReturnRequest::count(),
                'pending_approval' => ReturnRequest::where('status', 'requested')->count(),
                'approved_returns' => ReturnRequest::where('status', 'approved')->count(),
                'completed_returns' => ReturnRequest::where('status', 'completed')->count(),
                'total_refund_amount' => ReturnRequest::where('status', 'completed')->sum('refund_amount'),
            ],
            'status' => session('status'),
        ]);
    }

    public function create()
    {
        return Inertia::render('SCM/ReturnManagement/Create', [
            'nextRmaNumber' => $this->generateRmaNumber(),
            'returnTypes' => [
                'defective' => 'Defective Item',
                'wrong_item' => 'Wrong Item Received',
                'overage' => 'Overage/Extra Items',
                'damaged' => 'Damaged in Transit',
                'expired' => 'Expired Product',
                'other' => 'Other Reason',
            ],
            'conditions' => [
                'new' => 'New/Unused',
                'used' => 'Used',
                'damaged' => 'Damaged',
                'defective' => 'Defective',
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'rma_number' => 'required|string|unique:return_requests,rma_number',
            'returnable_type' => 'required|string',
            'returnable_id' => 'required|integer',
            'return_type' => 'required|string|in:defective,wrong_item,overage,damaged,expired,other',
            'reason' => 'required|string',
            'quantity_returned' => 'required|numeric|min:1',
            'condition' => 'required|string|in:new,used,damaged,defective',
            'expected_return_date' => 'nullable|date|after:today',
            'notes' => 'nullable|string',
        ]);

        ReturnRequest::create(array_merge($validated, [
            'requested_by' => Auth::id(),
            'status' => 'requested',
        ]));

        return Redirect::route('scm.return-management.index')->with('status', 'Return request created successfully.');
    }

    public function show(ReturnRequest $returnRequest)
    {
        $returnRequest->load(['requester', 'approver', 'returnable']);

        return Inertia::render('SCM/ReturnManagement/Show', [
            'return' => $returnRequest,
            'isOverdue' => $returnRequest->isOverdue(),
        ]);
    }

    public function edit(ReturnRequest $returnRequest)
    {
        if (! in_array($returnRequest->status, ['requested'])) {
            return Redirect::route('scm.return-management.index')->with('error', 'Only pending returns can be edited.');
        }

        return Inertia::render('SCM/ReturnManagement/Edit', [
            'return' => $returnRequest,
            'returnTypes' => [
                'defective' => 'Defective Item',
                'wrong_item' => 'Wrong Item Received',
                'overage' => 'Overage/Extra Items',
                'damaged' => 'Damaged in Transit',
                'expired' => 'Expired Product',
                'other' => 'Other Reason',
            ],
            'conditions' => [
                'new' => 'New/Unused',
                'used' => 'Used',
                'damaged' => 'Damaged',
                'defective' => 'Defective',
            ],
        ]);
    }

    public function update(Request $request, ReturnRequest $returnRequest)
    {
        if (! in_array($returnRequest->status, ['requested'])) {
            return Redirect::route('scm.return-management.index')->with('error', 'Only pending returns can be updated.');
        }

        $validated = $request->validate([
            'return_type' => 'required|string|in:defective,wrong_item,overage,damaged,expired,other',
            'reason' => 'required|string',
            'quantity_returned' => 'required|numeric|min:1',
            'condition' => 'required|string|in:new,used,damaged,defective',
            'expected_return_date' => 'nullable|date|after:today',
            'notes' => 'nullable|string',
        ]);

        $returnRequest->update($validated);

        return Redirect::route('scm.return-management.index')->with('status', 'Return request updated successfully.');
    }

    public function destroy(ReturnRequest $returnRequest)
    {
        if (! in_array($returnRequest->status, ['requested'])) {
            return Redirect::route('scm.return-management.index')->with('error', 'Only pending returns can be deleted.');
        }

        $returnRequest->delete();

        return Redirect::route('scm.return-management.index')->with('status', 'Return request deleted successfully.');
    }

    public function approve(Request $request, ReturnRequest $returnRequest)
    {
        if ($returnRequest->status !== 'requested') {
            return Redirect::back()->with('error', 'Return is not pending approval.');
        }

        $validated = $request->validate([
            'expected_return_date' => 'nullable|date|after:today',
            'notes' => 'nullable|string',
        ]);

        $returnRequest->update([
            'status' => 'approved',
            'approver_id' => Auth::id(),
            'approved_at' => now(),
            'expected_return_date' => $validated['expected_return_date'],
            'notes' => $validated['notes'],
        ]);

        return Redirect::back()->with('status', 'Return request approved successfully.');
    }

    public function reject(Request $request, ReturnRequest $returnRequest)
    {
        if ($returnRequest->status !== 'requested') {
            return Redirect::back()->with('error', 'Return is not pending approval.');
        }

        $validated = $request->validate([
            'notes' => 'required|string',
        ]);

        $returnRequest->update([
            'status' => 'rejected',
            'approver_id' => Auth::id(),
            'approved_at' => now(),
            'notes' => $validated['notes'],
        ]);

        return Redirect::back()->with('status', 'Return request rejected.');
    }

    public function markInTransit(ReturnRequest $returnRequest)
    {
        if ($returnRequest->status !== 'approved') {
            return Redirect::back()->with('error', 'Only approved returns can be marked as in transit.');
        }

        $returnRequest->update(['status' => 'in_transit']);

        return Redirect::back()->with('status', 'Return marked as in transit.');
    }

    public function markReceived(Request $request, ReturnRequest $returnRequest)
    {
        if ($returnRequest->status !== 'in_transit') {
            return Redirect::back()->with('error', 'Only in-transit returns can be marked as received.');
        }

        $validated = $request->validate([
            'actual_return_date' => 'required|date|before_or_equal:today',
            'condition' => 'required|string|in:new,used,damaged,defective',
            'notes' => 'nullable|string',
        ]);

        $returnRequest->update([
            'status' => 'received',
            'actual_return_date' => $validated['actual_return_date'],
            'condition' => $validated['condition'],
            'notes' => $validated['notes'],
        ]);

        return Redirect::back()->with('status', 'Return marked as received.');
    }

    public function process(Request $request, ReturnRequest $returnRequest)
    {
        if ($returnRequest->status !== 'received') {
            return Redirect::back()->with('error', 'Only received returns can be processed.');
        }

        $validated = $request->validate([
            'resolution' => 'required|string|in:refund,replacement,credit,disposal,repair',
            'refund_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $returnRequest->update([
            'status' => 'processed',
            'resolution' => $validated['resolution'],
            'refund_amount' => $validated['refund_amount'],
            'notes' => $validated['notes'],
        ]);

        return Redirect::back()->with('status', 'Return processed successfully.');
    }

    public function complete(ReturnRequest $returnRequest)
    {
        if ($returnRequest->status !== 'processed') {
            return Redirect::back()->with('error', 'Only processed returns can be completed.');
        }

        $returnRequest->update(['status' => 'completed']);

        return Redirect::back()->with('status', 'Return completed successfully.');
    }

    private function generateRmaNumber()
    {
        $lastReturn = ReturnRequest::latest('id')->first();
        $nextNumber = $lastReturn ? (int) substr($lastReturn->rma_number, 4) + 1 : 1;

        return 'RMA-'.str_pad($nextNumber, 6, '0', STR_PAD_LEFT);
    }
}
