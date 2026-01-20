import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input, Popover, PopoverTrigger, PopoverContent } from "@heroui/react";
import { SwatchIcon, XMarkIcon, EyeDropperIcon } from "@heroicons/react/24/outline";

// Predefined color palettes
const colorPalettes = {
    basic: [
        '#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#EFEFEF', '#F3F3F3', '#FFFFFF',
        '#980000', '#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#4A86E8', '#0000FF', '#9900FF', '#FF00FF',
    ],
    brand: [
        '#1877F2', // Facebook
        '#1DA1F2', // Twitter
        '#0A66C2', // LinkedIn
        '#E4405F', // Instagram
        '#FF0000', // YouTube
        '#25D366', // WhatsApp
        '#FF4500', // Reddit
        '#6441A5', // Twitch
        '#1ED760', // Spotify
        '#000000', // TikTok
    ],
    heroui: [
        '#006FEE', // Primary
        '#17C964', // Success
        '#F5A524', // Warning
        '#F31260', // Danger
        '#7828C8', // Secondary
        '#9353D3', // Purple
        '#F871A0', // Pink
        '#01BCD4', // Cyan
    ],
    pastel: [
        '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
        '#E8D3FF', '#FFD3E8', '#D3FFE8', '#D3E8FF', '#FFE8D3',
    ],
    dark: [
        '#1A1A2E', '#16213E', '#0F3460', '#1A1A1A', '#2D2D2D',
        '#3D3D3D', '#4D4D4D', '#1E1E2E', '#2A2A3A', '#3A3A4A',
    ],
};

