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
     */
    public function getModuleCode(): string;

    /**
     * Get the module display name.
     */
    public function getModuleName(): string;

    /**
     * Get the module description.
     */
    public function getModuleDescription(): string;

    /**
     * Get the module version.
     */
    public function getModuleVersion(): string;

    /**
     * Get the module category.
     */
    public function getModuleCategory(): string;

    /**
     * Get the module icon (HeroIcon name).
     */
    public function getModuleIcon(): string;

    /**
     * Get the module priority for navigation ordering.
     */
    public function getModulePriority(): int;

    /**
     * Get the full module hierarchy (submodules, components, actions).
     */
    public function getModuleHierarchy(): array;

    /**
     * Get the module's navigation menu items.
     */
    public function getNavigationItems(): array;

    /**
     * Get the module's route definitions.
     */
    public function getRoutes(): array;

    /**
     * Get module dependencies (other module codes this module requires).
     */
    public function getDependencies(): array;

    /**
     * Check if the module is enabled.
     */
    public function isEnabled(): bool;

    /**
     * Get the minimum plan required for this module.
     */
    public function getMinimumPlan(): ?string;

    /**
     * Register the module's services, routes, and assets.
     */
    public function register(): void;

    /**
     * Boot the module after all services are registered.
     */
    public function boot(): void;
}
