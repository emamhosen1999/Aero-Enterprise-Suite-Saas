import React from 'react';
import { Button } from '@heroui/react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

const HeroStandard = ({ content = {}, settings = {} }) => {
  const {
    title = 'Welcome to Our Platform',
    subtitle = 'Build amazing things with our powerful tools',
    description = '',
    image = '',
    button_text = 'Get Started',
    button_url = '#',
    button_style = 'primary',
    layout = 'text-image',
  } = content;

  const {
    bgColor = '#ffffff',
    textColor = '#000000',
    padding = 'lg',
    textAlign = 'left',
  } = settings;

  const paddingMap = {
    none: 'p-0',
    sm: 'p-4 md:p-6',
    md: 'p-6 md:p-8 lg:p-12',
    lg: 'p-8 md:p-12 lg:p-16',
    xl: 'p-12 md:p-16 lg:p-20',
  };

  const alignMap = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <div
      className={`w-full ${paddingMap[padding]} transition-all duration-300`}
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <div className="container mx-auto">
        {layout === 'image-text' || layout === 'text-image' ? (
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center ${
            layout === 'image-text' ? 'md:grid-flow-dense' : ''
          }`}>
            {/* Text Content */}
            <div className={alignMap[textAlign]}>
              {title && (
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
                  {title}
                </h1>
              )}

              {subtitle && (
                <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-6">
                  {subtitle}
                </p>
              )}

              {description && (
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-xl">
                  {description}
                </p>
              )}

              {button_text && (
                <Button
                  color={button_style === 'secondary' ? 'default' : button_style}
                  variant={button_style === 'outline' ? 'bordered' : 'solid'}
                  size="lg"
                  endContent={<ArrowRightIcon className="w-5 h-5" />}
                  as="a"
                  href={button_url}
                >
                  {button_text}
                </Button>
              )}
            </div>

            {/* Image Content */}
            {image && (
              <div className={layout === 'image-text' ? 'md:col-start-1' : ''}>
                <img
                  src={image}
                  alt={title}
                  className="w-full h-auto rounded-xl shadow-lg object-cover"
                />
              </div>
            )}
          </div>
        ) : (
          // Full Width Layout
          <div className={`max-w-3xl mx-auto ${alignMap[textAlign]}`}>
            {title && (
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
                {title}
              </h1>
            )}

            {subtitle && (
              <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-6">
                {subtitle}
              </p>
            )}

            {description && (
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                {description}
              </p>
            )}

            {button_text && (
              <Button
                color={button_style === 'secondary' ? 'default' : button_style}
                variant={button_style === 'outline' ? 'bordered' : 'solid'}
                size="lg"
                endContent={<ArrowRightIcon className="w-5 h-5" />}
                as="a"
                href={button_url}
              >
                {button_text}
              </Button>
            )}

            {image && (
              <div className="mt-12">
                <img
                  src={image}
                  alt={title}
                  className="w-full h-auto rounded-xl shadow-lg object-cover"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroStandard;
