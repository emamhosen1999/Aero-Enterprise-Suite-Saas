<?php

namespace Aero\Finance\Http\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

/**
 * Chart of Accounts Controller
 * 
 * Manages the chart of accounts structure and account management
 */
class ChartOfAccountsController extends Controller
{
    /**
     * Display the chart of accounts
     */
    public function index()
    {
        // TODO: Fetch accounts from database
        $accounts = [];
        
        return Inertia::render('Tenant/Pages/Finance/ChartOfAccounts', [
            'title' => 'Chart of Accounts',
            'accounts' => $accounts,
        ]);
    }

    /**
     * Store a new account
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50',
            'name' => 'required|string|max:255',
            'type' => 'required|in:asset,liability,equity,revenue,expense',
            'parent_id' => 'nullable|integer',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        // TODO: Create account in database
        
        return redirect()->back()->with('success', 'Account created successfully');
    }

    /**
     * Update an existing account
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50',
            'name' => 'required|string|max:255',
            'type' => 'required|in:asset,liability,equity,revenue,expense',
            'parent_id' => 'nullable|integer',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        // TODO: Update account in database
        
        return redirect()->back()->with('success', 'Account updated successfully');
    }

    /**
     * Delete an account
     */
    public function destroy($id)
    {
        // TODO: Soft delete account
        
        return redirect()->back()->with('success', 'Account deleted successfully');
    }
}
