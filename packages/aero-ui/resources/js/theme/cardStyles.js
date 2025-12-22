/**
 * Card Style System for Aero Enterprise Suite
 * 
 * Provides predefined card styles that automatically sync with theme colors,
 * layouts, borders, and fonts throughout the application.
 * 
 * Each style defines Tailwind classes for:
 * - base: Main card container styling
 * - header: CardHeader styling
 * - body: CardBody styling  
 * - footer: CardFooter styling
 * 
 * Features:
 * - Auto-synced colors (no manual color picking)
 * - Dark mode variants built-in
 * - Responsive and accessible
 * - Professional designer-curated aesthetics
 */

/**
 * Card style configuration interface
 * @typedef {Object} CardStyleConfig
 * @property {string} name - Display name
 * @property {string} description - Brief description
 * @property {CardStyleClasses} classes - Tailwind classes
 * @property {CardStyleTheme} theme - Auto-generated theme variables
 */

/**
 * Card style Tailwind classes
 * @typedef {Object} CardStyleClasses
 * @property {string} base - Card container classes
 * @property {string} header - Card header classes
 * @property {string} body - Card body classes
 * @property {string} footer - Card footer classes
 */

/**
 * Auto-generated theme variables for card style
 * @typedef {Object} CardStyleTheme
 * @property {Object} colors - Color palette
 * @property {Object} layout - Layout settings (borderRadius, borderWidth, etc.)
 */

