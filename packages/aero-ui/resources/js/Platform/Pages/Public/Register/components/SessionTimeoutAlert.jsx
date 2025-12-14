import React, { useEffect } from 'react';
import { 
    Modal, 
    ModalContent, 
    ModalHeader, 
    ModalBody, 
    ModalFooter,
    Button,
    useDisclosure 
} from '@heroui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useRegistrationSession } from '@/Hooks/useRegistrationSession';

/**
 * SessionTimeoutAlert
 * 
 * Component that monitors registration session and shows an alert
 * when the session expires, offering to restart the registration.
 */
export default function SessionTimeoutAlert() {
    const { isSessionValid, restartRegistration } = useRegistrationSession(true, 60000); // Check every minute
    const { isOpen, onOpen, onClose } = useDisclosure();

    useEffect(() => {
        if (!isSessionValid) {
            onOpen();
        }
    }, [isSessionValid, onOpen]);

    const handleRestart = () => {
        onClose();
        restartRegistration();
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onOpenChange={onClose}
            isDismissable={false}
            hideCloseButton
            classNames={{
                base: "bg-content1",
                header: "border-b border-divider",
                body: "py-6",
                footer: "border-t border-divider"
            }}
        >
            <ModalContent>
                <ModalHeader className="flex gap-2 items-center">
                    <ExclamationTriangleIcon className="w-5 h-5 text-warning" />
                    <span>Session Expired</span>
                </ModalHeader>
                <ModalBody>
                    <div className="space-y-3">
                        <p className="text-default-600">
                            Your registration session has expired due to inactivity.
                        </p>
                        <p className="text-sm text-default-500">
                            Don't worry! If you've already entered your details, we may be able to 
                            resume your registration. Click below to restart.
                        </p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button 
                        color="primary" 
                        onPress={handleRestart}
                        className="w-full"
                    >
                        Restart Registration
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
