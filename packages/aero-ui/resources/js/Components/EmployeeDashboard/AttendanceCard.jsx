import React, { useMemo } from 'react';
import { Link } from '@inertiajs/react';
import { Chip, Progress, Skeleton, Tooltip } from '@heroui/react';
import { motion } from 'framer-motion';
import {
    ClockIcon,
    ArrowRightIcon,
    ArrowRightStartOnRectangleIcon,
    ArrowLeftStartOnRectangleIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { ThemedCard, ThemedCardHeader, ThemedCardBody } from '@/Components/UI/ThemedCard';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';

/**
 * Formats a 24-h or ISO time string into a user-friendly "9:00 AM" format.
 */
const formatTime = (timeStr) => {
    if (!timeStr) return '--:--';
    try {
        const date = new Date(
            timeStr.includes('T') || timeStr.includes(' ')
                ? timeStr
                : `1970-01-01T${timeStr}`,
        );
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
        return timeStr;
    }
};

/**
 * Returns a short day label from a date string (Mon, Tue …).
 */
const getDayLabel = (dateStr) => {
    if (!dateStr) return '';
    try {
        return new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short' });
    } catch {
        return '';
    }
};

const STATUS_CONFIG = {
    present: { color: 'success', label: 'Present' },
    absent: { color: 'danger', label: 'Absent' },
    late: { color: 'warning', label: 'Late' },
    half_day: { color: 'warning', label: 'Half Day' },
    leave: { color: 'secondary', label: 'Leave' },
    holiday: { color: 'primary', label: 'Holiday' },
    weekend: { color: 'default', label: 'Weekend' },
    not_clocked_in: { color: 'default', label: 'Not Clocked In' },
};

const getStatusConfig = (status) =>
    STATUS_CONFIG[status] || { color: 'default', label: status || 'N/A' };

/* ───────────────────────────── sub-components ───────────────────────────── */

const TodayPunchStatus = ({ todayAttendance, themeRadius }) => {
    if (!todayAttendance) {
        return (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-content2">
                <ClockIcon className="w-5 h-5 text-default-400" />
                <span className="text-sm text-default-500">No attendance recorded today</span>
            </div>
        );
    }

    const { clock_in, clock_out, status, worked_hours, is_late, expected_hours } = todayAttendance;
    const statusCfg = getStatusConfig(status);

    return (
        <div className="space-y-3">
            {/* Status chip */}
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-default-700 dark:text-default-300">
                    Today
                </span>
                <Chip size="sm" variant="flat" color={statusCfg.color} radius={themeRadius}>
                    {is_late ? 'Late' : statusCfg.label}
                </Chip>
            </div>

            {/* Clock-in / Clock-out row */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 min-w-0">
                    <ArrowRightStartOnRectangleIcon
                        className="w-4 h-4 shrink-0"
                        style={{ color: 'var(--theme-success, #17C964)' }}
                    />
                    <div className="min-w-0">
                        <p className="text-xs text-default-500">Clock In</p>
                        <p className="text-sm font-semibold text-foreground truncate">
                            {formatTime(clock_in)}
                        </p>
                    </div>
                </div>

                <ArrowRightIcon className="w-4 h-4 text-default-300 shrink-0" />

                <div className="flex items-center gap-2 min-w-0">
                    <ArrowLeftStartOnRectangleIcon
                        className="w-4 h-4 shrink-0"
                        style={{ color: 'var(--theme-danger, #F31260)' }}
                    />
                    <div className="min-w-0">
                        <p className="text-xs text-default-500">Clock Out</p>
                        <p className="text-sm font-semibold text-foreground truncate">
                            {clock_out ? formatTime(clock_out) : 'Active'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Worked hours progress */}
            {(worked_hours !== undefined || expected_hours !== undefined) && (
                <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-default-500">
                        <span>Hours Worked</span>
                        <span className="font-medium text-foreground">
                            {worked_hours != null ? `${Number(worked_hours).toFixed(1)}h` : '--'}
                            {expected_hours ? ` / ${Number(expected_hours).toFixed(1)}h` : ''}
                        </span>
                    </div>
                    <Progress
                        size="sm"
                        value={
                            worked_hours && expected_hours
                                ? Math.min((worked_hours / expected_hours) * 100, 100)
                                : 0
                        }
                        color={is_late ? 'warning' : 'primary'}
                        aria-label="Worked hours progress"
                    />
                </div>
            )}
        </div>
    );
};

const WeeklyBarChart = ({ weeklyAttendance }) => {
    if (!weeklyAttendance?.length) return null;

    const maxHours = Math.max(
        ...weeklyAttendance.map((d) => Number(d.worked_hours) || 0),
        8,
    );

    return (
        <div className="space-y-2">
            <p className="text-xs font-medium text-default-500 uppercase tracking-wider">
                Last 7 Days
            </p>
            <div className="flex items-end gap-1.5 h-20">
                {weeklyAttendance.slice(-7).map((day, idx) => {
                    const hours = Number(day.worked_hours) || 0;
                    const pct = maxHours > 0 ? (hours / maxHours) * 100 : 0;
                    const statusCfg = getStatusConfig(day.status);
                    const barColorVar =
                        day.status === 'absent' || day.status === 'leave'
                            ? 'var(--theme-danger, #F31260)'
                            : day.status === 'late' || day.status === 'half_day'
                              ? 'var(--theme-warning, #F5A524)'
                              : day.status === 'weekend' || day.status === 'holiday'
                                ? 'var(--theme-default, #D4D4D8)'
                                : 'var(--theme-primary, #006FEE)';

                    return (
                        <Tooltip
                            key={day.date || idx}
                            content={
                                <div className="text-xs p-1 space-y-0.5">
                                    <p className="font-semibold">{getDayLabel(day.date)}</p>
                                    <p>{statusCfg.label}</p>
                                    {hours > 0 && <p>{hours.toFixed(1)}h worked</p>}
                                    {day.clock_in && <p>In: {formatTime(day.clock_in)}</p>}
                                    {day.clock_out && <p>Out: {formatTime(day.clock_out)}</p>}
                                </div>
                            }
                        >
                            <div className="flex flex-col items-center gap-1 flex-1 cursor-default">
                                <div
                                    className="w-full rounded-t transition-all duration-300"
                                    style={{
                                        height: `${Math.max(pct, 4)}%`,
                                        backgroundColor: barColorVar,
                                        minHeight: '3px',
                                        borderRadius: 'var(--borderRadius, 4px) var(--borderRadius, 4px) 0 0',
                                    }}
                                />
                                <span className="text-[10px] text-default-400 leading-none">
                                    {getDayLabel(day.date)}
                                </span>
                            </div>
                        </Tooltip>
                    );
                })}
            </div>
        </div>
    );
};

const MonthlyStats = ({ attendanceStats, themeRadius }) => {
    const items = useMemo(
        () => [
            {
                label: 'Present',
                value: attendanceStats.present_days ?? 0,
                icon: CheckCircleIcon,
                color: 'text-success',
                bgColor: 'bg-success/10',
            },
            {
                label: 'Absent',
                value: attendanceStats.absent_days ?? 0,
                icon: XCircleIcon,
                color: 'text-danger',
                bgColor: 'bg-danger/10',
            },
            {
                label: 'Late',
                value: attendanceStats.late_days ?? 0,
                icon: ExclamationTriangleIcon,
                color: 'text-warning',
                bgColor: 'bg-warning/10',
            },
        ],
        [attendanceStats.present_days, attendanceStats.absent_days, attendanceStats.late_days],
    );

    const percentage = attendanceStats.attendance_percentage ?? 0;

    return (
        <div className="space-y-3">
            <p className="text-xs font-medium text-default-500 uppercase tracking-wider">
                This Month
            </p>

            {/* Stat pills */}
            <div className="grid grid-cols-3 gap-2">
                {items.map(({ label, value, icon: Icon, color, bgColor }) => (
                    <div
                        key={label}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg ${bgColor}`}
                    >
                        <Icon className={`w-4 h-4 ${color}`} />
                        <span className="text-base font-bold text-foreground">{value}</span>
                        <span className="text-[10px] text-default-500">{label}</span>
                    </div>
                ))}
            </div>

            {/* Hours + Attendance percentage */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-default-500">
                    <span>Attendance Rate</span>
                    <span className="font-semibold text-foreground">
                        {Number(percentage).toFixed(0)}%
                    </span>
                </div>
                <Progress
                    size="sm"
                    value={percentage}
                    color={percentage >= 90 ? 'success' : percentage >= 75 ? 'warning' : 'danger'}
                    aria-label="Attendance percentage"
                />
                {attendanceStats.total_hours != null && (
                    <p className="text-xs text-default-400 text-right">
                        {Number(attendanceStats.total_hours).toFixed(1)}h total /{' '}
                        {attendanceStats.working_days_in_month ?? '--'} working days
                    </p>
                )}
            </div>
        </div>
    );
};

const LoadingSkeleton = () => (
    <ThemedCard>
        <ThemedCardHeader>
            <div className="p-4 w-full flex items-center justify-between">
                <Skeleton className="h-5 w-28 rounded" />
                <Skeleton className="h-4 w-24 rounded" />
            </div>
        </ThemedCardHeader>
        <ThemedCardBody className="p-4 sm:p-5 space-y-5">
            {/* Today punch skeleton */}
            <div className="space-y-3">
                <div className="flex justify-between">
                    <Skeleton className="h-4 w-12 rounded" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <div className="flex gap-4">
                    <Skeleton className="h-10 w-24 rounded-lg" />
                    <Skeleton className="h-10 w-24 rounded-lg" />
                </div>
                <Skeleton className="h-2 w-full rounded" />
            </div>
            {/* Bar chart skeleton */}
            <div className="flex items-end gap-1.5 h-20">
                {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton
                        key={i}
                        className="flex-1 rounded"
                        style={{ height: `${30 + Math.random() * 50}%` }}
                    />
                ))}
            </div>
            {/* Monthly stats skeleton */}
            <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
            </div>
            <Skeleton className="h-2 w-full rounded" />
        </ThemedCardBody>
    </ThemedCard>
);

/* ────────────────────────────── main component ──────────────────────────── */

const AttendanceCard = ({ todayAttendance, attendanceStats, weeklyAttendance }) => {
    const themeRadius = useThemeRadius();

    const isLoading =
        todayAttendance === undefined &&
        attendanceStats === undefined &&
        weeklyAttendance === undefined;

    if (isLoading) {
        return <LoadingSkeleton />;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
        >
            <ThemedCard className="h-full">
                <ThemedCardHeader>
                    <div className="p-4 sm:p-5 w-full flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div
                                className="p-1.5 rounded-lg"
                                style={{
                                    background: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)',
                                    borderRadius: 'var(--borderRadius, 8px)',
                                }}
                            >
                                <ClockIcon
                                    className="w-5 h-5"
                                    style={{ color: 'var(--theme-primary)' }}
                                />
                            </div>
                            <h3 className="text-base font-semibold text-foreground">Attendance</h3>
                        </div>
                        <Link
                            href={(() => { try { return route('hrm.my-attendance'); } catch { return '#'; } })()}
                            className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                        >
                            View Full History
                            <ArrowRightIcon className="w-3 h-3" />
                        </Link>
                    </div>
                </ThemedCardHeader>

                <ThemedCardBody className="p-4 sm:p-5 space-y-5">
                    {/* Today's punch status */}
                    <TodayPunchStatus todayAttendance={todayAttendance} themeRadius={themeRadius} />

                    {/* Divider */}
                    <div className="border-t border-divider" />

                    {/* Weekly bar chart */}
                    <WeeklyBarChart weeklyAttendance={weeklyAttendance} />

                    {/* Divider */}
                    {attendanceStats && <div className="border-t border-divider" />}

                    {/* Monthly stats */}
                    {attendanceStats && (
                        <MonthlyStats attendanceStats={attendanceStats} themeRadius={themeRadius} />
                    )}
                </ThemedCardBody>
            </ThemedCard>
        </motion.div>
    );
};

export default AttendanceCard;
