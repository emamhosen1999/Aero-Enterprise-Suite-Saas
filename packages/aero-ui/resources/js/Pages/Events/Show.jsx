import React, { useState, useEffect, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { hasRoute, safeRoute, safeNavigate, safePost, safePut, safeDelete } from '@/utils/routeUtils';
import { motion } from 'framer-motion';
import {
    Button,
    Chip,
    Card,
    CardBody,
    CardHeader,
    Divider,
    Tabs,
    Tab,
    Input
} from "@heroui/react";
import {
    CalendarIcon,
    MapPinIcon,
    UserGroupIcon,
    PencilIcon,
    ChartBarIcon,
    ClipboardDocumentListIcon,
    ArrowLeftIcon,
    CheckCircleIcon,
    XCircleIcon,
    DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App';
import StatsCards from '@/Components/Common/StatsCards';
import dayjs from 'dayjs';
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';

const ShowEvent = ({ event, analytics }) => {
    const { auth } = usePage().props;
    
    const canEdit = auth.permissions?.includes('event.update');
    const canManageRegistrations = auth.permissions?.includes('event.registration.manage');
    
    const statsData = useMemo(() => [
        {
            title: 'Total Registrations',
            value: analytics.total_registrations,
            icon: <UserGroupIcon />,
            color: 'text-primary',
            iconBg: 'bg-primary/20',
            description: 'All registrations'
        },
        {
            title: 'Approved',
            value: analytics.approved_registrations,
            icon: <CheckCircleIcon />,
            color: 'text-success',
            iconBg: 'bg-success/20',
            description: 'Confirmed attendees'
        },
        {
            title: 'Pending',
            value: analytics.pending_registrations,
            icon: <ClipboardDocumentListIcon />,
            color: 'text-warning',
            iconBg: 'bg-warning/20',
            description: 'Awaiting approval'
        },
        {
            title: 'Available Slots',
            value: event.max_participants ? event.max_participants - analytics.approved_registrations : '∞',
            icon: <UserGroupIcon />,
            color: 'text-secondary',
            iconBg: 'bg-secondary/20',
            description: event.max_participants ? 'Remaining capacity' : 'Unlimited'
        }
    ], [analytics, event.max_participants]);
    
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
    
    const handleTogglePublish = async () => {
        try {
            await axios.post(route('events.toggle-publish', event.id));
            showToast.success(`Event ${event.is_published ? 'unpublished' : 'published'} successfully`);
            router.reload();
        } catch (error) {
            showToast.error('Failed to update event status');
        }
    };
    
    const handleDuplicate = () => {
        safePost('events.duplicate', { id: event.id });
    };

    return (
        <>
            <Head title={event.title} />
            
            <div className="min-h-screen bg-background">
                <div className="max-w-[1600px] mx-auto">
                    <div className="p-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Card className="bg-content1/50 backdrop-blur-md border border-divider/30" style={{ borderRadius: 'var(--borderRadius, 12px)' }}>
                                <CardHeader className="pb-0">
                                    <div className="w-full">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 pb-2">
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 rounded-xl bg-primary/20">
                                                    <CalendarIcon className="w-6 h-6 text-primary" />
                                                </div>
                                                <div>
                                                    <h1 className="text-2xl font-bold text-foreground">{event.title}</h1>
                                                    <p className="text-sm text-default-500 mt-1">
                                                        {dayjs(event.event_date).format('MMMM DD, YYYY')} at {event.event_time}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    variant="flat"
                                                    onPress={() => router.get(route('events.index'))}
                                                    startContent={<ArrowLeftIcon className="w-5 h-5" />}
                                                    radius={getThemeRadius()}
                                                    size={isMobile ? 'sm' : 'md'}
                                                >
                                                    {!isMobile && 'Back'}
                                                </Button>
                                                {canEdit && (
                                                    <Button
                                                        color="primary"
                                                        onPress={() => router.get(route('events.edit', event.id))}
                                                        startContent={<PencilIcon className="w-5 h-5" />}
                                                        radius={getThemeRadius()}
                                                        size={isMobile ? 'sm' : 'md'}
                                                    >
                                                        Edit
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="flat"
                                                    onPress={() => router.get(route('events.analytics', event.id))}
                                                    startContent={<ChartBarIcon className="w-5 h-5" />}
                                                    radius={getThemeRadius()}
                                                    size={isMobile ? 'sm' : 'md'}
                                                >
                                                    {!isMobile && 'Analytics'}
                                                </Button>
                                                {canManageRegistrations && (
                                                    <Button
                                                        color="secondary"
                                                        onPress={() => router.get(route('events.registrations.index', event.id))}
                                                        startContent={<ClipboardDocumentListIcon className="w-5 h-5" />}
                                                        radius={getThemeRadius()}
                                                        size={isMobile ? 'sm' : 'md'}
                                                    >
                                                        Registrations
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
            
                                <CardBody className="p-6">
                                    <StatsCards stats={statsData} className="mb-6" />
                                    
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* Main Content */}
                                        <div className="lg:col-span-2 space-y-6">
                                            {/* Banner */}
                                            {event.banner_image && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    <Card className="bg-content2/50" style={{ borderRadius: 'var(--borderRadius, 12px)' }}>
                                                        <CardBody className="p-0">
                                                            <img
                                                                src={`/storage/${event.banner_image}`}
                                                                alt={event.title}
                                                                className="w-full h-64 object-cover"
                                                                style={{ borderRadius: 'var(--borderRadius, 12px)' }}
                                                            />
                                                        </CardBody>
                                                    </Card>
                                                </motion.div>
                                            )}
                                            
                                            {/* Tabs */}
                                            <Card className="bg-content2/50" style={{ borderRadius: 'var(--borderRadius, 12px)' }}>
                                                <CardBody>
                                                    <Tabs aria-label="Event details" radius={getThemeRadius()}>
                                                        <Tab key="details" title="Details">
                                                            <div className="py-4 space-y-4">
                                                                <div>
                                                                    <h4 className="font-semibold mb-2">Description</h4>
                                                                    <p className="text-default-600">{event.description}</p>
                                                                </div>
                                                                
                                                                {event.food_details && (
                                                                    <>
                                                                        <Divider />
                                                                        <div>
                                                                            <h4 className="font-semibold mb-2">Food Details</h4>
                                                                            <p className="text-default-600">{event.food_details}</p>
                                                                        </div>
                                                                    </>
                                                                )}
                                                                
                                                                {event.rules && (
                                                                    <>
                                                                        <Divider />
                                                                        <div>
                                                                            <h4 className="font-semibold mb-2">Rules & Regulations</h4>
                                                                            <p className="text-default-600 whitespace-pre-line">{event.rules}</p>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </Tab>
                                                        
                                                        <Tab key="sub-events" title={`Sub-Events (${event.sub_events?.length || 0})`}>
                                                            <div className="py-4 space-y-3">
                                                                {event.sub_events?.length > 0 ? (
                                                                    event.sub_events.map((subEvent) => (
                                                                        <Card key={subEvent.id} style={{ borderRadius: 'var(--borderRadius, 12px)' }}>
                                                                            <CardBody>
                                                                                <div className="flex justify-between items-start">
                                                                                    <div>
                                                                                        <h4 className="font-semibold">{subEvent.title}</h4>
                                                                                        <p className="text-sm text-default-600 mt-1">{subEvent.description}</p>
                                                                                        {subEvent.schedule && (
                                                                                            <p className="text-sm text-default-500 mt-2">Schedule: {subEvent.schedule}</p>
                                                                                        )}
                                                                                        {subEvent.prize_details && (
                                                                                            <p className="text-sm text-success mt-1">Prize: {subEvent.prize_details}</p>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="text-right">
                                                                                        {subEvent.joining_fee > 0 && (
                                                                                            <Chip color="primary" size="sm" radius={getThemeRadius()}>৳{subEvent.joining_fee}</Chip>
                                                                                        )}
                                                                                        {subEvent.max_participants && (
                                                                                            <p className="text-xs text-default-500 mt-2">
                                                                                                Max: {subEvent.max_participants}
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </CardBody>
                                                                        </Card>
                                                                    ))
                                                                ) : (
                                                                    <p className="text-center text-default-500 py-8">No sub-events added</p>
                                                                )}
                                                            </div>
                                                        </Tab>
                                                        
                                                        <Tab key="custom-fields" title={`Custom Fields (${event.custom_fields?.length || 0})`}>
                                                            <div className="py-4 space-y-2">
                                                                {event.custom_fields?.length > 0 ? (
                                                                    event.custom_fields.map((field) => (
                                                                        <div key={field.id} className="flex justify-between items-center p-3 bg-default-100 rounded-lg">
                                                                            <div>
                                                                                <span className="font-medium">{field.field_label}</span>
                                                                                {field.is_required && <Chip size="sm" color="danger" className="ml-2" radius={getThemeRadius()}>Required</Chip>}
                                                                                {field.help_text && (
                                                                                    <p className="text-xs text-default-500 mt-1">{field.help_text}</p>
                                                                                )}
                                                                            </div>
                                                                            <Chip size="sm" variant="flat" radius={getThemeRadius()}>{field.field_type}</Chip>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <p className="text-center text-default-500 py-8">No custom fields</p>
                                                                )}
                                                            </div>
                                                        </Tab>
                                                    </Tabs>
                                                </CardBody>
                                            </Card>
                                        </div>
                                        
                                        {/* Sidebar */}
                                        <div className="space-y-6">
                                            {/* Quick Info */}
                                            <motion.div
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: 0.1 }}
                                            >
                                                <Card className="bg-content2/50" style={{ borderRadius: 'var(--borderRadius, 12px)' }}>
                                                    <CardBody>
                                                        <h3 className="text-lg font-semibold mb-4">Quick Info</h3>
                                                        <div className="space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <CalendarIcon className="w-5 h-5 text-default-400" />
                                                                <div>
                                                                    <p className="text-sm text-default-500">Date & Time</p>
                                                                    <p className="font-medium">{dayjs(event.event_date).format('MMM DD, YYYY')}</p>
                                                                    <p className="text-sm">{event.event_time}</p>
                                                                </div>
                                                            </div>
                                                            
                                                            <Divider />
                                                            
                                                            <div className="flex items-center gap-2">
                                                                <MapPinIcon className="w-5 h-5 text-default-400" />
                                                                <div>
                                                                    <p className="text-sm text-default-500">Venue</p>
                                                                    <p className="font-medium">{event.venue}</p>
                                                                </div>
                                                            </div>
                                                            
                                                            {event.registration_deadline && (
                                                                <>
                                                                    <Divider />
                                                                    <div>
                                                                        <p className="text-sm text-default-500">Registration Deadline</p>
                                                                        <p className="font-medium">{dayjs(event.registration_deadline).format('MMM DD, YYYY HH:mm')}</p>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </CardBody>
                                                </Card>
                                            </motion.div>
                                            
                                            {/* Status */}
                                            <motion.div
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: 0.2 }}
                                            >
                                                <Card className="bg-content2/50" style={{ borderRadius: 'var(--borderRadius, 12px)' }}>
                                                    <CardBody>
                                                        <h3 className="text-lg font-semibold mb-4">Status</h3>
                                                        <div className="space-y-3">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-default-600">Published</span>
                                                                <Chip color={event.is_published ? 'success' : 'warning'} variant="flat" radius={getThemeRadius()}>
                                                                    {event.is_published ? 'Yes' : 'No'}
                                                                </Chip>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-default-600">Registration</span>
                                                                <Chip color={event.is_registration_open ? 'primary' : 'default'} variant="flat" radius={getThemeRadius()}>
                                                                    {event.is_registration_open ? 'Open' : 'Closed'}
                                                                </Chip>
                                                            </div>
                                                            
                                                            {canEdit && (
                                                                <>
                                                                    <Divider />
                                                                    <div className="space-y-2">
                                                                        <Button
                                                                            fullWidth
                                                                            size="sm"
                                                                            color={event.is_published ? 'warning' : 'success'}
                                                                            variant="flat"
                                                                            onPress={handleTogglePublish}
                                                                            radius={getThemeRadius()}
                                                                        >
                                                                            {event.is_published ? 'Unpublish' : 'Publish'}
                                                                        </Button>
                                                                        <Button
                                                                            fullWidth
                                                                            size="sm"
                                                                            variant="flat"
                                                                            startContent={<DocumentDuplicateIcon className="w-4 h-4" />}
                                                                            onPress={handleDuplicate}
                                                                            radius={getThemeRadius()}
                                                                        >
                                                                            Duplicate Event
                                                                        </Button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </CardBody>
                                                </Card>
                                            </motion.div>
                                            
                                            {/* Organizer */}
                                            {(event.organizer_name || event.organizer_email || event.organizer_phone) && (
                                                <motion.div
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.3, delay: 0.3 }}
                                                >
                                                    <Card className="bg-content2/50" style={{ borderRadius: 'var(--borderRadius, 12px)' }}>
                                                        <CardBody>
                                                            <h3 className="text-lg font-semibold mb-4">Organizer</h3>
                                                            <div className="space-y-2">
                                                                {event.organizer_name && (
                                                                    <p><span className="text-default-500">Name:</span> {event.organizer_name}</p>
                                                                )}
                                                                {event.organizer_email && (
                                                                    <p><span className="text-default-500">Email:</span> {event.organizer_email}</p>
                                                                )}
                                                                {event.organizer_phone && (
                                                                    <p><span className="text-default-500">Phone:</span> {event.organizer_phone}</p>
                                                                )}
                                                            </div>
                                                        </CardBody>
                                                    </Card>
                                                </motion.div>
                                            )}
                                            
                                            {/* Public Link */}
                                            <motion.div
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: 0.4 }}
                                            >
                                                <Card className="bg-content2/50" style={{ borderRadius: 'var(--borderRadius, 12px)' }}>
                                                    <CardBody>
                                                        <h3 className="text-lg font-semibold mb-2">Public Page</h3>
                                                        <p className="text-sm text-default-500 mb-3">Share this link with participants</p>
                                                        <div className="flex gap-2">
                                                            <Input
                                                                value={`${window.location.origin}/events/${event.slug}`}
                                                                readOnly
                                                                size="sm"
                                                                radius={getThemeRadius()}
                                                            />
                                                            <Button
                                                                size="sm"
                                                                color="primary"
                                                                variant="flat"
                                                                onPress={() => {
                                                                    navigator.clipboard.writeText(`${window.location.origin}/events/${event.slug}`);
                                                                    showToast.success('Link copied!');
                                                                }}
                                                                radius={getThemeRadius()}
                                                            >
                                                                Copy
                                                            </Button>
                                                        </div>
                                                    </CardBody>
                                                </Card>
                                            </motion.div>
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

ShowEvent.layout = (page) => <App>{page}</App>;

export default ShowEvent;
