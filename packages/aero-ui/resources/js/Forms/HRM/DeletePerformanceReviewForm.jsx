import React, {useState} from 'react';
import {Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader} from '@heroui/react';
import {XMarkIcon} from '@heroicons/react/24/outline';
import {showToast} from '@/utils/toastUtils';
import axios from 'axios';

const DeletePerformanceReviewForm = ({ open, onClose, performanceReview, fetchData, currentPage, perPage, filterData }) => {
    const [loading, setLoading] = useState(false);
    
    const handleDelete = async () => {
        if (!performanceReview || !performanceReview.id) return;
        
        setLoading(true);
        
        try {
            await axios.delete(route('hr.performance.reviews.destroy', performanceReview.id));
            showToast.success('Performance review deleted successfully');
            fetchData({ page: currentPage, perPage, ...filterData });
            onClose();
        } catch (error) {
            console.error('Error deleting performance review:', error);
            showToast.error('Failed to delete performance review');
        } finally {
            setLoading(false);
        }
    };
    
    if (!performanceReview) return null;
    
    return (
        <Modal 
            isOpen={open} 
            onClose={onClose} 
            size="lg"
            classNames={{
                backdrop: "bg-black/50 backdrop-blur-sm",
                base: "border border-white/20 bg-white/90 backdrop-blur-md",
                header: "border-b border-white/20",
                footer: "border-t border-white/20",
            }}
        >
            <ModalContent>
                <ModalHeader className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Delete Performance Review</h3>
                    <Button 
                        isIconOnly 
                        variant="light" 
                        onPress={onClose}
                        aria-label="close"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </Button>
                </ModalHeader>
                
                <ModalBody>
                    <div className="flex items-center mb-4">
                        <XMarkIcon className="w-6 h-6 text-danger mr-2" />
                        <h4 className="text-base font-medium">Confirm Deletion</h4>
                    </div>
                    
                    <p className="text-sm mb-2">
                        Are you sure you want to delete the performance review for <strong>{performanceReview.employee?.name}</strong>?
                    </p>
                    <p className="text-sm text-danger">
                        This action cannot be undone.
                    </p>
                    
                    {performanceReview.has_feedback && (
                        <div className="mt-4 p-3 bg-danger-50 border border-danger-200 rounded-lg">
                            <p className="text-sm text-danger">
                                Warning: This performance review has employee feedback and comments. 
                                Deleting it will also remove all associated feedback, ratings, and comments.
                            </p>
                        </div>
                    )}
                </ModalBody>
                
                <ModalFooter className="flex justify-between">
                    <Button 
                        onPress={onClose} 
                        variant="light"
                    >
                        Cancel
                    </Button>
                    <Button 
                        onPress={handleDelete}
                        color="danger"
                        isLoading={loading}
                    >
                        Delete
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default DeletePerformanceReviewForm;
