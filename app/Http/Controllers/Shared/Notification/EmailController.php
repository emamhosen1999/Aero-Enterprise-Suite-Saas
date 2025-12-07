<?php

namespace App\Http\Controllers\Shared\Notification;

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
