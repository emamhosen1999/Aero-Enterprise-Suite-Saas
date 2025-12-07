import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
    Card, 
    CardBody, 
    CardHeader, 
    Button, 
    Chip, 
    Spinner
} from '@heroui/react';
import { 
    ChevronLeftIcon, 
    ChevronRightIcon,
    CalendarDaysIcon 
} from '@heroicons/react/24/outline';

import { Calendar } from 'lucide-react';
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

const BulkCalendar = ({ 
    selectedDates = [], 
    onDatesChange, 
    existingLeaves = [],
    publicHolidays = [],
    minDate = null,
    maxDate = null,
    userId = null,
    fetchFromAPI = false // Flag to determine if we should fetch data from API
}) => {

    const [currentDate, setCurrentDate] = useState(new Date());
    const [apiCalendarData, setApiCalendarData] = useState({
        existingLeaves: existingLeaves,
        publicHolidays: publicHolidays
    });
    const [loading, setLoading] = useState(false);
    const [loadedYear, setLoadedYear] = useState(null); // Track which year's data is loaded

    // Fetch calendar data from API if enabled - optimized to load once per year
    const fetchCalendarData = useCallback(async (year) => {
        if (!fetchFromAPI || !userId) return;
        
        // Don't fetch if we already have data for this year
        if (loadedYear === year) return;
        
        setLoading(true);
        try {
            const response = await axios.get(route('leaves.bulk.calendar-data'), {
                params: {
                    user_id: userId,
                    year: year
                    // Removed month parameter to get full year data
                }
            });

            if (response.data.success) {
                setApiCalendarData({
                    existingLeaves: response.data.data.existingLeaves || [],
                    publicHolidays: response.data.data.publicHolidays || []
                });
                setLoadedYear(year); // Mark this year as loaded
            }
        } catch (error) {
            console.error('Failed to fetch calendar data:', error);
            // Keep existing data on error
        } finally {
            setLoading(false);
        }
    }, [fetchFromAPI, userId, loadedYear]);

    // Fetch data when component mounts or year changes
    useEffect(() => {
        const currentYear = currentDate.getFullYear();
        fetchCalendarData(currentYear);
    }, [fetchCalendarData, currentDate.getFullYear()]); // Only depend on year, not full date

    // Reset loaded year when user changes
    useEffect(() => {
        if (fetchFromAPI && userId) {
            setLoadedYear(null); // Reset to force reload for new user
        }
    }, [userId, fetchFromAPI]);

    // Use either API data or props data
    const finalExistingLeaves = fetchFromAPI ? apiCalendarData.existingLeaves : existingLeaves;
    const finalPublicHolidays = fetchFromAPI ? apiCalendarData.publicHolidays : publicHolidays;

   

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

    // Date selection handler - disabled during loading, holidays, and existing leaves
    const handleDateClick = useCallback((dayData) => {
        if (!dayData.isCurrentMonth || loading) return; // Block interaction during loading
        
        // Use consistent date formatting to avoid timezone issues
        const dateString = dayData.fullDate.getFullYear() + '-' + 
                          String(dayData.fullDate.getMonth() + 1).padStart(2, '0') + '-' + 
                          String(dayData.fullDate.getDate()).padStart(2, '0');
        
        // Check for holidays and existing leaves first
        const hasExistingLeave = finalExistingLeaves.some(leave => {
            if (!leave.from_date || !leave.to_date) return false;
            const fromDate = leave.from_date.split('T')[0];
            const toDate = leave.to_date.split('T')[0];
            return dateString >= fromDate && dateString <= toDate;
        });
        
        const isPublicHoliday = finalPublicHolidays.includes(dateString);
        
        // Prevent selection of holidays and existing leaves
        if (hasExistingLeave || isPublicHoliday) return;
        
        // Check if date is selectable
        if (minDate && dayData.fullDate < new Date(minDate)) return;
        if (maxDate && dayData.fullDate > new Date(maxDate)) return;
        // Allow past dates for bulk leave requests (removed restriction)
        
        // Toggle selection
        const isSelected = selectedDates.includes(dateString);
        let newSelectedDates;
        
        if (isSelected) {
            newSelectedDates = selectedDates.filter(date => date !== dateString);
        } else {
            newSelectedDates = [...selectedDates, dateString];
        }
        
        onDatesChange(newSelectedDates.sort());
    }, [selectedDates, onDatesChange, minDate, maxDate, loading, finalExistingLeaves, finalPublicHolidays]);

    // Get date status
    const getDateStatus = useCallback((dayData) => {
        if (!dayData.isCurrentMonth) return { selectable: false };
        
        // Use consistent date formatting (YYYY-MM-DD) and avoid timezone issues
        const dateString = dayData.fullDate.getFullYear() + '-' + 
                          String(dayData.fullDate.getMonth() + 1).padStart(2, '0') + '-' + 
                          String(dayData.fullDate.getDate()).padStart(2, '0');
        
        const isSelected = selectedDates.includes(dateString);
        const isToday = dayData.fullDate.toDateString() === new Date().toDateString();
        const isPast = dayData.fullDate < new Date().setHours(0, 0, 0, 0);
        const isWeekend = dayData.fullDate.getDay() === 0 || dayData.fullDate.getDay() === 6;
        
        // Check for existing leave - improved detection with better date comparison
        const hasExistingLeave = finalExistingLeaves.some(leave => {
            if (!leave.from_date || !leave.to_date) return false;
            
            // Normalize dates to YYYY-MM-DD format and handle timezone properly
            const fromDate = leave.from_date.split('T')[0]; // Get just the date part
            const toDate = leave.to_date.split('T')[0]; // Get just the date part
            
        
            return dateString >= fromDate && dateString <= toDate;
        });
        
        // Check for public holiday - direct string comparison
        const isPublicHoliday = finalPublicHolidays.includes(dateString);
        
    
        // Allow selection of past dates for bulk leave (removed isPast restriction)
        // Disable selectability during loading, for holidays, and existing leaves
        const selectable = !loading && 
                          !hasExistingLeave && 
                          !isPublicHoliday &&
                          (!minDate || dayData.fullDate >= new Date(minDate)) &&
                          (!maxDate || dayData.fullDate <= new Date(maxDate));
        
        return {
            isSelected,
            isToday,
            isPast,
            isWeekend,
            hasExistingLeave,
            isPublicHoliday,
            selectable
        };
    }, [selectedDates, finalExistingLeaves, finalPublicHolidays, minDate, maxDate, loading]);

    const monthYear = currentDate.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
    });

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <Card 
            radius={getThemeRadius()}
            className="w-full shadow-sm border border-divider/50"
            style={{
                borderRadius: `var(--borderRadius, 12px)`,
                fontFamily: `var(--fontFamily, "Inter")`,
                background: `linear-gradient(135deg, 
                    color-mix(in srgb, var(--theme-content1) 90%, transparent) 40%, 
                    color-mix(in srgb, var(--theme-content2) 80%, transparent) 60%)`,
            }}
        >
            <CardHeader className="pb-3 px-4 pt-4">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <CalendarDaysIcon 
                            className="w-4 h-4 sm:w-5 sm:h-5" 
                            style={{ color: 'var(--theme-primary)' }}
                        />
                        <h3 className="text-base sm:text-lg font-semibold" style={{
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}>
                            {monthYear}
                        </h3>
                        {fetchFromAPI && loadedYear && (
                            <Chip 
                                size="sm" 
                                variant="bordered" 
                                color="primary" 
                                className="ml-2 text-xs hidden sm:flex"
                                radius={getThemeRadius()}
                                style={{
                                    borderColor: `var(--theme-primary)`,
                                    color: `var(--theme-primary)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}
                            >
                                {loadedYear}
                            </Chip>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onClick={goToPreviousMonth}
                            isDisabled={loading}
                            radius={getThemeRadius()}
                            className="min-w-8 h-8"
                            style={{
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}
                        >
                            <ChevronLeftIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                        <Button
                            size="sm"
                            variant="light"
                            onClick={goToToday}
                            isDisabled={loading}
                            radius={getThemeRadius()}
                            className="px-2 py-1 text-xs hidden sm:flex"
                            style={{
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}
                        >
                            Today
                        </Button>
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onClick={goToNextMonth}
                            isDisabled={loading}
                            radius={getThemeRadius()}
                            className="min-w-8 h-8"
                            style={{
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}
                        >
                            <ChevronRightIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardBody className="pt-0 px-4 pb-4" style={{
                fontFamily: `var(--fontFamily, "Inter")`,
            }}>
                {loading && (
                    <div className="flex justify-center items-center py-4 rounded-lg mb-4" style={{
                        background: `var(--theme-content2, #F4F4F5)`,
                        borderColor: `var(--theme-divider, #E4E4E7)`,
                    }}>
                        <Spinner size="sm" color="primary" />
                        <span className="ml-2 text-xs sm:text-sm" style={{
                            color: `var(--theme-foreground-600, #71717A)`,
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}>
                            Loading calendar data for {currentDate.getFullYear()}...
                        </span>
                    </div>
                )}
                
                {/* Compact Legend */}
                <div className="flex flex-wrap gap-1 sm:gap-2 mb-4">
                    <Chip 
                        size="sm" 
                        color="primary" 
                        variant="solid"
                        radius={getThemeRadius()}
                        className="text-xs font-medium"
                        style={{
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}
                    >
                        Selected
                    </Chip>
                    <Chip 
                        size="sm" 
                        color="danger" 
                        variant="solid"
                        radius={getThemeRadius()}
                        className="text-xs"
                        style={{
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}
                    >
                        Leave
                    </Chip>
                    <Chip 
                        size="sm" 
                        color="warning" 
                        variant="solid"
                        radius={getThemeRadius()}
                        className="text-xs"
                        style={{
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}
                    >
                        Holiday
                    </Chip>
                    <Chip 
                        size="sm" 
                        color="secondary" 
                        variant="solid"
                        radius={getThemeRadius()}
                        className="text-xs font-medium hidden sm:flex"
                        style={{
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}
                    >
                        Today
                    </Chip>
                    <Chip 
                        size="sm" 
                        color="default" 
                        variant="bordered"
                        radius={getThemeRadius()}
                        className="text-xs hidden sm:flex"
                        style={{
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}
                    >
                        Weekend
                    </Chip>
                </div>
                
                {/* Week days header - compact */}
                <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
                    {weekDays.map(day => (
                        <div 
                            key={day} 
                            className="flex items-center justify-center w-8 h-6 sm:w-10 sm:h-8 text-xs sm:text-sm font-medium"
                            style={{
                                color: `var(--theme-foreground-600, #71717A)`,
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}
                        >
                            {day}
                        </div>
                    ))}
                </div>
                
                {/* Calendar grid - responsive */}
                <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                    {calendarDays.map((dayData, index) => {
                        const status = getDateStatus(dayData);
                        
                        return (
                            <div
                                key={index}
                                onClick={() => handleDateClick(dayData)}
                                className={`
                                    relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 min-h-8 sm:min-h-10
                                    rounded-md transition-all duration-200 text-xs sm:text-sm select-none
                                    ${status.selectable ? 'cursor-pointer' : 'cursor-not-allowed'}
                                    ${!dayData.isCurrentMonth ? 'opacity-30' : ''}
                                    ${loading ? 'opacity-50 pointer-events-none' : ''}
                                    ${status.isSelected ? 'font-bold border-2 shadow-md scale-105 z-10' : ''}
                                    ${status.hasExistingLeave && !status.isSelected ? 'border-2 font-medium cursor-not-allowed' : ''}
                                    ${status.isPublicHoliday && !status.isSelected && !status.hasExistingLeave ? 'border-2 font-medium cursor-not-allowed' : ''}
                                    ${status.isToday && !status.isSelected && !status.hasExistingLeave && !status.isPublicHoliday ? 'font-semibold border-2 shadow-sm' : ''}
                                    ${status.isWeekend && !status.isSelected && !status.hasExistingLeave && !status.isPublicHoliday && !status.isToday ? 'border opacity-70' : ''}
                                    ${!status.selectable && !status.hasExistingLeave && !status.isPublicHoliday && !status.isToday && !status.isWeekend ? 'cursor-not-allowed opacity-60' : ''}
                                    ${status.selectable && !status.isSelected && !status.hasExistingLeave && !status.isPublicHoliday && !status.isToday && !status.isWeekend ? 'border border-transparent hover:scale-105' : ''}
                                `}
                                style={{
                                    backgroundColor: status.isSelected 
                                        ? 'var(--theme-primary)' 
                                        : status.hasExistingLeave && !status.isSelected 
                                        ? 'var(--theme-danger)' 
                                        : status.isPublicHoliday && !status.isSelected && !status.hasExistingLeave
                                        ? 'var(--theme-warning)'
                                        : status.isToday && !status.isSelected && !status.hasExistingLeave && !status.isPublicHoliday
                                        ? 'var(--theme-secondary-200)'
                                        : status.isWeekend && !status.isSelected && !status.hasExistingLeave && !status.isPublicHoliday && !status.isToday
                                        ? 'var(--theme-content2)'
                                        : loading
                                        ? 'var(--theme-content2)'
                                        : 'transparent',
                                    color: status.isSelected 
                                        ? 'var(--theme-primary-foreground)' 
                                        : status.hasExistingLeave && !status.isSelected 
                                        ? 'var(--theme-danger-foreground)' 
                                        : status.isPublicHoliday && !status.isSelected && !status.hasExistingLeave
                                        ? 'var(--theme-warning-foreground)'
                                        : status.isToday && !status.isSelected && !status.hasExistingLeave && !status.isPublicHoliday
                                        ? 'var(--theme-secondary-800)'
                                        : status.isWeekend && !status.isSelected && !status.hasExistingLeave && !status.isPublicHoliday && !status.isToday
                                        ? 'var(--theme-foreground-500)'
                                        : !status.selectable && !status.hasExistingLeave && !status.isPublicHoliday && !status.isToday && !status.isWeekend
                                        ? 'var(--theme-foreground-400)'
                                        : 'var(--theme-foreground-900)',
                                    borderColor: status.isSelected 
                                        ? 'var(--theme-primary-600)' 
                                        : status.hasExistingLeave && !status.isSelected 
                                        ? 'var(--theme-danger-600)' 
                                        : status.isPublicHoliday && !status.isSelected && !status.hasExistingLeave
                                        ? 'var(--theme-warning-600)'
                                        : status.isToday && !status.isSelected && !status.hasExistingLeave && !status.isPublicHoliday
                                        ? 'var(--theme-secondary-500)'
                                        : status.isWeekend && !status.isSelected && !status.hasExistingLeave && !status.isPublicHoliday && !status.isToday
                                        ? 'var(--theme-divider)'
                                        : 'transparent',
                                    borderRadius: `var(--borderRadius, 8px)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}
                                role="button"
                                tabIndex={status.selectable ? 0 : -1}
                                title={status.hasExistingLeave ? 'Existing leave - cannot select' : 
                                       status.isPublicHoliday ? 'Public holiday - cannot select' : 
                                       !status.selectable ? 'Not selectable' : ''}
                                aria-label={`${dayData.fullDate.toDateString()}${status.isSelected ? ' (selected)' : ''}${status.hasExistingLeave ? ' (existing leave)' : ''}${status.isPublicHoliday ? ' (public holiday)' : ''}`}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleDateClick(dayData);
                                    }
                                }}
                            >
                                {dayData.date}
                                
                                {/* Weekend indicator - hidden on mobile */}
                                {status.isWeekend && !status.isSelected && !status.hasExistingLeave && !status.isPublicHoliday && (
                                    <div 
                                        className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full opacity-50 hidden sm:block"
                                        style={{ backgroundColor: 'var(--theme-foreground-500)' }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
                
                {/* Selection summary - compact */}
                {selectedDates.length > 0 && (
                    <div className="mt-4 p-3 sm:p-4 rounded-lg relative overflow-hidden" style={{
                        background: `linear-gradient(135deg, 
                            color-mix(in srgb, var(--theme-primary) 10%, transparent) 20%, 
                            color-mix(in srgb, var(--theme-primary) 5%, transparent) 80%)`,
                        border: `1px solid color-mix(in srgb, var(--theme-primary) 20%, transparent)`,
                        borderRadius: `var(--borderRadius, 8px)`,
                    }}>
                        <div className="relative z-10">
                            <p className="text-xs sm:text-sm font-semibold mb-2" style={{
                                color: `var(--theme-primary)`,
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}>
                                📅 {selectedDates.length} date{selectedDates.length !== 1 ? 's' : ''} selected
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {selectedDates.slice(0, 8).map(date => (
                                    <Chip 
                                        key={date} 
                                        size="sm" 
                                        color="primary"
                                        variant="solid"
                                        radius={getThemeRadius()}
                                        className="text-xs font-medium"
                                        style={{
                                            fontFamily: `var(--fontFamily, "Inter")`,
                                        }}
                                    >
                                        {new Date(date).toLocaleDateString('en-US', { 
                                            month: 'short', 
                                            day: 'numeric' 
                                        })}
                                    </Chip>
                                ))}
                                {selectedDates.length > 8 && (
                                    <Chip 
                                        size="sm" 
                                        color="primary"
                                        variant="bordered"
                                        radius={getThemeRadius()}
                                        className="text-xs font-medium"
                                        style={{
                                            borderColor: `var(--theme-primary)`,
                                            color: `var(--theme-primary)`,
                                            fontFamily: `var(--fontFamily, "Inter")`,
                                        }}
                                    >
                                        +{selectedDates.length - 8} more
                                    </Chip>
                                )}
                            </div>
                        </div>
                        
                        {/* Background decoration */}
                        <div 
                            className="absolute -top-2 -right-2 w-12 h-12 rounded-full opacity-30"
                            style={{ backgroundColor: `var(--theme-primary)` }}
                        />
                    </div>
                )}
            </CardBody>
        </Card>
    );
};

export default BulkCalendar;
