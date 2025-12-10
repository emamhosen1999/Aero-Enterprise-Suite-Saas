import React, {useState} from 'react';
import {Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader} from "@heroui/react";
import {ExclamationTriangleIcon} from '@heroicons/react/24/outline';
import {showToast} from "@/utils/toastUtils";
import axios from 'axios';

const DeleteTrainingForm = ({
    open,
    closeModal,
    currentTraining,
    setTrainings,
    setTotalRows,
    setLastPage,
    fetchTrainingStats
}) => {
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
        if (!currentTraining) return;
        
        setDeleting(true);

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('hr.training.destroy', currentTraining.id));

                if (response.status === 200) {
                    // Update the training list by removing the deleted training
                    if (setTrainings) {
                        setTrainings(prev => prev.filter(training => training.id !== currentTraining.id));
                    }
                    
                    // Update pagination metadata if available
                    if (response.data.trainings) {
                        if (setTotalRows) setTotalRows(response.data.trainings.total);
                        if (setLastPage) setLastPage(response.data.trainings.last_page);
                        if (setTrainings) setTrainings(response.data.trainings.data);
                    }
                    
                    // Refresh stats
                    if (fetchTrainingStats) fetchTrainingStats();

                    resolve('Training program deleted successfully');
                }
            } catch (error) {
                console.error('Error deleting training:', error);
                
                // Enhanced error handling
                if (error.response?.status === 404) {
                    const { trainingsData } = error.response.data || {};
                    if (setTrainings && trainingsData) setTrainings(trainingsData);
                    reject('Training not found or already deleted');
                } else if (error.response?.status === 403) {
                    reject('You do not have permission to delete this training');
                } else if (error.response?.status === 422) {
                    reject('Cannot delete training with current status or active enrollments');
                } else {
                    reject(error.response?.data?.error || 'Failed to delete training program');
                }
            } finally {
                setDeleting(false);
                closeModal();
            }
        });

        showToast.promise(
            promise,
            {
                pending: 'Deleting training program...',
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

    const onClose = () => {
        if (!deleting) {
            closeModal();
        }
    };

    return (
        <Modal 
            isOpen={open} 
            onClose={onClose}
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
                fontFamily: `var(--fontFamily, "Inter")`,
            }}
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1" style={{
                    borderColor: `var(--theme-divider, #E4E4E7)`,
                    fontFamily: `var(--fontFamily, "Inter")`,
                }}>
                    <div className="flex items-center gap-2">
                        <ExclamationTriangleIcon className="h-6 w-6 text-danger" />
                        <h2 className="text-lg font-semibold text-danger">Delete Training Program</h2>
                    </div>
                </ModalHeader>
                
                <ModalBody style={{
                    fontFamily: `var(--fontFamily, "Inter")`,
                }}>
                    <div className="space-y-4">
                        <p className="text-default-600">
                            Are you sure you want to delete this training program? This action cannot be undone.
                        </p>
                        
                        {currentTraining && (
                            <div className="bg-danger-50 dark:bg-danger-900/20 p-4 rounded-lg border border-danger-200 dark:border-danger-800">
                                <h3 className="font-medium text-danger-800 dark:text-danger-200 mb-2">
                                    Training to be deleted:
                                </h3>
                                <div className="space-y-1 text-sm text-danger-700 dark:text-danger-300">
                                    <p><strong>Title:</strong> {currentTraining.title}</p>
                                    <p><strong>Category:</strong> {currentTraining.category?.name || 'N/A'}</p>
                                    <p><strong>Trainer:</strong> {currentTraining.trainer ? `${currentTraining.trainer.first_name} ${currentTraining.trainer.last_name}` : 'N/A'}</p>
                                    <p><strong>Status:</strong> {currentTraining.status}</p>
                                    {currentTraining.enrollments?.length > 0 && (
                                        <p><strong>Enrolled Participants:</strong> {currentTraining.enrollments.length}</p>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        <div className="bg-warning-50 dark:bg-warning-900/20 p-4 rounded-lg border border-warning-200 dark:border-warning-800">
                            <p className="text-warning-800 dark:text-warning-200 text-sm">
                                <strong>Warning:</strong> Deleting this training will also remove all associated enrollments, 
                                assessments, and materials. This action is permanent and cannot be reversed.
                            </p>
                        </div>
                    </div>
                </ModalBody>
                
                <ModalFooter style={{
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
                    >
                        Cancel
                    </Button>
                    <Button
                        color="danger"
                        variant="solid"
                        onPress={handleDelete}
                        isLoading={deleting}
                        isDisabled={deleting}
                        radius={getThemeRadius()}
                        size="sm"
                    >
                        {deleting ? 'Deleting...' : 'Delete Training'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default DeleteTrainingForm;
