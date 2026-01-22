import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Head} from '@inertiajs/react';
import { 
    Button, 
    Card, 
    CardBody, 
    CardHeader, 
    Input, 
    Pagination,
    Skeleton
} from "@heroui/react";
import {
    CalendarIcon,
    CalendarDaysIcon,
    ChartBarIcon,
    CheckCircleIcon,
    ClipboardDocumentListIcon,
    ClockIcon,
    DocumentArrowDownIcon,
    ExclamationTriangleIcon,
    PresentationChartLineIcon,
    UserGroupIcon,
    UserIcon,
    XCircleIcon
} from "@heroicons/react/24/outline";
import {MagnifyingGlassIcon} from '@heroicons/react/24/solid';
import StatsCards from '@/Components/StatsCards.jsx';
import App from "@/Layouts/App.jsx";
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import AttendanceAdminTable from '@/Tables/HRM/AttendanceAdminTable.jsx';
import { useHRMAC } from '@/Hooks/useHRMAC';
import { useThemeRadius } from '@/Hooks/useThemeRadius';
import { motion } from 'framer-motion';
import axios from "axios";
import { showToast } from "@/utils/toastUtils";
import dayjs from "dayjs";

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


const AttendanceAdmin = React.memo(({title}) => {
    const themeRadius = useThemeRadius();
    
    // TODO: Update with proper HRMAC module hierarchy path once defined
    const { canView, canExport, isSuperAdmin } = useHRMAC();
    const canViewAttendance = canView('hrm.attendance') || isSuperAdmin();
    const canExportAttendance = canExport('hrm.attendance') || isSuperAdmin();
    
    // Custom media query logic - matching AttendanceEmployee
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [isLargeScreen, setIsLargeScreen] = useState(false);
    const [isMediumScreen, setIsMediumScreen] = useState(false);
    
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
            setIsTablet(window.innerWidth < 768);
            setIsLargeScreen(window.innerWidth >= 1025);
            setIsMediumScreen(window.innerWidth >= 641 && window.innerWidth <= 1024);
        };
        
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const [loading, setLoading] = useState(false);

    const [attendanceData, setAttendanceData] = useState([]);
    const [leaveCounts, setLeaveCounts] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [attendanceSettings, setAttendanceSettings] = useState(null);

    const [totalRows, setTotalRows] = useState(0);
    const [lastPage, setLastPage] = useState(0);
    const [employee, setEmployee] = useState('');
    const [perPage, setPerPage] = useState(30);
    const [currentPage, setCurrentPage] = useState(1);
    const [downloading, setDownloading] = useState('');

    const [filterData, setFilterData] = useState({
        currentMonth: dayjs().format('YYYY-MM'),
    });

    // Monthly attendance statistics state - focused on attendance metrics only
    const [stats, setStats] = useState({
        meta: { month: '', workingDays: 0, holidays: 0, weekends: 0 },
        attendance: { present: 0, absent: 0, leaves: 0, lateArrivals: 0, percentage: 0 },
        hours: { totalWork: 0, averageDaily: 0, overtime: 0 }
    });


    const handleFilterChange = useCallback((key, value) => {
        setFilterData(prevState => ({
            ...prevState,
            [key]: value,
        }));
    }, []);

    const fetchData = async (page = 1, perPage = 30, filterData) => {
        setLoading(true);

        try {
            const currentMonth = filterData.currentMonth
                ? dayjs(filterData.currentMonth).format('MM')
                : dayjs().format('MM');
            const currentYear = filterData.currentMonth
                ? dayjs(filterData.currentMonth).year()
                : dayjs().year();

            // Fetch attendance data
            const response = await axios.get(route('hrm.attendancesAdmin.paginate'), {
                params: {
                    page,
                    perPage,
                    employee: employee,
                    currentYear,
                    currentMonth,
                }
            });

            setAttendanceData(response.data.data);
            setTotalRows(response.data.total);
            setLastPage(response.data.last_page);
            setLeaveTypes(response.data.leaveTypes);
            setLeaveCounts(response.data.leaveCounts);

            // Fetch attendance settings for weekend configuration
            const settingsResponse = await axios.get(route('hrm.attendance-settings.index'), {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            if (settingsResponse.data && settingsResponse.data.attendanceSettings) {
                setAttendanceSettings(settingsResponse.data.attendanceSettings);
            }

            // Fetch stats (optional but aligned)
            const statsResponse = await axios.get(route('hrm.attendance.monthlyStats'), {
                params: {
                    currentYear,
                    currentMonth,
                }
            });

            if (statsResponse.data.success) {
        
                setStats(statsResponse.data.data);
            }
        } catch (error) {
            console.error(error);
            showToast.error('Failed to fetch data.', {
                icon: '🔴',
                style: {
                    backdropFilter: 'blur(16px) saturate(200%)',
                    fontFamily: `var(--fontFamily, "Inter")`,
                    background: `var(--theme-content1, #FFFFFF)`,
                    border: `var(--borderWidth, 1px) solid var(--theme-divider, #E4E4E7)`,
                    color: `var(--theme-foreground, #000000)`,
                }
            });
        } finally {
            setLoading(false);
        }
    };


    const handleSearch = (event) => {
        const value = event.target.value.toLowerCase();
        setEmployee(value);
    };

    useEffect(() => {
        fetchData(currentPage, perPage, filterData).then(r => '');
    }, [currentPage, perPage, filterData, employee]);


    const handlePageChange = (page) => {
        setCurrentPage(page);
    };


    const exportToExcel = async () => {
        setDownloading('excel');
        try {
            const currentMonth = filterData.currentMonth
                ? dayjs(filterData.currentMonth).format('YYYY-MM')
                : dayjs().format('YYYY-MM');

            const response = await axios.get(route('hrm.attendance.exportAdminExcel'), {
                params: {month: currentMonth},
                responseType: 'blob',
            });


            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = `Admin_Attendance_${currentMonth}.xlsx`;
            document.body.appendChild(link);
            link.click();
            setDownloading('');
            link.remove();
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Download failed:', error);
            setDownloading('');
            alert('Failed to download attendance sheet.');
        }
    };

    const exportToPdf = async () => {
        setDownloading('pdf');
        try {
            const currentMonth = filterData.currentMonth
                ? dayjs(filterData.currentMonth).format('YYYY-MM')
                : dayjs().format('YYYY-MM');

            const response = await axios.get(route('hrm.attendance.exportAdminPdf'), {
                params: {month: currentMonth},
                responseType: 'blob',
            });

            // Create a blob link for download
            const url = window.URL.createObjectURL(new Blob([response.data], {type: 'application/pdf'}));
            const link = document.createElement('a');
            link.href = url;
            link.download = `Admin_Attendance_${currentMonth}.pdf`;
            document.body.appendChild(link);
            link.click();
            setDownloading('');
            link.remove();
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error('PDF download failed:', error);
            setDownloading('');
            alert('Failed to download attendance PDF.');
        }
    };


    // Prepare all stats data for StatsCards component - Monthly attendance focused
    const allStatsData = useMemo(() => [
        { 
            title: "Total Employees", 
            value: stats.meta.totalEmployees,
            icon: <UserGroupIcon />, 
            color: "text-blue-600", 
            iconBg: "bg-blue-100",
            description: "Active employees"
        },
        { 
            title: "Working Days", 
            value: stats.meta.workingDays,
            icon: <CalendarDaysIcon />, 
            color: "text-purple-600", 
            iconBg: "bg-purple-100",
            description: `This month (${stats.meta.month})`
        },
        { 
            title: "Present Days", 
            value: stats.attendance.present,
            icon: <CheckCircleIcon />, 
            color: "text-success", 
            iconBg: "bg-success/20",
            description: "Total present days this month"
        },
        { 
            title: "Absent Days", 
            value: stats.attendance.absent,
            icon: <XCircleIcon />, 
            color: "text-danger", 
            iconBg: "bg-danger/20",
            description: "Total absent days this month"
        },
        { 
            title: "Late Arrivals", 
            value: stats.attendance.lateArrivals,
            icon: <ExclamationTriangleIcon />, 
            color: "text-orange-500", 
            iconBg: "bg-orange-100",
            description: "Total late arrivals this month"
        },
        { 
            title: "Attendance Rate", 
            value: `${stats.attendance.percentage}%`,
            icon: <PresentationChartLineIcon />, 
            color: "text-success", 
            iconBg: "bg-success/20",
            description: "Monthly attendance percentage"
        },
        { 
            title: "Approved Leaves", 
            value: stats.attendance.leaves,
            icon: <ClipboardDocumentListIcon />, 
            color: "text-blue-500", 
            iconBg: "bg-blue-100",
            description: "Approved leave requests this month"
        },
        { 
            title: "Perfect Attendance", 
            value: stats.attendance.perfectCount,
            icon: <CheckCircleIcon />, 
            color: "text-green-600", 
            iconBg: "bg-green-100",
            description: "Employees with perfect attendance"
        }
    ], [stats]);

    // Prepare action buttons for StandardPageLayout
    const actionButtons = useMemo(() => (
        <>
            {canExportAttendance && (
                <>
                    <Button
                        size={isMobile ? "sm" : "md"}
                        variant="bordered"
                        startContent={<DocumentArrowDownIcon className="w-4 h-4" />}
                        onPress={exportToExcel}
                        isLoading={downloading === 'excel'}
                        radius={themeRadius}
                    >
                        Excel
                    </Button>
                    <Button
                        size={isMobile ? "sm" : "md"}
                        variant="bordered"
                        color="danger"
                        startContent={<DocumentArrowDownIcon className="w-4 h-4" />}
                        onPress={exportToPdf}
                        isLoading={downloading === 'pdf'}
                        radius={themeRadius}
                    >
                        PDF
                    </Button>
                </>
            )}
        </>
    ), [canExportAttendance, isMobile, downloading, exportToExcel, exportToPdf, themeRadius]);

    // Prepare filters for StandardPageLayout
    const filtersSection = useMemo(() => (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="w-full sm:w-auto sm:min-w-[200px]">
                <Input
                    label="Search Employee"
                    type="text"
                    value={employee}
                    onValueChange={handleSearch}
                    placeholder="Enter employee name..."
                    variant="bordered"
                    size={isMobile ? "sm" : "md"}
                    radius={themeRadius}
                    startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                    classNames={{
                        inputWrapper: "border-default-200 hover:border-default-300",
                    }}
                />
            </div>

            <div className="w-full sm:w-auto sm:min-w-[200px]">
                <Input
                    label="Month/Year"
                    type="month"
                    value={filterData.currentMonth}
                    onValueChange={(value) => handleFilterChange('currentMonth', value)}
                    variant="bordered"
                    size={isMobile ? "sm" : "md"}
                    radius={themeRadius}
                    startContent={<CalendarIcon className="w-4 h-4 text-default-400" />}
                    classNames={{
                        inputWrapper: "border-default-200 hover:border-default-300",
                    }}
                />
            </div>
        </div>
    ), [employee, filterData.currentMonth, isMobile, themeRadius, handleSearch, handleFilterChange]);

    return (
        <>
            <Head title={title || "Attendance Management"} />
            
            <StandardPageLayout
                title="Attendance Management"
                subtitle="Monitor and manage employee attendance records"
                icon={<PresentationChartLineIcon />}
                actions={actionButtons}
                stats={<StatsCards stats={allStatsData} isLoading={loading} />}
                filters={filtersSection}
                isLoading={loading}
                ariaLabel="Attendance Management"
            >
                {/* Attendance Table Section */}
                <Card 
                    className="transition-all duration-200"
                    style={{
                        border: `var(--borderWidth, 2px) solid transparent`,
                        borderRadius: `var(--borderRadius, 12px)`,
                        fontFamily: `var(--fontFamily, "Inter")`,
                        background: `linear-gradient(135deg, 
                            var(--theme-content1, #FAFAFA) 20%, 
                            var(--theme-content2, #F4F4F5) 10%, 
                            var(--theme-content3, #F1F3F4) 20%)`,
                    }}
                >
                    <CardHeader 
                        className="border-b pb-2"
                        style={{
                            borderColor: `var(--theme-divider, #E4E4E7)`,
                        }}
                    >
                        {loading ? (
                            <div className="flex items-center gap-3">
                                <Skeleton className="w-8 h-8 rounded-lg" />
                                <Skeleton className="w-64 h-6 rounded" />
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <div 
                                    className="p-2 rounded-lg flex items-center justify-center"
                                    style={{
                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                        borderColor: `color-mix(in srgb, var(--theme-primary) 25%, transparent)`,
                                    }}
                                >
                                    <ClockIcon 
                                        className="w-6 h-6" 
                                        style={{ color: 'var(--theme-primary)' }}
                                    />
                                </div>
                                <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground">
                                    Employee Attendance Records
                                </h1>
                            </div>
                        )}
                    </CardHeader>
                    <CardBody>
                        <div className="max-h-[84vh] overflow-y-auto">
                            <AttendanceAdminTable
                                attendanceData={attendanceData}
                                currentYear={filterData.currentYear}
                                currentMonth={filterData.currentMonth}
                                leaveTypes={leaveTypes}
                                leaveCounts={leaveCounts}
                                loading={loading}
                                attendanceSettings={attendanceSettings}
                            />

                            {/* Pagination */}
                            {totalRows >= 30 && (
                                <div className="py-4 px-2 flex justify-center items-center">
                                    <Pagination
                                        initialPage={1}
                                        isCompact
                                        showControls
                                        showShadow
                                        color="primary"
                                        variant="bordered"
                                        page={currentPage}
                                        total={lastPage}
                                        onChange={handlePageChange}
                                        radius={themeRadius}
                                    />
                                </div>
                            )}
                        </div>
                    </CardBody>
                </Card>
            </StandardPageLayout>
        </>
    );
});
AttendanceAdmin.layout = (page) => <App>{page}</App>;

export default AttendanceAdmin;
