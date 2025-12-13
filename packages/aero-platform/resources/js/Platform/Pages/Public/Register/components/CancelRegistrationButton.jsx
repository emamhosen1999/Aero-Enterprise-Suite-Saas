import React from 'react';
import { router } from '@inertiajs/react';
import { 
    Button, 
    Modal, 
    ModalContent, 
    ModalHeader, 
    ModalBody, 
    ModalFooter,
    useDisclosure 
} from '@heroui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils';

/**
 * CancelRegistrationButton
 * 
 * Provides a button with confirmation modal to cancel an in-progress registration.
 * Cleans up the pending tenant record and clears the session.
 */
export default function CancelRegistrationButton({ 
    variant = 'light',
    size = 'sm',
    className = ''
}) {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [isCanceling, setIsCanceling] = React.useState(false);

    const handleCancel = async () => {
        setIsCanceling(true);
        
        try {
            await axios.delete(route('platform.register.cancel'));
            
            showToast.success('Registration cancelled. You can start over anytime.');
            
            onClose();
            
            // Redirect to landing page after a brief delay
            setTimeout(() => {
                router.visit(route('landing'));
            }, 1000);
        } catch (error) {
            console.error('Failed to cancel registration:', error);
            showToast.error('Failed to cancel registration. Please try again.');
        } finally {
            setIsCanceling(false);
        }
    };

    return (
        <>
            <Button 
                variant={variant} 
                size={size}
                onPress={onOpen}
                className={className}
            >
                Cancel Registration
            </Button>

            {/* Confirmation Modal */}
            <Modal 
                isOpen={isOpen} 
                onOpenChange={onClose}
                classNames={{
                    base: "bg-content1",
                    header: "border-b border-divider",
                    body: "py-6",
                    footer: "border-t border-divider"
                }}
            >
                <ModalContent>
                    <ModalHeader className="flex gap-2 items-center">
                        <ExclamationTriangleIcon className="w-5 h-5 text-danger" />
                        <span>Cancel Registration?</span>
                    </ModalHeader>
                    <ModalBody>
                        <div className="space-y-3">
                            <p className="text-default-600">
                                Are you sure you want to cancel your registration? This will:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-sm text-default-500 ml-2">
                                <li>Delete your pending workspace</li>
                                <li>Clear all registration progress</li>
                                <li>Free up your chosen subdomain</li>
                            </ul>
                            <p className="text-sm text-default-500">
                                You can start a new registration at any time.
                            </p>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button 
                            variant="flat" 
                            onPress={onClose}
                            isDisabled={isCanceling}
                        >
                            Keep Registration
                        </Button>
                        <Button 
                            color="danger" 
                            onPress={handleCancel}
                            isLoading={isCanceling}
                        >
                            {isCanceling ? 'Canceling...' : 'Yes, Cancel'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}
