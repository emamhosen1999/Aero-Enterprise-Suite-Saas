<?php

namespace Aero\Platform\Services;

/**
 * Shim InstallationService class.
 *
 * The full implementation lives in the Monitoring namespace for
 * more specialized checks. Controllers expect `Aero\Platform\Services\InstallationService`.
 * Extend the monitoring implementation so the DI container can resolve the class.
 */
class InstallationService extends \Aero\Platform\Services\Monitoring\InstallationService
{
    // Inherits all behaviour from Monitoring\InstallationService
}
