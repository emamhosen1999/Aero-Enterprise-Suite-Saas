import React, { useState, useEffect, useMemo } from 'react';
import { Button, Input, Popover, PopoverTrigger, PopoverContent, Select, SelectItem } from "@heroui/react";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon, XMarkIcon } from "@heroicons/react/24/outline";

/**
 * DatePicker Property Editor
 * Calendar-based date/datetime selection with optional time picker
 * 
 * @param {Object} props
 * @param {string} props.value - ISO date string (YYYY-MM-DD or YYYY-MM-DDTHH:mm)
 * @param {Function} props.onChange - Callback with new date value
 * @param {string} props.label - Field label
 * @param {boolean} props.showTime - Whether to show time picker (default: false)
 * @param {string} props.minDate - Minimum selectable date (ISO format)
 * @param {string} props.maxDate - Maximum selectable date (ISO format)
 * @param {boolean} props.isRequired - Whether field is required
 * @param {boolean} props.isDisabled - Whether field is disabled
 * @param {string} props.placeholder - Input placeholder text
 */
const DatePicker = ({
    value = '',
    onChange,
    label = 'Date',
    showTime = false,
    minDate = null,
    maxDate = null,
    isRequired = false,
    isDisabled = false,
    placeholder = 'Select date...'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(() => {
        if (value) {
            return new Date(value);
        }
        return new Date();
    });
    const [time, setTime] = useState(() => {
        if (value && showTime) {
            const date = new Date(value);
            return {
                hours: date.getHours().toString().padStart(2, '0'),
                minutes: date.getMinutes().toString().padStart(2, '0')
            };
        }
        return { hours: '12', minutes: '00' };
    });

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    // Generate year options (100 years range)
    const currentYear = new Date().getFullYear();
    const years = useMemo(() => {
        const result = [];
        for (let y = currentYear - 50; y <= currentYear + 50; y++) {
            result.push(y);
        }
        return result;
    }, [currentYear]);

    // Generate calendar days for current view
    const calendarDays = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();
        
        const days = [];
        
        // Previous month days
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            days.push({
                day: prevMonthLastDay - i,
                month: month - 1,
                year: month === 0 ? year - 1 : year,
                isCurrentMonth: false
            });
        }
        
        // Current month days
        for (let d = 1; d <= daysInMonth; d++) {
            days.push({
                day: d,
                month,
                year,
                isCurrentMonth: true
            });
        }
        
        // Next month days
        const remainingDays = 42 - days.length; // 6 rows x 7 days
        for (let d = 1; d <= remainingDays; d++) {
            days.push({
                day: d,
                month: month + 1,
                year: month === 11 ? year + 1 : year,
                isCurrentMonth: false
            });
        }
        
        return days;
    }, [viewDate]);

    // Check if date is within min/max bounds
    const isDateDisabled = (day, month, year) => {
        const date = new Date(year, month, day);
        date.setHours(0, 0, 0, 0);
        
        if (minDate) {
            const min = new Date(minDate);
            min.setHours(0, 0, 0, 0);
            if (date < min) return true;
        }
        
        if (maxDate) {
            const max = new Date(maxDate);
            max.setHours(0, 0, 0, 0);
            if (date > max) return true;
        }
        
        return false;
    };

    // Check if date is selected
    const isDateSelected = (day, month, year) => {
        if (!value) return false;
        const selected = new Date(value);
        return (
            selected.getDate() === day &&
            selected.getMonth() === month &&
            selected.getFullYear() === year
        );
    };

    // Check if date is today
    const isToday = (day, month, year) => {
        const today = new Date();
        return (
            today.getDate() === day &&
            today.getMonth() === month &&
            today.getFullYear() === year
        );
    };

    // Navigate months
    const goToPrevMonth = () => {
        setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    // Select date
    const selectDate = (day, month, year) => {
        if (isDateDisabled(day, month, year)) return;
        
        let newDate;
        if (showTime) {
            newDate = new Date(year, month, day, parseInt(time.hours), parseInt(time.minutes));
            onChange(newDate.toISOString().slice(0, 16)); // YYYY-MM-DDTHH:mm
        } else {
            newDate = new Date(year, month, day);
            onChange(newDate.toISOString().slice(0, 10)); // YYYY-MM-DD
        }
        
        if (!showTime) {
            setIsOpen(false);
        }
    };

    // Update time
    const updateTime = (field, newValue) => {
        const newTime = { ...time, [field]: newValue };
        setTime(newTime);
        
        if (value) {
            const date = new Date(value);
            date.setHours(parseInt(newTime.hours), parseInt(newTime.minutes));
            onChange(date.toISOString().slice(0, 16));
        }
    };

    // Clear date
    const clearDate = () => {
        onChange('');
        setIsOpen(false);
    };

    // Set to today
    const setToday = () => {
        const today = new Date();
        if (showTime) {
            today.setHours(parseInt(time.hours), parseInt(time.minutes));
            onChange(today.toISOString().slice(0, 16));
        } else {
            onChange(today.toISOString().slice(0, 10));
        }
        setViewDate(today);
    };

    // Format display value
    const formatDisplayValue = () => {
        if (!value) return '';
        const date = new Date(value);
        const dateStr = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        if (showTime) {
            const timeStr = date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
            return `${dateStr} ${timeStr}`;
        }
        return dateStr;
    };

    // Generate hour/minute options
    const hourOptions = useMemo(() => {
        const options = [];
        for (let h = 0; h < 24; h++) {
            options.push(h.toString().padStart(2, '0'));
        }
        return options;
    }, []);

    const minuteOptions = useMemo(() => {
        const options = [];
        for (let m = 0; m < 60; m += 5) {
            options.push(m.toString().padStart(2, '0'));
        }
        return options;
    }, []);

    return (
        <div className="w-full">
            <Popover 
                isOpen={isOpen} 
                onOpenChange={setIsOpen}
                placement="bottom-start"
            >
                <PopoverTrigger>
                    <div className="relative">
                        <Input
                            label={label}
                            placeholder={placeholder}
                            value={formatDisplayValue()}
                            readOnly
                            isRequired={isRequired}
                            isDisabled={isDisabled}
                            startContent={<CalendarIcon className="w-4 h-4 text-default-400" />}
                            endContent={
                                value && !isDisabled ? (
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            clearDate();
                                        }}
                                    >
                                        <XMarkIcon className="w-4 h-4" />
                                    </Button>
                                ) : null
                            }
                            classNames={{
                                inputWrapper: "cursor-pointer bg-default-100",
                                input: "cursor-pointer"
                            }}
                        />
                    </div>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-0">
                    <div className="p-4 min-w-[300px]">
                        {/* Header with month/year navigation */}
                        <div className="flex items-center justify-between mb-4">
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onPress={goToPrevMonth}
                            >
                                <ChevronLeftIcon className="w-4 h-4" />
                            </Button>

                            <div className="flex items-center gap-2">
                                <Select
                                    size="sm"
                                    selectedKeys={[viewDate.getMonth().toString()]}
                                    onSelectionChange={(keys) => {
                                        const month = parseInt(Array.from(keys)[0]);
                                        setViewDate(new Date(viewDate.getFullYear(), month, 1));
                                    }}
                                    className="w-28"
                                    classNames={{ trigger: "h-8" }}
                                >
                                    {months.map((month, index) => (
                                        <SelectItem key={index.toString()}>{month}</SelectItem>
                                    ))}
                                </Select>

                                <Select
                                    size="sm"
                                    selectedKeys={[viewDate.getFullYear().toString()]}
                                    onSelectionChange={(keys) => {
                                        const year = parseInt(Array.from(keys)[0]);
                                        setViewDate(new Date(year, viewDate.getMonth(), 1));
                                    }}
                                    className="w-20"
                                    classNames={{ trigger: "h-8" }}
                                >
                                    {years.map(year => (
                                        <SelectItem key={year.toString()}>{year}</SelectItem>
                                    ))}
                                </Select>
                            </div>

                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onPress={goToNextMonth}
                            >
                                <ChevronRightIcon className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Weekday headers */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {weekDays.map(day => (
                                <div key={day} className="text-center text-xs font-medium text-default-500 py-1">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar days */}
                        <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map((dateObj, index) => {
                                const disabled = isDateDisabled(dateObj.day, dateObj.month, dateObj.year);
                                const selected = isDateSelected(dateObj.day, dateObj.month, dateObj.year);
                                const today = isToday(dateObj.day, dateObj.month, dateObj.year);

                                return (
                                    <button
                                        key={index}
                                        onClick={() => selectDate(dateObj.day, dateObj.month, dateObj.year)}
                                        disabled={disabled}
                                        className={`
                                            w-9 h-9 rounded-lg text-sm font-medium transition-colors
                                            ${!dateObj.isCurrentMonth ? 'text-default-300' : 'text-foreground'}
                                            ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-default-100 cursor-pointer'}
                                            ${selected ? 'bg-primary text-white hover:bg-primary/90' : ''}
                                            ${today && !selected ? 'ring-2 ring-primary ring-offset-1' : ''}
                                        `}
                                    >
                                        {dateObj.day}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Time picker */}
                        {showTime && (
                            <div className="mt-4 pt-4 border-t border-divider">
                                <div className="flex items-center gap-2">
                                    <ClockIcon className="w-4 h-4 text-default-400" />
                                    <span className="text-sm text-default-600">Time:</span>
                                    <Select
                                        size="sm"
                                        selectedKeys={[time.hours]}
                                        onSelectionChange={(keys) => updateTime('hours', Array.from(keys)[0])}
                                        className="w-16"
                                        classNames={{ trigger: "h-8" }}
                                    >
                                        {hourOptions.map(h => (
                                            <SelectItem key={h}>{h}</SelectItem>
                                        ))}
                                    </Select>
                                    <span className="text-default-500">:</span>
                                    <Select
                                        size="sm"
                                        selectedKeys={[time.minutes]}
                                        onSelectionChange={(keys) => updateTime('minutes', Array.from(keys)[0])}
                                        className="w-16"
                                        classNames={{ trigger: "h-8" }}
                                    >
                                        {minuteOptions.map(m => (
                                            <SelectItem key={m}>{m}</SelectItem>
                                        ))}
                                    </Select>
                                </div>
                            </div>
                        )}

                        {/* Footer actions */}
                        <div className="mt-4 pt-4 border-t border-divider flex justify-between">
                            <Button
                                size="sm"
                                variant="flat"
                                onPress={setToday}
                            >
                                Today
                            </Button>
                            {showTime && (
                                <Button
                                    size="sm"
                                    color="primary"
                                    onPress={() => setIsOpen(false)}
                                >
                                    Done
                                </Button>
                            )}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};

export default DatePicker;
