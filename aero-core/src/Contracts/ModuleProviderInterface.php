<?php

namespace Aero\Core\Contracts;

/**
 * Module Provider Interface
 *
 * All modules must implement this interface to integrate with the Aero module system.
 * This enables dynamic module discovery, registration, and loading.
 */
interface ModuleProviderInterface
{
    /**
     * Get the unique module identifier.
     *
     * @return string
     */
    public function getModuleCode(): string;

    /**
     * Get the module display name.
     *
     * @return string
     */
    public function getModuleName(): string;

    /**
     * Get the module description.
     *
     * @return string
     */
    public function getModuleDescription(): string;

    /**
     * Get the module version.
     *
     * @return string
     */
    public function getModuleVersion(): string;

    /**
     * Get the module category.
     *
     * @return string
     */
    public function getModuleCategory(): string;

    /**
     * Get the module icon (HeroIcon name).
     *
     * @return string
     */
    public function getModuleIcon(): string;

    /**
     * Get the module priority for navigation ordering.
     *
     * @return int
     */
    public function getModulePriority(): int;

    /**
     * Get the full module hierarchy (submodules, components, actions).
     *
     * @return array
     */
    public function getModuleHierarchy(): array;

    /**
     * Get the module's navigation menu items.
     *
     * @return array
     */
    public function getNavigationItems(): array;

    /**
     * Get the module's route definitions.
     *
     * @return array
     */
    public function getRoutes(): array;

    /**
     * Get module dependencies (other module codes this module requires).
     *
     * @return array
     */
    public function getDependencies(): array;

    /**
     * Check if the module is enabled.
     *
     * @return bool
     */
    public function isEnabled(): bool;

    /**
     * Get the minimum plan required for this module.
     *
     * @return string|null
     */
    public function getMinimumPlan(): ?string;

    /**
     * Register the module's services, routes, and assets.
     *
     * @return void
     */
    public function register(): void;

    /**
     * Boot the module after all services are registered.
     *
     * @return void
     */
    public function boot(): void;
}
