<?php

namespace Aero\Core\Facades;

use Aero\Core\Services\ModuleManager;
use Illuminate\Support\Facades\Facade;

/**
 * Module Facade
 *
 * Provides easy access to ModuleManager service for module discovery and management.
 *
 * @method static array active()
 * @method static array all()
 * @method static array|null get(string $name)
 * @method static bool isEnabled(string $name)
 * @method static array getInjectableModules()
 * @method static void clearCache()
 * @method static int count()
 * @method static int enabledCount()
 * @method static array bySource(string $source)
 * @method static bool hasAssets(string $name)
 *
 * @see ModuleManager
 */
class Module extends Facade
{
    /**
     * Get the registered name of the component.
     */
    protected static function getFacadeAccessor(): string
    {
        return 'aero.module';
    }
}
