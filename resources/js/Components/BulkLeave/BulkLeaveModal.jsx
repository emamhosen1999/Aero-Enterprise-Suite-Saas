import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
    Avatar,
    Button,
    Input,
    Select,
    SelectItem,
    Switch,
    Spinner,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter
} from "@heroui/react";
import { X } from 'lucide-react';
import { 
    CalendarDaysIcon, 
    ExclamationTriangleIcon,
    CheckCircleIcon,
    UserIcon
} from '@heroicons/react/24/outline';

import { usePage } from '@inertiajs/react';
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';
import DepartmentEmployeeSelector from "@/Components/DepartmentEmployeeSelector.jsx";
import BulkCalendar from './BulkCalendar';
import BulkValidationPreview from './BulkValidationPreview';

const BulkLeaveModal = ({ 
    open, 
    onClose, 
    onSuccess,
    allUsers = [],
    departments = [],
    leavesData = { leaveTypes: [], leaveCountsByUser: {} },
    isAdmin = false,
    existingLeaves = [],
    publicHolidays = []
}) => {
    const { auth } = usePage().props;

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
    const [selectedDates, setSelectedDates] = useState([]);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [selectedLeaveType, setSelectedLeaveType] = useState('');
    const [reason, setReason] = useState('');
    const [allowPartialSuccess, setAllowPartialSuccess] = useState(false);
    
    // Dynamic leave types state (updated per user)
    const [userLeaveTypes, setUserLeaveTypes] = useState([]);
    const [loadingLeaveTypes, setLoadingLeaveTypes] = useState(false);
    
    // Validation state
    const [validationResults, setValidationResults] = useState([]);
    const [balanceImpact, setBalanceImpact] = useState(null);
    const [isValidating, setIsValidating] = useState(false);
    const [hasValidated, setHasValidated] = useState(false);
    
    // Submission state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // Filter existing leaves for the selected user (only used as fallback)
    const userExistingLeaves = useMemo(() => {
        if (!existingLeaves || existingLeaves.length === 0) return [];
        return existingLeaves.filter(leave => leave.user_id === parseInt(selectedUserId));
    }, [existingLeaves, selectedUserId]);

    // Available leave types and counts
    const leaveTypes = useMemo(() => {
        return userLeaveTypes.length > 0 ? userLeaveTypes : (leavesData?.leaveTypes || []);
    }, [userLeaveTypes, leavesData]);

    const leaveCounts = useMemo(() => {
        // If we have user-specific leave types with balance info, use that
        if (userLeaveTypes.length > 0) {
            return userLeaveTypes.map(type => ({
                leave_type: type.type,
                days_used: type.used,
                total_days: type.days,
                remaining_days: type.remaining
            }));
        }
        // Fallback to leavesData
        return leavesData?.leaveCountsByUser?.[selectedUserId] || [];
    }, [userLeaveTypes, leavesData, selectedUserId]);

    // Fetch leave types with balances for specific user
    const fetchUserLeaveTypes = useCallback(async (userId) => {
        if (!userId) return;
        
        setLoadingLeaveTypes(true);
        try {
            const response = await axios.get(route('leaves.bulk.leave-types'), {
                params: {
                    user_id: userId,
                    year: new Date().getFullYear()
                }
            });

            if (response.data.success) {
                setUserLeaveTypes(response.data.leave_types);
            }
        } catch (error) {
            console.error('Failed to fetch user leave types:', error);
            // Fallback to original leaveTypes
            setUserLeaveTypes([]);
        } finally {
            setLoadingLeaveTypes(false);
        }
    }, []);

    // Fetch leave types when user changes
    useEffect(() => {
        if (open && selectedUserId && isAdmin) {
            fetchUserLeaveTypes(selectedUserId);
        } else if (open && selectedUserId && !isAdmin) {
            // For non-admin users, also fetch their leave types
            fetchUserLeaveTypes(selectedUserId);
        }
    }, [selectedUserId, open, isAdmin, fetchUserLeaveTypes]);

    // Initialize form when modal opens for current user
    useEffect(() => {
        if (open && auth?.user) {
            // Auto-select current user's department and set user
            const currentUser = allUsers?.find(user => user.id === auth.user.id);
            if (currentUser && currentUser.department_id && !isAdmin) {
                setSelectedDepartmentId(currentUser.department_id);
                setSelectedUserId(auth.user.id);
            } else if (isAdmin && !selectedDepartmentId && !selectedUserId) {
                // For admin, set to current user as default
                if (currentUser && currentUser.department_id) {
                    setSelectedDepartmentId(currentUser.department_id);
                    setSelectedUserId(auth.user.id);
                }
            }
        }
    }, [open, auth?.user, allUsers, isAdmin, selectedDepartmentId, selectedUserId]);

    // Reset form when modal closes
    useEffect(() => {
        if (!open) {
            setSelectedDates([]);
            setSelectedDepartmentId(null);
            setSelectedUserId(auth?.user?.id || null);
            setSelectedLeaveType('');
            setReason('');
            setAllowPartialSuccess(false);
            setValidationResults([]);
            setBalanceImpact(null);
            setHasValidated(false);
            setErrors({});
            setUserLeaveTypes([]);
        }
    }, [open, auth?.user?.id]);

    // Set initial leave type when leave types are available (only for new requests)
    useEffect(() => {
        if (leaveTypes.length > 0 && !selectedLeaveType && open && selectedUserId) {
            // Find a leave type with remaining days for the selected user
            const availableLeaveType = leaveTypes.find(lt => {
                // For user-specific leave types (with balance info)
                if (userLeaveTypes.length > 0) {
                    return lt.remaining > 0;
                }
                // For fallback to leavesData
                const leaveCount = leaveCounts?.find(lc => lc.leave_type === lt.type);
                const remaining = leaveCount ? (lt.days - leaveCount.days_used) : lt.days;
                return remaining > 0;
            });
            
            if (availableLeaveType) {
                setSelectedLeaveType(availableLeaveType.type);
            }
        }
    }, [leaveTypes, leaveCounts, userLeaveTypes, selectedLeaveType, open, selectedUserId]);

    // Validate dates
    const handleValidate = useCallback(async () => {
        if (selectedDates.length === 0) {
            const toastPromise = Promise.reject(new Error('No dates selected'));
            showToast.promise(toastPromise, {
                error: 'Please select at least one date'
            });
            return;
        }
        
        if (!selectedLeaveType) {
            const toastPromise = Promise.reject(new Error('No leave type selected'));
            showToast.promise(toastPromise, {
                error: 'Please select a leave type'
            });
            return;
        }
        
        if (!reason.trim() || reason.trim().length < 5) {
            const toastPromise = Promise.reject('Please provide a reason for leave (at least 5 characters)');
            showToast.promise(toastPromise, {
                error: 'Please provide a reason for leave (at least 5 characters)'
            });
            return;
        }

        setIsValidating(true);
        setErrors({});
        
        try {
            const selectedLeaveTypeData = leaveTypes.find(lt => lt.type === selectedLeaveType);
            
            const response = await axios.post(route('leaves.bulk.validate'), {
                user_id: parseInt(selectedUserId),
                dates: selectedDates,
                leave_type_id: selectedLeaveTypeData?.id,
                reason: reason.trim()
            });

            if (response.data.success) {
                setValidationResults(response.data.validation_results);
                setBalanceImpact(response.data.estimated_balance_impact);
                setHasValidated(true);
                
                const conflictCount = response.data.validation_results.filter(r => r.status === 'conflict').length;
                const warningCount = response.data.validation_results.filter(r => r.status === 'warning').length;
                
                const toastPromise = Promise.resolve();
                if (conflictCount > 0) {
                    showToast.promise(toastPromise, {
                        success: `${conflictCount} date(s) have conflicts. Please review before submitting.`
                    });
                } else if (warningCount > 0) {
                    showToast.promise(toastPromise, {
                        success: `${warningCount} date(s) have warnings. You may proceed if acceptable.`
                    });
                } else {
                    showToast.promise(toastPromise, {
                        success: 'All dates validated successfully!'
                    });
                }
            }
        } catch (error) {
            console.error('Validation error:', error);
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors || {});
            }
            const toastPromise = Promise.reject(error);
            showToast.promise(toastPromise, {
                error: error.response?.data?.message || 'Failed to validate dates'
            });
        } finally {
            setIsValidating(false);
        }
    }, [selectedDates, selectedLeaveType, reason, selectedUserId, leaveTypes]);

    // Submit bulk leave request
    const handleSubmit = useCallback(async () => {
        if (!hasValidated) {
            const toastPromise = Promise.reject(new Error('Not validated'));
            showToast.promise(toastPromise, {
                error: 'Please validate dates before submitting'
            });
            return;
        }

        const conflictCount = validationResults.filter(r => r.status === 'conflict').length;
        if (conflictCount > 0 && !allowPartialSuccess) {
            const toastPromise = Promise.reject('Please resolve conflicts or enable partial success mode');
            showToast.promise(toastPromise, {
                error: 'Please resolve conflicts or enable partial success mode'
            });
            return;
        }

        setIsSubmitting(true);

        // Follow exact same promise pattern as LeaveForm
        const promise = new Promise(async (resolve, reject) => {
            try {
                const selectedLeaveTypeData = leaveTypes.find(lt => lt.type === selectedLeaveType);
                
                const response = await axios.post(route('leaves.bulk.store'), {
                    user_id: parseInt(selectedUserId),
                    dates: selectedDates,
                    leave_type_id: selectedLeaveTypeData?.id,
                    reason: reason.trim(),
                    allow_partial_success: allowPartialSuccess
                });

             

                if (response.status === 200 || response.status === 201) {
                    // Pass the response data to parent component for optimized updates
                    // Follow the same pattern as single leave form
                    onSuccess?.(response.data);
                    onClose();
                    resolve([response.data.message || 'Bulk leave requests created successfully']);
                } else {
                    console.error('Unexpected response status:', response.status);
                    reject(`Unexpected response status: ${response.status}`);
                }
            } catch (error) {
                console.error('Full error object:', error);

                if (error.response) {
                    console.error('Error response status:', error.response.status);
                    console.error('Error response data:', error.response.data);
                    
                    if (error.response.status === 422) {
                        // Handle validation errors
                        setErrors(error.response.data.errors || {});
                        reject(error.response.data.error || 'Failed to submit bulk leave requests');
                    } else {
                        // Handle other HTTP errors
                        reject(`HTTP Error ${error.response.status}: ${error.response.data.message || 'An unexpected error occurred. Please try again later.'}`);
                    }
                } else if (error.request) {
                    console.error('No response received:', error.request);
                    reject('No response received from the server. Please check your internet connection.');
                } else {
                    console.error('Request setup error:', error.message);
                    reject('An error occurred while setting up the request.');
                }
            } finally {
                setIsSubmitting(false);
            }
        });

        // Use exact same toast promise structure as LeaveForm
        showToast.promise(
            promise,
            {
                pending: 'Creating bulk leave requests...',
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
    }, [hasValidated, validationResults, allowPartialSuccess, selectedUserId, selectedDates, selectedLeaveType, reason, onSuccess, onClose, leaveTypes]);

    // Check if form is valid for validation
    const canValidate = selectedDates.length > 0 && selectedLeaveType && reason.trim().length >= 5;
    
    // Check if can submit
    const canSubmit = hasValidated && 
                     (validationResults.filter(r => r.status === 'conflict').length === 0 || allowPartialSuccess);

    return (
        <Modal 
            isOpen={open} 
            onClose={onClose}
            size="5xl"
            radius={getThemeRadius()}
            scrollBehavior="inside"
            classNames={{
                base: "backdrop-blur-md max-h-[95vh] my-2",
                backdrop: "bg-black/50 backdrop-blur-sm",
                header: "border-b border-divider flex-shrink-0",
                body: "overflow-y-auto max-h-[calc(95vh-160px)]",
                footer: "border-t border-divider flex-shrink-0",
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
                        <ModalHeader className="flex flex-col gap-1 py-4" style={{
                            borderColor: `var(--theme-divider, #E4E4E7)`,
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}>
                            <div className="flex items-center gap-2">
                                <CalendarDaysIcon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: 'var(--theme-primary)' }} />
                                <div>
                                    <span className="text-lg font-semibold" style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}>
                                        Add Bulk Leave
                                    </span>
                                    <p className="text-sm text-default-500 mt-0.5" style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}>
                                        Select multiple dates and create leave requests in batch
                                    </p>
                                </div>
                            </div>
                        </ModalHeader>
                        
                        <ModalBody className="py-4 px-4 sm:py-6 sm:px-6 overflow-y-auto" style={{
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                    {/* Left Column: Calendar */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{
                            color: `var(--theme-foreground-900, #18181B)`,
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}>
                            <CalendarDaysIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                            Select Dates
                        </h3>
                        <BulkCalendar
                            selectedDates={selectedDates}
                            onDatesChange={(dates) => {
                                setSelectedDates(dates);
                                setHasValidated(false); // Reset validation when dates change
                            }}
                            userId={selectedUserId}
                            fetchFromAPI={true} // Enable API-driven data fetching
                        />
                    </div>
                    
                    {/* Right Column: Form and Validation */}
                    <div>
                        <div className="flex flex-col gap-4">
                            {/* Form Controls */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{
                                    color: `var(--theme-foreground-900, #18181B)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}>
                                    <UserIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                                    Leave Details
                                </h3>
                                
                                <div className="flex flex-col gap-4">
                                    {/* Department & User Selection (Admin only) */}
                                    {isAdmin && allUsers.length > 0 && (
                                        <DepartmentEmployeeSelector
                                            selectedDepartmentId={selectedDepartmentId}
                                            selectedEmployeeId={selectedUserId}
                                            onDepartmentChange={setSelectedDepartmentId}
                                            onEmployeeChange={(empId) => {
                                                setSelectedUserId(empId);
                                                setSelectedLeaveType(''); // Reset leave type when user changes
                                                setHasValidated(false);
                                                setUserLeaveTypes([]); // Clear current user leave types
                                            }}
                                            allUsers={allUsers}
                                            departments={departments}
                                            showSearch={true}
                                            error={errors}
                                            variant="outlined"
                                            showAllOption={false}
                                            autoSelectFirstDepartment={false} // Let our initialization effect handle this
                                            required={true}
                                            disabled={isSubmitting || isValidating}
                                        />
                                    )}

                                    {/* Leave Type Selection */}
                                    <div>
                                        <Select
                                            label="Leave Type"
                                            placeholder="Select Leave Type"
                                            selectionMode="single"
                                            selectedKeys={selectedLeaveType ? new Set([selectedLeaveType]) : new Set()}
                                            onSelectionChange={(keys) => {
                                                const value = Array.from(keys)[0];
                                                setSelectedLeaveType(value || '');
                                                setHasValidated(false);
                                            }}
                                            isDisabled={isSubmitting || isValidating || loadingLeaveTypes}
                                            isInvalid={Boolean(errors.leave_type_id)}
                                            errorMessage={errors.leave_type_id}
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
                                            {loadingLeaveTypes ? (
                                                <SelectItem key="loading" isDisabled>
                                                    Loading leave types...
                                                </SelectItem>
                                            ) : (
                                                leaveTypes.map((type) => {
                                                    // Handle both new structure (with balance info) and old structure
                                                    let remaining, isDisabled;
                                                    
                                                    if (userLeaveTypes.length > 0) {
                                                        // New structure with balance info
                                                        remaining = type.remaining;
                                                        isDisabled = remaining <= 0;
                                                    } else {
                                                        // Fallback to old structure
                                                        const leaveCount = leaveCounts?.find(lc => lc.leave_type === type.type);
                                                        remaining = leaveCount ? (type.days - leaveCount.days_used) : type.days;
                                                        isDisabled = remaining <= 0;
                                                    }
                                                    
                                                    return (
                                                        <SelectItem 
                                                            key={type.type} 
                                                            value={type.type}
                                                            isDisabled={isDisabled}
                                                            title={isDisabled ? 'No remaining leaves available' : ''}
                                                            textValue={type.type}
                                                        >
                                                            <div className="flex justify-between w-full">
                                                                <span>{type.type}</span>
                                                                <span>
                                                                    ({remaining} remaining)
                                                                </span>
                                                            </div>
                                                        </SelectItem>
                                                    );
                                                })
                                            )}
                                        </Select>
                                    </div>

                                    {/* Remaining Leaves Display */}
                                    {selectedLeaveType && (
                                        <Input
                                            label="Remaining Leaves"
                                            value={(() => {
                                                const selectedType = leaveTypes.find(lt => lt.type === selectedLeaveType);
                                                
                                                // Handle both new structure (with balance info) and old structure
                                                let remaining, totalDays;
                                                
                                                if (userLeaveTypes.length > 0 && selectedType) {
                                                    // New structure with balance info
                                                    remaining = selectedType.remaining;
                                                    totalDays = selectedType.days;
                                                } else {
                                                    // Fallback to old structure
                                                    const leaveCount = leaveCounts?.find(lc => lc.leave_type === selectedLeaveType);
                                                    remaining = leaveCount ? (selectedType?.days - leaveCount.days_used) : selectedType?.days;
                                                    totalDays = selectedType?.days;
                                                }
                                                
                                                return `${remaining || 0} remaining of ${totalDays || 0} total`;
                                            })()}
                                            isReadOnly
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
                                    )}

                                    {/* Reason */}
                                    <Input
                                        label="Reason for Leave"
                                        placeholder="Please provide a detailed reason for your leave request..."
                                        value={reason}
                                        onChange={(e) => {
                                            setReason(e.target.value);
                                            setHasValidated(false);
                                        }}
                                        isRequired
                                        isInvalid={Boolean(errors.reason) || (reason.length > 0 && reason.length < 5)}
                                        errorMessage={
                                            errors.reason || 
                                            (reason.length > 0 && reason.length < 5 ? "Reason must be at least 5 characters" : 
                                            `${reason.length}/500 characters`)
                                        }
                                        maxLength={500}
                                        isDisabled={isSubmitting || isValidating}
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

                                    {/* Options */}
                                    <div className="flex items-start gap-3">
                                        <Switch
                                            isSelected={allowPartialSuccess}
                                            onValueChange={setAllowPartialSuccess}
                                            size="sm"
                                            isDisabled={isSubmitting || isValidating}
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                Allow partial success
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Valid dates will be processed even if some dates fail validation
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Summary Information */}
                            {selectedDates.length > 0 && (
                                <div 
                                    className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                                    style={{
                                        borderRadius: `var(--borderRadius, 12px)`,
                                        border: `var(--borderWidth, 2px) solid var(--theme-divider, #E4E4E7)`,
                                        background: `linear-gradient(135deg, 
                                            color-mix(in srgb, var(--theme-content1) 30%, transparent) 20%, 
                                            color-mix(in srgb, var(--theme-content2) 20%, transparent) 10%)`,
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}
                                >
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2" style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}>
                                        Selected Dates Summary
                                    </p>
                                    <p className="text-base font-medium text-gray-900 dark:text-white" style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}>
                                        <strong>{selectedDates.length}</strong> date{selectedDates.length !== 1 ? 's' : ''} selected
                                    </p>
                                    {selectedLeaveType && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400" style={{
                                            fontFamily: `var(--fontFamily, "Inter")`,
                                        }}>
                                            Leave type: {selectedLeaveType}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Validation and Preview */}
                            <BulkValidationPreview
                                validationResults={validationResults}
                                balanceImpact={balanceImpact}
                                isValidating={isValidating}
                            />
                        </div>
                    </div>
                </div>
                        </ModalBody>
                        
                        <ModalFooter className="flex flex-col sm:flex-row justify-between items-center gap-2 px-4 sm:px-6 py-3 sm:py-4" style={{
                            borderColor: `var(--theme-divider, #E4E4E7)`,
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}>
                            <Button 
                                variant="light" 
                                onPress={onClose}
                                isDisabled={isSubmitting}
                                radius={getThemeRadius()}
                                className="w-full sm:w-auto order-2 sm:order-1"
                                style={{
                                    borderRadius: `var(--borderRadius, 8px)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}
                            >
                                Cancel
                            </Button>
                            
                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto order-1 sm:order-2">
                                <Button
                                    variant="bordered"
                                    color="primary"
                                    onPress={handleValidate}
                                    isLoading={isValidating}
                                    isDisabled={!canValidate || isSubmitting}
                                    startContent={!isValidating && <ExclamationTriangleIcon className="w-4 h-4" />}
                                    radius={getThemeRadius()}
                                    className="w-full sm:w-auto"
                                    style={{
                                        borderRadius: `var(--borderRadius, 8px)`,
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}
                                >
                                    <span className="truncate">
                                        {isValidating ? 'Validating...' : 'Validate Dates'}
                                    </span>
                                </Button>
                                
                                <Button
                                    variant="solid"
                                    color="primary"
                                    onPress={handleSubmit}
                                    isLoading={isSubmitting}
                                    isDisabled={!canSubmit || isValidating}
                                    startContent={!isSubmitting && <CheckCircleIcon className="w-4 h-4" />}
                                    radius={getThemeRadius()}
                                    className="w-full sm:w-auto"
                                    style={{
                                        borderRadius: `var(--borderRadius, 8px)`,
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}
                                >
                                    <span className="truncate">
                                        {isSubmitting ? 'Creating...' : `Create ${selectedDates.length} Leave${selectedDates.length !== 1 ? 's' : ''}`}
                                    </span>
                                </Button>
                            </div>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default BulkLeaveModal;
