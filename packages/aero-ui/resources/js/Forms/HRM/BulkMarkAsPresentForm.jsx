import React, {useEffect, useMemo, useState} from 'react';
import {
    Button,
    Card,
    CardBody,
    Checkbox,
    Chip,
    Divider,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ScrollShadow,
    Textarea,
    User
} from "@heroui/react";
import {
    CalendarDaysIcon,
    ClockIcon,
    InformationCircleIcon,
    MapPinIcon,
    UserGroupIcon
} from "@heroicons/react/24/outline";
import {showToast} from "@/utils/toastUtils";
import axios from 'axios';
import dayjs from 'dayjs';

const BulkMarkAsPresentForm = ({ 
    open, 
    closeModal, 
    selectedDate,
    allUsers,
    refreshTimeSheet,
    selectedUsers = []
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
        user_ids: [],
        date: selectedDate,
        punch_in_time: '09:00',
        punch_out_time: '',
        reason: '',
        location: 'Office - Bulk marked present by admin'
    });
    
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);
    const [selectAll, setSelectAll] = useState(false);

    // Filter available users (employees only)
    const availableUsers = useMemo(() => {
        return allUsers?.filter(user => user.roles?.some(role => role.name === 'Employee')) || [];
    }, [allUsers]);

    // Initialize form data
    useEffect(() => {
        const initialSelectedIds = selectedUsers.map(user => user.id.toString());
        setFormData(prev => ({
            ...prev,
            user_ids: initialSelectedIds,
            date: selectedDate,
        }));
        setSelectAll(initialSelectedIds.length === availableUsers.length);
        setErrors({});
    }, [selectedUsers, selectedDate, open, availableUsers.length]);

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
    };

    // Handle user selection
    const handleUserSelection = (userId, isSelected) => {
        const userIdStr = userId.toString();
        setFormData(prev => ({
            ...prev,
            user_ids: isSelected 
                ? [...prev.user_ids, userIdStr]
                : prev.user_ids.filter(id => id !== userIdStr)
        }));
    };

    // Handle select all
    const handleSelectAll = (isSelected) => {
        setSelectAll(isSelected);
        setFormData(prev => ({
            ...prev,
            user_ids: isSelected ? availableUsers.map(user => user.id.toString()) : []
        }));
    };

    // Calculate work duration
    const workDuration = useMemo(() => {
        if (formData.punch_in_time && formData.punch_out_time) {
            const punchIn = dayjs(`${formData.date} ${formData.punch_in_time}`);
            const punchOut = dayjs(`${formData.date} ${formData.punch_out_time}`);
            
            if (punchOut.isAfter(punchIn)) {
                const duration = punchOut.diff(punchIn, 'minute');
                const hours = Math.floor(duration / 60);
                const minutes = duration % 60;
                return `${hours}h ${minutes}m`;
            }
        }
        return null;
    }, [formData.punch_in_time, formData.punch_out_time, formData.date]);

    // Handle form submission
    const handleSubmit = async (event) => {
        event.preventDefault();
        setProcessing(true);
        setErrors({});

        try {
            const submitData = {
                user_ids: formData.user_ids.map(id => parseInt(id)),
                date: formData.date,
                punch_in_time: formData.punch_in_time,
                punch_out_time: formData.punch_out_time || null,
                reason: formData.reason || 'Bulk marked present by administrator',
                location: formData.location
            };

            const promise = new Promise(async (resolve, reject) => {
                try {
                    const response = await axios.post(route('attendance.bulk-mark-as-present'), submitData);

                    if (response.status === 200) {
                        const { data, summary } = response.data;
                        
                        refreshTimeSheet();
                        closeModal();
                        
                        // Build summary message
                        const messages = [];
                        if (summary.successful > 0) {
                            messages.push(`Successfully marked ${summary.successful} employees as present`);
                        }
                        if (summary.failed > 0) {
                            messages.push(`${summary.failed} failed`);
                        }
                        if (summary.skipped > 0) {
                            messages.push(`${summary.skipped} skipped (already present)`);
                        }
                        
                        resolve([messages.join('. ')]);
                    }
                } catch (error) {
                    if (error.response?.status === 422) {
                        setErrors(error.response.data.errors || {});
                        reject([error.response.data.message || 'Please check the form for errors']);
                    } else {
                        reject([error.response?.data?.message || 'Failed to bulk mark users as present']);
                    }
                }
            });

            showToast.promise(promise, {
                loading: 'Marking employees as present...',
                success: (data) => data[0],
                error: (data) => data[0],
            });
        } catch (error) {
            console.error('Bulk mark present error:', error);
        } finally {
            setProcessing(false);
        }
    };

    // Get selected users details
    const selectedUserDetails = availableUsers.filter(user => 
        formData.user_ids.includes(user.id.toString())
    );

    return (
        <Modal 
            isOpen={open} 
            onClose={closeModal}
            size="4xl"
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
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                    <UserGroupIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                                    <span className="text-lg font-semibold" style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}>
                                        Bulk Mark as Present
                                    </span>
                                </div>
                                <Chip 
                                    variant="bordered"
                                    size="sm"
                                    style={{
                                        borderColor: `var(--theme-primary)`,
                                        color: `var(--theme-primary)`,
                                    }}
                                >
                                    {formData.user_ids.length} selected
                                </Chip>
                            </div>
                        </ModalHeader>
                        
                        <form onSubmit={handleSubmit}>
                            <ModalBody className="py-4 px-4 sm:py-6 sm:px-6" style={{
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}>
                                <div className="space-y-6">
                                    {/* Date and Time Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <CalendarDaysIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                                                <h3 className="text-base font-semibold" style={{ color: 'var(--theme-foreground)' }}>
                                                    Date & Time Configuration
                                                </h3>
                                            </div>
                                            {workDuration && (
                                                <span className="text-sm px-2 py-1 rounded-md bg-success/10 text-success">
                                                    Duration: {workDuration}
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Date */}
                                            <Input
                                                label="Date"
                                                type="date"
                                                value={formData.date}
                                                onValueChange={(value) => handleFieldChange('date', value)}
                                                isInvalid={Boolean(errors.date)}
                                                errorMessage={errors.date}
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

                                            {/* Punch In Time */}
                                            <Input
                                                label="Punch In Time"
                                                type="time"
                                                value={formData.punch_in_time}
                                                onValueChange={(value) => handleFieldChange('punch_in_time', value)}
                                                isInvalid={Boolean(errors.punch_in_time)}
                                                errorMessage={errors.punch_in_time}
                                                variant="bordered"
                                                size="sm"
                                                radius={getThemeRadius()}
                                                startContent={<ClockIcon className="w-4 h-4 text-default-400" />}
                                                classNames={{
                                                    input: "text-small",
                                                    inputWrapper: "min-h-unit-10"
                                                }}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                            />

                                            {/* Punch Out Time */}
                                            <Input
                                                label="Punch Out Time (Optional)"
                                                type="time"
                                                value={formData.punch_out_time}
                                                onValueChange={(value) => handleFieldChange('punch_out_time', value)}
                                                isInvalid={Boolean(errors.punch_out_time)}
                                                errorMessage={errors.punch_out_time}
                                                variant="bordered"
                                                size="sm"
                                                radius={getThemeRadius()}
                                                startContent={<ClockIcon className="w-4 h-4 text-default-400" />}
                                                classNames={{
                                                    input: "text-small",
                                                    inputWrapper: "min-h-unit-10"
                                                }}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                                description="Leave empty if employees are still working"
                                            />
                                        </div>
                                    </div>

                                    <Divider style={{ background: `var(--theme-divider)` }} />

                                    {/* Employee Selection Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <UserGroupIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                                                <h3 className="text-base font-semibold" style={{ color: 'var(--theme-foreground)' }}>
                                                    Select Employees ({formData.user_ids.length} of {availableUsers.length})
                                                </h3>
                                            </div>
                                            <Checkbox
                                                isSelected={selectAll}
                                                onValueChange={handleSelectAll}
                                                color="primary"
                                                size="sm"
                                            >
                                                Select All
                                            </Checkbox>
                                        </div>
                                        
                                        <Card>
                                            <CardBody className="p-4">
                                                <ScrollShadow className="max-h-64">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {availableUsers.map((user) => (
                                                            <div 
                                                                key={user.id}
                                                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-default-50"
                                                            >
                                                                <Checkbox
                                                                    isSelected={formData.user_ids.includes(user.id.toString())}
                                                                    onValueChange={(checked) => handleUserSelection(user.id, checked)}
                                                                    color="primary"
                                                                    size="sm"
                                                                />
                                                                <User
                                                                    avatarProps={{
                                                                        size: "sm",
                                                                        src: user.profile_image_url,
                                                                        showFallback: true,
                                                                        name: user.name,
                                                                    }}
                                                                    description={`ID: ${user.employee_id}`}
                                                                    name={user.name}
                                                                    classNames={{
                                                                        name: "text-sm",
                                                                        description: "text-xs"
                                                                    }}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </ScrollShadow>
                                            </CardBody>
                                        </Card>
                                        
                                        {errors.user_ids && (
                                            <p className="text-danger text-sm">{errors.user_ids}</p>
                                        )}
                                    </div>

                                    <Divider style={{ background: `var(--theme-divider)` }} />

                                    {/* Additional Information Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <InformationCircleIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                                            <h3 className="text-base font-semibold" style={{ color: 'var(--theme-foreground)' }}>
                                                Additional Information
                                            </h3>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 gap-4">
                                            {/* Location */}
                                            <Input
                                                label="Location"
                                                value={formData.location}
                                                onValueChange={(value) => handleFieldChange('location', value)}
                                                isInvalid={Boolean(errors.location)}
                                                errorMessage={errors.location}
                                                variant="bordered"
                                                size="sm"
                                                radius={getThemeRadius()}
                                                startContent={<MapPinIcon className="w-4 h-4 text-default-400" />}
                                                classNames={{
                                                    input: "text-small",
                                                    inputWrapper: "min-h-unit-10"
                                                }}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                            />

                                            {/* Reason */}
                                            <Textarea
                                                label="Reason (Optional)"
                                                placeholder="Reason for bulk marking employees as present..."
                                                value={formData.reason}
                                                onValueChange={(value) => handleFieldChange('reason', value)}
                                                isInvalid={Boolean(errors.reason)}
                                                errorMessage={errors.reason}
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

                                    {/* Preview Section */}
                                    {selectedUserDetails.length > 0 && (
                                        <div 
                                            className="p-4 rounded-lg border"
                                            style={{
                                                backgroundColor: 'var(--theme-content2)',
                                                borderColor: 'var(--theme-divider)',
                                                borderRadius: `var(--borderRadius, 12px)`,
                                            }}
                                        >
                                            <div className="flex items-start gap-3">
                                                <InformationCircleIcon className="w-5 h-5 mt-0.5" style={{ color: 'var(--theme-primary)' }} />
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-sm mb-2" style={{ color: 'var(--theme-foreground)' }}>
                                                        Preview - {selectedUserDetails.length} employee{selectedUserDetails.length !== 1 ? 's' : ''} will be marked present
                                                    </h4>
                                                    <p className="text-xs mb-3" style={{ color: 'var(--theme-foreground-600)' }}>
                                                        Date: {dayjs(formData.date).format('MMM D, YYYY')} | 
                                                        Time: {formData.punch_in_time}{formData.punch_out_time && ` to ${formData.punch_out_time}`}
                                                        {workDuration && ` (${workDuration})`}
                                                    </p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {selectedUserDetails.slice(0, 10).map((user) => (
                                                            <Chip 
                                                                key={user.id}
                                                                size="sm"
                                                                variant="flat"
                                                                color="primary"
                                                            >
                                                                {user.name}
                                                            </Chip>
                                                        ))}
                                                        {selectedUserDetails.length > 10 && (
                                                            <Chip 
                                                                size="sm"
                                                                variant="flat"
                                                                color="default"
                                                            >
                                                                +{selectedUserDetails.length - 10} more
                                                            </Chip>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
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
                                    isDisabled={processing || formData.user_ids.length === 0}
                                    radius={getThemeRadius()}
                                    size="sm"
                                    style={{
                                        borderRadius: `var(--borderRadius, 8px)`,
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}
                                >
                                    {processing ? 'Processing...' : `Mark ${formData.user_ids.length} Employee${formData.user_ids.length !== 1 ? 's' : ''} as Present`}
                                </Button>
                            </ModalFooter>
                        </form>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default BulkMarkAsPresentForm;
