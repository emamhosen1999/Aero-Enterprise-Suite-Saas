import React, {useState} from 'react';
import {ExclamationTriangleIcon, TrashIcon} from '@heroicons/react/24/outline';
import {Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader} from '@heroui/react';
import axios from 'axios';
import {showToast} from '@/utils/toastUtils';

const DeleteDesignationForm = ({ open, onClose, onSuccess, designation }) => {
    const [loading, setLoading] = useState(false);

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

    // Handle designation deletion
    const handleDelete = async () => {
        if (!designation) {
            showToast.error('Invalid designation provided');
            return;
        }

        setLoading(true);

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(`/designations/${designation.id}`);
                
                if (response.status === 200) {
                    if (onSuccess) {
                        onSuccess(designation, 'delete');
                    }
                    resolve(response.data.message || 'Designation deleted successfully');
                }
            } catch (error) {
                console.error('Error deleting designation:', error);
                
                if (error.response?.status === 400 || error.response?.status === 422) {
                    reject(error.response?.data?.error || error.response?.data?.message || 'Cannot delete designation with assigned employees');
                } else if (error.response?.status === 404) {
                    reject('Designation not found or already deleted');
                } else if (error.response?.status === 403) {
                    reject('You do not have permission to delete this designation');
                } else {
                    reject('An error occurred while deleting the designation');
                }
            } finally {
                setLoading(false);
            }
        });

        showToast.promise(promise, {
            pending: {
                render() {
                    return 'Deleting designation...';
                },
                icon: false,
                style: {
                    backdropFilter: 'blur(16px) saturate(200%)',
                    background: 'var(--theme-content1)',
                    border: '1px solid var(--theme-divider)',
                    color: 'var(--theme-primary)',
                },
            },
            success: {
                render({ data }) {
                    onClose();
                    return data;
                },
                icon: '✅',
                style: {
                    backdropFilter: 'blur(16px) saturate(200%)',
                    background: 'var(--theme-content1)',
                    border: '1px solid var(--theme-divider)',
                    color: 'var(--theme-primary)',
                },
            },
            error: {
                render({ data }) {
                    return data;
                },
                icon: '❌',
                style: {
                    backdropFilter: 'blur(16px) saturate(200%)',
                    background: 'var(--theme-content1)',
                    border: '1px solid var(--theme-divider)',
                    color: 'var(--theme-primary)',
                },
            },
        });
    };

    if (!designation) return null;

    return (
        <Modal
            isOpen={open}
            onOpenChange={loading ? undefined : onClose}
            size="lg"
            radius={getThemeRadius()}
            classNames={{
                base: "bg-content1",
                backdrop: "bg-black/50 backdrop-blur-sm",
            }}
            style={{
                fontFamily: `var(--fontFamily, "Inter")`,
            }}
        >
            <ModalContent>
                <ModalHeader className="flex gap-3 items-center" style={{
                    fontFamily: `var(--fontFamily, "Inter")`,
                    borderBottom: '1px solid var(--theme-divider)'
                }}>
                    <div className="p-2 rounded-lg" style={{
                        background: 'color-mix(in srgb, var(--theme-danger) 20%, transparent)',
                        borderRadius: `var(--borderRadius, 8px)`,
                    }}>
                        <TrashIcon className="w-5 h-5" style={{ color: 'var(--theme-danger)' }} />
                    </div>
                    <span className="text-lg font-semibold" style={{
                        fontFamily: `var(--fontFamily, "Inter")`,
                    }}>Delete Designation</span>
                </ModalHeader>
                
                <ModalBody className="py-6" style={{
                    fontFamily: `var(--fontFamily, "Inter")`,
                }}>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-start gap-3 p-4 rounded-lg" style={{
                            background: 'color-mix(in srgb, var(--theme-warning) 10%, transparent)',
                            border: '1px solid color-mix(in srgb, var(--theme-warning) 30%, transparent)',
                            borderRadius: `var(--borderRadius, 8px)`,
                        }}>
                            <ExclamationTriangleIcon className="w-6 h-6 flex-shrink-0" style={{ color: 'var(--theme-warning)' }} />
                            <div>
                                <p className="text-sm font-medium mb-1" style={{
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}>Are you sure you want to delete this designation?</p>
                                <p className="text-sm font-semibold" style={{
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                    color: 'var(--theme-primary)'
                                }}>{designation.title}</p>
                            </div>
                        </div>
                        
                        {designation.employee_count > 0 && (
                            <div className="p-4 rounded-lg" style={{
                                background: 'color-mix(in srgb, var(--theme-danger) 10%, transparent)',
                                border: '1px solid color-mix(in srgb, var(--theme-danger) 30%, transparent)',
                                borderRadius: `var(--borderRadius, 8px)`,
                            }}>
                                <p className="text-sm" style={{
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                    color: 'var(--theme-danger)'
                                }}>
                                    This designation has <strong>{designation.employee_count}</strong> employees assigned to it. 
                                    You cannot delete a designation with active employees. Please reassign these employees to other designations first.
                                </p>
                            </div>
                        )}
                        
                        <p className="text-sm text-default-500" style={{
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}>
                            This action cannot be undone. All associated data will be permanently removed.
                        </p>
                    </div>
                </ModalBody>
            
                <ModalFooter style={{
                    borderTop: '1px solid var(--theme-divider)',
                    fontFamily: `var(--fontFamily, "Inter")`,
                }}>
                    <Button 
                        onPress={onClose} 
                        isDisabled={loading} 
                        variant="light"
                        radius={getThemeRadius()}
                        style={{
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onPress={handleDelete}
                        color="danger"
                        isDisabled={loading || designation.employee_count > 0}
                        isLoading={loading}
                        radius={getThemeRadius()}
                        startContent={!loading && <TrashIcon className="w-4 h-4" />}
                        style={{
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}
                    >
                        {loading ? 'Deleting...' : 'Delete Designation'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default DeleteDesignationForm;
