/**
 * MenuItem3D - Reusable 3D-styled menu item component
 * Used by both Sidebar and Header navigation
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Chip } from "@heroui/react";
import { ChevronRightIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { getMenuItemUrl, highlightMatch, getMenuItemId } from './navigationUtils.jsx';

/**
 * MenuItem3D Component
 * 
 * @param {Object} item - Menu item data
 * @param {number} level - Nesting level (0 = root)
 * @param {boolean} isActive - Whether this item is active
 * @param {boolean} isExpanded - Whether submenu is expanded
 * @param {function} onToggle - Toggle submenu callback
 * @param {function} onNavigate - Navigation callback
 * @param {string} searchTerm - Current search term for highlighting
 * @param {string} variant - 'sidebar' | 'header'
 * @param {boolean} collapsed - Sidebar collapsed mode
 */
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
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  const hasSubMenu = item.subMenu?.length > 0 || item.children?.length > 0;
  const subItems = item.subMenu || item.children || [];
  const itemUrl = getMenuItemUrl(item);
  const itemId = getMenuItemId(item, parentId);
  
  // Styling based on level and state
  const styles = useMemo(() => {
    const isHighlighted = isActive || hasActiveChild || isExpanded;
    
    // Size and spacing based on level
    const sizes = {
      0: { height: 'h-11', padding: 'px-3', icon: 'w-5 h-5', text: 'text-sm', indent: 0 },
      1: { height: 'h-10', padding: 'px-3', icon: 'w-4 h-4', text: 'text-sm', indent: 16 },
      2: { height: 'h-9', padding: 'px-3', icon: 'w-4 h-4', text: 'text-xs', indent: 32 },
    };
    const sizeConfig = sizes[Math.min(level, 2)];
    
    return {
      container: `
        relative w-full mb-1
        ${variant === 'header' ? 'min-w-[180px]' : ''}
      `,
      button: `
        w-full flex items-center gap-2 justify-start
        ${sizeConfig.height} ${sizeConfig.padding}
        transition-all duration-200 ease-out
        cursor-pointer select-none
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
      `,
      text: `${sizeConfig.text} font-medium flex-1 truncate`,
      icon: sizeConfig.icon,
      indent: sizeConfig.indent,
      
      // 3D styles
      idle: {
        backgroundColor: `color-mix(in srgb, var(--theme-content2, #F4F4F5) 50%, transparent)`,
        border: `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-divider, #E4E4E7) 60%, transparent)`,
        borderRadius: `var(--borderRadius, 8px)`,
        boxShadow: '0 2px 8px -2px rgba(0,0,0,0.05)',
        color: `var(--theme-foreground, #11181C)`,
      },
      hover: {
        backgroundColor: `color-mix(in srgb, var(--theme-content3, #E4E4E7) 60%, transparent)`,
        border: `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-divider, #E4E4E7) 80%, transparent)`,
        borderRadius: `var(--borderRadius, 8px)`,
        boxShadow: '0 8px 25px -5px rgba(0,0,0,0.12)',
        transform: 'perspective(1000px) rotateX(-2deg) translateZ(8px) translateY(-2px)',
        color: `var(--theme-foreground, #11181C)`,
      },
      active: {
        backgroundColor: isActive 
          ? `color-mix(in srgb, var(--theme-primary, #006FEE) 85%, transparent)`
          : `color-mix(in srgb, var(--theme-primary, #006FEE) 15%, transparent)`,
        border: `var(--borderWidth, 2px) solid var(--theme-primary, #006FEE)`,
        borderRadius: `var(--borderRadius, 8px)`,
        boxShadow: '0 4px 15px -3px var(--theme-primary, #006FEE)40',
        transform: 'perspective(1000px) translateZ(4px)',
        color: isActive ? '#FFFFFF' : `var(--theme-primary, #006FEE)`,
      },
      pressed: {
        transform: 'perspective(1000px) translateZ(2px) scale(0.98)',
      },
    };
  }, [level, isActive, hasActiveChild, isExpanded, variant]);
  
  // Get current style based on state
  const getCurrentStyle = useCallback(() => {
    if (isPressed) {
      return { ...styles.active, ...styles.pressed };
    }
    if (isActive || hasActiveChild || isExpanded) {
      return isHovered ? { ...styles.active, ...styles.hover } : styles.active;
    }
    return isHovered ? styles.hover : styles.idle;
  }, [isPressed, isActive, hasActiveChild, isExpanded, isHovered, styles]);
  
  // Handle click
  const handleClick = useCallback((e) => {
    if (hasSubMenu) {
      e.preventDefault();
      onToggle?.(itemId);
    } else if (itemUrl) {
      onNavigate?.(item);
    }
  }, [hasSubMenu, itemId, itemUrl, item, onToggle, onNavigate]);
  
  // Render icon
  const renderIcon = () => {
    if (!item.icon) return null;
    
    const iconColor = (isActive || isHovered) 
      ? (isActive ? '#FFFFFF' : 'var(--theme-primary, #006FEE)')
      : 'var(--theme-foreground, #11181C)';
    
    return (
      <motion.span
        className={styles.icon}
        style={{ color: iconColor }}
        animate={isHovered ? { scale: 1.1, rotate: 3 } : { scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {React.isValidElement(item.icon) 
          ? React.cloneElement(item.icon, { className: styles.icon })
          : item.icon
        }
      </motion.span>
    );
  };
  
  // Render chevron for items with submenus
  const renderChevron = () => {
    if (!hasSubMenu) return null;
    
    const ChevronIcon = variant === 'header' ? ChevronRightIcon : ChevronDownIcon;
    const rotation = variant === 'header' 
      ? (isExpanded ? 0 : 0) 
      : (isExpanded ? 180 : 0);
    
    return (
      <motion.div
        animate={{ rotate: rotation }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="shrink-0"
      >
        <ChevronIcon 
          className="w-4 h-4"
          style={{ 
            color: isActive ? '#FFFFFF' : (isExpanded ? 'var(--theme-primary, #006FEE)' : 'var(--theme-foreground-500, #71717A)') 
          }}
        />
      </motion.div>
    );
  };
  
  // Render count badge
  const renderBadge = () => {
    if (!hasSubMenu) return null;
    
    return (
      <Chip
        size="sm"
        variant="flat"
        color={(isActive || hasActiveChild || isExpanded) ? "primary" : "default"}
        className="h-5 min-w-5 px-1.5 text-xs"
      >
        {subItems.length}
      </Chip>
    );
  };
  
  // Main button content
  const ButtonContent = (
    <>
      {/* Left side: icon + text */}
      <div className="flex items-center gap-2 flex-1 min-w-0" style={{ paddingLeft: styles.indent }}>
        {renderIcon()}
        <span 
          className={styles.text}
          style={{ color: 'inherit' }}
        >
          {highlightMatch(item.name, searchTerm)}
        </span>
      </div>
      
      {/* Right side: badge + chevron */}
      <div className="flex items-center gap-1.5 shrink-0">
        {renderBadge()}
        {renderChevron()}
      </div>
      
      {/* Active glow effect */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, var(--theme-primary, #006FEE)15, transparent 70%)`,
            borderRadius: 'inherit',
          }}
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      
      {/* Bottom light beam for active items */}
      {isActive && (
        <motion.div
          className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)`,
          }}
          animate={{ opacity: [0.5, 1, 0.5], scaleX: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </>
  );
  
  // Render as link or button
  const renderButton = () => {
    const buttonProps = {
      className: styles.button,
      style: getCurrentStyle(),
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false),
      onMouseDown: () => setIsPressed(true),
      onMouseUp: () => setIsPressed(false),
      onClick: handleClick,
      'aria-expanded': hasSubMenu ? isExpanded : undefined,
      'aria-haspopup': hasSubMenu ? 'true' : undefined,
    };
    
    if (hasSubMenu) {
      return (
        <button type="button" {...buttonProps}>
          {ButtonContent}
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
          {...buttonProps}
        >
          {ButtonContent}
        </Link>
      );
    }
    
    return (
      <button type="button" {...buttonProps} disabled>
        {ButtonContent}
      </button>
    );
  };
  
  return (
    <motion.div
      className={styles.container}
      style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
      initial={false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Main Item */}
      <motion.div
        whileHover={{ z: 10 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {renderButton()}
      </motion.div>
      
      {/* Submenu */}
      <AnimatePresence>
        {hasSubMenu && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0, rotateX: -10 }}
            animate={{ opacity: 1, height: 'auto', rotateX: 0 }}
            exit={{ opacity: 0, height: 0, rotateX: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{ transformOrigin: 'top', overflow: 'hidden' }}
          >
            <div 
              className="mt-1 space-y-0.5"
              style={{
                marginLeft: level === 0 ? '12px' : '8px',
                paddingLeft: '12px',
                borderLeft: `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-primary, #006FEE) 30%, transparent)`,
              }}
            >
              {subItems.map((subItem, index) => (
                <motion.div
                  key={getMenuItemId(subItem, itemId)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                >
                  <MenuItem3D
                    item={subItem}
                    level={level + 1}
                    isActive={false} // Will be determined by parent
                    isExpanded={false} // Will be determined by parent
                    onToggle={onToggle}
                    onNavigate={onNavigate}
                    searchTerm={searchTerm}
                    variant={variant}
                    collapsed={collapsed}
                    parentId={itemId}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

MenuItem3D.displayName = 'MenuItem3D';

export default MenuItem3D;
