<?php

namespace Aero\Installation;

/**
 * Mode Detector
 *
 * Detects whether the installation is in SaaS or standalone mode.
 * 
 * - Standalone: No aero-platform package installed
 * - SaaS: aero-platform package installed
 */
class ModeDetector
{
    /**
     * Detect the installation mode.
     */
    public function detect(): string
    {
        // Check if Platform package is installed
        if (class_exists('Aero\Platform\AeroPlatformServiceProvider')) {
            return 'saas';
        }

        return 'standalone';
    }

    /**
     * Check if running in SaaS mode.
     */
    public function isSaaS(): bool
    {
        return $this->detect() === 'saas';
    }

    /**
     * Check if running in standalone mode.
     */
    public function isStandalone(): bool
    {
        return $this->detect() === 'standalone';
    }
}
