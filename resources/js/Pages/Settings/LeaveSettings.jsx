import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Head, usePage } from "@inertiajs/react";
import App from "@/Layouts/App";
import { motion } from "framer-motion";
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';
import {
    Card,
    CardHeader,
    CardBody,
    Button,
    Input,
    Switch,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Tooltip,
    ScrollShadow,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Spinner,
} from "@heroui/react";
import {
    PlusIcon,
    ClockIcon,
    CalendarDaysIcon,
    UserGroupIcon,
    ArrowPathIcon,
    InformationCircleIcon,
    PencilIcon,
    TrashIcon,
    XCircleIcon,
    CogIcon,
    DocumentTextIcon,
    MagnifyingGlassIcon,
    CheckCircleIcon,
} from "@heroicons/react/24/outline";
import {
    CheckCircleIcon as CheckCircleSolid,
    XCircleIcon as XCircleSolid,
} from "@heroicons/react/24/solid";

const LeaveSettings = () => {
    const { title, leaveTypes: initialLeaveTypes } = usePage().props;
    
    // Custom media queries (following LeavesAdmin pattern)
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
            setIsTablet(window.innerWidth < 768);
        };
        
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // State management
    const [leaveTypes, setLeaveTypes] = useState(initialLeaveTypes || []);
    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [deleteCandidate, setDeleteCandidate] = useState(null);

    // Delete modal
    const {
        isOpen: isDeleteModalOpen,
        onOpen: onDeleteModalOpen,
        onClose: onDeleteModalClose
    } = useDisclosure();

    // Initial leave type structure
    const initialLeaveType = {
        type: '',
        days: '',
        eligibility: '',
        carry_forward: false,
        earned_leave: false,
        requires_approval: true,
        auto_approve: false,
        special_conditions: '',
    };

    const [newLeaveType, setNewLeaveType] = useState(initialLeaveType);

    // Helper function to convert theme borderRadius to HeroUI radius values (following LeavesAdmin pattern)
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

    // Form validation
    const isFormValid = useMemo(() => {
        return newLeaveType.type.trim() && 
               newLeaveType.days && 
               parseInt(newLeaveType.days) > 0;
    }, [newLeaveType]);

    // Filtered leave types based on search
    const filteredLeaveTypes = useMemo(() => {
        if (!searchValue) return leaveTypes;
        return leaveTypes.filter(leave => 
            leave.type.toLowerCase().includes(searchValue.toLowerCase()) ||
            leave.eligibility?.toLowerCase().includes(searchValue.toLowerCase())
        );
    }, [leaveTypes, searchValue]);

    // Handle input change for adding/editing leave types
    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setNewLeaveType(prev => ({
            ...prev,
            [name]: value,
        }));
    }, []);

    // Handle switch changes
    const handleSwitchChange = useCallback((name, value) => {
        setNewLeaveType(prev => ({
            ...prev,
            [name]: value,
        }));
    }, []);

    // Reset form
    const resetForm = useCallback(() => {
        setNewLeaveType(initialLeaveType);
        setIsEditing(false);
    }, []);

    // Add a new leave type
    const addLeaveType = async () => {
        if (!isFormValid) {
            showToast.error('Please fill in all required fields');
            return;
        }

        setLoading(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post('/add-leave-type', newLeaveType);

                if (response.status === 201) {
                    setLeaveTypes(prev => [...prev, { ...newLeaveType, id: response.data.id }]);
                    resetForm();
                    resolve(['Leave type added successfully.']);
                } else {
                    reject(['Failed to add leave type. Please try again.']);
                }
            } catch (error) {
                console.error(error);
                reject([error.response?.data?.message || 'Failed to add leave type. Please try again.']);
            } finally {
                setLoading(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Adding leave type...',
            success: (data) => data.map((message, index) => message).join(', '),
            error: (data) => data,
        });
    };

    // Edit existing leave type
    const editLeaveType = useCallback((id) => {
        const leaveType = leaveTypes.find((lt) => lt.id === id);
        if (leaveType) {
            setNewLeaveType({
                ...leaveType,
                carry_forward: Boolean(leaveType.carry_forward),
                earned_leave: Boolean(leaveType.earned_leave),
                requires_approval: Boolean(leaveType.requires_approval ?? true),
                auto_approve: Boolean(leaveType.auto_approve)
            });
            setIsEditing(true);
        }
    }, [leaveTypes]);

    // Update leave type after editing
    const updateLeaveType = async () => {
        if (!isFormValid) {
            showToast.error('Please fill in all required fields');
            return;
        }

        setLoading(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.put(`/update-leave-type/${newLeaveType.id}`, newLeaveType);

                if (response.status === 200) {
                    const updatedLeaveTypes = leaveTypes.map((lt) =>
                        lt.id === newLeaveType.id ? { ...newLeaveType } : lt
                    );
                    setLeaveTypes(updatedLeaveTypes);
                    resetForm();
                    resolve(['Leave type updated successfully.']);
                } else {
                    reject(['Failed to update leave type. Please try again.']);
                }
            } catch (error) {
                console.error(error);
                reject([error.response?.data?.message || 'Failed to update leave type. Please try again.']);
            } finally {
                setLoading(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Updating leave type...',
            success: (data) => data.map((message) => message).join(', '),
            error: (data) => data,
        });
    };

    // Prepare for delete
    const prepareDelete = useCallback((leave) => {
        setDeleteCandidate(leave);
        onDeleteModalOpen();
    }, [onDeleteModalOpen]);

    // Delete leave type
    const deleteLeaveType = async () => {
        if (!deleteCandidate) return;

        setDeleteLoading(deleteCandidate.id);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(`/delete-leave-type/${deleteCandidate.id}`);

                if (response.status === 200) {
                    setLeaveTypes(prev => prev.filter((lt) => lt.id !== deleteCandidate.id));
                    onDeleteModalClose();
                    setDeleteCandidate(null);
                    resolve([response.data.message || 'Leave type deleted successfully.']);
                } else {
                    reject(['Failed to delete leave type. Please try again.']);
                }
            } catch (error) {
                console.error(error);
                reject([error.response?.data?.message || 'Failed to delete leave type. Please try again.']);
            } finally {
                setDeleteLoading(null);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting leave type...',
            success: (data) => data.map((message) => message).join(', '),
            error: (data) => data,
        });
    };

    return (
        <>
            <Head title={title} />
            <div 
                className="flex flex-col w-full h-full p-4"
                role="main"
                aria-label="Leave Settings Management"
            >
                <div className="space-y-4">
                    {/* Form Section */}
                    <div className="w-full">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card 
                                className="transition-all duration-200"
                                style={{
                                    border: `var(--borderWidth, 2px) solid transparent`,
                                    borderRadius: `var(--borderRadius, 12px)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                    transform: `scale(var(--scale, 1))`,
                                    background: `linear-gradient(135deg, 
                                        var(--theme-content1, #FAFAFA) 20%, 
                                        var(--theme-content2, #F4F4F5) 10%, 
                                        var(--theme-content3, #F1F3F4) 20%)`,
                                }}
                            >
                                <CardHeader 
                                    className="border-b p-0"
                                    style={{
                                        borderColor: `var(--theme-divider, #E4E4E7)`,
                                        background: `linear-gradient(135deg, 
                                            color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, 
                                            color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
                                    }}
                                >
                                    <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            {/* Title Section */}
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div 
                                                    className={`
                                                        ${!isMobile ? 'p-3' : 'p-2'} 
                                                        rounded-xl flex items-center justify-center
                                                    `}
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderColor: `color-mix(in srgb, var(--theme-primary) 25%, transparent)`,
                                                        borderWidth: `var(--borderWidth, 2px)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <CogIcon 
                                                        className={`
                                                            ${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}
                                                        `}
                                                        style={{ color: 'var(--theme-primary)' }}
                                                    />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 
                                                        className={`
                                                            ${!isMobile ? 'text-2xl' : 'text-xl'}
                                                            font-bold text-foreground
                                                            ${isMobile ? 'truncate' : ''}
                                                        `}
                                                        style={{
                                                            fontFamily: `var(--fontFamily, "Inter")`,
                                                        }}
                                                    >
                                                        Leave Settings
                                                    </h4>
                                                    <p 
                                                        className={`
                                                            ${!isMobile ? 'text-sm' : 'text-xs'} 
                                                            text-default-500
                                                            ${isMobile ? 'truncate' : ''}
                                                        `}
                                                        style={{
                                                            fontFamily: `var(--fontFamily, "Inter")`,
                                                        }}
                                                    >
                                                        Configure leave types, policies, and allocation rules
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Action Buttons */}
                                            <div className="flex gap-2 flex-wrap">
                                                <Chip
                                                    startContent={<UserGroupIcon className="w-4 h-4" />}
                                                    variant="flat"
                                                    color="primary"
                                                    size="sm"
                                                    className="font-medium"
                                                >
                                                    {leaveTypes.length} Leave Types
                                                </Chip>
                                                <Button
                                                    color="default"
                                                    variant="bordered"
                                                    startContent={<ArrowPathIcon className="w-4 h-4" />}
                                                    onPress={() => window.location.reload()}
                                                    size={isMobile ? "sm" : "md"}
                                                    className="font-semibold"
                                                    style={{
                                                        borderRadius: `var(--borderRadius, 8px)`,
                                                        fontFamily: `var(--fontFamily, "Inter")`,
                                                    }}
                                                    aria-label="Refresh leave types"
                                                >
                                                    {!isMobile && 'Refresh'}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* Form Section */}
                                    <div className="space-y-6">
                                        {/* Form Header */}
                                        <div className="flex items-center gap-3">
                                            <div 
                                                className={`
                                                    ${!isMobile ? 'p-2' : 'p-1.5'} 
                                                    rounded-lg flex items-center justify-center
                                                `}
                                                style={{
                                                    background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                    borderColor: `color-mix(in srgb, var(--theme-primary) 25%, transparent)`,
                                                    borderWidth: `var(--borderWidth, 1px)`,
                                                    borderRadius: `var(--borderRadius, 8px)`,
                                                }}
                                            >
                                                <PlusIcon 
                                                    className="w-5 h-5"
                                                    style={{ color: 'var(--theme-primary)' }}
                                                />
                                            </div>
                                            <div>
                                                <h2 
                                                    className="text-lg font-semibold text-foreground"
                                                    style={{
                                                        fontFamily: `var(--fontFamily, "Inter")`,
                                                    }}
                                                >
                                                    {isEditing ? 'Edit Leave Type' : 'Add New Leave Type'}
                                                </h2>
                                                <p 
                                                    className="text-sm text-default-500"
                                                    style={{
                                                        fontFamily: `var(--fontFamily, "Inter")`,
                                                    }}
                                                >
                                                    {isEditing ? 'Update the leave type details' : 'Configure a new leave type with policies and rules'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Form Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {/* Leave Type */}
                                            <Input
                                                label="Leave Type"
                                                placeholder="e.g., Annual Leave, Sick Leave"
                                                name="type"
                                                value={newLeaveType.type}
                                                onChange={handleInputChange}
                                                variant="bordered"
                                                size={isMobile ? "sm" : "md"}
                                                radius={getThemeRadius()}
                                                isRequired
                                                startContent={<ClockIcon className="w-4 h-4 text-default-400" />}
                                                aria-label="Enter leave type name"
                                                classNames={{
                                                    input: "text-sm",
                                                }}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                            />

                                            {/* Number of Days */}
                                            <Input
                                                label="Number of Days"
                                                placeholder="e.g., 21"
                                                name="days"
                                                type="number"
                                                min="0"
                                                value={newLeaveType.days}
                                                onChange={handleInputChange}
                                                variant="bordered"
                                                size={isMobile ? "sm" : "md"}
                                                radius={getThemeRadius()}
                                                isRequired
                                                startContent={<CalendarDaysIcon className="w-4 h-4 text-default-400" />}
                                                aria-label="Enter number of days allocated"
                                                classNames={{
                                                    input: "text-sm",
                                                }}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                            />

                                            {/* Eligibility Criteria */}
                                            <Input
                                                label="Eligibility Criteria"
                                                placeholder="e.g., After 1 year of service"
                                                name="eligibility"
                                                value={newLeaveType.eligibility}
                                                onChange={handleInputChange}
                                                variant="bordered"
                                                size={isMobile ? "sm" : "md"}
                                                radius={getThemeRadius()}
                                                startContent={<UserGroupIcon className="w-4 h-4 text-default-400" />}
                                                aria-label="Enter eligibility criteria"
                                                classNames={{
                                                    input: "text-sm",
                                                }}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                            />

                                            {/* Carry Forward */}
                                            <div 
                                                className="p-4 bg-white/5 backdrop-blur-md border border-white/10"
                                                style={{
                                                    borderRadius: `var(--borderRadius, 8px)`,
                                                }}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <ArrowPathIcon className="w-4 h-4 text-default-400" />
                                                        <div>
                                                            <p 
                                                                className="text-sm font-medium text-foreground"
                                                                style={{
                                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                                }}
                                                            >
                                                                Carry Forward
                                                            </p>
                                                            <p 
                                                                className="text-xs text-default-500"
                                                                style={{
                                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                                }}
                                                            >
                                                                Allow unused days to next year
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Switch
                                                        isSelected={newLeaveType.carry_forward}
                                                        onValueChange={(value) => handleSwitchChange('carry_forward', value)}
                                                        color="warning"
                                                        size="sm"
                                                        aria-label="Toggle carry forward policy"
                                                    />
                                                </div>
                                            </div>

                                            {/* Earned Leave */}
                                            <div 
                                                className="p-4 bg-white/5 backdrop-blur-md border border-white/10"
                                                style={{
                                                    borderRadius: `var(--borderRadius, 8px)`,
                                                }}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <ClockIcon className="w-4 h-4 text-default-400" />
                                                        <div>
                                                            <p 
                                                                className="text-sm font-medium text-foreground"
                                                                style={{
                                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                                }}
                                                            >
                                                                Earned Leave
                                                            </p>
                                                            <p 
                                                                className="text-xs text-default-500"
                                                                style={{
                                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                                }}
                                                            >
                                                                Accumulated over time
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Switch
                                                        isSelected={newLeaveType.earned_leave}
                                                        onValueChange={(value) => handleSwitchChange('earned_leave', value)}
                                                        color="success"
                                                        size="sm"
                                                        aria-label="Toggle earned leave policy"
                                                    />
                                                </div>
                                            </div>

                                            {/* Requires Approval */}
                                            <div 
                                                className="p-4 bg-white/5 backdrop-blur-md border border-white/10"
                                                style={{
                                                    borderRadius: `var(--borderRadius, 8px)`,
                                                }}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircleIcon className="w-4 h-4 text-default-400" />
                                                        <div>
                                                            <p 
                                                                className="text-sm font-medium text-foreground"
                                                                style={{
                                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                                }}
                                                            >
                                                                Requires Approval
                                                            </p>
                                                            <p 
                                                                className="text-xs text-default-500"
                                                                style={{
                                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                                }}
                                                            >
                                                                Manager approval needed
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Switch
                                                        isSelected={newLeaveType.requires_approval}
                                                        onValueChange={(value) => handleSwitchChange('requires_approval', value)}
                                                        color="primary"
                                                        size="sm"
                                                        aria-label="Toggle approval requirement"
                                                    />
                                                </div>
                                            </div>

                                            {/* Auto Approve */}
                                            <div 
                                                className="p-4 bg-white/5 backdrop-blur-md border border-white/10"
                                                style={{
                                                    borderRadius: `var(--borderRadius, 8px)`,
                                                }}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircleIcon className="w-4 h-4 text-default-400" />
                                                        <div>
                                                            <p 
                                                                className="text-sm font-medium text-foreground"
                                                                style={{
                                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                                }}
                                                            >
                                                                Auto Approve
                                                            </p>
                                                            <p 
                                                                className="text-xs text-default-500"
                                                                style={{
                                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                                }}
                                                            >
                                                                Skip approval workflow
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Switch
                                                        isSelected={newLeaveType.auto_approve}
                                                        onValueChange={(value) => handleSwitchChange('auto_approve', value)}
                                                        color="success"
                                                        size="sm"
                                                        aria-label="Toggle auto approval"
                                                        isDisabled={!newLeaveType.requires_approval}
                                                    />
                                                </div>
                                            </div>

                                            {/* Special Conditions */}
                                            <Input
                                                label="Special Conditions"
                                                placeholder="e.g., Medical certificate required"
                                                name="special_conditions"
                                                value={newLeaveType.special_conditions}
                                                onChange={handleInputChange}
                                                variant="bordered"
                                                size={isMobile ? "sm" : "md"}
                                                radius={getThemeRadius()}
                                                startContent={<InformationCircleIcon className="w-4 h-4 text-default-400" />}
                                                aria-label="Enter special conditions"
                                                classNames={{
                                                    input: "text-sm",
                                                }}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                            />
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                                            {isEditing && (
                                                <Button
                                                    variant="flat"
                                                    color="default"
                                                    onPress={resetForm}
                                                    startContent={<XCircleIcon className="w-4 h-4" />}
                                                    size={isMobile ? "sm" : "md"}
                                                    radius={getThemeRadius()}
                                                    className="font-semibold"
                                                    aria-label="Cancel editing"
                                                    style={{
                                                        fontFamily: `var(--fontFamily, "Inter")`,
                                                    }}
                                                >
                                                    Cancel
                                                </Button>
                                            )}
                                            <Button
                                                color={isEditing ? "warning" : "primary"}
                                                variant="shadow"
                                                onPress={isEditing ? updateLeaveType : addLeaveType}
                                                startContent={isEditing ? <PencilIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />}
                                                isLoading={loading}
                                                isDisabled={!isFormValid}
                                                size={isMobile ? "sm" : "md"}
                                                radius={getThemeRadius()}
                                                className="font-semibold"
                                                aria-label={isEditing ? "Update leave type" : "Add leave type"}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                            >
                                                {isEditing ? 'Update Leave Type' : 'Add Leave Type'}
                                            </Button>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Table Section */}
                    <div className="w-full">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <Card 
                                className="transition-all duration-200"
                                style={{
                                    border: `var(--borderWidth, 2px) solid transparent`,
                                    borderRadius: `var(--borderRadius, 12px)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                    transform: `scale(var(--scale, 1))`,
                                    background: `linear-gradient(135deg, 
                                        var(--theme-content1, #FAFAFA) 20%, 
                                        var(--theme-content2, #F4F4F5) 10%, 
                                        var(--theme-content3, #F1F3F4) 20%)`,
                                }}
                            >
                                <CardHeader 
                                    className="border-b p-0"
                                    style={{
                                        borderColor: `var(--theme-divider, #E4E4E7)`,
                                        background: `linear-gradient(135deg, 
                                            color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, 
                                            color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
                                    }}
                                >
                                    <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            {/* Title Section */}
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div 
                                                    className={`
                                                        ${!isMobile ? 'p-3' : 'p-2'} 
                                                        rounded-xl flex items-center justify-center
                                                    `}
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderColor: `color-mix(in srgb, var(--theme-primary) 25%, transparent)`,
                                                        borderWidth: `var(--borderWidth, 2px)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <DocumentTextIcon 
                                                        className={`
                                                            ${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}
                                                        `}
                                                        style={{ color: 'var(--theme-primary)' }}
                                                    />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 
                                                        className={`
                                                            ${!isMobile ? 'text-2xl' : 'text-xl'}
                                                            font-bold text-foreground
                                                            ${isMobile ? 'truncate' : ''}
                                                        `}
                                                        style={{
                                                            fontFamily: `var(--fontFamily, "Inter")`,
                                                        }}
                                                    >
                                                        Leave Types Overview
                                                    </h4>
                                                    <p 
                                                        className={`
                                                            ${!isMobile ? 'text-sm' : 'text-xs'} 
                                                            text-default-500
                                                            ${isMobile ? 'truncate' : ''}
                                                        `}
                                                        style={{
                                                            fontFamily: `var(--fontFamily, "Inter")`,
                                                        }}
                                                    >
                                                        Manage and review all configured leave types
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Search */}
                                            <div className="flex-1 max-w-md">
                                                <Input
                                                    placeholder="Search leave types..."
                                                    value={searchValue}
                                                    onChange={(e) => setSearchValue(e.target.value)}
                                                    startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                                    variant="bordered"
                                                    size="sm"
                                                    radius={getThemeRadius()}
                                                    className="w-full"
                                                    aria-label="Search leave types"
                                                    classNames={{
                                                        input: "text-sm",
                                                    }}
                                                    style={{
                                                        fontFamily: `var(--fontFamily, "Inter")`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    <div className="overflow-hidden">
                                        <ScrollShadow className="max-h-[600px]">
                                            <Table 
                                                aria-label="Leave types table"
                                                radius={getThemeRadius()}
                                                className="min-w-full"
                                                classNames={{
                                                    wrapper: "shadow-none bg-transparent",
                                                    th: "bg-content2/50 text-default-600 font-semibold",
                                                    td: "text-foreground",
                                                }}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                            >
                                                <TableHeader>
                                                    <TableColumn key="type" className="text-left">
                                                        <div className="flex items-center gap-2">
                                                            <ClockIcon className="w-4 h-4" />
                                                            Leave Type
                                                        </div>
                                                    </TableColumn>
                                                    <TableColumn key="days" className="text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <CalendarDaysIcon className="w-4 h-4" />
                                                            Days
                                                        </div>
                                                    </TableColumn>
                                                    <TableColumn key="eligibility" className="text-left">
                                                        <div className="flex items-center gap-2">
                                                            <UserGroupIcon className="w-4 h-4" />
                                                            Eligibility
                                                        </div>
                                                    </TableColumn>
                                                    <TableColumn key="policies" className="text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <CheckCircleIcon className="w-4 h-4" />
                                                            Policies
                                                        </div>
                                                    </TableColumn>
                                                    <TableColumn key="special_conditions" className="text-left">
                                                        <div className="flex items-center gap-2">
                                                            <InformationCircleIcon className="w-4 h-4" />
                                                            Special Conditions
                                                        </div>
                                                    </TableColumn>
                                                    <TableColumn key="actions" className="text-center">
                                                        Actions
                                                    </TableColumn>
                                                </TableHeader>
                                                <TableBody emptyContent="No leave types configured yet">
                                                    {filteredLeaveTypes.map((leave) => (
                                                        <TableRow key={leave.id}>
                                                            <TableCell>
                                                                <div className="flex items-center gap-3">
                                                                    <div 
                                                                        className="p-2 rounded-lg flex items-center justify-center"
                                                                        style={{
                                                                            background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                                            borderRadius: `var(--borderRadius, 8px)`,
                                                                        }}
                                                                    >
                                                                        <ClockIcon 
                                                                            className="w-4 h-4"
                                                                            style={{ color: 'var(--theme-primary)' }}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <p 
                                                                            className="font-semibold text-foreground"
                                                                            style={{
                                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                                            }}
                                                                        >
                                                                            {leave.type}
                                                                        </p>
                                                                        <p 
                                                                            className="text-xs text-default-600"
                                                                            style={{
                                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                                            }}
                                                                        >
                                                                            Leave Type
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex justify-center">
                                                                    <Chip
                                                                        color="primary"
                                                                        variant="flat"
                                                                        size="sm"
                                                                        radius={getThemeRadius()}
                                                                        className="font-semibold"
                                                                        style={{
                                                                            fontFamily: `var(--fontFamily, "Inter")`,
                                                                        }}
                                                                    >
                                                                        {leave.days} days
                                                                    </Chip>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <p 
                                                                    className="text-sm text-foreground"
                                                                    style={{
                                                                        fontFamily: `var(--fontFamily, "Inter")`,
                                                                    }}
                                                                >
                                                                    {leave.eligibility || 'No specific criteria'}
                                                                </p>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex justify-center gap-2 flex-wrap">
                                                                    <Tooltip content="Carry Forward Policy">
                                                                        <Chip
                                                                            startContent={leave.carry_forward ? <CheckCircleSolid className="w-3 h-3" /> : <XCircleSolid className="w-3 h-3" />}
                                                                            color={leave.carry_forward ? 'success' : 'danger'}
                                                                            variant="flat"
                                                                            size="sm"
                                                                            radius={getThemeRadius()}
                                                                            className="text-xs font-medium"
                                                                            style={{
                                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                                            }}
                                                                        >
                                                                            Carry Forward
                                                                        </Chip>
                                                                    </Tooltip>
                                                                    <Tooltip content="Earned Leave Policy">
                                                                        <Chip
                                                                            startContent={leave.earned_leave ? <CheckCircleSolid className="w-3 h-3" /> : <XCircleSolid className="w-3 h-3" />}
                                                                            color={leave.earned_leave ? 'success' : 'warning'}
                                                                            variant="flat"
                                                                            size="sm"
                                                                            radius={getThemeRadius()}
                                                                            className="text-xs font-medium"
                                                                            style={{
                                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                                            }}
                                                                        >
                                                                            Earned Leave
                                                                        </Chip>
                                                                    </Tooltip>
                                                                    <Tooltip content="Requires Approval">
                                                                        <Chip
                                                                            startContent={(leave.requires_approval ?? true) ? <CheckCircleSolid className="w-3 h-3" /> : <XCircleSolid className="w-3 h-3" />}
                                                                            color={(leave.requires_approval ?? true) ? 'primary' : 'default'}
                                                                            variant="flat"
                                                                            size="sm"
                                                                            radius={getThemeRadius()}
                                                                            className="text-xs font-medium"
                                                                            style={{
                                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                                            }}
                                                                        >
                                                                            Approval
                                                                        </Chip>
                                                                    </Tooltip>
                                                                    {leave.auto_approve && (
                                                                        <Tooltip content="Auto Approve Enabled">
                                                                            <Chip
                                                                                startContent={<CheckCircleSolid className="w-3 h-3" />}
                                                                                color="success"
                                                                                variant="flat"
                                                                                size="sm"
                                                                                radius={getThemeRadius()}
                                                                                className="text-xs font-medium"
                                                                                style={{
                                                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                                                }}
                                                                            >
                                                                                Auto
                                                                            </Chip>
                                                                        </Tooltip>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                {leave.special_conditions ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <InformationCircleIcon className="w-4 h-4 text-warning-500 flex-shrink-0" />
                                                                        <p 
                                                                            className="text-sm text-foreground"
                                                                            style={{
                                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                                            }}
                                                                        >
                                                                            {leave.special_conditions}
                                                                        </p>
                                                                    </div>
                                                                ) : (
                                                                    <p 
                                                                        className="text-sm text-default-500 italic"
                                                                        style={{
                                                                            fontFamily: `var(--fontFamily, "Inter")`,
                                                                        }}
                                                                    >
                                                                        No special conditions
                                                                    </p>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex justify-center gap-2">
                                                                    <Tooltip content="Edit leave type">
                                                                        <Button
                                                                            isIconOnly
                                                                            variant="flat"
                                                                            color="primary"
                                                                            size="sm"
                                                                            onPress={() => editLeaveType(leave.id)}
                                                                            aria-label={`Edit ${leave.type}`}
                                                                            radius={getThemeRadius()}
                                                                            style={{
                                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                                            }}
                                                                        >
                                                                            <PencilIcon className="w-4 h-4" />
                                                                        </Button>
                                                                    </Tooltip>
                                                                    <Tooltip content="Delete leave type" color="danger">
                                                                        <Button
                                                                            isIconOnly
                                                                            variant="flat"
                                                                            color="danger"
                                                                            size="sm"
                                                                            onPress={() => prepareDelete(leave)}
                                                                            isLoading={deleteLoading === leave.id}
                                                                            aria-label={`Delete ${leave.type}`}
                                                                            radius={getThemeRadius()}
                                                                            style={{
                                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                                            }}
                                                                        >
                                                                            <TrashIcon className="w-4 h-4" />
                                                                        </Button>
                                                                    </Tooltip>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </ScrollShadow>
                                    </div>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal 
                isOpen={isDeleteModalOpen} 
                onClose={onDeleteModalClose}
                size="md"
                backdrop="blur"
                radius={getThemeRadius()}
                classNames={{
                    base: "border-[1px] border-divider bg-content1",
                    header: "border-b-[1px] border-divider",
                    footer: "border-t-[1px] border-divider",
                }}
                style={{
                    fontFamily: `var(--fontFamily, "Inter")`,
                }}
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-danger-100 dark:bg-danger-900/30 rounded-lg">
                                <TrashIcon className="w-5 h-5 text-danger-600 dark:text-danger-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">
                                    Delete Leave Type
                                </h3>
                                <p className="text-sm text-default-600">
                                    This action cannot be undone
                                </p>
                            </div>
                        </div>
                    </ModalHeader>
                    <ModalBody>
                        <p className="text-foreground">
                            Are you sure you want to delete the leave type 
                            <span className="font-semibold text-danger-600 mx-1">
                                "{deleteCandidate?.type}"
                            </span>
                            ? This will permanently remove this leave type and all associated policies.
                        </p>
                    </ModalBody>
                    <ModalFooter>
                        <Button 
                            variant="flat" 
                            onPress={onDeleteModalClose}
                            isDisabled={deleteLoading === deleteCandidate?.id}
                            radius={getThemeRadius()}
                            style={{
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}
                        >
                            Cancel
                        </Button>
                        <Button 
                            color="danger" 
                            onPress={deleteLeaveType}
                            isLoading={deleteLoading === deleteCandidate?.id}
                            startContent={deleteLoading !== deleteCandidate?.id ? <TrashIcon className="w-4 h-4" /> : null}
                            radius={getThemeRadius()}
                            style={{
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}
                        >
                            Delete Leave Type
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

LeaveSettings.layout = (page) => <App>{page}</App>;

export default LeaveSettings;
