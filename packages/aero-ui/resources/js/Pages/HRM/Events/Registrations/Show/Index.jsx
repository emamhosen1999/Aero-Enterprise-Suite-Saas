import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import App from '@/Layouts/App';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Chip,
    Divider,
    Image,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Textarea
} from "@heroui/react";
import {
    UserCircleIcon,
    EnvelopeIcon,
    PhoneIcon,
    MapPinIcon,
    BuildingOfficeIcon,
    CalendarIcon,
    CheckCircleIcon,
    XCircleIcon,
    PrinterIcon,
    DocumentTextIcon,
    ArrowLeftIcon
} from '@heroicons/react/24/outline';
import dayjs from 'dayjs';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils';

const Show = ({ auth, registration, event }) => {
    const [showRejectModal, setShowRejectModal] = React.useState(false);
    const [rejectReason, setRejectReason] = React.useState('');
    const [processing, setProcessing] = React.useState(false);

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

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'success';
            case 'rejected': return 'danger';
            case 'pending': return 'warning';
            default: return 'default';
        }
    };

    const getPaymentStatusColor = (status) => {
        switch (status) {
            case 'verified': return 'success';
            case 'pending': return 'warning';
            case 'no_proof': return 'default';
            default: return 'default';
        }
    };

    const handleApprove = async () => {
        if (!confirm('Are you sure you want to approve this registration?')) return;
        
        setProcessing(true);
        try {
            await axios.post(route('events.registrations.approve', {
                event: event.id,
                registration: registration.id
            }));
            showToast.success('Registration approved successfully');
            router.reload();
        } catch (error) {
            showToast.error(error.response?.data?.message || 'Failed to approve registration');
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        setProcessing(true);
        try {
            await axios.post(route('events.registrations.reject', {
                event: event.id,
                registration: registration.id
            }), {
                rejection_reason: rejectReason
            });
            showToast.success('Registration rejected successfully');
            setShowRejectModal(false);
            router.reload();
        } catch (error) {
            showToast.error(error.response?.data?.message || 'Failed to reject registration');
        } finally {
            setProcessing(false);
        }
    };

    const handleVerifyPayment = async () => {
        if (!confirm('Are you sure you want to verify this payment?')) return;
        
        setProcessing(true);
        try {
            await axios.post(route('events.registrations.verify-payment', {
                event: event.id,
                registration: registration.id
            }));
            showToast.success('Payment verified successfully');
            router.reload();
        } catch (error) {
            showToast.error(error.response?.data?.message || 'Failed to verify payment');
        } finally {
            setProcessing(false);
        }
    };

    const handlePrintToken = () => {
        window.open(route('events.registrations.print-token', {
            event: event.id,
            registration: registration.id
        }), '_blank');
    };

    const actionButtons = [
        {
            label: 'Back',
            variant: 'light',
            onClick: () => router.get(route('events.registrations.index', event.id))
        }
    ];

    if (registration.status === 'pending') {
        actionButtons.push({
            label: 'Approve',
            color: 'success',
            startContent: <CheckCircleIcon className="w-4 h-4" />,
            onClick: handleApprove,
            disabled: processing
        });
        actionButtons.push({
            label: 'Reject',
            color: 'danger',
            startContent: <XCircleIcon className="w-4 h-4" />,
            onClick: () => setShowRejectModal(true),
            disabled: processing
        });
    }

    if (registration.payment_status === 'pending' && registration.payment_proof) {
        actionButtons.push({
            label: 'Verify Payment',
            color: 'primary',
            onClick: handleVerifyPayment,
            disabled: processing
        });
    }

    if (registration.status === 'approved') {
        actionButtons.push({
            label: 'Print Token',
            color: 'primary',
            startContent: <PrinterIcon className="w-4 h-4" />,
            onClick: handlePrintToken
        });
    }

    return (
        <>
            <Head title={`Registration - ${registration.token}`} />
            
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
                                                    <DocumentTextIcon className="w-6 h-6 text-primary" />
                                                </div>
                                                <div>
                                                    <h1 className="text-2xl font-bold text-foreground">Registration Details</h1>
                                                    <p className="text-sm text-default-500 mt-1">Token: {registration.token}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    variant="flat"
                                                    onPress={() => router.get(route('events.registrations.index', event.id))}
                                                    startContent={<ArrowLeftIcon className="w-5 h-5" />}
                                                    radius={getThemeRadius()}
                                                >
                                                    Back
                                                </Button>
                                                {registration.status === 'pending' && (
                                                    <>
                                                        <Button
                                                            color="success"
                                                            onPress={handleApprove}
                                                            startContent={<CheckCircleIcon className="w-4 h-4" />}
                                                            isDisabled={processing}
                                                            radius={getThemeRadius()}
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            color="danger"
                                                            onPress={() => setShowRejectModal(true)}
                                                            startContent={<XCircleIcon className="w-4 h-4" />}
                                                            isDisabled={processing}
                                                            radius={getThemeRadius()}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </>
                                                )}
                                                {registration.payment_status === 'pending' && registration.payment_proof && (
                                                    <Button
                                                        color="primary"
                                                        onPress={handleVerifyPayment}
                                                        isDisabled={processing}
                                                        radius={getThemeRadius()}
                                                    >
                                                        Verify Payment
                                                    </Button>
                                                )}
                                                {registration.status === 'approved' && (
                                                    <Button
                                                        color="primary"
                                                        onPress={handlePrintToken}
                                                        startContent={<PrinterIcon className="w-4 h-4" />}
                                                        radius={getThemeRadius()}
                                                    >
                                                        Print Token
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
            
                                <CardBody className="p-6">

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* Main Content */}
                                        <div className="lg:col-span-2 space-y-6">
                                            {/* Participant Information */}
                                            <Card className="bg-content2/50" style={{ borderRadius: 'var(--borderRadius, 12px)' }}>
                                                <CardBody>
                                                    <div className="flex items-center justify-between mb-6">
                                                        <h2 className="text-xl font-semibold">Participant Information</h2>
                                                        <Chip color={getStatusColor(registration.status)} variant="flat" size="lg" radius={getThemeRadius()}>
                                                            {registration.status}
                                                        </Chip>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="flex items-start gap-3">
                                                            <UserCircleIcon className="w-5 h-5 text-primary mt-1" />
                                                            <div>
                                                                <p className="text-sm text-default-500">Name</p>
                                                                <p className="font-medium">{registration.name}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-start gap-3">
                                                            <EnvelopeIcon className="w-5 h-5 text-primary mt-1" />
                                                            <div>
                                                                <p className="text-sm text-default-500">Email</p>
                                                                <p className="font-medium">{registration.email}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-start gap-3">
                                                            <PhoneIcon className="w-5 h-5 text-primary mt-1" />
                                                            <div>
                                                                <p className="text-sm text-default-500">Phone</p>
                                                                <p className="font-medium">{registration.phone}</p>
                                                            </div>
                                                        </div>

                                                        {registration.gender && (
                                                            <div className="flex items-start gap-3">
                                                                <UserCircleIcon className="w-5 h-5 text-primary mt-1" />
                                                                <div>
                                                                    <p className="text-sm text-default-500">Gender</p>
                                                                    <p className="font-medium capitalize">{registration.gender}</p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {registration.address && (
                                                            <div className="flex items-start gap-3 md:col-span-2">
                                                                <MapPinIcon className="w-5 h-5 text-primary mt-1" />
                                                                <div>
                                                                    <p className="text-sm text-default-500">Address</p>
                                                                    <p className="font-medium">{registration.address}</p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {registration.organization_or_department && (
                                                            <div className="flex items-start gap-3 md:col-span-2">
                                                                <BuildingOfficeIcon className="w-5 h-5 text-primary mt-1" />
                                                                <div>
                                                                    <p className="text-sm text-default-500">Organization/Department</p>
                                                                    <p className="font-medium">{registration.organization_or_department}</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <Divider className="my-6" />

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-sm text-default-500 mb-1">Registration Date</p>
                                                            <p className="font-medium">
                                                                {dayjs(registration.created_at).format('MMM DD, YYYY hh:mm A')}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <p className="text-sm text-default-500 mb-1">Token</p>
                                                            <p className="font-mono font-bold text-primary">{registration.token}</p>
                                                        </div>
                                                    </div>
                                                </CardBody>
                                            </Card>

            {/* Sub-Events */}
            {registration.sub_events && registration.sub_events.length > 0 && (
                <Card className="bg-content2/50" style={{ borderRadius: 'var(--borderRadius, 12px)' }}>
                    <CardBody>
                        <h2 className="text-xl font-semibold mb-4">Registered Sub-Events</h2>
                        <div className="space-y-3">
                            {registration.sub_events.map((subEvent, index) => (
                                <Card key={index} style={{ borderRadius: 'var(--borderRadius, 12px)' }}>
                                    <CardBody>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-medium">{subEvent.title}</p>
                                                {subEvent.description && (
                                                    <p className="text-sm text-default-500 mt-1">
                                                        {subEvent.description}
                                                    </p>
                                                )}
                                            </div>
                                            {subEvent.joining_fee && parseFloat(subEvent.joining_fee) > 0 && (
                                                <Chip color="primary" variant="flat" radius={getThemeRadius()}>
                                                    ₹{parseFloat(subEvent.joining_fee).toFixed(2)}
                                                </Chip>
                                            )}
                                        </div>
                                    </CardBody>
                                </Card>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Custom Fields */}
            {registration.custom_fields && Object.keys(registration.custom_fields).length > 0 && (
                <Card className="bg-content2/50" style={{ borderRadius: 'var(--borderRadius, 12px)' }}>
                    <CardBody>
                        <h2 className="text-xl font-semibold mb-4">Additional Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(registration.custom_fields).map(([key, value]) => (
                                <div key={key}>
                                    <p className="text-sm text-default-500 mb-1 capitalize">
                                        {key.replace(/_/g, ' ')}
                                    </p>
                                    <p className="font-medium">{value}</p>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            )}

                                            {/* Rejection Reason */}
                                            {registration.rejection_reason && (
                                                <Card className="bg-content2/50" style={{ borderRadius: 'var(--borderRadius, 12px)' }}>
                                                    <CardBody>
                            <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
                                <p className="text-sm font-semibold text-danger-800 mb-2">Rejection Reason</p>
                                <p className="text-sm text-danger-700">{registration.rejection_reason}</p>
                            </div>
                                                    </CardBody>
                                                </Card>
                                            )}
                                        </div>

                                        {/* Sidebar */}
                                        <div className="space-y-6">
                                            {/* Event Information */}
                                            <motion.div
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: 0.1 }}
                                            >
                                                <Card className="bg-content2/50" style={{ borderRadius: 'var(--borderRadius, 12px)' }}>
                                                    <CardBody>
                        <h3 className="font-semibold mb-4">Event Information</h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-default-500">Event</p>
                                <p className="font-medium">{event.title}</p>
                            </div>
                            <div>
                                <p className="text-sm text-default-500">Date</p>
                                <p className="font-medium">
                                    {dayjs(event.event_date).format('MMM DD, YYYY')}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-default-500">Time</p>
                                <p className="font-medium">{event.event_time}</p>
                            </div>
                            <div>
                                <p className="text-sm text-default-500">Venue</p>
                                <p className="font-medium">{event.venue}</p>
                            </div>
                        </div>
                                                    </CardBody>
                                                </Card>
                                            </motion.div>

                                            {/* Payment Information */}
                                            <motion.div
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: 0.2 }}
                                            >
                                                <Card className="bg-content2/50" style={{ borderRadius: 'var(--borderRadius, 12px)' }}>
                                                    <CardBody>
                        <h3 className="font-semibold mb-4">Payment Information</h3>
                        <div className="space-y-3">
                                                            <div>
                                                                <p className="text-sm text-default-500 mb-2">Payment Status</p>
                                                                <Chip 
                                                                    color={getPaymentStatusColor(registration.payment_status)} 
                                                                    variant="flat"
                                                                    className="w-full justify-center"
                                                                    radius={getThemeRadius()}
                                                                >
                                                                    {registration.payment_status?.replace('_', ' ')}
                                                                </Chip>
                                                            </div>                            {registration.payment_proof && (
                                <div>
                                    <p className="text-sm text-default-500 mb-2">Payment Proof</p>
                                    <Image
                                        src={`/storage/${registration.payment_proof}`}
                                        alt="Payment Proof"
                                        className="w-full rounded-lg cursor-pointer"
                                        onClick={() => window.open(`/storage/${registration.payment_proof}`, '_blank')}
                                    />
                                </div>
                            )}
                        </div>
                                                    </CardBody>
                                                </Card>
                                            </motion.div>

                                            {/* QR Code */}
                                            {registration.qr_code && (
                                                <motion.div
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.3, delay: 0.3 }}
                                                >
                                                    <Card className="bg-content2/50" style={{ borderRadius: 'var(--borderRadius, 12px)' }}>
                                                        <CardBody>
                                                            <h3 className="font-semibold mb-4 text-center">Registration QR Code</h3>
                                                            <div className="flex justify-center">
                                                                <Image
                                                                    src={`/storage/${registration.qr_code}`}
                                                                    alt="QR Code"
                                                                    className="w-48 h-48"
                                                                    radius={getThemeRadius()}
                                                                />
                                                            </div>
                                                            <p className="text-xs text-center text-default-500 mt-2">
                                                                Scan to verify registration
                                                            </p>
                                                        </CardBody>
                                                    </Card>
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Reject Modal */}
            <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} radius={getThemeRadius()}>
                <ModalContent>
                    <ModalHeader>Reject Registration</ModalHeader>
                    <ModalBody>
                        <p className="text-sm text-default-600 mb-4">
                            Are you sure you want to reject this registration?
                        </p>
                        <Textarea
                            label="Rejection Reason (Optional)"
                            placeholder="Provide a reason for rejection..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={4}
                            radius={getThemeRadius()}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onPress={() => setShowRejectModal(false)} radius={getThemeRadius()}>
                            Cancel
                        </Button>
                        <Button color="danger" onPress={handleReject} isLoading={processing} radius={getThemeRadius()}>
                            Reject
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

Show.layout = (page) => <App>{page}</App>;

export default Show;
