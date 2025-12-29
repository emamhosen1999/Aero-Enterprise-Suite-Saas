import React, { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  Tabs,
  Tab,
  Switch,
  Tooltip,
  Chip,
  useDisclosure
} from '@heroui/react';
import {
  PaintBrushIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  CheckIcon,
  SwatchIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '../../Context/ThemeContext';

const ThemePreview = ({ styleKey, config, isSelected, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      isPressable
      isHoverable
      className={`relative cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'ring-2 ring-primary shadow-lg scale-105' 
          : 'hover:scale-102 hover:shadow-md'
      }`}
      onPress={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardBody className="p-3">
        {/* Card Style Color Preview */}
        <div className="flex flex-col space-y-2">
          {/* Color Swatches */}
          <div className="flex space-x-1 mb-2">
            <div
              className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: config.preview.primary }}
            />
            <div
              className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: config.preview.secondary }}
            />
            <div
              className="w-4 h-4 rounded-full border border-gray-300 mt-1"
              style={{ backgroundColor: config.preview.background }}
            />
          </div>

          {/* Style Name and Description */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {config.name}
              </h3>
              <p className="text-xs text-foreground-500 line-clamp-2">
                {config.description}
              </p>
            </div>
            {isSelected && (
              <CheckIcon className="w-5 h-5 text-primary flex-shrink-0" />
            )}
          </div>

          {/* Category Chip */}
          <Chip
            size="sm"
            variant="flat"
            color="primary"
            className="self-start"
          >
            {config.category}
          </Chip>

          {/* Preview Elements */}
          {isHovered && (
            <div 
              className="absolute inset-0 bg-gradient-to-br opacity-20 rounded-lg transition-opacity duration-200"
              style={{
                background: `linear-gradient(135deg, ${config.preview.primary}20, ${config.preview.secondary}20)`
              }}
            />
          )}
        </div>
      </CardBody>
    </Card>
  );
};

const ThemeSelector = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    mode,
    cardStyle,
    cardStyleOptions,
    updateTheme,
    toggleMode,
    resetTheme
  } = useTheme();

  const [selectedCategory, setSelectedCategory] = useState('all');

  // Get unique categories from card style options
  const categories = [...new Set(cardStyleOptions.map(opt => opt.category))];

  const getFilteredStyles = () => {
    if (selectedCategory === 'all') {
      return cardStyleOptions;
    }
    return cardStyleOptions.filter(opt => opt.category === selectedCategory);
  };

  const handleStyleSelect = (styleKey) => {
    updateTheme({ cardStyle: styleKey });
  };

  return (
    <>
      {/* Theme Trigger Button */}
      <Tooltip content="Customize Theme" placement="bottom">
        <Button
          isIconOnly
          variant="ghost"
          size="sm"
          onPress={onOpen}
          className="text-foreground-500 hover:text-foreground"
        >
          <SwatchIcon className="w-5 h-5" />
        </Button>
      </Tooltip>

      {/* Theme Selector Modal */}
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="4xl"
        scrollBehavior="inside"
        backdrop="blur"
        classNames={{
          base: "bg-background/80 backdrop-blur-md",
          body: "p-6",
          header: "border-b border-divider",
          footer: "border-t border-divider"
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <PaintBrushIcon className="w-6 h-6 text-primary" />
                  <span className="text-xl font-bold">Theme Customization</span>
                </div>
                <p className="text-sm text-foreground-500 font-normal">
                  Choose your preferred theme and customize the appearance
                </p>
              </ModalHeader>

              <ModalBody>
                <div className="space-y-6">
                  {/* Dark Mode Toggle */}
                  <div className="flex items-center justify-between p-4 bg-content1 rounded-lg">
                    <div className="flex items-center gap-3">
                      {mode === 'dark' ? (
                        <MoonIcon className="w-5 h-5 text-foreground" />
                      ) : (
                        <SunIcon className="w-5 h-5 text-foreground" />
                      )}
                      <div>
                        <p className="font-semibold text-foreground">Dark Mode</p>
                        <p className="text-sm text-foreground-500">
                          Toggle between light and dark appearance
                        </p>
                      </div>
                    </div>
                    <Switch
                      isSelected={mode === 'dark'}
                      onValueChange={toggleMode}
                      color="primary"
                    />
                  </div>

                  {/* Card Style Categories */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-foreground">
                      Card Style Categories
                    </h3>
                    <Tabs
                      selectedKey={selectedCategory}
                      onSelectionChange={setSelectedCategory}
                      variant="underlined"
                      color="primary"
                      className="w-full"
                    >
                      <Tab key="all" title="All Styles" />
                      {categories.map((category) => (
                        <Tab key={category} title={category} />
                      ))}
                    </Tabs>
                  </div>

                  {/* Card Styles Grid */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-foreground">
                      Available Card Styles
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {getFilteredStyles().map((styleOption) => (
                        <ThemePreview
                          key={styleOption.key}
                          styleKey={styleOption.key}
                          config={styleOption}
                          isSelected={cardStyle === styleOption.key}
                          onClick={() => handleStyleSelect(styleOption.key)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Current Card Style Info */}
                  <div className="p-4 bg-content1 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">
                      Current Style: {cardStyleOptions.find(opt => opt.key === cardStyle)?.name || 'Modern'}
                    </h4>
                    <p className="text-sm text-foreground-500 mb-3">
                      {cardStyleOptions.find(opt => opt.key === cardStyle)?.description || 'Default card style'}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground-500">Colors:</span>
                      <div className="flex gap-1">
                        {cardStyleOptions.find(opt => opt.key === cardStyle)?.preview && (
                          <>
                            <div
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: cardStyleOptions.find(opt => opt.key === cardStyle).preview.primary }}
                            />
                            <div
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: cardStyleOptions.find(opt => opt.key === cardStyle).preview.secondary }}
                            />
                          </>
                        )}
                      </div>
                      <Chip size="sm" variant="flat" color="primary">
                        {cardStyleOptions.find(opt => opt.key === cardStyle)?.category || 'Design'}
                      </Chip>
                    </div>
                  </div>
                </div>
              </ModalBody>

              <ModalFooter>
                <Button
                  color="danger"
                  variant="light"
                  onPress={() => {
                    resetTheme();
                    onClose();
                  }}
                >
                  Reset
                </Button>
                <Button
                  color="primary"
                  onPress={onClose}
                >
                  Apply Style
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default ThemeSelector;
