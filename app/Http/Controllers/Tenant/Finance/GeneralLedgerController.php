<?php

namespace App\Http\Controllers\Tenant\Finance;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * General Ledger Controller
 * 
 * Handles general ledger viewing and reporting
 */
class GeneralLedgerController extends Controller
{
    /**
     * Display general ledger
     */
    public function index(Request $request)
    {
        $filters = $request->only(['account_id', 'date_from', 'date_to']);
        
        // TODO: Fetch ledger entries from database
        $entries = [];
        
        return Inertia::render('Tenant/Pages/Finance/GeneralLedger', [
            'title' => 'General Ledger',
            'entries' => $entries,
            'filters' => $filters,
        ]);
    }
}
