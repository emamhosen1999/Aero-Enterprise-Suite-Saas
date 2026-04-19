import React from 'react';
import { Accordion as HeroAccordion, AccordionItem } from '@heroui/react';
import { motion } from 'framer-motion';

const Accordion = ({ content = {}, settings = {} }) => {
  const {
    title = 'Frequently Asked Questions',
    subtitle = '',
    items = [],
    selectionMode = 'single',
    defaultExpandedKeys = [],
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

  return (
    <div
      className={`w-full ${paddingMap[padding]}`}
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <div className="container mx-auto">
        {/* Header */}
        {(title || subtitle) && (
          <div className={`mb-12 ${textAlign === 'center' ? 'text-center' : ''}`}>
            {title && (
              <h2 className="text-3xl md:text-4xl font-bold mb-3">{title}</h2>
            )}
            {subtitle && (
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Accordion */}
        {items && items.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <HeroAccordion
              selectionMode={selectionMode}
              defaultExpandedKeys={defaultExpandedKeys}
              variant="bordered"
              className="bg-background"
            >
              {items.map((item, index) => (
                <AccordionItem
                  key={index.toString()}
                  aria-label={item.title}
                  title={
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {item.title}
                    </span>
                  }
                  classNames={{
                    content: 'text-slate-600 dark:text-slate-300 pb-4',
                    trigger: 'py-4 data-[hover=true]:bg-slate-50 dark:data-[hover=true]:bg-slate-900/50',
                  }}
                >
                  <div className="prose dark:prose-invert max-w-none">
                    {item.content}
                  </div>
                </AccordionItem>
              ))}
            </HeroAccordion>
          </motion.div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            No FAQ items added
          </div>
        )}
      </div>
    </div>
  );
};

export default Accordion;