export const cardStyles = {
  // =========================================
  // 1. Modern Clean (Standard SaaS)
  // Professional, clean, suitable for business apps
  // =========================================
  modern: {
    name: 'Modern Clean',
    description: 'Professional and minimal design for SaaS applications',
    classes: {
      base: 'bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800 shadow-small hover:shadow-medium dark:hover:border-zinc-700 rounded-large transition-all duration-300 hover:-translate-y-1',
      header: 'pb-2 pt-5 px-5 flex-col items-start font-bold text-large text-zinc-900 dark:text-zinc-100',
      body: 'py-2 px-5 text-zinc-500 dark:text-zinc-400',
      footer: 'pt-2 px-5 pb-5',
    },
    theme: {
      colors: {
        primary: '#006FEE',
        secondary: '#7828C8',
        success: '#17C964',
        warning: '#F5A524',
        danger: '#F31260',
        content1: '#FFFFFF',
        content2: '#F4F4F5',
        content3: '#E4E4E7',
        content4: '#D4D4D8',
        background: '#FFFFFF',
        foreground: '#11181C',
        divider: '#E4E4E7',
      },
      layout: {
        borderRadius: '12px',
        borderWidth: '1px',
        fontFamily: 'Inter',
      },
    },
  },

  // =========================================
  // 2. Frosted Glass (iOS Style)
  // Elegant glassmorphism effect
  // =========================================
  glass: {
    name: 'Frosted Glass',
    description: 'iOS-inspired glassmorphism with backdrop blur',
    classes: {
      base: 'bg-white/30 dark:bg-black/30 backdrop-blur-md hover:backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-lg hover:shadow-xl rounded-2xl transition-all duration-500 group',
      header: 'pb-2 pt-5 px-5 flex-col items-start text-zinc-900 dark:text-gray-100 font-semibold drop-shadow-md',
      body: 'text-zinc-700 dark:text-gray-300/90 py-2 px-5 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors',
      footer: 'border-t border-white/20 dark:border-white/5 bg-white/10 dark:bg-black/20 px-5 py-3',
    },
    theme: {
      colors: {
        primary: '#007AFF',
        secondary: '#5856D6',
        success: '#34C759',
        warning: '#FF9500',
        danger: '#FF3B30',
        content1: 'rgba(255, 255, 255, 0.7)',
        content2: 'rgba(255, 255, 255, 0.5)',
        content3: 'rgba(255, 255, 255, 0.3)',
        content4: 'rgba(255, 255, 255, 0.2)',
        background: 'rgba(255, 255, 255, 0.1)',
        foreground: '#1C1C1E',
        divider: 'rgba(255, 255, 255, 0.2)',
      },
      layout: {
        borderRadius: '16px',
        borderWidth: '1px',
        fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
      },
    },
  },

  // =========================================
  // 3. Neo-Brutalism (Bold & Trendy)
  // Bold, trendy, high-contrast design
  // =========================================
  neo: {
    name: 'Neo-Brutalism',
    description: 'Bold, high-contrast design with sharp edges',
    classes: {
      base: 'bg-[#FFDEE9] dark:bg-[#4c1d95] border-[3px] border-black dark:border-white rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all duration-200 ease-out',
      header: 'border-b-[3px] border-black dark:border-white bg-white dark:bg-black px-5 py-3 font-black uppercase tracking-wider text-black dark:text-white text-xl',
      body: 'p-5 text-black dark:text-white font-bold leading-tight',
      footer: 'border-t-[3px] border-black dark:border-white bg-black dark:bg-white text-[#FFDEE9] dark:text-[#4c1d95] p-3 font-mono text-sm uppercase',
    },
    theme: {
      colors: {
        primary: '#FF0080',
        secondary: '#7928CA',
        success: '#00FF00',
        warning: '#FFFF00',
        danger: '#FF0000',
        content1: '#FFDEE9',
        content2: '#FFB3C1',
        content3: '#FF8FA3',
        content4: '#FF758F',
        background: '#FFDEE9',
        foreground: '#000000',
        divider: '#000000',
      },
      layout: {
        borderRadius: '0px',
        borderWidth: '3px',
        fontFamily: 'Space Grotesk, monospace',
      },
    },
  },

  // =========================================
  // 4. Cyberpunk (Futuristic)
  // Futuristic neon glow design
  // =========================================
  cyber: {
    name: 'Cyberpunk',
    description: 'Futuristic design with neon glow effects',
    classes: {
      base: 'bg-slate-900 dark:bg-black border border-cyan-600/50 dark:border-cyan-500 shadow-[0_0_10px_rgba(8,145,178,0.2)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] hover:border-cyan-400 rounded-lg transition-all duration-500',
      header: 'text-cyan-600 dark:text-cyan-400 font-mono tracking-[0.2em] uppercase border-b border-cyan-900/30 py-3 pl-4',
      body: 'text-slate-400 dark:text-cyan-200/80 font-mono py-4 px-4',
      footer: 'bg-cyan-950/20 border-t border-cyan-500/20 px-4 py-2 text-xs text-cyan-600 dark:text-cyan-500/70',
    },
    theme: {
      colors: {
        primary: '#06B6D4',
        secondary: '#8B5CF6',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        content1: '#0F172A',
        content2: '#1E293B',
        content3: '#334155',
        content4: '#475569',
        background: '#020617',
        foreground: '#06B6D4',
        divider: '#0E7490',
      },
      layout: {
        borderRadius: '8px',
        borderWidth: '1px',
        fontFamily: 'Fira Code, monospace',
      },
    },
  },

  // =========================================
  // 5. Minimalist (Blog / Content)
  // Clean, content-focused design
  // =========================================
  minimal: {
    name: 'Minimalist',
    description: 'Clean, content-focused design for blogs and reading',
    classes: {
      base: 'bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-none rounded-xl hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors duration-300',
      header: 'font-serif font-medium text-zinc-900 dark:text-zinc-100 pb-2 pt-6 px-6 text-2xl',
      body: 'text-zinc-600 dark:text-zinc-400 pt-1 px-6 leading-relaxed font-light',
      footer: 'px-6 py-4 text-xs text-zinc-400 uppercase tracking-widest',
    },
    theme: {
      colors: {
        primary: '#18181B',
        secondary: '#52525B',
        success: '#22C55E',
        warning: '#EAB308',
        danger: '#DC2626',
        content1: '#FFFFFF',
        content2: '#FAFAFA',
        content3: '#F4F4F5',
        content4: '#E4E4E7',
        background: '#FFFFFF',
        foreground: '#09090B',
        divider: '#E4E4E7',
      },
      layout: {
        borderRadius: '12px',
        borderWidth: '1px',
        fontFamily: 'Georgia, serif',
      },
    },
  },

  // =========================================
  // 6. Gradient (Marketing/Feature)
  // Vibrant gradients for marketing pages
  // =========================================
  gradient: {
    name: 'Gradient',
    description: 'Vibrant gradients perfect for marketing and features',
    classes: {
      base: 'bg-gradient-to-tr from-violet-600 to-orange-400 dark:from-blue-900 dark:to-purple-900 border-none shadow-xl hover:shadow-2xl rounded-3xl text-white transition-transform duration-300 hover:scale-[1.03]',
      header: 'text-white/95 font-bold text-2xl pt-6 px-6 drop-shadow-sm',
      body: 'text-white/90 font-medium px-6',
      footer: 'bg-white/10 backdrop-blur-md border-t border-white/20 m-2 rounded-2xl px-4 py-3 text-white/80',
    },
    theme: {
      colors: {
        primary: '#8B5CF6',
        secondary: '#F97316',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        content1: '#8B5CF6',
        content2: '#A78BFA',
        content3: '#C4B5FD',
        content4: '#DDD6FE',
        background: 'linear-gradient(135deg, #8B5CF6 0%, #F97316 100%)',
        foreground: '#FFFFFF',
        divider: 'rgba(255, 255, 255, 0.2)',
      },
      layout: {
        borderRadius: '24px',
        borderWidth: '0px',
        fontFamily: 'Poppins, sans-serif',
      },
    },
  },

  // =========================================
  // 7. Claymorphism (Soft 3D / Neumorphic)
  // Soft, tactile 3D effect
  // =========================================
  clay: {
    name: 'Claymorphism',
    description: 'Soft 3D neumorphic design with tactile feel',
    classes: {
      base: 'bg-[#e0e5ec] dark:bg-[#2d2d2d] rounded-[30px] border-none shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] dark:shadow-[5px_5px_10px_#1f1f1f,-5px_-5px_10px_#3b3b3b] hover:scale-[1.02] transition-transform duration-300',
      header: 'text-slate-700 dark:text-slate-200 font-extrabold px-8 pt-8 text-xl',
      body: 'text-slate-500 dark:text-slate-400 px-8 font-semibold',
      footer: 'px-8 pb-8 pt-4 opacity-70',
    },
    theme: {
      colors: {
        primary: '#6366F1',
        secondary: '#8B5CF6',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        content1: '#E0E5EC',
        content2: '#D1D5DB',
        content3: '#C4C9D4',
        content4: '#B1B7C3',
        background: '#E0E5EC',
        foreground: '#334155',
        divider: '#CBD5E1',
      },
      layout: {
        borderRadius: '30px',
        borderWidth: '0px',
        fontFamily: 'Nunito, sans-serif',
      },
    },
  },

  // =========================================
  // 8. Elegant (Luxury / Editorial)
  // Sophisticated luxury design
  // =========================================
  elegant: {
    name: 'Elegant',
    description: 'Sophisticated luxury design for editorial content',
    classes: {
      base: 'bg-[#FFFCF5] dark:bg-[#1a1a1a] border border-stone-300 dark:border-stone-700 shadow-sm hover:border-amber-600 dark:hover:border-amber-500 rounded-sm transition-colors duration-500',
      header: 'font-serif text-3xl text-stone-900 dark:text-stone-100 tracking-tight pt-6 px-6 italic',
      body: 'font-serif text-stone-600 dark:text-stone-400 leading-loose px-6',
      footer: 'border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 font-serif uppercase tracking-widest text-xs text-stone-500 px-6 py-3',
    },
    theme: {
      colors: {
        primary: '#D97706',
        secondary: '#92400E',
        success: '#059669',
        warning: '#D97706',
        danger: '#DC2626',
        content1: '#FFFCF5',
        content2: '#FEF3C7',
        content3: '#FDE68A',
        content4: '#FCD34D',
        background: '#FFFCF5',
        foreground: '#292524',
        divider: '#D6D3D1',
      },
      layout: {
        borderRadius: '2px',
        borderWidth: '1px',
        fontFamily: 'Playfair Display, serif',
      },
    },
  },

  // =========================================
  // 9. Retro Terminal (Developer)
  // Classic terminal aesthetic
  // =========================================
  terminal: {
    name: 'Retro Terminal',
    description: 'Classic terminal aesthetic for developers',
    classes: {
      base: 'bg-black border-2 border-green-600 dark:border-green-500 rounded-md shadow-none hover:shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-shadow duration-300',
      header: 'text-green-600 dark:text-green-500 font-mono uppercase border-b-2 border-green-600 dark:border-green-500 border-dashed py-2 px-4',
      body: 'text-green-600 dark:text-green-400 font-mono p-4',
      footer: 'bg-green-900/20 border-t-2 border-green-600/50 font-mono text-xs text-green-500 px-4 py-2',
    },
    theme: {
      colors: {
        primary: '#22C55E',
        secondary: '#10B981',
        success: '#22C55E',
        warning: '#EAB308',
        danger: '#DC2626',
        content1: '#000000',
        content2: '#0A0A0A',
        content3: '#141414',
        content4: '#1F1F1F',
        background: '#000000',
        foreground: '#22C55E',
        divider: '#166534',
      },
      layout: {
        borderRadius: '6px',
        borderWidth: '2px',
        fontFamily: 'JetBrains Mono, Courier New, monospace',
      },
    },
  },

  // =========================================
  // 10. Elevated (Material 3.0)
  // Material Design inspired elevation
  // =========================================
  elevated: {
    name: 'Elevated',
    description: 'Material Design 3.0 inspired with strong elevation',
    classes: {
      base: 'bg-white dark:bg-zinc-800 rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] border-none hover:-translate-y-2 hover:shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] transition-all duration-500 ease-in-out',
      header: 'pb-4 pt-8 px-8 font-bold text-2xl text-zinc-800 dark:text-zinc-100',
      body: 'px-8 py-2 text-zinc-500 dark:text-zinc-300 text-lg',
      footer: 'px-8 pb-8 pt-6',
    },
    theme: {
      colors: {
        primary: '#6750A4',
        secondary: '#625B71',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#B3261E',
        content1: '#FFFBFE',
        content2: '#F4EFF4',
        content3: '#E9E3E9',
        content4: '#DDD7DD',
        background: '#FFFBFE',
        foreground: '#1C1B1F',
        divider: '#E7E0EC',
      },
      layout: {
        borderRadius: '24px',
        borderWidth: '0px',
        fontFamily: 'Roboto, sans-serif',
      },
    },
  },
};

/**
 * Get card style configuration by name
 * @param {string} styleName - Name of the card style
 * @returns {CardStyleConfig|null} Card style configuration or null if not found
 */
export const getCardStyle = (styleName = 'modern') => {
  return cardStyles[styleName] || cardStyles.modern;
};

/**
 * Get list of all available card style names
 * @returns {Array<{key: string, name: string, description: string}>}
 */
export const getCardStyleOptions = () => {
  return Object.entries(cardStyles).map(([key, style]) => ({
    key,
    name: style.name,
    description: style.description,
  }));
};

/**
 * Apply card style theme to theme settings
 * @param {string} styleName - Name of the card style
 * @param {Object} currentSettings - Current theme settings
 * @returns {Object} Updated theme settings
 */
export const applyCardStyleTheme = (styleName, currentSettings = {}) => {
  const style = getCardStyle(styleName);
  
  return {
    ...currentSettings,
    cardStyle: styleName,
    customColors: style.theme.colors,
    layout: {
      ...currentSettings.layout,
      ...style.theme.layout,
    },
  };
};

export default cardStyles;
