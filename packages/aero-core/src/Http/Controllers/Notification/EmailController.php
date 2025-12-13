<?php

namespace Aero\Core\Http\Controllers\Notification;

use Aero\Core\Http\Controllers\Controller;
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
