import React, {useEffect, useMemo, useState} from 'react';
import {
    Button,
    Chip,
    Divider,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Select,
    SelectItem,
    Switch,
    Textarea
} from "@heroui/react";
import {CalendarDaysIcon, CheckIcon, ClockIcon, InformationCircleIcon} from "@heroicons/react/24/outline";
import {showToast} from "@/utils/toastUtils";
import {differenceInDays, format} from 'date-fns';
import axios from 'axios';

const HolidayForm = ({ 
    open, 
    closeModal, 
    holidaysData, 
    setHolidaysData, 
    currentHoliday 
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
    
    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        from_date: '',
        to_date: '',
        type: 'company',
        is_recurring: false,
        is_active: true
    });
    
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    // Holiday type configurations
    const holidayTypes = [
        { key: 'public', label: 'Public Holiday', icon: '🏛️', description: 'Government declared public holiday' },
        { key: 'religious', label: 'Religious Holiday', icon: '🕌', description: 'Religious observance' },
        { key: 'national', label: 'National Holiday', icon: '🇧🇩', description: 'National celebration or commemoration' },
        { key: 'company', label: 'Company Holiday', icon: '🏢', description: 'Company-specific holiday' },
        { key: 'optional', label: 'Optional Holiday', icon: '📅', description: 'Optional observance' }
    ];

    // Initialize form data
    useEffect(() => {
        if (currentHoliday) {
            setFormData({
                title: currentHoliday.title || '',
                description: currentHoliday.description || '',
                from_date: currentHoliday.from_date || '',
                to_date: currentHoliday.to_date || '',
                type: currentHoliday.type || 'company',
                is_recurring: currentHoliday.is_recurring || false,
                is_active: currentHoliday.is_active !== undefined ? currentHoliday.is_active : true
            });
        } else {
            setFormData({
                title: '',
                description: '',
                from_date: '',
                to_date: '',
                type: 'company',
                is_recurring: false,
                is_active: true
            });
        }
        setErrors({});
    }, [currentHoliday, open]);

    // Calculate duration
    const duration = useMemo(() => {
        if (formData.from_date && formData.to_date) {
            const fromDate = new Date(formData.from_date);
            const toDate = new Date(formData.to_date);
            return differenceInDays(toDate, fromDate) + 1;
        }
        return 1;
    }, [formData.from_date, formData.to_date]);

    // Handle form field changes
    const handleFieldChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Clear errors for this field
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: undefined
            }));
        }

        // Auto-set to_date if from_date changes and to_date is empty
        if (field === 'from_date' && !formData.to_date) {
            setFormData(prev => ({
                ...prev,
                to_date: value
            }));
        }
    };

    // Handle form submission
    const handleSubmit = async (event) => {
        event.preventDefault();
        setProcessing(true);
        setErrors({});

        try {
            const submitData = {
                title: formData.title,
                description: formData.description,
                fromDate: formData.from_date,
                toDate: formData.to_date,
                type: formData.type,
                is_recurring: formData.is_recurring,
                is_active: formData.is_active
            };

            if (currentHoliday) {
                submitData.id = currentHoliday.id;
            }

            const response = await axios.post(route('holidays-add'), submitData);

            if (response.status === 200) {
                setHolidaysData(response.data.holidays);
                showToast.success(response.data.message || 'Holiday saved successfully!');
                closeModal();
            }
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors || {});
                showToast.error('Please check the form for errors');
            } else {
                showToast.error(error.response?.data?.message || 'Failed to save holiday');
            }
        } finally {
            setProcessing(false);
        }
    };

    // Get selected holiday type
    const selectedType = holidayTypes.find(type => type.key === formData.type);

    return (
        <Modal 
            isOpen={open} 
            onClose={closeModal}
            size="3xl"
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
                                <CalendarDaysIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                                <span className="text-lg font-semibold" style={{
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}>
                                    {currentHoliday ? 'Edit Holiday' : 'Add New Holiday'}
                                </span>
                            </div>
                        </ModalHeader>
                        
                        <form onSubmit={handleSubmit}>
                            <ModalBody className="py-4 px-4 sm:py-6 sm:px-6" style={{
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}>
                                <div className="space-y-6">
                                    {/* Basic Information Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <InformationCircleIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                                            <h3 className="text-base font-semibold" style={{ color: 'var(--theme-foreground)' }}>
                                                Basic Information
                                            </h3>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 gap-4">
                                            {/* Holiday Title */}
                                            <Input
                                                label="Holiday Title"
                                                placeholder="Enter holiday name"
                                                value={formData.title}
                                                onValueChange={(value) => handleFieldChange('title', value)}
                                                isInvalid={Boolean(errors.title)}
                                                errorMessage={errors.title}
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

                                            {/* Description */}
                                            <Textarea
                                                label="Description"
                                                placeholder="Optional description or notes"
                                                value={formData.description}
                                                onValueChange={(value) => handleFieldChange('description', value)}
                                                isInvalid={Boolean(errors.description)}
                                                errorMessage={errors.description}
                                                variant="bordered"
                                                size="sm"
                                                radius={getThemeRadius()}
                                                minRows={3}
                                                maxRows={5}
                                                classNames={{
                                                    input: "text-small"
                                                }}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <Divider style={{ background: `var(--theme-divider)` }} />

                                    {/* Holiday Type Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <CheckIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                                            <h3 className="text-base font-semibold" style={{ color: 'var(--theme-foreground)' }}>
                                                Holiday Type
                                            </h3>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Type Selection */}
                                            <Select
                                                label="Holiday Type"
                                                placeholder="Select holiday type"
                                                selectedKeys={formData.type ? new Set([formData.type]) : new Set()}
                                                onSelectionChange={(keys) => {
                                                    const value = Array.from(keys)[0];
                                                    handleFieldChange('type', value || '');
                                                }}
                                                isInvalid={Boolean(errors.type)}
                                                errorMessage={errors.type}
                                                variant="bordered"
                                                size="sm"
                                                radius={getThemeRadius()}
                                                classNames={{
                                                    trigger: "min-h-unit-10",
                                                    value: "text-small"
                                                }}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                            >
                                                {holidayTypes.map((type) => (
                                                    <SelectItem 
                                                        key={type.key} 
                                                        value={type.key}
                                                        textValue={type.label}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span>{type.icon}</span>
                                                            <div>
                                                                <div className="font-medium">{type.label}</div>
                                                                <div className="text-xs text-default-500">{type.description}</div>
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </Select>

                                            {/* Type Preview */}
                                            {selectedType && (
                                                <div 
                                                    className="p-3 rounded-lg border flex items-center gap-2" 
                                                    style={{
                                                        backgroundColor: 'var(--theme-content2)',
                                                        borderColor: 'var(--theme-divider)',
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <span className="text-lg">{selectedType.icon}</span>
                                                    <div>
                                                        <div className="font-medium text-sm" style={{ color: 'var(--theme-foreground)' }}>
                                                            {selectedType.label}
                                                        </div>
                                                        <div className="text-xs" style={{ color: 'var(--theme-foreground-600)' }}>
                                                            {selectedType.description}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <Divider style={{ background: `var(--theme-divider)` }} />

                                    {/* Date Range Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <CalendarDaysIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                                                <h3 className="text-base font-semibold" style={{ color: 'var(--theme-foreground)' }}>
                                                    Date Range
                                                </h3>
                                            </div>
                                            {duration > 1 && (
                                                <Chip 
                                                    variant="bordered" 
                                                    size="sm"
                                                    radius={getThemeRadius()}
                                                    style={{
                                                        borderColor: `var(--theme-primary)`,
                                                        color: `var(--theme-primary)`,
                                                        borderRadius: `var(--borderRadius, 8px)`,
                                                    }}
                                                >
                                                    {duration} days
                                                </Chip>
                                            )}
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* From Date */}
                                            <Input
                                                label="From Date"
                                                type="date"
                                                value={formData.from_date}
                                                onValueChange={(value) => handleFieldChange('from_date', value)}
                                                isInvalid={Boolean(errors.fromDate)}
                                                errorMessage={errors.fromDate}
                                                variant="bordered"
                                                size="sm"
                                                radius={getThemeRadius()}
                                                startContent={<CalendarDaysIcon className="w-4 h-4 text-default-400" />}
                                                classNames={{
                                                    input: "text-small",
                                                    inputWrapper: "min-h-unit-10"
                                                }}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                            />

                                            {/* To Date */}
                                            <Input
                                                label="To Date"
                                                type="date"
                                                value={formData.to_date}
                                                onValueChange={(value) => handleFieldChange('to_date', value)}
                                                isInvalid={Boolean(errors.toDate)}
                                                errorMessage={errors.toDate}
                                                variant="bordered"
                                                size="sm"
                                                radius={getThemeRadius()}
                                                startContent={<CalendarDaysIcon className="w-4 h-4 text-default-400" />}
                                                classNames={{
                                                    input: "text-small",
                                                    inputWrapper: "min-h-unit-10"
                                                }}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                            />
                                        </div>

                                        {/* Date Range Preview */}
                                        {formData.from_date && formData.to_date && (
                                            <div 
                                                className="p-3 rounded-lg border flex items-center gap-2" 
                                                style={{
                                                    backgroundColor: 'var(--theme-content2)',
                                                    borderColor: 'var(--theme-divider)',
                                                    borderRadius: `var(--borderRadius, 12px)`,
                                                }}
                                            >
                                                <InformationCircleIcon className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                                                <div className="text-sm">
                                                    <span style={{ color: 'var(--theme-foreground)' }}>
                                                        Holiday period: {format(new Date(formData.from_date), 'MMM dd, yyyy')} 
                                                        {duration > 1 && (
                                                            <> to {format(new Date(formData.to_date), 'MMM dd, yyyy')}</>
                                                        )} ({duration} {duration === 1 ? 'day' : 'days'})
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <Divider style={{ background: `var(--theme-divider)` }} />

                                    {/* Settings Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <ClockIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                                            <h3 className="text-base font-semibold" style={{ color: 'var(--theme-foreground)' }}>
                                                Settings
                                            </h3>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Recurring Holiday */}
                                            <div 
                                                className="p-4 rounded-lg border flex items-center justify-between"
                                                style={{
                                                    backgroundColor: 'var(--theme-content2)',
                                                    borderColor: 'var(--theme-divider)',
                                                    borderRadius: `var(--borderRadius, 12px)`,
                                                }}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <ClockIcon className="w-5 h-5 text-default-400" />
                                                    <div>
                                                        <p className="text-sm font-medium" style={{ color: 'var(--theme-foreground)' }}>
                                                            Recurring Holiday
                                                        </p>
                                                        <p className="text-xs" style={{ color: 'var(--theme-foreground-600)' }}>
                                                            Repeat this holiday annually
                                                        </p>
                                                    </div>
                                                </div>
                                                <Switch
                                                    isSelected={formData.is_recurring}
                                                    onValueChange={(checked) => handleFieldChange('is_recurring', checked)}
                                                    color="primary"
                                                    size="sm"
                                                />
                                            </div>

                                            {/* Active Holiday */}
                                            <div 
                                                className="p-4 rounded-lg border flex items-center justify-between"
                                                style={{
                                                    backgroundColor: 'var(--theme-content2)',
                                                    borderColor: 'var(--theme-divider)',
                                                    borderRadius: `var(--borderRadius, 12px)`,
                                                }}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <CheckIcon className="w-5 h-5 text-default-400" />
                                                    <div>
                                                        <p className="text-sm font-medium" style={{ color: 'var(--theme-foreground)' }}>
                                                            Active Holiday
                                                        </p>
                                                        <p className="text-xs" style={{ color: 'var(--theme-foreground-600)' }}>
                                                            Include in holiday calculations
                                                        </p>
                                                    </div>
                                                </div>
                                                <Switch
                                                    isSelected={formData.is_active}
                                                    onValueChange={(checked) => handleFieldChange('is_active', checked)}
                                                    color="success"
                                                    size="sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </ModalBody>
                            
                            <ModalFooter className="flex flex-col sm:flex-row justify-center gap-2 px-4 sm:px-6 py-3 sm:py-4" style={{
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
                                    style={{
                                        borderRadius: `var(--borderRadius, 8px)`,
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}
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
                                    style={{
                                        borderRadius: `var(--borderRadius, 8px)`,
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}
                                >
                                    {processing ? 'Saving...' : (currentHoliday ? 'Update Holiday' : 'Create Holiday')}
                                </Button>
                            </ModalFooter>
                        </form>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default HolidayForm;
