import React from 'react';

const TextBlock = ({ content = {}, settings = {} }) => {
  const {
    text = '',
    richText = false,
  } = content;

  const {
    bgColor = '#ffffff',
    textColor = '#000000',
    padding = 'md',
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
    justify: 'text-justify',
  };

  return (
    <div
      className={`w-full ${paddingMap[padding]}`}
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <div className="container mx-auto">
        <div className={`max-w-3xl ${alignMap[textAlign]}`}>
          {richText ? (
            <div
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: text }}
            />
          ) : (
            <div className="whitespace-pre-wrap leading-relaxed">
              {text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextBlock;
