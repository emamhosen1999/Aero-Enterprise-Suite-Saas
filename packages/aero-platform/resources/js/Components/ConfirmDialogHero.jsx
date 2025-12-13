import React from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button
} from '@heroui/react';
import { ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

/**
 * HeroUI Confirm Dialog Component
 * A consistent confirmation dialog for destructive or important actions
 */
const ConfirmDialogHero = ({
    open,
    onClose,
    onConfirm,
    title = "Confirm Action",
    message,
    description, // Alias for message
    confirmText = "Confirm",
    cancelText = "Cancel",
    confirmColor = "danger",
    type = "warning", // warning, danger, info, success
    isLoading = false,
    icon
}) => {
    const displayMessage = message || description;

    const getIcon = () => {
        if (icon) return icon;

        switch (type) {
            case 'danger':
            case 'warning':
                return <ExclamationTriangleIcon className="w-6 h-6" />;
            case 'success':
                return <CheckCircleIcon className="w-6 h-6" />;
            case 'info':
                return <InformationCircleIcon className="w-6 h-6" />;
            default:
                return <ExclamationTriangleIcon className="w-6 h-6" />;
        }
    };

    const getIconColor = () => {
        switch (type) {
            case 'danger':
                return 'text-danger';
            case 'warning':
                return 'text-warning';
            case 'success':
                return 'text-success';
            case 'info':
                return 'text-primary';
            default:
                return 'text-warning';
        }
    };

    const handleConfirm = () => {
        onConfirm();
        if (!isLoading) {
            onClose();
        }
    };

    return (
        <Modal
            isOpen={open}
            onClose={onClose}
            size="md"
            backdrop="blur"
            classNames={{
                backdrop: "bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20"
            }}
        >
            <ModalContent>
                {(onModalClose) => (
                    <>
                        <ModalHeader className="flex items-center gap-3">
                            <span className={getIconColor()}>
                                {getIcon()}
                            </span>
                            <span>{title}</span>
                        </ModalHeader>
                        <ModalBody>
                            <p className="text-default-700">
                                {displayMessage}
                            </p>
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                variant="light"
                                onPress={onModalClose}
                                isDisabled={isLoading}
                            >
                                {cancelText}
                            </Button>
                            <Button
                                color={confirmColor}
                                onPress={handleConfirm}
                                isLoading={isLoading}
                            >
                                {confirmText}
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default ConfirmDialogHero;
