import React, { useMemo } from 'react';
import { Avatar, Chip, Badge } from '@heroui/react';
import { motion } from 'framer-motion';
import {
    SunIcon,
    MoonIcon,
    ClockIcon,
    CalendarDaysIcon,
    BriefcaseIcon,
    BuildingOffice2Icon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { ThemedCard, ThemedCardBody } from '@/Components/UI/ThemedCard';
import { useThemeRadius } from '@/Hooks/useThemeRadius';

/**
 * Returns a greeting string based on the current hour.
 */
const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
};

/**
 * Returns a Heroicon component matching the time-of-day.
 */
const getGreetingIcon = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 18) {
        return <SunIcon className="w-6 h-6" style={{ color: 'var(--theme-warning, #F5A524)' }} />;
    }
    return <MoonIcon className="w-6 h-6" style={{ color: 'var(--theme-secondary, #7828C8)' }} />;
};

/**
 * Formats a 24-h or ISO time string into a user-friendly "9:00 AM" format.
 */
const formatTime = (timeStr) => {
    if (!timeStr) return null;
    try {
        const date = new Date(
            timeStr.includes('T') || timeStr.includes(' ')
                ? timeStr
                : `1970-01-01T${timeStr}`
        );
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
        return timeStr;
    }
};

/**
 * Builds a human-readable tenure string.
 */
const formatTenure = (years, months) => {
    const parts = [];
    if (years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`);
    return parts.length > 0 ? parts.join(', ') : 'Just started';
};

const WelcomeBanner = ({ employee, todayAttendance }) => {
    const themeRadius = useThemeRadius();

    const firstName = useMemo(
        () => (employee?.full_name || employee?.name || '').split(' ')[0] || 'there',
        [employee?.full_name, employee?.name],
    );

    const greeting = useMemo(() => getGreeting(), []);
    const greetingIcon = useMemo(() => getGreetingIcon(), []);

    const todayFormatted = useMemo(() => {
        const now = new Date();
        return now.toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }, []);

    const clockInText = useMemo(() => {
        if (!todayAttendance?.clock_in) return null;
        return formatTime(todayAttendance.clock_in);
    }, [todayAttendance?.clock_in]);

    const tenure = useMemo(
        () => formatTenure(employee?.tenure_years, employee?.tenure_months),
        [employee?.tenure_years, employee?.tenure_months],
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
        >
            <ThemedCard>
                <ThemedCardBody className="p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                        {/* Avatar */}
                        <div className="shrink-0 self-start sm:self-center">
                            <Badge
                                content=""
                                color={employee?.status === 'active' ? 'success' : 'default'}
                                placement="bottom-right"
                                shape="circle"
                                size="sm"
                            >
                                <Avatar
                                    src={employee?.avatar}
                                    name={employee?.full_name || employee?.name}
                                    size="lg"
                                    radius={themeRadius}
                                    classNames={{
                                        base: 'w-16 h-16 sm:w-20 sm:h-20 ring-2 ring-primary/20',
                                        name: 'text-lg font-semibold',
                                    }}
                                />
                            </Badge>
                        </div>

                        {/* Info block */}
                        <div className="flex flex-col gap-2 grow min-w-0">
                            {/* Greeting row */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {greetingIcon}
                                <h2 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                                    {greeting}, {firstName}!
                                </h2>
                            </div>

                            {/* Role & department */}
                            <div className="flex items-center gap-2 flex-wrap text-sm text-default-500">
                                {employee?.designation && (
                                    <span className="flex items-center gap-1">
                                        <BriefcaseIcon className="w-4 h-4 shrink-0" />
                                        <span className="truncate">{employee.designation}</span>
                                    </span>
                                )}
                                {employee?.designation && employee?.department && (
                                    <span className="hidden sm:inline text-default-300">•</span>
                                )}
                                {employee?.department && (
                                    <span className="flex items-center gap-1">
                                        <BuildingOffice2Icon className="w-4 h-4 shrink-0" />
                                        <span className="truncate">{employee.department}</span>
                                    </span>
                                )}
                            </div>

                            {/* Chips row */}
                            <div className="flex items-center gap-2 flex-wrap mt-1">
                                {/* Today's date */}
                                <Chip
                                    size="sm"
                                    variant="flat"
                                    color="default"
                                    startContent={<CalendarDaysIcon className="w-3.5 h-3.5" />}
                                    radius={themeRadius}
                                >
                                    {todayFormatted}
                                </Chip>

                                {/* Tenure */}
                                {(employee?.tenure_years > 0 || employee?.tenure_months > 0) && (
                                    <Chip
                                        size="sm"
                                        variant="flat"
                                        color="primary"
                                        radius={themeRadius}
                                    >
                                        {tenure}
                                    </Chip>
                                )}

                                {/* Probation indicator */}
                                {employee?.is_on_probation && (
                                    <Chip
                                        size="sm"
                                        variant="flat"
                                        color="warning"
                                        startContent={<ExclamationTriangleIcon className="w-3.5 h-3.5" />}
                                        radius={themeRadius}
                                    >
                                        On Probation
                                    </Chip>
                                )}
                            </div>
                        </div>

                        {/* Clock-in status — right side on desktop, full-width on mobile */}
                        <div
                            className="shrink-0 sm:self-center sm:text-right mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-divider"
                        >
                            <div className="flex sm:flex-col items-center sm:items-end gap-2">
                                <ClockIcon
                                    className="w-5 h-5"
                                    style={{ color: clockInText ? 'var(--theme-success, #17C964)' : 'var(--theme-default, #A1A1AA)' }}
                                />
                                {clockInText ? (
                                    <>
                                        <span className="text-xs text-default-400">Clocked in at</span>
                                        <span className="text-sm font-semibold text-success">{clockInText}</span>
                                        {todayAttendance?.is_late && (
                                            <Chip size="sm" variant="dot" color="warning" radius={themeRadius}>
                                                Late
                                            </Chip>
                                        )}
                                    </>
                                ) : (
                                    <span className="text-sm text-default-400">Not clocked in yet</span>
                                )}
                            </div>
                        </div>
                    </div>
                </ThemedCardBody>
            </ThemedCard>
        </motion.div>
    );
};

export default WelcomeBanner;
