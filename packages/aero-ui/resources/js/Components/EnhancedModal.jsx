import React from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Divider
} from "@heroui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from 'framer-motion';

// Inlined 3D motion constants (formerly from motion3D.js)
const DEPTH = { modal: 24 };
const PERSPECTIVE = { moderate: '800px' };
const SPRINGS = {
  gentle: { type: 'spring', stiffness: 300, damping: 30 }
};

const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const motionSafeTransition = (transition = SPRINGS.gentle) => {
  if (prefersReducedMotion()) {
    return { duration: 0.01 };
  }
  return transition;
};

const modalVariants = {
  hidden: { rotateX: 5, translateZ: 0, translateY: 20, scale: 0.95, opacity: 0 },
  visible: { rotateX: 0, translateZ: DEPTH.modal, translateY: 0, scale: 1, opacity: 1 },
  exit: { rotateX: 5, translateZ: 0, translateY: 20, scale: 0.95, opacity: 0 },
};

const EnhancedModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  onSave,
  onCancel,
  isLoading = false,
  saveLabel = "Save Changes",
  cancelLabel = "Cancel",
  showFooter = true,
  size = "2xl",
  scrollBehavior = "inside",
  placement = "center",
  backdrop = "blur",
  className = "",
  headerClassName = "",
  bodyClassName = "",
  footerClassName = "",
  ...props
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <Modal
          isOpen={isOpen}
          onClose={onClose}
          size={size}
          scrollBehavior={scrollBehavior}
          placement={placement}
          backdrop={backdrop}
          classNames={{
            backdrop: "bg-black/50 backdrop-blur-sm",
            wrapper: "z-[999]",
            base: `bg-content1 border border-divider/30 ${className}`,
            header: `border-b border-divider ${headerClassName}`,
            body: `${bodyClassName}`,
            footer: `border-t border-divider ${footerClassName}`,
          }}
          motionProps={{
            variants: {
              enter: {
                ...modalVariants.visible,
                transition: motionSafeTransition(SPRINGS.gentle),
              },
              exit: {
                ...modalVariants.exit,
                transition: motionSafeTransition({
                  ...SPRINGS.gentle,
                  duration: 0.2,
                }),
              },
            },
          }}
          style={{
            perspective: PERSPECTIVE.moderate,
            transformStyle: 'preserve-3d',
          }}
          {...props}
        >
          <ModalContent
            style={{
              boxShadow: '0 20px 50px -12px rgba(0,0,0,0.25)',
            }}
          >
            {(onCloseModal) => (
              <>
                <ModalHeader className="flex flex-col gap-1 px-6 py-4">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      {icon && (
                        <motion.div 
                          className="p-2 rounded-lg"
                          style={{
                            background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                          }}
                          whileHover={{ 
                            scale: 1.1, 
                            rotate: 5,
                            translateZ: 4,
                          }}
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        >
                          {React.cloneElement(icon, { 
                            className: "w-5 h-5",
                            style: { color: 'var(--theme-primary)' }
                          })}
                        </motion.div>
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                        {subtitle && (
                          <p className="text-sm text-default-500 mt-1">{subtitle}</p>
                        )}
                      </div>
                    </div>
                    
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      <Button
                        isIconOnly
                        variant="light"
                        onPress={onCloseModal}
                        className="text-default-500 hover:text-foreground"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </Button>
                    </motion.div>
                  </div>
                </ModalHeader>

                <ModalBody className="px-6 py-4">
                  <motion.div
                    initial={{ opacity: 0, translateY: 10, translateZ: -10 }}
                    animate={{ opacity: 1, translateY: 0, translateZ: 0 }}
                    transition={motionSafeTransition({ ...SPRINGS.gentle, delay: 0.1 })}
                  >
                    {children}
                  </motion.div>
                </ModalBody>

                {showFooter && (
                  <ModalFooter className="px-6 py-4">
                    <div className="flex gap-3 w-full sm:w-auto sm:ml-auto">
                      <Button
                        variant="bordered"
                        onPress={onCancel || onCloseModal}
                        className="border-divider hover:bg-default-100"
                        isDisabled={isLoading}
                      >
                        {cancelLabel}
                      </Button>
                      
                      {onSave && (
                        <Button
                          color="primary"
                          onPress={onSave}
                          isLoading={isLoading}
                          className="shadow-lg"
                        >
                          {saveLabel}
                        </Button>
                      )}
                    </div>
                  </ModalFooter>
                )}
              </>
            )}
          </ModalContent>
        </Modal>
      )}
    </AnimatePresence>
  );
};

export default EnhancedModal;
