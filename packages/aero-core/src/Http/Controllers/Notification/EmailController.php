<?php

namespace Aero\Core\Http\Controllers\Notification;

use Aero\Core\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class EmailController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Emails', [
            'title' => 'Emails',
        ]);
    }
}
