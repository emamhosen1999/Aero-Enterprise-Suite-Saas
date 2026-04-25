import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@heroui/react';
import { useBranding } from '@/Hooks/theme/useBranding';
import MaintenanceModeBanner from '@/Components/Platform/MaintenanceModeBanner.jsx';

/**
 * AuthLayout — public/auth surface for the aeos365 design system
 *
 * Single CTA-glass auth card centred on a mesh-gradient page. No floating
 * orbs, no rotating decorations, no animated gradients on hover. The hero
 * mesh radial blobs are token-driven (`--aeos-grad-mesh`) and static.
 *
 * @see aeos365-design-system/project/colors_and_type.css
 */
const AuthLayout = ({ children, title, subtitle }) => {
  const { logo, siteName } = useBranding();

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden aeos-grid-bg"
      style={{
        background: 'var(--aeos-obsidian, #03040A)',
        fontFamily: 'var(--aeos-font-body, "DM Sans"), system-ui, sans-serif',
      }}
    >
      {/* Mesh-gradient backdrop — static, token-driven */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'var(--aeos-grad-mesh)', opacity: 0.9 }}
      />

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center justify-center min-h-screen sm:min-h-[80vh] py-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[440px]"
          >
            <Card
              className="aeos-cta-glass p-6 sm:p-8 relative overflow-visible w-full"
              style={{
                fontFamily: 'var(--aeos-font-body, "DM Sans"), system-ui, sans-serif',
                color: 'var(--aeos-ink, #E8EDF5)',
              }}
            >
              {/* Brand mark */}
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="text-center mb-5"
              >
                <div className="flex justify-center mb-3">
                  <img
                    src={logo}
                    alt={siteName || 'aeos365'}
                    className="w-32 h-32 sm:w-36 sm:h-36 object-contain"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
                <span
                  className="aeos-label-mono"
                  style={{ color: 'var(--aeos-cyan, #00E5FF)' }}
                >
                  / Enterprise Suite
                </span>
              </motion.div>

              {/* Header */}
              {(title || subtitle) && (
                <div className="mb-5 text-center">
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {title && (
                      <h1
                        className="aeos-display-sm mb-2"
                        style={{ color: 'var(--aeos-ink, #E8EDF5)' }}
                      >
                        {title}
                      </h1>
                    )}
                    {subtitle && (
                      <p
                        className="aeos-body-lg"
                        style={{ color: 'var(--aeos-ink-muted, #8892A4)', fontSize: '0.95rem' }}
                      >
                        {subtitle}
                      </p>
                    )}
                  </motion.div>
                </div>
              )}

              {/* Form */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}
              >
                {children}
              </motion.div>
            </Card>
          </motion.div>
        </div>
      </div>

      <MaintenanceModeBanner position="bottom-right" />
    </div>
  );
};

export default AuthLayout;
