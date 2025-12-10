import React from 'react';
import {Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader,} from "@heroui/react";
import {ExclamationTriangleIcon} from "@heroicons/react/24/outline";

const DeleteWorkLocationForm = ({ open, handleClose, handleDelete }) => {
    // Helper function to convert theme borderRadius to HeroUI radius values
    const getThemeRadius = () => {
        if (typeof window === 'undefined') return 'lg';
        
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 16) return 'lg';
        return 'full';
    };

    const handleConfirmDelete = () => {
        handleDelete();
        handleClose();
    };

    return (
        <Modal 
            isOpen={open} 
            onClose={handleClose}
            size="md"
            placement="center"
            classNames={{
                base: "bg-content1",
                backdrop: "bg-black/50 backdrop-blur-sm",
                header: "border-b border-divider",
                footer: "border-t border-divider",
                closeButton: "hover:bg-default-100 text-default-500 hover:text-default-700"
            }}
            style={{
                fontFamily: `var(--fontFamily, "Inter")`,
            }}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-danger/10">
                                    <ExclamationTriangleIcon className="w-5 h-5 text-danger" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">
                                        Delete Work Location
                                    </h2>
                                    <p className="text-sm text-default-500">
                                        This action cannot be undone
                                    </p>
                                </div>
                            </div>
                        </ModalHeader>
                        
                        <ModalBody className="py-6">
                            <div className="space-y-4">
                                <div className="p-4 rounded-lg bg-danger/5 border border-danger/20">
                                    <p className="text-sm text-foreground mb-2">
                                        Are you sure you want to delete this work location?
                                    </p>
                                    <p className="text-xs text-default-500">
                                        This will permanently remove the work location from the system. 
                                        Any associated daily works or reports may be affected.
                                    </p>
                                </div>
                                
                                <div className="text-xs text-default-400">
                                    <strong>Note:</strong> Make sure to reassign any ongoing work or 
                                    responsibilities before deleting this location.
                                </div>
                            </div>
                        </ModalBody>
                        
                        <ModalFooter>
                            <Button
                                color="default"
                                variant="light"
                                onPress={handleClose}
                                radius={getThemeRadius()}
                                style={{
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                color="danger"
                                onPress={handleConfirmDelete}
                                radius={getThemeRadius()}
                                style={{
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}
                            >
                                Delete Location
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default DeleteWorkLocationForm;
