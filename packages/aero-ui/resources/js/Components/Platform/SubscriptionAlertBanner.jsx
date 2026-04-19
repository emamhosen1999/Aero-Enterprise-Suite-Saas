import React, { useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import { Button } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

/**
 * SubscriptionAlertBanner Component
 *
 * Displays a dismissible banner at the top of the layout when the tenant's
 * subscription requires attention (e.g. trial ending, past-due, grace period,
 * or expired). The banner is only rendered for authenticated admin/super-admin
 * users and resolves its data from the shared `subscription_alert` Inertia prop
 * populated by AeroPlatformServiceProvider's HandleInertiaRequests.
 *
 * Severity → visual style mapping:
 *   trial_ending         → info  (blue)
 *   past_due             → warning (amber)
 *   grace_period_ending  → danger  (red)
 *   expired              → danger  (red)
 */
const SubscriptionAlertBanner = () => {
  const { subscription_alert: alert, auth } = usePage().props;
  const [dismissed, setDismissed] = useState(false);

  // Only show to authenticated admins/super-admins.
  const canSeeAlert = auth?.isAuthenticated && (auth?.isTenantSuperAdmin || auth?.isSuperAdmin);

  if (!alert || !canSeeAlert || dismissed) {
    return null;
  }

  const colorMap = {
    danger:  { bg: 'bg-danger-500',  text: 'text-danger-foreground',  btn: 'danger'  },
    warning: { bg: 'bg-warning-500', text: 'text-warning-foreground', btn: 'warning' },
    info:    { bg: 'bg-primary-500', text: 'text-primary-foreground', btn: 'primary' },
  };

  const style = colorMap[alert.type] ?? colorMap.warning;
  const Icon = alert.type === 'info' ? InformationCircleIcon : ExclamationTriangleIcon;

  const handleUpgrade = () => {
    if (alert.upgrade_url) {
      router.visit(alert.upgrade_url);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="subscription-alert-banner"
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <div className={`${style.bg} ${style.text} px-4 py-2`}>
          <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2">
            {/* Left: icon + message */}
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">
                {alert.message}
              </span>
            </div>

            {/* Right: action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {alert.upgrade_url && (
                <Button
                  size="sm"
                  color={style.btn}
                  variant="bordered"
                  className="border-current font-semibold"
                  endContent={<ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />}
                  onPress={handleUpgrade}
                >
                  Upgrade Plan
                </Button>
              )}

              <Button
                isIconOnly
                size="sm"
                color={style.btn}
                variant="light"
                aria-label="Dismiss subscription alert"
                onPress={() => setDismissed(true)}
              >
                <XMarkIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SubscriptionAlertBanner;
