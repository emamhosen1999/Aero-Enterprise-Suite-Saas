import React from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import {
    Card,
    CardBody,
    Input,
    Button,
    Chip,
    Divider,
    Image
} from "@heroui/react";
import {
    MagnifyingGlassIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    ArrowLeftIcon,
    PrinterIcon
} from '@heroicons/react/24/outline';
import dayjs from 'dayjs';

// Helper function to get theme radius from CSS variable
const getThemeRadius = () => {
    const borderRadius = getComputedStyle(document.documentElement)
        .getPropertyValue('--borderRadius')
        .trim();
    return borderRadius || 'md';
};

const CheckRegistration = ({ registration, event }) => {
    const { data, setData, post, processing, errors } = useForm({
        token: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('public.events.check-registration'));
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved':
                return <CheckCircleIcon className="w-12 h-12 text-success" />;
            case 'rejected':
                return <XCircleIcon className="w-12 h-12 text-danger" />;
            case 'pending':
                return <ClockIcon className="w-12 h-12 text-warning" />;
            default:
                return null;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'success';
            case 'rejected': return 'danger';
            case 'pending': return 'warning';
            default: return 'default';
        }
    };

    const handlePrintToken = () => {
        window.open(route('events.registrations.print-token', {
            event: event.id,
            registration: registration.id
        }), '_blank');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-background py-12 px-4">
            <Head title="Check Registration Status" />

            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-3">Check Registration Status</h1>
                    <p className="text-lg text-default-600">
                        Enter your registration token to check your status
                    </p>
                </div>

                {/* Search Form */}
                {!registration && (
                    <Card className="mb-8" radius={getThemeRadius()}>
                        <CardBody className="p-6">
                            <form onSubmit={handleSubmit}>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Input
                                        placeholder="Enter your registration token (e.g., EVT-XXXXXXXX)"
                                        value={data.token}
                                        onChange={(e) => setData('token', e.target.value.toUpperCase())}
                                        size="lg"
                                        variant="bordered"
                                        className="flex-1"
                                        isInvalid={!!errors.token}
                                        errorMessage={errors.token}
                                        startContent={<MagnifyingGlassIcon className="w-5 h-5 text-default-400" />}
                                        radius={getThemeRadius()}
                                    />
                                    <Button
                                        type="submit"
                                        color="primary"
                                        size="lg"
                                        isLoading={processing}
                                        className="sm:w-auto w-full"
                                        radius={getThemeRadius()}
                                    >
                                        Check Status
                                    </Button>
                                </div>
                            </form>
                        </CardBody>
                    </Card>
                )}

                {/* Registration Details */}
                {registration && event && (
                    <Card radius={getThemeRadius()}>
                        <CardBody className="p-8">
                            {/* Status Icon */}
                            <div className="flex justify-center mb-6">
                                <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
                                    registration.status === 'approved' ? 'bg-success/10' :
                                    registration.status === 'rejected' ? 'bg-danger/10' :
                                    'bg-warning/10'
                                }`}>
                                    {getStatusIcon(registration.status)}
                                </div>
                            </div>

                            {/* Status */}
                            <div className="text-center mb-6">
                                <Chip
                                    color={getStatusColor(registration.status)}
                                    size="lg"
                                    variant="flat"
                                    className="mb-3"
                                    radius={getThemeRadius()}
                                >
                                    {registration.status.toUpperCase()}
                                </Chip>
                                <p className="text-lg text-default-600">
                                    {registration.status === 'approved' && 'Your registration has been approved!'}
                                    {registration.status === 'pending' && 'Your registration is under review'}
                                    {registration.status === 'rejected' && 'Your registration has been rejected'}
                                </p>
                            </div>

                            <Divider className="my-6" />

                            {/* Token */}
                            <div className="text-center mb-6">
                                <p className="text-sm text-default-500 mb-2">Registration Token</p>
                                <p className="text-3xl font-mono font-bold text-primary">{registration.token}</p>
                            </div>

                            <Divider className="my-6" />

                            {/* Registration Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <p className="text-sm text-default-500 mb-1">Participant Name</p>
                                    <p className="font-medium">{registration.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-default-500 mb-1">Email</p>
                                    <p className="font-medium">{registration.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-default-500 mb-1">Phone</p>
                                    <p className="font-medium">{registration.phone}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-default-500 mb-1">Registration Date</p>
                                    <p className="font-medium">
                                        {dayjs(registration.created_at).format('MMM DD, YYYY')}
                                    </p>
                                </div>
                            </div>

                            <Divider className="my-6" />

                            {/* Event Details */}
                            <div className="bg-default-100 p-4 rounded-lg mb-6">
                                <h3 className="font-semibold mb-3">Event Details</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-default-600">Event:</span>
                                        <span className="font-medium">{event.title}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-default-600">Date:</span>
                                        <span className="font-medium">
                                            {dayjs(event.event_date).format('MMM DD, YYYY')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-default-600">Time:</span>
                                        <span className="font-medium">{event.event_time}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-default-600">Venue:</span>
                                        <span className="font-medium">{event.venue}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Sub-Events */}
                            {registration.sub_events && registration.sub_events.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="font-semibold mb-3">Registered Sub-Events</h3>
                                    <div className="space-y-2">
                                        {registration.sub_events.map((subEvent, index) => (
                                            <div key={index} className="flex items-center gap-2 bg-default-50 p-3 rounded-lg">
                                                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                                                    {index + 1}
                                                </div>
                                                <span className="font-medium">{subEvent.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* QR Code */}
                            {registration.qr_code && registration.status === 'approved' && (
                                <div className="bg-default-50 p-6 rounded-lg mb-6">
                                    <h3 className="font-semibold text-center mb-4">Your Registration QR Code</h3>
                                    <div className="flex justify-center">
                                        <Image
                                            src={`/storage/${registration.qr_code}`}
                                            alt="QR Code"
                                            className="w-48 h-48 border-2 border-default-200 rounded-lg"
                                        />
                                    </div>
                                    <p className="text-xs text-center text-default-500 mt-3">
                                        Present this QR code at the event venue for verification
                                    </p>
                                </div>
                            )}

                            {/* Rejection Reason */}
                            {registration.rejection_reason && (
                                <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 mb-6">
                                    <p className="text-sm font-semibold text-danger-800 mb-2">Rejection Reason</p>
                                    <p className="text-sm text-danger-700">{registration.rejection_reason}</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <Button
                                    variant="flat"
                                    startContent={<ArrowLeftIcon className="w-4 h-4" />}
                                    onPress={() => router.get(route('public.events.index'))}
                                    radius={getThemeRadius()}
                                >
                                    Back to Events
                                </Button>
                                {registration.status === 'approved' && (
                                    <Button
                                        color="primary"
                                        startContent={<PrinterIcon className="w-4 h-4" />}
                                        onPress={handlePrintToken}
                                        radius={getThemeRadius()}
                                    >
                                        Print Token
                                    </Button>
                                )}
                            </div>

                            {/* Contact Info */}
                            {event.organizer_phone && (
                                <div className="mt-6 text-center text-sm text-default-500">
                                    For queries, contact: {event.organizer_phone}
                                    {event.organizer_email && ` | ${event.organizer_email}`}
                                </div>
                            )}
                        </CardBody>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default CheckRegistration;
