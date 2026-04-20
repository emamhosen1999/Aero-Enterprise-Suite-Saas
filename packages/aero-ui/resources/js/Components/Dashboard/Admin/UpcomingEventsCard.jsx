import React from 'react';
import { Card, CardBody, CardHeader, Chip, Skeleton } from '@heroui/react';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { getThemedCardStyle } from '@/Components/UI/ThemedCard';

const UpcomingEventsCard = ({ events = [], loading = false }) => {
    if (loading) {
        return (
            <Card style={getThemedCardStyle()}>
                <CardBody className="p-4 space-y-3">
                    <Skeleton className="h-5 w-32 rounded" />
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}
                </CardBody>
            </Card>
        );
    }

    return (
        <Card className="transition-all duration-200" style={getThemedCardStyle()}>
            <CardHeader className="border-b p-4" style={{ borderColor: 'var(--theme-divider, #E4E4E7)' }}>
                <div className="flex items-center gap-2">
                    <CalendarDaysIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                    <h3 className="font-semibold">Upcoming Events</h3>
                </div>
            </CardHeader>
            <CardBody className="p-4">
                {events.length === 0 ? (
                    <p className="text-sm text-default-400 text-center py-4">No upcoming events</p>
                ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {events.map((event, i) => (
                            <div key={event.id || i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-content2 transition-colors">
                                <div className="flex flex-col items-center bg-primary/10 rounded-lg p-1.5 min-w-[44px]">
                                    <span className="text-xs text-primary font-semibold">
                                        {new Date(event.date).toLocaleDateString('en', { month: 'short' })}
                                    </span>
                                    <span className="text-lg font-bold text-primary leading-none">
                                        {new Date(event.date).getDate()}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{event.title}</p>
                                    {event.module && (
                                        <Chip size="sm" variant="flat" className="mt-0.5 capitalize">{event.module}</Chip>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardBody>
        </Card>
    );
};

export default UpcomingEventsCard;
