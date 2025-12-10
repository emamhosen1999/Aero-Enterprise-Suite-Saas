import React, {useEffect, useState} from 'react';
import {
    Button,
    Chip,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Select,
    SelectItem,
    Textarea
} from "@heroui/react";
import {CalendarIcon, MapPinIcon, UserIcon, UsersIcon} from 'lucide-react';
import {showToast} from "@/utils/toastUtils";
import {usePage} from "@inertiajs/react";
import axios from 'axios';

const TrainingForm = ({
    open,
    closeModal,
    currentTraining,
    categories = [],
    trainers = [],
    employees = [],
    addTrainingOptimized,
    updateTrainingOptimized,
    fetchTrainingStats
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

    const { auth } = usePage().props;
    const isEditMode = !!currentTraining;

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category_id: '',
        trainer_id: '',
        start_date: '',
        end_date: '',
        location: '',
        max_participants: '',
        status: 'scheduled',
        notes: '',
        participants: []
    });

    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    // Format date for datetime-local input
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        
        // Convert to local timezone and format for datetime-local input
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Reset form when modal opens/closes or training changes
    useEffect(() => {
        if (open) {
            if (isEditMode && currentTraining) {
                setFormData({
                    title: currentTraining.title || '',
                    description: currentTraining.description || '',
                    category_id: currentTraining.category_id || '',
                    trainer_id: currentTraining.trainer_id || '',
                    start_date: formatDateForInput(currentTraining.start_date),
                    end_date: formatDateForInput(currentTraining.end_date),
                    location: currentTraining.location || '',
                    max_participants: currentTraining.max_participants || '',
                    status: currentTraining.status || 'scheduled',
                    notes: currentTraining.notes || '',
                    participants: currentTraining.enrollments?.map(e => e.employee_id) || []
                });
            } else {
                // Reset for new training
                setFormData({
                    title: '',
                    description: '',
                    category_id: '',
                    trainer_id: '',
                    start_date: '',
                    end_date: '',
                    location: '',
                    max_participants: '',
                    status: 'scheduled',
                    notes: '',
                    participants: []
                });
            }
            setSelectedEmployee('');
            setErrors({});
        }
    }, [open, isEditMode, currentTraining]);

    // Handle form field changes
    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    // Participant management
    const addParticipant = () => {
        if (!selectedEmployee || formData.participants.includes(selectedEmployee)) return;
        
        setFormData(prev => ({
            ...prev,
            participants: [...prev.participants, selectedEmployee]
        }));
        setSelectedEmployee('');
    };

    const removeParticipant = (employeeId) => {
        setFormData(prev => ({
            ...prev,
            participants: prev.participants.filter(id => id !== employeeId)
        }));
    };

    // Form submission
    const handleSubmit = async (event) => {
        event.preventDefault();
        setProcessing(true);

        const promise = new Promise(async (resolve, reject) => {
            try {
                const apiRoute = isEditMode 
                    ? route('hr.training.update', currentTraining.id)
                    : route('hr.training.store');

                const requestData = {
                    ...formData,
                    _method: isEditMode ? 'PUT' : 'POST'
                };

                const response = await axios.post(apiRoute, requestData);

                if (response.status === 200) {
                    // Use optimized data manipulation like LeaveForm
                    if (isEditMode && updateTrainingOptimized && response.data.training) {
                        updateTrainingOptimized(response.data.training);
                        fetchTrainingStats && fetchTrainingStats();
                    } else if (addTrainingOptimized && response.data.training) {
                        addTrainingOptimized(response.data.training);
                        fetchTrainingStats && fetchTrainingStats();
                    }
                    
                    closeModal();
                    resolve([response.data.message || (isEditMode ? 'Training updated successfully!' : 'Training created successfully!')]);
                }
            } catch (error) {
                console.error('Training form error:', error);
                
                if (error.response) {
                    if (error.response.status === 422) {
                        // Handle validation errors
                        setErrors(error.response.data.errors || {});
                        reject(error.response.data.message || 'Please check the form for errors');
                    } else {
                        reject(`HTTP Error ${error.response.status}: ${error.response.data.message || 'An unexpected error occurred'}`);
                    }
                } else if (error.request) {
                    reject('No response from server. Please check your connection.');
                } else {
                    reject('An error occurred while setting up the request.');
                }
            } finally {
                setProcessing(false);
            }
        });

        showToast.promise(
            promise,
            {
                pending: isEditMode ? 'Updating training...' : 'Creating training...',
                success: {
                    render({ data }) {
                        return data[0];
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
        if (!processing) {
            closeModal();
        }
    };

    // Get available employees (excluding already selected participants)
    const availableEmployees = employees?.filter(emp => 
        !formData.participants.includes(emp.id)
    ) || [];

    return (
        <Modal 
            isOpen={open} 
            onClose={onClose}
            size="4xl"
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
                <form onSubmit={handleSubmit}>
                    <ModalHeader className="flex flex-col gap-1" style={{
                        borderColor: `var(--theme-divider, #E4E4E7)`,
                        fontFamily: `var(--fontFamily, "Inter")`,
                    }}>
                        <h2 className="text-lg font-semibold">
                            {isEditMode ? 'Edit Training Program' : 'New Training Program'}
                        </h2>
                        <p className="text-sm text-default-500">
                            {isEditMode ? 'Update training details and participants' : 'Create a new training program for employees'}
                        </p>
                    </ModalHeader>
                    
                    <ModalBody style={{
                        fontFamily: `var(--fontFamily, "Inter")`,
                    }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Title */}
                            <div className="md:col-span-2">
                                <Input
                                    label="Training Title"
                                    placeholder="Enter training program title"
                                    value={formData.title}
                                    onValueChange={(value) => handleChange('title', value)}
                                    isInvalid={Boolean(errors.title)}
                                    errorMessage={errors.title}
                                    variant="bordered"
                                    size="sm"
                                    radius={getThemeRadius()}
                                    isRequired
                                    classNames={{
                                        input: "text-small",
                                        inputWrapper: "min-h-unit-10"
                                    }}
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <Select
                                    label="Category"
                                    placeholder="Select training category"
                                    selectedKeys={formData.category_id ? [formData.category_id.toString()] : []}
                                    onSelectionChange={(keys) => {
                                        const key = Array.from(keys)[0];
                                        handleChange('category_id', key || '');
                                    }}
                                    isInvalid={Boolean(errors.category_id)}
                                    errorMessage={errors.category_id}
                                    variant="bordered"
                                    size="sm"
                                    radius={getThemeRadius()}
                                    isRequired
                                >
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>

                            {/* Trainer */}
                            <div>
                                <Select
                                    label="Trainer"
                                    placeholder="Select trainer"
                                    selectedKeys={formData.trainer_id ? [formData.trainer_id.toString()] : []}
                                    onSelectionChange={(keys) => {
                                        const key = Array.from(keys)[0];
                                        handleChange('trainer_id', key || '');
                                    }}
                                    isInvalid={Boolean(errors.trainer_id)}
                                    errorMessage={errors.trainer_id}
                                    variant="bordered"
                                    size="sm"
                                    radius={getThemeRadius()}
                                    startContent={<UserIcon size={16} className="text-default-400" />}
                                >
                                    {trainers.map((trainer) => (
                                        <SelectItem key={trainer.id} value={trainer.id}>
                                            {trainer.first_name} {trainer.last_name}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>

                            {/* Start Date */}
                            <div>
                                <Input
                                    label="Start Date & Time"
                                    type="datetime-local"
                                    value={formData.start_date}
                                    onValueChange={(value) => handleChange('start_date', value)}
                                    isInvalid={Boolean(errors.start_date)}
                                    errorMessage={errors.start_date}
                                    variant="bordered"
                                    size="sm"
                                    radius={getThemeRadius()}
                                    startContent={<CalendarIcon size={16} className="text-default-400" />}
                                    isRequired
                                />
                            </div>

                            {/* End Date */}
                            <div>
                                <Input
                                    label="End Date & Time"
                                    type="datetime-local"
                                    value={formData.end_date}
                                    onValueChange={(value) => handleChange('end_date', value)}
                                    isInvalid={Boolean(errors.end_date)}
                                    errorMessage={errors.end_date}
                                    variant="bordered"
                                    size="sm"
                                    radius={getThemeRadius()}
                                    startContent={<CalendarIcon size={16} className="text-default-400" />}
                                />
                            </div>

                            {/* Location */}
                            <div>
                                <Input
                                    label="Location"
                                    placeholder="Enter training location"
                                    value={formData.location}
                                    onValueChange={(value) => handleChange('location', value)}
                                    isInvalid={Boolean(errors.location)}
                                    errorMessage={errors.location}
                                    variant="bordered"
                                    size="sm"
                                    radius={getThemeRadius()}
                                    startContent={<MapPinIcon size={16} className="text-default-400" />}
                                />
                            </div>

                            {/* Max Participants */}
                            <div>
                                <Input
                                    label="Max Participants"
                                    type="number"
                                    placeholder="Maximum number of participants"
                                    value={formData.max_participants}
                                    onValueChange={(value) => handleChange('max_participants', value)}
                                    isInvalid={Boolean(errors.max_participants)}
                                    errorMessage={errors.max_participants}
                                    variant="bordered"
                                    size="sm"
                                    radius={getThemeRadius()}
                                    startContent={<UsersIcon size={16} className="text-default-400" />}
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <Select
                                    label="Status"
                                    placeholder="Select training status"
                                    selectedKeys={formData.status ? [formData.status] : []}
                                    onSelectionChange={(keys) => {
                                        const key = Array.from(keys)[0];
                                        handleChange('status', key || 'scheduled');
                                    }}
                                    isInvalid={Boolean(errors.status)}
                                    errorMessage={errors.status}
                                    variant="bordered"
                                    size="sm"
                                    radius={getThemeRadius()}
                                >
                                    <SelectItem key="scheduled" value="scheduled">Scheduled</SelectItem>
                                    <SelectItem key="in_progress" value="in_progress">In Progress</SelectItem>
                                    <SelectItem key="completed" value="completed">Completed</SelectItem>
                                    <SelectItem key="cancelled" value="cancelled">Cancelled</SelectItem>
                                </Select>
                            </div>

                            {/* Description */}
                            <div className="md:col-span-2">
                                <Textarea
                                    label="Description"
                                    placeholder="Enter training program description and objectives"
                                    value={formData.description}
                                    onValueChange={(value) => handleChange('description', value)}
                                    isInvalid={Boolean(errors.description)}
                                    errorMessage={errors.description}
                                    variant="bordered"
                                    size="sm"
                                    radius={getThemeRadius()}
                                    minRows={3}
                                    maxRows={5}
                                />
                            </div>

                            {/* Notes */}
                            <div className="md:col-span-2">
                                <Textarea
                                    label="Notes"
                                    placeholder="Additional notes or requirements"
                                    value={formData.notes}
                                    onValueChange={(value) => handleChange('notes', value)}
                                    isInvalid={Boolean(errors.notes)}
                                    errorMessage={errors.notes}
                                    variant="bordered"
                                    size="sm"
                                    radius={getThemeRadius()}
                                    minRows={2}
                                    maxRows={3}
                                />
                            </div>

                            {/* Participants Management */}
                            <div className="md:col-span-2">
                                <div className="space-y-3">
                                    <h3 className="text-sm font-medium">Participants</h3>
                                    
                                    {/* Add Participant */}
                                    <div className="flex gap-2">
                                        <Select
                                            placeholder="Select employee to add"
                                            selectedKeys={selectedEmployee ? [selectedEmployee] : []}
                                            onSelectionChange={(keys) => {
                                                const key = Array.from(keys)[0];
                                                setSelectedEmployee(key || '');
                                            }}
                                            variant="bordered"
                                            size="sm"
                                            radius={getThemeRadius()}
                                            className="flex-1"
                                        >
                                            {availableEmployees.map((employee) => (
                                                <SelectItem key={employee.id} value={employee.id}>
                                                    {employee.first_name} {employee.last_name} - {employee.employee_id}
                                                </SelectItem>
                                            ))}
                                        </Select>
                                        <Button
                                            color="primary"
                                            variant="flat"
                                            size="sm"
                                            radius={getThemeRadius()}
                                            isDisabled={!selectedEmployee}
                                            onPress={addParticipant}
                                        >
                                            Add
                                        </Button>
                                    </div>

                                    {/* Participants List */}
                                    <div className="space-y-2">
                                        {formData.participants.length === 0 ? (
                                            <p className="text-sm text-default-500">No participants added</p>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {formData.participants.map(participantId => {
                                                    const employee = employees?.find(emp => emp.id == participantId);
                                                    return (
                                                        <Chip
                                                            key={participantId}
                                                            color="primary"
                                                            variant="flat"
                                                            size="sm"
                                                            onClose={() => removeParticipant(participantId)}
                                                        >
                                                            {employee?.first_name} {employee?.last_name}
                                                        </Chip>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
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
                            isDisabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            color="primary"
                            variant="solid"
                            isLoading={processing}
                            isDisabled={processing}
                            radius={getThemeRadius()}
                            size="sm"
                        >
                            {processing 
                                ? (isEditMode ? 'Updating...' : 'Creating...') 
                                : (isEditMode ? 'Update Training' : 'Create Training')
                            }
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
};

export default TrainingForm;
