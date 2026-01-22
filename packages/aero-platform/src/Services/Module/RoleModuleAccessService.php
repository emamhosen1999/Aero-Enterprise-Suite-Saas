<?php

declare(strict_types=1);

namespace Aero\Platform\Services\Module;

use Aero\HRMAC\Services\RoleModuleAccessService as BaseRoleModuleAccessService;

/**
 * Platform alias for the HRMAC RoleModuleAccessService.
 *
 * This class exists for backward compatibility and to provide
 * a platform-specific namespace for module access control.
 */
class RoleModuleAccessService extends BaseRoleModuleAccessService
{
    // Inherits all functionality from HRMAC RoleModuleAccessService
}
