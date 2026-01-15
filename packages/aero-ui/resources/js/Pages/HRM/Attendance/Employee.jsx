import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  Card, 
  CardBody, 
  CardHeader,
  Input,
} from "@heroui/react";
import App from "@/Layouts/App.jsx";
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import AttendanceEmployeeTable from "@/Tables/HRM/AttendanceEmployeeTable.jsx";
import { useHRMAC } from '@/Hooks/useHRMAC';
import { useThemeRadius } from '@/Hooks/useThemeRadius';
import { 
  ClockIcon, 
  CalendarDaysIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PresentationChartLineIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const AttendanceEmployee = React.memo(({ title, totalWorkingDays, presentDays, absentDays, lateArrivals }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    
    // TODO: Update with proper HRMAC module hierarchy path once defined
    const { canView, isSuperAdmin } = useHRMAC();
    const canViewAttendance = canView('hrm.attendance') || isSuperAdmin();
    
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
    
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [updateTimeSheet, setUpdateTimeSheet] = useState(false);
    
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
            const response = await axios.get(route('hrm.attendance.myMonthlyStats'), {
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


    // Prepare filters for StandardPageLayout
    const filtersSection = useMemo(() => (
        <div className="w-full sm:w-auto sm:min-w-[200px]">
            <Input
                label="Month/Year"
                type="month"
                value={filterData.currentMonth}
                onChange={(e) => handleFilterChange('currentMonth', e.target.value)}
                variant="bordered"
                size="sm"
                radius={themeRadius}
                startContent={<CalendarDaysIcon className="w-4 h-4 text-default-400" />}
                classNames={{ input: "text-sm" }}
                aria-label="Select month and year for attendance"
            />
        </div>
    ), [filterData.currentMonth, themeRadius, handleFilterChange]);

    return (
        <>
            <Head title={title || "My Attendance"} />
            
            <StandardPageLayout
                title="My Attendance"
                subtitle="View your attendance records and timesheet details"
                icon={<PresentationChartLineIcon />}
                stats={<StatsCards stats={allStatsData} />}
                filters={filtersSection}
                ariaLabel="My Attendance Management"
            >
                {/* Attendance Table Section */}
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
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground">
                                My Attendance Records
                            </h1>
                        </div>
                    </CardHeader>
                    <CardBody>
                        <div className="max-h-[84vh] overflow-y-auto">
                            <AttendanceEmployeeTable 
                                selectedDate={selectedDate} 
                                handleDateChange={handleDateChange}
                                updateTimeSheet={updateTimeSheet}
                                externalFilterData={filterData}
                            />
                        </div>
                    </CardBody>
                </Card>
            </StandardPageLayout>
        </>
    );
});
AttendanceEmployee.layout = (page) => <App>{page}</App>;
export default AttendanceEmployee;