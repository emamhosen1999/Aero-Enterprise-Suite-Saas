import React, {useEffect, useState} from 'react';
import {
    Button,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Select,
    SelectItem,
    Switch,
} from '@heroui/react';
import {Briefcase, Building2} from 'lucide-react';
import axios from 'axios';
import {showToast} from '@/utils/toastUtils';

const DesignationForm = ({ 
    open, 
    onClose, 
    onSuccess, 
    designation = null, 
    departments = [],
    designations = []
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

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Initial form state
    const initialFormState = {
        title: '',
        department_id: '',
        hierarchy_level: 1,
        parent_id: '',
        is_active: true,
    };

    const [formData, setFormData] = useState(initialFormState);

    // Update form if editing existing designation
    useEffect(() => {
        if (designation) {
            setFormData({
                title: designation.title || '',
                department_id: designation.department_id || '',
                hierarchy_level: designation.hierarchy_level || 1,
                parent_id: designation.parent_id || '',
                is_active: designation.is_active ?? true,
            });
        } else {
            setFormData(initialFormState);
        }
        setErrors({});
    }, [designation, open]);

    // Filter parent designations by department and hierarchy level
    const availableParents = designations?.filter(d => {
        // Don't show self as parent
        if (designation?.id && d.id === designation.id) return false;
        
        // Only show designations from same department
        if (formData.department_id && d.department_id !== parseInt(formData.department_id)) return false;
        
        // Only show designations with lower hierarchy level (higher positions)
        if (formData.hierarchy_level && d.hierarchy_level >= formData.hierarchy_level) return false;
        
        return true;
    }) || [];

    // Handle input changes
    const handleChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }

        // Clear parent_id if department changes
        if (name === 'department_id' && value !== formData.department_id) {
            setFormData(prev => ({ ...prev, parent_id: '' }));
        }

        // Clear parent_id if hierarchy level changes to 1
        if (name === 'hierarchy_level' && value === 1) {
            setFormData(prev => ({ ...prev, parent_id: '' }));
        }
    };

    // Handle form submission
    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setErrors({});

        const promise = new Promise(async (resolve, reject) => {
            try {
                const apiData = { 
                    ...formData,
                    parent_id: formData.hierarchy_level === 1 ? null : formData.parent_id || null
                };
                
                let response;
                if (designation?.id) {
                    response = await axios.put(`/designations/${designation.id}`, apiData);
                    resolve([response.data.message || 'Designation updated successfully']);
                } else {
                    response = await axios.post('/designations', apiData);
                    resolve([response.data.message || 'Designation created successfully']);
                }
                
                onSuccess(response.data.designation);
                onClose();
            } catch (error) {
                console.error('Full error object:', error);

                if (error.response) {
                    if (error.response.status === 422) {
                        // Handle validation errors
                        setErrors(error.response.data.errors || {});
                        const errorMessages = Object.values(error.response.data.errors || {}).flat();
                        reject(errorMessages.length > 0 ? errorMessages.join(', ') : 'Validation failed');
                    } else {
                        reject(`HTTP Error ${error.response.status}: ${error.response.data.message || 'An unexpected error occurred'}`);
                    }
                } else if (error.request) {
                    reject('No response received from the server. Please check your internet connection.');
                } else {
                    reject('An error occurred while setting up the request.');
                }
            } finally {
                setLoading(false);
            }
        });

        showToast.promise(
            promise,
            {
                pending: `${designation ? 'Updating' : 'Creating'} designation...`,
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
    };

    return (
        <Modal 
            isOpen={open} 
            onClose={loading ? undefined : onClose}
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
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1" style={{
                            borderColor: `var(--theme-divider, #E4E4E7)`,
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}>
                            <div className="flex items-center gap-2">
                                <Briefcase size={20} style={{ color: 'var(--theme-primary)' }} />
                                <span className="text-lg font-semibold" style={{
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}>
                                    {designation ? 'Edit Designation' : 'Create New Designation'}
                                </span>
                            </div>
                        </ModalHeader>
                        <form onSubmit={handleSubmit}>
                            <ModalBody className="py-4 px-4 sm:py-6 sm:px-6" style={{
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                    {/* Designation Title */}
                                    <div className="col-span-2">
                                        <Input
                                            label="Designation Title"
                                            placeholder="Enter designation title"
                                            value={formData.title}
                                            onChange={(e) => handleChange('title', e.target.value)}
                                            isInvalid={Boolean(errors.title)}
                                            errorMessage={errors.title?.[0]}
                                            isRequired
                                            variant="bordered"
                                            size="sm"
                                            radius={getThemeRadius()}
                                            startContent={<Briefcase size={16} className="text-default-400" />}
                                            classNames={{
                                                input: "text-small",
                                                inputWrapper: "min-h-unit-10"
                                            }}
                                            style={{
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                        />
                                    </div>

                                    {/* Department */}
                                    <div className="col-span-2 md:col-span-1">
                                        <Select
                                            label="Department"
                                            placeholder="Select Department"
                                            selectedKeys={formData.department_id ? new Set([String(formData.department_id)]) : new Set()}
                                            onSelectionChange={(keys) => {
                                                const value = Array.from(keys)[0];
                                                handleChange('department_id', value || '');
                                            }}
                                            isInvalid={Boolean(errors.department_id)}
                                            errorMessage={errors.department_id?.[0]}
                                            isRequired
                                            variant="bordered"
                                            size="sm"
                                            radius={getThemeRadius()}
                                            startContent={<Building2 size={16} className="text-default-400" />}
                                            classNames={{
                                                trigger: "min-h-unit-10",
                                                value: "text-small"
                                            }}
                                            style={{
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                        >
                                            {departments?.map((dept) => (
                                                <SelectItem key={dept.id} value={dept.id}>
                                                    {dept.name}
                                                </SelectItem>
                                            ))}
                                        </Select>
                                    </div>

                                    {/* Hierarchy Level */}
                                    <div className="col-span-2 md:col-span-1">
                                        <Input
                                            type="number"
                                            label="Hierarchy Level"
                                            placeholder="Enter hierarchy level"
                                            value={String(formData.hierarchy_level)}
                                            onChange={(e) => handleChange('hierarchy_level', parseInt(e.target.value) || 1)}
                                            isInvalid={Boolean(errors.hierarchy_level)}
                                            errorMessage={errors.hierarchy_level?.[0]}
                                            min={1}
                                            max={10}
                                            isRequired
                                            variant="bordered"
                                            size="sm"
                                            radius={getThemeRadius()}
                                            description="1 = Highest (CEO/Director), 2 = Manager, 3+ = Staff levels"
                                            classNames={{
                                                input: "text-small",
                                                inputWrapper: "min-h-unit-10"
                                            }}
                                            style={{
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                        />
                                    </div>

                                    {/* Parent Designation */}
                                    {formData.hierarchy_level > 1 && (
                                        <div className="col-span-2">
                                            <Select
                                                label="Parent Designation (Optional)"
                                                placeholder={
                                                    !formData.department_id 
                                                        ? "Select department first"
                                                        : availableParents.length === 0
                                                        ? "No higher-level designations available"
                                                        : "Select parent designation"
                                                }
                                                selectedKeys={formData.parent_id ? new Set([String(formData.parent_id)]) : new Set()}
                                                onSelectionChange={(keys) => {
                                                    const value = Array.from(keys)[0];
                                                    handleChange('parent_id', value || '');
                                                }}
                                                isInvalid={Boolean(errors.parent_id)}
                                                errorMessage={errors.parent_id?.[0]}
                                                isDisabled={!formData.department_id || availableParents.length === 0}
                                                variant="bordered"
                                                size="sm"
                                                radius={getThemeRadius()}
                                                description="Parent must be a higher-level designation in the same department"
                                                classNames={{
                                                    trigger: "min-h-unit-10",
                                                    value: "text-small"
                                                }}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                            >
                                                {availableParents?.map((parent) => (
                                                    <SelectItem key={String(parent.id)} value={parent.id}>
                                                        {parent.title} (Level {parent.hierarchy_level})
                                                    </SelectItem>
                                                ))}
                                            </Select>
                                        </div>
                                    )}

                                    {/* Active Status */}
                                    <div className="col-span-2">
                                        <div className="flex items-center justify-between p-4 rounded-lg border" style={{
                                            borderColor: 'var(--theme-divider, #E4E4E7)',
                                            background: 'color-mix(in srgb, var(--theme-content2) 30%, transparent)'
                                        }}>
                                            <div className="flex-1">
                                                <span className="text-sm font-semibold" style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}>Active Status</span>
                                                <p className="text-xs text-default-500 mt-1" style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}>
                                                    Active designations can be assigned to employees
                                                </p>
                                            </div>
                                            <Switch
                                                isSelected={formData.is_active}
                                                onValueChange={(checked) => handleChange('is_active', checked)}
                                                color={formData.is_active ? "success" : "default"}
                                                size="sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </ModalBody>
                            <ModalFooter className="flex justify-between px-4 sm:px-6 py-3 sm:py-4" style={{
                                borderColor: `var(--theme-divider, #E4E4E7)`,
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}>
                                <Button 
                                    variant="light"
                                    onPress={onClose}
                                    isDisabled={loading}
                                    radius={getThemeRadius()}
                                    style={{
                                        borderRadius: `var(--borderRadius, 8px)`,
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="solid"
                                    color="primary"
                                    isLoading={loading}
                                    isDisabled={loading}
                                    radius={getThemeRadius()}
                                    style={{
                                        borderRadius: `var(--borderRadius, 8px)`,
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}
                                >
                                    {designation ? 'Update Designation' : 'Create Designation'}
                                </Button>
                            </ModalFooter>
                        </form>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default DesignationForm;
