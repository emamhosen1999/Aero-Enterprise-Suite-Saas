import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
    Card, 
    CardBody, 
    CardHeader, 
    Button, 
    Chip, 
    Spinner,
    Tooltip,
    Badge,
    Divider
} from '@heroui/react';
import { 
    ChevronLeftIcon, 
    ChevronRightIcon,
    CalendarDaysIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    SunIcon,
    BeakerIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// Theme utility function
const getThemeRadius = () => {
    if (typeof window === 'undefined') return 'lg';
    
    const rootStyles = getComputedStyle(document.documentElement);
    const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
    
    const radiusValue = parseInt(borderRadius);
    if (radiusValue === 0) return 'none';
    if (radiusValue <= 4) return 'sm';
    if (radiusValue <= 8) return 'md';
    if (radiusValue <= 12) return 'lg';
    return 'xl';
};

// Status color mapping
const getStatusColor = (status) => {
    const statusMap = {
        'Present': { bg: 'bg-success-100', text: 'text-success-700', border: 'border-success-300' },
        'Absent': { bg: 'bg-danger-100', text: 'text-danger-700', border: 'border-danger-300' },
        'Late': { bg: 'bg-warning-100', text: 'text-warning-700', border: 'border-warning-300' },
        'Leave': { bg: 'bg-primary-100', text: 'text-primary-700', border: 'border-primary-300' },
        'Half Day': { bg: 'bg-secondary-100', text: 'text-secondary-700', border: 'border-secondary-300' },
        'Weekend': { bg: 'bg-default-100', text: 'text-default-500', border: 'border-default-200' },
        'Holiday': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' }
    };
    return statusMap[status] || { bg: 'bg-default-50', text: 'text-default-400', border: 'border-default-100' };
};

const AttendanceCalendar = ({ 
    userId = null,
    currentMonth = new Date().toISOString().slice(0, 7), // YYYY-MM format
    onDateClick = null,
    showStats = true,
    compact = false
}) => {
    const [currentDate, setCurrentDate] = useState(new Date(currentMonth));
    const [attendanceData, setAttendanceData] = useState({});
    const [loading, setLoading] = useState(false);
    const [selectedDay, setSelectedDay] = useState(null);
    const [hoveredDay, setHoveredDay] = useState(null);

    // Fetch attendance data for the current month
    const fetchAttendanceData = useCallback(async () => {
        setLoading(true);
        try {
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            
            const response = await axios.get(route('attendance.calendar-data'), {
                params: {
                    user_id: userId,
                    year: year,
                    month: month
                }
            });

            if (response.data.success) {
                setAttendanceData(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch attendance data:', error);
        } finally {
            setLoading(false);
        }
    }, [currentDate, userId]);

    // Fetch data when month changes
    useEffect(() => {
        fetchAttendanceData();
    }, [fetchAttendanceData]);

    // Update currentDate when currentMonth prop changes
    useEffect(() => {
        setCurrentDate(new Date(currentMonth));
    }, [currentMonth]);

    // Get calendar days data for the current month
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();
        const firstDayWeekday = firstDayOfMonth.getDay();
        
        // Previous month padding
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        const prevMonthDays = [];
        for (let i = firstDayWeekday - 1; i >= 0; i--) {
            prevMonthDays.push({
                date: prevMonthLastDay - i,
                isCurrentMonth: false,
                fullDate: new Date(year, month - 1, prevMonthLastDay - i)
            });
        }
        
        // Current month days
        const currentMonthDays = [];
        for (let day = 1; day <= daysInMonth; day++) {
            currentMonthDays.push({
                date: day,
                isCurrentMonth: true,
                fullDate: new Date(year, month, day)
            });
        }
        
        // Next month padding
        const totalCells = prevMonthDays.length + currentMonthDays.length;
        const remainingCells = 42 - totalCells; // 6 weeks * 7 days
        const nextMonthDays = [];
        for (let day = 1; day <= remainingCells; day++) {
            nextMonthDays.push({
                date: day,
                isCurrentMonth: false,
                fullDate: new Date(year, month + 1, day)
            });
        }
        
        return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
    }, [currentDate]);

    // Get attendance info for a specific date
    const getAttendanceForDate = useCallback((dayData) => {
        if (!dayData.isCurrentMonth) return null;
        
        const dateString = dayData.fullDate.getFullYear() + '-' + 
                          String(dayData.fullDate.getMonth() + 1).padStart(2, '0') + '-' + 
                          String(dayData.fullDate.getDate()).padStart(2, '0');
        
        return attendanceData[dateString] || null;
    }, [attendanceData]);

    // Navigation handlers
    const goToPreviousMonth = useCallback(() => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    }, []);

    const goToNextMonth = useCallback(() => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    }, []);

    const goToToday = useCallback(() => {
        setCurrentDate(new Date());
    }, []);

    // Handle day click
    const handleDayClick = useCallback((dayData) => {
        if (!dayData.isCurrentMonth) return;
        
        setSelectedDay(dayData.date);
        if (onDateClick) {
            const dateString = dayData.fullDate.getFullYear() + '-' + 
                              String(dayData.fullDate.getMonth() + 1).padStart(2, '0') + '-' + 
                              String(dayData.fullDate.getDate()).padStart(2, '0');
            onDateClick(dateString, getAttendanceForDate(dayData));
        }
    }, [onDateClick, getAttendanceForDate]);

    // Calculate monthly stats
    const monthlyStats = useMemo(() => {
        const stats = {
            present: 0,
            absent: 0,
            late: 0,
            leave: 0,
            halfDay: 0,
            weekend: 0,
            holiday: 0,
            total: 0
        };

        Object.values(attendanceData).forEach(attendance => {
            stats.total++;
            const status = attendance.status;
            if (status === 'Present') stats.present++;
            else if (status === 'Absent') stats.absent++;
            else if (status === 'Late') stats.late++;
            else if (status === 'Leave') stats.leave++;
            else if (status === 'Half Day') stats.halfDay++;
            else if (status === 'Weekend') stats.weekend++;
            else if (status === 'Holiday') stats.holiday++;
        });

        return stats;
    }, [attendanceData]);

    // Weekday labels
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Month/Year display
    const monthYearDisplay = currentDate.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
    });

    return (
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader className="pb-3 flex-col gap-3">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <CalendarDaysIcon className="w-6 h-6 text-primary-400" />
                        <h4 className="text-lg font-semibold text-foreground">
                            Attendance Calendar
                        </h4>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            onPress={goToPreviousMonth}
                            isDisabled={loading}
                        >
                            <ChevronLeftIcon className="w-4 h-4" />
                        </Button>
                        <Button
                            size="sm"
                            variant="flat"
                            onPress={goToToday}
                            isDisabled={loading}
                        >
                            Today
                        </Button>
                        <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            onPress={goToNextMonth}
                            isDisabled={loading}
                        >
                            <ChevronRightIcon className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
                <div className="w-full">
                    <p className="text-xl font-bold text-foreground">{monthYearDisplay}</p>
                </div>
            </CardHeader>

            <Divider />

            <CardBody className="p-4">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Spinner size="lg" color="primary" />
                    </div>
                ) : (
                    <>
                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1 mb-4">
                            {/* Weekday Headers */}
                            {weekDays.map((day, index) => (
                                <div
                                    key={day}
                                    className={`text-center text-xs font-semibold py-2 ${
                                        index === 0 || index === 6 
                                            ? 'text-danger-500' 
                                            : 'text-default-600'
                                    }`}
                                >
                                    {day}
                                </div>
                            ))}

                            {/* Calendar Days */}
                            {calendarDays.map((dayData, index) => {
                                const attendance = getAttendanceForDate(dayData);
                                const status = attendance?.status || 'Unknown';
                                const colors = getStatusColor(status);
                                const isToday = dayData.isCurrentMonth && 
                                               dayData.date === new Date().getDate() &&
                                               currentDate.getMonth() === new Date().getMonth() &&
                                               currentDate.getFullYear() === new Date().getFullYear();
                                const isWeekend = dayData.fullDate.getDay() === 0 || dayData.fullDate.getDay() === 6;
                                const isSelected = selectedDay === dayData.date && dayData.isCurrentMonth;

                                return (
                                    <Tooltip
                                        key={index}
                                        content={
                                            dayData.isCurrentMonth && attendance ? (
                                                <div className="px-2 py-1">
                                                    <p className="text-xs font-semibold">{status}</p>
                                                    {attendance.check_in && (
                                                        <p className="text-xs">In: {attendance.check_in}</p>
                                                    )}
                                                    {attendance.check_out && (
                                                        <p className="text-xs">Out: {attendance.check_out}</p>
                                                    )}
                                                    {attendance.work_hours && (
                                                        <p className="text-xs">Hours: {attendance.work_hours}h</p>
                                                    )}
                                                </div>
                                            ) : null
                                        }
                                        isDisabled={!dayData.isCurrentMonth || !attendance}
                                    >
                                        <motion.div
                                            whileHover={{ scale: dayData.isCurrentMonth ? 1.05 : 1 }}
                                            whileTap={{ scale: dayData.isCurrentMonth ? 0.95 : 1 }}
                                            className={`
                                                aspect-square flex flex-col items-center justify-center rounded-lg
                                                transition-all duration-200 cursor-pointer
                                                ${dayData.isCurrentMonth ? 'opacity-100' : 'opacity-30'}
                                                ${dayData.isCurrentMonth && attendance ? colors.bg : 'bg-default-50'}
                                                ${isToday ? 'ring-2 ring-primary-500 ring-offset-2' : ''}
                                                ${isSelected ? 'ring-2 ring-secondary-500' : ''}
                                                ${isWeekend && !attendance ? 'bg-default-100' : ''}
                                                hover:shadow-md
                                            `}
                                            onClick={() => handleDayClick(dayData)}
                                            onMouseEnter={() => setHoveredDay(dayData.date)}
                                            onMouseLeave={() => setHoveredDay(null)}
                                        >
                                            <span className={`
                                                text-sm font-medium
                                                ${dayData.isCurrentMonth && attendance ? colors.text : 'text-default-600'}
                                                ${!dayData.isCurrentMonth ? 'text-default-300' : ''}
                                            `}>
                                                {dayData.date}
                                            </span>
                                            {dayData.isCurrentMonth && attendance && (
                                                <div className="mt-0.5">
                                                    {status === 'Present' && <CheckCircleIcon className="w-3 h-3 text-success-600" />}
                                                    {status === 'Absent' && <XCircleIcon className="w-3 h-3 text-danger-600" />}
                                                    {status === 'Late' && <ClockIcon className="w-3 h-3 text-warning-600" />}
                                                    {status === 'Leave' && <SunIcon className="w-3 h-3 text-primary-600" />}
                                                    {status === 'Half Day' && <BeakerIcon className="w-3 h-3 text-secondary-600" />}
                                                </div>
                                            )}
                                        </motion.div>
                                    </Tooltip>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <Divider className="my-3" />
                        <div className="flex flex-wrap gap-2 text-xs">
                            <Chip size="sm" className={getStatusColor('Present').bg} variant="flat">
                                <div className="flex items-center gap-1">
                                    <CheckCircleIcon className="w-3 h-3" />
                                    <span>Present</span>
                                </div>
                            </Chip>
                            <Chip size="sm" className={getStatusColor('Absent').bg} variant="flat">
                                <div className="flex items-center gap-1">
                                    <XCircleIcon className="w-3 h-3" />
                                    <span>Absent</span>
                                </div>
                            </Chip>
                            <Chip size="sm" className={getStatusColor('Late').bg} variant="flat">
                                <div className="flex items-center gap-1">
                                    <ClockIcon className="w-3 h-3" />
                                    <span>Late</span>
                                </div>
                            </Chip>
                            <Chip size="sm" className={getStatusColor('Leave').bg} variant="flat">
                                <div className="flex items-center gap-1">
                                    <SunIcon className="w-3 h-3" />
                                    <span>Leave</span>
                                </div>
                            </Chip>
                            <Chip size="sm" className={getStatusColor('Half Day').bg} variant="flat">
                                <div className="flex items-center gap-1">
                                    <BeakerIcon className="w-3 h-3" />
                                    <span>Half Day</span>
                                </div>
                            </Chip>
                        </div>

                        {/* Monthly Stats */}
                        {showStats && (
                            <>
                                <Divider className="my-3" />
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <div className="text-center p-2 bg-success-50 rounded-lg">
                                        <p className="text-xs text-default-500">Present</p>
                                        <p className="text-lg font-bold text-success-600">{monthlyStats.present}</p>
                                    </div>
                                    <div className="text-center p-2 bg-danger-50 rounded-lg">
                                        <p className="text-xs text-default-500">Absent</p>
                                        <p className="text-lg font-bold text-danger-600">{monthlyStats.absent}</p>
                                    </div>
                                    <div className="text-center p-2 bg-warning-50 rounded-lg">
                                        <p className="text-xs text-default-500">Late</p>
                                        <p className="text-lg font-bold text-warning-600">{monthlyStats.late}</p>
                                    </div>
                                    <div className="text-center p-2 bg-primary-50 rounded-lg">
                                        <p className="text-xs text-default-500">Leave</p>
                                        <p className="text-lg font-bold text-primary-600">{monthlyStats.leave}</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}
            </CardBody>
        </Card>
    );
};

export default AttendanceCalendar;
