import React from 'react';
import { Button } from '@heroui/react';

const CTASection = ({ content = {}, settings = {} }) => {
  const {
    title = 'Begin Your Implementation',
    description = 'Trusted by organisations across industries.',
    button_text = 'Get Started',
    button_url = '#',
    button_style = 'primary',
    secondary_button_text = 'Learn More',
    secondary_button_url = '#',
    image = '',
    layout = 'text',
  } = content;

  const {
    bgColor = '#000000',
    textColor = '#ffffff',
    padding = 'lg',
    textAlign = 'center',
  } = settings;

  const paddingMap = {
    none: 'p-0',
    sm: 'p-4 md:p-6',
    md: 'p-6 md:p-8 lg:p-12',
    lg: 'p-8 md:p-12 lg:p-16',
    xl: 'p-12 md:p-16 lg:p-20',
  };

  return (
    <div
      className={`w-full ${paddingMap[padding]} rounded-xl overflow-hidden`}
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <div className="container mx-auto">
        {layout === 'image' && image ? (
          // Image Background Layout
          <div
            className={`relative rounded-lg overflow-hidden ${paddingMap[padding]}`}
            style={{
              backgroundImage: `url(${image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-black/40" />
            <div className={`relative z-10 ${textAlign === 'center' ? 'text-center' : ''}`}>
              {title && <h2 className="text-4xl md:text-5xl font-bold mb-4">{title}</h2>}
              {description && (
                <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl">
                  {description}
                </p>
              )}
              <div className="flex gap-4 flex-wrap justify-center">
                {button_text && (
                  <Button
                    color={button_style === 'secondary' ? 'default' : button_style}
                    variant={button_style === 'outline' ? 'bordered' : 'solid'}
                    size="lg"
                    as="a"
                    href={button_url}
                  >
                    {button_text}
                  </Button>
                )}
                {secondary_button_text && (
                  <Button
                    variant="bordered"
                    size="lg"
                    as="a"
                    href={secondary_button_url}
                    className="border-white/50 text-white hover:bg-white/10"
                  >
                    {secondary_button_text}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Text Only Layout
          <div className={textAlign === 'center' ? 'text-center' : ''}>
            {title && <h2 className="text-4xl md:text-5xl font-bold mb-4">{title}</h2>}
            {description && (
              <p className={`text-lg md:text-xl mb-8 ${textAlign === 'center' ? 'max-w-2xl mx-auto' : 'max-w-2xl'}`}>
                {description}
              </p>
            )}
            <div className={`flex gap-4 flex-wrap ${textAlign === 'center' ? 'justify-center' : ''}`}>
              {button_text && (
                <Button
                  color={button_style === 'secondary' ? 'default' : button_style}
                  variant={button_style === 'outline' ? 'bordered' : 'solid'}
                  size="lg"
                  as="a"
                  href={button_url}
                >
                  {button_text}
                </Button>
              )}
              {secondary_button_text && (
                <Button
                  variant="bordered"
                  size="lg"
                  as="a"
                  href={secondary_button_url}
                  className={`border-white/50 text-white hover:bg-white/10`}
                >
                  {secondary_button_text}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CTASection;
