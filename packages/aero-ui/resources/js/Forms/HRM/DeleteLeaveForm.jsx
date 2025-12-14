import React, {useState} from "react";
import {Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader} from "@heroui/react";
import {ExclamationTriangleIcon, TrashIcon} from "@heroicons/react/24/outline";
import {showToast} from "@/utils/toastUtils";
import axios from 'axios';

const DeleteLeaveForm = ({ open, closeModal, leaveId, setLeavesData, setLeaves, setTotalRows, setLastPage, setError, deleteLeaveOptimized, fetchLeavesStats }) => {
    const [deleting, setDeleting] = useState(false);

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

    const handleDelete = async () => {
        if (!leaveId) {
            showToast.error('Invalid leave ID provided');
            return;
        }

        setDeleting(true);
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('leave-delete', { id: leaveId, route: route().current() }));

                if (response.status === 200) {
                    // Optimistic update approach
                    if (deleteLeaveOptimized) {
                        deleteLeaveOptimized(leaveId);
                        setTotalRows(prev => Math.max(0, prev - 1)); // Ensure total doesn't go negative
                        if (fetchLeavesStats) {
                            fetchLeavesStats();
                        }
                    } else {
                        // Fallback approach
                        if (setLeavesData) setLeavesData(response.data.leavesData);
                        if (setTotalRows) setTotalRows(response.data.leaves.total);
                        if (setLastPage) setLastPage(response.data.leaves.last_page);
                        if (setLeaves) setLeaves(response.data.leaves.data);
                        if (setError) setError(false);
                        if (fetchLeavesStats) fetchLeavesStats();
                    }

                    resolve('Leave application deleted successfully');
                }
            } catch (error) {
                console.error('Error deleting leave:', error);
                
                // Enhanced error handling
                if (error.response?.status === 404) {
                    const { leavesData } = error.response.data || {};
                    if (setLeavesData && leavesData) setLeavesData(leavesData);
                    if (setError) setError(error.response?.data?.message || 'Leave not found.');
                    reject('Leave not found or already deleted');
                } else if (error.response?.status === 403) {
                    reject('You do not have permission to delete this leave');
                } else if (error.response?.status === 422) {
                    reject('Cannot delete leave with current status');
                } else {
                    reject(error.response?.data?.error || 'Failed to delete leave application');
                }
            } finally {
                setDeleting(false);
                closeModal();
            }
        });

        showToast.promise(
            promise,
            {
                pending: 'Deleting leave application...',
                success: {
                    render({ data }) {
                        return data;
                    }
                },
                error: {
                    render({ data }) {
                        return data;
                    }
                }
            }
        );
    };
    return (
        <Modal 
            isOpen={open} 
            onClose={closeModal}
            size="md"
            radius={getThemeRadius()}
            classNames={{
                base: "backdrop-blur-md mx-2 my-2 sm:mx-4 sm:my-8",
                backdrop: "bg-black/50 backdrop-blur-sm",
                header: "border-b border-divider",
                body: "py-6",
                footer: "border-t border-divider",
                closeButton: "hover:bg-white/5 active:bg-white/10"
            }}
            style={{
                border: `var(--borderWidth, 2px) solid var(--theme-divider, #E4E4E7)`,
                borderRadius: `var(--borderRadius, 12px)`,
                fontFamily: `var(--fontFamily, "Inter")`,
            }}
            isDismissable={!deleting}
            hideCloseButton={deleting}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1" style={{
                            borderColor: `var(--theme-divider, #E4E4E7)`,
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}>
                            <div className="flex items-center gap-3">
                                <div 
                                    className="p-2 rounded-lg"
                                    style={{
                                        backgroundColor: 'color-mix(in srgb, #ef4444 15%, transparent)',
                                        color: '#ef4444'
                                    }}
                                >
                                    <ExclamationTriangleIcon className="w-6 h-6" />
                                </div>
                                <span className="text-lg font-semibold" style={{
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                    color: 'var(--theme-foreground)'
                                }}>
                                    Confirm Deletion
                                </span>
                            </div>
                        </ModalHeader>
                        
                        <ModalBody style={{
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}>
                            <div className="flex items-start gap-3">
                                <ExclamationTriangleIcon 
                                    className="w-5 h-5 mt-0.5 flex-shrink-0" 
                                    style={{ color: '#ef4444' }} 
                                />
                                <div className="space-y-2">
                                    <p className="text-sm font-medium" style={{ color: 'var(--theme-foreground)' }}>
                                        Are you sure you want to delete this leave application?
                                    </p>
                                    <p className="text-sm" style={{ color: 'var(--theme-foreground-600)' }}>
                                        This action cannot be undone. The leave application will be permanently removed from the system.
                                    </p>
                                </div>
                            </div>
                        </ModalBody>
                        
                        <ModalFooter className="flex justify-end gap-2 px-6 py-4" style={{
                            borderColor: `var(--theme-divider, #E4E4E7)`,
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}>
                            <Button
                                color="default"
                                variant="bordered"
                                onPress={onClose}
                                radius={getThemeRadius()}
                                size="sm"
                                isDisabled={deleting}
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
                                isLoading={deleting}
                                isDisabled={deleting}
                                startContent={!deleting && <TrashIcon className="w-4 h-4" />}
                                style={{
                                    borderRadius: `var(--borderRadius, 8px)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}
                            >
                                {deleting ? 'Deleting...' : 'Delete Leave'}
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}


export default DeleteLeaveForm;
