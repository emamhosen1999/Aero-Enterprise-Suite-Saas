<?php

namespace Aero\Platform\Http\Controllers\Notification;

use Aero\Platform\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class EmailController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Platform/Emails/Index', [
            'title' => 'Platform/Emails/Index',
        ]);
    }
}
