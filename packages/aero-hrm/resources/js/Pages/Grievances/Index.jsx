import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Input,
    Select,
    SelectItem,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Pagination,
    Skeleton,
    Textarea,
} from "@heroui/react";
import {
    ExclamationCircleIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    EllipsisVerticalIcon,
    EyeIcon,
    UserCircleIcon,
    CheckCircleIcon,
    ClockIcon,
    ShieldExclamationIcon,
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';

const GrievancesIndex = ({ title, stats: initialStats, categories, departments }) => {
    const { auth } = usePage().props;

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

    useEffect(() => {
        const checkScreenSize = () => setIsMobile(window.innerWidth < 640);
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const [loading, setLoading] = useState(false);
    const [grievances, setGrievances] = useState([]);
    const [stats, setStats] = useState(initialStats || {});
    const [filters, setFilters] = useState({ search: '', status: '', severity: '', category_id: '' });
    const [pagination, setPagination] = useState({ currentPage: 1, perPage: 15, total: 0, lastPage: 1 });
    const [modalOpen, setModalOpen] = useState(false);
    const [formLoading, setFormLoading] = useState(false);

    const [formData, setFormData] = useState({
        employee_id: '',
        category_id: '',
        subject: '',
        description: '',
        grievance_type: 'other',
        severity: 'medium',
        incident_date: '',
        incident_location: '',
        is_anonymous: false,
        is_confidential: false,
    });

    const statsData = useMemo(() => [
        { title: "Total Grievances", value: stats.total || 0, icon: <ExclamationCircleIcon className="w-5 h-5" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "Open Cases", value: stats.open || 0, icon: <ClockIcon className="w-5 h-5" />, color: "text-warning", iconBg: "bg-warning/20" },
        { title: "Critical", value: stats.critical || 0, icon: <ShieldExclamationIcon className="w-5 h-5" />, color: "text-danger", iconBg: "bg-danger/20" },
        { title: "High Severity", value: stats.high_severity || 0, icon: <ExclamationCircleIcon className="w-5 h-5" />, color: "text-warning", iconBg: "bg-warning/20" },
        { title: "Resolved This Month", value: stats.resolved_this_month || 0, icon: <CheckCircleIcon className="w-5 h-5" />, color: "text-success", iconBg: "bg-success/20" },
        { title: "Avg Resolution Days", value: stats.avg_resolution_days || 0, icon: <ClockIcon className="w-5 h-5" />, color: "text-secondary", iconBg: "bg-secondary/20", suffix: "days" },
    ], [stats]);

    const canManage = auth.permissions?.includes('hrm.grievances.manage') || auth.permissions?.includes('hrm.*') || auth.role === 'admin';

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.grievances.paginate'), {
                params: { page: pagination.currentPage, perPage: pagination.perPage, ...filters }
            });
            if (response.status === 200) {
                setGrievances(response.data.grievances || []);
                setPagination(prev => ({ ...prev, ...response.data.pagination }));
            }
        } catch (error) {
            showToast.error('Failed to fetch grievances');
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    const fetchStats = useCallback(async () => {
        try {
            const response = await axios.get(route('hrm.grievances.stats'));
            if (response.status === 200) setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { fetchStats(); }, []);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handleSubmit = async () => {
        setFormLoading(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('hrm.grievances.store'), formData);
                if (response.status === 200) {
                    resolve([response.data.message || 'Grievance submitted']);
                    setModalOpen(false);
                    fetchData();
                    fetchStats();
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['An error occurred']);
            } finally {
                setFormLoading(false);
            }
        });
        showToast.promise(promise, { loading: 'Submitting grievance...', success: (d) => d.join(', '), error: (d) => Array.isArray(d) ? d.join(', ') : d });
    };

    const severityColorMap = { low: 'default', medium: 'warning', high: 'danger', critical: 'danger' };
    const statusColorMap = { submitted: 'default', under_review: 'primary', investigating: 'warning', resolved: 'success', closed: 'secondary', escalated: 'danger' };

    const columns = [
        { uid: 'grievance_number', name: 'Case #' },
        { uid: 'subject', name: 'Subject' },
        { uid: 'employee', name: 'Filed By' },
        { uid: 'type', name: 'Type' },
        { uid: 'severity', name: 'Severity' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case 'grievance_number':
                return <span className="font-mono text-sm">{item.grievance_number}</span>;
            case 'subject':
                return (
                    <div>
                        <p className="font-medium">{item.subject}</p>
                        <p className="text-xs text-default-500">{new Date(item.created_at).toLocaleDateString()}</p>
                    </div>
                );
            case 'employee':
                return item.is_anonymous ? (
                    <span className="text-default-500 italic">Anonymous</span>
                ) : (
                    <div className="flex items-center gap-2">
                        <UserCircleIcon className="w-6 h-6 text-default-400" />
                        <span>{item.employee?.first_name} {item.employee?.last_name}</span>
                    </div>
                );
            case 'type':
                return <span className="capitalize text-sm">{item.grievance_type?.replace('_', ' ')}</span>;
            case 'severity':
                return <Chip size="sm" color={severityColorMap[item.severity]} variant="flat">{item.severity}</Chip>;
            case 'status':
                return <Chip size="sm" color={statusColorMap[item.status]} variant="flat">{item.status?.replace('_', ' ')}</Chip>;
            case 'actions':
                return (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light"><EllipsisVerticalIcon className="w-5 h-5" /></Button>
                        </DropdownTrigger>
                        <DropdownMenu>
                            <DropdownItem key="view" startContent={<EyeIcon className="w-4 h-4" />}
                                onPress={() => window.location.href = route('hrm.grievances.show', item.id)}>
                                View Details
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return item[columnKey];
        }
    };

    return (
        <>
            <Head title={title} />

            <Modal isOpen={modalOpen} onOpenChange={setModalOpen} size="2xl" scrollBehavior="inside">
                <ModalContent>
                    <ModalHeader>Submit Grievance</ModalHeader>
                    <ModalBody>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Subject" placeholder="Brief description" value={formData.subject}
                                onValueChange={(v) => setFormData(prev => ({ ...prev, subject: v }))} isRequired className="md:col-span-2" />
                            <Select label="Type" selectedKeys={[formData.grievance_type]}
                                onSelectionChange={(keys) => setFormData(prev => ({ ...prev, grievance_type: Array.from(keys)[0] || 'other' }))}>
                                <SelectItem key="harassment">Harassment</SelectItem>
                                <SelectItem key="discrimination">Discrimination</SelectItem>
                                <SelectItem key="workplace_safety">Workplace Safety</SelectItem>
                                <SelectItem key="compensation">Compensation</SelectItem>
                                <SelectItem key="management">Management</SelectItem>
                                <SelectItem key="policy">Policy</SelectItem>
                                <SelectItem key="workload">Workload</SelectItem>
                                <SelectItem key="interpersonal">Interpersonal</SelectItem>
                                <SelectItem key="other">Other</SelectItem>
                            </Select>
                            <Select label="Severity" selectedKeys={[formData.severity]}
                                onSelectionChange={(keys) => setFormData(prev => ({ ...prev, severity: Array.from(keys)[0] || 'medium' }))}>
                                <SelectItem key="low">Low</SelectItem>
                                <SelectItem key="medium">Medium</SelectItem>
                                <SelectItem key="high">High</SelectItem>
                                <SelectItem key="critical">Critical</SelectItem>
                            </Select>
                            <Input type="date" label="Incident Date" value={formData.incident_date}
                                onChange={(e) => setFormData(prev => ({ ...prev, incident_date: e.target.value }))} />
                            <Input label="Incident Location" placeholder="Where did this occur?" value={formData.incident_location}
                                onValueChange={(v) => setFormData(prev => ({ ...prev, incident_location: v }))} />
                            <Textarea label="Description" placeholder="Provide full details of the grievance" value={formData.description}
                                onValueChange={(v) => setFormData(prev => ({ ...prev, description: v }))} isRequired className="md:col-span-2" />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => setModalOpen(false)}>Cancel</Button>
                        <Button color="primary" onPress={handleSubmit} isLoading={formLoading}>Submit</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <div className="flex flex-col w-full h-full p-4">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
                    <Card className="transition-all duration-200" style={{
                        border: `var(--borderWidth, 2px) solid transparent`,
                        borderRadius: `var(--borderRadius, 12px)`,
                        background: `linear-gradient(135deg, var(--theme-content1, #FAFAFA) 20%, var(--theme-content2, #F4F4F5) 10%, var(--theme-content3, #F1F3F4) 20%)`,
                    }}>
                        <CardHeader className="border-b p-0" style={{ borderColor: `var(--theme-divider, #E4E4E7)` }}>
                            <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-xl" style={{ background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)` }}>
                                            <ExclamationCircleIcon className="w-8 h-8" style={{ color: 'var(--theme-primary)' }} />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-bold">Employee Grievances</h4>
                                            <p className="text-sm text-default-500">Manage complaints and resolutions</p>
                                        </div>
                                    </div>
                                    <Button color="primary" variant="shadow" startContent={<PlusIcon className="w-4 h-4" />} onPress={() => setModalOpen(true)}>
                                        File Grievance
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        <CardBody className="p-6">
                            <StatsCards stats={statsData} className="mb-6" />

                            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                <Input placeholder="Search cases..." value={filters.search} onValueChange={(v) => handleFilterChange('search', v)}
                                    startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />} className="sm:max-w-xs" />
                                <Select placeholder="All Statuses" selectedKeys={filters.status ? [filters.status] : []}
                                    onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || '')} className="sm:max-w-xs">
                                    <SelectItem key="submitted">Submitted</SelectItem>
                                    <SelectItem key="under_review">Under Review</SelectItem>
                                    <SelectItem key="investigating">Investigating</SelectItem>
                                    <SelectItem key="resolved">Resolved</SelectItem>
                                    <SelectItem key="closed">Closed</SelectItem>
                                </Select>
                                <Select placeholder="All Severities" selectedKeys={filters.severity ? [filters.severity] : []}
                                    onSelectionChange={(keys) => handleFilterChange('severity', Array.from(keys)[0] || '')} className="sm:max-w-xs">
                                    <SelectItem key="low">Low</SelectItem>
                                    <SelectItem key="medium">Medium</SelectItem>
                                    <SelectItem key="high">High</SelectItem>
                                    <SelectItem key="critical">Critical</SelectItem>
                                </Select>
                            </div>

                            {loading ? (
                                <div className="space-y-3">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="flex gap-4">
                                            <Skeleton className="h-12 w-12 rounded-lg" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-4 w-3/4 rounded" />
                                                <Skeleton className="h-3 w-1/2 rounded" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <Table aria-label="Grievances" classNames={{ wrapper: "shadow-none border border-divider rounded-lg", th: "bg-default-100", td: "py-3" }}>
                                    <TableHeader columns={columns}>
                                        {(column) => <TableColumn key={column.uid} align={column.uid === 'actions' ? 'center' : 'start'}>{column.name}</TableColumn>}
                                    </TableHeader>
                                    <TableBody items={grievances} emptyContent="No grievances found">
                                        {(item) => <TableRow key={item.id}>{(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}</TableRow>}
                                    </TableBody>
                                </Table>
                            )}

                            {pagination.lastPage > 1 && (
                                <div className="flex justify-center mt-6">
                                    <Pagination total={pagination.lastPage} page={pagination.currentPage}
                                        onChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))} showControls />
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </motion.div>
            </div>
        </>
    );
};

GrievancesIndex.layout = (page) => <App children={page} />;
export default GrievancesIndex;
