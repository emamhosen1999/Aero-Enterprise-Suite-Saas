<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Accounts Payable Controller
 * 
 * Manages accounts payable (bills, vendor payments)
 */
class AccountsPayableController extends Controller
{
    /**
     * Display accounts payable
     */
    public function index()
    {
        // TODO: Fetch payables from database
        $payables = [];
        
        return Inertia::render('Tenant/Pages/Finance/AccountsPayable', [
            'title' => 'Accounts Payable',
            'payables' => $payables,
        ]);
    }

    /**
     * Store a new payable
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'vendor_id' => 'required|integer',
            'invoice_number' => 'required|string|max:100',
            'invoice_date' => 'required|date',
            'due_date' => 'required|date',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string',
        ]);

        // TODO: Create payable in database
        
        return redirect()->back()->with('success', 'Bill created successfully');
    }

    /**
     * Update a payable
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'vendor_id' => 'required|integer',
            'invoice_number' => 'required|string|max:100',
            'invoice_date' => 'required|date',
            'due_date' => 'required|date',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string',
        ]);

        // TODO: Update payable in database
        
        return redirect()->back()->with('success', 'Bill updated successfully');
    }

    /**
     * Delete a payable
     */
    public function destroy($id)
    {
        // TODO: Soft delete payable
        
        return redirect()->back()->with('success', 'Bill deleted successfully');
    }
}
