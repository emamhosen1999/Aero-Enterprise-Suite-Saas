import React, { useState } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Select,
    SelectItem,
    Textarea,
    Input,
    Card,
    CardBody,
    Chip,
    Divider
} from "@heroui/react";
import {
    CheckCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    XCircleIcon,
    EyeIcon
} from "@heroicons/react/24/outline";
import { CalendarIcon, User, Clock } from 'lucide-react';
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';

const StatusUpdateModal = ({ 
    open, 
    closeModal, 
    dailyWork,
    onStatusUpdated
}) => {
    const [formData, setFormData] = useState({
        status: dailyWork?.status || 'new',
        completion_time: dailyWork?.completion_time ? 
            new Date(dailyWork.completion_time).toISOString().slice(0, 16) : '',
        inspection_details: dailyWork?.inspection_details || ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const statusOptions = [
        { 
            key: 'new', 
            label: 'New', 
            color: 'default',
            icon: <ClockIcon className="w-4 h-4" />,
            description: 'Work has been created and is waiting to be started'
        },
        { 
            key: 'in_progress', 
            label: 'In Progress', 
            color: 'primary',
            icon: <ClockIcon className="w-4 h-4" />,
            description: 'Work is currently being executed'
        },
        { 
            key: 'review', 
            label: 'Under Review', 
            color: 'warning',
            icon: <EyeIcon className="w-4 h-4" />,
            description: 'Work is completed and under quality review'
        },
        { 
            key: 'completed', 
            label: 'Completed', 
            color: 'success',
            icon: <CheckCircleIcon className="w-4 h-4" />,
            description: 'Work has been completed successfully'
        },
        { 
            key: 'rejected', 
            label: 'Rejected', 
            color: 'danger',
            icon: <XCircleIcon className="w-4 h-4" />,
            description: 'Work needs to be redone due to quality issues'
        }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await axios.post(route('dailyWorks.updateStatus'), {
                id: dailyWork.id,
                ...formData
            });

            showToast.success('Status updated successfully');
            onStatusUpdated(response.data.dailyWork);
            closeModal();
        } catch (error) {
            showToast.error(error.response?.data?.error || 'Failed to update status');
        } finally {
            setIsLoading(false);
        }
    };

    const getCurrentStatusInfo = () => {
        return statusOptions.find(option => option.key === formData.status);
    };

    const handleStatusChange = (status) => {
        setFormData(prev => ({
            ...prev,
            status,
            // Auto-set completion time when marking as completed
            completion_time: status === 'completed' && !prev.completion_time 
                ? new Date().toISOString().slice(0, 16) 
                : prev.completion_time
        }));
    };

    return (
        <Modal 
            isOpen={open} 
            onClose={closeModal}
            size="2xl"
            scrollBehavior="inside"
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <CheckCircleIcon className="w-6 h-6 text-primary" />
                        <span>Update Work Status</span>
                    </div>
                    <p className="text-sm text-default-500 font-normal">
                        RFI #{dailyWork?.number} - {dailyWork?.description}
                    </p>
                </ModalHeader>
                
                <form onSubmit={handleSubmit}>
                    <ModalBody className="space-y-4">
                        {/* Current Work Info */}
                        <Card className="bg-default-50">
                            <CardBody>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-default-500">Type:</span>
                                        <span className="ml-2 font-medium">{dailyWork?.type}</span>
                                    </div>
                                    <div>
                                        <span className="text-default-500">Location:</span>
                                        <span className="ml-2 font-medium">{dailyWork?.location}</span>
                                    </div>
                                    <div>
                                        <span className="text-default-500">In Charge:</span>
                                        <span className="ml-2 font-medium">{dailyWork?.inchargeUser?.name}</span>
                                    </div>
                                    <div>
                                        <span className="text-default-500">Assigned To:</span>
                                        <span className="ml-2 font-medium">{dailyWork?.assignedUser?.name || 'Not assigned'}</span>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        {/* Status Selection */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Work Status</label>
                            <div className="space-y-2">
                                {statusOptions.map((option) => (
                                    <Card 
                                        key={option.key}
                                        isPressable
                                        isHoverable
                                        className={`cursor-pointer transition-all ${
                                            formData.status === option.key 
                                                ? 'ring-2 ring-primary border-primary' 
                                                : 'hover:bg-default-100'
                                        }`}
                                        onPress={() => handleStatusChange(option.key)}
                                    >
                                        <CardBody className="py-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`text-${option.color}`}>
                                                        {option.icon}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{option.label}</div>
                                                        <div className="text-xs text-default-500">{option.description}</div>
                                                    </div>
                                                </div>
                                                {formData.status === option.key && (
                                                    <Chip color={option.color} size="sm" variant="flat">
                                                        Selected
                                                    </Chip>
                                                )}
                                            </div>
                                        </CardBody>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* Completion Time (shown when status is completed or review) */}
                        {(formData.status === 'completed' || formData.status === 'review') && (
                            <div>
                                <Input
                                    label="Completion Time"
                                    type="datetime-local"
                                    value={formData.completion_time}
                                    onValueChange={(value) => setFormData(prev => ({ 
                                        ...prev, 
                                        completion_time: value 
                                    }))}
                                    variant="bordered"
                                    startContent={<Clock size={16} className="text-default-400" />}
                                    description="When was this work actually completed?"
                                />
                            </div>
                        )}

                        {/* Inspection Details (shown when status is review, completed, or rejected) */}
                        {(['review', 'completed', 'rejected'].includes(formData.status)) && (
                            <div>
                                <Textarea
                                    label="Inspection Details"
                                    placeholder="Add inspection notes, quality observations, or reasons for rejection..."
                                    value={formData.inspection_details}
                                    onValueChange={(value) => setFormData(prev => ({ 
                                        ...prev, 
                                        inspection_details: value 
                                    }))}
                                    variant="bordered"
                                    minRows={3}
                                    description={
                                        formData.status === 'rejected' 
                                            ? "Please specify what needs to be corrected"
                                            : "Document the quality inspection results"
                                    }
                                />
                            </div>
                        )}

                        {/* Status Change Summary */}
                        <Card className="bg-primary-50 border-primary-200">
                            <CardBody>
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircleIcon className="w-4 h-4 text-primary-600" />
                                    <span className="font-medium text-primary-900">Status Change Summary</span>
                                </div>
                                <div className="text-sm text-primary-700">
                                    <p>
                                        Status will be changed from <strong>{dailyWork?.status}</strong> to{' '}
                                        <strong>{getCurrentStatusInfo()?.label}</strong>
                                    </p>
                                    {formData.completion_time && (
                                        <p className="mt-1">
                                            Completion time: {new Date(formData.completion_time).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            </CardBody>
                        </Card>
                    </ModalBody>
                    
                    <ModalFooter>
                        <Button 
                            variant="light" 
                            onPress={closeModal}
                            isDisabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button 
                            color="primary" 
                            type="submit"
                            isLoading={isLoading}
                            startContent={!isLoading && getCurrentStatusInfo()?.icon}
                        >
                            {isLoading ? 'Updating...' : `Update to ${getCurrentStatusInfo()?.label}`}
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
};

export default StatusUpdateModal;
