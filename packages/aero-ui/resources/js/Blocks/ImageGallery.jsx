import React, { useState } from 'react';
import { Modal, ModalContent, ModalBody, Button } from '@heroui/react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const ImageGallery = ({ content = {}, settings = {} }) => {
  const {
    title = '',
    subtitle = '',
    images = [],
    columns = 3,
    enableLightbox = true,
  } = content;

  const {
    bgColor = '#ffffff',
    textColor = '#000000',
    padding = 'lg',
    textAlign = 'center',
  } = settings;

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

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

  const openLightbox = (index) => {
    if (enableLightbox) {
      setCurrentIndex(index);
      setLightboxOpen(true);
    }
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
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

        {/* Gallery Grid */}
        {images && images.length > 0 ? (
          <div className={`grid grid-cols-2 ${colMap[columns] || 'md:grid-cols-3'} gap-4`}>
            {images.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="relative group cursor-pointer overflow-hidden rounded-lg"
                onClick={() => openLightbox(index)}
              >
                <img
                  src={image.url}
                  alt={image.alt || `Gallery image ${index + 1}`}
                  className="w-full h-48 md:h-64 object-cover transition-transform duration-300 group-hover:scale-110"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                  {enableLightbox && (
                    <span className="opacity-0 group-hover:opacity-100 text-white font-medium transition-opacity">
                      View
                    </span>
                  )}
                </div>
                {/* Caption */}
                {image.caption && (
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                    <p className="text-white text-sm">{image.caption}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            No images added
          </div>
        )}

        {/* Lightbox Modal */}
        <Modal
          isOpen={lightboxOpen}
          onOpenChange={setLightboxOpen}
          size="full"
          hideCloseButton
          classNames={{
            base: 'bg-black/95',
            body: 'p-0',
          }}
        >
          <ModalContent>
            {(onClose) => (
              <ModalBody className="flex items-center justify-center relative">
                {/* Close Button */}
                <Button
                  isIconOnly
                  variant="light"
                  className="absolute top-4 right-4 text-white z-50"
                  onPress={onClose}
                >
                  <XMarkIcon className="w-6 h-6" />
                </Button>

                {/* Navigation */}
                {images.length > 1 && (
                  <>
                    <Button
                      isIconOnly
                      variant="light"
                      className="absolute left-4 text-white z-50"
                      onPress={prevImage}
                    >
                      <ChevronLeftIcon className="w-8 h-8" />
                    </Button>
                    <Button
                      isIconOnly
                      variant="light"
                      className="absolute right-4 text-white z-50"
                      onPress={nextImage}
                    >
                      <ChevronRightIcon className="w-8 h-8" />
                    </Button>
                  </>
                )}

                {/* Image */}
                <img
                  src={images[currentIndex]?.url}
                  alt={images[currentIndex]?.alt || ''}
                  className="max-w-full max-h-[90vh] object-contain"
                />

                {/* Caption */}
                {images[currentIndex]?.caption && (
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white text-center">
                    <p>{images[currentIndex].caption}</p>
                    <p className="text-sm text-white/60 mt-1">
                      {currentIndex + 1} / {images.length}
                    </p>
                  </div>
                )}
              </ModalBody>
            )}
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
};

export default ImageGallery;
