import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { hasRoute, safeRoute, safeNavigate, safePost, safePut, safeDelete } from '@/utils/routeUtils';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Button,
    Input,
    Select,
    SelectItem,
    Chip,
    Card,
    CardBody,
    CardHeader,
    Spinner,
    Pagination,
    ButtonGroup,
    Divider
} from "@heroui/react";
import {
    CalendarIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    MapPinIcon,
    UserGroupIcon,
    CheckCircleIcon,
    XCircleIcon,
    ChartBarIcon,
    AdjustmentsHorizontalIcon,
    ClockIcon
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App';
import PageHeader from '@/Components/Common/PageHeader';
import StatsCards from '@/Components/Common/StatsCards';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils';
import dayjs from 'dayjs';

const EventsIndex = ({ events: initialEvents, filters: initialFilters }) => {
    const { auth } = usePage().props;
    
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
    
    // Custom media queries
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
    
    // State
    const [events, setEvents] = useState(initialEvents || { data: [] });
    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    
    // Filters
    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        status: initialFilters?.status || 'all',
        registration: initialFilters?.registration || 'all',
        timeline: initialFilters?.timeline || 'all'
    });
    
    // Permissions
    const canCreateEvent = auth.permissions?.includes('event.create') || false;
    const canViewRegistrations = auth.permissions?.includes('event.registration.manage') || false;
    
    // Calculate stats from events
    const statsData = useMemo(() => [
        {
            title: 'Total Events',
            value: events?.total || 0,
            icon: <CalendarIcon />,
            color: 'text-primary',
            iconBg: 'bg-primary/20',
            description: 'All events'
        },
        {
            title: 'Published',
            value: events?.data?.filter(e => e.is_published).length || 0,
            icon: <CheckCircleIcon />,
            color: 'text-success',
            iconBg: 'bg-success/20',
            description: 'Live events'
        },
        {
            title: 'Upcoming',
            value: events?.data?.filter(e => dayjs(e.event_date).isAfter(dayjs())).length || 0,
            icon: <ClockIcon />,
            color: 'text-secondary',
            iconBg: 'bg-secondary/20',
            description: 'Future events'
        },
        {
            title: 'Total Registrations',
            value: events?.data?.reduce((sum, e) => sum + (e.registrations_count || 0), 0) || 0,
            icon: <UserGroupIcon />,
            color: 'text-warning',
            iconBg: 'bg-warning/20',
            description: 'All participants'
        }
    ], [events]);
    
    // Fetch events
    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('events.index'), {
                params: filters
            });
            setEvents(response.data.events);
        } catch (error) {
            console.error('Error fetching events:', error);
            showToast.error('Failed to load events');
        } finally {
            setLoading(false);
        }
    }, [filters]);
    
    // Handle filter change
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };
    
    // Handle page change
    const handlePageChange = (page) => {
        router.get(route('events.index'), { ...filters, page }, { preserveState: true });
    };
    
    // Navigate to create event
    const handleCreateEvent = () => {
        router.get(route('events.create'));
    };
    
    // Navigate to event details
    const handleViewEvent = (event) => {
        router.get(route('events.show', event.id));
    };
    
    // Navigate to edit event
    const handleEditEvent = (event) => {
        router.get(route('events.edit', event.id));
    };
    
    // Navigate to registrations
    const handleViewRegistrations = (event) => {
        router.get(route('events.registrations.index', event.id));
    };
    
    // Navigate to analytics
    const handleViewAnalytics = (event) => {
        router.get(route('events.analytics', event.id));
    };
    
    return (
        <>
            <Head title="Event Management" />
            
            <div className="min-h-screen bg-background">
                <div className="max-w-[1600px] mx-auto">
                    <div className="p-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card
                                className="bg-content1/50 backdrop-blur-md border border-divider/30"
                                style={{
                                    borderRadius: `var(--borderRadius, 12px)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}
                            >
                                <CardHeader className="pb-0">
                                    <div className="w-full">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 pb-2">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 rounded-xl bg-primary/10 backdrop-blur-sm">
                                                    <CalendarIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'} text-primary`} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold text-foreground`}>
                                                        Event Management
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Manage events, sub-events, and registrations
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Action Buttons */}
                                            <div className="flex gap-2 flex-wrap">
                                                {canCreateEvent && (
                                                    <Button
                                                        color="primary"
                                                        variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={handleCreateEvent}
                                                        size={isMobile ? "sm" : "md"}
                                                        className="font-semibold"
                                                        style={{
                                                            borderRadius: `var(--borderRadius, 8px)`,
                                                            fontFamily: `var(--fontFamily, "Inter")`,
                                                        }}
                                                    >
                                                        Create Event
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* Stats Cards */}
                                    <StatsCards stats={statsData} className="mb-6" />
                                    
                                    {/* Filters Section - Matching LeaveAdmin */}
                                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                        <div className="flex-1">
                                            <Input
                                                label="Search Events"
                                                placeholder="Search by title or description..."
                                                value={filters.search}
                                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                                startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                                variant="bordered"
                                                size="sm"
                                                radius={getThemeRadius()}
                                                className="w-full"
                                                classNames={{
                                                    input: "text-sm",
                                                }}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                            />
                                        </div>
                                        <div className="flex gap-2 items-end">
                                            <ButtonGroup 
                                                variant="bordered" 
                                                radius={getThemeRadius()}
                                                className="bg-white/5"
                                            >
                                                <Button
                                                    isIconOnly={isMobile}
                                                    color={showFilters ? 'primary' : 'default'}
                                                    onPress={() => setShowFilters(!showFilters)}
                                                    className={showFilters ? 'bg-purple-500/20' : 'bg-white/5'}
                                                >
                                                    <AdjustmentsHorizontalIcon className="w-4 h-4" />
                                                    {!isMobile && <span className="ml-1">Filters</span>}
                                                </Button>
                                            </ButtonGroup>
                                        </div>
                                    </div>
                                    
                                    {showFilters && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div className="mb-6 p-4 bg-white/5 backdrop-blur-md rounded-lg border border-white/10">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    <Select
                                                        label="Status"
                                                        placeholder="Select status..."
                                                        selectedKeys={[filters.status]}
                                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                                        variant="bordered"
                                                        size="sm"
                                                        radius={getThemeRadius()}
                                                        className="w-full"
                                                        classNames={{
                                                            trigger: "text-sm",
                                                        }}
                                                        style={{
                                                            fontFamily: `var(--fontFamily, "Inter")`,
                                                        }}
                                                    >
                                                        <SelectItem key="all" value="all">All Status</SelectItem>
                                                        <SelectItem key="published" value="published">Published</SelectItem>
                                                        <SelectItem key="draft" value="draft">Draft</SelectItem>
                                                    </Select>
                                            
                                                    <Select
                                                        label="Registration"
                                                        placeholder="Select registration status..."
                                                        selectedKeys={[filters.registration]}
                                                        onChange={(e) => handleFilterChange('registration', e.target.value)}
                                                        variant="bordered"
                                                        size="sm"
                                                        radius={getThemeRadius()}
                                                        className="w-full"
                                                        classNames={{
                                                            trigger: "text-sm",
                                                        }}
                                                        style={{
                                                            fontFamily: `var(--fontFamily, "Inter")`,
                                                        }}
                                                    >
                                                        <SelectItem key="all" value="all">All</SelectItem>
                                                        <SelectItem key="open" value="open">Open</SelectItem>
                                                        <SelectItem key="closed" value="closed">Closed</SelectItem>
                                                    </Select>

                                                    <Select
                                                        label="Timeline"
                                                        placeholder="Select timeline..."
                                                        selectedKeys={[filters.timeline]}
                                                        onChange={(e) => handleFilterChange('timeline', e.target.value)}
                                                        variant="bordered"
                                                        size="sm"
                                                        radius={getThemeRadius()}
                                                        className="w-full"
                                                        classNames={{
                                                            trigger: "text-sm",
                                                        }}
                                                        style={{
                                                            fontFamily: `var(--fontFamily, "Inter")`,
                                                        }}
                                                    >
                                                        <SelectItem key="all" value="all">All Events</SelectItem>
                                                        <SelectItem key="upcoming" value="upcoming">Upcoming</SelectItem>
                                                        <SelectItem key="past" value="past">Past</SelectItem>
                                                    </Select>
                                                </div>
                                                
                                                {/* Active Filters as Chips */}
                                                {(filters.search || filters.status !== 'all' || filters.registration !== 'all' || filters.timeline !== 'all') && (
                                                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10">
                                                        {filters.search && (
                                                            <Chip variant="flat" color="primary" size="sm" onClose={() => handleFilterChange('search', '')}>
                                                                Search: {filters.search}
                                                            </Chip>
                                                        )}
                                                        {filters.status !== 'all' && (
                                                            <Chip variant="flat" color="secondary" size="sm" onClose={() => handleFilterChange('status', 'all')}>
                                                                Status: {filters.status}
                                                            </Chip>
                                                        )}
                                                        {filters.registration !== 'all' && (
                                                            <Chip variant="flat" color="warning" size="sm" onClose={() => handleFilterChange('registration', 'all')}>
                                                                Registration: {filters.registration}
                                                            </Chip>
                                                        )}
                                                        {filters.timeline !== 'all' && (
                                                            <Chip variant="flat" color="success" size="sm" onClose={() => handleFilterChange('timeline', 'all')}>
                                                                Timeline: {filters.timeline}
                                                            </Chip>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                    
                                    {/* Events List Section */}
                                    <div className="min-h-96">
                                        <div className="mb-4 flex items-center gap-2 font-semibold text-lg">
                                            <ChartBarIcon className="w-5 h-5" />
                                            Events Management
                                        </div>

                                        {loading ? (
                                            <Card className="bg-white/10 backdrop-blur-md border-white/20">
                                                <CardBody className="text-center py-12">
                                                    <Spinner size="lg" />
                                                    <p className="mt-4 text-default-500">
                                                        Loading events...
                                                    </p>
                                                </CardBody>
                                            </Card>
                                        ) : events?.data?.length > 0 ? (
                                            <div className="space-y-4">
                                                {events.data.map((event) => (
                                                    <Card key={event.id} className="hover:shadow-lg transition-shadow">
                                                        <CardBody>
                                                            <div className="flex flex-col md:flex-row gap-4">
                                                                {/* Event Banner */}
                                                                {event.banner_image && (
                                                                    <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
                                                                        <img
                                                                            src={`/storage/${event.banner_image}`}
                                                                            alt={event.title}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    </div>
                                                                )}
                                                                
                                                                {/* Event Details */}
                                                                <div className="flex-1">
                                                                    <div className="flex items-start justify-between mb-2">
                                                                        <div>
                                                                            <h3 className="text-xl font-bold mb-1">{event.title}</h3>
                                                                            <div className="flex items-center gap-4 text-sm text-default-500">
                                                                                <span className="flex items-center gap-1">
                                                                                    <CalendarIcon className="w-4 h-4" />
                                                                                    {dayjs(event.event_date).format('MMM DD, YYYY')} at {event.event_time}
                                                                                </span>
                                                                                <span className="flex items-center gap-1">
                                                                                    <MapPinIcon className="w-4 h-4" />
                                                                                    {event.venue}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        
                                                                        <div className="flex gap-2">
                                                                            <Chip
                                                                                color={event.is_published ? 'success' : 'warning'}
                                                                                size="sm"
                                                                                variant="flat"
                                                                            >
                                                                                {event.is_published ? 'Published' : 'Draft'}
                                                                            </Chip>
                                                                            <Chip
                                                                                color={event.is_registration_open ? 'primary' : 'default'}
                                                                                size="sm"
                                                                                variant="flat"
                                                                            >
                                                                                {event.is_registration_open ? 'Open' : 'Closed'}
                                                                            </Chip>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <p className="text-sm text-default-600 mb-3 line-clamp-2">
                                                                        {event.description}
                                                                    </p>
                                                                    
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex gap-4 text-sm">
                                                                            <span className="flex items-center gap-1">
                                                                                <UserGroupIcon className="w-4 h-4" />
                                                                                {event.approved_registrations_count || 0} / {event.max_participants || '∞'} participants
                                                                            </span>
                                                                            <span>
                                                                                {event.sub_events?.length || 0} sub-events
                                                                            </span>
                                                                        </div>
                                                                        
                                                                        <div className="flex gap-2">
                                                                            <Button
                                                                                size="sm"
                                                                                variant="flat"
                                                                                onPress={() => handleViewEvent(event)}
                                                                            >
                                                                                View
                                                                            </Button>
                                                                            {auth.permissions?.includes('event.update') && (
                                                                                <Button
                                                                                    size="sm"
                                                                                    color="primary"
                                                                                    variant="flat"
                                                                                    onPress={() => handleEditEvent(event)}
                                                                                >
                                                                                    Edit
                                                                                </Button>
                                                                            )}
                                                                            {canViewRegistrations && (
                                                                                <Button
                                                                                    size="sm"
                                                                                    color="secondary"
                                                                                    variant="flat"
                                                                                    onPress={() => handleViewRegistrations(event)}
                                                                                >
                                                                                    Registrations ({event.registrations_count || 0})
                                                                                </Button>
                                                                            )}
                                                                            <Button
                                                                                size="sm"
                                                                                variant="flat"
                                                                                startContent={<ChartBarIcon className="w-4 h-4" />}
                                                                                onPress={() => handleViewAnalytics(event)}
                                                                            >
                                                                                Analytics
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </CardBody>
                                                    </Card>
                                                ))}
                                                
                                                {/* Pagination */}
                                                {events?.last_page > 1 && (
                                                    <div className="flex justify-center mt-6">
                                                        <Pagination
                                                            total={events.last_page}
                                                            page={events.current_page}
                                                            onChange={handlePageChange}
                                                            showControls
                                                            radius={getThemeRadius()}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <CalendarIcon className="w-16 h-16 mx-auto text-default-300 mb-4" />
                                                <h3 className="text-lg font-semibold mb-2">No Events Found</h3>
                                                <p className="text-default-500 mb-4">No events match your search criteria.</p>
                                                {canCreateEvent && (
                                                    <Button
                                                        color="primary"
                                                        startContent={<PlusIcon className="w-5 h-5" />}
                                                        onPress={handleCreateEvent}
                                                    >
                                                        Create Your First Event
                                                    </Button>
                                                )}
                                            </div>
                                        )}
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

EventsIndex.layout = (page) => <App>{page}</App>;

export default EventsIndex;
