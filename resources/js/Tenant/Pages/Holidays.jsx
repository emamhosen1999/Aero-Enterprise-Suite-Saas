import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { 
    CalendarIcon, 
    PlusIcon,
    ChartBarIcon,
    CheckCircleIcon
} from "@heroicons/react/24/outline";
import { 
    Card, 
    CardBody, 
    CardHeader,
    Button,
    Divider
} from "@heroui/react";
import StatsCards from "@/Components/StatsCards.jsx";
import { useMediaQuery } from '@/Hooks/useMediaQuery.js';
import App from "@/Layouts/App.jsx";
import HolidayTable from '@/Tables/HolidayTable.jsx';
import HolidayForm from "@/Forms/HolidayForm.jsx";
import DeleteHolidayForm from "@/Forms/DeleteHolidayForm.jsx";

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

const Holidays = ({ title, stats }) => {
    const { auth, holidays: initialHolidays } = usePage().props;
    const isMobile = useMediaQuery('(max-width: 768px)');
    const isSmallScreen = useMediaQuery('(max-width: 640px)');
    
    // Ensure initialHolidays is always an array
    const safeInitialHolidays = Array.isArray(initialHolidays) ? initialHolidays : [];
    
    // Filter initial data to current year (matching HolidayTable default)
    const currentYearHolidays = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return safeInitialHolidays.filter(holiday => 
            holiday && holiday.from_date && new Date(holiday.from_date).getFullYear() === currentYear
        );
    }, [safeInitialHolidays]);
    
    const [modalState, setModalState] = useState({
        type: null,
        holidayId: null,
        currentHoliday: null
    });
    const [holidaysData, setHolidaysData] = useState(safeInitialHolidays);
    const [filteredHolidaysData, setFilteredHolidaysData] = useState(currentYearHolidays); // Start with current year filtered data

    const handleModalOpen = useCallback((type, holidayId = null, holiday = null) => {
        setModalState({
            type,
            holidayId,
            currentHoliday: holiday
        });
    }, []);

    const handleModalClose = useCallback(() => {
        setModalState({
            type: null,
            holidayId: null,
            currentHoliday: null
        });
    }, []);

    const updateHolidaysData = useCallback((newData) => {
        setHolidaysData(newData);
    }, []);

    const handleFilteredDataChange = useCallback((filteredData) => {
        setFilteredHolidaysData(filteredData);
    }, []);

    // Update filtered data when main data changes (CRUD operations)
    useEffect(() => {
        // When main data changes, apply default current year filter
        const currentYear = new Date().getFullYear();
        const safeHolidaysData = Array.isArray(holidaysData) ? holidaysData : [];
        const currentYearFiltered = safeHolidaysData.filter(holiday => 
            holiday && holiday.from_date && new Date(holiday.from_date).getFullYear() === currentYear
        );
        setFilteredHolidaysData(currentYearFiltered);
    }, [holidaysData]);

    // Statistics - Dynamically calculated from filtered data
    const statsData = useMemo(() => {
        const currentYear = new Date().getFullYear();
        
        // Ensure filteredHolidaysData is always an array
        const safeFilteredData = Array.isArray(filteredHolidaysData) ? filteredHolidaysData : [];
        
        // Use filtered data for calculations
        const filteredCurrentYearHolidays = safeFilteredData.filter(holiday => 
            holiday && holiday.from_date && new Date(holiday.from_date).getFullYear() === currentYear
        );
        const upcomingHolidays = safeFilteredData.filter(holiday => 
            holiday && holiday.from_date && new Date(holiday.from_date) > new Date()
        );
        const ongoingHolidays = safeFilteredData.filter(holiday => {
            if (!holiday || !holiday.from_date || !holiday.to_date) return false;
            const now = new Date();
            const fromDate = new Date(holiday.from_date);
            const toDate = new Date(holiday.to_date);
            return fromDate <= now && toDate >= now;
        });

        // Calculate total days from filtered holidays
        const totalDays = safeFilteredData.reduce((sum, h) => {
            if (!h || typeof h.duration !== 'number') return sum;
            return sum + (h.duration || 1);
        }, 0);
        
        return [
            {
                title: 'Total Holidays',
                value: safeFilteredData.length,
                icon: <ChartBarIcon className="w-5 h-5" />,
                color: 'text-blue-400',
                iconBg: 'bg-blue-500/20',
                description: 'All filtered holidays'
            },
            {
                title: 'This Year',
                value: filteredCurrentYearHolidays.length,
                icon: <CalendarIcon className="w-5 h-5" />,
                color: 'text-green-400',
                iconBg: 'bg-green-500/20',
                description: 'Current year holidays'
            },
            {
                title: 'Upcoming',
                value: upcomingHolidays.length,
                icon: <CheckCircleIcon className="w-5 h-5" />,
                color: 'text-purple-400',
                iconBg: 'bg-purple-500/20',
                description: 'Future holidays'
            },
            {
                title: 'Holiday Days',
                value: totalDays,
                icon: <CheckCircleIcon className="w-5 h-5" />,
                color: 'text-orange-400',
                iconBg: 'bg-orange-500/20',
                description: 'Total days off in filtered data'
            }
        ];
    }, [filteredHolidaysData]);

    const modalProps = useMemo(() => ({
        open: Boolean(modalState.type),
        closeModal: handleModalClose,
        setHolidaysData: updateHolidaysData,
        holidaysData,
        currentHoliday: modalState.currentHoliday
    }), [modalState.type, handleModalClose, updateHolidaysData, holidaysData, modalState.currentHoliday]);

    return (
        <>
            <Head title={title} />
            
            {/* Modals */}
            {modalState.type === 'add_holiday' && <HolidayForm {...modalProps} />}
            {modalState.type === 'edit_holiday' && <HolidayForm {...modalProps} />}
            {modalState.type === 'delete_holiday' && (
                <DeleteHolidayForm
                    open={true}
                    holidayIdToDelete={modalState.holidayId}
                    setHolidaysData={updateHolidaysData}
                    closeModal={handleModalClose}
                />
            )}

            <div 
                className="flex flex-col w-full h-full p-4"
                role="main"
                aria-label="Holiday Management"
            >
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
                                        <div className="flex flex-col space-y-4">
                                            {/* Main Header Content */}
                                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                                {/* Title Section */}
                                                <div className="flex items-center gap-3 lg:gap-4">
                                                    <div 
                                                        className={`
                                                            ${!isMobile ? 'p-3' : 'p-2'} 
                                                            rounded-xl flex items-center justify-center
                                                        `}
                                                        style={{
                                                            background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                            borderColor: `color-mix(in srgb, var(--theme-primary) 25%, transparent)`,
                                                            borderWidth: `var(--borderWidth, 2px)`,
                                                            borderRadius: `var(--borderRadius, 12px)`,
                                                        }}
                                                    >
                                                        <CalendarIcon 
                                                            className={`
                                                                ${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}
                                                            `}
                                                            style={{ color: 'var(--theme-primary)' }}
                                                        />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h4 
                                                            className={`
                                                                ${!isMobile ? 'text-2xl' : 'text-xl'} 
                                                                font-bold leading-tight
                                                            `}
                                                            style={{ color: 'var(--theme-foreground)' }}
                                                        >
                                                            Company Holidays
                                                        </h4>
                                                        <p 
                                                            className={`
                                                                ${!isMobile ? 'text-sm' : 'text-xs'} 
                                                                leading-relaxed mt-1
                                                            `}
                                                            style={{ color: 'var(--theme-foreground-600)' }}
                                                        >
                                                            Manage company holidays and observances throughout the year
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex items-center gap-2 lg:gap-3">
                                                    <Button
                                                        color="primary"
                                                        variant="solid"
                                                        size={isMobile ? "sm" : "md"}
                                                        onPress={() => handleModalOpen('add_holiday')}
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        radius={getThemeRadius()}
                                                        style={{
                                                            fontFamily: `var(--fontFamily, "Inter")`,
                                                        }}
                                                    >
                                                        {!isSmallScreen && "Add Holiday"}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6" style={{
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}>
                                    {/* Enhanced Stats with 4 cards */}
                                    <StatsCards stats={statsData} className="mb-6" />
                                    
                                    <Divider className="my-6" style={{
                                        background: `var(--theme-divider)`,
                                    }} />
                                    
                                    {/* Holiday Table */}
                                    <div className="min-h-96">
                                        <div className="mb-4 flex items-center gap-2 font-semibold text-lg">
                                            <ChartBarIcon className="w-5 h-5" />
                                            Holiday Management
                                        </div>

                                        <div className="overflow-hidden rounded-lg">
                                            <HolidayTable
                                                holidaysData={holidaysData}
                                                onEdit={(holiday) => handleModalOpen('edit_holiday', null, holiday)}
                                                onDelete={(holidayId) => handleModalOpen('delete_holiday', holidayId)}
                                                onFilteredDataChange={handleFilteredDataChange}
                                            />
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

Holidays.layout = (page) => <App>{page}</App>;

export default Holidays;
