import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
    Card,
    Pagination,
    ScrollShadow,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow
} from "@heroui/react";
import {usePage} from "@inertiajs/react";
import dayjs from "dayjs";
import {useMediaQuery} from '@/Hooks/useMediaQuery.js';
import {CalendarDaysIcon, ClockIcon, ExclamationTriangleIcon,} from '@heroicons/react/24/outline';
import axios from 'axios';

const AttendanceEmployeeTable = ({ handleDateChange, selectedDate, updateTimeSheet, externalFilterData, externalEmployee }) => {
    const { url } = usePage();
    
    const isLargeScreen = useMediaQuery('(min-width: 1025px)');
    const isMediumScreen = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');

    const [attendances, setAttendances] = useState([]);
    const [error, setError] = useState('');
    const [totalRows, setTotalRows] = useState(0);
    const [lastPage, setLastPage] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [employee, setEmployee] = useState(externalEmployee || '');
    const [isLoaded, setIsLoaded] = useState(false);
    
    // Consolidate filter data from props
    const filterData = useMemo(() => externalFilterData || { 
        currentMonth: dayjs().format('YYYY-MM') 
    }, [externalFilterData]);

    // Helper function to convert theme borderRadius to HeroUI radius values
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

    // Helper function to safely format time
    const formatTime = useCallback((timeString, date) => {
        if (!timeString) return null;
        
        // Use dayjs for robust parsing and formatting
        const dateStr = dayjs(date).format('YYYY-MM-DD');
        let dt;

        // Try to parse just the time by appending to date
        if (timeString.match(/^\d{2}:\d{2}(:\d{2})?$/)) {
            dt = dayjs(`${dateStr}T${timeString}`);
        } else {
            // Try parsing as full ISO string
            dt = dayjs(timeString);
        }

        if (dt.isValid()) {
            return dt.format('h:mm A');
        }
        return 'Invalid Time';
    }, []);

    // Fetch attendance data for present users
    const getAttendances = useCallback(async (isRefresh = false) => {
        // If no date selected, don't fetch
        if (!selectedDate) {
            setIsLoaded(true);
            setError('No date selected');
            return;
        }
        
        setIsLoaded(false);
        setError('');
        
        const attendanceRoute = route('getCurrentUserAttendanceForDate');
        
        try {
            const response = await axios.get(attendanceRoute, {
                params: {
                    page: currentPage,
                    perPage,
                    employee,
                    date: dayjs(selectedDate).format('YYYY-MM-DD'),
                    currentYear: filterData?.currentMonth ? dayjs(filterData.currentMonth).year() : '',
                    currentMonth: filterData?.currentMonth ? dayjs(filterData.currentMonth).format('MM') : '',
                    _t: isRefresh ? Date.now() : undefined
                }
            });
        
            if (response.status === 200) {
                setAttendances(response.data.attendances || []);
                setTotalRows(response.data.total || 0);
                setLastPage(response.data.last_page || 1);
                // Only update current page if returned from backend
                if (response.data.current_page) {
                    setCurrentPage(response.data.current_page);
                }
                setError('');
            } else {
                setError(`Unexpected response: ${response.status}`);
            }
        } catch (error) {
            console.error('Error fetching attendance data:', error);
            setError(error.response?.data?.message || 'An error occurred while retrieving attendance data.');
            setAttendances([]);
            setTotalRows(0);
        } finally {
            setIsLoaded(true);
        }
    }, [selectedDate, currentPage, perPage, employee, filterData]);

    // Effect to trigger data fetch when dependencies change
    useEffect(() => {
        getAttendances();
    }, [getAttendances, updateTimeSheet]); 

    // Reset to page 1 when date or month filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedDate, filterData.currentMonth]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Column definitions
    const columns = [
        { name: "Date", uid: "date", icon: CalendarDaysIcon, ariaLabel: "Attendance date" },
        { name: "Clock In", uid: "clockin_time", icon: ClockIcon, ariaLabel: "All clock in times" },
        { name: "Clock Out", uid: "clockout_time", icon: ClockIcon, ariaLabel: "All clock out times" },
        { name: "Work Hours", uid: "production_time", icon: ClockIcon, ariaLabel: "Total working hours" },
        { name: "Punches", uid: "punch_details", icon: ClockIcon, ariaLabel: "Number of time punches recorded" }
    ];

    const renderCell = useCallback((attendance, columnKey) => {
        const cellBaseClasses = "text-xs sm:text-sm md:text-base whitespace-nowrap";
        const isCurrentDate = dayjs(attendance.date).isSame(dayjs(), 'day');
        
        switch (columnKey) {
            case "date":
                return (
                    <TableCell className={`${cellBaseClasses}`}>
                        <div className="flex items-center gap-2">
                            <CalendarDaysIcon className="w-4 h-4 text-primary shrink-0" />
                            <div className="flex flex-col">
                                <span>{dayjs(attendance.date).format('MMM D, YYYY')}</span>
                            </div>
                        </div>
                    </TableCell>
                );
            case "clockin_time":
                return (
                    <TableCell className={`${cellBaseClasses}`}>
                        <div className="flex items-center gap-2">
                            <ClockIcon className="w-4 h-4 text-success" />
                            <div className="flex flex-col">
                                {attendance.punches && attendance.punches.length > 0 ? (
                                    attendance.punches
                                        .filter(punch => punch.punch_in)
                                        .map((punch, index) => (
                                            <span key={index} className="block text-xs">
                                                <span className="text-default-400 mr-1">{index + 1}.</span>
                                                {formatTime(punch.punch_in, attendance.date) || 'Invalid time'}
                                            </span>
                                        ))
                                ) : (
                                    <span>Not clocked in</span>
                                )}
                            </div>
                        </div>
                    </TableCell>
                );            
            case "clockout_time":
                return (
                    <TableCell className={`${cellBaseClasses}`}>
                        <div className="flex items-center gap-2">
                            <ClockIcon className="w-4 h-4 text-danger" />
                            <div className="flex flex-col">
                                {attendance.punches && attendance.punches.length > 0 ? (
                                    attendance.punches.map((punch, index) => (
                                        <span key={index} className="block text-xs">
                                            <span className="text-default-400 mr-1">{index + 1}.</span>
                                            {punch.punch_out ? formatTime(punch.punch_out, attendance.date) || 'Invalid time' : 'No punch out'}
                                        </span>
                                    ))
                                ) : attendance.punchin_time ? (
                                    <span>{isCurrentDate ? 'Currently working' : 'Missing punch-out'}</span>
                                ) : (
                                    <span>Not started</span>
                                )}
                            </div>
                        </div>
                    </TableCell>
                );
            case "production_time":
                const hasWorkTime = attendance.total_work_minutes > 0;
                const hasIncompletePunch = attendance.has_incomplete_punch;
                const isCurrentlyWorking = attendance.punchin_time && !attendance.punchout_time && isCurrentDate;
                
                if (hasWorkTime) {
                    const hours = Math.floor(attendance.total_work_minutes / 60);
                    const minutes = Math.floor(attendance.total_work_minutes % 60);
                    
                    return (
                        <TableCell className={`${cellBaseClasses}`}>
                            <div className="flex items-center gap-2">
                                <ClockIcon className={`w-4 h-4 ${hasIncompletePunch ? 'text-warning' : 'text-primary'}`} />
                                <div className="flex flex-col">
                                    <span className="font-medium">{`${hours}h ${minutes}m`}</span>
                                    <span className="text-xs text-default-500">
                                        {hasIncompletePunch ? 'Partial data - in progress' : 'Total worked time'}
                                    </span>
                                </div>
                            </div>
                        </TableCell>
                    );
                } else if (isCurrentlyWorking) {
                    return (
                        <TableCell className={`${cellBaseClasses}`}>
                            <div className="flex items-center gap-2">
                                <ClockIcon className="w-4 h-4 text-warning" />
                                <div className="flex flex-col">
                                    <span className="text-warning">In Progress</span>
                                    <span className="text-xs text-default-500">Currently working</span>
                                </div>
                            </div>
                        </TableCell>
                    );
                } else if (attendance.punchin_time && !attendance.punchout_time && !isCurrentDate) {
                    return (
                        <TableCell className={`${cellBaseClasses}`}>
                            <div className="flex items-center gap-2">
                                <ExclamationTriangleIcon className="w-4 h-4 text-danger" />
                                <div className="flex flex-col">
                                    <span className="text-danger">Incomplete punch</span>
                                    <span className="text-xs text-default-500">Missing punch out</span>
                                </div>
                            </div>
                        </TableCell>
                    );
                }
                return (
                    <TableCell className={`${cellBaseClasses}`}>
                        <div className="flex items-center gap-2">
                            <ExclamationTriangleIcon className="w-4 h-4 text-warning" />
                            <div className="flex flex-col">
                                <span className="text-warning">No work time</span>
                                <span className="text-xs text-default-500">No attendance</span>
                            </div>
                        </div>
                    </TableCell>
                );
            case "punch_details":
                return (
                    <TableCell className={`${cellBaseClasses}`}>
                        <div className="flex items-center gap-2">
                            <ClockIcon className="w-4 h-4 text-default-400" />
                            <div className="flex flex-col">
                                <span className="text-xs font-medium">
                                    {attendance.punch_count || 0} punch{(attendance.punch_count || 0) !== 1 ? 'es' : ''}
                                </span>
                                {attendance.complete_punches !== attendance.punch_count && (
                                    <span className="text-xs text-warning">{attendance.complete_punches} complete</span>
                                )}
                                {attendance.complete_punches === attendance.punch_count && attendance.punch_count > 0 && (
                                    <span className="text-xs text-success">All complete</span>
                                )}
                            </div>
                        </div>
                    </TableCell>
                );
            default:
                return <TableCell className={`${cellBaseClasses}`}>N/A</TableCell>;
        }
    }, [formatTime]);

    return (
        <div role="region" aria-label="Attendance data table" className="w-full">
            {error ? (
                <Card 
                    className="p-4 transition-all duration-200"
                    style={{
                        background: `color-mix(in srgb, var(--theme-danger, #F31260) 10%, transparent)`,
                        borderColor: `color-mix(in srgb, var(--theme-danger, #F31260) 25%, transparent)`,
                        borderWidth: `var(--borderWidth, 2px)`,
                        borderRadius: `var(--borderRadius, 12px)`,
                        fontFamily: `var(--fontFamily, "Inter")`,
                    }}
                >
                    <div className="flex items-center gap-3">
                        <ExclamationTriangleIcon className="w-5 h-5" style={{ color: 'var(--theme-danger)' }} />
                        <p className="text-sm" style={{ color: 'var(--theme-danger)' }}>{error}</p>
                    </div>
                </Card>
            ) : (
                <>
                    <ScrollShadow orientation="horizontal" className="overflow-y-hidden">
                        <Skeleton className="rounded-lg" isLoaded={isLoaded}>
                            <Table
                                selectionMode="none"
                                isCompact
                                removeWrapper
                                aria-label="Employee attendance timesheet table"
                                isHeaderSticky
                                radius={getThemeRadius()}
                                classNames={{
                                    base: "max-h-[520px] overflow-auto",
                                    table: "min-h-[200px] w-full",
                                    thead: "z-10",
                                    tbody: "overflow-y-auto",
                                    th: "bg-default-100 text-default-700 font-semibold",
                                    td: "text-default-600",
                                }}
                                style={{
                                    borderRadius: `var(--borderRadius, 12px)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}
                            >
                                <TableHeader columns={columns}>
                                    {(column) => (
                                        <TableColumn key={column.uid} align="start" aria-label={column.ariaLabel || column.name}>
                                            <div className="flex items-center gap-2">
                                                {column.icon && <column.icon className="w-4 h-4" />}
                                                <span className="text-sm font-medium">{column.name}</span>
                                            </div>
                                        </TableColumn>
                                    )}
                                </TableHeader>
                                <TableBody 
                                    items={attendances}
                                    emptyContent={
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <ClockIcon className="w-16 h-16 text-default-300 mb-4" />
                                            <h6 className="text-lg font-semibold mb-2">No Attendance Records</h6>
                                            <p className="text-default-500">No attendance records found for the selected date</p>
                                        </div>
                                    }
                                >
                                    {(attendance) => (
                                        <TableRow key={attendance.id || attendance.user_id}>
                                            {(columnKey) => renderCell(attendance, columnKey)}
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Skeleton>
                    </ScrollShadow>
                    {totalRows > perPage && (
                        <div className="flex justify-center items-center py-4">
                            <Pagination
                                isCompact
                                showControls
                                showShadow
                                color="primary"
                                variant="bordered"
                                radius={getThemeRadius()}
                                page={currentPage}
                                total={lastPage}
                                onChange={handlePageChange}
                                aria-label="Timesheet pagination"
                                style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AttendanceEmployeeTable;
