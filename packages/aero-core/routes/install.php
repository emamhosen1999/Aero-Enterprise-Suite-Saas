<?php

/**
 * Legacy Installation Routes (Backward Compatibility)
 *
 * This file now simply includes the unified installation routes.
 * The install.* route names are maintained for backward compatibility
 * with any existing code that references them.
 *
 * All routes now use UnifiedInstallationController which supports
 * both SaaS and Standalone modes.
 *
 * @deprecated Use routes/installation.php instead
 * @see packages/aero-core/routes/installation.php
 */

// All installation routes are now in installation.php
// This file is kept for backward compatibility only
// Routes loaded via AeroCoreServiceProvider

// Legacy route name aliases are defined in installation.php
