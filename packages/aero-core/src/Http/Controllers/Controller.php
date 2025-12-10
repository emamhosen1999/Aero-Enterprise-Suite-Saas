<?php

namespace Aero\Core\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;

/**
 * Base Controller for Aero Core
 *
 * All Aero Core controllers should extend this class.
 * This makes the package independent of the host application's base controller.
 */
class Controller extends BaseController
{
    use AuthorizesRequests;
    use ValidatesRequests;
}
