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
    Spinner,
    Switch
} from '@heroui/react';
import {Briefcase, Building2} from 'lucide-react';
import axios from 'axios';
import {showToast} from '@/utils/toastUtils';

const DepartmentForm = ({ open, onClose, onSuccess, department = null, managers = [], parentDepartments = [] }) => {
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    
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

    // Initial form state
    const initialFormState = {
        name: '',
        code: '',
        description: '',
        parent_id: '',
        manager_id: '',
        location: '',
        is_active: true,
        established_date: '',
    };
    
    const [formData, setFormData] = useState(initialFormState);
    
    // Update form if editing existing department
    useEffect(() => {
        if (department) {
            setFormData({
                name: department.name || '',
                code: department.code || '',
                description: department.description || '',
                parent_id: department.parent_id || '',
                manager_id: department.manager_id || '',
                location: department.location || '',
                is_active: department.is_active ?? true,
                established_date: department.established_date || '',
            });
        } else {
            setFormData(initialFormState);
        }
        setErrors({});
    }, [department, open]);
    
    // Handle input changes
    const handleChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
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
                    parent_id: formData.parent_id || null,
                    manager_id: formData.manager_id || null,
                    established_date: formData.established_date || null,
                };
                
                let response;
                if (department?.id) {
                    response = await axios.put(`/departments/${department.id}`, apiData);
                    resolve([response.data.message || 'Department updated successfully']);
                } else {
                    response = await axios.post('/departments', apiData);
                    resolve([response.data.message || 'Department created successfully']);
                }
                
                onSuccess(response.data.department);
                onClose();
            } catch (error) {
                console.error('Full error object:', error);

                if (error.response) {
                    if (error.response.status === 422) {
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

        showToast.promise(promise, {
            pending: {
                render() {
                    return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Spinner size="sm" />
                            <span>Saving department...</span>
                        </div>
                    );
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
                    return (
                        <>
                            {data.map((message, index) => (
                                <div key={index}>{message}</div>
                            ))}
                        </>
                    );
                },
                icon: '🟢',
                style: {
                    backdropFilter: 'blur(16px) saturate(200%)',
                    background: 'var(--theme-content1)',
                    border: '1px solid var(--theme-divider)',
                    color: 'var(--theme-primary)',
                },
            },
            error: {
                render({ data }) {
                    return <>{data}</>;
                },
                icon: '🔴',
                style: {
                    backdropFilter: 'blur(16px) saturate(200%)',
                    background: 'var(--theme-content1)',
                    border: '1px solid var(--theme-divider)',
                    color: 'var(--theme-primary)',
                },
            },
        });
    };
    
    return (
        <Modal
            isOpen={open}
            onOpenChange={loading ? undefined : onClose}
            size="2xl"
            radius={getThemeRadius()}
            scrollBehavior="inside"
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
                        background: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)',
                        borderRadius: `var(--borderRadius, 8px)`,
                    }}>
                        <Building2 size={20} style={{ color: 'var(--theme-primary)' }} />
                    </div>
                    <span className="text-lg font-semibold" style={{
                        fontFamily: `var(--fontFamily, "Inter")`,
                    }}>
                        {department ? 'Edit Department' : 'Create New Department'}
                    </span>
                </ModalHeader>
                <form onSubmit={handleSubmit}>
                    <ModalBody className="py-4 px-4 sm:py-6 sm:px-6" style={{
                        fontFamily: `var(--fontFamily, "Inter")`,
                    }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                            {/* Department Name */}
                            <div className="col-span-2 md:col-span-1">
                                <Input
                                    label="Department Name"
                                    placeholder="Enter department name"
                                    value={formData.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    isInvalid={Boolean(errors.name)}
                                    errorMessage={errors.name?.[0]}
                                    isRequired
                                    variant="bordered"
                                    size="sm"
                                    radius={getThemeRadius()}
                                    startContent={<Building2 size={16} className="text-default-400" />}
                                    classNames={{
                                        input: "text-small",
                                        inputWrapper: "min-h-unit-10"
                                    }}
                                    style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}
                                />
                            </div>

                            {/* Department Code */}
                            <div className="col-span-2 md:col-span-1">
                                <Input
                                    label="Department Code"
                                    placeholder="e.g., HR001, FIN002"
                                    value={formData.code}
                                    onChange={(e) => handleChange('code', e.target.value)}
                                    isInvalid={Boolean(errors.code)}
                                    errorMessage={errors.code?.[0]}
                                    variant="bordered"
                                    size="sm"
                                    radius={getThemeRadius()}
                                    description="Unique identifier"
                                    classNames={{
                                        input: "text-small",
                                        inputWrapper: "min-h-unit-10"
                                    }}
                                    style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}
                                />
                            </div>

                            {/* Description */}
                            <div className="col-span-2">
                                <Input
                                    label="Description"
                                    placeholder="Enter department description"
                                    value={formData.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    isInvalid={Boolean(errors.description)}
                                    errorMessage={errors.description?.[0]}
                                    variant="bordered"
                                    size="sm"
                                    radius={getThemeRadius()}
                                    classNames={{
                                        input: "text-small",
                                        inputWrapper: "min-h-unit-10"
                                    }}
                                    style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}
                                />
                            </div>

                            {/* Parent Department */}
                            <div className="col-span-2 md:col-span-1">
                                <Select
                                    label="Parent Department (Optional)"
                                    placeholder="Select parent department"
                                    selectedKeys={formData.parent_id ? new Set([String(formData.parent_id)]) : new Set()}
                                    onSelectionChange={(keys) => {
                                        const value = Array.from(keys)[0];
                                        handleChange('parent_id', value || '');
                                    }}
                                    isInvalid={Boolean(errors.parent_id)}
                                    errorMessage={errors.parent_id?.[0]}
                                    variant="bordered"
                                    size="sm"
                                    radius={getThemeRadius()}
                                    description="None = Top-Level Department"
                                    classNames={{
                                        trigger: "min-h-unit-10",
                                        value: "text-small"
                                    }}
                                    style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}
                                >
                                    {parentDepartments?.filter(p => department?.id !== p.id).map((parent) => (
                                        <SelectItem key={String(parent.id)} value={parent.id}>
                                            {parent.name}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>

                            {/* Department Manager */}
                            <div className="col-span-2 md:col-span-1">
                                <Select
                                    label="Department Manager (Optional)"
                                    placeholder="Select manager"
                                    selectedKeys={formData.manager_id ? new Set([String(formData.manager_id)]) : new Set()}
                                    onSelectionChange={(keys) => {
                                        const value = Array.from(keys)[0];
                                        handleChange('manager_id', value || '');
                                    }}
                                    isInvalid={Boolean(errors.manager_id)}
                                    errorMessage={errors.manager_id?.[0]}
                                    variant="bordered"
                                    size="sm"
                                    radius={getThemeRadius()}
                                    startContent={<Briefcase size={16} className="text-default-400" />}
                                    classNames={{
                                        trigger: "min-h-unit-10",
                                        value: "text-small"
                                    }}
                                    style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}
                                >
                                    {managers?.map((manager) => (
                                        <SelectItem key={String(manager.id)} value={manager.id}>
                                            {manager.name}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>

                            {/* Location */}
                            <div className="col-span-2 md:col-span-1">
                                <Input
                                    label="Location"
                                    placeholder="Physical location"
                                    value={formData.location}
                                    onChange={(e) => handleChange('location', e.target.value)}
                                    isInvalid={Boolean(errors.location)}
                                    errorMessage={errors.location?.[0]}
                                    variant="bordered"
                                    size="sm"
                                    radius={getThemeRadius()}
                                    classNames={{
                                        input: "text-small",
                                        inputWrapper: "min-h-unit-10"
                                    }}
                                    style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}
                                />
                            </div>

                            {/* Established Date */}
                            <div className="col-span-2 md:col-span-1">
                                <Input
                                    type="date"
                                    label="Established Date"
                                    value={formData.established_date}
                                    onChange={(e) => handleChange('established_date', e.target.value)}
                                    isInvalid={Boolean(errors.established_date)}
                                    errorMessage={errors.established_date?.[0]}
                                    variant="bordered"
                                    size="sm"
                                    radius={getThemeRadius()}
                                    classNames={{
                                        input: "text-small",
                                        inputWrapper: "min-h-unit-10"
                                    }}
                                    style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}
                                />
                            </div>

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
                                            Active departments can be assigned to employees
                                        </p>
                                    </div>
                                    <Switch
                                        isSelected={formData.is_active}
                                        onValueChange={(value) => handleChange('is_active', value)}
                                        size="sm"
                                        classNames={{
                                            wrapper: "group-data-[selected=true]:bg-success"
                                        }}
                                        style={{
                                            fontFamily: `var(--fontFamily, "Inter")`,
                                        }}
                                    />
                                </div>
                                {errors.is_active && (
                                    <p className="text-xs text-danger mt-1">{errors.is_active[0]}</p>
                                )}
                            </div>
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
                            type="submit"
                            color="primary"
                            isLoading={loading}
                            radius={getThemeRadius()}
                            style={{
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}
                        >
                            {department ? 'Update Department' : 'Create Department'}
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
};

export default DepartmentForm;

