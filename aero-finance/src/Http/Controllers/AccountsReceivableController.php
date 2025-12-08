<?php

namespace Aero\Finance\Http\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AccountsReceivableController extends Controller
{
    public function index()
    {
        $receivables = [];
        
        return Inertia::render('Tenant/Pages/Finance/AccountsReceivable', [
            'title' => 'Accounts Receivable',
            'receivables' => $receivables,
        ]);
    }
}
