import React from 'react';
import { Card, CardBody } from '@heroui/react';

const FeatureGrid = ({ content = {}, settings = {} }) => {
  const {
    title = 'Features',
    subtitle = 'Everything you need',
    items = [],
    columns = 3,
  } = content;

  const {
    bgColor = '#ffffff',
    textColor = '#000000',
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

  const colMap = {
    1: 'grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  };

  return (
    <div
      className={`w-full ${paddingMap[padding]}`}
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <div className="container mx-auto">
        {/* Header */}
        {title || subtitle ? (
          <div className={`mb-12 ${textAlign === 'center' ? 'text-center' : ''}`}>
            {title && (
              <h2 className="text-3xl md:text-4xl font-bold mb-3">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-xl">
                {subtitle}
              </p>
            )}
          </div>
        ) : null}

        {/* Features Grid */}
        <div className={`grid grid-cols-1 ${colMap[columns]} gap-6 md:gap-8`}>
          {items?.length > 0 ? (
            items.map((item, index) => (
              <Card
                key={index}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 hover:shadow-lg transition-all duration-300"
              >
                <CardBody className="gap-4 p-6">
                  {/* Icon */}
                  {item.icon && (
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
                      {item.icon}
                    </div>
                  )}

                  {/* Content */}
                  {item.title && (
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                  )}
                  {item.description && (
                    <p className="text-slate-600 dark:text-slate-400">
                      {item.description}
                    </p>
                  )}

                  {/* Link */}
                  {item.link_text && item.link_url && (
                    <a
                      href={item.link_url}
                      className="text-primary hover:text-primary/80 font-medium text-sm mt-2 inline-flex items-center gap-2"
                    >
                      {item.link_text}
                      <span>→</span>
                    </a>
                  )}
                </CardBody>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-slate-500">
              No features added
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeatureGrid;
