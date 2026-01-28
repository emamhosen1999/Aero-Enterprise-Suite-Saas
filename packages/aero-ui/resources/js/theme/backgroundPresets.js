/**
 * Background Preset System - v2.1
 * Comprehensive background options with patterns, images, and overlays
 */

export const BACKGROUND_TYPES = {
  color: 'color',
  gradient: 'gradient',
  pattern: 'pattern',
  image: 'image',
  texture: 'texture'
};

export const BACKGROUND_PRESETS = {
  // Solid Colors
  'light-gray': {
    type: BACKGROUND_TYPES.color,
    name: 'Light Gray',
    category: 'Solid Colors',
    value: '#F8F9FA',
    preview: '#F8F9FA'
  },
  'warm-white': {
    type: BACKGROUND_TYPES.color,
    name: 'Warm White',
    category: 'Solid Colors', 
    value: '#FFFEF9',
    preview: '#FFFEF9'
  },
  'cool-blue': {
    type: BACKGROUND_TYPES.color,
    name: 'Cool Blue',
    category: 'Solid Colors',
    value: '#EFF6FF',
    preview: '#EFF6FF'
  },

  // Gradients
  'sunset': {
    type: BACKGROUND_TYPES.gradient,
    name: 'Sunset',
    category: 'Gradients',
    value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  'ocean': {
    type: BACKGROUND_TYPES.gradient,
    name: 'Ocean',
    category: 'Gradients',
    value: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
    preview: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)'
  },
  'forest': {
    type: BACKGROUND_TYPES.gradient,
    name: 'Forest',
    category: 'Gradients',
    value: 'linear-gradient(135deg, #55efc4 0%, #00b894 100%)',
    preview: 'linear-gradient(135deg, #55efc4 0%, #00b894 100%)'
  },

  // Patterns
  'dots': {
    type: BACKGROUND_TYPES.pattern,
    name: 'Dots',
    category: 'Patterns',
    value: {
      pattern: 'dots',
      color: '#E4E4E7',
      size: '20px',
      spacing: '40px'
    },
    preview: 'radial-gradient(circle, #E4E4E7 1px, transparent 1px)'
  },
  'grid': {
    type: BACKGROUND_TYPES.pattern,
    name: 'Grid',
    category: 'Patterns',
    value: {
      pattern: 'grid',
      color: '#E4E4E7',
      size: '1px',
      spacing: '20px'
    },
    preview: 'linear-gradient(#E4E4E7 1px, transparent 1px), linear-gradient(90deg, #E4E4E7 1px, transparent 1px)'
  },
  'diagonal': {
    type: BACKGROUND_TYPES.pattern,
    name: 'Diagonal Lines',
    category: 'Patterns',
    value: {
      pattern: 'diagonal',
      color: '#E4E4E7',
      size: '1px',
      spacing: '10px'
    },
    preview: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #E4E4E7 10px, #E4E4E7 11px)'
  }
};

/**
 * Generate CSS for pattern backgrounds
 */
export const generatePatternCSS = (patternConfig) => {
  const { pattern, color, size, spacing } = patternConfig;
  
  switch (pattern) {
    case 'dots':
      return {
        backgroundImage: `radial-gradient(circle, ${color} ${size}, transparent ${size})`,
        backgroundSize: `${spacing} ${spacing}`
      };
    
    case 'grid':
      return {
        backgroundImage: `
          linear-gradient(${color} ${size}, transparent ${size}),
          linear-gradient(90deg, ${color} ${size}, transparent ${size})
        `,
        backgroundSize: `${spacing} ${spacing}`
      };
    
    case 'diagonal':
      return {
        backgroundImage: `repeating-linear-gradient(
          45deg,
          transparent,
          transparent ${spacing},
          ${color} ${spacing},
          ${color} calc(${spacing} + ${size})
        )`
      };
    
    default:
      return {};
  }
};

/**
 * Apply background configuration to document body
 */
export const applyBackground = (backgroundConfig, opacity = 1) => {
  if (typeof window === 'undefined' || !window.document) return;
  
  const body = document.body;
  
  // Clear existing background
  body.style.backgroundImage = '';
  body.style.backgroundColor = '';
  body.style.backgroundSize = '';
  body.style.backgroundPosition = '';
  body.style.backgroundRepeat = '';
  body.style.backgroundAttachment = '';
  
  if (!backgroundConfig || !backgroundConfig.type) return;
  
  switch (backgroundConfig.type) {
    case BACKGROUND_TYPES.color:
      body.style.backgroundColor = backgroundConfig.value;
      break;
      
    case BACKGROUND_TYPES.gradient:
      body.style.backgroundImage = backgroundConfig.value;
      break;
      
    case BACKGROUND_TYPES.pattern:
      const patternCSS = generatePatternCSS(backgroundConfig.value);
      Object.assign(body.style, patternCSS);
      if (opacity < 1) {
        body.style.opacity = opacity.toString();
      }
      break;
      
    case BACKGROUND_TYPES.image:
      body.style.backgroundImage = `url(${backgroundConfig.value.url})`;
      body.style.backgroundSize = backgroundConfig.value.size || 'cover';
      body.style.backgroundPosition = backgroundConfig.value.position || 'center';
      body.style.backgroundRepeat = backgroundConfig.value.repeat || 'no-repeat';
      if (backgroundConfig.value.attachment) {
        body.style.backgroundAttachment = backgroundConfig.value.attachment;
      }
      if (opacity < 1) {
        // Create overlay for opacity
        const overlay = document.createElement('div');
        overlay.id = 'background-overlay';
        overlay.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(255,255,255,${1-opacity});
          pointer-events: none;
          z-index: -1;
        `;
        body.appendChild(overlay);
      }
      break;
  }
};

export default {
  BACKGROUND_TYPES,
  BACKGROUND_PRESETS,
  generatePatternCSS,
  applyBackground
};