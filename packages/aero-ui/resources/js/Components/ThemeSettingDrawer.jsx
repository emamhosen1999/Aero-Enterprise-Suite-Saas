import React, { useState } from 'react';
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
    Switch,
    Divider,
    Tooltip,
} from '@heroui/react';
import { useTheme } from '@/Context/ThemeContext';
import { getCardStyleOptions } from '../theme/cardStyles';
import { 
    MoonIcon,
    SunIcon,
    SwatchIcon,
    Cog6ToothIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';

/**
 * Theme Settings Drawer
 * 
 * Features:
 * - Card style selection (10 curated options)
 * - Font family selection
 * - Background color/gradient
 * - Dark mode toggle
 * - Reset to default
 * 
 * Removed:
 * - Individual color pickers (12 colors)
 * - Background image upload
 * - Manual borderRadius, borderWidth, scale, opacity inputs
 * - Redundant theme tabs
 */
const ThemeSettingDrawer = ({ isOpen, onClose }) => {
    const { themeSettings, updateTheme, toggleMode, resetTheme } = useTheme();
    
    const [selectedTab, setSelectedTab] = useState('styles');
    const cardStyleOptions = getCardStyleOptions();
    
    // Font family options
    const fontFamilies = [
        { name: 'Inter', value: 'Inter, ui-sans-serif, system-ui, sans-serif' },
        { name: 'Roboto', value: 'Roboto, ui-sans-serif, system-ui, sans-serif' },
        { name: 'Outfit', value: 'Outfit, ui-sans-serif, system-ui, sans-serif' },
        { name: 'Poppins', value: 'Poppins, ui-sans-serif, system-ui, sans-serif' },
        { name: 'Georgia', value: 'Georgia, ui-serif, serif' },
    ];
    
    // Background color presets
    const backgroundPresets = [
        { name: 'White', value: '#ffffff' },
        { name: 'Light Gray', value: '#f5f5f5' },
        { name: 'Warm', value: '#fef3c7' },
        { name: 'Cool', value: '#dbeafe' },
        { name: 'Dark', value: '#1f2937' },
    ];
    
    // Gradient presets
    const gradientPresets = [
        { name: 'None', value: '#ffffff' },
        { name: 'Blue Purple', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
        { name: 'Warm Sunset', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
        { name: 'Ocean', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
        { name: 'Forest', value: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    ];
    
    const handleCardStyleChange = (styleKey) => {
        updateTheme({ cardStyle: styleKey });
    };
    
    const handleFontChange = (fontValue) => {
        updateTheme({
            typography: {
                ...themeSettings.typography,
                fontFamily: fontValue
            }
        });
    };
    
    const handleBackgroundChange = (bgValue) => {
        updateTheme({
            background: {
                type: 'color',
                value: bgValue
            }
        });
        
        // Apply background immediately via CSS variables
        if (document.documentElement) {
            document.documentElement.style.setProperty('--theme-background', bgValue);
        }
        
        // Also apply to body for compatibility
        if (document.body) {
            document.body.style.background = bgValue;
        }
    };
    
    const handleGradientChange = (gradientValue) => {
        updateTheme({
            background: {
                type: 'gradient',
                value: gradientValue
            }
        });
        
        // Apply gradient immediately via CSS variables
        if (document.documentElement) {
            document.documentElement.style.setProperty('--theme-background', gradientValue);
        }
        
        // Also apply to body for compatibility
        if (document.body) {
            document.body.style.background = gradientValue;
        }
    };
    
    const handleReset = () => {
        if (confirm('Reset theme to default settings?')) {
            resetTheme();
        }
    };
    
    const currentCardStyle = themeSettings?.cardStyle || 'modern';
    const currentFont = themeSettings?.typography?.fontFamily || 'Inter';
    const currentBg = themeSettings?.background?.value || '';
    
    // Calculate actual visual dark state (accounting for system preference)
    const isDark = themeSettings?.mode === 'dark' || 
        (themeSettings?.mode === 'system' && 
         typeof window !== 'undefined' && 
         window.matchMedia?.('(prefers-color-scheme: dark)')?.matches);
    
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="3xl"
            placement="center"
            scrollBehavior="inside"
            classNames={{
                base: "max-h-[90vh]",
                body: "py-6"
            }}
        >
            <ModalContent>
                <ModalHeader className="flex items-center gap-2 border-b border-divider pb-4">
                    <SwatchIcon className="w-6 h-6 text-primary" />
                    <span className="text-xl font-bold">Theme Settings</span>
                </ModalHeader>
                
                <ModalBody>
                    {/* Tab Navigation */}
                    <div className="flex gap-2 mb-6">
                        <Button
                            onPress={() => setSelectedTab('styles')}
                            color={selectedTab === 'styles' ? 'primary' : 'default'}
                            variant={selectedTab === 'styles' ? 'solid' : 'flat'}
                            className="flex-1"
                        >
                            Card Styles
                        </Button>
                        <Button
                            onPress={() => setSelectedTab('preferences')}
                            color={selectedTab === 'preferences' ? 'primary' : 'default'}
                            variant={selectedTab === 'preferences' ? 'solid' : 'flat'}
                            className="flex-1"
                        >
                            Preferences
                        </Button>
                    </div>
                    
                    {/* Card Styles Tab */}
                    {selectedTab === 'styles' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Select Card Style</h3>
                                <p className="text-sm text-default-500 mb-4">
                                    Choose a professional theme. All colors, borders, and layout sync automatically.
                                </p>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    {cardStyleOptions.all.map((style) => (
                                        <Tooltip
                                            key={style.key}
                                            content={
                                                <div className="p-2 max-w-xs">
                                                    <p className="font-semibold text-sm mb-1">{style.name}</p>
                                                    <p className="text-xs text-default-500 mb-2">{style.description}</p>
                                                    <div className="text-xs text-default-400">
                                                        <p>Category: {style.category}</p>
                                                        <p>Font: {style.theme.layout.fontFamily}</p>
                                                        <p>Radius: {style.theme.layout.borderRadius}</p>
                                                    </div>
                                                </div>
                                            }
                                            placement="top"
                                            delay={300}
                                        >
                                            <div
                                                onClick={() => handleCardStyleChange(style.key)}
                                                className={`cursor-pointer transition-all duration-200 rounded-lg overflow-hidden ${
                                                    currentCardStyle === style.key
                                                        ? 'ring-2 ring-primary shadow-lg scale-[1.02]'
                                                        : 'hover:shadow-md hover:scale-[1.01]'
                                                }`}
                                                style={{
                                                    background: style.key === 'glass' 
                                                        ? `linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)`
                                                        : style.key === 'premium'
                                                        ? `linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)`
                                                        : `linear-gradient(135deg, 
                                                            ${style.theme.colors.content1} 20%, 
                                                            ${style.theme.colors.content2} 10%, 
                                                            ${style.theme.colors.content3} 20%)`,
                                                    border: style.key === 'bordered' 
                                                        ? `2px solid ${style.theme.colors.divider}` 
                                                        : style.key === 'flat' 
                                                        ? 'none'
                                                        : `1px solid ${style.theme.colors.divider}`,
                                                    borderRadius: style.theme.layout.borderRadius === '0px' ? '0px' 
                                                        : style.theme.layout.borderRadius === '4px' ? '4px'
                                                        : style.theme.layout.borderRadius === '8px' ? '8px' 
                                                        : '12px',
                                                    fontFamily: style.theme.layout.fontFamily,
                                                    boxShadow: style.key === 'elevated' ? '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' 
                                                              : style.key === 'glass' ? '0 8px 32px rgba(31, 38, 135, 0.37), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
                                                              : style.key === 'neomorphic' ? `8px 8px 16px ${style.theme.colors.content2}, -8px -8px 16px rgba(255,255,255,0.7)`
                                                              : style.key === 'soft' ? '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
                                                              : style.key === 'corporate' ? '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)'
                                                              : style.key === 'minimal' ? '0 1px 3px rgba(0,0,0,0.1)'
                                                              : style.key === 'premium' ? '0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,215,0,0.1)'
                                                              : style.key === 'bordered' ? 'none'
                                                              : style.key === 'flat' ? 'none' 
                                                              : '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
                                                    backdropFilter: style.key === 'glass' ? 'blur(10px) saturate(180%)' : 'none',
                                                    transform: `scale(${style.theme.layout.scale || 1})`,
                                                    WebkitBackdropFilter: style.key === 'glass' ? 'blur(10px) saturate(180%)' : 'none',
                                                    minHeight: '120px'
                                                }}
                                            >
                                                <div className="p-4 h-full">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="font-semibold text-sm" style={{ 
                                                            color: style.key === 'premium' ? '#FFD700' : style.theme.colors.foreground,
                                                            textShadow: style.key === 'premium' ? '0 0 10px rgba(255,215,0,0.3)' : 'none'
                                                        }}>
                                                            {style.name}
                                                        </h4>
                                                        {currentCardStyle === style.key && (
                                                            <div 
                                                                className="w-3 h-3 rounded-full flex items-center justify-center"
                                                                style={{ backgroundColor: style.theme.colors.primary }}
                                                            >
                                                                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Mini Preview Elements */}
                                                    <div className="space-y-2 mb-3">
                                                        <div 
                                                            className="h-2 rounded-full"
                                                            style={{ 
                                                                backgroundColor: style.theme.colors.primary,
                                                                borderRadius: style.theme.layout.borderRadius,
                                                                width: '60%'
                                                            }}
                                                        />
                                                        <div 
                                                            className="h-1.5 rounded-full"
                                                            style={{ 
                                                                backgroundColor: style.theme.colors.default,
                                                                borderRadius: style.theme.layout.borderRadius,
                                                                width: '80%'
                                                            }}
                                                        />
                                                    </div>
                                                    
                                                    {/* Color Palette Preview */}
                                                    <div className="flex gap-1.5 mb-3">
                                                        <div 
                                                            className="w-4 h-4 rounded-full border border-divider/50 shadow-sm"
                                                            style={{ backgroundColor: style.theme.colors.primary }}
                                                            title="Primary Color"
                                                        />
                                                        <div 
                                                            className="w-4 h-4 rounded-full border border-divider/50 shadow-sm"
                                                            style={{ backgroundColor: style.theme.colors.secondary }}
                                                            title="Secondary Color"
                                                        />
                                                        <div 
                                                            className="w-4 h-4 rounded-full border border-divider/50 shadow-sm"
                                                            style={{ backgroundColor: style.theme.colors.success }}
                                                            title="Success Color"
                                                        />
                                                        <div 
                                                            className="w-4 h-4 rounded-full border border-divider/50 shadow-sm"
                                                            style={{ backgroundColor: style.theme.colors.content1 }}
                                                            title="Background Color"
                                                        />
                                                    </div>
                                                    
                                                    <p className="text-xs text-default-500 line-clamp-2 mb-2">
                                                        {style.description}
                                                    </p>
                                                    
                                                    {/* Mini Preview Bar with Gradient */}
                                                    <div 
                                                        className="h-2 rounded-full shadow-inner"
                                                        style={{
                                                            background: `linear-gradient(90deg, 
                                                                ${style.theme.colors.primary} 0%, 
                                                                ${style.theme.colors.secondary} 50%, 
                                                                ${style.theme.colors.success} 100%)`
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </Tooltip>
                                    ))}
                                </div>
                            </div>
                            
                            <Divider />
                            
                            {/* Enhanced Preview Section */}
                            <div>
                                <h3 className="text-sm font-medium mb-3">Live Preview</h3>
                                <div className="space-y-4">
                                    
                                    {/* Main Card Preview */}
                                    <Card className="aero-card">
                                        <CardBody className="p-4">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                                    <SwatchIcon className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-foreground">Sample Dashboard Card</p>
                                                    <p className="text-xs text-default-500">Live theme preview</p>
                                                </div>
                                            </div>
                                            <p className="text-sm text-default-600 mb-3">
                                                This demonstrates how your cards, colors, and typography will appear throughout the application.
                                            </p>
                                            
                                            {/* Button Colors Preview */}
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                <Button size="sm" color="primary" variant="solid">Primary</Button>
                                                <Button size="sm" color="secondary" variant="solid">Secondary</Button>
                                                <Button size="sm" color="success" variant="solid">Success</Button>
                                                <Button size="sm" color="warning" variant="solid">Warning</Button>
                                                <Button size="sm" color="danger" variant="solid">Danger</Button>
                                            </div>
                                            
                                            {/* Button Variants */}
                                            <div className="flex flex-wrap gap-2">
                                                <Button size="sm" color="primary" variant="flat">Flat</Button>
                                                <Button size="sm" color="primary" variant="bordered">Bordered</Button>
                                                <Button size="sm" color="primary" variant="light">Light</Button>
                                            </div>
                                        </CardBody>
                                    </Card>
                                    
                                    {/* Stats Cards Preview */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <Card className="aero-card">
                                            <CardBody className="p-3 text-center">
                                                <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-success/20 flex items-center justify-center">
                                                    <div className="w-4 h-4 bg-success rounded-full"></div>
                                                </div>
                                                <p className="text-xs font-medium text-foreground">Active</p>
                                                <p className="text-lg font-bold text-success">1,234</p>
                                            </CardBody>
                                        </Card>
                                        <Card className="aero-card">
                                            <CardBody className="p-3 text-center">
                                                <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-warning/20 flex items-center justify-center">
                                                    <div className="w-4 h-4 bg-warning rounded-full"></div>
                                                </div>
                                                <p className="text-xs font-medium text-foreground">Pending</p>
                                                <p className="text-lg font-bold text-warning">567</p>
                                            </CardBody>
                                        </Card>
                                        <Card className="aero-card">
                                            <CardBody className="p-3 text-center">
                                                <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-primary/20 flex items-center justify-center">
                                                    <div className="w-4 h-4 bg-primary rounded-full"></div>
                                                </div>
                                                <p className="text-xs font-medium text-foreground">Total</p>
                                                <p className="text-lg font-bold text-primary">1,801</p>
                                            </CardBody>
                                        </Card>
                                    </div>
                                    
                                    {/* Form Elements Preview */}
                                    <Card className="aero-card">
                                        <CardBody className="p-4">
                                            <h4 className="text-sm font-semibold text-foreground mb-3">Form Elements</h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs text-default-600 block mb-1">Sample Input</label>
                                                    <div className="px-3 py-2 bg-default-100 rounded-lg border border-divider">
                                                        <span className="text-sm text-foreground">John Doe</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-default-600 block mb-1">Status</label>
                                                    <div className="px-3 py-2 bg-default-100 rounded-lg border border-divider flex items-center justify-between">
                                                        <span className="text-sm text-foreground">Active</span>
                                                        <div className="w-2 h-2 bg-success rounded-full"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                    
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Preferences Tab */}
                    {selectedTab === 'preferences' && (
                        <div className="space-y-6">
                            {/* Dark Mode Toggle */}
                            <Card>
                                <CardBody className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {isDark ? (
                                                <MoonIcon className="w-6 h-6 text-primary" />
                                            ) : (
                                                <SunIcon className="w-6 h-6 text-warning" />
                                            )}
                                            <div>
                                                <h4 className="font-semibold">Dark Mode</h4>
                                                <p className="text-xs text-default-500">
                                                    Toggle between light and dark themes
                                                </p>
                                            </div>
                                        </div>
                                        <Switch
                                            isSelected={isDark}
                                            onValueChange={toggleMode}
                                            size="lg"
                                        />
                                    </div>
                                </CardBody>
                            </Card>
                            
                            {/* Font Family */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Font Family</h3>
                                <Select
                                    label="Select Font"
                                    selectedKeys={[currentFont.split(',')[0]]}
                                    onSelectionChange={(keys) => {
                                        const selected = Array.from(keys)[0];
                                        const font = fontFamilies.find(f => f.name === selected);
                                        if (font) handleFontChange(font.value);
                                    }}
                                >
                                    {fontFamilies.map((font) => (
                                        <SelectItem key={font.name} value={font.name}>
                                            {font.name}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>
                            
                            {/* Background Color */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Background</h3>
                                <p className="text-sm text-default-500 mb-3">
                                    Choose a solid color or gradient for the page background
                                </p>
                                
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm font-medium mb-2">Solid Colors</p>
                                        <div className="grid grid-cols-5 gap-2">
                                            {backgroundPresets.map((preset) => (
                                                <button
                                                    key={preset.name}
                                                    onClick={() => handleBackgroundChange(preset.value)}
                                                    className={`h-12 rounded-lg border-2 transition-all ${
                                                        currentBg === preset.value
                                                            ? 'border-primary ring-2 ring-primary/30'
                                                            : 'border-divider hover:border-default-400'
                                                    }`}
                                                    style={{ background: preset.value }}
                                                    title={preset.name}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <p className="text-sm font-medium mb-2">Gradients</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {gradientPresets.map((preset) => (
                                                <button
                                                    key={preset.name}
                                                    onClick={() => preset.name === 'None' ? handleBackgroundChange(preset.value) : handleGradientChange(preset.value)}
                                                    className={`h-16 rounded-lg border-2 transition-all flex items-center justify-center text-xs font-medium ${
                                                        currentBg === preset.value
                                                            ? 'border-primary ring-2 ring-primary/30'
                                                            : 'border-divider hover:border-default-400'
                                                    }`}
                                                    style={{ background: preset.value }}
                                                >
                                                    <span className={`drop-shadow-md ${
                                                        preset.name === 'None' ? 'text-foreground' : 'text-white'
                                                    }`}>
                                                        {preset.name}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <Divider />
                            
                            {/* Reset Button */}
                            <Card className="border-2 border-warning/20 bg-warning/5">
                                <CardBody className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-semibold text-warning">Reset Theme</h4>
                                            <p className="text-xs text-default-500">
                                                Restore all settings to default values
                                            </p>
                                        </div>
                                        <Button
                                            color="warning"
                                            variant="flat"
                                            startContent={<ArrowPathIcon className="w-4 h-4" />}
                                            onPress={handleReset}
                                        >
                                            Reset
                                        </Button>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>
                    )}
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default ThemeSettingDrawer;
