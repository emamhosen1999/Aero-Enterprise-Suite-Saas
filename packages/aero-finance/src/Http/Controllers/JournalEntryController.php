<?php

namespace Aero\Finance\Http\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

/**
 * Journal Entry Controller
 * 
 * Handles journal entries for double-entry bookkeeping
 */
class JournalEntryController extends Controller
{
    /**
     * Display journal entries
     */
    public function index()
    {
        // TODO: Fetch journal entries from database
        $entries = [];
        
        return Inertia::render('Finance/JournalEntries', [
            'title' => 'Journal Entries',
            'entries' => $entries,
        ]);
    }

    /**
     * Store a new journal entry
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'reference' => 'required|string|max:100',
            'description' => 'nullable|string',
            'lines' => 'required|array|min:2',
            'lines.*.account_id' => 'required|integer',
            'lines.*.debit' => 'required_without:lines.*.credit|numeric|min:0',
            'lines.*.credit' => 'required_without:lines.*.debit|numeric|min:0',
            'lines.*.description' => 'nullable|string',
        ]);

        // Validate balanced entry
        $totalDebit = collect($validated['lines'])->sum('debit');
        $totalCredit = collect($validated['lines'])->sum('credit');
        
        if ($totalDebit != $totalCredit) {
            return redirect()->back()->withErrors(['lines' => 'Journal entry must be balanced (debits must equal credits)']);
        }

        DB::transaction(function () use ($validated) {
            // TODO: Create journal entry and lines in database
        });
        
        return redirect()->back()->with('success', 'Journal entry created successfully');
    }

    /**
     * Update a journal entry
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'reference' => 'required|string|max:100',
            'description' => 'nullable|string',
            'lines' => 'required|array|min:2',
            'lines.*.account_id' => 'required|integer',
            'lines.*.debit' => 'required_without:lines.*.credit|numeric|min:0',
            'lines.*.credit' => 'required_without:lines.*.debit|numeric|min:0',
            'lines.*.description' => 'nullable|string',
        ]);

        // Validate balanced entry
        $totalDebit = collect($validated['lines'])->sum('debit');
        $totalCredit = collect($validated['lines'])->sum('credit');
        
        if ($totalDebit != $totalCredit) {
            return redirect()->back()->withErrors(['lines' => 'Journal entry must be balanced (debits must equal credits)']);
        }

        DB::transaction(function () use ($validated, $id) {
            // TODO: Update journal entry and lines in database
        });
        
        return redirect()->back()->with('success', 'Journal entry updated successfully');
    }

    /**
     * Delete a journal entry
     */
    public function destroy($id)
    {
        // TODO: Soft delete journal entry
        
        return redirect()->back()->with('success', 'Journal entry deleted successfully');
    }
}
