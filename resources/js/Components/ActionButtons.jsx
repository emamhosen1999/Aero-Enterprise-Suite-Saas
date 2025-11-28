import React, { useState, useEffect } from 'react';
import { Button } from "@heroui/react";
import { 
    DocumentArrowDownIcon,
    PlusIcon,
    FunnelIcon,
    Cog6ToothIcon,
    ArrowPathIcon
} from "@heroicons/react/24/outline";

/**
 * Standardized action buttons component matching TimeSheet table design
 * @param {Object} props
 * @param {Array} props.buttons - Array of button configurations
 * @param {boolean} props.loading - Loading state for buttons
 */
const ActionButtons = ({ buttons = [], loading = false }) => {
    // Custom responsive hook
    const useResponsive = () => {
        const [isMobile, setIsMobile] = useState(false);
        
        useEffect(() => {
            const checkDevice = () => {
                setIsMobile(window.innerWidth < 640);
            };
            
            checkDevice();
            window.addEventListener('resize', checkDevice);
            return () => window.removeEventListener('resize', checkDevice);
        }, []);
        
        return { isMobile };
    };
    
    const { isMobile } = useResponsive();

    // Predefined button styles matching timesheet table
    const buttonStyles = {
        primary: "bg-linear-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30",
        success: "bg-linear-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30",
        danger: "bg-linear-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30",
        warning: "bg-linear-to-r from-orange-500/20 to-yellow-500/20 hover:from-orange-500/30 hover:to-yellow-500/30",
        secondary: "bg-linear-to-r from-gray-500/20 to-slate-500/20 hover:from-gray-500/30 hover:to-slate-500/30",
        bordered: "border-white/20 bg-white/5 hover:bg-white/10"
    };

    // Common button configurations
    const commonButtons = {
        add: {
            color: "primary",
            variant: "flat",
            icon: <PlusIcon className="w-4 h-4" />,
            className: "bg-linear-to-r from-blue-500 to-purple-500 text-white font-medium"
        },
        export_excel: {
            color: "success",
            variant: "flat",
            icon: <DocumentArrowDownIcon className="w-4 h-4" />,
            className: buttonStyles.success,
            label: "Excel"
        },
        export_pdf: {
            color: "danger",
            variant: "flat",
            icon: <DocumentArrowDownIcon className="w-4 h-4" />,
            className: buttonStyles.danger,
            label: "PDF"
        },
        refresh: {
            color: "primary",
            variant: "flat",
            icon: <ArrowPathIcon className="w-4 h-4" />,
            className: buttonStyles.primary,
            label: "Refresh"
        },
        filter: {
            color: "secondary",
            variant: "bordered",
            icon: <FunnelIcon className="w-4 h-4" />,
            className: buttonStyles.bordered,
            label: "Filter"
        },
        settings: {
            color: "secondary",
            variant: "bordered",
            icon: <Cog6ToothIcon className="w-4 h-4" />,
            className: buttonStyles.bordered,
            label: "Settings"
        }
    };

    if (!buttons || buttons.length === 0) return null;

    return (
        <div className="flex gap-2 flex-wrap">
            {buttons.map((button, index) => {
                // Use common button if it's a string reference
                const buttonConfig = typeof button === 'string' 
                    ? { ...commonButtons[button], type: button }
                    : button;

                if (!buttonConfig) return null;

                return (
                    <Button
                        key={index}
                        color={buttonConfig.color || "primary"}
                        variant={buttonConfig.variant || "flat"}
                        startContent={buttonConfig.icon}
                        onPress={buttonConfig.onPress}
                        isDisabled={buttonConfig.isDisabled || loading}
                        className={buttonConfig.className || buttonStyles.primary}
                        size={isMobile ? "sm" : "md"}
                    >
                        {buttonConfig.label || buttonConfig.type}
                    </Button>
                );
            })}
        </div>
    );
};

export default ActionButtons;
