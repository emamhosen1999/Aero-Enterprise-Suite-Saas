<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| Aero Platform Web Routes
|--------------------------------------------------------------------------
|
| This file serves as the main route loader for the aero-platform module.
| It intelligently loads the appropriate routes based on domain context:
|
| - admin.* domain → admin.php (landlord authentication, platform management)
| - Main domain → platform.php (public landing, registration, pricing)
|
| The actual routes are defined in:
| - routes/admin.php: Platform admin routes (landlord guard)
| - routes/platform.php: Public platform routes (registration, landing)
| - routes/api.php: API endpoints
|
*/

// Routes are loaded by the service provider based on domain detection.
// See AeroPlatformServiceProvider for the domain-based route registration.

// This file is kept for compatibility but routes are primarily
// in admin.php and platform.php which are conditionally loaded.
