// ─── AEOS Framer Motion Variants Library ──────────────────────────────────────
// Centralized animation configs. Import from components as needed.

// ── Entry Animations ──────────────────────────────────────────────────────────

export const fadeUp = {
  hidden:  { opacity: 0, y: 48 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 },
  }),
};

export const fadeIn = {
  hidden:  { opacity: 0 },
  visible: (i = 0) => ({
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut", delay: i * 0.1 },
  }),
};

export const slideLeft = {
  hidden:  { opacity: 0, x: 80 },
  visible: {
    opacity: 1, x: 0,
    transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
  },
};

export const slideRight = {
  hidden:  { opacity: 0, x: -80 },
  visible: {
    opacity: 1, x: 0,
    transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
  },
};

export const scaleIn = {
  hidden:  { opacity: 0, scale: 0.84 },
  visible: (i = 0) => ({
    opacity: 1, scale: 1,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 },
  }),
};

export const scaleInSpring = {
  hidden:  { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1, scale: 1,
    transition: { type: "spring", stiffness: 200, damping: 22, mass: 0.8 },
  },
};

// ── Stagger Containers ────────────────────────────────────────────────────────

export const staggerContainer = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

export const staggerFast = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.0 } },
};

export const staggerSlow = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.18, delayChildren: 0.2 } },
};

// ── Hero Specific ─────────────────────────────────────────────────────────────

export const heroContainer = {
  hidden:  {},
  visible: {
    transition: { staggerChildren: 0.14, delayChildren: 0.3 },
  },
};

export const heroLabel = {
  hidden:  { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: {
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export const heroTitle = {
  hidden:  { opacity: 0, y: 40, filter: "blur(12px)" },
  visible: {
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
};

export const heroSubtitle = {
  hidden:  { opacity: 0, y: 24 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

export const heroButtons = {
  hidden:  { opacity: 0, y: 20 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export const heroMockup = {
  hidden:  { opacity: 0, y: 60, scale: 0.92, rotateX: 8 },
  visible: {
    opacity: 1, y: 0, scale: 1, rotateX: 0,
    transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.6 },
  },
};

// ── Scroll-Linked Parallax Transforms ─────────────────────────────────────────
// These are used with useScroll + useTransform in scroll-linked sections.
// Each export describes the input/output ranges for useTransform.

export const parallaxConfigs = {
  /** Slow upward drift for background layer (z: far) */
  backgroundFar: {
    inputRange:  [0, 1],
    outputRange: ["0%", "-30%"],
    ease:        "linear",
  },

  /** Medium drift for mid-ground (z: mid) */
  midground: {
    inputRange:  [0, 1],
    outputRange: ["0%", "-15%"],
  },

  /** Subtle for foreground text */
  foreground: {
    inputRange:  [0, 1],
    outputRange: ["0%", "-6%"],
  },

  /** Hero mockup float upward as user scrolls down */
  heroMockupScroll: {
    inputRange:  [0, 0.4],
    outputRange: [0, -80],
  },

  /** Hero text opacity fades out on scroll */
  heroTextOpacity: {
    inputRange:  [0, 0.25],
    outputRange: [1, 0],
  },

  /** Hero text slight parallax up */
  heroTextY: {
    inputRange:  [0, 0.4],
    outputRange: [0, -40],
  },

  /** Narrative section: text block Y per step */
  narrativeY: {
    inputRange:  [0, 0.5, 1],
    outputRange: [60, 0, -60],
  },

  /** Narrative opacity in/out curve */
  narrativeOpacity: {
    inputRange:  [0, 0.2, 0.8, 1],
    outputRange: [0, 1, 1, 0],
  },
};

// ── Bento Card Hover ──────────────────────────────────────────────────────────

export const bentoCardHover = {
  rest:  { scale: 1, boxShadow: "0 4px 32px rgba(0,0,0,0.6)" },
  hover: {
    scale: 1.025,
    boxShadow: "0 16px 56px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,229,255,0.2)",
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
};

export const bentoIconHover = {
  rest:  { scale: 1, rotate: 0 },
  hover: {
    scale: 1.15,
    rotate: [0, -8, 8, 0],
    transition: { duration: 0.5, ease: "easeInOut" },
  },
};

// ── Nav Animation ─────────────────────────────────────────────────────────────

export const navVariants = {
  top: {
    backgroundColor: "rgba(3, 4, 10, 0)",
    borderBottomColor: "rgba(0, 229, 255, 0)",
    backdropFilter: "blur(0px)",
  },
  scrolled: {
    backgroundColor: "rgba(7, 11, 20, 0.88)",
    borderBottomColor: "rgba(0, 229, 255, 0.1)",
    backdropFilter: "blur(20px)",
  },
};

// ── Stats Counter ─────────────────────────────────────────────────────────────

export const statsContainer = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};

export const statItem = {
  hidden:  { opacity: 0, y: 32, scale: 0.9 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

// ── Testimonial Slider ────────────────────────────────────────────────────────

export const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.96,
  }),
  center: {
    zIndex: 1, x: 0, opacity: 1, scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
  exit: (direction) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    scale: 0.96,
    transition: { duration: 0.4 },
  }),
};

// ── CTA Section ───────────────────────────────────────────────────────────────

export const ctaVariants = {
  hidden: { opacity: 0, y: 60, scale: 0.95 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
};

// ── Mobile Menu ───────────────────────────────────────────────────────────────

export const mobileMenuVariants = {
  closed: {
    opacity: 0, height: 0,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
  open: {
    opacity: 1, height: "auto",
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
};

export const mobileMenuItemVariants = {
  closed: { opacity: 0, x: -16 },
  open: (i) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ── Scroll-Triggered Section Wrapper (convenience) ────────────────────────────
// Usage: wrap any section in <SectionReveal>

export const sectionReveal = {
  hidden:  { opacity: 0, y: 56 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};
