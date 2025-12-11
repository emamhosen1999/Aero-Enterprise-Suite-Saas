import React from 'react';
import { Button, Divider } from "@heroui/react";


/**
 * Theme-aware consistent page header component
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {string} props.subtitle - Page subtitle/description
 * @param {React.ReactNode} props.icon - Icon component for the header
 * @param {Array} props.actionButtons - Array of button configurations
 * @param {React.ReactNode} props.children - Additional content to render below header
 * @param {string} props.variant - Header variant: 'default', 'minimal', 'gradient'
 */
const PageHeader = ({
                        title,
                        subtitle,
                        icon,
                        actionButtons = [],
                        actions,
                        children,
                        variant = 'default'
                    }) => {

    const isMobile = window.innerWidth < 640; // Simple mobile detection
    const getHeaderStyles = () => {
        switch (variant) {
            case 'minimal':
                return "bg-white/10 backdrop-blur-md border-b border-white/10";
            case 'gradient':
                return "bg-linear-to-br from-white/20 via-white/10 to-transparent backdrop-blur-xl border-b border-white/20";
            default:
                return "bg-background/80 backdrop-blur-md border-b border-divider";
        }
    };

    return (
        <div className="overflow-hidden theme-aware-header">
            {/* Header Section - Theme-aware */}
            <div className={getHeaderStyles()}>
                <div className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            {icon && (
                                <div className="p-3 rounded-xl bg-primary/10 backdrop-blur-sm">
                                    {React.isValidElement(icon) ? (
                                        React.cloneElement(icon, {
                                            className: `${icon.props?.className || ''} w-6 h-6 text-primary`,
                                            ...icon.props
                                        })
                                    ) : (
                                        React.createElement(icon, { className: "w-6 h-6 text-primary" })
                                    )}
                                </div>
                            )}
                            <div>
                                <h4
                                    className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-foreground`}>
                                    {title}
                                </h4>
                                {subtitle && (
                                    <p
                                        className="text-sm text-default-500 mt-1"
                                        style={{
                                            fontFamily: 'var(--font-current)',
                                            transition: 'all var(--transition)'
                                        }}
                                    >
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons - Theme-aware */}
                        {actions ? (
                            <div className="flex items-center gap-2 flex-wrap">
                                {actions}
                            </div>
                        ) : (
                            actionButtons.length > 0 && (
                                <div className="flex gap-2 flex-wrap">
                                    {actionButtons.map((button, index) => (
                                        <Button
                                            key={index}
                                            color={button.color || "primary"}
                                            variant={button.variant || "solid"}
                                            startContent={button.icon}
                                            onPress={button.onPress}
                                            isDisabled={button.isDisabled}
                                            isLoading={button.isLoading}
                                            size={isMobile ? "sm" : "md"}
                                        >
                                            {button.label}
                                        </Button>
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* Divider - Theme-aware */}
            <Divider
                className="border-[rgba(var(--theme-primary-rgb),0.1)]"
                style={{transition: 'all var(--transition)'}}
            />

            {/* Additional content */}
            {children && (
                <div className="theme-aware-content" style={{transition: 'all var(--transition)'}}>
                    {children}
                </div>
            )}
        </div>
    );
};

export default PageHeader;
