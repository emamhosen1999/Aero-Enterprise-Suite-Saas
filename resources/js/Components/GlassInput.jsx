import React, { forwardRef, useState, useEffect } from 'react';
import { Input } from '@heroui/react';


const GlassInput = forwardRef(({
  variant = 'default',
  glowOnFocus = true,
  floatingLabel = true,
  className = '',
  startIcon,
  endIcon,
  ...props
}, ref) => {

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const handleStorageChange = () => {
      setDarkMode(localStorage.getItem('darkMode') === 'true');
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return darkMode
          ? 'bg-linear-to-br from-blue-900/30 to-blue-800/20 border-blue-400/30'
          : 'bg-linear-to-br from-blue-50/80 to-blue-100/60 border-blue-300/50';
      case 'success':
        return darkMode
          ? 'bg-linear-to-br from-emerald-900/30 to-emerald-800/20 border-emerald-400/30'
          : 'bg-linear-to-br from-emerald-50/80 to-emerald-100/60 border-emerald-300/50';
      case 'danger':
        return darkMode
          ? 'bg-linear-to-br from-red-900/30 to-red-800/20 border-red-400/30'
          : 'bg-linear-to-br from-red-50/80 to-red-100/60 border-red-300/50';
      default:
        return darkMode
          ? 'bg-linear-to-br from-slate-900/40 to-slate-800/20 border-white/20'
          : 'bg-linear-to-br from-white/80 to-white/60 border-white/40';
    }
  };

  const getHeroUIVariant = () => {
    switch (variant) {
      case 'primary':
      case 'success':
      case 'danger':
        return 'bordered';
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

  return (
    <Input
      ref={ref}
      variant={getHeroUIVariant()}
      color={getHeroUIColor()}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      startContent={startIcon}
      endContent={endIcon}
      classNames={{
        input: "bg-transparent",
        inputWrapper: `
          ${getVariantStyles()}
          backdrop-blur-md 
          transition-all duration-300 ease-out
          ${glowOnFocus && isFocused ? 'shadow-lg' : 'shadow-sm'}
        `
      }}
      className={`glass-input ${className}`}
      {...props}
    />
  );
});

GlassInput.displayName = 'GlassInput';

export default GlassInput;