/**
 * MenuItem — aeos365 nav-item
 *
 * Flat 16×16 outline icon + DM Sans label + mono count badge.
 * Active state: rgba(0,229,255,0.08) bg + cyan border + cyan text + cyan-filled count.
 * Hover: rgba(255,255,255,0.03) bg + ink color.
 * No 3D, no rotation, no scale, no animated gradients.
 *
 * Filename retained as MenuItem3D.jsx for import-stability; the "3D" name is
 * a misnomer post-aeos365.
 *
 * @see aeos365-design-system/project/preview/app-shell.html (.nav-item)
 */

import React, { useCallback, useMemo, useState } from 'react';
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
  const [hovered, setHovered] = useState(false);
  const hasSubMenu = (item.subMenu?.length > 0) || (item.children?.length > 0);
  const subItems = item.subMenu || item.children || [];
  const itemUrl = getMenuItemUrl(item);
  const itemId = getMenuItemId(item, parentId);

  // Spec sizing — flat 8×10 padding, 16×16 icons, slightly smaller for nested
  const cfg = useMemo(() => {
    if (level === 0) return { px: 10, py: 8, iconSize: 16, fontSize: '0.86rem', fontWeight: 500 };
    if (level === 1) return { px: 10, py: 7, iconSize: 14, fontSize: '0.8rem', fontWeight: 450 };
    return { px: 10, py: 6, iconSize: 13, fontSize: '0.75rem', fontWeight: 400 };
  }, [level]);

  const handleClick = useCallback((e) => {
    if (hasSubMenu) {
      e.preventDefault();
      onToggle?.(itemId);
    } else if (itemUrl) {
      onNavigate?.(item);
    }
  }, [hasSubMenu, itemId, itemUrl, item, onToggle, onNavigate]);

  // Resolve count: child count if submenu, else item.count, else null
  const countValue = useMemo(() => {
    if (typeof item.count === 'number' || typeof item.count === 'string') return item.count;
    if (hasSubMenu) return subItems.length;
    return null;
  }, [item.count, hasSubMenu, subItems.length]);

  const renderIcon = () => {
    if (!item.icon) return null;
    return (
      <span
        style={{
          width: cfg.iconSize,
          height: cfg.iconSize,
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'currentColor',
        }}
      >
        {React.isValidElement(item.icon)
          ? React.cloneElement(item.icon, { style: { width: cfg.iconSize, height: cfg.iconSize } })
          : item.icon}
      </span>
    );
  };

  const renderCount = () => {
    if (countValue === null || countValue === undefined || collapsed) return null;
    return (
      <span
        style={{
          marginLeft: 'auto',
          fontFamily: 'var(--aeos-font-mono, "JetBrains Mono"), ui-monospace, monospace',
          fontSize: '0.65rem',
          padding: '2px 6px',
          borderRadius: 4,
          background: isActive
            ? 'var(--aeos-cyan, #00E5FF)'
            : 'rgba(255, 255, 255, 0.06)',
          color: isActive
            ? 'var(--aeos-obsidian, #03040A)'
            : 'var(--aeos-ink, #E8EDF5)',
          fontWeight: isActive ? 700 : 500,
          letterSpacing: '0.02em',
          flexShrink: 0,
          transition: 'background 180ms cubic-bezier(0.22,1,0.36,1), color 180ms',
        }}
      >
        {countValue}
      </span>
    );
  };

  const renderChevron = () => {
    if (!hasSubMenu || collapsed) return null;
    return (
      <motion.span
        animate={{ rotate: isExpanded ? 180 : 0 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        style={{ display: 'inline-flex', flexShrink: 0, marginLeft: countValue ? 4 : 'auto', color: 'currentColor' }}
      >
        <ChevronDownIcon style={{ width: 12, height: 12 }} />
      </motion.span>
    );
  };

  // Compute style — spec exactly
  const baseStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: isActive ? `${cfg.py - 1}px ${cfg.px - 1}px` : `${cfg.py}px ${cfg.px}px`,
    borderRadius: 6,
    fontFamily: 'var(--aeos-font-body, "DM Sans"), system-ui, sans-serif',
    fontSize: cfg.fontSize,
    fontWeight: cfg.fontWeight,
    cursor: 'pointer',
    transition: 'background 180ms cubic-bezier(0.22,1,0.36,1), color 180ms, border-color 180ms',
    background: isActive
      ? 'rgba(0, 229, 255, 0.08)'
      : hovered
        ? 'rgba(255, 255, 255, 0.03)'
        : 'transparent',
    color: isActive
      ? 'var(--aeos-cyan, #00E5FF)'
      : hovered
        ? 'var(--aeos-ink, #E8EDF5)'
        : hasActiveChild
          ? 'var(--aeos-ink, #E8EDF5)'
          : 'var(--aeos-ink-muted, #8892A4)',
    border: isActive ? '1px solid rgba(0, 229, 255, 0.20)' : '1px solid transparent',
    width: '100%',
    textAlign: 'left',
    fontFamilyAdjust: 'inherit',
  };

  const handlersAndAccessibility = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    onClick: handleClick,
    'aria-expanded': hasSubMenu ? isExpanded : undefined,
    'aria-current': isActive ? 'page' : undefined,
  };

  const Body = (
    <>
      {renderIcon()}
      {!collapsed && (
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {highlightMatch(item.name, searchTerm)}
        </span>
      )}
      {renderCount()}
      {renderChevron()}
    </>
  );

  const renderClickable = () => {
    if (hasSubMenu) {
      return (
        <button type="button" style={baseStyle} {...handlersAndAccessibility}>
          {Body}
        </button>
      );
    }
    if (itemUrl) {
      return (
        <Link
          href={itemUrl}
          method={item.method || 'get'}
          preserveState
          preserveScroll
          cacheFor="1m"
          style={baseStyle}
          {...handlersAndAccessibility}
        >
          {Body}
        </Link>
      );
    }
    return (
      <button type="button" style={{ ...baseStyle, cursor: 'default', opacity: 0.6 }} disabled>
        {Body}
      </button>
    );
  };

  return (
    <div style={{ position: 'relative' }}>
      {renderClickable()}

      <AnimatePresence initial={false}>
        {hasSubMenu && isExpanded && !collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                marginLeft: level === 0 ? 14 : 12,
                paddingLeft: 10,
                marginTop: 2,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
              }}
            >
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 4,
                  bottom: 6,
                  width: 1,
                  background: 'rgba(0, 229, 255, 0.15)',
                }}
              />
              {subItems.map((subItem) => {
                const subItemId = getMenuItemId(subItem, itemId);
                const subItemUrl = getMenuItemUrl(subItem);
                const subItemActive = subItemUrl && activePath === subItemUrl;
                const subItemHasActiveChild = isItemActive(subItem, activePath) && !subItemActive;
                const subItemExpanded = expandedMenus?.has(subItemId)
                  || (!!searchTerm && (subItem.subMenu?.length > 0 || subItem.children?.length > 0));
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
