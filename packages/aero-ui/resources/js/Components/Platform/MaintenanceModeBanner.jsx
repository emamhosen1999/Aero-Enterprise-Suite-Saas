import React, { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Tooltip } from '@heroui/react';
import { ExclamationTriangleIcon, XMarkIcon, WrenchScrewdriverIcon, BugAntIcon } from '@heroicons/react/24/solid';

/**
 * MaintenanceModeBanner - A sticky corner indicator for maintenance/debug mode
 * 
 * Shows a small triangle badge in the corner when:
 * - Platform is in maintenance mode
 * - Debug mode is enabled (APP_DEBUG=true)
 * 
 * This component is designed to be minimal and non-intrusive while still
 * providing clear visual indication that verification may be skipped.
 */
export default function MaintenanceModeBanner({ 
  position = 'bottom-right',
  showDebugBadge = true,
  showMaintenanceBadge = true,
}) {
  const { app, maintenance } = usePage().props;
  const [isDismissed, setIsDismissed] = useState(false);

  const isDebugMode = app?.debug === true;
  const isMaintenanceMode = maintenance?.enabled === true;
  const skipVerification = maintenance?.skipVerification === true;

  // Don't show if dismissed or neither mode is active
  if (isDismissed || (!isDebugMode && !isMaintenanceMode)) {
    return null;
  }

  // Determine which badge to show (maintenance takes priority over debug)
  const showMaintenance = showMaintenanceBadge && isMaintenanceMode;
  const showDebug = showDebugBadge && isDebugMode && !isMaintenanceMode;

  if (!showMaintenance && !showDebug) {
    return null;
  }

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const getBadgeConfig = () => {
    if (showMaintenance) {
      return {
        icon: WrenchScrewdriverIcon,
        bgColor: 'bg-warning-500',
        borderColor: 'border-warning-600',
        shadowColor: 'shadow-warning-500/30',
        title: 'Maintenance Mode',
        description: maintenance?.message || 'Platform is in maintenance mode',
        extraInfo: skipVerification ? 'Email/Phone verification is skipped' : null,
        endsAt: maintenance?.endsAt ? `Ends: ${new Date(maintenance.endsAt).toLocaleString()}` : null,
      };
    }

    return {
      icon: BugAntIcon,
      bgColor: 'bg-danger-500',
      borderColor: 'border-danger-600', 
      shadowColor: 'shadow-danger-500/30',
      title: 'Debug Mode',
      description: 'Application is running in debug mode',
      extraInfo: 'Email/Phone verification is skipped',
      endsAt: null,
    };
  };

  const config = getBadgeConfig();
  const IconComponent = config.icon;

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <Tooltip 
        content={
          <div className="p-2 max-w-xs">
            <p className="font-semibold text-sm">{config.title}</p>
            <p className="text-xs text-default-500 mt-1">{config.description}</p>
            {config.extraInfo && (
              <p className="text-xs text-warning-400 mt-1">⚡ {config.extraInfo}</p>
            )}
            {config.endsAt && (
              <p className="text-xs text-default-400 mt-1">{config.endsAt}</p>
            )}
          </div>
        }
        placement="top"
        showArrow
      >
        <div className="relative group cursor-pointer">
          {/* Main badge */}
          <div 
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg
              ${config.bgColor} border ${config.borderColor}
              shadow-lg ${config.shadowColor}
              backdrop-blur-sm
              transition-all duration-200
              hover:scale-105 hover:shadow-xl
            `}
          >
            <IconComponent className="w-4 h-4 text-white" />
            <span className="text-xs font-medium text-white hidden sm:inline">
              {showMaintenance ? 'Maintenance' : 'Debug'}
            </span>
            
            {/* Dismiss button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDismissed(true);
              }}
              className="p-0.5 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Dismiss"
            >
              <XMarkIcon className="w-3 h-3 text-white/80 hover:text-white" />
            </button>
          </div>

          {/* Pulsing indicator */}
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span 
              className={`
                animate-ping absolute inline-flex h-full w-full rounded-full opacity-75
                ${showMaintenance ? 'bg-warning-400' : 'bg-danger-400'}
              `}
            />
            <span 
              className={`
                relative inline-flex rounded-full h-3 w-3
                ${showMaintenance ? 'bg-warning-500' : 'bg-danger-500'}
              `}
            />
          </span>
        </div>
      </Tooltip>
    </div>
  );
}

/**
 * Compact triangle version for minimal layouts
 */
export function MaintenanceModeTriangle({ position = 'top-right' }) {
  const { app, maintenance } = usePage().props;
  const [isHovered, setIsHovered] = useState(false);

  const isDebugMode = app?.debug === true;
  const isMaintenanceMode = maintenance?.enabled === true;

  if (!isDebugMode && !isMaintenanceMode) {
    return null;
  }

  const isMaintenancePriority = isMaintenanceMode;
  const color = isMaintenancePriority ? 'warning' : 'danger';

  const positionStyles = {
    'top-left': { top: 0, left: 0, transform: 'rotate(-90deg)', transformOrigin: 'top left' },
    'top-right': { top: 0, right: 0 },
    'bottom-left': { bottom: 0, left: 0, transform: 'rotate(180deg)', transformOrigin: 'bottom left' },
    'bottom-right': { bottom: 0, right: 0, transform: 'rotate(90deg)', transformOrigin: 'bottom right' },
  };

  return (
    <div 
      className="fixed z-50"
      style={positionStyles[position]}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Tooltip
        content={
          <div className="p-2">
            <p className="font-semibold text-sm">
              {isMaintenancePriority ? 'Maintenance Mode' : 'Debug Mode'}
            </p>
            <p className="text-xs text-default-500 mt-1">
              {isMaintenancePriority 
                ? maintenance?.message || 'Platform is in maintenance mode'
                : 'Application is running in debug mode'
              }
            </p>
            <p className="text-xs text-warning-400 mt-1">
              ⚡ Verification steps may be skipped
            </p>
          </div>
        }
        placement="bottom"
        showArrow
      >
        <div className={`
          w-0 h-0 cursor-pointer transition-all duration-200
          border-l-[40px] border-l-transparent
          border-t-[40px] ${color === 'warning' ? 'border-t-warning-500' : 'border-t-danger-500'}
          ${isHovered ? 'opacity-100' : 'opacity-80'}
        `}>
          {/* Icon inside triangle */}
          <div className="absolute -top-9 right-1">
            {isMaintenancePriority ? (
              <WrenchScrewdriverIcon className="w-4 h-4 text-white drop-shadow" />
            ) : (
              <BugAntIcon className="w-4 h-4 text-white drop-shadow" />
            )}
          </div>
        </div>
      </Tooltip>
    </div>
  );
}
