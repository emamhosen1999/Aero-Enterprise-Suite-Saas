import React, { useState, useEffect, useCallback } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    Button,
    Card,
    CardBody,
    Select,
    SelectItem,
    Chip,
    Input,
    Tabs,
    Tab,
    Switch,
    Slider,
} from '@heroui/react';
import { useTheme } from '@/Context/ThemeContext';
import { 
    fontFamilies, 
    radiusOptions, 
    borderWidthOptions, 
    scalingOptions,
    opacityOptions 
} from '../theme/index.js';
import { CheckCircleIcon } from '@heroicons/react/24/outline';


const ThemeSettingDrawer = ({ 
    isOpen,
    onClose
}) => {
    const { themeSettings, updateTheme, toggleMode, resetTheme, prebuiltThemes } = useTheme();

    // Enhanced close handler with cleanup
    const handleClose = useCallback(() => {
        // Immediate cleanup of any custom overlays
        const overlay = document.getElementById('background-overlay');
        if (overlay) {
            overlay.remove();
        }

        // Force cleanup of stuck modal backdrops immediately
        setTimeout(() => {
            const allBackdrops = document.querySelectorAll('[data-slot="backdrop"], .nextui-backdrop, [data-modal-backdrop], .backdrop');
            allBackdrops.forEach(backdrop => {
                if (backdrop) {
                    backdrop.remove();
                }
            });
        }, 100);

        // Call the parent close handler
        if (onClose) {
            onClose();
        }
    }, [onClose]);

    // Background settings state
    const [backgroundType, setBackgroundType] = useState(themeSettings?.background?.type || 'color');
    const [backgroundImage, setBackgroundImage] = useState(themeSettings?.background?.image || '');
    const [backgroundColor, setBackgroundColor] = useState(themeSettings?.background?.color || '#ffffff');
    const [backgroundSize, setBackgroundSize] = useState(themeSettings?.background?.size || 'cover');
    const [backgroundPosition, setBackgroundPosition] = useState(themeSettings?.background?.position || 'center');
    const [backgroundRepeat, setBackgroundRepeat] = useState(themeSettings?.background?.repeat || 'no-repeat');

    // Color customization state
    const [customColors, setCustomColors] = useState({
        primary: themeSettings?.customColors?.primary || '#006FEE',
        secondary: themeSettings?.customColors?.secondary || '#17C964', 
        success: themeSettings?.customColors?.success || '#17C964',
        warning: themeSettings?.customColors?.warning || '#F5A524',
        danger: themeSettings?.customColors?.danger || '#F31260',
        content1: themeSettings?.customColors?.content1 || '#FFFFFF',
        content2: themeSettings?.customColors?.content2 || '#F4F4F5',
        content3: themeSettings?.customColors?.content3 || '#E4E4E7',
        content4: themeSettings?.customColors?.content4 || '#D4D4D8',
        background: themeSettings?.customColors?.background || '#FFFFFF',
        foreground: themeSettings?.customColors?.foreground || '#000000',
        divider: themeSettings?.customColors?.divider || '#E4E4E7'
    });

    // Ensure prebuiltThemes is an array
    const themeOptions = Array.isArray(prebuiltThemes) ? prebuiltThemes : [];

    // Base colors for custom theming (updated with better colors)
    const baseColors = [
        { name: 'Blue', value: '#3B82F6', key: 'primary' },
        { name: 'Purple', value: '#8B5CF6', key: 'secondary' },
        { name: 'Green', value: '#10B981', key: 'success' },
        { name: 'Orange', value: '#F59E0B', key: 'warning' },
        { name: 'Red', value: '#EF4444', key: 'danger' }
    ];

    // Content colors (semantic colors)
    const contentColors = [
        { name: 'Content 1', value: '#FFFFFF', key: 'content1' },
        { name: 'Content 2', value: '#F4F4F5', key: 'content2' },
        { name: 'Content 3', value: '#E4E4E7', key: 'content3' },
        { name: 'Content 4', value: '#D4D4D8', key: 'content4' }
    ];

    // Layout colors
    const layoutColors = [
        { name: 'Background', value: '#FFFFFF', key: 'background' },
        { name: 'Foreground', value: '#000000', key: 'foreground' },
        { name: 'Divider', value: '#E4E4E7', key: 'divider' }
    ];

    // Apply current background settings on mount
    useEffect(() => {
        if (themeSettings?.background) {
          
            applyBackgroundToDocument(themeSettings.background);
        }
    }, [themeSettings?.background]);

    // Sync local state with theme settings when they change
    useEffect(() => {
        if (themeSettings?.background) {
            setBackgroundType(themeSettings.background.type || 'color');
            setBackgroundImage(themeSettings.background.image || '');
            setBackgroundColor(themeSettings.background.color || '#ffffff');
            setBackgroundSize(themeSettings.background.size || 'cover');
            setBackgroundPosition(themeSettings.background.position || 'center');
            setBackgroundRepeat(themeSettings.background.repeat || 'no-repeat');
        }
    }, [themeSettings?.background]);

    // Enhanced cleanup when modal state changes
    useEffect(() => {
        if (!isOpen) {
            // Add a small delay to ensure proper cleanup after modal close animation
            const timeoutId = setTimeout(() => {
                // Clean up any remaining overlays when drawer is closed
                const overlay = document.getElementById('background-overlay');
                if (overlay) {
                    overlay.remove();
                }
                
                // Reset any remaining pointer-events issues
                const body = document.body;
                const elements = body.querySelectorAll('[style*="pointer-events"]');
                elements.forEach(el => {
                    if (el.id === 'background-overlay') {
                        el.remove();
                    }
                });

                // Force cleanup of any modal backdrops that might be stuck
                const modalBackdrops = document.querySelectorAll('[data-slot="backdrop"], .nextui-backdrop, [data-modal-backdrop]');
                modalBackdrops.forEach(backdrop => {
                    if (backdrop && (backdrop.style.opacity === '0' || backdrop.style.display === 'none')) {
                        backdrop.remove();
                    }
                });

                // Ensure body overflow is reset
                document.body.style.overflow = '';
                document.documentElement.style.overflow = '';
            }, 350); // Wait for modal close animation to complete

            return () => clearTimeout(timeoutId);
        } else {
            // When opening, ensure clean state
        }
    }, [isOpen]);

    // Cleanup on component unmount
    useEffect(() => {
        return () => {
            // Clean up any remaining overlays when component unmounts
            const overlay = document.getElementById('background-overlay');
            if (overlay) {
                overlay.remove();
            }

            // Force cleanup of any modal backdrops
            const modalBackdrops = document.querySelectorAll('[data-slot="backdrop"], .backdrop');
            modalBackdrops.forEach(backdrop => {
                if (backdrop) {
                    backdrop.remove();
                }
            });
        };
    }, []);

    // Handle color updates
    const handleCustomColorChange = (colorKey, newColor) => {
        const updatedColors = {
            ...customColors,
            [colorKey]: newColor
        };
        setCustomColors(updatedColors);
        
        // Update theme with custom colors
        updateTheme({
            customColors: updatedColors,
            activeTheme: 'custom' // Switch to custom theme when colors are changed
        });
    };

    // Handle preset color selection
    const handlePresetColorSelect = (colorKey, presetColor) => {
        handleCustomColorChange(colorKey, presetColor);
    };

    // Handle prebuilt theme selection
    const handlePrebuiltThemeSelect = (themeId) => {
        updateTheme({
            activeTheme: themeId
        });
    };

    // Simple native color picker handler
    const handleNativeColorChange = (colorKey, color) => {
        handleCustomColorChange(colorKey, color);
    };

    // Convert theme file options to format expected by UI
    const fontOptions = fontFamilies.map(font => ({
        name: font.name,
        value: font.name // Use just the name for simplicity
    }));

    const radiusValues = radiusOptions.map(radius => ({
        name: radius.name,
        value: radius.value,
        label: radius.name
    }));

    const borderWidthValues = borderWidthOptions.map(borderWidth => ({
        name: borderWidth.name,
        value: borderWidth.value,
        label: borderWidth.name
    }));

    // Background size options
    const backgroundSizeOptions = [
        { value: 'cover', label: 'Cover', description: 'Scale to cover entire area' },
        { value: 'contain', label: 'Contain', description: 'Scale to fit within area' },
        { value: 'auto', label: 'Auto', description: 'Original size' },
        { value: 'stretch', label: 'Stretch', description: 'Stretch to fill area' },
        { value: '100% 100%', label: 'Fill', description: 'Fill area completely' }
    ];

    // Background position options
    const backgroundPositionOptions = [
        { value: 'center', label: 'Center' },
        { value: 'top', label: 'Top' },
        { value: 'bottom', label: 'Bottom' },
        { value: 'left', label: 'Left' },
        { value: 'right', label: 'Right' },
        { value: 'top left', label: 'Top Left' },
        { value: 'top right', label: 'Top Right' },
        { value: 'bottom left', label: 'Bottom Left' },
        { value: 'bottom right', label: 'Bottom Right' }
    ];

    // Background repeat options
    const backgroundRepeatOptions = [
        { value: 'no-repeat', label: 'No Repeat' },
        { value: 'repeat', label: 'Repeat' },
        { value: 'repeat-x', label: 'Repeat X' },
        { value: 'repeat-y', label: 'Repeat Y' },
        { value: 'space', label: 'Space' },
        { value: 'round', label: 'Round' }
    ];

    const handleColorChange = (property, value) => {
        // Color changes are handled automatically by the HeroUI theme system
        // No need to manually update colors as they come from prebuilt themes
    };

    const handleLayoutChange = (property, value) => {
        updateTheme({
            ...themeSettings,
            layout: {
                ...themeSettings.layout,
                [property]: value
            }
        });
    };

    const handleModeToggle = () => {
        toggleMode();
    };

    const handleBackgroundUpdate = (property, value) => {
        const newBackgroundSettings = {
            ...themeSettings.background,
            [property]: value
        };

        // Update local state
        switch(property) {
            case 'type':
                setBackgroundType(value);
                break;
            case 'image':
                setBackgroundImage(value);
                break;
            case 'color':
                setBackgroundColor(value);
                break;
            case 'size':
                setBackgroundSize(value);
                break;
            case 'position':
                setBackgroundPosition(value);
                break;
            case 'repeat':
                setBackgroundRepeat(value);
                break;
        }

        // Update theme context
        updateTheme({
            ...themeSettings,
            background: newBackgroundSettings
        });

        // Apply background to document body immediately (duplicate call for immediate feedback)
        applyBackgroundToDocument(newBackgroundSettings);
    };

    const applyBackgroundToDocument = (backgroundSettings) => {
        // This function is now mainly for immediate preview in the theme drawer
        // The actual application is handled by applyThemeToDocument in theme/index.js
        const body = document.body;
        
        // Clear any existing background styles first
        body.style.setProperty('background-image', '', 'important');
        body.style.setProperty('background-size', '', 'important');
        body.style.setProperty('background-position', '', 'important');
        body.style.setProperty('background-repeat', '', 'important');
        body.style.setProperty('background-attachment', '', 'important');
        body.style.setProperty('background-color', '', 'important');
        
        if (backgroundSettings.type === 'image' && backgroundSettings.image) {
            if (backgroundSettings.image.startsWith('data:image/') || 
                backgroundSettings.image.startsWith('http://') || 
                backgroundSettings.image.startsWith('https://') ||
                backgroundSettings.image.startsWith('/') ||
                backgroundSettings.image.includes('.')) {
                
                body.style.setProperty('background-image', `url("${backgroundSettings.image}")`, 'important');
                body.style.setProperty('background-size', backgroundSettings.size || 'cover', 'important');
                body.style.setProperty('background-position', backgroundSettings.position || 'center', 'important');
                body.style.setProperty('background-repeat', backgroundSettings.repeat || 'no-repeat', 'important');
                body.style.setProperty('background-attachment', 'fixed', 'important');
            }
        } else if (backgroundSettings.type === 'color' && backgroundSettings.color) {
            const color = backgroundSettings.color;
            if (color.startsWith('linear-gradient') || color.startsWith('radial-gradient')) {
                // Use background-image for gradients instead of shorthand background
                body.style.setProperty('background-image', color, 'important');
            } else {
                body.style.setProperty('background-color', color, 'important');
            }
        }
    };    const SectionHeader = ({ icon, title, info = false }) => (
        <div className="flex items-center gap-2 mb-3">
            {icon}
            <span 
                className="text-sm font-medium"
                style={{ 
                    color: `var(--theme-foreground, #11181C)`,
                    fontFamily: `var(--fontFamily, "Inter")`
                }}
            >
                {title}
            </span>
            {info && (
                <svg 
                    className="w-4 h-4" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    style={{ color: `color-mix(in srgb, var(--theme-foreground, #11181C) 60%, transparent)` }}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )}
        </div>
    );

    return (
        <Modal
            key={isOpen ? 'theme-drawer-open' : 'theme-drawer-closed'} // Force re-render
            isOpen={isOpen}
            onClose={handleClose}
            size="lg"
            placement="center"
            hideCloseButton
            backdrop="blur"
            scrollBehavior="inside"
            isDismissable={true}
            isKeyboardDismissDisabled={false}
            closeButton={false}
            motionProps={{
                variants: {
                    enter: {
                        y: 0,
                        opacity: 1,
                        transition: {
                            duration: 0.3,
                            ease: "easeOut",
                        },
                    },
                    exit: {
                        y: -20,
                        opacity: 0,
                        transition: {
                            duration: 0.2,
                            ease: "easeIn",
                        },
                    },
                },
            }}
        >
            <ModalContent
                style={{
                    background: `linear-gradient(135deg, 
                        var(--theme-content1, #FAFAFA) 20%, 
                        var(--theme-content2, #F4F4F5) 10%, 
                        var(--theme-content3, #F1F3F4) 20%)`,
                    borderRadius: `var(--borderRadius, 12px)`,
                    fontFamily: `var(--fontFamily, "Inter")`,
                    transform: `scale(var(--scale, 1))`,
                    border: `var(--borderWidth, 2px) solid var(--theme-divider, #E4E4E7)`
                }}
            >
                <ModalHeader 
                    className="flex items-center justify-between px-6 py-4 border-b"
                    style={{
                        borderColor: `var(--theme-divider, #E4E4E7)`,
                        background: `linear-gradient(135deg, 
                            color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, 
                            color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
                        fontFamily: `var(--fontFamily, "Inter")`
                    }}
                >
                    <div className="flex items-center gap-3">
                        <h2 
                            className="text-lg font-semibold"
                            style={{ color: `var(--theme-foreground, #11181C)` }}
                        >
                            Theme Settings
                        </h2>
                        <Button
                            variant="light"
                            size="sm"
                            onPress={resetTheme || (() => {})}
                            style={{
                                color: `var(--theme-foreground, #11181C)`,
                                borderRadius: `var(--borderRadius, 8px)`,
                                border: `var(--borderWidth, 2px) solid transparent`,
                                fontFamily: `var(--fontFamily, "Inter")`
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.border = `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-primary, #006FEE) 50%, transparent)`;
                                e.target.style.borderRadius = `var(--borderRadius, 8px)`;
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.border = `var(--borderWidth, 2px) solid transparent`;
                            }}
                            startContent={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            }
                        >
                            Reset
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            isIconOnly
                            variant="light"
                            onPress={handleModeToggle}
                            style={{
                                color: `var(--theme-foreground, #11181C)`,
                                borderRadius: `var(--borderRadius, 8px)`,
                                border: `var(--borderWidth, 2px) solid transparent`,
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.border = `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-primary, #006FEE) 50%, transparent)`;
                                e.target.style.borderRadius = `var(--borderRadius, 8px)`;
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.border = `var(--borderWidth, 2px) solid transparent`;
                            }}
                        >
                            {themeSettings?.mode === 'dark' ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            )}
                        </Button>
                        <Button
                            isIconOnly
                            variant="light"
                            onPress={handleClose}
                            style={{
                                color: `var(--theme-foreground, #11181C)`,
                                borderRadius: `var(--borderRadius, 8px)`,
                                border: `var(--borderWidth, 2px) solid transparent`,
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.border = `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-danger, #F31260) 50%, transparent)`;
                                e.target.style.borderRadius = `var(--borderRadius, 8px)`;
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.border = `var(--borderWidth, 2px) solid transparent`;
                            }}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </Button>
                    </div>
                </ModalHeader>

                <ModalBody
                    style={{
                        background: `transparent`,
                        fontFamily: `var(--fontFamily, "Inter")`
                    }}
                >
                    <Tabs 
                        aria-label="Theme Settings" 
                        className="w-full"
                        variant="underlined"
                        style={{
                            fontFamily: `var(--fontFamily, "Inter")`
                        }}
                    >
                        {/* Themes Tab */}
                        <Tab key="themes" title="Themes">
                            <div 
                                className="p-6 space-y-6"
                                style={{
                                    fontFamily: `var(--fontFamily, "Inter")`
                                }}
                            >
                                {/* Prebuilt Themes Section */}
                                <div>
                                    <SectionHeader 
                                        icon={
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: `var(--theme-foreground, #11181C)` }}>
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                                            </svg>
                                        } 
                                        title="Prebuilt Themes" 
                                    />

                                    <Select
                                        placeholder="Select a theme"
                                        selectedKeys={[themeSettings?.activeTheme || 'heroui']}
                                        onSelectionChange={(keys) => handlePrebuiltThemeSelect(Array.from(keys)[0])}
                                        classNames={{
                                            base: "mb-4",
                                            trigger: "border"
                                        }}
                                        style={{
                                            fontFamily: `var(--fontFamily, "Inter")`
                                        }}
                                    >
                                        {themeOptions.map((themeOption) => (
                                            <SelectItem key={themeOption.id} value={themeOption.id}>
                                                {themeOption.name}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                </div>

                                {/* Default Color Section */}
                                <div>
                                    <SectionHeader 
                                        icon={
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: `var(--theme-foreground, #11181C)` }}>
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                                            </svg>
                                        } 
                                        title="Default Color" 
                                    />
                                    
                                    <div className="flex gap-3">
                                        <div className="relative group">
                                            <input
                                                type="color"
                                                value={customColors.primary}
                                                onChange={(e) => handleNativeColorChange('primary', e.target.value)}
                                                className="w-12 h-12 cursor-pointer hover:scale-105 transition-transform"
                                                style={{ 
                                                    backgroundColor: customColors.primary,
                                                    borderRadius: `var(--borderRadius, 12px)`,
                                                    border: `var(--borderWidth, 2px) solid var(--theme-divider, #E4E4E7)`
                                                }}
                                            />
                                            <div 
                                                className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                style={{
                                                    color: `var(--theme-primary-foreground, #FFFFFF)`,
                                                    backgroundColor: `var(--theme-foreground, #11181C)`,
                                                    borderRadius: `var(--borderRadius, 6px)`,
                                                    fontFamily: `var(--fontFamily, "Inter")`
                                                }}
                                            >
                                                Primary Color
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Base Colors Section */}
                                <div>
                                    <SectionHeader 
                                        icon={
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: `var(--theme-foreground, #11181C)` }}>
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                            </svg>
                                        } 
                                        title="Base colors" 
                                    />
                                    
                                    <div className="grid grid-cols-5 gap-3">
                                        {baseColors.map((color, index) => (
                                            <div key={color.key} className="relative group">
                                                <input
                                                    type="color"
                                                    value={customColors[color.key] || color.value}
                                                    onChange={(e) => handleNativeColorChange(color.key, e.target.value)}
                                                    className="w-12 h-12 cursor-pointer hover:scale-105 transition-transform"
                                                    style={{ 
                                                        backgroundColor: customColors[color.key] || color.value,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                        border: `var(--borderWidth, 2px) solid var(--theme-divider, #E4E4E7)`
                                                    }}
                                                />
                                                <div 
                                                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                                                    style={{
                                                        color: `var(--theme-primary-foreground, #FFFFFF)`,
                                                        backgroundColor: `var(--theme-foreground, #11181C)`,
                                                        borderRadius: `var(--borderRadius, 6px)`,
                                                        fontFamily: `var(--fontFamily, "Inter")`
                                                    }}
                                                >
                                                    {color.name}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Content Colors Section */}
                                <div>
                                    <SectionHeader 
                                        icon={
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: `var(--theme-foreground, #11181C)` }}>
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        } 
                                        title="Content colors" 
                                    />
                                    
                                    <div className="grid grid-cols-4 gap-3">
                                        {contentColors.map((color, index) => (
                                            <div key={color.key} className="relative group">
                                                <input
                                                    type="color"
                                                    value={customColors[color.key] || color.value}
                                                    onChange={(e) => handleNativeColorChange(color.key, e.target.value)}
                                                    className="w-12 h-12 cursor-pointer hover:scale-105 transition-transform"
                                                    style={{ 
                                                        backgroundColor: customColors[color.key] || color.value,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                        border: `var(--borderWidth, 2px) solid var(--theme-divider, #E4E4E7)`
                                                    }}
                                                />
                                                <div 
                                                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                                                    style={{
                                                        color: `var(--theme-primary-foreground, #FFFFFF)`,
                                                        backgroundColor: `var(--theme-foreground, #11181C)`,
                                                        borderRadius: `var(--borderRadius, 6px)`,
                                                        fontFamily: `var(--fontFamily, "Inter")`
                                                    }}
                                                >
                                                    {color.name}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Layout Colors Section */}
                                <div>
                                    <SectionHeader 
                                        icon={
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: `var(--theme-foreground, #11181C)` }}>
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                            </svg>
                                        } 
                                        title="Layout colors" 
                                    />
                                    
                                    <div className="grid grid-cols-3 gap-3">
                                        {layoutColors.map((color, index) => (
                                            <div key={color.key} className="relative group">
                                                <input
                                                    type="color"
                                                    value={customColors[color.key] || color.value}
                                                    onChange={(e) => handleNativeColorChange(color.key, e.target.value)}
                                                    className="w-12 h-12 cursor-pointer hover:scale-105 transition-transform"
                                                    style={{ 
                                                        backgroundColor: customColors[color.key] || color.value,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                        border: `var(--borderWidth, 2px) solid var(--theme-divider, #E4E4E7)`
                                                    }}
                                                />
                                                <div 
                                                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                                                    style={{
                                                        color: `var(--theme-primary-foreground, #FFFFFF)`,
                                                        backgroundColor: `var(--theme-foreground, #11181C)`,
                                                        borderRadius: `var(--borderRadius, 6px)`,
                                                        fontFamily: `var(--fontFamily, "Inter")`
                                                    }}
                                                >
                                                    {color.name}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Tab>

                        {/* Background Tab */}
                        <Tab key="background" title="Background">
                            <div 
                                className="p-6 space-y-6"
                                style={{
                                    fontFamily: `var(--fontFamily, "Inter")`
                                }}
                            >
                                {/* Background Type Selection */}
                                <div>
                                    <SectionHeader 
                                        icon={
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: `var(--theme-foreground, #11181C)` }}>
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        } 
                                        title="Background Type" 
                                    />
                                    <div className="flex gap-3">
                                        <Button
                                            variant={backgroundType === 'color' ? 'solid' : 'bordered'}
                                            color={backgroundType === 'color' ? 'primary' : 'default'}
                                            onPress={() => handleBackgroundUpdate('type', 'color')}
                                            style={{
                                                borderRadius: `var(--borderRadius, 8px)`,
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                border: backgroundType !== 'color' ? `var(--borderWidth, 2px) solid var(--theme-divider, #E4E4E7)` : undefined
                                            }}
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                                            </svg>
                                            Solid Color
                                        </Button>
                                        <Button
                                            variant={backgroundType === 'image' ? 'solid' : 'bordered'}
                                            color={backgroundType === 'image' ? 'primary' : 'default'}
                                            onPress={() => handleBackgroundUpdate('type', 'image')}
                                            style={{
                                                borderRadius: `var(--borderRadius, 8px)`,
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                border: backgroundType !== 'image' ? `var(--borderWidth, 2px) solid var(--theme-divider, #E4E4E7)` : undefined
                                            }}
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            Image
                                        </Button>
                                    </div>
                                </div>

                                {/* Solid Color Background Section */}
                                {backgroundType === 'color' && (
                                    <div className="space-y-6">
                                        {/* Predefined Colors */}
                                        <div>
                                            <SectionHeader 
                                                icon={
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: `var(--theme-foreground, #11181C)` }}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                                                    </svg>
                                                } 
                                                title="Predefined Colors" 
                                            />
                                            
                                            {/* Popular Background Colors */}
                                            <div className="grid grid-cols-6 gap-3 mb-4">
                                                {[
                                                    { name: 'Default', value: '#ffffff', description: 'Clean white' },
                                                    { name: 'Dark', value: '#0f0f23', description: 'Deep dark' },
                                                    { name: 'Slate', value: '#1e293b', description: 'Professional slate' },
                                                    { name: 'Blue', value: '#1e40af', description: 'Corporate blue' },
                                                    { name: 'Purple', value: '#7c3aed', description: 'Modern purple' },
                                                    { name: 'Green', value: '#059669', description: 'Nature green' },
                                                    { name: 'Orange', value: '#ea580c', description: 'Energetic orange' },
                                                    { name: 'Red', value: '#dc2626', description: 'Bold red' },
                                                    { name: 'Gray', value: '#6b7280', description: 'Neutral gray' },
                                                    { name: 'Indigo', value: '#4338ca', description: 'Deep indigo' },
                                                    { name: 'Pink', value: '#ec4899', description: 'Vibrant pink' },
                                                    { name: 'Teal', value: '#0d9488', description: 'Calming teal' }
                                                ].map((color) => (
                                                    <div
                                                        key={color.value}
                                                        className="flex flex-col items-center gap-2"
                                                    >
                                                        <button
                                                            className={`w-12 h-12 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary ${
                                                                (themeSettings?.background?.color || '#ffffff') === color.value 
                                                                    ? 'ring-2' 
                                                                    : 'hover:ring-2 hover:ring-opacity-50'
                                                            }`}
                                                            style={{ 
                                                                backgroundColor: color.value,
                                                                borderRadius: `var(--borderRadius, 12px)`,
                                                                border: `var(--borderWidth, 2px) solid ${
                                                                    (themeSettings?.background?.color || '#ffffff') === color.value 
                                                                        ? 'var(--theme-primary, #006FEE)' 
                                                                        : 'var(--theme-divider, #E4E4E7)'
                                                                }`,
                                                                ringColor: 'var(--theme-primary, #006FEE)'
                                                            }}
                                                            onClick={() => handleBackgroundUpdate('color', color.value)}
                                                            title={`${color.name} - ${color.description}`}
                                                        />
                                                        <span 
                                                            className="text-xs text-center"
                                                            style={{ 
                                                                color: `color-mix(in srgb, var(--theme-foreground, #11181C) 70%, transparent)`,
                                                                fontFamily: `var(--fontFamily, "Inter")`
                                                            }}
                                                        >
                                                            {color.name}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            {/* Gradient Options */}
                                            <div className="mt-6">
                                                <h4 
                                                    className="text-sm font-medium mb-3"
                                                    style={{ 
                                                        color: `var(--theme-foreground, #11181C)`,
                                                        fontFamily: `var(--fontFamily, "Inter")`
                                                    }}
                                                >
                                                    Gradient Backgrounds
                                                </h4>
                                                <div className="grid grid-cols-3 gap-3">
                                                    {[
                                                        { name: 'Blue Wave', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
                                                        { name: 'Purple Rain', value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
                                                        { name: 'Sunset', value: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)' },
                                                        { name: 'Ocean', value: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)' },
                                                        { name: 'Forest', value: 'linear-gradient(135deg, #00b894 0%, #55a3ff 100%)' },
                                                        { name: 'Night', value: 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)' }
                                                    ].map((gradient) => (
                                                        <button
                                                            key={gradient.name}
                                                            className={`h-16 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary flex items-end p-2 ${
                                                                (themeSettings?.background?.color || '#ffffff') === gradient.value 
                                                                    ? 'ring-2' 
                                                                    : 'hover:ring-2 hover:ring-opacity-50'
                                                            }`}
                                                            style={{ 
                                                                background: gradient.value,
                                                                borderRadius: `var(--borderRadius, 12px)`,
                                                                border: `var(--borderWidth, 2px) solid ${
                                                                    (themeSettings?.background?.color || '#ffffff') === gradient.value 
                                                                        ? 'var(--theme-primary, #006FEE)' 
                                                                        : 'var(--theme-divider, #E4E4E7)'
                                                                }`,
                                                                ringColor: 'var(--theme-primary, #006FEE)'
                                                            }}
                                                            onClick={() => handleBackgroundUpdate('color', gradient.value)}
                                                        >
                                                            <span 
                                                                className="text-xs font-medium px-2 py-1 rounded backdrop-blur-sm"
                                                                style={{
                                                                    color: `var(--theme-primary-foreground, #FFFFFF)`,
                                                                    backgroundColor: `color-mix(in srgb, var(--theme-foreground, #11181C) 20%, transparent)`,
                                                                    borderRadius: `var(--borderRadius, 6px)`,
                                                                    fontFamily: `var(--fontFamily, "Inter")`
                                                                }}
                                                            >
                                                                {gradient.name}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Custom Color Picker */}
                                        <div>
                                            <SectionHeader 
                                                icon={
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: `var(--theme-foreground, #11181C)` }}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                                                    </svg>
                                                } 
                                                title="Custom Color Picker" 
                                            />
                                            
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-4">
                                                    {/* Only show color picker for hex colors, not gradients */}
                                                    {(!themeSettings?.background?.color || 
                                                      (!themeSettings.background.color.startsWith('linear-gradient') && 
                                                       !themeSettings.background.color.startsWith('radial-gradient'))) && (
                                                        <Input
                                                            type="color"
                                                            value={themeSettings?.background?.color?.startsWith('#') ? themeSettings.background.color : '#ffffff'}
                                                            onChange={(e) => handleBackgroundUpdate('color', e.target.value)}
                                                            className="w-16 h-16"
                                                            style={{ 
                                                                padding: 0,
                                                                border: 'none',
                                                                borderRadius: `var(--borderRadius, 8px)`,
                                                                fontFamily: `var(--fontFamily, "Inter")`
                                                            }}
                                                        />
                                                    )}
                                                    <div className="flex-1">
                                                        <Input
                                                            label="Hex Color"
                                                            placeholder="#ffffff"
                                                            value={themeSettings?.background?.color?.startsWith('#') ? themeSettings.background.color : ''}
                                                            onChange={(e) => {
                                                                const value = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`;
                                                                if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                                                                    handleBackgroundUpdate('color', value);
                                                                }
                                                            }}
                                                            startContent={
                                                                <span style={{ color: `color-mix(in srgb, var(--theme-foreground, #11181C) 60%, transparent)` }}>
                                                                    #
                                                                </span>
                                                            }
                                                            style={{
                                                                fontFamily: `var(--fontFamily, "Inter")`
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                
                                                {/* Show current gradient info if applicable */}
                                                {themeSettings?.background?.color && 
                                                 (themeSettings.background.color.startsWith('linear-gradient') || 
                                                  themeSettings.background.color.startsWith('radial-gradient')) && (
                                                    <div 
                                                        className="p-4 rounded-lg"
                                                        style={{
                                                            background: `color-mix(in srgb, var(--theme-content2, #F4F4F5) 50%, transparent)`,
                                                            borderRadius: `var(--borderRadius, 12px)`,
                                                            border: `var(--borderWidth, 1px) solid var(--theme-divider, #E4E4E7)`
                                                        }}
                                                    >
                                                        <div 
                                                            className="text-sm mb-2"
                                                            style={{ 
                                                                color: `var(--theme-foreground, #11181C)`,
                                                                fontFamily: `var(--fontFamily, "Inter")`
                                                            }}
                                                        >
                                                            Current gradient:
                                                        </div>
                                                        <div 
                                                            className="h-8 border"
                                                            style={{ 
                                                                background: themeSettings.background.color,
                                                                borderRadius: `var(--borderRadius, 8px)`,
                                                                border: `var(--borderWidth, 1px) solid var(--theme-divider, #E4E4E7)`
                                                            }}
                                                        />
                                                        <div 
                                                            className="text-xs mt-2 font-mono break-all"
                                                            style={{ 
                                                                color: `color-mix(in srgb, var(--theme-foreground, #11181C) 70%, transparent)`,
                                                                fontFamily: `var(--fontFamily, "Inter")`
                                                            }}
                                                        >
                                                            {themeSettings.background.color}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {/* Color Preview for hex colors */}
                                                {themeSettings?.background?.color?.startsWith('#') && (
                                                    <div className="mt-4">
                                                        <div 
                                                            className="w-full h-20 flex items-center justify-center"
                                                            style={{ 
                                                                background: themeSettings.background.color,
                                                                borderRadius: `var(--borderRadius, 12px)`,
                                                                border: `var(--borderWidth, 2px) solid var(--theme-divider, #E4E4E7)`
                                                            }}
                                                        >
                                                            <span 
                                                                className="text-sm font-medium px-3 py-1 rounded backdrop-blur-sm"
                                                                style={{
                                                                    backgroundColor: `color-mix(in srgb, var(--theme-foreground, #11181C) 10%, transparent)`,
                                                                    color: `var(--theme-primary-foreground, #FFFFFF)`,
                                                                    borderRadius: `var(--borderRadius, 6px)`,
                                                                    fontFamily: `var(--fontFamily, "Inter")`
                                                                }}
                                                            >
                                                                Color Preview
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Image Background Section */}
                                {backgroundType === 'image' && (
                                    <div className="space-y-6">
                                        {/* Image Upload/URL Input */}
                                        <div>
                                            <SectionHeader 
                                                icon={
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: `var(--theme-foreground, #11181C)` }}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                    </svg>
                                                } 
                                                title="Enter Image URL" 
                                            />
                                            
                                            <div className="space-y-3">
                                                <Input
                                                    placeholder="Enter image URL"
                                                    value={backgroundImage}
                                                    onChange={(e) => handleBackgroundUpdate('image', e.target.value)}
                                                    className="w-full"
                                                    style={{
                                                        fontFamily: `var(--fontFamily, "Inter")`
                                                    }}
                                                />
                                                
                                                {backgroundImage && (
                                                    <div className="space-y-2">
                                                        <div 
                                                            className="w-full h-32 overflow-hidden"
                                                            style={{
                                                                borderRadius: `var(--borderRadius, 12px)`,
                                                                border: `var(--borderWidth, 2px) solid var(--theme-divider, #E4E4E7)`
                                                            }}
                                                        >
                                                            <img 
                                                                src={backgroundImage} 
                                                                alt="Background preview" 
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                }}
                                                            />
                                                        </div>
                                                        <div 
                                                            className="text-xs flex items-center gap-2"
                                                            style={{ 
                                                                color: `color-mix(in srgb, var(--theme-foreground, #11181C) 70%, transparent)`,
                                                                fontFamily: `var(--fontFamily, "Inter")`
                                                            }}
                                                        >
                                                            <CheckCircleIcon 
                                                                className="w-4 h-4"
                                                                style={{ color: `var(--theme-success, #17C964)` }}
                                                            />
                                                            <span>Image loaded ({backgroundImage.length} characters)</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Background Size */}
                                        <div>
                                            <SectionHeader 
                                                icon={
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: `var(--theme-foreground, #11181C)` }}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                                    </svg>
                                                } 
                                                title="Background Size" 
                                            />
                                            <div className="grid grid-cols-2 gap-2">
                                                {backgroundSizeOptions.map((option) => (
                                                    <Button
                                                        key={option.value}
                                                        variant={backgroundSize === option.value ? 'solid' : 'bordered'}
                                                        color={backgroundSize === option.value ? 'primary' : 'default'}
                                                        onPress={() => handleBackgroundUpdate('size', option.value)}
                                                        className="flex flex-col gap-1 h-auto py-3"
                                                        style={{
                                                            borderRadius: `var(--borderRadius, 8px)`,
                                                            fontFamily: `var(--fontFamily, "Inter")`,
                                                            border: backgroundSize !== option.value ? `var(--borderWidth, 2px) solid var(--theme-divider, #E4E4E7)` : undefined
                                                        }}
                                                    >
                                                        <span 
                                                            className="font-medium"
                                                            style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                                        >
                                                            {option.label}
                                                        </span>
                                                        <span 
                                                            className="text-xs"
                                                            style={{ 
                                                                color: `color-mix(in srgb, var(--theme-foreground, #11181C) 70%, transparent)`,
                                                                fontFamily: `var(--fontFamily, "Inter")`
                                                            }}
                                                        >
                                                            {option.description}
                                                        </span>
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Background Position */}
                                        <div>
                                            <SectionHeader 
                                                icon={
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: `var(--theme-foreground, #11181C)` }}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                                    </svg>
                                                } 
                                                title="Background Position" 
                                            />
                                            <div className="grid grid-cols-3 gap-2">
                                                {backgroundPositionOptions.map((option) => (
                                                    <Button
                                                        key={option.value}
                                                        variant={backgroundPosition === option.value ? 'solid' : 'bordered'}
                                                        color={backgroundPosition === option.value ? 'primary' : 'default'}
                                                        onPress={() => handleBackgroundUpdate('position', option.value)}
                                                        size="sm"
                                                        style={{
                                                            borderRadius: `var(--borderRadius, 8px)`,
                                                            fontFamily: `var(--fontFamily, "Inter")`,
                                                            border: backgroundPosition !== option.value ? `var(--borderWidth, 2px) solid var(--theme-divider, #E4E4E7)` : undefined
                                                        }}
                                                    >
                                                        {option.label}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Background Repeat */}
                                        <div>
                                            <SectionHeader 
                                                icon={
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: `var(--theme-foreground, #11181C)` }}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                    </svg>
                                                } 
                                                title="Background Repeat" 
                                            />
                                            <div className="grid grid-cols-2 gap-2">
                                                {backgroundRepeatOptions.map((option) => (
                                                    <Button
                                                        key={option.value}
                                                        variant={backgroundRepeat === option.value ? 'solid' : 'bordered'}
                                                        color={backgroundRepeat === option.value ? 'primary' : 'default'}
                                                        onPress={() => handleBackgroundUpdate('repeat', option.value)}
                                                        size="sm"
                                                        style={{
                                                            borderRadius: `var(--borderRadius, 8px)`,
                                                            fontFamily: `var(--fontFamily, "Inter")`,
                                                            border: backgroundRepeat !== option.value ? `var(--borderWidth, 2px) solid var(--theme-divider, #E4E4E7)` : undefined
                                                        }}
                                                    >
                                                        {option.label}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Common Background Controls - Always Available */}
                                <div className="pt-4 border-t border-default-200">
                                    <div className="space-y-6">
                                        {/* Quick Background Type Switch */}
                                        <div>
                                            <SectionHeader 
                                                icon={
                                                    <svg className="w-4 h-4 text-default-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                    </svg>
                                                } 
                                                title="Quick Switch" 
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="bordered"
                                                    onPress={() => {
                                                        handleBackgroundUpdate('type', backgroundType === 'color' ? 'image' : 'color');
                                                    }}
                                                >
                                                    Switch to {backgroundType === 'color' ? 'Image' : 'Color'} Background
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="bordered"
                                                    color="danger"
                                                    onPress={() => {
                                                        handleBackgroundUpdate('type', 'color');
                                                        handleBackgroundUpdate('color', '#ffffff');
                                                        handleBackgroundUpdate('image', '');
                                                    }}
                                                >
                                                    Reset Background
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Current Background Preview */}
                                        <div>
                                            <SectionHeader 
                                                icon={
                                                    <svg className="w-4 h-4 text-default-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                } 
                                                title="Current Background Preview" 
                                            />
                                            <div className="space-y-3">
                                                <div 
                                                    className="w-full h-24 rounded-lg border border-default-200 relative overflow-hidden"
                                                    style={{
                                                        background: backgroundType === 'color' && backgroundColor 
                                                            ? backgroundColor 
                                                            : backgroundType === 'image' && backgroundImage 
                                                                ? `url(${backgroundImage})` 
                                                                : '#f5f5f5',
                                                        backgroundSize: backgroundType === 'image' ? (backgroundSize || 'cover') : undefined,
                                                        backgroundPosition: backgroundType === 'image' ? (backgroundPosition || 'center') : undefined,
                                                        backgroundRepeat: backgroundType === 'image' ? (backgroundRepeat || 'no-repeat') : undefined
                                                    }}
                                                >
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <span className="text-sm font-medium px-3 py-1 rounded bg-black/20 text-white backdrop-blur-sm">
                                                            Preview
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-default-500 space-y-1">
                                                    <div>Type: <span className="font-medium">{backgroundType}</span></div>
                                                    {backgroundType === 'color' && backgroundColor && (
                                                        <div>Color: <span className="font-medium">{backgroundColor}</span></div>
                                                    )}
                                                    {backgroundType === 'image' && backgroundImage && (
                                                        <div>Image: <span className="font-medium">{backgroundImage.length > 50 ? backgroundImage.substring(0, 50) + '...' : backgroundImage}</span></div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Tab>

                        {/* Layout Tab */}
                        <Tab key="layout" title="Layout">
                            <div 
                                className="p-6 space-y-6"
                                style={{
                                    fontFamily: `var(--fontFamily, "Inter")`
                                }}
                            >
                                {/* Font Family Section */}
                                <div>
                                    <SectionHeader 
                                        icon={
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: `var(--theme-foreground, #11181C)` }}>
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 20V4c0-1.1.9-2 2-2h3.5c1.8 0 3.5 1 3.5 3.5s-1.7 3.5-3.5 3.5H8v1h2.5c1.8 0 3.5 1 3.5 3.5s-1.7 3.5-3.5 3.5H8z" />
                                            </svg>
                                        } 
                                        title="Font Family" 
                                        info={true}
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        {fontOptions.map((font) => (
                                            <button
                                                key={font.name}
                                                className={`p-4 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary ${
                                                    (themeSettings?.layout?.fontFamily || 'Inter') === font.value 
                                                        ? 'ring-2' 
                                                        : ''
                                                }`}
                                                style={{
                                                    borderRadius: `var(--borderRadius, 12px)`,
                                                    border: `var(--borderWidth, 2px) solid ${
                                                        (themeSettings?.layout?.fontFamily || 'Inter') === font.value 
                                                            ? 'var(--theme-primary, #006FEE)' 
                                                            : 'var(--theme-divider, #E4E4E7)'
                                                    }`,
                                                    background: `linear-gradient(135deg, 
                                                        var(--theme-content1, #FAFAFA) 20%, 
                                                        var(--theme-content2, #F4F4F5) 10%, 
                                                        var(--theme-content3, #F1F3F4) 20%)`,
                                                    ringColor: 'var(--theme-primary, #006FEE)'
                                                }}
                                                onClick={() => handleLayoutChange('fontFamily', font.value)}
                                            >
                                                <div className="text-center">
                                                    <div 
                                                        className="text-xl font-bold mb-1" 
                                                        style={{ 
                                                            fontFamily: font.value,
                                                            color: `var(--theme-foreground, #11181C)`
                                                        }}
                                                    >
                                                        Ag12
                                                    </div>
                                                    <div 
                                                        className="text-xs"
                                                        style={{ 
                                                            color: `color-mix(in srgb, var(--theme-foreground, #11181C) 70%, transparent)`,
                                                            fontFamily: `var(--fontFamily, "Inter")`
                                                        }}
                                                    >
                                                        {font.name}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Radius Section */}
                                <div>
                                    <SectionHeader 
                                        icon={
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: `var(--theme-foreground, #11181C)` }}>
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12a3 3 0 003-3m-3 3a3 3 0 003 3m-3-3H3m6 0l6-6m6 6a3 3 0 01-3 3m3-3a3 3 0 01-3-3m3 3H15" />
                                            </svg>
                                        } 
                                        title="Radius" 
                                        info={true}
                                    />
                                    <div className="grid grid-cols-3 gap-3">
                                        {radiusValues.map((radius) => (
                                            <button
                                                key={radius.name}
                                                className={`p-4 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary ${
                                                    (themeSettings?.layout?.borderRadius || '8px') === radius.value 
                                                        ? 'ring-2' 
                                                        : ''
                                                }`}
                                                style={{
                                                    borderRadius: `var(--borderRadius, 12px)`,
                                                    border: `var(--borderWidth, 2px) solid ${
                                                        (themeSettings?.layout?.borderRadius || '8px') === radius.value 
                                                            ? 'var(--theme-primary, #006FEE)' 
                                                            : 'var(--theme-divider, #E4E4E7)'
                                                    }`,
                                                    background: `linear-gradient(135deg, 
                                                        var(--theme-content1, #FAFAFA) 20%, 
                                                        var(--theme-content2, #F4F4F5) 10%, 
                                                        var(--theme-content3, #F1F3F4) 20%)`,
                                                    ringColor: 'var(--theme-primary, #006FEE)'
                                                }}
                                                onClick={() => handleLayoutChange('borderRadius', radius.value)}
                                            >
                                                <div className="text-center">
                                                    <div 
                                                        className="w-6 h-6 mx-auto mb-2"
                                                        style={{ 
                                                            backgroundColor: `var(--theme-primary, #006FEE)`,
                                                            borderRadius: radius.value 
                                                        }}
                                                    />
                                                    <div 
                                                        className="text-xs"
                                                        style={{ 
                                                            color: `color-mix(in srgb, var(--theme-foreground, #11181C) 70%, transparent)`,
                                                            fontFamily: `var(--fontFamily, "Inter")`
                                                        }}
                                                    >
                                                        {radius.label}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Border Width Section */}
                                <div>
                                    <SectionHeader 
                                        icon={
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: `var(--theme-foreground, #11181C)` }}>
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12a3 3 0 003-3m-3 3a3 3 0 003 3m-3-3H3m6 0l6-6m6 6a3 3 0 01-3 3m3-3a3 3 0 01-3-3m3 3H15" />
                                            </svg>
                                        } 
                                        title="Border width" 
                                        info={true}
                                    />
                                    <div className="grid grid-cols-3 gap-3">
                                        {borderWidthValues.map((borderWidth) => (
                                            <button
                                                key={borderWidth.name}
                                                className={`p-4 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary ${
                                                    (themeSettings?.layout?.borderWidth || '2px') === borderWidth.value 
                                                        ? 'ring-2' 
                                                        : ''
                                                }`}
                                                style={{
                                                    borderRadius: `var(--borderRadius, 12px)`,
                                                    border: `var(--borderWidth, 2px) solid ${
                                                        (themeSettings?.layout?.borderWidth || '2px') === borderWidth.value 
                                                            ? 'var(--theme-primary, #006FEE)' 
                                                            : 'var(--theme-divider, #E4E4E7)'
                                                    }`,
                                                    background: `linear-gradient(135deg, 
                                                        var(--theme-content1, #FAFAFA) 20%, 
                                                        var(--theme-content2, #F4F4F5) 10%, 
                                                        var(--theme-content3, #F1F3F4) 20%)`,
                                                    ringColor: 'var(--theme-primary, #006FEE)'
                                                }}
                                                onClick={() => handleLayoutChange('borderWidth', borderWidth.value)}
                                            >
                                                <div className="text-center">
                                                    <div 
                                                        className="w-6 h-6 bg-transparent mx-auto mb-2 rounded-md"
                                                        style={{ 
                                                            borderWidth: borderWidth.value, 
                                                            borderStyle: 'solid',
                                                            borderColor: `var(--theme-primary, #006FEE)`
                                                        }}
                                                    />
                                                    <div 
                                                        className="text-xs"
                                                        style={{ 
                                                            color: `color-mix(in srgb, var(--theme-foreground, #11181C) 70%, transparent)`,
                                                            fontFamily: `var(--fontFamily, "Inter")`
                                                        }}
                                                    >
                                                        {borderWidth.label}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Scaling Section */}
                                <div>
                                    <SectionHeader 
                                        icon={
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: `var(--theme-foreground, #11181C)` }}>
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                        } 
                                        title="Scaling" 
                                        info={true}
                                    />
                                    <div className="flex gap-2 flex-wrap">
                                        {scalingOptions.map((scale) => (
                                            <button
                                                key={scale}
                                                className={`px-3 py-2 text-sm font-medium transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary ${
                                                    (themeSettings?.layout?.scale || '100%') === scale 
                                                        ? 'ring-2' 
                                                        : ''
                                                }`}
                                                style={{
                                                    borderRadius: `var(--borderRadius, 8px)`,
                                                    border: `var(--borderWidth, 2px) solid ${
                                                        (themeSettings?.layout?.scale || '100%') === scale 
                                                            ? 'var(--theme-primary, #006FEE)' 
                                                            : 'var(--theme-divider, #E4E4E7)'
                                                    }`,
                                                    background: (themeSettings?.layout?.scale || '100%') === scale 
                                                        ? `var(--theme-primary, #006FEE)` 
                                                        : `linear-gradient(135deg, 
                                                            var(--theme-content1, #FAFAFA) 20%, 
                                                            var(--theme-content2, #F4F4F5) 10%, 
                                                            var(--theme-content3, #F1F3F4) 20%)`,
                                                    color: (themeSettings?.layout?.scale || '100%') === scale 
                                                        ? `var(--theme-primary-foreground, #FFFFFF)` 
                                                        : `var(--theme-foreground, #11181C)`,
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                    ringColor: 'var(--theme-primary, #006FEE)'
                                                }}
                                                onClick={() => handleLayoutChange('scale', scale)}
                                            >
                                                {scale}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Disable Opacity Section */}
                                <div>
                                    <SectionHeader 
                                        icon={
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: `var(--theme-foreground, #11181C)` }}>
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                            </svg>
                                        } 
                                        title="Disable Opacity" 
                                    />
                                    <div className="flex gap-2 flex-wrap">
                                        {opacityOptions.map((opacity) => (
                                            <button
                                                key={opacity}
                                                className={`px-3 py-2 text-sm font-medium transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary ${
                                                    (themeSettings?.layout?.disabledOpacity || '0.5') === opacity 
                                                        ? 'ring-2' 
                                                        : ''
                                                }`}
                                                style={{
                                                    borderRadius: `var(--borderRadius, 8px)`,
                                                    border: `var(--borderWidth, 2px) solid ${
                                                        (themeSettings?.layout?.disabledOpacity || '0.5') === opacity 
                                                            ? 'var(--theme-primary, #006FEE)' 
                                                            : 'var(--theme-divider, #E4E4E7)'
                                                    }`,
                                                    background: (themeSettings?.layout?.disabledOpacity || '0.5') === opacity 
                                                        ? `var(--theme-primary, #006FEE)` 
                                                        : `linear-gradient(135deg, 
                                                            var(--theme-content1, #FAFAFA) 20%, 
                                                            var(--theme-content2, #F4F4F5) 10%, 
                                                            var(--theme-content3, #F1F3F4) 20%)`,
                                                    color: (themeSettings?.layout?.disabledOpacity || '0.5') === opacity 
                                                        ? `var(--theme-primary-foreground, #FFFFFF)` 
                                                        : `var(--theme-foreground, #11181C)`,
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                    ringColor: 'var(--theme-primary, #006FEE)'
                                                }}
                                                onClick={() => handleLayoutChange('disabledOpacity', opacity)}
                                            >
                                                {opacity}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Tab>
                    </Tabs>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default ThemeSettingDrawer;
