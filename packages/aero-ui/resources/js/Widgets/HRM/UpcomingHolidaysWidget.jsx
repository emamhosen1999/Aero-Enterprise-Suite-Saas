import React from 'react';
import { Card, CardHeader, CardBody, Chip, Avatar } from '@heroui/react';
import {
    CalendarDaysIcon,
    SunIcon,
    StarIcon,
    GiftIcon,
} from '@heroicons/react/24/outline';

/**
 * UpcomingHolidaysWidget
 * 
 * Displays upcoming company holidays:
 * - Holiday name
 * - Date
 * - Days remaining
 */
const UpcomingHolidaysWidget = ({ data = {} }) => {
    const { holidays = [], count = 0 } = data;

    // Get appropriate icon based on holiday type or name
    const getHolidayIcon = (holiday) => {
        const name = (holiday.name || '').toLowerCase();
        
        if (name.includes('christmas') || name.includes('new year')) {
            return <GiftIcon className="w-4 h-4" />;
        }
        if (name.includes('independence') || name.includes('republic') || name.includes('national')) {
            return <StarIcon className="w-4 h-4" />;
        }
        if (name.includes('summer') || name.includes('solstice')) {
            return <SunIcon className="w-4 h-4" />;
        }
        return <CalendarDaysIcon className="w-4 h-4" />;
    };

    // Get chip for days remaining
    const getDaysChip = (holiday) => {
        if (holiday.isToday) {
            return <Chip size="sm" color="success" variant="solid">Today!</Chip>;
        }
        if (holiday.isTomorrow) {
            return <Chip size="sm" color="warning" variant="flat">Tomorrow</Chip>;
        }
        if (holiday.daysRemaining !== null) {
            if (holiday.daysRemaining <= 7) {
                return <Chip size="sm" color="primary" variant="flat">{holiday.daysRemaining}d</Chip>;
            }
            return <Chip size="sm" color="default" variant="flat">{holiday.daysRemaining}d</Chip>;
        }
        return null;
    };

    // Check if data is placeholder/empty
    const isPlaceholder = holidays.length === 1 && holidays[0].id === 0;

    return (
        <Card className="border border-divider">
            <CardHeader className="px-4 py-3 border-b border-divider">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <CalendarDaysIcon className="w-5 h-5 text-success" />
                        <h2 className="text-lg font-semibold">Upcoming Holidays</h2>
                    </div>
                    {count > 0 && !isPlaceholder && (
                        <Chip size="sm" color="success" variant="flat">
                            {count}
                        </Chip>
                    )}
                </div>
            </CardHeader>
            <CardBody className="p-4">
                {isPlaceholder ? (
                    <div className="text-center py-6 text-default-400">
                        <CalendarDaysIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No upcoming holidays</p>
                        <p className="text-xs mt-1">Holidays will appear here</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {holidays.map((holiday, index) => (
                            <div 
                                key={holiday.id} 
                                className={`flex items-center justify-between p-3 rounded-lg border 
                                    ${holiday.isToday 
                                        ? 'border-success bg-success-50 dark:bg-success-900/10' 
                                        : 'border-default-200 hover:bg-default-50 dark:hover:bg-default-900/50'
                                    } transition-colors`}
                            >
                                <div className="flex items-center gap-3">
                                    {/* Date Avatar */}
                                    <Avatar
                                        className={`${holiday.isToday 
                                            ? 'bg-success text-white' 
                                            : 'bg-default-100 dark:bg-default-800'
                                        }`}
                                        icon={getHolidayIcon(holiday)}
                                        size="sm"
                                    />
                                    
                                    {/* Holiday Details */}
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {holiday.name}
                                        </p>
                                        <p className="text-xs text-default-500">
                                            {holiday.dateFormatted} • {holiday.dayName}
                                        </p>
                                    </div>
                                </div>

                                {/* Days Remaining Chip */}
                                {getDaysChip(holiday)}
                            </div>
                        ))}
                    </div>
                )}
            </CardBody>
        </Card>
    );
};

export default UpcomingHolidaysWidget;
