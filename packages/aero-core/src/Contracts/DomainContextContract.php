<?php

declare(strict_types=1);

namespace Aero\Core\Contracts;

/**
 * Domain Context Contract
 *
 * Defines constants and interface for domain context identification.
 * This contract is used by both Core and Platform packages to ensure
 * consistent domain context handling across the application.
 *
 * Domain Contexts:
 * - ADMIN: Admin subdomain (admin.domain.com) - Platform administration
 * - PLATFORM: Root domain (domain.com) - Public pages, registration
 * - TENANT: Tenant subdomain (*.domain.com) - Tenant application
 *
 * Usage:
 * - Core uses these constants for standalone mode detection
 * - Platform uses these constants for SaaS mode routing
 * - HandleInertiaRequests uses these to share appropriate props
 * - Route middleware uses these to restrict access by domain
 */
interface DomainContextContract
{
    /**
     * Admin subdomain context (admin.domain.com)
     *
     * Used for:
     * - Landlord authentication
     * - Tenant management
     * - Platform-wide settings
     * - Billing administration
     */
    public const CONTEXT_ADMIN = 'admin';

    /**
     * Platform/root domain context (domain.com)
     *
     * Used for:
     * - Public landing pages
     * - Tenant registration
     * - Pricing/feature pages
     * - Installation wizard
     */
    public const CONTEXT_PLATFORM = 'platform';

    /**
     * Tenant subdomain context (*.domain.com)
     *
     * Used for:
     * - Tenant application access
     * - User authentication
     * - Business module routes (HRM, CRM, etc.)
     */
    public const CONTEXT_TENANT = 'tenant';

    /**
     * Standalone context (no subdomains)
     *
     * Used in standalone mode when Platform package is not installed.
     * Single domain hosts all functionality.
     */
    public const CONTEXT_STANDALONE = 'standalone';

    /**
     * Get the current domain context.
     *
     * @return string One of the CONTEXT_* constants
     */
    public function getContext(): string;

    /**
     * Check if currently in admin context.
     */
    public function isAdminContext(): bool;

    /**
     * Check if currently in platform context.
     */
    public function isPlatformContext(): bool;

    /**
     * Check if currently in tenant context.
     */
    public function isTenantContext(): bool;

    /**
     * Check if currently on a central domain (admin or platform).
     */
    public function isCentralContext(): bool;
}
