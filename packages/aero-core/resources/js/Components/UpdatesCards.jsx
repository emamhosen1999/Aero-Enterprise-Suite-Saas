import React, { useEffect, useState } from 'react';
import { AvatarGroup, Skeleton, Card, Chip, Popover, PopoverContent, PopoverTrigger, CardHeader, CardBody, Divider } from "@heroui/react";
import { motion } from 'framer-motion';
import { useMediaQuery } from '@/Hooks/useMediaQuery.js';
import { usePage } from "@inertiajs/react";
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import axios from 'axios';
import {
    CalendarDaysIcon,
    ClockIcon,
    UserGroupIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    CheckCircleIcon,
    XCircleIcon,
    DocumentTextIcon,
    SunIcon,
    UserIcon,
    Bars3BottomLeftIcon
} from '@heroicons/react/24/outline';
import ProfileAvatar from '@/Components/ProfileAvatar';

dayjs.extend(isBetween);

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

// Get theme-aware card styles consistent with StatisticCard
const getCardStyle = () => ({
    background: `linear-gradient(135deg, 
        var(--theme-content1, #FAFAFA) 20%, 
        var(--theme-content2, #F4F4F5) 10%, 
        var(--theme-content3, #F1F3F4) 20%)`,
    borderColor: `transparent`,
    borderWidth: `var(--borderWidth, 2px)`,
    borderRadius: `var(--borderRadius, 12px)`,
    fontFamily: `var(--fontFamily, "Inter")`,
    transform: `scale(var(--scale, 1))`,
    transition: 'all 0.2s ease-in-out',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
});

