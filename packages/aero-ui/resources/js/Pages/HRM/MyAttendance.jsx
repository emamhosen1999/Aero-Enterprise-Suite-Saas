import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Switch, Avatar } from "@heroui/react";
import { 
    ClockIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    CheckCircleIcon,
    XCircleIcon,
    CalendarDaysIcon,
    UserIcon,
    BuildingOfficeIcon,
    ChartBarIcon,
    ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const MyAttendance = ({ title, currentEmployee, attendanceData = [], leaveTypes: initialLeaveTypes = [] }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate } = useHRMAC();
    
    // Theme radius helper
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
    const [attendanceRecords, setAttendanceRecords] = useState(attendanceData);
    const [leaveTypes, setLeaveTypes] = useState(initialLeaveTypes);
    const [filters, setFilters] = useState({ 
        search: '', 
        month: new Date().getMonth() + 1, 
        year: new Date().getFullYear(), 
        status: '',
        attendance_type: ''
    });
    const [pagination, setPagination] = useState({ currentPage: 1, perPage: 31, total: 0, lastPage: 1 });
    const [stats, setStats] = useState({ 
        total_working_days: 0, 
        present_days: 0, 
        absent_days: 0, 
        late_arrivals: 0,
        early_departures: 0,
        total_hours: 0,
        average_hours: 0,
        overtime_hours: 0
    });
    const [modalStates, setModalStates] = useState({ clockIn: false, clockOut: false, correction: false });
    const [currentTime, setCurrentTime] = useState(new Date());
    const [todayAttendance, setTodayAttendance] = useState(null);
    const [correctionData, setCorrectionData] = useState({
        date: new Date().toISOString().split('T')[0],
        clock_in_time: '',
        clock_out_time: '',
        reason: '',
        notes: ''
    });

    // Permission checks
    const canClockInOut = canCreate('hrm.attendance.self') || true; // Usually all employees can clock in/out
    const canRequestCorrection = canUpdate('hrm.attendance.correction') || true;

    // Real-time clock update
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { 
            title: "Working Days", 
            value: stats.total_working_days, 
            icon: <CalendarDaysIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Present Days", 
            value: stats.present_days, 
            icon: <CheckCircleIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "Absent Days", 
            value: stats.absent_days, 
            icon: <XCircleIcon className="w-6 h-6" />, 
            color: "text-danger", 
            iconBg: "bg-danger/20" 
        },
        { 
            title: "Total Hours", 
            value: `${stats.total_hours}h`, 
            icon: <ClockIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
    ], [stats]);

    // Attendance configuration
    const attendanceStatuses = [
        { key: 'present', label: 'Present', color: 'success' },
        { key: 'absent', label: 'Absent', color: 'danger' },
        { key: 'late', label: 'Late', color: 'warning' },
        { key: 'half_day', label: 'Half Day', color: 'primary' },
        { key: 'on_leave', label: 'On Leave', color: 'secondary' },
        { key: 'holiday', label: 'Holiday', color: 'default' },
    ];

    const attendanceTypes = [
        { key: 'regular', label: 'Regular' },
        { key: 'overtime', label: 'Overtime' },
        { key: 'remote', label: 'Remote Work' },
        { key: 'field_work', label: 'Field Work' },
        { key: 'training', label: 'Training' },
        { key: 'meeting', label: 'Meeting' },
    ];

    const getStatusColor = (status) => {
        return attendanceStatuses.find(s => s.key === status)?.color || 'default';
    };

    const getStatusLabel = (status) => {
        return attendanceStatuses.find(s => s.key === status)?.label || status;
    };

    const getTypeLabel = (type) => {
        return attendanceTypes.find(t => t.key === type)?.label || type;
    };

    const formatTime = (timeString) => {
        if (!timeString) return 'N/A';
        return new Date(`1970-01-01T${timeString}`).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    const formatDuration = (minutes) => {
        if (!minutes) return '0h 0m';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const getCurrentDate = () => {
        return new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const getCurrentTime = () => {
        return currentTime.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
    };

    // Data fetching
    const fetchAttendanceData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.my-attendance.data'), {
                params: { 
                    page: pagination.currentPage, 
                    perPage: pagination.perPage,
                    ...filters
                }
            });
            if (response.status === 200) {
                setAttendanceRecords(response.data.attendance || []);
                setTodayAttendance(response.data.today_attendance || null);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total || 0,
                    lastPage: response.data.last_page || 1
                }));
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to fetch attendance data'
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('hrm.my-attendance.stats'), {
                params: {
                    month: filters.month,
                    year: filters.year
                }
            });
            if (response.status === 200) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch attendance stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, [filters.month, filters.year]);

    useEffect(() => {
        fetchAttendanceData();
        fetchStats();
    }, [fetchAttendanceData, fetchStats]);

    // Clock in/out handlers
    const handleClockIn = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('hrm.attendance.clock-in'));
                if (response.status === 200) {
                    resolve([response.data.message || 'Clocked in successfully']);
                    fetchAttendanceData();
                    fetchStats();
                    closeModal('clockIn');
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to clock in']);
            }
        });

        showToast.promise(promise, {
            loading: 'Clocking in...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleClockOut = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('hrm.attendance.clock-out'));
                if (response.status === 200) {
                    resolve([response.data.message || 'Clocked out successfully']);
                    fetchAttendanceData();
                    fetchStats();
                    closeModal('clockOut');
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to clock out']);
            }
        });

        showToast.promise(promise, {
            loading: 'Clocking out...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Attendance correction request
    const handleCorrectionRequest = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('hrm.attendance.correction'), correctionData);
                if (response.status === 200) {
                    resolve([response.data.message || 'Correction request submitted']);
                    fetchAttendanceData();
                    closeModal('correction');
                    setCorrectionData({
                        date: new Date().toISOString().split('T')[0],
                        clock_in_time: '',
                        clock_out_time: '',
                        reason: '',
                        notes: ''
                    });
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to submit correction request']);
            }
        });

        showToast.promise(promise, {
            loading: 'Submitting correction request...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Modal handlers
    const openModal = (type) => {
        setModalStates(prev => ({ ...prev, [type]: true }));
    };

    const closeModal = (type) => {
        setModalStates(prev => ({ ...prev, [type]: false }));
    };

    // Filter handlers
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    // Table columns
    const columns = [
        { uid: 'date', name: 'Date' },
        { uid: 'day', name: 'Day' },
        { uid: 'clock_in', name: 'Clock In' },
        { uid: 'clock_out', name: 'Clock Out' },
        { uid: 'duration', name: 'Duration' },
        { uid: 'break_time', name: 'Break' },
        { uid: 'status', name: 'Status' },
        { uid: 'type', name: 'Type' },
    ];

    const renderCell = useCallback((item, columnKey) => {
        switch (columnKey) {
            case 'date':
                return new Date(item.date).toLocaleDateString();
            case 'day':
                return new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' });
            case 'clock_in':
                return (
                    <div className="flex items-center gap-2">
                        {formatTime(item.clock_in_time)}
                        {item.is_late && <ExclamationTriangleIcon className="w-4 h-4 text-warning" />}
                    </div>
                );
            case 'clock_out':
                return (
                    <div className="flex items-center gap-2">
                        {formatTime(item.clock_out_time)}
                        {item.is_early_departure && <ExclamationTriangleIcon className="w-4 h-4 text-warning" />}
                    </div>
                );
            case 'duration':
                return formatDuration(item.total_minutes);
            case 'break_time':
                return formatDuration(item.break_minutes);
            case 'status':
                return (
                    <Chip 
                        color={getStatusColor(item.status)} 
                        size="sm" 
                        variant="flat"
                    >
                        {getStatusLabel(item.status)}
                    </Chip>
                );
            case 'type':
                return item.type ? getTypeLabel(item.type) : 'Regular';
            default:
                return item[columnKey] || '-';
        }
    }, []);

    return (
        <>
            <Head title={title} />
            
            {/* Clock In Modal */}
            {modalStates.clockIn && (
                <Modal isOpen={modalStates.clockIn} onOpenChange={() => closeModal('clockIn')}>
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold text-success">Clock In</h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="text-center space-y-4">
                                <div>
                                    <p className="text-lg font-semibold">{getCurrentDate()}</p>
                                    <p className="text-3xl font-bold text-primary">{getCurrentTime()}</p>
                                </div>
                                <p>Are you ready to start your work day?</p>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('clockIn')}>Cancel</Button>
                            <Button color="success" onPress={handleClockIn}>Clock In</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {/* Clock Out Modal */}
            {modalStates.clockOut && (
                <Modal isOpen={modalStates.clockOut} onOpenChange={() => closeModal('clockOut')}>
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold text-danger">Clock Out</h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="text-center space-y-4">
                                <div>
                                    <p className="text-lg font-semibold">{getCurrentDate()}</p>
                                    <p className="text-3xl font-bold text-primary">{getCurrentTime()}</p>
                                </div>
                                {todayAttendance && (
                                    <div className="bg-default-100 p-4 rounded-lg">
                                        <p><strong>Clock In:</strong> {formatTime(todayAttendance.clock_in_time)}</p>
                                        <p><strong>Duration:</strong> {formatDuration(todayAttendance.total_minutes)}</p>
                                    </div>
                                )}
                                <p>Ready to end your work day?</p>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('clockOut')}>Cancel</Button>
                            <Button color="danger" onPress={handleClockOut}>Clock Out</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {/* Attendance Correction Modal */}
            {modalStates.correction && (
                <Modal 
                    isOpen={modalStates.correction} 
                    onOpenChange={() => closeModal('correction')}
                    size="lg"
                >
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">Request Attendance Correction</h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <Input
                                    label="Date"
                                    value={correctionData.date}
                                    onValueChange={(value) => setCorrectionData(prev => ({ ...prev, date: value }))}
                                    type="date"
                                    radius={getThemeRadius()}
                                />
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Clock In Time"
                                        value={correctionData.clock_in_time}
                                        onValueChange={(value) => setCorrectionData(prev => ({ ...prev, clock_in_time: value }))}
                                        type="time"
                                        radius={getThemeRadius()}
                                    />
                                    
                                    <Input
                                        label="Clock Out Time"
                                        value={correctionData.clock_out_time}
                                        onValueChange={(value) => setCorrectionData(prev => ({ ...prev, clock_out_time: value }))}
                                        type="time"
                                        radius={getThemeRadius()}
                                    />
                                </div>

                                <Select
                                    label="Reason"
                                    placeholder="Select reason for correction"
                                    selectedKeys={correctionData.reason ? [correctionData.reason] : []}
                                    onSelectionChange={(keys) => setCorrectionData(prev => ({ ...prev, reason: Array.from(keys)[0] || '' }))}
                                    radius={getThemeRadius()}
                                >
                                    <SelectItem key="forgot_clock_in">Forgot to Clock In</SelectItem>
                                    <SelectItem key="forgot_clock_out">Forgot to Clock Out</SelectItem>
                                    <SelectItem key="system_error">System Error</SelectItem>
                                    <SelectItem key="network_issue">Network Issue</SelectItem>
                                    <SelectItem key="device_issue">Device Issue</SelectItem>
                                    <SelectItem key="other">Other</SelectItem>
                                </Select>

                                <Input
                                    label="Additional Notes"
                                    placeholder="Enter additional details"
                                    value={correctionData.notes}
                                    onValueChange={(value) => setCorrectionData(prev => ({ ...prev, notes: value }))}
                                    radius={getThemeRadius()}
                                />
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('correction')}>Cancel</Button>
                            <Button color="primary" onPress={handleCorrectionRequest}>Submit Request</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="My Attendance">
                <div className="space-y-4">
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
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <ClockIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        My Attendance
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Track your daily attendance and work hours
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Clock In/Out Section */}
                                            <div className="flex flex-col sm:flex-row gap-2">
                                                <div className="text-center sm:text-right">
                                                    <p className="text-sm text-default-600">{getCurrentDate()}</p>
                                                    <p className="text-lg font-bold text-primary">{getCurrentTime()}</p>
                                                </div>
                                                
                                                <div className="flex gap-2">
                                                    {canClockInOut && !todayAttendance?.clock_in_time && (
                                                        <Button 
                                                            color="success" 
                                                            variant="shadow"
                                                            startContent={<CheckCircleIcon className="w-4 h-4" />}
                                                            onPress={() => openModal('clockIn')}
                                                            size={isMobile ? "sm" : "md"}
                                                        >
                                                            Clock In
                                                        </Button>
                                                    )}
                                                    
                                                    {canClockInOut && todayAttendance?.clock_in_time && !todayAttendance?.clock_out_time && (
                                                        <Button 
                                                            color="danger" 
                                                            variant="shadow"
                                                            startContent={<XCircleIcon className="w-4 h-4" />}
                                                            onPress={() => openModal('clockOut')}
                                                            size={isMobile ? "sm" : "md"}
                                                        >
                                                            Clock Out
                                                        </Button>
                                                    )}
                                                    
                                                    {canRequestCorrection && (
                                                        <Button 
                                                            color="secondary" 
                                                            variant="flat"
                                                            startContent={<PencilIcon className="w-4 h-4" />}
                                                            onPress={() => openModal('correction')}
                                                            size={isMobile ? "sm" : "md"}
                                                        >
                                                            Request Correction
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Today's Status */}
                                        {todayAttendance && (
                                            <div className="mt-4 p-4 bg-default-100 rounded-lg">
                                                <div className="flex flex-wrap items-center gap-4 text-sm">
                                                    <div>
                                                        <span className="text-default-600">Clock In: </span>
                                                        <span className="font-semibold">{formatTime(todayAttendance.clock_in_time)}</span>
                                                    </div>
                                                    {todayAttendance.clock_out_time && (
                                                        <div>
                                                            <span className="text-default-600">Clock Out: </span>
                                                            <span className="font-semibold">{formatTime(todayAttendance.clock_out_time)}</span>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <span className="text-default-600">Duration: </span>
                                                        <span className="font-semibold">{formatDuration(todayAttendance.total_minutes)}</span>
                                                    </div>
                                                    <Chip 
                                                        color={getStatusColor(todayAttendance.status)} 
                                                        size="sm" 
                                                        variant="flat"
                                                    >
                                                        {getStatusLabel(todayAttendance.status)}
                                                    </Chip>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    <StatsCards stats={statsData} isLoading={statsLoading} className="mb-6" />
                                    
                                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                        <Input
                                            label="Search"
                                            placeholder="Search attendance..."
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                                            variant="bordered"
                                            size="sm"
                                            radius={getThemeRadius()}
                                        />
                                        
                                        <Select
                                            label="Month"
                                            selectedKeys={[String(filters.month)]}
                                            onSelectionChange={(keys) => handleFilterChange('month', parseInt(Array.from(keys)[0]))}
                                        >
                                            {Array.from({ length: 12 }, (_, i) => (
                                                <SelectItem key={i + 1} value={i + 1}>
                                                    {new Date(0, i).toLocaleString('en-US', { month: 'long' })}
                                                </SelectItem>
                                            ))}
                                        </Select>

                                        <Select
                                            label="Year"
                                            selectedKeys={[String(filters.year)]}
                                            onSelectionChange={(keys) => handleFilterChange('year', parseInt(Array.from(keys)[0]))}
                                        >
                                            {Array.from({ length: 5 }, (_, i) => {
                                                const year = new Date().getFullYear() - 2 + i;
                                                return (
                                                    <SelectItem key={year} value={year}>
                                                        {year}
                                                    </SelectItem>
                                                );
                                            })}
                                        </Select>

                                        <Select
                                            placeholder="All Status"
                                            selectedKeys={filters.status ? [filters.status] : []}
                                            onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || '')}
                                        >
                                            {attendanceStatuses.map(status => (
                                                <SelectItem key={status.key}>{status.label}</SelectItem>
                                            ))}
                                        </Select>
                                    </div>
                                    
                                    <Table 
                                        aria-label="My Attendance Records" 
                                        classNames={{
                                            wrapper: "shadow-none border border-divider rounded-lg",
                                            th: "bg-default-100 text-default-600 font-semibold",
                                            td: "py-3"
                                        }}
                                    >
                                        <TableHeader columns={columns}>
                                            {(column) => <TableColumn key={column.uid}>{column.name}</TableColumn>}
                                        </TableHeader>
                                        <TableBody 
                                            items={attendanceRecords} 
                                            emptyContent={loading ? "Loading..." : "No attendance records found"}
                                            isLoading={loading}
                                        >
                                            {(item) => (
                                                <TableRow key={`${item.date}-${item.id}`}>
                                                    {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                    
                                    {pagination.total > pagination.perPage && (
                                        <div className="flex justify-center mt-6">
                                            <Pagination
                                                total={pagination.lastPage}
                                                page={pagination.currentPage}
                                                onChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))}
                                                showControls
                                                showShadow
                                                color="primary"
                                                size={isMobile ? "sm" : "md"}
                                            />
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

MyAttendance.layout = (page) => <App children={page} />;
export default MyAttendance;