import React, {useCallback, useMemo, useState} from 'react';
import {Head, usePage} from '@inertiajs/react';
import {CalendarIcon, ChartBarIcon, CheckCircleIcon, UserPlusIcon} from "@heroicons/react/24/outline";
import {useMediaQuery} from '@/Hooks/useMediaQuery.js';
import App from "@/Layouts/App.jsx";
import TimeSheetTable from '@/Tables/HRM/TimeSheetTable.jsx';
import MarkAsPresentForm from "@/Forms/HRM/MarkAsPresentForm.jsx";
import BulkMarkAsPresentForm from "@/Forms/HRM/BulkMarkAsPresentForm.jsx";
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

const TimeSheet = ({ title, allUsers }) => {
    const { auth } = usePage().props;
    const isMobile = useMediaQuery('(max-width: 768px)');
    const isSmallScreen = useMediaQuery('(max-width: 640px)');
    
    const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [modalState, setModalState] = useState({
        type: null,
        selectedUsers: [],
        currentUser: null
    });
    const [updateTimeSheet, setUpdateTimeSheet] = useState(0);
    
    // Filter data for TimeSheetTable
    const [filterData, setFilterData] = useState({
        currentMonth: dayjs().format('YYYY-MM'),
    });

    const handleModalOpen = useCallback((type, selectedUsers = [], currentUser = null) => {
        setModalState({
            type,
            selectedUsers,
            currentUser
        });
    }, []);

    const handleModalClose = useCallback(() => {
        setModalState({
            type: null,
            selectedUsers: [],
            currentUser: null
        });
    }, []);

    const handleDateChange = useCallback((event) => {
        const newDate = event.target.value;
        setSelectedDate(newDate);
    }, []);

    const refreshTimeSheet = useCallback(() => {
        setUpdateTimeSheet(prev => prev + 1);
    }, []);
    
    const handleMarkAsPresent = useCallback((user, selectedDate) => {
        // Set the current user and pass the selected date to the modal
        setModalState({
            type: 'mark_as_present',
            selectedUsers: [],
            currentUser: user,
            selectedDate: selectedDate
        });
    }, []);

    // Statistics - Mock data for now, will be populated by TimeSheetTable
    const statsData = useMemo(() => {
        const selectedDateObj = dayjs(selectedDate);
        
        return [
            {
                title: 'Present Today',
                value: 0, // Will be updated by TimeSheetTable
                icon: <CheckCircleIcon className="w-5 h-5" />,
                color: 'text-green-400',
                iconBg: 'bg-green-500/20',
                description: 'Employees present'
            },
            {
                title: 'Absent Today',
                value: 0, // Will be updated by TimeSheetTable
                icon: <UserPlusIcon className="w-5 h-5" />,
                color: 'text-red-400',
                iconBg: 'bg-red-500/20',
                description: 'Employees absent'
            },
            {
                title: 'Total Employees',
                value: allUsers?.length || 0,
                icon: <ChartBarIcon className="w-5 h-5" />,
                color: 'text-blue-400',
                iconBg: 'bg-blue-500/20',
                description: 'Active employees'
            },
            {
                title: 'Date',
                value: selectedDateObj.format('MMM D'),
                icon: <CalendarIcon className="w-5 h-5" />,
                color: 'text-purple-400',
                iconBg: 'bg-purple-500/20',
                description: selectedDateObj.format('dddd')
            }
        ];
    }, [selectedDate, allUsers]);

    const modalProps = useMemo(() => ({
        open: Boolean(modalState.type),
        closeModal: handleModalClose,
        selectedDate: modalState.selectedDate || selectedDate,
        allUsers,
        refreshTimeSheet,
        selectedUsers: modalState.selectedUsers,
        currentUser: modalState.currentUser
    }), [modalState.type, handleModalClose, modalState.selectedDate, selectedDate, allUsers, refreshTimeSheet, modalState.selectedUsers, modalState.currentUser]);

    // Check permissions
    const canManageAttendance = auth.permissions?.includes('attendance.view') || false;

    return (
        <>
            <Head title={title} />
            
            {/* Modals */}
            {modalState.type === 'mark_as_present' && <MarkAsPresentForm {...modalProps} />}
            {modalState.type === 'bulk_mark_as_present' && <BulkMarkAsPresentForm {...modalProps} />}

           <TimeSheetTable
                                                handleDateChange={handleDateChange}
                                                selectedDate={selectedDate}
                                                updateTimeSheet={updateTimeSheet}
                                                externalFilterData={filterData}
                                                externalEmployee=""
                                                onMarkAsPresent={handleMarkAsPresent}
                                            />
        </>
    );
};

TimeSheet.layout = (page) => <App>{page}</App>;

export default TimeSheet;