const UpdateSection = ({ title, items, users, icon: IconComponent, color }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedLeave, setSelectedLeave] = useState(null);

    const handleClick = (event, leave) => {
        setAnchorEl(event.currentTarget);
        setSelectedLeave(leave);
    };

    const handleClose = () => {
        setAnchorEl(null);
        setSelectedLeave(null);
    };

    const open = Boolean(anchorEl);
    const id = open ? 'leave-details-popover' : undefined;

    const getLeaveStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved':
                return <CheckCircleIcon className="w-4 h-4 text-success" />;
            case 'rejected':
                return <XCircleIcon className="w-4 h-4 text-danger" />;
            default:
                return <ClockIcon className="w-4 h-4 text-warning" />;
        }
    };

    const getLeaveStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved':
                return 'success';
            case 'rejected':
                return 'danger';
            default:
                return 'warning';
        }
    };

    return (
        <Card 
            className="h-full flex flex-col"
            radius={getThemeRadius()}
            style={getCardStyle()}
            onMouseEnter={(e) => {
                e.currentTarget.style.border = `var(--borderWidth, 2px) solid color-mix(in srgb, ${color} 50%, transparent)`;
                e.currentTarget.style.borderRadius = `var(--borderRadius, 12px)`;
                e.currentTarget.style.transform = `scale(calc(var(--scale, 1) * 1.02))`;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.border = `var(--borderWidth, 2px) solid transparent`;
                e.currentTarget.style.transform = `scale(var(--scale, 1))`;
            }}
        >
            <CardHeader 
                className="pb-2 p-4"
                style={{
                    background: `transparent`,
                }}
            >
                <div className="flex items-center gap-3 w-full">
                    <div 
                        className="p-2 rounded-xl flex items-center justify-center min-w-[48px] min-h-[48px] flex-shrink-0"
                        style={{
                            backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
                            borderRadius: `var(--borderRadius, 12px)`,
                            border: `var(--borderWidth, 1px) solid color-mix(in srgb, ${color} 25%, transparent)`
                        }}
                    >
                        <IconComponent 
                            className="w-6 h-6 stroke-2"
                            style={{ color: color }}
                            aria-hidden="true"
                        />
                    </div>
                    <h2 
                        className="text-lg font-bold text-foreground flex-1"
                        style={{
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}
                    >
                        {title}
                    </h2>
                </div>
            </CardHeader>
            <CardBody 
                className="flex-1 overflow-auto pt-0 p-4"
                style={{
                    fontFamily: `var(--fontFamily, "Inter")`,
                }}
            >
                {items.map((item, index) => (
                    <React.Fragment key={index}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: (index * 0.1), duration: 0.3 }}
                            className="flex justify-between items-center py-2"
                        >
                                <div className="flex flex-col flex-1 mr-2">
                                    <p 
                                        className="text-sm leading-normal text-foreground"
                                        style={{
                                            fontFamily: `var(--fontFamily, "Inter")`,
                                        }}
                                    >
                                        {item.text}
                                    </p>
                                    {item.leaves && item.leaves.length > 0 && (
                                        <p 
                                            className="text-xs text-default-500 flex items-center gap-1 mt-1"
                                            style={{
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                        >
                                            <UserGroupIcon className="w-3 h-3" />
                                            {item.leaves.length} employee{item.leaves.length > 1 ? 's' : ''}
                                        </p>
                                    )}
                                </div>
                                {item.leaves && (
                                    (() => {
                                        const leaves = item.leaves.filter((leave) => leave.leave_type === item.type);
                                        return leaves.length > 0 && (
                                            <div className="flex gap-1 flex-shrink-0">
                                                <AvatarGroup 
                                                    max={4} 
                                                    isBordered
                                                    size="sm"
                                                >
                                                    {leaves.map((leave, idx) => {
                                                        const user = users.find((user) => String(user.id) === String(leave.user_id));
                                                        return (
                                                            user && (
                                                                <ProfileAvatar
                                                                    key={idx}
                                                                    src={user.profile_image_url}
                                                                    name={`${user.name} - on leave`}
                                                                    size="sm"
                                                                    className="cursor-pointer hover:scale-110 transition-transform"
                                                                    onClick={(e) => handleClick(e, leave)}
                                                                    fallbackIcon={<UserIcon className="w-4 h-4" />}
                                                                />
                                                            )
                                                        );
                                                    })}
                                                </AvatarGroup>
                                            </div>
                                        );
                                    })()
                                )}
                        </motion.div>
                        {index < items.length - 1 && <Divider style={{
                            borderColor: `var(--theme-divider, #E4E4E7)`,
                        }} />}
                    </React.Fragment>
                ))}
            </CardBody>

            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                placement="bottom-start"
                style={{
                    borderColor: `var(--theme-divider, #E4E4E7)`,
                    borderRadius: `var(--borderRadius, 12px)`,
                    fontFamily: `var(--fontFamily, "Inter")`,
                }}
            >
                <PopoverContent
                    style={{
                        background: `var(--theme-content1, #FAFAFA)`,
                        borderColor: `var(--theme-divider, #E4E4E7)`,
                        borderWidth: `var(--borderWidth, 2px)`,
                        borderRadius: `var(--borderRadius, 12px)`,
                        fontFamily: `var(--fontFamily, "Inter")`,
                        minWidth: '300px',
                        padding: '16px'
                    }}
                >
                    {selectedLeave && (
                        <section aria-labelledby="leave-details-title">
                            <h3 
                                id="leave-details-title"
                                className="text-lg font-semibold flex items-center gap-2 mb-3"
                                style={{
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}
                            >
                                <DocumentTextIcon className="w-5 h-5 text-primary" />
                                Leave Details
                            </h3>
                            <div id="leave-details-content" className="space-y-2">
                                <div className="flex items-start gap-2">
                                    <UserIcon className="w-4 h-4 text-default-500 mt-0.5 shrink-0" />
                                    <div>
                                        <span 
                                            className="text-xs text-default-500"
                                            style={{
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                        >
                                            Employee:
                                        </span>
                                        <div 
                                            className="text-sm font-medium"
                                            style={{
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                        >
                                            {users.find((user) => String(user.id) === String(selectedLeave.user_id))?.name || 'Unknown'}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-start gap-2">
                                    <CalendarDaysIcon className="w-4 h-4 text-default-500 mt-0.5 shrink-0" />
                                    <div>
                                        <span 
                                            className="text-xs text-default-500"
                                            style={{
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                        >
                                            Duration:
                                        </span>
                                        <div 
                                            className="text-sm font-medium"
                                            style={{
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                        >
                                            {selectedLeave.from_date !== selectedLeave.to_date ?
                                                `${new Date(selectedLeave.from_date).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })} - ${new Date(selectedLeave.to_date).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}` :
                                                new Date(selectedLeave.from_date).toLocaleDateString('en-US', {
                                                    month: 'long',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })
                                            }
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2">
                                    <DocumentTextIcon className="w-4 h-4 text-default-500 mt-0.5 shrink-0" />
                                    <div>
                                        <span 
                                            className="text-xs text-default-500"
                                            style={{
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                        >
                                            Reason:
                                        </span>
                                        <div 
                                            className="text-sm font-medium"
                                            style={{
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                        >
                                            {selectedLeave.reason || 'No reason provided'}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {getLeaveStatusIcon(selectedLeave.status)}
                                    <div>
                                        <span 
                                            className="text-xs text-default-500"
                                            style={{
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                        >
                                            Status:
                                        </span>
                                        <Chip 
                                            label={selectedLeave.status || 'Pending'} 
                                            variant="flat" 
                                            color={getLeaveStatusColor(selectedLeave.status)}
                                            size="sm"
                                            className="ml-2"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}
                </PopoverContent>
            </Popover>
        </Card>
    );
};

const UpdatesCards = () => {
    const { auth } = usePage().props;
    const isLargeScreen = useMediaQuery('(min-width: 1025px)');
    const isMediumScreen = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [users, setUsers] = useState([]);
    const [todayLeaves, setTodayLeaves] = useState([]);
    const [upcomingLeaves, setUpcomingLeaves] = useState([]);
    const [upcomingHoliday, setUpcomingHoliday] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();
        
        const fetchUpdates = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await axios.get(route('updates'), {
                    signal: controller.signal,
                    timeout: 10000
                });
                
                if (isMounted && response.data) {
                    setUsers(response.data.users || []);
                    setTodayLeaves(response.data.todayLeaves || []);
                    setUpcomingLeaves(response.data.upcomingLeaves || []);
                    setUpcomingHoliday(response.data.upcomingHoliday || null);
                }
            } catch (err) {
                if (isMounted && !controller.signal.aborted) {
                    console.error('Failed to fetch updates:', err);
                    setError(err.message);
                    setUsers([]);
                    setTodayLeaves([]);
                    setUpcomingLeaves([]);
                    setUpcomingHoliday(null);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchUpdates();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, []);

    // Helper function to group leaves by type and count
    const getLeaveSummary = (day, leaves) => {
        let leavesData = leaves;

        const userLeaveMessage = (type) => {
            const isCurrentUserOnLeave = leaves.some(leave => String(leave.user_id) === String(auth.user.id) && leave.leave_type === type);
            if (isCurrentUserOnLeave) {
                leavesData = leaves.filter(leave => String(leave.user_id) !== String(auth.user.id));
                return `You ${day === 'today' ? 'are' : 'will be'} on ${type} leave.`;
            }
            return null;
        };

        const userMessages = leaves.reduce((acc, leave) => {
            const message = userLeaveMessage(leave.leave_type);
            if (message && !acc.some(msg => msg.type === leave.leave_type)) {
                acc.push({ text: message, type: leave.leave_type });
            }
            return acc;
        }, []);

        const leaveCountByType = leavesData.reduce((summary, leave) => {
            summary[leave.leave_type] = (summary[leave.leave_type] || 0) + 1;
            return summary;
        }, {});

        const messages = Object.entries(leaveCountByType).map(([type, count]) => ({
            text: `${count} person${count > 1 ? 's' : ''} ${day === 'today' ? 'is' : 'will be'} on ${type} leave`,
            type: type,
            leaves: leavesData.filter(leave => leave.leave_type === type),
        }));

        return [...userMessages, ...messages];
    };

    // Dates
    const today = dayjs();
    const tomorrow = today.add(1, 'day');
    const sevenDaysFromNow = tomorrow.add(7, 'day');

    // Filter leaves for today, tomorrow, and within the next seven days
    const todayLeavesFiltered = todayLeaves.filter((leave) =>
        dayjs(today).isBetween(dayjs(leave.from_date), dayjs(leave.to_date), 'day', '[]')
    );
    const tomorrowLeaves = upcomingLeaves.filter((leave) =>
        dayjs(tomorrow).isBetween(dayjs(leave.from_date), dayjs(leave.to_date), 'day', '[]')
    );
    const nextSevenDaysLeaves = upcomingLeaves.filter(
        (leave) =>
            (dayjs(leave.from_date).isBetween(tomorrow, sevenDaysFromNow, 'day', '[]') ||
                dayjs(leave.to_date).isBetween(tomorrow, sevenDaysFromNow, 'day', '[]')) &&
            !/week/i.test(leave.leave_type)
    );

    // Get summary for each category
    const todayItems = getLeaveSummary('today', todayLeavesFiltered);
    const tomorrowItems = getLeaveSummary('tomorrow', tomorrowLeaves);
    const nextSevenDaysItems = getLeaveSummary('nextSevenDays', nextSevenDaysLeaves);

    // If no items, add default messages
    if (todayItems.length === 0) {
        todayItems.push({ text: 'No one is away today.' });
    }
    if (tomorrowItems.length === 0) {
        tomorrowItems.push({ text: 'No one is away tomorrow.' });
    }
    if (nextSevenDaysItems.length === 0) {
        nextSevenDaysItems.push({ text: 'No one is going to be away in the next seven days.' });
    }

    const sectionConfig = [
        {
            title: 'Today',
            items: todayItems,
            icon: CalendarDaysIcon,
            color: '#3b82f6' // blue
        },
        {
            title: 'Tomorrow',
            items: tomorrowItems,
            icon: ClockIcon,
            color: '#10b981' // green
        },
        {
            title: 'Next Seven Days',
            items: nextSevenDaysItems,
            icon: UserGroupIcon,
            color: '#f59e0b' // amber
        }
    ];

    if (loading) {
        return (
            <section 
                
                aria-label="Employee updates loading"
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                    {[1, 2, 3].map((_, idx) => (
                        <div key={idx}>
                            <Card 
                                className="w-full h-full" 
                                radius={getThemeRadius()}
                                style={getCardStyle()}
                            >
                                <Skeleton className="rounded-lg mb-2" isLoaded={false}>
                                    <div className="h-6 w-2/3 rounded-lg bg-secondary" />
                                </Skeleton>
                                <Skeleton className="rounded-lg" isLoaded={false}>
                                    <div className="h-32 w-full rounded-lg bg-secondary-200" />
                                </Skeleton>
                            </Card>
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <div className={`${isLargeScreen ? 'p-6' : isMediumScreen ? 'p-4' : 'p-3'} flex items-center justify-center min-h-[200px]`}>
                <Card 
                    
                    radius={getThemeRadius()}
                    style={{
                        ...getCardStyle(),
                        borderColor: `color-mix(in srgb, var(--theme-danger) 50%, transparent)`,
                        background: `linear-gradient(135deg, 
                            color-mix(in srgb, var(--theme-danger) 5%, var(--theme-content1)) 20%, 
                            color-mix(in srgb, var(--theme-danger) 3%, var(--theme-content2)) 10%, 
                            color-mix(in srgb, var(--theme-danger) 2%, var(--theme-content3)) 20%)`,
                    }}
                >
                    <div className="flex items-center gap-3">
                        <ExclamationTriangleIcon 
                            className="w-5 h-5"
                            style={{ color: 'var(--theme-danger)' }}
                        />
                        <p 
                            className="text-base"
                            style={{ 
                                color: 'var(--theme-danger)',
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}
                        >
                            Failed to load updates: {error}
                        </p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <section 
            className="p-4"
            aria-label="Employee Updates Dashboard"
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-stretch">
                {sectionConfig.map((section, index) => (
                    <div key={section.title} className="flex">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: (index * 0.1), duration: 0.3 }}
                            className="w-full"
                        >
                            <div className="flex flex-col flex-grow w-full">
                                <UpdateSection 
                                    title={section.title} 
                                    items={section.items} 
                                    users={users}
                                    icon={section.icon}
                                    color={section.color}
                                />
                            </div>
                        </motion.div>
                    </div>
                ))}
            </div>
            
            {upcomingHoliday && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.3 }}
                >
                    <div className="mt-4">
                        <Card
                            radius={getThemeRadius()}
                            style={getCardStyle()}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.border = `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-warning) 50%, transparent)`;
                                e.currentTarget.style.borderRadius = `var(--borderRadius, 12px)`;
                                e.currentTarget.style.transform = `scale(calc(var(--scale, 1) * 1.02))`;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.border = `var(--borderWidth, 2px) solid transparent`;
                                e.currentTarget.style.transform = `scale(var(--scale, 1))`;
                            }}
                        >
                            <CardHeader 
                                className="pb-2 p-4"
                                style={{
                                    background: `transparent`,
                                }}
                            >
                                <div className="flex items-center gap-3 w-full">
                                    <div 
                                        className="p-2 rounded-xl flex items-center justify-center min-w-[48px] min-h-[48px] flex-shrink-0"
                                        style={{
                                            backgroundColor: `color-mix(in srgb, var(--theme-warning) 15%, transparent)`,
                                            borderRadius: `var(--borderRadius, 12px)`,
                                            border: `var(--borderWidth, 1px) solid color-mix(in srgb, var(--theme-warning) 25%, transparent)`
                                        }}
                                    >
                                        <SunIcon 
                                            className="w-6 h-6 stroke-2"
                                            style={{ color: 'var(--theme-warning)' }}
                                            aria-hidden="true"
                                        />
                                    </div>
                                    <h2 
                                        className="text-lg font-bold text-foreground flex-1"
                                        style={{
                                            fontFamily: `var(--fontFamily, "Inter")`,
                                        }}
                                    >
                                        Upcoming Holiday
                                    </h2>
                                </div>
                            </CardHeader>
                            <CardBody 
                                className="pt-0 p-4"
                                style={{
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div>
                                        <p 
                                            className="font-semibold text-foreground flex items-center gap-1 mt-1"
                                            style={{
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                        >
                                            <InformationCircleIcon className="w-4 h-4" />
                                            {upcomingHoliday.title}
                                        </p>
                                        
                                        <p 
                                            className="text-sm text-default-500 flex items-center gap-1 mt-1"
                                            style={{
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                        >
                                            <CalendarDaysIcon className="w-4 h-4" />
                                            {new Date(upcomingHoliday.from_date).toLocaleDateString('en-US', {
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })} - {new Date(upcomingHoliday.to_date).toLocaleDateString('en-US', {
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </p>
                                        <p 
                                            className="text-sm text-default-500 flex items-center gap-1 mt-1"
                                            style={{
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                        >
                                            <Bars3BottomLeftIcon className="w-4 h-4" />
                                            {upcomingHoliday.description}
                                        </p>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </motion.div>
            )}
        </section>
    );
};

export default UpdatesCards;
