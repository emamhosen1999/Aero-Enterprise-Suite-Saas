import React from 'react';
import { Card, CardBody } from '@heroui/react';
import { motion } from 'framer-motion';

const StatsSection = ({ content = {}, settings = {} }) => {
  const {
    title = '',
    subtitle = '',
    stats = [],
    layout = 'grid',
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

        {/* Stats Grid */}
        {stats && stats.length > 0 ? (
          <div className={`grid grid-cols-2 ${colMap[stats.length] || 'md:grid-cols-4'} gap-6 md:gap-8`}>
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 text-center">
                  <CardBody className="gap-2 p-6">
                    {/* Icon */}
                    {stat.icon && (
                      <div className="text-4xl mb-2">{stat.icon}</div>
                    )}

                    {/* Value */}
                    <div className="text-4xl md:text-5xl font-bold text-primary">
                      {stat.prefix}
                      <span>{stat.value}</span>
                      {stat.suffix}
                    </div>

                    {/* Label */}
                    {stat.label && (
                      <p className="text-slate-600 dark:text-slate-400 font-medium">
                        {stat.label}
                      </p>
                    )}

                    {/* Description */}
                    {stat.description && (
                      <p className="text-sm text-slate-500 dark:text-slate-500">
                        {stat.description}
                      </p>
                    )}
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            No stats added
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsSection;
