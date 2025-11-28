import React from 'react';
import { Card as HeroCard, CardBody, Button as HeroButton, Chip } from '@heroui/react';
import { 
  PaintBrushIcon,
  SparklesIcon,
  SwatchIcon,
  EyeDropperIcon
} from '@heroicons/react/24/outline';

const ThemeDemo = ({ currentTheme, darkMode }) => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="mb-6 text-center text-3xl font-bold flex items-center justify-center gap-2"
          style={{
            background: `linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}>
        <SparklesIcon className="w-8 h-8" style={{ color: 'var(--theme-primary)' }} />
        Theme System Demo
      </h1>

      {/* Theme Information */}
      <HeroCard className="mb-6 bg-white/5 backdrop-blur-md border border-white/10">
        <CardBody className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <SwatchIcon className="w-6 h-6" style={{ color: 'var(--theme-primary)' }} />
            <h2 className="text-xl font-semibold">
              Current Theme Settings
            </h2>
          </div>
          
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-foreground-600 text-sm mb-2">
                Theme Color
              </p>
              <Chip 
                className="font-semibold"
                style={{ 
                  backgroundColor: 'var(--theme-primary)',
                  color: 'white'
                }}
              >
                {currentTheme?.name || 'OCEAN'}
              </Chip>
            </div>
            
            <div>
              <p className="text-foreground-600 text-sm mb-2">
                Mode
              </p>
              <Chip 
                className="font-semibold"
                style={{ 
                  backgroundColor: darkMode ? '#1a1a1a' : '#f5f5f5',
                  color: darkMode ? 'white' : 'black'
                }}
              >
                {darkMode ? 'Dark Mode' : 'Light Mode'}
              </Chip>
            </div>
            
            <div>
              <p className="text-foreground-600 text-sm mb-2">
                Primary Color
              </p>
              <div className="flex items-center gap-2">
                <div 
                  className="w-5 h-5 rounded border-2 border-white/20"
                  style={{ backgroundColor: 'var(--theme-primary)' }}
                />
                <code className="text-sm font-mono">
                  {currentTheme?.primary || '#0ea5e9'}
                </code>
              </div>
            </div>
            
            <div>
              <p className="text-foreground-600 text-sm mb-2">
                Secondary Color
              </p>
              <div className="flex items-center gap-2">
                <div 
                  className="w-5 h-5 rounded border-2 border-white/20"
                  style={{ backgroundColor: 'var(--theme-secondary)' }}
                />
                <code className="text-sm font-mono">
                  {currentTheme?.secondary || '#0284c7'}
                </code>
              </div>
            </div>
          </div>
        </CardBody>
      </HeroCard>

      {/* Component Examples */}
      <h2 className="mb-4 text-2xl font-semibold flex items-center gap-2">
        <PaintBrushIcon className="w-6 h-6" style={{ color: 'var(--theme-primary)' }} />
        Component Examples
      </h2>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-2">
        {/* HeroUI Components */}
        <HeroCard className="theme-aware-card bg-white/5 backdrop-blur-md border border-white/10">
          <CardBody>
            <h3 className="mb-4 text-lg font-semibold" style={{ color: 'var(--theme-primary)' }}>
              HeroUI Components
            </h3>
            <div className="flex flex-col gap-3">
              <HeroButton 
                className="theme-aware-button"
                style={{
                  backgroundColor: 'var(--theme-primary)',
                  color: 'white'
                }}
              >
                Hero Primary Button
              </HeroButton>
              <HeroButton 
                variant="bordered"
                className="theme-aware-button"
                style={{
                  borderColor: 'var(--theme-primary)',
                  color: 'var(--theme-primary)'
                }}
              >
                Hero Bordered Button
              </HeroButton>
              <p className="text-foreground-600 text-sm">
                HeroUI components automatically respect the theme system with custom CSS properties.
              </p>
            </div>
          </CardBody>
        </HeroCard>

        {/* Color Palette */}
        <HeroCard className="bg-white/5 backdrop-blur-md border border-white/10">
          <CardBody>
            <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
              <EyeDropperIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
              Color Palette
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div 
                  className="w-full h-16 rounded-lg mb-2"
                  style={{ backgroundColor: 'var(--theme-primary)' }}
                />
                <span className="text-xs">Primary</span>
              </div>
              <div className="text-center">
                <div 
                  className="w-full h-16 rounded-lg mb-2"
                  style={{ backgroundColor: 'var(--theme-secondary)' }}
                />
                <span className="text-xs">Secondary</span>
              </div>
              <div className="text-center">
                <div 
                  className="w-full h-16 rounded-lg mb-2"
                  style={{ backgroundColor: 'rgba(var(--theme-primary-rgb), 0.3)' }}
                />
                <span className="text-xs">Primary 30%</span>
              </div>
              <div className="text-center">
                <div 
                  className="w-full h-16 rounded-lg mb-2"
                  style={{ background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))' }}
                />
                <span className="text-xs">Gradient</span>
              </div>
            </div>
          </CardBody>
        </HeroCard>

        {/* Typography Examples */}
        <HeroCard className="bg-white/5 backdrop-blur-md border border-white/10">
          <CardBody>
            <h3 className="mb-4 text-lg font-semibold" style={{ color: 'var(--theme-primary)' }}>
              Typography Styles
            </h3>
            <div className="flex flex-col gap-2">
              <h4 className="text-2xl" style={{ color: 'var(--theme-primary)' }}>
                Heading 4
              </h4>
              <h6 className="text-lg" style={{ color: 'var(--theme-secondary)' }}>
                Heading 6
              </h6>
              <p className="text-base">
                Body text adapts to the current font family selection and theme colors.
              </p>
              <span className="text-sm text-foreground-600">
                Caption text with theme-aware secondary color.
              </span>
            </div>
          </CardBody>
        </HeroCard>

        {/* Instructions */}
        <HeroCard className="bg-white/5 backdrop-blur-md border border-white/10">
          <CardBody>
            <h3 className="mb-4 text-lg font-semibold" style={{ color: 'var(--theme-primary)' }}>
              How to Use the Theme System
            </h3>
            <p className="mb-4 text-foreground-600 text-sm">
              The theme system provides a comprehensive, smooth, and professional theming experience:
            </p>
            <ul className="pl-4 space-y-2">
              <li className="text-sm">
                <strong>Theme Colors:</strong> Choose from 6 professionally curated color palettes
              </li>
              <li className="text-sm">
                <strong>Dark/Light Mode:</strong> Toggle between modes with smooth transitions
              </li>
              <li className="text-sm">
                <strong>Background Patterns:</strong> Select from 9 different background styles
              </li>
              <li className="text-sm">
                <strong>Typography:</strong> Choose from 4 different font families
              </li>
              <li className="text-sm">
                <strong>Auto-Save:</strong> All preferences are automatically saved and restored
              </li>
            </ul>
          </CardBody>
        </HeroCard>
      </div>
    </div>
  );
};

export default ThemeDemo;
