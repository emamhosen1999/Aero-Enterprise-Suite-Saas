import React, { useState } from 'react';
import { Card, CardBody, Avatar, Button } from '@heroui/react';
import { ChevronLeftIcon, ChevronRightIcon, StarIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';

const Testimonials = ({ content = {}, settings = {} }) => {
  const {
    title = 'What Our Customers Say',
    subtitle = '',
    testimonials = [],
    layout = 'carousel',
    showRating = true,
  } = content;

  const {
    bgColor = '#f8fafc',
    textColor = '#000000',
    padding = 'lg',
    textAlign = 'center',
  } = settings;

  const [currentIndex, setCurrentIndex] = useState(0);

  const paddingMap = {
    none: 'p-0',
    sm: 'p-4 md:p-6',
    md: 'p-6 md:p-8 lg:p-12',
    lg: 'p-8 md:p-12 lg:p-16',
    xl: 'p-12 md:p-16 lg:p-20',
  };

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <StarIcon
        key={i}
        className={`w-5 h-5 ${i < rating ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`}
      />
    ));
  };

  const TestimonialCard = ({ testimonial, index }) => (
    <Card className="bg-background border border-slate-200 dark:border-white/10 h-full">
      <CardBody className="gap-4 p-6">
        {/* Rating */}
        {showRating && testimonial.rating && (
          <div className="flex gap-0.5">{renderStars(testimonial.rating)}</div>
        )}

        {/* Quote */}
        <blockquote className="text-lg text-slate-700 dark:text-slate-300 italic grow">
          "{testimonial.quote}"
        </blockquote>

        {/* Author */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
          {testimonial.avatar ? (
            <Avatar src={testimonial.avatar} size="md" />
          ) : (
            <Avatar name={testimonial.name} size="md" />
          )}
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">
              {testimonial.name}
            </p>
            {testimonial.title && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {testimonial.title}
                {testimonial.company && ` at ${testimonial.company}`}
              </p>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );

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

        {testimonials && testimonials.length > 0 ? (
          layout === 'carousel' ? (
            /* Carousel Layout */
            <div className="relative max-w-3xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                >
                  <TestimonialCard testimonial={testimonials[currentIndex]} index={currentIndex} />
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              {testimonials.length > 1 && (
                <div className="flex justify-center gap-4 mt-6">
                  <Button
                    isIconOnly
                    variant="bordered"
                    onPress={prevTestimonial}
                    startContent={<ChevronLeftIcon className="w-5 h-5" />}
                  />
                  <div className="flex items-center gap-2">
                    {testimonials.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentIndex(i)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          i === currentIndex
                            ? 'bg-primary w-6'
                            : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                  <Button
                    isIconOnly
                    variant="bordered"
                    onPress={nextTestimonial}
                    startContent={<ChevronRightIcon className="w-5 h-5" />}
                  />
                </div>
              )}
            </div>
          ) : (
            /* Grid Layout */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <TestimonialCard testimonial={testimonial} index={index} />
                </motion.div>
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-12 text-slate-500">
            No testimonials added
          </div>
        )}
      </div>
    </div>
  );
};

export default Testimonials;
