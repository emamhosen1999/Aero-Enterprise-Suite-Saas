import React, {useCallback, useEffect, useState} from 'react';
import {Head, usePage} from '@inertiajs/react';
import {motion} from 'framer-motion';
import axios from 'axios';
import {Card, CardBody, CardHeader, Input, Tab, Tabs,} from "@heroui/react";
import App from "@/Layouts/App.jsx";
import StatsCards from '@/Components/StatsCards.jsx';
import AttendanceEmployeeTable from "@/Tables/HRM/AttendanceEmployeeTable.jsx";
import AttendanceCalendar from "@/Components/HRM/Attendance/AttendanceCalendar.jsx";
import {
    CalendarDaysIcon,
    ChartBarIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    PresentationChartLineIcon,
    TableCellsIcon,
    UserIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';

const AttendanceEmployee = React.memo(({ title, totalWorkingDays, presentDays, absentDays, lateArrivals }) => {
    const { auth } = usePage().props;
    
    // Media query logic
    const [isLargeScreen, setIsLargeScreen] = useState(false);
    const [isMediumScreen, setIsMediumScreen] = useState(false);
    
    useEffect(() => {
        const checkScreenSize = () => {
            setIsLargeScreen(window.innerWidth >= 1025);
            setIsMediumScreen(window.innerWidth >= 641 && window.innerWidth <= 1024);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);
    
    // Helper function for radius
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
    
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [updateTimeSheet, setUpdateTimeSheet] = useState(false);
    const [activeTab, setActiveTab] = useState("table");
    
    const [filterData, setFilterData] = useState({
        currentMonth: new Date().toISOString().slice(0, 7), // YYYY-MM format
    });

    const [stats, setStats] = useState({
        meta: { month: '', workingDays: 0, holidays: 0, weekends: 0 },
        attendance: { present: 0, absent: 0, leaves: 0, lateArrivals: 0, percentage: 0 },
        hours: { totalWork: 0, averageDaily: 0, overtime: 0 }
    });

    const handleDateChange = (event) => {
        const newDate = event.target.value;
        // Ensure we create the date correctly from the input string to avoid timezone shifts
        if (newDate) {
            setSelectedDate(new Date(newDate));
        }
    };

    const handleFilterChange = useCallback((key, value) => {
        setFilterData(prevState => ({
            ...prevState,
            [key]: value,
        }));
    }, []);

    

    

    // ... date change handlers ...

    // 2. UPDATED FETCH FUNCTION
    const fetchMonthlyStats = useCallback(async () => {
        try {
            const response = await axios.get(route('attendance.myMonthlyStats'), {
                params: {
                    currentYear: new Date(filterData.currentMonth).getFullYear(),
                    currentMonth: String(new Date(filterData.currentMonth).getMonth() + 1).padStart(2, '0'),
                }
            });

            if (response.data.success) {
                setStats(response.data.data); // Set the structured data directly
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    }, [filterData.currentMonth]);

    useEffect(() => {
        fetchMonthlyStats();
    }, [fetchMonthlyStats]); 

    // const allStatsData = [
    //     { title: "Working Days", value: attendanceStats.totalWorkingDays, icon: <CalendarDaysIcon />, color: "text-primary", iconBg: "bg-primary/20", description: `Total for ${attendanceStats.month || 'this month'}` },
    //     { title: "Present Days", value: attendanceStats.presentDays, icon: <CheckCircleIcon />, color: "text-success", iconBg: "bg-success/20", description: "Days attended" },
    //     { title: "Absent Days", value: attendanceStats.absentDays, icon: <XCircleIcon />, color: "text-danger", iconBg: "bg-danger/20", description: "Days missed" },
    //     { title: "Late Arrivals", value: attendanceStats.lateArrivals, icon: <ExclamationTriangleIcon />, color: "text-warning", iconBg: "bg-warning/20", description: "Times late" },
    //     { title: "Attendance Rate", value: `${attendanceStats.attendancePercentage}%`, icon: <ChartBarIcon />, color: "text-success", iconBg: "bg-success/20", description: "Monthly performance" },
    //     { title: "Avg Work Hours", value: `${attendanceStats.averageWorkHours}h`, icon: <ClockIcon />, color: "text-primary", iconBg: "bg-primary/20", description: "Daily average" },
    //     { title: "Overtime", value: `${attendanceStats.overtimeHours}h`, icon: <ClockIcon />, color: "text-secondary", iconBg: "bg-secondary/20", description: "Extra hours" },
    //     { title: "Leave Days", value: attendanceStats.totalLeaveDays, icon: <UserIcon />, color: "text-warning", iconBg: "bg-warning/20", description: "Leaves taken" }
    // ];

    const allStatsData = [
        { 
            title: "Working Days", 
            value: stats.meta.workingDays, 
            icon: <CalendarDaysIcon />, 
            color: "text-default-600", 
            iconBg: "bg-default-100", 
            description: `Calendar: ${stats.meta.month}` 
        },
        { 
            title: "Present", 
            value: stats.attendance.present, 
            icon: <CheckCircleIcon />, 
            color: "text-success", 
            iconBg: "bg-success/20", 
            description: `${stats.attendance.percentage}% Attendance Rate` 
        },
        { 
            title: "Absent", 
            value: stats.attendance.absent, 
            icon: <XCircleIcon />, 
            color: "text-danger", 
            iconBg: "bg-danger/20", 
            description: "Unexcused absences" 
        },
        { 
            title: "On Leave", 
            value: stats.attendance.leaves, 
            icon: <UserIcon />, 
            color: "text-warning", 
            iconBg: "bg-warning/20", 
            description: "Approved leaves" 
        },
        { 
            title: "Late Arrivals", 
            value: stats.attendance.lateArrivals, 
            icon: <ExclamationTriangleIcon />, 
            color: "text-orange-500", 
            iconBg: "bg-orange-100", 
            description: "After grace period" 
        },
        { 
            title: "Total Hours", 
            value: `${stats.hours.totalWork}h`, 
            icon: <ClockIcon />, 
            color: "text-primary", 
            iconBg: "bg-primary/20", 
            description: "Total production time" 
        },
        { 
            title: "Daily Avg", 
            value: `${stats.hours.averageDaily}h`, 
            icon: <PresentationChartLineIcon />, 
            color: "text-secondary", 
            iconBg: "bg-secondary/20", 
            description: "Target: 8.0h" 
        },
        { 
            title: "Overtime", 
            value: `${stats.hours.overtime}h`, 
            icon: <ChartBarIcon />, 
            color: "text-success-600", 
            iconBg: "bg-success-100", 
            description: "Extra hours logged" 
        }
    ];



    return (
        <>
            <Head title={title || "My Attendance"} />
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="My Attendance Management">
                <div className="space-y-4">
                    <div className="w-full">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
                            <Card 
                                className="transition-all duration-200"
                                style={{
                                    border: `var(--borderWidth, 2px) solid transparent`,
                                    borderRadius: `var(--borderRadius, 12px)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                    background: `linear-gradient(135deg, var(--theme-content1, #FAFAFA) 20%, var(--theme-content2, #F4F4F5) 10%, var(--theme-content3, #F1F3F4) 20%)`,
                                }}
                            >
                                <CardHeader 
                                    className="border-b p-0"
                                    style={{
                                        borderColor: `var(--theme-divider, #E4E4E7)`,
                                        background: `linear-gradient(135deg, color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
                                    }}
                                >
                                    <div className={`${isLargeScreen ? 'p-6' : isMediumScreen ? 'p-4' : 'p-3'} w-full`}>
                                        <div className="flex flex-col space-y-4">
                                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                                <div className="flex items-center gap-3 lg:gap-4">
                                                    <div 
                                                        className={`${isLargeScreen ? 'p-3' : isMediumScreen ? 'p-2.5' : 'p-2'} rounded-xl flex items-center justify-center`}
                                                        style={{
                                                            background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                            borderColor: `color-mix(in srgb, var(--theme-primary) 25%, transparent)`,
                                                            borderWidth: `var(--borderWidth, 2px)`,
                                                            borderRadius: `var(--borderRadius, 12px)`,
                                                        }}
                                                    >
                                                        <PresentationChartLineIcon className={`${isLargeScreen ? 'w-8 h-8' : isMediumScreen ? 'w-6 h-6' : 'w-5 h-5'}`} style={{ color: 'var(--theme-primary)' }} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className={`${isLargeScreen ? 'text-2xl' : isMediumScreen ? 'text-xl' : 'text-lg'} font-bold text-foreground ${!isLargeScreen ? 'truncate' : ''}`} style={{ fontFamily: `var(--fontFamily, "Inter")` }}>
                                                            My Attendance
                                                        </h4>
                                                        <p className={`${isLargeScreen ? 'text-sm' : 'text-xs'} text-default-500 ${!isLargeScreen ? 'truncate' : ''}`} style={{ fontFamily: `var(--fontFamily, "Inter")` }}>
                                                            View your attendance records and timesheet details
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    <StatsCards stats={allStatsData} className="mb-6" />
                                    
                                    <div className="mb-6">
                                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                                            <div className="w-full sm:w-auto sm:min-w-[200px]">
                                                <Input
                                                    label="Month/Year"
                                                    type="month"
                                                    value={filterData.currentMonth}
                                                    onChange={(e) => handleFilterChange('currentMonth', e.target.value)}
                                                    variant="bordered"
                                                    size="sm"
                                                    radius={getThemeRadius()}
                                                    startContent={<CalendarDaysIcon className="w-4 h-4 text-default-400" />}
                                                    classNames={{ input: "text-sm" }}
                                                    style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                                    aria-label="Select month and year for attendance"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <Card 
                                        className="transition-all duration-200"
                                        style={{
                                            border: `var(--borderWidth, 2px) solid transparent`,
                                            borderRadius: `var(--borderRadius, 12px)`,
                                            fontFamily: `var(--fontFamily, "Inter")`,
                                            background: `linear-gradient(135deg, var(--theme-content1, #FAFAFA) 20%, var(--theme-content2, #F4F4F5) 10%, var(--theme-content3, #F1F3F4) 20%)`,
                                        }}
                                    >
                                        <CardHeader className="border-b pb-2" style={{ borderColor: `var(--theme-divider, #E4E4E7)` }}>
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-3">
                                                    <div 
                                                        className="p-2 rounded-lg flex items-center justify-center"
                                                        style={{
                                                            background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                            borderColor: `color-mix(in srgb, var(--theme-primary) 25%, transparent)`,
                                                        }}
                                                    >
                                                        <ClockIcon className="w-6 h-6" style={{ color: 'var(--theme-primary)' }} />
                                                    </div>
                                                    <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground" style={{ fontFamily: `var(--fontFamily, "Inter")` }}>
                                                        My Attendance Records
                                                    </h1>
                                                </div>
                                                <Tabs
                                                    selectedKey={activeTab}
                                                    onSelectionChange={setActiveTab}
                                                    variant="underlined"
                                                    size="sm"
                                                    classNames={{
                                                        tabList: "gap-4",
                                                        cursor: "w-full bg-primary-500",
                                                        tab: "max-w-fit px-3 h-10",
                                                        tabContent: "group-data-[selected=true]:text-primary text-default-600 font-medium"
                                                    }}
                                                >
                                                    <Tab 
                                                        key="calendar" 
                                                        title={
                                                            <div className="flex items-center gap-2">
                                                                <CalendarDaysIcon className="w-4 h-4" />
                                                                <span className="hidden sm:inline">Calendar</span>
                                                            </div>
                                                        }
                                                    />
                                                    <Tab 
                                                        key="table" 
                                                        title={
                                                            <div className="flex items-center gap-2">
                                                                <TableCellsIcon className="w-4 h-4" />
                                                                <span className="hidden sm:inline">Table</span>
                                                            </div>
                                                        }
                                                    />
                                                </Tabs>
                                            </div>
                                        </CardHeader>
                                        <CardBody>
                                            <div className="max-h-[84vh] overflow-y-auto">
                                                {activeTab === "calendar" ? (
                                                    <AttendanceCalendar 
                                                        userId={auth.user.id}
                                                        currentMonth={filterData.currentMonth}
                                                        showStats={true}
                                                    />
                                                ) : (
                                                    <AttendanceEmployeeTable 
                                                        selectedDate={selectedDate} 
                                                        handleDateChange={handleDateChange}
                                                        updateTimeSheet={updateTimeSheet}
                                                        externalFilterData={filterData}
                                                    />
                                                )}
                                            </div>
                                        </CardBody>
                                    </Card>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
});
AttendanceEmployee.layout = (page) => <App>{page}</App>;
export default AttendanceEmployee;
