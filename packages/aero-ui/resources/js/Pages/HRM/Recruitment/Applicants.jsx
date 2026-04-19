import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { 
    BriefcaseIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    EllipsisVerticalIcon,
    UserGroupIcon,
    CheckCircleIcon,
    ClockIcon,
    DocumentTextIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const Applicants = ({ title, jobOpenings: initialJobOpenings = [] }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete, isSuperAdmin } = useHRMAC();
    
    // Responsive breakpoints
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

    // State management
    const [loading, setLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(true);
    const [applicants, setApplicants] = useState([]);
    const [jobOpenings, setJobOpenings] = useState(initialJobOpenings);
    const [filters, setFilters] = useState({ search: '', job_opening: '', status: '', stage: '' });
    const [pagination, setPagination] = useState({ currentPage: 1, perPage: 15, total: 0, lastPage: 1 });
    const [stats, setStats] = useState({ 
        total: 0, 
        pending: 0, 
        interviewed: 0, 
        selected: 0,
        rejected: 0
    });
    const [modalStates, setModalStates] = useState({ view: false, delete: false, stage: false });
    const [selectedApplicant, setSelectedApplicant] = useState(null);

    // Permission checks
    const canViewApplicant = canUpdate('hrm.recruitment.applicants') || isSuperAdmin();
    const canUpdateStage = canUpdate('hrm.recruitment.applicants') || isSuperAdmin();
    const canDeleteApplicant = canDelete('hrm.recruitment.applicants') || isSuperAdmin();

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { 
            title: "Total Applicants", 
            value: stats.total, 
            icon: <UserGroupIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Pending Review", 
            value: stats.pending, 
            icon: <ClockIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Interviewed", 
            value: stats.interviewed, 
            icon: <DocumentTextIcon className="w-6 h-6" />, 
            color: "text-secondary", 
            iconBg: "bg-secondary/20" 
        },
        { 
            title: "Selected", 
            value: stats.selected, 
            icon: <CheckCircleIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
    ], [stats]);

    // Application stages
    const applicationStages = [
        { key: 'applied', label: 'Applied', color: 'default' },
        { key: 'screening', label: 'Screening', color: 'warning' },
        { key: 'interview_scheduled', label: 'Interview Scheduled', color: 'secondary' },
        { key: 'interviewed', label: 'Interviewed', color: 'primary' },
        { key: 'selected', label: 'Selected', color: 'success' },
        { key: 'rejected', label: 'Rejected', color: 'danger' },
        { key: 'offered', label: 'Offered', color: 'success' },
        { key: 'hired', label: 'Hired', color: 'success' },
    ];

    const getStageColor = (stage) => {
        return applicationStages.find(s => s.key === stage)?.color || 'default';
    };

    const getStageLabel = (stage) => {
        return applicationStages.find(s => s.key === stage)?.label || stage;
    };

    // Data fetching
    const fetchApplicants = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.recruitment.applicants.paginate'), {
                params: { 
                    page: pagination.currentPage, 
                    perPage: pagination.perPage,
                    ...filters
                }
            });
            if (response.status === 200) {
                setApplicants(response.data.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total || 0,
                    lastPage: response.data.last_page || 1
                }));
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to fetch applicants'
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('hrm.recruitment.applicants.stats'));
            if (response.status === 200) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch applicant stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchApplicants();
        fetchStats();
    }, [fetchApplicants, fetchStats]);

    // Modal handlers
    const openModal = (type, applicant = null) => {
        setSelectedApplicant(applicant);
        setModalStates(prev => ({ ...prev, [type]: true }));
    };

    const closeModal = (type) => {
        setModalStates(prev => ({ ...prev, [type]: false }));
        setSelectedApplicant(null);
    };

    // Filter handlers
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    // Stage update handler
    const handleStageUpdate = async (newStage) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.patch(
                    route('hrm.recruitment.applicants.update-stage', selectedApplicant.id),
                    { stage: newStage }
                );
                if (response.status === 200) {
                    resolve([response.data.message || 'Application stage updated successfully']);
                    fetchApplicants();
                    fetchStats();
                    closeModal('stage');
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to update application stage']);
            }
        });

        showToast.promise(promise, {
            loading: 'Updating application stage...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Delete handler
    const handleDelete = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(
                    route('hrm.recruitment.applicants.destroy', selectedApplicant.id)
                );
                if (response.status === 200) {
                    resolve([response.data.message || 'Applicant deleted successfully']);
                    fetchApplicants();
                    fetchStats();
                    closeModal('delete');
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to delete applicant']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting applicant...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Table columns
    const columns = [
        { uid: 'name', name: 'Applicant Name' },
        { uid: 'email', name: 'Email' },
        { uid: 'job_opening', name: 'Position' },
        { uid: 'stage', name: 'Stage' },
        { uid: 'applied_at', name: 'Applied Date' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = useCallback((item, columnKey) => {
        switch (columnKey) {
            case 'name':
                return (
                    <div className="flex flex-col">
                        <span className="font-medium">{item.name}</span>
                        {item.phone && <span className="text-small text-default-500">{item.phone}</span>}
                    </div>
                );
            case 'job_opening':
                return item.job_opening?.title || 'N/A';
            case 'stage':
                return (
                    <Chip 
                        color={getStageColor(item.stage)} 
                        size="sm" 
                        variant="flat"
                    >
                        {getStageLabel(item.stage)}
                    </Chip>
                );
            case 'applied_at':
                return new Date(item.applied_at || item.created_at).toLocaleDateString();
            case 'actions':
                return (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                                <EllipsisVerticalIcon className="w-5 h-5" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Actions">
                            {canViewApplicant && (
                                <DropdownItem 
                                    key="view" 
                                    startContent={<EyeIcon className="w-4 h-4" />}
                                    onPress={() => openModal('view', item)}
                                >
                                    View Details
                                </DropdownItem>
                            )}
                            {canUpdateStage && (
                                <DropdownItem 
                                    key="stage" 
                                    startContent={<PencilIcon className="w-4 h-4" />}
                                    onPress={() => openModal('stage', item)}
                                >
                                    Update Stage
                                </DropdownItem>
                            )}
                            {canDeleteApplicant && (
                                <DropdownItem 
                                    key="delete" 
                                    className="text-danger" 
                                    color="danger"
                                    startContent={<TrashIcon className="w-4 h-4" />}
                                    onPress={() => openModal('delete', item)}
                                >
                                    Delete
                                </DropdownItem>
                            )}
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return item[columnKey] || '-';
        }
    }, [canViewApplicant, canUpdateStage, canDeleteApplicant]);

    return (
        <>
            <Head title={title} />
            
            {/* Modals */}
            {modalStates.view && selectedApplicant && (
                <Modal 
                    isOpen={modalStates.view} 
                    onOpenChange={() => closeModal('view')}
                    size="2xl"
                    scrollBehavior="inside"
                >
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">Applicant Details</h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Name</label>
                                        <p className="text-default-900">{selectedApplicant.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Email</label>
                                        <p className="text-default-900">{selectedApplicant.email}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Phone</label>
                                        <p className="text-default-900">{selectedApplicant.phone || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Position</label>
                                        <p className="text-default-900">{selectedApplicant.job_opening?.title || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Current Stage</label>
                                        <Chip 
                                            color={getStageColor(selectedApplicant.stage)} 
                                            size="sm" 
                                            variant="flat"
                                            className="mt-1"
                                        >
                                            {getStageLabel(selectedApplicant.stage)}
                                        </Chip>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Applied Date</label>
                                        <p className="text-default-900">
                                            {new Date(selectedApplicant.applied_at || selectedApplicant.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                {selectedApplicant.cover_letter && (
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Cover Letter</label>
                                        <p className="text-default-900 mt-1 text-sm bg-default-100 p-3 rounded">
                                            {selectedApplicant.cover_letter}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('view')}>Close</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {modalStates.stage && selectedApplicant && (
                <Modal isOpen={modalStates.stage} onOpenChange={() => closeModal('stage')}>
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">Update Application Stage</h2>
                        </ModalHeader>
                        <ModalBody>
                            <p className="mb-4">Select a new stage for <strong>{selectedApplicant.name}</strong>'s application:</p>
                            <div className="space-y-2">
                                {applicationStages.map(stage => (
                                    <Button
                                        key={stage.key}
                                        variant={selectedApplicant.stage === stage.key ? 'solid' : 'flat'}
                                        color={stage.color}
                                        className="w-full justify-start"
                                        onPress={() => handleStageUpdate(stage.key)}
                                        disabled={selectedApplicant.stage === stage.key}
                                    >
                                        {stage.label}
                                    </Button>
                                ))}
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('stage')}>Cancel</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {modalStates.delete && selectedApplicant && (
                <Modal isOpen={modalStates.delete} onOpenChange={() => closeModal('delete')}>
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold text-danger">Delete Applicant</h2>
                        </ModalHeader>
                        <ModalBody>
                            <p>Are you sure you want to delete <strong>{selectedApplicant.name}</strong>'s application?</p>
                            <p className="text-sm text-default-500">This action cannot be undone.</p>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('delete')}>Cancel</Button>
                            <Button color="danger" onPress={handleDelete}>Delete</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Job Applicants Management">
                <div className="space-y-4">
                    <div className="w-full">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card 
                                className="transition-all duration-200"
                                style={{
                                    border: `var(--borderWidth, 2px) solid transparent`,
                                    borderRadius: `var(--borderRadius, 12px)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                    transform: `scale(var(--scale, 1))`,
                                    background: `linear-gradient(135deg, 
                                        var(--theme-content1, #FAFAFA) 20%, 
                                        var(--theme-content2, #F4F4F5) 10%, 
                                        var(--theme-content3, #F1F3F4) 20%)`,
                                }}
                            >
                                <CardHeader 
                                    className="border-b p-0"
                                    style={{
                                        borderColor: `var(--theme-divider, #E4E4E7)`,
                                        background: `linear-gradient(135deg, 
                                            color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, 
                                            color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
                                    }}
                                >
                                    <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <UserGroupIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Job Applicants
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Manage and track job applications
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    <StatsCards stats={statsData} isLoading={statsLoading} className="mb-6" />
                                    
                                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                        <Input
                                            label="Search"
                                            placeholder="Search applicants..."
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                        />
                                        
                                        <Select
                                            placeholder="All Positions"
                                            selectedKeys={filters.job_opening ? [filters.job_opening] : []}
                                            onSelectionChange={(keys) => handleFilterChange('job_opening', Array.from(keys)[0] || '')}
                                        >
                                            {jobOpenings.map(job => (
                                                <SelectItem key={job.id}>{job.title}</SelectItem>
                                            ))}
                                        </Select>
                                        
                                        <Select
                                            placeholder="All Stages"
                                            selectedKeys={filters.stage ? [filters.stage] : []}
                                            onSelectionChange={(keys) => handleFilterChange('stage', Array.from(keys)[0] || '')}
                                        >
                                            {applicationStages.map(stage => (
                                                <SelectItem key={stage.key}>{stage.label}</SelectItem>
                                            ))}
                                        </Select>
                                    </div>
                                    
                                    <Table 
                                        aria-label="Job Applicants" 
                                        classNames={{
                                            wrapper: "shadow-none border border-divider rounded-lg",
                                            th: "bg-default-100 text-default-600 font-semibold",
                                            td: "py-3"
                                        }}
                                    >
                                        <TableHeader columns={columns}>
                                            {(column) => <TableColumn key={column.uid}>{column.name}</TableColumn>}
                                        </TableHeader>
                                        <TableBody 
                                            items={applicants} 
                                            emptyContent={loading ? "Loading..." : "No applicants found"}
                                            isLoading={loading}
                                        >
                                            {(item) => (
                                                <TableRow key={item.id}>
                                                    {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                    
                                    {pagination.total > pagination.perPage && (
                                        <div className="flex justify-center mt-6">
                                            <Pagination
                                                total={pagination.lastPage}
                                                page={pagination.currentPage}
                                                onChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))}
                                                showControls
                                                showShadow
                                                color="primary"
                                                size={isMobile ? "sm" : "md"}
                                            />
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

Applicants.layout = (page) => <App children={page} />;
export default Applicants;