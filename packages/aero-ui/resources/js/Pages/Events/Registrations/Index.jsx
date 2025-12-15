import React, { useState, useEffect, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Button,
    Input,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Pagination,
    Checkbox,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Textarea,
    Card,
    CardBody,
    CardHeader
} from "@heroui/react";
import {
    ClipboardDocumentListIcon,
    ArrowLeftIcon,
    MagnifyingGlassIcon,
    EllipsisVerticalIcon,
    CheckCircleIcon,
    XCircleIcon,
    DocumentArrowDownIcon,
    PrinterIcon
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App';
import StatsCards from '@/Components/Common/StatsCards';
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';
import dayjs from 'dayjs';

const RegistrationsIndex = ({ event, registrations: initialRegistrations }) => {
    const { auth } = usePage().props;
    const [registrations, setRegistrations] = useState(initialRegistrations);
    const [selectedKeys, setSelectedKeys] = useState(new Set([]));
    const [searchQuery, setSearchQuery] = useState('');
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [rejectReason, setRejectReason] = useState('');
    const [actionType, setActionType] = useState('');
    const [targetRegistration, setTargetRegistration] = useState(null);
    
    const statsData = useMemo(() => [
        {
            title: 'Total',
            value: registrations.total || 0,
            icon: <ClipboardDocumentListIcon />,
            color: 'text-primary',
            iconBg: 'bg-primary/20',
            description: 'Total registrations'
        },
        {
            title: 'Approved',
            value: registrations.data?.filter(r => r.status === 'approved').length || 0,
            icon: <CheckCircleIcon />,
            color: 'text-success',
            iconBg: 'bg-success/20',
            description: 'Confirmed attendees'
        },
        {
            title: 'Pending',
            value: registrations.data?.filter(r => r.status === 'pending').length || 0,
            icon: <ClipboardDocumentListIcon />,
            color: 'text-warning',
            iconBg: 'bg-warning/20',
            description: 'Awaiting approval'
        },
        {
            title: 'Rejected',
            value: registrations.data?.filter(r => r.status === 'rejected').length || 0,
            icon: <XCircleIcon />,
            color: 'text-danger',
            iconBg: 'bg-danger/20',
            description: 'Not approved'
        }
    ], [registrations]);

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
    
    const handleApprove = async (registration) => {
        try {
            await axios.post(route('events.registrations.approve', [event.id, registration.id]));
            showToast.success('Registration approved successfully');
            router.reload();
        } catch (error) {
            showToast.error('Failed to approve registration');
        }
    };
    
    const openRejectModal = (registration) => {
        setTargetRegistration(registration);
        setActionType('reject');
        onOpen();
    };
    
    const handleReject = async () => {
        try {
            await axios.post(route('events.registrations.reject', [event.id, targetRegistration.id]), {
                rejection_reason: rejectReason
            });
            showToast.success('Registration rejected');
            onClose();
            setRejectReason('');
            router.reload();
        } catch (error) {
            showToast.error('Failed to reject registration');
        }
    };
    
    const handleVerifyPayment = async (registration) => {
        try {
            await axios.post(route('events.registrations.verify-payment', [event.id, registration.id]));
            showToast.success('Payment verified successfully');
            router.reload();
        } catch (error) {
            showToast.error('Failed to verify payment');
        }
    };
    
    const handleBulkApprove = async () => {
        if (selectedKeys.size === 0) {
            showToast.warning('Please select registrations to approve');
            return;
        }
        
        try {
            await axios.post(route('events.registrations.bulk-approve', event.id), {
                registration_ids: Array.from(selectedKeys)
            });
            showToast.success('Registrations approved successfully');
            setSelectedKeys(new Set([]));
            router.reload();
        } catch (error) {
            showToast.error('Failed to approve registrations');
        }
    };
    
    const handleBulkReject = () => {
        if (selectedKeys.size === 0) {
            showToast.warning('Please select registrations to reject');
            return;
        }
        setActionType('bulkReject');
        onOpen();
    };
    
    const executeBulkReject = async () => {
        try {
            await axios.post(route('events.registrations.bulk-reject', event.id), {
                registration_ids: Array.from(selectedKeys),
                rejection_reason: rejectReason
            });
            showToast.success('Registrations rejected');
            setSelectedKeys(new Set([]));
            onClose();
            setRejectReason('');
            router.reload();
        } catch (error) {
            showToast.error('Failed to reject registrations');
        }
    };
    
    const handleExportCsv = () => {
        window.location.href = route('events.registrations.export-csv', event.id);
    };
    
    const handlePrintToken = (registration) => {
        window.open(route('events.registrations.print-token', [event.id, registration.id]), '_blank');
    };
    
    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'success';
            case 'pending': return 'warning';
            case 'rejected': return 'danger';
            case 'cancelled': return 'default';
            default: return 'default';
        }
    };
    
    const filteredRegistrations = registrations.data?.filter(reg => 
        reg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reg.token.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return (
        <>
            <Head title={`Registrations - ${event.title}`} />
            
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
                                                    <ClipboardDocumentListIcon className="w-6 h-6 text-primary" />
                                                </div>
                                                <div>
                                                    <h1 className="text-2xl font-bold text-foreground">Event Registrations</h1>
                                                    <p className="text-sm text-default-500 mt-1">{event.title}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    variant="flat"
                                                    onPress={() => router.get(route('events.show', event.id))}
                                                    startContent={<ArrowLeftIcon className="w-5 h-5" />}
                                                    radius={getThemeRadius()}
                                                    size={isMobile ? 'sm' : 'md'}
                                                >
                                                    {!isMobile && 'Back to Event'}
                                                </Button>
                                                <Button
                                                    color="primary"
                                                    variant="flat"
                                                    onPress={handleExportCsv}
                                                    startContent={<DocumentArrowDownIcon className="w-5 h-5" />}
                                                    radius={getThemeRadius()}
                                                    size={isMobile ? 'sm' : 'md'}
                                                >
                                                    Export CSV
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
            
                                <CardBody className="p-6">
                                    <StatsCards stats={statsData} className="mb-6" />
                                    
                                    <Card className="bg-content2/50" style={{ borderRadius: 'var(--borderRadius, 12px)' }}>
                                        <CardBody>
                                            {/* Actions Bar */}
                                            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                                                <Input
                                                    placeholder="Search by name, email, or token..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                                                    className="max-w-md"
                                                    radius={getThemeRadius()}
                                                />
                                                
                                                {selectedKeys.size > 0 && (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            color="success"
                                                            variant="flat"
                                                            onPress={handleBulkApprove}
                                                            radius={getThemeRadius()}
                                                        >
                                                            Approve Selected ({selectedKeys.size})
                                                        </Button>
                                                        <Button
                                                            color="danger"
                                                            variant="flat"
                                                            onPress={handleBulkReject}
                                                            radius={getThemeRadius()}
                                                        >
                                                            Reject Selected ({selectedKeys.size})
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                    
                    {/* Table */}
                    <Table
                        aria-label="Event registrations table"
                        selectionMode="multiple"
                        selectedKeys={selectedKeys}
                        onSelectionChange={setSelectedKeys}
                    >
                        <TableHeader>
                            <TableColumn>TOKEN</TableColumn>
                            <TableColumn>NAME</TableColumn>
                            <TableColumn>EMAIL</TableColumn>
                            <TableColumn>PHONE</TableColumn>
                            <TableColumn>SUB-EVENTS</TableColumn>
                            <TableColumn>STATUS</TableColumn>
                            <TableColumn>PAYMENT</TableColumn>
                            <TableColumn>DATE</TableColumn>
                            <TableColumn>ACTIONS</TableColumn>
                        </TableHeader>
                        <TableBody items={filteredRegistrations || []}>
                            {(registration) => (
                                <TableRow key={registration.id}>
                                    <TableCell>
                                        <span className="font-mono text-sm">{registration.token}</span>
                                    </TableCell>
                                    <TableCell>{registration.name}</TableCell>
                                    <TableCell>{registration.email}</TableCell>
                                    <TableCell>{registration.phone}</TableCell>
                                    <TableCell>
                                        <div className="text-xs">
                                            {registration.sub_events?.slice(0, 2).map((se, i) => (
                                                <div key={i}>{se.title}</div>
                                            ))}
                                            {registration.sub_events?.length > 2 && (
                                                <div className="text-default-400">+{registration.sub_events.length - 2} more</div>
                                            )}
                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip size="sm" color={getStatusColor(registration.status)} variant="flat" radius={getThemeRadius()}>
                                                            {registration.status}
                                                        </Chip>
                                                    </TableCell>
                                                    <TableCell>
                                                        {registration.payment_verified ? (
                                                            <Chip size="sm" color="success" variant="flat" radius={getThemeRadius()}>Verified</Chip>
                                                        ) : registration.payment_proof ? (
                                                            <Chip size="sm" color="warning" variant="flat" radius={getThemeRadius()}>Pending</Chip>
                                                        ) : (
                                                            <Chip size="sm" color="default" variant="flat" radius={getThemeRadius()}>No Proof</Chip>
                                                        )}
                                                    </TableCell>
                                    <TableCell>
                                        {dayjs(registration.created_at).format('MMM DD, YYYY')}
                                    </TableCell>
                                    <TableCell>
                                        <Dropdown>
                                            <DropdownTrigger>
                                                <Button isIconOnly size="sm" variant="light">
                                                    <EllipsisVerticalIcon className="w-5 h-5" />
                                                </Button>
                                            </DropdownTrigger>
                                            <DropdownMenu aria-label="Actions">
                                                <DropdownItem
                                                    key="view"
                                                    onPress={() => router.get(route('events.registrations.show', [event.id, registration.id]))}
                                                >
                                                    View Details
                                                </DropdownItem>
                                                {registration.status === 'pending' && (
                                                    <>
                                                        <DropdownItem
                                                            key="approve"
                                                            color="success"
                                                            onPress={() => handleApprove(registration)}
                                                        >
                                                            Approve
                                                        </DropdownItem>
                                                        <DropdownItem
                                                            key="reject"
                                                            color="danger"
                                                            onPress={() => openRejectModal(registration)}
                                                        >
                                                            Reject
                                                        </DropdownItem>
                                                    </>
                                                )}
                                                {registration.payment_proof && !registration.payment_verified && (
                                                    <DropdownItem
                                                        key="verify-payment"
                                                        color="primary"
                                                        onPress={() => handleVerifyPayment(registration)}
                                                    >
                                                        Verify Payment
                                                    </DropdownItem>
                                                )}
                                                <DropdownItem
                                                    key="print"
                                                    startContent={<PrinterIcon className="w-4 h-4" />}
                                                    onPress={() => handlePrintToken(registration)}
                                                >
                                                    Print Token
                                                </DropdownItem>
                                            </DropdownMenu>
                                        </Dropdown>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    
                                            {/* Pagination */}
                                            {registrations.last_page > 1 && (
                                                <div className="flex justify-center mt-6">
                                                    <Pagination
                                                        total={registrations.last_page}
                                                        page={registrations.current_page}
                                                        onChange={(page) => router.get(route('events.registrations.index', event.id), { page })}
                                                        showControls
                                                        radius={getThemeRadius()}
                                                    />
                                                </div>
                                            )}
                                        </CardBody>
                                    </Card>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
            
            {/* Reject Modal */}
            <Modal isOpen={isOpen} onClose={onClose} radius={getThemeRadius()}>
                <ModalContent>
                    <ModalHeader>
                        {actionType === 'bulkReject' ? 'Reject Selected Registrations' : 'Reject Registration'}
                    </ModalHeader>
                    <ModalBody>
                        <Textarea
                            label="Rejection Reason (Optional)"
                            placeholder="Enter reason for rejection"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={4}
                            radius={getThemeRadius()}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={onClose} radius={getThemeRadius()}>
                            Cancel
                        </Button>
                        <Button 
                            color="danger" 
                            onPress={actionType === 'bulkReject' ? executeBulkReject : handleReject}
                            radius={getThemeRadius()}
                        >
                            Reject
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

RegistrationsIndex.layout = (page) => <App>{page}</App>;

export default RegistrationsIndex;
