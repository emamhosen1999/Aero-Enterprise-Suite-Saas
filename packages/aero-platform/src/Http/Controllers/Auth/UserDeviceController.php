<?php

namespace Aero\Platform\Http\Controllers\Auth;

/**
 * Compatibility shim for legacy references to UserDeviceController.
 *
 * Many parts of the application or cached autoload/maps may still refer to
 * App\Http\Controllers\UserDeviceController. The new implementation lives
 * in DeviceController. To avoid runtime include errors we provide a small
 * subclass that forwards to the new controller. This keeps runtime stable
 * while the rest of the codebase is migrated.
 */
class UserDeviceController extends DeviceController
{
    // No body required — inherits all behavior from DeviceController.
}
