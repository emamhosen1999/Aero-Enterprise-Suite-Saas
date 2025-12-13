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
  backdrop = "blur-sm",
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
            base: "bg-white/10 backdrop-blur-md border border-white/20",
            header: `bg-white/5 border-b border-white/10 ${headerClassName}`,
            body: `bg-transparent ${bodyClassName}`,
            footer: `bg-white/5 border-t border-white/10 ${footerClassName}`,
          }}
          className={className}
          motionProps={{
            variants: {
              enter: {
                y: 0,
                opacity: 1,
                transition: {
                  duration: 0.3,
                  ease: "easeOut",
                },
              },
              exit: {
                y: -20,
                opacity: 0,
                transition: {
                  duration: 0.2,
                  ease: "easeIn",
                },
              },
            },
          }}
          {...props}
        >
          <ModalContent>
            {(onCloseModal) => (
              <>
                <ModalHeader className="flex flex-col gap-1 px-6 py-4">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      {icon && (
                        <div className="p-2 bg-primary-500/20 rounded-lg">
                          {React.cloneElement(icon, { className: "w-5 h-5 text-primary-400" })}
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                        {subtitle && (
                          <p className="text-sm text-default-500 mt-1">{subtitle}</p>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      isIconOnly
                      variant="light"
                      onPress={onCloseModal}
                      className="text-default-500 hover:text-foreground"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </Button>
                  </div>
                </ModalHeader>

                <ModalBody className="px-6 py-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
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
                        className="bg-white/10 border-white/20 hover:bg-white/20"
                        isDisabled={isLoading}
                      >
                        {cancelLabel}
                      </Button>
                      
                      {onSave && (
                        <Button
                          color="primary"
                          onPress={onSave}
                          isLoading={isLoading}
                          className="bg-primary-500/90 hover:bg-primary-500"
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
