import { 
    Button, 
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter
} from "@heroui/react";
import React from "react";
import { showToast } from "@/utils/toastUtils";
import { ExclamationTriangleIcon, TrashIcon } from "@heroicons/react/24/outline";

const DeleteDailyWorkForm = ({ open, handleClose, handleDelete, isLoading = false }) => {
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

    return (
        <Modal
            isOpen={open}
            onClose={handleClose}
            size="md"
            radius={getThemeRadius()}
            classNames={{
                base: "backdrop-blur-md mx-2 my-2 sm:mx-4 sm:my-8",
                backdrop: "bg-black/50 backdrop-blur-sm",
                header: "border-b border-divider",
                body: "py-4",
                footer: "border-t border-divider",
                closeButton: "hover:bg-white/5 active:bg-white/10"
            }}
            style={{
                border: `var(--borderWidth, 2px) solid var(--theme-divider, #E4E4E7)`,
                borderRadius: `var(--borderRadius, 12px)`,
                fontFamily: `var(--fontFamily, "Inter")`,
            }}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1" style={{
                            borderColor: `var(--theme-divider, #E4E4E7)`,
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}>
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-danger/10">
                                    <ExclamationTriangleIcon className="w-5 h-5 text-danger" />
                                </div>
                                <div>
                                    <span className="text-lg font-semibold text-danger" style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}>
                                        Confirm Deletion
                                    </span>
                                    <p className="text-sm text-default-500">
                                        This action cannot be undone
                                    </p>
                                </div>
                            </div>
                        </ModalHeader>
                        
                        <ModalBody style={{
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}>
                            <div className="flex items-start gap-3">
                                <div className="p-3 rounded-full bg-danger/10 flex-shrink-0">
                                    <TrashIcon className="w-6 h-6 text-danger" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-default-700 leading-relaxed">
                                        Are you sure you want to delete this daily work entry? 
                                        This action will permanently remove the work record and cannot be undone.
                                    </p>
                                    <div className="mt-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
                                        <p className="text-sm text-warning-700 font-medium">
                                            ⚠️ Warning: All associated data will be permanently lost.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </ModalBody>
                        
                        <ModalFooter className="flex justify-end gap-2" style={{
                            borderColor: `var(--theme-divider, #E4E4E7)`,
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}>
                            <Button
                                color="default"
                                variant="bordered"
                                onPress={handleClose}
                                radius={getThemeRadius()}
                                size="sm"
                                isDisabled={isLoading}
                                style={{
                                    borderRadius: `var(--borderRadius, 8px)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                color="danger"
                                variant="solid"
                                onPress={handleDelete}
                                radius={getThemeRadius()}
                                size="sm"
                                isLoading={isLoading}
                                isDisabled={isLoading}
                                startContent={!isLoading && <TrashIcon className="w-4 h-4" />}
                                style={{
                                    borderRadius: `var(--borderRadius, 8px)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}
                            >
                                {isLoading ? 'Deleting...' : 'Delete Work'}
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default DeleteDailyWorkForm;
