/**
 * GlassDialog - Backward compatibility wrapper for HeroUI Modal
 * 
 * This component provides backward compatibility for legacy GlassDialog usage
 * while using HeroUI's Modal component internally.
 */
import React from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';

/**
 * GlassDialog wrapper component
 * Maps common MUI Dialog props to HeroUI Modal
 */
const GlassDialog = ({ 
    open, 
    onClose, 
    children, 
    maxWidth = 'md',
    fullWidth = true,
    className = '',
    ...props 
}) => {
    // Map maxWidth to HeroUI sizes
    const sizeMap = {
        'xs': 'sm',
        'sm': 'md', 
        'md': 'lg',
        'lg': 'xl',
        'xl': '2xl',
        'full': 'full',
    };

    return (
        <Modal 
            isOpen={open} 
            onClose={onClose}
            size={sizeMap[maxWidth] || 'lg'}
            scrollBehavior="inside"
            classNames={{
                base: `border border-divider bg-content1 shadow-lg ${className}`,
                header: "border-b border-divider",
                footer: "border-t border-divider",
            }}
            style={{
                fontFamily: `var(--fontFamily, "Inter")`,
            }}
            {...props}
        >
            <ModalContent>
                {children}
            </ModalContent>
        </Modal>
    );
};

// Export Modal subcomponents for convenience
export { ModalHeader, ModalBody, ModalFooter };
export default GlassDialog;
