import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { 
    Button, 
    Card, 
    CardBody, 
    CardHeader, 
    Input, 
    Select, 
    SelectItem,
    ButtonGroup,
    Chip
} from "@heroui/react";
import { 
    CalendarIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ViewColumnsIcon,
    FunnelIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const TimeOffCalendar = ({ title, events: initialEvents, employees: initialEmployees }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { hasAccess } = useHRMAC();
    
    // Responsive breakpoints
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
    const [loading, setLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(true);
    const [events, setEvents] = useState(initialEvents || []);
    const [employees, setEmployees] = useState(initialEmployees || []);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('month');
    const [filters, setFilters] = useState({ employee: 'all', type: 'all', status: 'approved' });
    const [stats, setStats] = useState({ thisMonth: 0, nextWeek: 0, today: 0, conflicts: 0 });

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { 
            title: "This Month", 
            value: stats.thisMonth, 
            icon: <CalendarIcon className="w-5 h-5" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Next Week", 
            value: stats.nextWeek, 
            icon: <CalendarIcon className="w-5 h-5" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "Today", 
            value: stats.today, 
            icon: <CalendarIcon className="w-5 h-5" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Conflicts", 
            value: stats.conflicts, 
            icon: <CalendarIcon className="w-5 h-5" />, 
            color: "text-danger", 
            iconBg: "bg-danger/20" 
        }
    ], [stats]);

    // Permission checks
    const canViewCalendar = hasAccess('hrm.time-off.calendar');

    // Fetch calendar events
    const fetchCalendarEvents = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.time-off.calendar'), {
                params: { 
                    month: currentDate.getMonth() + 1, 
                    year: currentDate.getFullYear(),
                    view: viewMode,
                    ...filters 
                }
            });
            if (response.status === 200) {
                setEvents(response.data.events || []);
                setStats(response.data.stats || { thisMonth: 0, nextWeek: 0, today: 0, conflicts: 0 });
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), { error: 'Failed to fetch calendar events' });
        } finally {
            setLoading(false);
            setStatsLoading(false);
        }
    }, [currentDate, viewMode, filters]);

    useEffect(() => { fetchCalendarEvents(); }, [fetchCalendarEvents]);

    // Date navigation
    const navigateDate = useCallback((direction) => {
        const newDate = new Date(currentDate);
        if (viewMode === 'month') {
            newDate.setMonth(newDate.getMonth() + direction);
        } else if (viewMode === 'week') {
            newDate.setDate(newDate.getDate() + (direction * 7));
        }
        setCurrentDate(newDate);
    }, [currentDate, viewMode]);

    // Filter handlers
    const handleFilterChange = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    // Generate calendar grid for month view
    const generateCalendarGrid = useCallback(() => {
        if (viewMode !== 'month') return [];
        
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const grid = [];
        let dayCount = 1;
        
        // Generate 6 weeks (42 days)
        for (let week = 0; week < 6; week++) {
            const weekDays = [];
            for (let day = 0; day < 7; day++) {
                const dayIndex = week * 7 + day;
                
                if (dayIndex < firstDay || dayCount > daysInMonth) {
                    weekDays.push(null);
                } else {
                    const currentDay = new Date(year, month, dayCount);
                    const dayEvents = events.filter(event => {
                        const eventStart = new Date(event.start_date);
                        const eventEnd = new Date(event.end_date);
                        return currentDay >= eventStart && currentDay <= eventEnd;
                    });
                    
                    weekDays.push({
                        date: dayCount,
                        fullDate: currentDay,
                        events: dayEvents,
                        isToday: currentDay.toDateString() === new Date().toDateString()
                    });
                    dayCount++;
                }
            }
            grid.push(weekDays);
            if (dayCount > daysInMonth) break;
        }
        
        return grid;
    }, [currentDate, viewMode, events]);

    const calendarGrid = generateCalendarGrid();
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Format date for display
    const formatDisplayDate = useCallback(() => {
        const options = viewMode === 'month' 
            ? { month: 'long', year: 'numeric' }
            : { month: 'short', day: 'numeric', year: 'numeric' };
        return currentDate.toLocaleDateString('en-US', options);
    }, [currentDate, viewMode]);

    return (
        <>
            <Head title={title} />
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Time Off Calendar">
                <div className="space-y-4">
                    <div className="w-full">
                        {/* Animated Card wrapper */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            {/* Main Card with theme styling */}
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
                                {/* Card Header */}
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
                                                <div className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <CalendarIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Time Off Calendar
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Visual calendar view of all time off requests
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Calendar Navigation */}
                                            <div className="flex items-center gap-4">
                                                <ButtonGroup size="sm">
                                                    <Button
                                                        variant={viewMode === 'month' ? 'solid' : 'flat'}
                                                        onPress={() => setViewMode('month')}
                                                    >
                                                        Month
                                                    </Button>
                                                    <Button
                                                        variant={viewMode === 'week' ? 'solid' : 'flat'}
                                                        onPress={() => setViewMode('week')}
                                                    >
                                                        Week
                                                    </Button>
                                                </ButtonGroup>
                                                
                                                <div className="flex items-center gap-2">
                                                    <Button 
                                                        isIconOnly 
                                                        size="sm" 
                                                        variant="flat"
                                                        onPress={() => navigateDate(-1)}
                                                    >
                                                        <ChevronLeftIcon className="w-4 h-4" />
                                                    </Button>
                                                    <span className="font-semibold min-w-[120px] text-center">
                                                        {formatDisplayDate()}
                                                    </span>
                                                    <Button 
                                                        isIconOnly 
                                                        size="sm" 
                                                        variant="flat"
                                                        onPress={() => navigateDate(1)}
                                                    >
                                                        <ChevronRightIcon className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* Stats Cards */}
                                    <StatsCards stats={statsData} isLoading={statsLoading} className="mb-6" />
                                    
                                    {/* Filter Section */}
                                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                        <Select
                                            label="Employee"
                                            placeholder="All Employees"
                                            selectedKeys={filters.employee !== 'all' ? [filters.employee] : []}
                                            onSelectionChange={(keys) => handleFilterChange('employee', Array.from(keys)[0] || 'all')}
                                            size="sm"
                                            radius={themeRadius}
                                        >
                                            <SelectItem key="all">All Employees</SelectItem>
                                            {employees.map(emp => (
                                                <SelectItem key={emp.id}>{emp.name}</SelectItem>
                                            ))}
                                        </Select>

                                        <Select
                                            label="Status"
                                            placeholder="Approved Only"
                                            selectedKeys={filters.status !== 'all' ? [filters.status] : []}
                                            onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || 'approved')}
                                            size="sm"
                                            radius={themeRadius}
                                        >
                                            <SelectItem key="approved">Approved Only</SelectItem>
                                            <SelectItem key="all">All Status</SelectItem>
                                            <SelectItem key="pending">Pending</SelectItem>
                                        </Select>
                                    </div>

                                    {/* Calendar Grid */}
                                    {viewMode === 'month' && (
                                        <div className="border border-divider rounded-lg overflow-hidden">
                                            {/* Calendar Header */}
                                            <div className="grid grid-cols-7 bg-default-100">
                                                {weekdays.map(day => (
                                                    <div key={day} className="p-3 text-center font-semibold text-sm text-default-600">
                                                        {day}
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            {/* Calendar Body */}
                                            <div className="grid grid-cols-7 divide-x divide-y divide-divider">
                                                {calendarGrid.flat().map((dayData, index) => (
                                                    <div 
                                                        key={index} 
                                                        className={`min-h-[100px] p-2 ${
                                                            !dayData ? 'bg-content2' : 
                                                            dayData.isToday ? 'bg-primary-50' : 'bg-content1'
                                                        }`}
                                                    >
                                                        {dayData && (
                                                            <>
                                                                <div className={`text-sm font-medium mb-1 ${
                                                                    dayData.isToday ? 'text-primary' : 'text-default-700'
                                                                }`}>
                                                                    {dayData.date}
                                                                </div>
                                                                <div className="space-y-1">
                                                                    {dayData.events.slice(0, 3).map((event, eventIndex) => (
                                                                        <div 
                                                                            key={eventIndex}
                                                                            className="text-xs p-1 rounded bg-primary-100 text-primary-800 truncate"
                                                                            title={`${event.employee?.name} - ${event.leave_type}`}
                                                                        >
                                                                            {event.employee?.name}
                                                                        </div>
                                                                    ))}
                                                                    {dayData.events.length > 3 && (
                                                                        <div className="text-xs text-default-500">
                                                                            +{dayData.events.length - 3} more
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Week View */}
                                    {viewMode === 'week' && (
                                        <div className="border border-divider rounded-lg p-4">
                                            <div className="text-center text-default-500">
                                                Week view implementation coming soon...
                                            </div>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

TimeOffCalendar.layout = (page) => <App children={page} />;
export default TimeOffCalendar;