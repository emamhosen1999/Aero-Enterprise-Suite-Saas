<?php

namespace Aero\Crm\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;

/**
 * Base Controller for Aero CRM Module
 *
 * All Aero CRM controllers should extend this class.
 */
class Controller extends BaseController
{
    use AuthorizesRequests;
    use ValidatesRequests;
}
