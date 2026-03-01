<?php

namespace Aero\Finance\Http\Controllers;

use Illuminate\Routing\Controller;
use Inertia\Inertia;

class AccountsReceivableController extends Controller
{
    public function index()
    {
        $receivables = [];

        return Inertia::render('Finance/AccountsReceivable/Index', [
            'title' => 'Accounts Receivable',
            'receivables' => $receivables,
        ]);
    }
}
