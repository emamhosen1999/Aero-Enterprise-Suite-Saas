/**
 * 3D Motion & Depth System Configuration
 * Enterprise-grade futuristic navigation system
 * 
 * Philosophy:
 * - Depth communicates hierarchy and focus
 * - Motion guides attention without distraction
 * - All animations are interruptible and state-driven
 * - Respects prefers-reduced-motion
 * 
 * @module motionDepthSystem
 */

// ============================================================================
// DEPTH LAYERS
// ============================================================================
/**
 * Z-axis depth layers for 3D positioning
 * Higher values appear closer to user
 */
export const DEPTH_LAYERS = {
  background: 0,
  surface: 10,
  elevated: 20,
  floating: 30,
  overlay: 40,
  modal: 50,
};

/**
 * Perspective values for 3D transform context
 * Lower values = more dramatic 3D effect
 */
export const PERSPECTIVE = {
  subtle: '2000px',    // Minimal 3D, professional
  moderate: '1200px',  // Balanced depth
  dramatic: '800px',   // Strong 3D effect
};

// ============================================================================
// MOTION VARIANTS (Framer Motion)
// ============================================================================

/**
 * Sidebar navigation item motion variants
 * Creates floating, depth-aware navigation experience
 */
export const navItemVariants = {
  idle: {
    scale: 1,
    rotateY: 0,
    rotateX: 0,
    z: DEPTH_LAYERS.surface,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  hover: {
    scale: 1.02,
    rotateY: 2,
    z: DEPTH_LAYERS.elevated,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  active: {
    scale: 1,
    rotateY: 0,
    z: DEPTH_LAYERS.floating,
    boxShadow: '0 8px 30px -8px var(--theme-primary, #006FEE)40',
    transition: {
      type: 'spring',
      stiffness: 350,
      damping: 28,
    },
  },
  tap: {
    scale: 0.97,
    transition: {
      duration: 0.1,
    },
  },
};

/**
 * Submenu expansion variants
 * Depth-based expansion instead of pure slide
 */
export const submenuVariants = {
  collapsed: {
    height: 0,
    opacity: 0,
    z: DEPTH_LAYERS.surface - 5,
    rotateX: -10,
    transformOrigin: 'top',
    transition: {
      height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
      opacity: { duration: 0.2 },
      rotateX: { duration: 0.3 },
    },
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    z: DEPTH_LAYERS.surface,
    rotateX: 0,
    transformOrigin: 'top',
    transition: {
      height: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
      opacity: { duration: 0.3, delay: 0.1 },
      rotateX: { duration: 0.4 },
    },
  },
};

/**
 * Header navigation item variants
 * Subtle depth shifts with light beam indicator
 */
export const headerNavVariants = {
  idle: {
    y: 0,
    z: DEPTH_LAYERS.surface,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  hover: {
    y: -2,
    z: DEPTH_LAYERS.elevated,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  active: {
    y: 0,
    z: DEPTH_LAYERS.floating,
    transition: {
      type: 'spring',
      stiffness: 350,
      damping: 28,
    },
  },
};

/**
 * Sidebar collapse/expand motion
 * Creates floating dock effect when collapsed
 */
export const sidebarVariants = {
  expanded: {
    width: 'auto',
    x: 0,
    rotateY: 0,
    z: DEPTH_LAYERS.surface,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 35,
    },
  },
  collapsed: {
    width: 'auto',
    x: 0,
    rotateY: -5,
    z: DEPTH_LAYERS.elevated,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 35,
    },
  },
};

/**
 * Light beam indicator for active header items
 * Creates futuristic "locked in space" effect
 */
export const lightBeamVariants = {
  hidden: {
    scaleX: 0,
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30,
    },
  },
};

/**
 * Cursor-following tilt effect for depth perception
 * Used on hover to create interactive 3D feel
 */
export const getTiltTransform = (cursorX, cursorY, elementRect) => {
  if (!elementRect) return { rotateX: 0, rotateY: 0 };
  
  const centerX = elementRect.left + elementRect.width / 2;
  const centerY = elementRect.top + elementRect.height / 2;
  
  // Calculate rotation based on cursor distance from center
  const rotateY = ((cursorX - centerX) / elementRect.width) * 10; // Max 10deg
  const rotateX = -((cursorY - centerY) / elementRect.height) * 10; // Max 10deg, inverted
  
  return { rotateX, rotateY };
};

// ============================================================================
// GLOW & SHADOW UTILITIES (Tailwind-compatible)
// ============================================================================

/**
 * Depth-aware shadow configurations
 * Creates layered visual hierarchy
 */
export const depthShadows = {
  none: 'shadow-none',
  subtle: 'shadow-sm drop-shadow-sm',
  elevated: 'shadow-md drop-shadow-md',
  floating: 'shadow-lg drop-shadow-lg',
  overlay: 'shadow-xl drop-shadow-xl',
  modal: 'shadow-2xl drop-shadow-2xl',
};

/**
 * Glow effects for active/hover states
 * Uses CSS variables for theme integration
 */
export const glowEffects = {
  none: '',
  subtle: 'shadow-sm shadow-[var(--theme-primary,#006FEE)]/10',
  moderate: 'shadow-md shadow-[var(--theme-primary,#006FEE)]/20',
  strong: 'shadow-lg shadow-[var(--theme-primary,#006FEE)]/30',
  intense: 'shadow-xl shadow-[var(--theme-primary,#006FEE)]/40',
};

/**
 * Ring glow for focus states
 * Maintains accessibility while adding futuristic feel
 */
export const focusRing = {
  default: 'ring-2 ring-offset-2 ring-[var(--theme-primary,#006FEE)]/50 ring-offset-transparent',
  intense: 'ring-4 ring-offset-2 ring-[var(--theme-primary,#006FEE)]/60 ring-offset-transparent',
};

// ============================================================================
// ANIMATION EASING FUNCTIONS
// ============================================================================

/**
 * Custom easing curves for enterprise feel
 * Smooth, professional animations
 */
export const easings = {
  // Standard enterprise ease - not too bouncy
  enterprise: [0.4, 0, 0.2, 1],
  
  // Smooth entry animation
  enter: [0, 0, 0.2, 1],
  
  // Quick exit animation
  exit: [0.4, 0, 1, 1],
  
  // Elastic effect for interactive elements
  elastic: [0.68, -0.55, 0.265, 1.55],
};

// ============================================================================
// STAGGER CONFIGURATIONS
// ============================================================================

/**
 * Stagger timings for list animations
 * Creates cascading depth reveal
 */
export const staggerConfig = {
  // Fast stagger for quick reveals
  fast: {
    delayChildren: 0.05,
    staggerChildren: 0.03,
  },
  
  // Standard stagger for most lists
  standard: {
    delayChildren: 0.1,
    staggerChildren: 0.05,
  },
  
  // Slow stagger for dramatic effect
  slow: {
    delayChildren: 0.15,
    staggerChildren: 0.08,
  },
};

// ============================================================================
// ACCESSIBILITY: REDUCED MOTION SUPPORT
// ============================================================================

/**
 * Checks user's motion preference
 * Returns simplified variants if reduced motion is preferred
 */
export const getMotionPreference = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Returns appropriate variants based on motion preference
 */
export const getAccessibleVariants = (normalVariants) => {
  if (getMotionPreference()) {
    // Strip out complex transforms, keep only opacity and basic transitions
    return Object.keys(normalVariants).reduce((acc, key) => {
      acc[key] = {
        opacity: normalVariants[key].opacity ?? 1,
        transition: { duration: 0.1 },
      };
      return acc;
    }, {});
  }
  return normalVariants;
};

// ============================================================================
// PERFORMANCE OPTIMIZATIONS
// ============================================================================

/**
 * GPU-accelerated properties
 * Use these for smooth 60fps animations
 */
export const gpuAccelerated = {
  willChange: 'transform, opacity',
  transform: 'translateZ(0)',
};

/**
 * Layout shift prevention
 * Ensures animations don't cause reflow
 */
export const noLayoutShift = {
  contain: 'layout style paint',
};

// ============================================================================
// EXPORT UTILITY HOOK
// ============================================================================

/**
 * Custom hook to use motion system with context awareness
 */
export const useMotionSystem = () => {
  const prefersReducedMotion = getMotionPreference();
  
  return {
    prefersReducedMotion,
    variants: {
      navItem: getAccessibleVariants(navItemVariants),
      submenu: getAccessibleVariants(submenuVariants),
      headerNav: getAccessibleVariants(headerNavVariants),
      sidebar: getAccessibleVariants(sidebarVariants),
      lightBeam: getAccessibleVariants(lightBeamVariants),
    },
    shadows: depthShadows,
    glows: glowEffects,
    focus: focusRing,
    easings,
    stagger: staggerConfig,
    getTiltTransform,
    DEPTH_LAYERS,
    PERSPECTIVE,
  };
};

export default {
  navItemVariants,
  submenuVariants,
  headerNavVariants,
  sidebarVariants,
  lightBeamVariants,
  depthShadows,
  glowEffects,
  focusRing,
  easings,
  staggerConfig,
  getTiltTransform,
  getMotionPreference,
  getAccessibleVariants,
  useMotionSystem,
  DEPTH_LAYERS,
  PERSPECTIVE,
};
