import React, { useMemo } from 'react';
import { Card, CardBody, CardHeader, Skeleton } from '@heroui/react';
import { motion } from 'framer-motion';
import { useMediaQuery } from '@/Hooks/useMediaQuery.js';

const getThemedPageCardStyle = () => ({
  border: `var(--borderWidth, 2px) solid transparent`,
  borderRadius: `var(--borderRadius, 12px)`,
  fontFamily: `var(--fontFamily, "Inter")`,
  transform: `scale(var(--scale, 1))`,
  background: `linear-gradient(135deg, 
    var(--theme-content1, #FAFAFA) 20%, 
    var(--theme-content2, #F4F4F5) 10%, 
    var(--theme-content3, #F1F3F4) 20%)`,
});

const getThemedPageCardHeaderStyle = () => ({
  borderColor: `var(--theme-divider, #E4E4E7)`,
  background: `linear-gradient(135deg, 
    color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, 
    color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
});

/**
 * StandardPageLayout
 *
 * Canonical slot-based page composition:
 * Header (title/icon/actions) -> Stats -> Filters -> Content -> Pagination.
 *
 * This is intentionally structure-focused (no redesign): it matches the existing
 * LeavesAdmin-style themed Card wrapper used across the app.
 */
const StandardPageLayout = React.memo(({
  title,
  subtitle,
  icon,
  actions,
  stats,
  filters,
  children,
  pagination,
  isLoading = false,
  ariaLabel,
  wrapperClassName = 'flex flex-col w-full h-full p-4',
  containerClassName = 'w-full',
  cardBodyClassName = 'p-6',
}) => {
  const isMobile = useMediaQuery('(max-width: 640px)');
  const isMedium = useMediaQuery('(max-width: 1024px)');

  const paddingClass = useMemo(() => {
    if (!isMobile && !isMedium) return 'p-6';
    if (!isMobile && isMedium) return 'p-4';
    return 'p-3';
  }, [isMobile, isMedium]);

  const iconNode = useMemo(() => {
    if (!icon) return null;

    if (React.isValidElement(icon)) {
      return React.cloneElement(icon, {
        className: `${icon.props?.className || ''} ${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`.trim(),
        style: { ...(icon.props?.style || {}), color: 'var(--theme-primary)' },
      });
    }

    // If a component is passed instead of an element.
    return React.createElement(icon, {
      className: `${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`,
      style: { color: 'var(--theme-primary)' },
    });
  }, [icon, isMobile]);

  return (
    <div className={wrapperClassName} role="main" aria-label={ariaLabel || title}>
      <div className="space-y-4">
        <div className={containerClassName}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="transition-all duration-200" style={getThemedPageCardStyle()}>
              <CardHeader className="border-b p-0" style={getThemedPageCardHeaderStyle()}>
                <div className={`${paddingClass} w-full`}>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {isLoading ? (
                      <div className="flex items-center gap-3 lg:gap-4">
                        <Skeleton className="w-12 h-12 rounded-xl" />
                        <div className="min-w-0 flex-1">
                          <Skeleton className="w-64 h-6 rounded mb-2" />
                          <Skeleton className="w-48 h-4 rounded" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 lg:gap-4">
                        {iconNode && (
                          <div
                            className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl flex items-center justify-center`}
                            style={{
                              background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                              borderColor: `color-mix(in srgb, var(--theme-primary) 25%, transparent)`,
                              borderWidth: `var(--borderWidth, 2px)`,
                              borderRadius: `var(--borderRadius, 12px)`,
                            }}
                          >
                            {iconNode}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <h4
                            className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold text-foreground ${isMobile ? '' : ''}`}
                            style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                          >
                            {title}
                          </h4>
                          {subtitle ? (
                            <p
                              className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}
                              style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                            >
                              {subtitle}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    )}

                    {isLoading ? (
                      <div className="flex flex-wrap gap-2 lg:gap-3">
                        <Skeleton className="w-24 h-8 rounded" />
                        <Skeleton className="w-20 h-8 rounded" />
                      </div>
                    ) : actions ? (
                      <div className="flex flex-wrap gap-2 lg:gap-3">{actions}</div>
                    ) : null}
                  </div>
                </div>
              </CardHeader>

              <CardBody className={cardBodyClassName}>
                {stats ? <div className="mb-6">{stats}</div> : null}
                {filters ? <div className="mb-6">{filters}</div> : null}

                <div className="min-w-0">{children}</div>

                {pagination ? <div className="mt-6">{pagination}</div> : null}
              </CardBody>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
});

StandardPageLayout.displayName = 'StandardPageLayout';

export default StandardPageLayout;
