import React, { useEffect, useState } from 'react';
import {
    Button,
    Input,
    Select,
    SelectItem,
    Spinner,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Chip,
} from '@heroui/react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { showToast } from '@/utils/toastUtils';

const EnhancedDailyWorkForm = ({ open, closeModal, currentRow, setData, modalType }) => {
    const [dailyWorkData, setDailyWorkData] = useState({
        id: currentRow?.id || '',
        date: currentRow?.date || new Date().toISOString().split('T')[0],
        number: currentRow?.number || '',
        planned_time: currentRow?.planned_time || '',
        type: currentRow?.type || 'Structure',
        location: currentRow?.location || '',
        description: currentRow?.description || '',
        side: currentRow?.side || 'SR-R',
        qty_layer: currentRow?.qty_layer || '',
    });

    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [formTouched, setFormTouched] = useState(false);

    // Real-time validation
    const validateField = (name, value) => {
        const newErrors = { ...validationErrors };

        switch (name) {
            case 'number':
                if (!value.trim()) {
                    newErrors.number = 'RFI Number is required.';
                } else if (!/^RFI-\d{4}-\d{3,4}$/.test(value)) {
                    newErrors.number = 'RFI Number must follow format: RFI-YYYY-XXX (e.g., RFI-2025-001)';
                } else {
                    delete newErrors.number;
                }
                break;
                
            case 'location':
                if (!value.trim()) {
                    newErrors.location = 'Location is required.';
                } else if (!/^K\d+(\+\d+)?(-K\d+(\+\d+)?)?$/.test(value)) {
                    newErrors.location = 'Location must follow chainage format (e.g., K5+100 or K5+100-K5+200)';
                } else {
                    delete newErrors.location;
                }
                break;
                
            case 'description':
                if (!value.trim()) {
                    newErrors.description = 'Description is required.';
                } else if (value.length < 10) {
                    newErrors.description = 'Description must be at least 10 characters.';
                } else {
                    delete newErrors.description;
                }
                break;
                
            case 'date':
                if (!value) {
                    newErrors.date = 'Date is required.';
                } else if (new Date(value) > new Date()) {
                    newErrors.date = 'Date cannot be in the future.';
                } else {
                    delete newErrors.date;
                }
                break;
                
            case 'planned_time':
                if (!value.trim()) {
                    newErrors.planned_time = 'Planned time is required.';
                } else if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
                    newErrors.planned_time = 'Time must be in HH:MM format (e.g., 09:00)';
                } else {
                    delete newErrors.planned_time;
                }
                break;
                
            case 'qty_layer':
                // No validation needed - field is optional
                delete newErrors.qty_layer;
                break;
        }

        setValidationErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setDailyWorkData(prevData => ({
            ...prevData,
            [name]: value,
        }));
        
        // Mark form as touched
        setFormTouched(true);
        
        // Clear backend errors for this field
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
        
        // Real-time validation
        validateField(name, value);
    };

    const validateAllFields = () => {
        let isValid = true;
        Object.keys(dailyWorkData).forEach(key => {
            if (!validateField(key, dailyWorkData[key])) {
                isValid = false;
            }
        });
        return isValid;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        // Validate all fields before submission
        if (!validateAllFields()) {
            showToast.error('Please correct the validation errors before submitting.');
            return;
        }

        setProcessing(true);
        setErrors({});

        try {
            const response = await axios.post(route(`dailyWorks.${modalType}`), {
                ruleSet: 'details',
                ...dailyWorkData
            });

            if (response.status === 200) {
                if (modalType === 'update') {
                    setData(prevWorks => prevWorks.map(work =>
                        work.id === dailyWorkData.id ? { ...work, ...response.data.dailyWork } : work
                    ));
                } else {
                    setData(prevWorks => [...prevWorks, response.data.dailyWork]);
                }
                
                showToast.success(response.data.message || `Daily work ${modalType === 'add' ? 'created' : 'updated'} successfully!`);
                closeModal();
            }
        } catch (error) {
            console.error('Daily work submission error:', error);
            
            if (error.response?.status === 422) {
                // Validation errors from backend
                const backendErrors = error.response.data.errors || {};
                setErrors(backendErrors);
                
                // Show specific error messages
                const errorMessages = Object.values(backendErrors).flat();
                showToast.error(errorMessages.join(', ') || 'Please correct the errors and try again.');
            } else if (error.response?.status === 403) {
                showToast.error('You do not have permission to perform this action.');
            } else if (error.response?.status === 409) {
                showToast.error('A daily work with this RFI number already exists.');
            } else if (error.response?.status === 500) {
                showToast.error('Server error occurred. Please try again later.');
            } else {
                showToast.error('An unexpected error occurred. Please try again.');
            }
        } finally {
            setProcessing(false);
        }
    };

    const getFieldError = (fieldName) => {
        return errors[fieldName] || validationErrors[fieldName];
    };

    const isFieldInvalid = (fieldName) => {
        return Boolean(getFieldError(fieldName));
    };

    const isFormValid = () => {
        return Object.keys(validationErrors).length === 0 && formTouched;
    };

    return (
        <Modal 
            isOpen={open} 
            onClose={closeModal}
            size="2xl"
            classNames={{
                base: "border border-divider bg-content1 shadow-lg",
                header: "border-b border-divider",
                footer: "border-t border-divider",
            }}
        >
            <ModalContent>
                <form onSubmit={handleSubmit} noValidate>
                    <ModalHeader className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-semibold">
                                {modalType === 'add' ? 'Add Daily Work' : 'Edit Daily Work'}
                            </h2>
                            {isFormValid() && (
                                <Chip size="sm" color="success" variant="flat">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Ready to submit
                                </Chip>
                            )}
                        </div>
                        <Button
                            isIconOnly
                            variant="light"
                            onPress={closeModal}
                            className="absolute top-2 right-2"
                            aria-label="Close dialog"
                        >
                            <X size={20} />
                        </Button>
                    </ModalHeader>

                    <ModalBody>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                variant="bordered"
                                label="RFI Date"
                                type="date"
                                name="date"
                                value={dailyWorkData.date}
                                onChange={handleChange}
                                isInvalid={isFieldInvalid('date')}
                                errorMessage={getFieldError('date')}
                                isRequired
                                description="Date when the work was performed"
                            />
                            
                            <Input
                                variant="bordered"
                                label="RFI Number"
                                name="number"
                                value={dailyWorkData.number}
                                onChange={handleChange}
                                isInvalid={isFieldInvalid('number')}
                                errorMessage={getFieldError('number')}
                                isRequired
                                placeholder="RFI-2025-001"
                                description="Unique RFI identifier"
                            />
                            
                            <Input
                                variant="bordered"
                                label="Planned Time"
                                name="planned_time"
                                value={dailyWorkData.planned_time}
                                onChange={handleChange}
                                isInvalid={isFieldInvalid('planned_time')}
                                errorMessage={getFieldError('planned_time')}
                                isRequired
                                placeholder="09:00"
                                description="Time in HH:MM format"
                            />
                            
                            <Select
                                variant="bordered"
                                label="Work Type"
                                name="type"
                                selectedKeys={[dailyWorkData.type]}
                                onSelectionChange={(keys) => {
                                    const value = Array.from(keys)[0];
                                    handleChange({ target: { name: 'type', value } });
                                }}
                                isInvalid={isFieldInvalid('type')}
                                errorMessage={getFieldError('type')}
                                isRequired
                                description="Type of construction work"
                            >
                                <SelectItem key="Structure" value="Structure">Structure</SelectItem>
                                <SelectItem key="Embankment" value="Embankment">Embankment</SelectItem>
                                <SelectItem key="Pavement" value="Pavement">Pavement</SelectItem>
                            </Select>
                            
                            <Input
                                variant="bordered"
                                label="Location"
                                name="location"
                                value={dailyWorkData.location}
                                onChange={handleChange}
                                isInvalid={isFieldInvalid('location')}
                                errorMessage={getFieldError('location')}
                                isRequired
                                placeholder="K5+100 or K5+100-K5+200"
                                description="Chainage location"
                            />
                            
                            <Input
                                variant="bordered"
                                label="Description"
                                name="description"
                                value={dailyWorkData.description}
                                onChange={handleChange}
                                isInvalid={isFieldInvalid('description')}
                                errorMessage={getFieldError('description')}
                                isRequired
                                placeholder="Detailed work description"
                                description="Minimum 10 characters"
                            />
                            
                            <Select
                                variant="bordered"
                                label="Road Side"
                                name="side"
                                selectedKeys={[dailyWorkData.side]}
                                onSelectionChange={(keys) => {
                                    const value = Array.from(keys)[0];
                                    handleChange({ target: { name: 'side', value } });
                                }}
                                isInvalid={isFieldInvalid('side')}
                                errorMessage={getFieldError('side')}
                                isRequired
                                description="Which side of the road"
                            >
                                <SelectItem key="SR-R" value="SR-R">Service Road - Right</SelectItem>
                                <SelectItem key="SR-L" value="SR-L">Service Road - Left</SelectItem>
                                <SelectItem key="TR-R" value="TR-R">Through Road - Right</SelectItem>
                                <SelectItem key="TR-L" value="TR-L">Through Road - Left</SelectItem>
                            </Select>
                            
                            <Input
                                variant="bordered"
                                label={dailyWorkData.type === 'Embankment' ? 'Layer Number' : 'Quantity/Layer'}
                                name="qty_layer"
                                value={dailyWorkData.qty_layer}
                                onChange={handleChange}
                                isInvalid={isFieldInvalid('qty_layer')}
                                errorMessage={getFieldError('qty_layer')}
                                isRequired={false}
                                placeholder={dailyWorkData.type === 'Embankment' ? 'Layer 1 (optional)' : 'Quantity or layer info'}
                                description="Optional quantity or layer information"
                            />
                        </div>

                        {/* Display validation summary if there are errors */}
                        {Object.keys(validationErrors).length > 0 && (
                            <div className="mt-4 p-3 bg-danger-50 border border-danger-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertCircle className="w-4 h-4 text-danger" />
                                    <span className="text-sm font-medium text-danger">Please fix the following errors:</span>
                                </div>
                                <ul className="text-xs text-danger-600 ml-6 list-disc">
                                    {Object.values(validationErrors).map((error, index) => (
                                        <li key={index}>{error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </ModalBody>

                    <ModalFooter className="flex justify-end gap-2">
                        <Button
                            variant="light"
                            onPress={closeModal}
                            isDisabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            type="submit"
                            isLoading={processing}
                            isDisabled={!isFormValid() || processing}
                            className="min-w-24"
                        >
                            {processing 
                                ? (modalType === 'add' ? 'Creating...' : 'Updating...') 
                                : (modalType === 'add' ? 'Create Work' : 'Update Work')
                            }
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
};

export default EnhancedDailyWorkForm;
