import React from 'react';
import { Chip } from '@heroui/react';
import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

/**
 * TenantStatusBadge Component
 * 
 * Displays a visual status indicator for tenants in the admin panel.
 * Priority: Maintenance mode takes precedence over regular status.
 * 
 * @param {Object} props
 * @param {string} props.status - Tenant status ('active', 'suspended', 'pending', 'archived')
 * @param {boolean} props.maintenanceMode - Whether tenant is in maintenance mode
 * @param {string} props.size - Chip size ('sm', 'md', 'lg') - defaults to 'sm'
 * @param {string} props.variant - Chip variant ('flat', 'dot', 'solid', 'bordered') - defaults to 'flat'
 */
const TenantStatusBadge = ({ 
  status, 
  maintenanceMode = false, 
  size = 'sm',
  variant = 'flat',
}) => {
  // Priority: Maintenance mode takes precedence
  if (maintenanceMode) {
    return (
      <Chip
        size={size}
        variant={variant}
        color="warning"
        startContent={<WrenchScrewdriverIcon className="w-3 h-3" />}
        classNames={{
          base: 'bg-warning-50 dark:bg-warning-900/20',
          content: 'text-warning-700 dark:text-warning-400 font-medium',
        }}
      >
        MAINTENANCE
      </Chip>
    );
  }

  // Status configuration map
  const statusConfig = {
    active: {
      color: 'success',
      label: 'Active',
      classNames: {
        base: 'bg-success-50 dark:bg-success-900/20',
        content: 'text-success-700 dark:text-success-400 font-medium',
      },
    },
    suspended: {
      color: 'danger',
      label: 'Suspended',
      classNames: {
        base: 'bg-danger-50 dark:bg-danger-900/20',
        content: 'text-danger-700 dark:text-danger-400 font-medium',
      },
    },
    pending: {
      color: 'default',
      label: 'Pending',
      classNames: {
        base: 'bg-default-100 dark:bg-default-100/20',
        content: 'text-default-600 dark:text-default-400 font-medium',
      },
    },
    archived: {
      color: 'default',
      label: 'Archived',
      classNames: {
        base: 'bg-default-200 dark:bg-default-200/20',
        content: 'text-default-500 dark:text-default-400 font-medium',
      },
    },
    trial: {
      color: 'secondary',
      label: 'Trial',
      classNames: {
        base: 'bg-secondary-50 dark:bg-secondary-900/20',
        content: 'text-secondary-700 dark:text-secondary-400 font-medium',
      },
    },
  };

  // Normalize status to lowercase for matching
  const normalizedStatus = (status || 'pending').toLowerCase();
  const config = statusConfig[normalizedStatus] || statusConfig.pending;

  return (
    <Chip
      size={size}
      variant={variant}
      color={config.color}
      classNames={config.classNames}
    >
      {config.label}
    </Chip>
  );
};

/**
 * Alternative: Pure Tailwind version without HeroUI Chip
 * Use this if you need a lighter-weight badge without dependencies.
 */
export const TenantStatusBadgeTailwind = ({ 
  status, 
  maintenanceMode = false,
}) => {
  const baseClasses = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border';

  // Priority: Maintenance mode takes precedence
  if (maintenanceMode) {
    return (
      <span className={`${baseClasses} bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800`}>
        <WrenchScrewdriverIcon className="w-3 h-3" />
        MAINTENANCE
      </span>
    );
  }

  // Status color map
  const statusStyles = {
    active: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
    suspended: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
    pending: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700',
    archived: 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700',
    trial: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
  };

  const statusLabels = {
    active: 'Active',
    suspended: 'Suspended',
    pending: 'Pending',
    archived: 'Archived',
    trial: 'Trial',
  };

  const normalizedStatus = (status || 'pending').toLowerCase();
  const styles = statusStyles[normalizedStatus] || statusStyles.pending;
  const label = statusLabels[normalizedStatus] || 'Unknown';

  return (
    <span className={`${baseClasses} ${styles}`}>
      {label}
    </span>
  );
};

export default TenantStatusBadge;
