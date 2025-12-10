import React from 'react';
import { usePage, router } from '@inertiajs/react';
import { Button } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ImpersonationBanner Component
 * 
 * Displays a warning banner when the current session is being impersonated
 * by a platform administrator. This provides transparency to users and
 * allows the admin to end the impersonation session.
 */
const ImpersonationBanner = () => {
  const { impersonation } = usePage().props;
  const isActive = impersonation?.active ?? false;

  const handleEndSession = () => {
    router.post(route('impersonate.end'), {}, {
      onSuccess: () => {
        // Session will be invalidated, user will be redirected to login
      },
    });
  };

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className="bg-warning-500 text-warning-foreground px-4 py-2">
            <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span className="text-sm font-medium">
                  <strong>Platform Admin Impersonation Active</strong>
                  <span className="hidden sm:inline"> — All actions are being logged for security purposes.</span>
                </span>
              </div>
              <Button
                size="sm"
                color="warning"
                variant="bordered"
                className="border-warning-foreground/50 text-warning-foreground hover:bg-warning-600"
                onPress={handleEndSession}
              >
                End Session
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImpersonationBanner;
