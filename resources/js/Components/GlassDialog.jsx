import React, { forwardRef } from 'react';
import { Modal, ModalContent } from '@heroui/react';
import { useTheme } from '@/Contexts/ThemeContext.jsx';

const GlassDialog = forwardRef(({ children, ...props }, ref) => {
  const { themeSettings } = useTheme();
  const isDark = themeSettings?.mode === 'dark';

  // Glass style for the whole popup (modal base slot)
  const glassStyles = {
    backdropFilter: "blur(16px) saturate(180%)",
    WebkitBackdropFilter: "blur(16px) saturate(180%)",
    backgroundColor: isDark
      ? "rgba(0, 0, 0, 0.15)"
      : "rgba(255, 255, 255, 0.15)",
    borderRadius: "16px",
    border: isDark
      ? "1px solid rgba(255, 255, 255, 0.1)"
      : "1px solid rgba(0, 0, 0, 0.1)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: isDark
      ? "0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
      : "0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)"
  };

  return (
    <>
    <Modal
    {...props}
    
    
    >
      <ModalContent
      classNames={{
      base: "backdrop-blur"
    }}
        
      >
        {children}
      </ModalContent>
      
    </Modal>
   
    </>
    
    
  );
});

GlassDialog.displayName = 'GlassDialog';

export default GlassDialog;
