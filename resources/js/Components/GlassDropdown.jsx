import React, { forwardRef } from 'react';
import { Dropdown } from "@heroui/react";


const GlassDropdown = forwardRef(({ 
    children, 
    closeDelay, 
    shouldBlockScroll, 
    isKeyboardDismissDisabled,
    ...props 
}, ref) => {

    
    return (
        <Dropdown 
            ref={ref} 
            closeDelay={closeDelay}
            shouldBlockScroll={shouldBlockScroll}
            isKeyboardDismissDisabled={isKeyboardDismissDisabled}
            classNames={{
                content: "bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl"
            }}
            {...props}
        >
            {children}
        </Dropdown>
    );
});

export default GlassDropdown;
