import React from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Chip,
    Input
} from "@heroui/react";
import {
    CalendarIcon,
    MapPinIcon,
    UserGroupIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import dayjs from 'dayjs';

// Helper function to get theme radius from CSS variable
const getThemeRadius = () => {
    const borderRadius = getComputedStyle(document.documentElement)
        .getPropertyValue('--borderRadius')
        .trim();
    return borderRadius || 'md';
};

const PublicEventsIndex = ({ events }) => {
    const [searchQuery, setSearchQuery] = React.useState('');
    
    const filteredEvents = events.data?.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.venue.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-background">
            <Head title="Events" />
            
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <h1 className="text-3xl font-bold text-gray-900">Upcoming Events</h1>
                    <p className="mt-2 text-gray-600">Browse and register for our exciting events</p>
                </div>
            </div>
            
            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search */}
                <div className="mb-8">
                    <Input
                        placeholder="Search events..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        startContent={<MagnifyingGlassIcon className="w-5 h-5" />}
                        size="lg"
                        className="max-w-2xl"
                        radius={getThemeRadius()}
                    />
                </div>
                
                {/* Events Grid */}
                {filteredEvents && filteredEvents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEvents.map((event) => (
                            <Card 
                                key={event.id} 
                                className="hover:shadow-xl transition-shadow cursor-pointer"
                                isPressable
                                onPress={() => router.get(route('public.events.show', event.slug))}
                                radius={getThemeRadius()}
                            >
                                {event.banner_image && (
                                    <CardHeader className="p-0">
                                        <img
                                            src={`/storage/${event.banner_image}`}
                                            alt={event.title}
                                            className="w-full h-48 object-cover"
                                        />
                                    </CardHeader>
                                )}
                                <CardBody>
                                    <div className="space-y-3">
                                        <div>
                                            <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                                            <p className="text-sm text-default-600 line-clamp-2">
                                                {event.description}
                                            </p>
                                        </div>
                                        
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2 text-default-600">
                                                <CalendarIcon className="w-4 h-4" />
                                                <span>{dayjs(event.event_date).format('MMM DD, YYYY')} at {event.event_time}</span>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 text-default-600">
                                                <MapPinIcon className="w-4 h-4" />
                                                <span>{event.venue}</span>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 text-default-600">
                                                <UserGroupIcon className="w-4 h-4" />
                                                <span>
                                                    {event.approved_registrations_count || 0} registered
                                                    {event.max_participants && ` / ${event.max_participants} max`}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between pt-3">
                                            <Chip
                                                color={event.is_registration_open ? 'success' : 'default'}
                                                size="sm"
                                                variant="flat"
                                                radius={getThemeRadius()}
                                            >
                                                {event.is_registration_open ? 'Registration Open' : 'Registration Closed'}
                                            </Chip>
                                            
                                            <Button
                                                size="sm"
                                                color="primary"
                                                onPress={() => router.get(route('public.events.show', event.slug))}
                                                radius={getThemeRadius()}
                                            >
                                                View Details
                                            </Button>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <CalendarIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No events found</h3>
                        <p className="text-gray-500">Check back later for upcoming events</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicEventsIndex;
