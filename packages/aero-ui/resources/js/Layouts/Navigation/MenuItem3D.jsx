/**
 * MenuItem3D - Premium navigation menu item with advanced effects
 *
 * Visual Features:
 * - Magnetic hover with spotlight parallax
 * - Active indicator pill with spring animation
 * - Gradient icon containers with module accent colors
 * - Shimmer highlight sweep on hover
 * - Staggered submenu reveal with blur cascade
 * - Animated connection lines for hierarchy depth
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { getMenuItemUrl, highlightMatch, getMenuItemId, isItemActive } from './navigationUtils.jsx';

// Module accent palette — each module gets its own color identity
const MODULE_ACCENTS = {
  dashboard: { from: '#6366F1', to: '#818CF8' },
  hrm:       { from: '#F59E0B', to: '#FBBF24' },
  crm:       { from: '#10B981', to: '#34D399' },
  finance:   { from: '#3B82F6', to: '#60A5FA' },
  project:   { from: '#8B5CF6', to: '#A78BFA' },
  settings:  { from: '#6B7280', to: '#9CA3AF' },
  default:   { from: 'var(--theme-primary, #006FEE)', to: 'var(--theme-primary-400, #338EF7)' },
};

const getModuleAccent = (item) => {
  const name = (item?.module || item?.category || item?.name || '').toLowerCase();
  for (const [key, val] of Object.entries(MODULE_ACCENTS)) {
    if (name.includes(key)) return val;
  }
  return MODULE_ACCENTS.default;
};

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
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const itemRef = useRef(null);

  const hasSubMenu = item.subMenu?.length > 0 || item.children?.length > 0;
  const subItems = item.subMenu || item.children || [];
  const itemUrl = getMenuItemUrl(item);
  const itemId = getMenuItemId(item, parentId);
  const accent = useMemo(() => getModuleAccent(item), [item]);

  // Track mouse for spotlight parallax
  const handleMouseMove = useCallback((e) => {
    if (!itemRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  }, []);

  // Level-based sizing
  const cfg = useMemo(() => {
    if (level === 0) return { h: 42, px: 10, iconBox: 32, iconSize: 20, textSize: '0.875rem', weight: 500 };
    if (level === 1) return { h: 38, px: 10, iconBox: 28, iconSize: 18, textSize: '0.8125rem', weight: 450 };
    return { h: 34, px: 10, iconBox: 24, iconSize: 16, textSize: '0.75rem', weight: 400 };
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

  // Icon with gradient container
  const renderIcon = () => {
    if (!item.icon) return null;
    const showAccent = isActive || isHovered;
    return (
      <motion.div
        className="relative shrink-0 flex items-center justify-center rounded-lg"
        style={{
          width: cfg.iconBox,
          height: cfg.iconBox,
          background: showAccent
            ? `linear-gradient(135deg, ${accent.from}20, ${accent.to}15)`
            : 'color-mix(in srgb, var(--theme-content3, #E4E4E7) 40%, transparent)',
          transition: 'background 0.3s ease',
        }}
        animate={isHovered ? { scale: 1.08 } : { scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        <span
          style={{
            color: isActive ? accent.from : (isHovered ? accent.from : 'color-mix(in srgb, var(--theme-foreground, #11181C) 72%, transparent)'),
            width: cfg.iconSize,
            height: cfg.iconSize,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s ease',
          }}
        >
          {React.isValidElement(item.icon)
            ? React.cloneElement(item.icon, { style: { width: cfg.iconSize, height: cfg.iconSize } })
            : item.icon
          }
        </span>
      </motion.div>
    );
  };

  const renderChevron = () => {
    if (!hasSubMenu) return null;
    return (
      <motion.div
        animate={{ rotate: isExpanded ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="shrink-0 ml-auto"
      >
        <ChevronDownIcon
          className="w-3.5 h-3.5"
          style={{
            color: isActive ? accent.from : 'color-mix(in srgb, var(--theme-foreground, #11181C) 45%, transparent)',
            transition: 'color 0.2s ease',
          }}
        />
      </motion.div>
    );
  };

  const renderBadge = () => {
    if (!hasSubMenu || collapsed) return null;
    return (
      <span
        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none"
        style={{
          background: isHighlighted
            ? `${accent.from}18`
            : 'color-mix(in srgb, var(--theme-content3, #E4E4E7) 60%, transparent)',
          color: isHighlighted ? accent.from : 'color-mix(in srgb, var(--theme-foreground, #11181C) 58%, transparent)',
          transition: 'all 0.2s ease',
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
              fontSize: cfg.textSize,
              fontWeight: isActive ? 600 : cfg.weight,
              color: isActive ? accent.from : 'var(--theme-foreground, #11181C)',
              letterSpacing: isActive ? '-0.01em' : '0',
              transition: 'all 0.2s ease',
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

  const sharedProps = {
    ref: itemRef,
    className: 'relative w-full flex items-center cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
    style: {
      height: cfg.h,
      padding: `0 ${cfg.px}px`,
      borderRadius: 'var(--borderRadius, 10px)',
    },
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => { setIsHovered(false); setMousePos({ x: 0.5, y: 0.5 }); },
    onMouseMove: handleMouseMove,
    onClick: handleClick,
    'aria-expanded': hasSubMenu ? isExpanded : undefined,
  };

  const renderButton = () => {
    if (hasSubMenu) return <button type="button" {...sharedProps}>{ButtonContent}</button>;
    if (itemUrl) return <Link href={itemUrl} method={item.method || 'get'} preserveState preserveScroll cacheFor="1m" {...sharedProps}>{ButtonContent}</Link>;
    return <button type="button" {...sharedProps} disabled>{ButtonContent}</button>;
  };

  return (
    <motion.div
      className="relative w-full"
      style={{ marginBottom: level === 0 ? 2 : 1 }}
      initial={false}
    >
      {/* Active indicator pill — animated left edge */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-full z-10"
            style={{
              height: cfg.h - 14,
              background: `linear-gradient(180deg, ${accent.from}, ${accent.to})`,
              boxShadow: `0 0 8px ${accent.from}50`,
            }}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            exit={{ scaleY: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            layoutId="navActiveIndicator"
          />
        )}
      </AnimatePresence>

      {/* Hover spotlight + active background layer */}
      <motion.div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ borderRadius: 'var(--borderRadius, 10px)' }}
      >
        {/* Background fill */}
        <motion.div
          className="absolute inset-0"
          animate={{
            opacity: isActive ? 1 : (isHovered ? 1 : 0),
            background: isActive
              ? `linear-gradient(135deg, ${accent.from}12, ${accent.to}08)`
              : `radial-gradient(circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, var(--theme-content3, #E4E4E7)50, transparent 70%)`,
          }}
          transition={{ duration: 0.2 }}
        />
        {/* Shimmer sweep on hover */}
        {isHovered && !isActive && (
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(105deg, transparent 40%, color-mix(in srgb, var(--theme-foreground) 12%, transparent) 50%, transparent 60%)',
              backgroundSize: '200% 100%',
            }}
            animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          />
        )}
      </motion.div>

      {/* Button with magnetic slide */}
      <motion.div
        className="relative z-[1]"
        animate={isHovered ? { x: 3 } : { x: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        {renderButton()}
      </motion.div>

      {/* Submenu with cascade reveal */}
      <AnimatePresence initial={false}>
        {hasSubMenu && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className="relative mt-1 space-y-0.5"
              style={{ marginLeft: level === 0 ? 16 : 12, paddingLeft: 14 }}
            >
              {/* Animated gradient connection line */}
              <motion.div
                className="absolute left-0 top-0 bottom-2 w-[2px] rounded-full"
                style={{ background: `linear-gradient(180deg, ${accent.from}35, ${accent.from}08)` }}
                initial={{ scaleY: 0, originY: 0 }}
                animate={{ scaleY: 1 }}
                exit={{ scaleY: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              />

              {subItems.map((subItem, index) => {
                const subItemId = getMenuItemId(subItem, itemId);
                const subItemUrl = getMenuItemUrl(subItem);
                const subItemActive = subItemUrl && activePath === subItemUrl;
                const subItemHasActiveChild = isItemActive(subItem, activePath) && !subItemActive;
                const subItemExpanded = expandedMenus?.has(subItemId) || (searchTerm && (subItem.subMenu?.length > 0 || subItem.children?.length > 0));

                return (
                  <motion.div
                    key={subItemId}
                    initial={{ opacity: 0, x: -8, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, x: -8, filter: 'blur(4px)' }}
                    transition={{ delay: index * 0.04, duration: 0.25, ease: 'easeOut' }}
                  >
                    <MenuItem3D
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
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

MenuItem3D.displayName = 'MenuItem3D';

export default MenuItem3D;
