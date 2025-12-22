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
 * Simplified Theme Settings Drawer
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
const SimplifiedThemeSettingDrawer = ({ isOpen, onClose }) => {
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
            layout: {
                ...themeSettings.layout,
                fontFamily: fontValue
            }
        });
    };
    
    const handleBackgroundChange = (bgValue) => {
        updateTheme({
            background: {
                type: 'color',
                color: bgValue
            }
        });
    };
    
    const handleReset = () => {
        if (confirm('Reset theme to default settings?')) {
            resetTheme();
        }
    };
    
    const currentCardStyle = themeSettings?.cardStyle || 'modern';
    const currentFont = themeSettings?.layout?.fontFamily || 'Inter';
    const currentBg = themeSettings?.background?.color || '#ffffff';
    const isDark = themeSettings?.mode === 'dark';
    
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
                                    {cardStyleOptions.map((style) => (
                                        <Card
                                            key={style.key}
                                            isPressable
                                            isHoverable
                                            onPress={() => handleCardStyleChange(style.key)}
                                            className={`cursor-pointer transition-all ${
                                                currentCardStyle === style.key
                                                    ? 'ring-2 ring-primary shadow-lg'
                                                    : 'hover:shadow-md'
                                            }`}
                                        >
                                            <CardBody className="p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-semibold">{style.name}</h4>
                                                    {currentCardStyle === style.key && (
                                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-default-500 line-clamp-2">
                                                    {style.description}
                                                </p>
                                            </CardBody>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                            
                            <Divider />
                            
                            {/* Preview Card */}
                            <div>
                                <h3 className="text-sm font-medium mb-2">Preview</h3>
                                <Card className="bg-content1">
                                    <CardBody className="p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                                <SwatchIcon className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-semibold">Sample Card</p>
                                                <p className="text-xs text-default-500">Theme preview</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-default-600">
                                            This is how your cards will look with the selected style.
                                        </p>
                                        <div className="flex gap-2 mt-3">
                                            <Button size="sm" color="primary">Primary</Button>
                                            <Button size="sm" color="secondary">Secondary</Button>
                                            <Button size="sm" color="success">Success</Button>
                                        </div>
                                    </CardBody>
                                </Card>
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
                                                    onClick={() => handleBackgroundChange(preset.value)}
                                                    className={`h-16 rounded-lg border-2 transition-all flex items-center justify-center text-xs font-medium ${
                                                        currentBg === preset.value
                                                            ? 'border-primary ring-2 ring-primary/30'
                                                            : 'border-divider hover:border-default-400'
                                                    }`}
                                                    style={{ background: preset.value }}
                                                >
                                                    <span className="text-white drop-shadow-md">
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

export default SimplifiedThemeSettingDrawer;
