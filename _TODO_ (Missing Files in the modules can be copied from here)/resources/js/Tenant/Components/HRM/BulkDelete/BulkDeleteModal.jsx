import React, { useState, useCallback } from 'react';
import {
    Button,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Divider,
    Chip,
    Card,
    CardBody
} from "@heroui/react";
import { 
    TrashIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

import { showToast } from '@/utils/toastUtils';
import axios from 'axios';

const BulkDeleteModal = ({ 
    open, 
    onClose, 
    onSuccess,
    selectedLeaves = [],
    allUsers = []
}) => {
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
    // State
    const [isDeleting, setIsDeleting] = useState(false);
    const [errors, setErrors] = useState({});

    // Get user name helper
    const getUserName = useCallback((userId) => {
        const user = allUsers.find(u => u.id === userId);
        return user?.name || `User ID: ${userId}`;
    }, [allUsers]);

    // Check if any leaves are approved (cannot be deleted)
    const approvedLeaves = selectedLeaves.filter(leave => 
        leave.status && leave.status.toLowerCase() === 'approved'
    );
    const canDelete = approvedLeaves.length === 0;

    // Submit bulk deletion
    const handleDelete = useCallback(async () => {
        if (!canDelete) {
            const toastPromise = Promise.reject('Cannot delete approved leaves');
            showToast.promise(toastPromise, {
                error: 'Cannot delete approved leave requests'
            });
            return;
        }

        if (selectedLeaves.length === 0) {
            const toastPromise = Promise.reject('No leaves selected');
            showToast.promise(toastPromise, {
                error: 'No leave requests selected for deletion'
            });
            return;
        }

        setIsDeleting(true);

        // Follow exact same promise pattern as other forms
        const promise = new Promise(async (resolve, reject) => {
            try {
                const leaveIds = selectedLeaves.map(leave => leave.id);
                
                const response = await axios.delete(route('leaves.bulk.delete'), {
                    data: {
                        leave_ids: leaveIds
                    }
                });

               

                if (response.status === 200 && response.data.success) {
                    // Pass the response data to parent component for optimized updates
                    onSuccess?.(response.data);
                    onClose();
                    resolve([response.data.message || 'Leave requests deleted successfully']);
                } else {
                    console.error('Unexpected response status:', response.status);
                    reject(`Unexpected response status: ${response.status}`);
                }
            } catch (error) {
                console.error('Full error object:', error);

                if (error.response) {
                    console.error('Error response status:', error.response.status);
                    console.error('Error response data:', error.response.data);
                    
                    if (error.response.status === 422) {
                        // Handle validation errors
                        setErrors(error.response.data.errors || {});
                        reject(error.response.data.error || 'Failed to delete leave requests');
                    } else if (error.response.status === 403) {
                        // Handle authorization errors
                        reject(error.response.data.error || 'You are not authorized to delete these leave requests');
                    } else if (error.response.status === 404) {
                        // Handle not found errors
                        reject(error.response.data.error || 'Some leave requests were not found');
                    } else {
                        // Handle other HTTP errors
                        reject(`HTTP Error ${error.response.status}: ${error.response.data.message || 'An unexpected error occurred. Please try again later.'}`);
                    }
                } else if (error.request) {
                    console.error('No response received:', error.request);
                    reject('No response received from the server. Please check your internet connection.');
                } else {
                    console.error('Request setup error:', error.message);
                    reject('An error occurred while setting up the request.');
                }
            } finally {
                setIsDeleting(false);
            }
        });

        // Use exact same toast promise structure as other forms
        showToast.promise(
            promise,
            {
                pending: 'Deleting leave requests...',
                success: {
                    render({ data }) {
                        return data.join(', ');
                    }
                },
                error: {
                    render({ data }) {
                        return data;
                    }
                }
            }
        );
    }, [selectedLeaves, canDelete, onSuccess, onClose]);

    return (
        <Modal 
            isOpen={open} 
            onClose={onClose}
            size="2xl"
            radius={getThemeRadius()}
            scrollBehavior="inside"
            classNames={{
                base: "backdrop-blur-md mx-2 my-2 sm:mx-4 sm:my-8 max-h-[95vh]",
                backdrop: "bg-black/50 backdrop-blur-sm",
                header: "border-b border-divider",
                body: "overflow-y-auto",
                footer: "border-t border-divider",
                closeButton: "hover:bg-white/5 active:bg-white/10"
            }}
            style={{
                border: `var(--borderWidth, 2px) solid var(--theme-divider, #E4E4E7)`,
                borderRadius: `var(--borderRadius, 12px)`,
                fontFamily: `var(--fontFamily, "Inter")`,
                transform: `scale(var(--scale, 1))`,
            }}
        >
            <ModalContent>
                {(onModalClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1" style={{
                            borderColor: `var(--theme-divider, #E4E4E7)`,
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}>
                            <div className="flex items-center gap-2">
                                <TrashIcon className="w-6 h-6" style={{ color: 'var(--theme-danger, #f31260)' }} />
                                <div>
                                    <span className="text-lg font-semibold" style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                        color: 'var(--theme-foreground)'
                                    }}>
                                        Delete Leave Requests
                                    </span>
                                    <p className="text-sm mt-0.5" style={{ color: 'var(--theme-foreground-600)' }}>
                                        Confirm deletion of {selectedLeaves.length} leave request{selectedLeaves.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                        </ModalHeader>
                        
                        <ModalBody className="py-4 px-4 sm:py-6 sm:px-6" style={{
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}>
                            <div className="space-y-6">
                                {/* Warning for approved leaves */}
                                {!canDelete && (
                                    <Card 
                                        className="border"
                                        style={{
                                            backgroundColor: 'color-mix(in srgb, var(--theme-danger) 10%, transparent)',
                                            borderColor: 'color-mix(in srgb, var(--theme-danger) 30%, transparent)',
                                            borderRadius: `var(--borderRadius, 12px)`,
                                        }}
                                    >
                                        <CardBody className="p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <ExclamationTriangleIcon className="w-5 h-5" style={{ color: 'var(--theme-danger)' }} />
                                                <h4 className="font-semibold" style={{ color: 'var(--theme-danger)' }}>
                                                    Cannot Delete Approved Leaves
                                                </h4>
                                            </div>
                                            <p className="text-sm" style={{ color: 'var(--theme-danger)' }}>
                                                {approvedLeaves.length} of the selected leave requests are already approved and cannot be deleted. 
                                                Only pending or rejected leaves can be deleted.
                                            </p>
                                        </CardBody>
                                    </Card>
                                )}

                                {/* Selected leaves list */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <CheckCircleIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                                        <h3 className="text-base font-semibold" style={{ color: 'var(--theme-foreground)' }}>
                                            Selected Leave Requests ({selectedLeaves.length})
                                        </h3>
                                    </div>

                                    <Card 
                                        className="border max-h-80 overflow-y-auto"
                                        style={{
                                            backgroundColor: 'var(--theme-content1)',
                                            borderColor: 'var(--theme-divider)',
                                            borderRadius: `var(--borderRadius, 12px)`,
                                        }}
                                    >
                                        <CardBody className="p-0">
                                            {selectedLeaves.map((leave, index) => {
                                                const isApproved = leave.status && leave.status.toLowerCase() === 'approved';
                                                
                                                return (
                                                    <div key={leave.id}>
                                                        <div 
                                                            className={`p-4 ${isApproved ? 'opacity-60' : ''}`}
                                                            style={{
                                                                backgroundColor: isApproved ? 'color-mix(in srgb, var(--theme-danger) 5%, transparent)' : 'transparent'
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-2 flex-wrap mb-2">
                                                                <span className="font-medium text-sm" style={{ color: 'var(--theme-foreground)' }}>
                                                                    {getUserName(leave.user_id)}
                                                                </span>
                                                                <Chip 
                                                                    size="sm" 
                                                                    variant="bordered"
                                                                    color={
                                                                        leave.status?.toLowerCase() === 'approved' ? 'success' :
                                                                        leave.status?.toLowerCase() === 'pending' ? 'warning' :
                                                                        leave.status?.toLowerCase() === 'rejected' ? 'danger' : 'default'
                                                                    }
                                                                    radius={getThemeRadius()}
                                                                    style={{
                                                                        borderRadius: `var(--borderRadius, 8px)`,
                                                                    }}
                                                                >
                                                                    {leave.status || 'Unknown'}
                                                                </Chip>
                                                                {isApproved && (
                                                                    <Chip 
                                                                        size="sm" 
                                                                        variant="bordered" 
                                                                        color="danger"
                                                                        radius={getThemeRadius()}
                                                                        style={{
                                                                            borderRadius: `var(--borderRadius, 8px)`,
                                                                        }}
                                                                    >
                                                                        Cannot Delete
                                                                    </Chip>
                                                                )}
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-sm" style={{ color: 'var(--theme-foreground-600)' }}>
                                                                    {leave.leave_type} - {leave.from_date} to {leave.to_date}
                                                                </p>
                                                                <p className="text-sm" style={{ color: 'var(--theme-foreground-600)' }}>
                                                                    {leave.no_of_days} day{leave.no_of_days !== 1 ? 's' : ''} - {leave.reason}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {index < selectedLeaves.length - 1 && <Divider style={{ background: `var(--theme-divider)` }} />}
                                                    </div>
                                                );
                                            })}
                                        </CardBody>
                                    </Card>
                                </div>

                                {/* Warning message */}
                                {canDelete && (
                                    <Card 
                                        className="border"
                                        style={{
                                            backgroundColor: 'color-mix(in srgb, var(--theme-warning) 10%, transparent)',
                                            borderColor: 'color-mix(in srgb, var(--theme-warning) 30%, transparent)',
                                            borderRadius: `var(--borderRadius, 12px)`,
                                        }}
                                    >
                                        <CardBody className="p-4">
                                            <p className="text-sm font-medium" style={{ color: 'var(--theme-warning)' }}>
                                                ⚠️ This action cannot be undone. The selected leave requests will be permanently deleted.
                                            </p>
                                        </CardBody>
                                    </Card>
                                )}
                            </div>
                        </ModalBody>
                        
                        <ModalFooter className="flex flex-col sm:flex-row justify-center gap-2 px-4 sm:px-6 py-3 sm:py-4" style={{
                            borderColor: `var(--theme-divider, #E4E4E7)`,
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}>
                            <Button
                                color="default"
                                variant="bordered"
                                onPress={onModalClose}
                                radius={getThemeRadius()}
                                size="sm"
                                isDisabled={isDeleting}
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
                                isLoading={isDeleting}
                                isDisabled={!canDelete || isDeleting || selectedLeaves.length === 0}
                                startContent={!isDeleting && <TrashIcon className="w-4 h-4" />}
                                radius={getThemeRadius()}
                                size="sm"
                                style={{
                                    borderRadius: `var(--borderRadius, 8px)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}
                            >
                                {isDeleting ? 'Deleting...' : `Delete ${selectedLeaves.length} Request${selectedLeaves.length !== 1 ? 's' : ''}`}
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default BulkDeleteModal;
