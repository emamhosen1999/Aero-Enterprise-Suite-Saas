import React, { forwardRef } from 'react';
import { Card } from '@heroui/react';
import { useTheme } from '@/Contexts/ThemeContext.jsx';

const GlassCard = forwardRef(({ children }, ref) => {
  const { themeSettings } = useTheme();
  const isDark = themeSettings?.mode === 'dark';

  // Define glass styling based on theme mode
  const glassStyles = {
    backdropFilter: "blur(16px) saturate(180%)",
    WebkitBackdropFilter: "blur(16px) saturate(180%)",
    backgroundColor: isDark 
      ? "rgba(0, 0, 0, 0.15)" // Dark mode: translucent black
      : "rgba(255, 255, 255, 0.15)", // Light mode: translucent white
    borderRadius: "12px",
    border: isDark
      ? "1px solid rgba(255, 255, 255, 0.1)" // Dark mode: light border
      : "1px solid rgba(0, 0, 0, 0.1)", // Light mode: dark border
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: isDark
      ? "0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)" // Dark mode: deep shadow with light inset
      : "0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)" // Light mode: light shadow with bright inset
  };

  return (
    <Card
      ref={ref}
      style={glassStyles}
      className={`
        hover:scale-[1.01] 
        ${isDark ? 'hover:bg-white/[0.08]' : 'hover:bg-black/[0.08]'}
        transition-all duration-300 ease-out
      `}
    >
      {children}
    </Card>
  );
});

GlassCard.displayName = "GlassCard";

export default GlassCard;
