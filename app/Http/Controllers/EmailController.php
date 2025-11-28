<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class EmailController extends Controller
{
    public function index(): \Inertia\Response
    {
        return Inertia::render('Emails', [
            'title' => 'Emails',
        ]);
    }
}
