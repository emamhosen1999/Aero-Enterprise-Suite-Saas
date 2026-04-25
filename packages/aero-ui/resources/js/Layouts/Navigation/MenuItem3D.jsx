/**
 * MenuItem — aeos365 navigation menu item
 *
 * The aeos365 design system mandates "animate borders, glow, transform" — no
 * rotateX, no translateZ, no perspective, no animated module accent gradients.
 * This component renders one nav row with:
 *   - Heroicon in a soft cyan tile (28×28)
 *   - DM Sans label
 *   - cyan glow ring + 2px cyan left bar when active
 *   - subtle translateY(-1px) + soft cyan wash on hover
 *
 * Filename retained as `MenuItem3D.jsx` to avoid import churn during the
 * foundation pass; the "3D" suffix is now a misnomer.
 *
 * @see aeos365-design-system/project/colors_and_type.css
 */

import React, { useCallback, useMemo } from 'react';
import { Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { getMenuItemUrl, highlightMatch, getMenuItemId, isItemActive } from './navigationUtils.jsx';

const MenuItem3D = React.memo(({
  item,
  level = 0,
  isActive = false,
  hasActiveChild = false,
  isExpanded = false,
  onToggle,
  onNavigate,
  searchTerm = '',
  variant = 'sidebar',
  collapsed = false,
  parentId = '',
  expandedMenus = null,
  activePath = '',
}) => {
  const hasSubMenu = (item.subMenu?.length > 0) || (item.children?.length > 0);
  const subItems = item.subMenu || item.children || [];
  const itemUrl = getMenuItemUrl(item);
  const itemId = getMenuItemId(item, parentId);

  // Level-based sizing — preserves visual hierarchy
  const cfg = useMemo(() => {
    if (level === 0) return { h: 40, px: 10, iconBox: 28, iconSize: 16, textSize: '0.875rem', weight: 500 };
    if (level === 1) return { h: 36, px: 10, iconBox: 24, iconSize: 14, textSize: '0.8125rem', weight: 450 };
    return { h: 32, px: 10, iconBox: 22, iconSize: 13, textSize: '0.75rem', weight: 400 };
  }, [level]);

  const isHighlighted = isActive || hasActiveChild;

  const handleClick = useCallback((e) => {
    if (hasSubMenu) {
      e.preventDefault();
      onToggle?.(itemId);
    } else if (itemUrl) {
      onNavigate?.(item);
    }
  }, [hasSubMenu, itemId, itemUrl, item, onToggle, onNavigate]);

  // ── Renderers ──────────────────────────────────────────────────────────
  const renderIcon = () => {
    if (!item.icon) return null;
    return (
      <span
        className="relative shrink-0 inline-flex items-center justify-center"
        style={{
          width: cfg.iconBox,
          height: cfg.iconBox,
          borderRadius: 8,
          background: isHighlighted
            ? 'rgba(0, 229, 255, 0.10)'
            : 'rgba(0, 229, 255, 0.04)',
          border: '1px solid ' + (isHighlighted ? 'rgba(0, 229, 255, 0.30)' : 'rgba(0, 229, 255, 0.10)'),
          boxShadow: isActive ? '0 0 12px rgba(0, 229, 255, 0.25)' : 'none',
          color: isHighlighted ? 'var(--aeos-cyan, #00E5FF)' : 'var(--aeos-ink-muted, #8892A4)',
          transition: 'background 240ms cubic-bezier(0.22, 1, 0.36, 1), border-color 240ms, box-shadow 240ms, color 180ms',
        }}
      >
        {React.isValidElement(item.icon)
          ? React.cloneElement(item.icon, { style: { width: cfg.iconSize, height: cfg.iconSize } })
          : item.icon}
      </span>
    );
  };

  const renderChevron = () => {
    if (!hasSubMenu) return null;
    return (
      <motion.span
        animate={{ rotate: isExpanded ? 180 : 0 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="shrink-0 ml-auto inline-flex"
      >
        <ChevronDownIcon
          className="w-3.5 h-3.5"
          style={{ color: isHighlighted ? 'var(--aeos-cyan, #00E5FF)' : 'var(--aeos-ink-muted, #8892A4)' }}
        />
      </motion.span>
    );
  };

  const renderBadge = () => {
    if (!hasSubMenu || collapsed) return null;
    return (
      <span
        className="font-mono text-[10px] px-1.5 py-0.5 rounded leading-none"
        style={{
          letterSpacing: '0.05em',
          background: isHighlighted ? 'rgba(0, 229, 255, 0.10)' : 'rgba(255, 255, 255, 0.04)',
          color: isHighlighted ? 'var(--aeos-cyan, #00E5FF)' : 'var(--aeos-ink-muted, #8892A4)',
          border: '1px solid ' + (isHighlighted ? 'rgba(0, 229, 255, 0.20)' : 'rgba(255, 255, 255, 0.06)'),
          transition: 'background 180ms, color 180ms, border-color 180ms',
        }}
      >
        {subItems.length}
      </span>
    );
  };

  const ButtonContent = (
    <div className="flex items-center gap-2.5 w-full min-w-0">
      {renderIcon()}
      {!collapsed && (
        <>
          <span
            className="flex-1 truncate"
            style={{
              fontFamily: 'var(--aeos-font-body, "DM Sans"), system-ui, sans-serif',
              fontSize: cfg.textSize,
              fontWeight: isActive ? 600 : cfg.weight,
              color: isActive ? 'var(--aeos-ink, #E8EDF5)' : 'var(--aeos-ink-muted, #8892A4)',
              letterSpacing: '-0.005em',
              transition: 'color 180ms cubic-bezier(0.22, 1, 0.36, 1), font-weight 180ms',
            }}
          >
            {highlightMatch(item.name, searchTerm)}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {renderBadge()}
            {renderChevron()}
          </div>
        </>
      )}
    </div>
  );

  const sharedClassName = [
    'aeos-menu-item',
    'relative w-full flex items-center cursor-pointer select-none',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40',
    isActive ? 'is-active' : '',
    hasActiveChild ? 'has-active-child' : '',
  ].filter(Boolean).join(' ');

  const sharedStyle = {
    height: cfg.h,
    padding: `0 ${cfg.px}px`,
    borderRadius: 8,
    background: isActive
      ? 'rgba(0, 229, 255, 0.08)'
      : 'transparent',
    border: '1px solid transparent',
    transition: 'background 240ms cubic-bezier(0.22, 1, 0.36, 1), border-color 240ms, transform 180ms',
  };

  const sharedProps = {
    className: sharedClassName,
    style: sharedStyle,
    onClick: handleClick,
    'aria-expanded': hasSubMenu ? isExpanded : undefined,
    onMouseEnter: (e) => {
      if (isActive) return;
      e.currentTarget.style.background = 'rgba(0, 229, 255, 0.04)';
      e.currentTarget.style.borderColor = 'rgba(0, 229, 255, 0.10)';
      e.currentTarget.style.transform = 'translateY(-1px)';
    },
    onMouseLeave: (e) => {
      if (isActive) return;
      e.currentTarget.style.background = 'transparent';
      e.currentTarget.style.borderColor = 'transparent';
      e.currentTarget.style.transform = 'translateY(0)';
    },
  };

  const renderButton = () => {
    if (hasSubMenu) return <button type="button" {...sharedProps}>{ButtonContent}</button>;
    if (itemUrl) return <Link href={itemUrl} method={item.method || 'get'} preserveState preserveScroll cacheFor="1m" {...sharedProps}>{ButtonContent}</Link>;
    return <button type="button" {...sharedProps} disabled>{ButtonContent}</button>;
  };

  return (
    <div className="relative w-full" style={{ marginBottom: level === 0 ? 2 : 1 }}>
      {/* Active left bar — 2px cyan, glow */}
      {isActive && (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{
            height: cfg.h - 12,
            width: 2,
            background: 'var(--aeos-cyan, #00E5FF)',
            boxShadow: '0 0 8px rgba(0, 229, 255, 0.50)',
          }}
        />
      )}

      {renderButton()}

      <AnimatePresence initial={false}>
        {hasSubMenu && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className="relative mt-1 space-y-0.5"
              style={{ marginLeft: level === 0 ? 16 : 12, paddingLeft: 14 }}
            >
              {/* Cyan-tinted connection rail */}
              <span
                aria-hidden
                className="absolute left-0 top-0 bottom-2 rounded-full pointer-events-none"
                style={{ width: 1, background: 'rgba(0, 229, 255, 0.18)' }}
              />

              {subItems.map((subItem) => {
                const subItemId = getMenuItemId(subItem, itemId);
                const subItemUrl = getMenuItemUrl(subItem);
                const subItemActive = subItemUrl && activePath === subItemUrl;
                const subItemHasActiveChild = isItemActive(subItem, activePath) && !subItemActive;
                const subItemExpanded = expandedMenus?.has(subItemId)
                  || (!!searchTerm && ((subItem.subMenu?.length > 0) || (subItem.children?.length > 0)));

                return (
                  <MenuItem3D
                    key={subItemId}
                    item={subItem}
                    level={level + 1}
                    isActive={subItemActive}
                    hasActiveChild={subItemHasActiveChild}
                    isExpanded={subItemExpanded}
                    onToggle={onToggle}
                    onNavigate={onNavigate}
                    searchTerm={searchTerm}
                    variant={variant}
                    collapsed={collapsed}
                    parentId={itemId}
                    expandedMenus={expandedMenus}
                    activePath={activePath}
                  />
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

MenuItem3D.displayName = 'MenuItem3D';

export default MenuItem3D;
