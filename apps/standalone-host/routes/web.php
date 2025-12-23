<?php

/**
 * Aero Enterprise Suite - Standalone Host Web Routes
 *
 * This file should remain empty or contain only minimal host-specific routes.
 * All application routes are registered by packages:
 *
 * - aero/core: Authentication, dashboard, users, roles, settings
 *   - Handles root "/" route automatically via HandleInertiaRequests middleware
 *   - Registers installation routes when app is not installed
 *
 * - aero/hrm: Employee management, attendance, leave, payroll (optional)
 * - aero/crm: Customer management, deals, pipelines (optional)
 * - Other modules as needed
 *
 * The package-driven architecture ensures:
 * 1. Host application remains unmodified
 * 2. All routing originates from packages
 * 3. First launch works without database/sessions/cache
 * 4. Clean separation of concerns
 */
