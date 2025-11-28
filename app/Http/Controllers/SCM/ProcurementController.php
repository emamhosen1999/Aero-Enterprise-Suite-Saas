<?php

namespace App\Http\Controllers\SCM;

use App\Http\Controllers\Controller;
use App\Models\HRM\Department;
use App\Models\SCM\ProcurementRequest;
use App\Models\SCM\ProcurementRequestItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class ProcurementController extends Controller
{
    public function index()
    {
        return Inertia::render('SCM/Procurement/Index', [
            'requests' => ProcurementRequest::with(['requester', 'department', 'approver', 'items'])
                ->latest()
                ->paginate(15),
            'stats' => [
                'total_requests' => ProcurementRequest::count(),
                'pending_approval' => ProcurementRequest::where('status', 'submitted')->count(),
                'approved' => ProcurementRequest::where('status', 'approved')->count(),
                'completed' => ProcurementRequest::where('status', 'completed')->count(),
            ],
            'status' => session('status'),
        ]);
    }

    public function create()
    {
        return Inertia::render('SCM/Procurement/Create', [
            'departments' => Department::select('id', 'name')->get(),
            'nextRequestNumber' => $this->generateRequestNumber(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'request_number' => 'required|string|unique:procurement_requests,request_number',
            'department_id' => 'nullable|exists:departments,id',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'estimated_budget' => 'nullable|numeric|min:0',
            'required_by' => 'required|date|after:today',
            'priority' => 'required|string|in:low,medium,high,urgent',
            'items' => 'required|array|min:1',
            'items.*.item_name' => 'required|string|max:255',
            'items.*.specifications' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:1',
            'items.*.unit_of_measure' => 'required|string|max:50',
            'items.*.estimated_unit_price' => 'nullable|numeric|min:0',
            'items.*.notes' => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated) {
            $procurementRequest = ProcurementRequest::create([
                'request_number' => $validated['request_number'],
                'requester_id' => Auth::id(),
                'department_id' => $validated['department_id'],
                'title' => $validated['title'],
                'description' => $validated['description'],
                'estimated_budget' => $validated['estimated_budget'],
                'required_by' => $validated['required_by'],
                'priority' => $validated['priority'],
                'status' => 'draft',
            ]);

            foreach ($validated['items'] as $item) {
                ProcurementRequestItem::create([
                    'procurement_request_id' => $procurementRequest->id,
                    'item_name' => $item['item_name'],
                    'specifications' => $item['specifications'],
                    'quantity' => $item['quantity'],
                    'unit_of_measure' => $item['unit_of_measure'],
                    'estimated_unit_price' => $item['estimated_unit_price'] ?? null,
                    'notes' => $item['notes'] ?? null,
                ]);
            }
        });

        return Redirect::route('scm.procurement.index')->with('status', 'Procurement request created successfully.');
    }

    public function show(ProcurementRequest $procurementRequest)
    {
        $procurementRequest->load(['requester', 'department', 'approver', 'items']);

        return Inertia::render('SCM/Procurement/Show', [
            'request' => $procurementRequest,
        ]);
    }

    public function edit(ProcurementRequest $procurementRequest)
    {
        if (! $procurementRequest->canEdit()) {
            return Redirect::route('scm.procurement.index')->with('error', 'Only draft requests can be edited.');
        }

        $procurementRequest->load(['items']);

        return Inertia::render('SCM/Procurement/Edit', [
            'request' => $procurementRequest,
            'departments' => Department::select('id', 'name')->get(),
        ]);
    }

    public function update(Request $request, ProcurementRequest $procurementRequest)
    {
        if (! $procurementRequest->canEdit()) {
            return Redirect::route('scm.procurement.index')->with('error', 'Only draft requests can be updated.');
        }

        $validated = $request->validate([
            'department_id' => 'nullable|exists:departments,id',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'estimated_budget' => 'nullable|numeric|min:0',
            'required_by' => 'required|date|after:today',
            'priority' => 'required|string|in:low,medium,high,urgent',
            'items' => 'required|array|min:1',
            'items.*.item_name' => 'required|string|max:255',
            'items.*.specifications' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:1',
            'items.*.unit_of_measure' => 'required|string|max:50',
            'items.*.estimated_unit_price' => 'nullable|numeric|min:0',
            'items.*.notes' => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated, $procurementRequest) {
            $procurementRequest->update([
                'department_id' => $validated['department_id'],
                'title' => $validated['title'],
                'description' => $validated['description'],
                'estimated_budget' => $validated['estimated_budget'],
                'required_by' => $validated['required_by'],
                'priority' => $validated['priority'],
            ]);

            // Delete existing items and create new ones
            $procurementRequest->items()->delete();

            foreach ($validated['items'] as $item) {
                ProcurementRequestItem::create([
                    'procurement_request_id' => $procurementRequest->id,
                    'item_name' => $item['item_name'],
                    'specifications' => $item['specifications'],
                    'quantity' => $item['quantity'],
                    'unit_of_measure' => $item['unit_of_measure'],
                    'estimated_unit_price' => $item['estimated_unit_price'] ?? null,
                    'notes' => $item['notes'] ?? null,
                ]);
            }
        });

        return Redirect::route('scm.procurement.index')->with('status', 'Procurement request updated successfully.');
    }

    public function destroy(ProcurementRequest $procurementRequest)
    {
        if (! $procurementRequest->canEdit()) {
            return Redirect::route('scm.procurement.index')->with('error', 'Only draft requests can be deleted.');
        }

        $procurementRequest->delete();

        return Redirect::route('scm.procurement.index')->with('status', 'Procurement request deleted successfully.');
    }

    public function submit(ProcurementRequest $procurementRequest)
    {
        if ($procurementRequest->status !== 'draft') {
            return Redirect::back()->with('error', 'Only draft requests can be submitted.');
        }

        $procurementRequest->update(['status' => 'submitted']);

        return Redirect::back()->with('status', 'Procurement request submitted for approval.');
    }

    public function approve(Request $request, ProcurementRequest $procurementRequest)
    {
        if ($procurementRequest->status !== 'submitted') {
            return Redirect::back()->with('error', 'Request is not pending approval.');
        }

        $validated = $request->validate([
            'approval_notes' => 'nullable|string',
        ]);

        $procurementRequest->update([
            'status' => 'approved',
            'approver_id' => Auth::id(),
            'approved_at' => now(),
            'approval_notes' => $validated['approval_notes'],
        ]);

        return Redirect::back()->with('status', 'Procurement request approved successfully.');
    }

    public function reject(Request $request, ProcurementRequest $procurementRequest)
    {
        if ($procurementRequest->status !== 'submitted') {
            return Redirect::back()->with('error', 'Request is not pending approval.');
        }

        $validated = $request->validate([
            'rejection_reason' => 'required|string',
        ]);

        $procurementRequest->update([
            'status' => 'rejected',
            'approver_id' => Auth::id(),
            'approved_at' => now(),
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        return Redirect::back()->with('status', 'Procurement request rejected.');
    }

    public function markCompleted(ProcurementRequest $procurementRequest)
    {
        if ($procurementRequest->status !== 'approved') {
            return Redirect::back()->with('error', 'Only approved requests can be marked as completed.');
        }

        $procurementRequest->update(['status' => 'completed']);

        return Redirect::back()->with('status', 'Procurement request marked as completed.');
    }

    private function generateRequestNumber()
    {
        $lastRequest = ProcurementRequest::latest('id')->first();
        $nextNumber = $lastRequest ? (int) substr($lastRequest->request_number, 3) + 1 : 1;

        return 'PR-'.str_pad($nextNumber, 6, '0', STR_PAD_LEFT);
    }
}
