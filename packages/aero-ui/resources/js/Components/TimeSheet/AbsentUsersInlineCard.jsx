import React, { useState, useMemo } from 'react';
import {
    Input,
    Button,
    Spinner
} from "@heroui/react";
import { motion, AnimatePresence } from 'framer-motion';

import dayjs from "dayjs";
import { 
    MagnifyingGlassIcon,
    CalendarDaysIcon,
    ClockIcon,
    UserIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    XCircleIcon,
    ChevronDownIcon,
    UserPlusIcon,

   
} from '@heroicons/react/24/outline';


import PageHeader from '@/Components/PageHeader';
import ProfileAvatar from '@/Components/ProfileAvatar';


// Inline AbsentUsersCard component for the combined layout
export const AbsentUsersInlineCard = React.memo(({ absentUsers, selectedDate, getUserLeave, isLoaded = false, onMarkAsPresent }) => {
    const [visibleUsersCount, setVisibleUsersCount] = useState(5);
    const [searchTerm, setSearchTerm] = useState('');

    // Helper function to convert theme borderRadius to HeroUI radius values
    const getThemeRadius = () => {
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 16) return 'lg';
        return 'full';
    };

    // Filter absent users based on search term
    const filteredAbsentUsers = useMemo(() => {
        if (!searchTerm.trim()) {
            return absentUsers;
        }
        
        const searchLower = searchTerm.toLowerCase();
        return absentUsers.filter(user => {
            const name = user.name?.toLowerCase() || '';
            const employeeId = user.employee_id?.toString().toLowerCase() || '';
            const email = user.email?.toLowerCase() || '';
            const phone = user.phone?.toString().toLowerCase() || '';
            
            return name.includes(searchLower) ||
                   employeeId.includes(searchLower) ||
                   email.includes(searchLower) ||
                   phone.includes(searchLower);
        });
    }, [absentUsers, searchTerm]);

    const handleLoadMore = () => {
        setVisibleUsersCount((prev) => prev + 5);
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        setVisibleUsersCount(5); // Reset visible count when searching
    };

    const getLeaveStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved':
                return <CheckCircleIcon className="w-4 h-4" style={{ color: 'var(--theme-success)' }} />;
            case 'rejected':
                return <XCircleIcon className="w-4 h-4" style={{ color: 'var(--theme-danger)' }} />;
            case 'pending':
                return <ClockIcon className="w-4 h-4" style={{ color: 'var(--theme-warning)' }} />;
            default:
                return <ClockIcon className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />;
        }
    };

    const getLeaveStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved':
                return 'var(--theme-success)';
            case 'rejected':
                return 'var(--theme-danger)';
            case 'pending':
                return 'var(--theme-warning)';
            default:
                return 'var(--theme-primary)';
        }
    };    
    const totalRows = filteredAbsentUsers.length;
    
    // Show loading state when data hasn't been loaded yet
    if (!isLoaded) {
        return (
            <div className="h-full flex flex-col">
                <div className="mb-4 flex-shrink-0">
                    <h3 
                        className="font-semibold flex items-center gap-2 text-lg text-default-700"
                        style={{ 
                            color: 'var(--theme-default)',
                            fontFamily: `var(--fontFamily, "Inter")`
                        }}
                    >
                        <ClockIcon 
                            className="w-5 h-5"
                            style={{ color: 'var(--theme-default)' }}
                        />
                        Loading Attendance Data...
                    </h3>
                </div>
                <div 
                    className="text-center py-12 h-96 flex flex-col items-center justify-center"
                    style={{
                        background: `color-mix(in srgb, var(--theme-default) 5%, transparent)`,
                        borderColor: `color-mix(in srgb, var(--theme-default) 20%, transparent)`,
                        borderWidth: `var(--borderWidth, 2px)`,
                        borderRadius: `var(--borderRadius, 12px)`,
                        fontFamily: `var(--fontFamily, "Inter")`,
                    }}
                >
                    <Spinner 
                        size="lg" 
                        className="mb-4"
                        style={{ color: 'var(--theme-primary)' }}
                    />
                    <p 
                        className="text-default-500 text-sm"
                        style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                    >
                        Checking attendance records...
                    </p>
                </div>
            </div>
        );
    }
    
    // Only show "Perfect Attendance!" when data is loaded AND no absent users
    if (isLoaded && absentUsers.length === 0) {
        return (
            <div className="h-full">
                <PageHeader
                    title="Perfect Attendance!"
                    subtitle={`No employees are absent on ${dayjs(selectedDate).format('MMMM D, YYYY')}`}
                    icon={<CheckCircleIcon className="w-6 h-6" />}
                    variant="gradient"
                    actionButtons={[
                        {
                            label: "0",
                            variant: "flat",
                            color: "success",
                            icon: <CheckCircleIcon className="w-4 h-4" />,
                            className: "bg-green-500/10 text-green-500 border-green-500/20"
                        }
                    ]}
                />
                <div 
                    role="region"
                    aria-label="No absent employees today"
                    className="text-center py-12 h-96 flex flex-col items-center justify-center"
                    style={{
                        background: `color-mix(in srgb, var(--theme-success) 10%, transparent)`,
                        borderColor: `color-mix(in srgb, var(--theme-success) 20%, transparent)`,
                        borderWidth: `var(--borderWidth, 2px)`,
                        borderRadius: `var(--borderRadius, 12px)`,
                        fontFamily: `var(--fontFamily, "Inter")`,
                    }}
                >
                    <CheckCircleIcon 
                        className="w-12 h-12 mx-auto mb-4"
                        style={{ color: 'var(--theme-success)' }}
                    />
                    <p 
                        className="mb-2 text-sm font-medium"
                        style={{ 
                            color: 'var(--theme-success)',
                            fontFamily: `var(--fontFamily, "Inter")`
                        }}
                    >
                        Perfect Attendance!
                    </p>
                    <p 
                        className="text-default-500 text-xs"
                        style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                    >
                        No employees are absent today.
                    </p>
                    <p 
                        className="text-default-500 mt-1 block text-xs"
                        style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                    >
                        All employees are either present or on approved leave.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="mb-4 flex-shrink-0">
                <h3 
                    className="font-semibold flex items-center gap-2 text-lg text-default-700"
                    style={{ 
                        color: 'var(--theme-danger)',
                        fontFamily: `var(--fontFamily, "Inter")`
                    }}
                >
                    <XCircleIcon 
                        className="w-5 h-5"
                        style={{ color: 'var(--theme-danger)' }}
                    />
                    Absent Employees ({totalRows})
                </h3>
            </div>
            {/* Search Input */}
            <div className="mb-3 flex-shrink-0">
                <Input
                    type="text"
                    placeholder="Search absent employees..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                    variant="bordered"
                    size="sm"
                    radius={getThemeRadius()}
                    aria-label="Search absent employees"
                    classNames={{
                        input: "text-sm"
                    }}
                    style={{
                        fontFamily: `var(--fontFamily, "Inter")`,
                    }}
                />
            </div>

            {/* Show search results count */}
            {searchTerm && (
                <div className="mb-2 flex-shrink-0">
                    <p 
                        className="text-default-500 text-xs"
                        style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                    >
                        {filteredAbsentUsers.length} of {absentUsers.length} employees found
                    </p>
                </div>
            )}

            {/* Show message if no results found */}
            {searchTerm && filteredAbsentUsers.length === 0 && (
                <div 
                    className="text-center py-8 flex-1 flex flex-col items-center justify-center"
                    style={{
                        background: `color-mix(in srgb, var(--theme-default) 10%, transparent)`,
                        borderColor: `color-mix(in srgb, var(--theme-default) 20%, transparent)`,
                        borderWidth: `var(--borderWidth, 2px)`,
                        borderRadius: `var(--borderRadius, 12px)`,
                        fontFamily: `var(--fontFamily, "Inter")`,
                    }}
                >
                    <MagnifyingGlassIcon className="w-8 h-8 text-default-300 mx-auto mb-2" />
                    <p 
                        className="text-default-500 text-sm"
                        style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                    >
                        No employees found matching "{searchTerm}"
                    </p>
                </div>
            )}

            <div 
                role="region"
                aria-label="Absent employees list"
                className="flex-1 overflow-y-auto min-h-0"
                style={{ maxHeight: 'calc(100vh - 400px)' }}
            >
                <AnimatePresence>
                    {filteredAbsentUsers.slice(0, visibleUsersCount).map((user) => {
                        const userLeave = getUserLeave(user.id);
                        
                        return (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.2 }}
                                className="p-3 mb-3 transition-all duration-200"
                                style={{
                                    background: `color-mix(in srgb, var(--theme-content1) 80%, transparent)`,
                                    borderColor: `color-mix(in srgb, var(--theme-divider) 50%, transparent)`,
                                    borderWidth: `var(--borderWidth, 1px)`,
                                    borderRadius: `var(--borderRadius, 8px)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = `color-mix(in srgb, var(--theme-content2) 60%, transparent)`;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = `color-mix(in srgb, var(--theme-content1) 80%, transparent)`;
                                }}
                            >
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <ProfileAvatar 
                                                src={user.profile_image_url || user.profile_image} 
                                                name={user.name}
                                                size="sm"
                                                showBorder
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p 
                                                    className="truncate text-sm font-medium text-foreground"
                                                    style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                                >
                                                    {user.name}
                                                </p>
                                                {user.employee_id && (
                                                    <p 
                                                        className="block text-xs text-default-500"
                                                        style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                                    >
                                                        ID: {user.employee_id}
                                                    </p>
                                                )}
                                                {userLeave ? (
                                                    <div className="flex flex-col gap-1 mt-1">
                                                        <p 
                                                            className="flex items-center gap-1 text-xs text-default-500"
                                                            style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                                        >
                                                            <CalendarDaysIcon className="w-3 h-3" />
                                                            <span className="truncate">
                                                                {userLeave.from_date === userLeave.to_date 
                                                                    ? userLeave.from_date 
                                                                    : `${userLeave.from_date} - ${userLeave.to_date}`
                                                                }
                                                            </span>
                                                        </p>
                                                        <p 
                                                            className="flex items-center gap-1 text-xs"
                                                            style={{ 
                                                                color: getLeaveStatusColor(userLeave.status),
                                                                fontFamily: `var(--fontFamily, "Inter")`
                                                            }}
                                                        >
                                                            {getLeaveStatusIcon(userLeave.status)}
                                                            <span className="truncate">{userLeave.leave_type} Leave</span>
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <p 
                                                        className="flex items-center gap-1 mt-1 text-xs"
                                                        style={{ 
                                                            color: 'var(--theme-danger)',
                                                            fontFamily: `var(--fontFamily, "Inter")`
                                                        }}
                                                    >
                                                        <ExclamationTriangleIcon className="w-3 h-3" />
                                                        <span className="truncate">Absent without leave</span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {userLeave && (
                                            <div 
                                                className="px-1.5 py-0.5 ml-2 flex-shrink-0"
                                                style={{
                                                    background: `color-mix(in srgb, ${getLeaveStatusColor(userLeave.status)} 15%, transparent)`,
                                                    borderColor: `color-mix(in srgb, ${getLeaveStatusColor(userLeave.status)} 30%, transparent)`,
                                                    borderWidth: `var(--borderWidth, 1px)`,
                                                    borderRadius: `var(--borderRadius, 6px)`,
                                                }}
                                            >
                                                <div className="flex items-center gap-1">
                                                    {getLeaveStatusIcon(userLeave.status)}
                                                    <span 
                                                        className="font-semibold text-xs"
                                                        style={{ 
                                                            color: getLeaveStatusColor(userLeave.status),
                                                            fontFamily: `var(--fontFamily, "Inter")`
                                                        }}
                                                    >
                                                        {userLeave.status}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Mark Present Button - Only show for users without leave */}
                                    {onMarkAsPresent && !userLeave && (
                                        <div className="flex justify-end">
                                            <Button
                                                color="primary"
                                                variant="flat"
                                                size="sm"
                                                radius={getThemeRadius()}
                                                startContent={<UserPlusIcon className="w-3 h-3" />}
                                                onPress={() => onMarkAsPresent(user, selectedDate)}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                                className="text-xs"
                                            >
                                                Mark Present
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                {visibleUsersCount < filteredAbsentUsers.length && (
                    <div className="text-center mt-4 pb-4 flex-shrink-0">
                        <Button 
                            variant="bordered" 
                            onPress={handleLoadMore}
                            startContent={<ChevronDownIcon className="w-4 h-4" />}
                            size="sm"
                            color="warning"
                            radius={getThemeRadius()}
                            fullWidth
                            style={{
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}
                        >
                            Show More ({filteredAbsentUsers.length - visibleUsersCount} remaining)
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
});