const ColorPicker = ({
    value = '',
    onChange,
    label = "Color",
    placeholder = "Select a color",
    required = false,
    showAlpha = false,
    showInput = true,
    showPalettes = true,
    customPalette = null,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentColor, setCurrentColor] = useState(value || '#000000');
    const [activePalette, setActivePalette] = useState('basic');
    const inputRef = useRef(null);

    // Sync with external value
    useEffect(() => {
        if (value) {
            setCurrentColor(value);
        }
    }, [value]);

    // Handle color selection
    const handleColorSelect = useCallback((color) => {
        setCurrentColor(color);
        onChange(color);
    }, [onChange]);

    // Handle manual input
    const handleInputChange = useCallback((e) => {
        const color = e.target.value;
        setCurrentColor(color);
        // Validate hex color
        if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
            onChange(color);
        }
    }, [onChange]);

    // Handle native color picker
    const handleNativePickerChange = useCallback((e) => {
        const color = e.target.value;
        setCurrentColor(color);
        onChange(color);
    }, [onChange]);

    // Clear color
    const handleClear = useCallback((e) => {
        e.stopPropagation();
        setCurrentColor('');
        onChange('');
    }, [onChange]);

    // Use EyeDropper API if available
    const handleEyeDropper = useCallback(async () => {
        if ('EyeDropper' in window) {
            try {
                const eyeDropper = new window.EyeDropper();
                const result = await eyeDropper.open();
                handleColorSelect(result.sRGBHex);
            } catch (e) {
                // User cancelled
            }
        }
    }, [handleColorSelect]);

    const palettes = customPalette ? { custom: customPalette, ...colorPalettes } : colorPalettes;

    return (
        <div className="space-y-2">
            {label && (
                <label className="text-sm font-medium text-default-700">
                    {label}
                    {required && <span className="text-danger ml-1">*</span>}
                </label>
            )}

            <Popover
                isOpen={isOpen}
                onOpenChange={setIsOpen}
                placement="bottom-start"
                classNames={{
                    content: "p-0",
                }}
            >
                <PopoverTrigger>
                    <button
                        className="flex items-center gap-3 w-full p-2 border-2 border-default-200 rounded-lg hover:border-default-400 transition-colors text-left"
                    >
                        {currentColor ? (
                            <>
                                <div
                                    className="w-8 h-8 rounded-lg border border-default-300 shadow-sm"
                                    style={{ backgroundColor: currentColor }}
                                />
                                <div className="flex-1">
                                    <p className="text-sm font-medium font-mono">{currentColor}</p>
                                </div>
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    onPress={handleClear}
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </Button>
                            </>
                        ) : (
                            <div className="flex items-center gap-3 text-default-400">
                                <div className="w-8 h-8 rounded-lg border-2 border-dashed border-default-300 flex items-center justify-center">
                                    <SwatchIcon className="w-4 h-4" />
                                </div>
                                <span className="text-sm">{placeholder}</span>
                            </div>
                        )}
                    </button>
                </PopoverTrigger>

                <PopoverContent className="w-72 p-4">
                    <div className="space-y-4">
                        {/* Color Preview & Input */}
                        <div className="flex gap-3">
                            <div
                                className="w-16 h-16 rounded-xl border border-default-300 shadow-inner relative overflow-hidden"
                                style={{ backgroundColor: currentColor || '#FFFFFF' }}
                            >
                                {/* Checkerboard pattern for transparency */}
                                <div
                                    className="absolute inset-0 -z-10"
                                    style={{
                                        backgroundImage: `
                                            linear-gradient(45deg, #ccc 25%, transparent 25%),
                                            linear-gradient(-45deg, #ccc 25%, transparent 25%),
                                            linear-gradient(45deg, transparent 75%, #ccc 75%),
                                            linear-gradient(-45deg, transparent 75%, #ccc 75%)
                                        `,
                                        backgroundSize: '8px 8px',
                                        backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                                    }}
                                />
                            </div>
                            
                            {showInput && (
                                <div className="flex-1 space-y-2">
                                    <Input
                                        size="sm"
                                        placeholder="#000000"
                                        value={currentColor}
                                        onChange={handleInputChange}
                                        classNames={{
                                            input: "font-mono text-sm",
                                        }}
                                    />
                                    <div className="flex gap-2">
                                        {/* Native Color Picker */}
                                        <label className="flex-1">
                                            <input
                                                ref={inputRef}
                                                type="color"
                                                value={currentColor || '#000000'}
                                                onChange={handleNativePickerChange}
                                                className="sr-only"
                                            />
                                            <Button
                                                size="sm"
                                                variant="flat"
                                                fullWidth
                                                onPress={() => inputRef.current?.click()}
                                            >
                                                <SwatchIcon className="w-4 h-4 mr-1" />
                                                Pick
                                            </Button>
                                        </label>

                                        {/* Eye Dropper (if supported) */}
                                        {'EyeDropper' in window && (
                                            <Button
                                                size="sm"
                                                variant="flat"
                                                isIconOnly
                                                onPress={handleEyeDropper}
                                            >
                                                <EyeDropperIcon className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Color Palettes */}
                        {showPalettes && (
                            <div className="space-y-2">
                                {/* Palette Tabs */}
                                <div className="flex gap-1 flex-wrap">
                                    {Object.keys(palettes).map((palette) => (
                                        <button
                                            key={palette}
                                            className={`px-2 py-1 text-xs rounded-md transition-colors ${
                                                activePalette === palette
                                                    ? 'bg-primary text-white'
                                                    : 'bg-default-100 hover:bg-default-200'
                                            }`}
                                            onClick={() => setActivePalette(palette)}
                                        >
                                            {palette.charAt(0).toUpperCase() + palette.slice(1)}
                                        </button>
                                    ))}
                                </div>

                                {/* Color Grid */}
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activePalette}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="grid grid-cols-10 gap-1"
                                    >
                                        {palettes[activePalette]?.map((color, index) => (
                                            <button
                                                key={`${color}-${index}`}
                                                className={`w-6 h-6 rounded-md border transition-transform hover:scale-110 ${
                                                    currentColor?.toLowerCase() === color.toLowerCase()
                                                        ? 'ring-2 ring-primary ring-offset-1'
                                                        : 'border-default-300'
                                                }`}
                                                style={{ backgroundColor: color }}
                                                onClick={() => handleColorSelect(color)}
                                                title={color}
                                            />
                                        ))}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="flex gap-2 pt-2 border-t border-default-200">
                            <Button
                                size="sm"
                                variant="flat"
                                className="flex-1"
                                onPress={() => handleColorSelect('#FFFFFF')}
                            >
                                White
                            </Button>
                            <Button
                                size="sm"
                                variant="flat"
                                className="flex-1"
                                onPress={() => handleColorSelect('#000000')}
                            >
                                Black
                            </Button>
                            <Button
                                size="sm"
                                variant="flat"
                                className="flex-1"
                                onPress={() => handleColorSelect('transparent')}
                            >
                                None
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};

export default ColorPicker;
