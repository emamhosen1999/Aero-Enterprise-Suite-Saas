import React, { forwardRef, useState, useEffect } from 'react';
import { Button } from '@heroui/react';


const GlassButton = forwardRef(({
  children,
  variant = 'default',
  size = 'medium',
  elevation = 'medium',
  glowEffect = false,
  magneticEffect = false,
  className = '',
  onClick,
  ...props
}, ref) => {

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleStorageChange = () => {
      setDarkMode(localStorage.getItem('darkMode') === 'true');
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleMouseMove = (e) => {
    if (magneticEffect) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      setMousePosition({ x: x * 0.1, y: y * 0.1 });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePosition({ x: 0, y: 0 });
  };

  const getVariantStyles = () => {
    const baseStyles = darkMode 
      ? 'bg-linear-to-br from-slate-900/70 to-slate-800/50' 
      : 'bg-linear-to-br from-white/80 to-white/60';

    const borderStyles = darkMode
      ? 'border border-white/20'
      : 'border border-white/40';

    switch (variant) {
      case 'primary':
        return darkMode
          ? 'bg-linear-to-br from-blue-900/80 to-blue-800/60 border border-blue-400/30 text-blue-100'
          : 'bg-linear-to-br from-blue-100/90 to-blue-50/70 border border-blue-300/50 text-blue-900';
      case 'success':
        return darkMode
          ? 'bg-linear-to-br from-emerald-900/80 to-emerald-800/60 border border-emerald-400/30 text-emerald-100'
          : 'bg-linear-to-br from-emerald-100/90 to-emerald-50/70 border border-emerald-300/50 text-emerald-900';
      case 'danger':
        return darkMode
          ? 'bg-linear-to-br from-red-900/80 to-red-800/60 border border-red-400/30 text-red-100'
          : 'bg-linear-to-br from-red-100/90 to-red-50/70 border border-red-300/50 text-red-900';
      default:
        return `${baseStyles} ${borderStyles} ${darkMode ? 'text-white' : 'text-slate-900'}`;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return 'px-4 py-2 text-sm min-h-[36px]';
      case 'large':
        return 'px-8 py-4 text-lg min-h-[48px]';
      default:
        return 'px-6 py-3 text-base min-h-[42px]';
    }
  };

  const getGlowStyles = () => {
    if (!glowEffect) return '';
    return darkMode 
      ? 'shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]'
      : 'shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]';
  };

  const getHeroUIVariant = () => {
    switch (variant) {
      case 'primary':
        return 'solid';
      case 'success':
        return 'solid';
      case 'danger':
        return 'solid';
      default:
        return 'bordered';
    }
  };

  const getHeroUIColor = () => {
    switch (variant) {
      case 'primary':
        return 'primary';
      case 'success':
        return 'success';
      case 'danger':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getHeroUISize = () => {
    switch (size) {
      case 'small':
        return 'sm';
      case 'large':
        return 'lg';
      default:
        return 'md';
    }
  };

  return (
    <Button
      ref={ref}
      variant={getHeroUIVariant()}
      color={getHeroUIColor()}
      size={getHeroUISize()}
      className={`
        glass-button
        ${getVariantStyles()}
        ${getSizeStyles()}
        ${getGlowStyles()}
        backdrop-blur-xl saturate-180
        rounded-2xl
        font-semibold
        transition-all duration-300 ease-out
        hover:scale-[1.02] hover:shadow-xl
        active:scale-[0.98]
        relative overflow-hidden
        will-change-transform
        ${className}
      `}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onPress={onClick}
      style={{
        background: 'transparent',
        transform: magneticEffect ? `translate(${mousePosition.x}px, ${mousePosition.y}px)` : 'none',
      }}
      {...props}
    >
      {children}
      {/* Ripple effect overlay */}
      {isHovered && (
        <div 
          className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-pulse"
          style={{
            animation: 'shimmer 1.5s ease-in-out infinite',
          }}
        />
      )}
    </Button>
  );
});

GlassButton.displayName = 'GlassButton';

export default GlassButton;