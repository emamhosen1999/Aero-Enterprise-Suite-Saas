import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Button,
    Chip,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Pagination,
    Select,
    SelectItem,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    Textarea,
} from "@heroui/react";
import {
    BriefcaseIcon,
    CheckCircleIcon,
    ClockIcon,
    DocumentTextIcon,
    EllipsisVerticalIcon,
    EyeIcon,
    PencilIcon,
    PlusIcon,
    ArrowPathIcon,
    TrashIcon,
    UserGroupIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';
import dayjs from 'dayjs';

const RecruitmentIndex = ({ title, jobs: initialJobs, departments: initialDepartments }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete, isSuperAdmin } = useHRMAC();

    // Data state
    const [loading, setLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(true);
    const [jobs, setJobs] = useState(initialJobs?.data || initialJobs || []);
    const [departments, setDepartments] = useState(initialDepartments || []);
    const [stats, setStats] = useState({ total: 0, open: 0, closed: 0, applications: 0 });
    
    // Filter state
    const [filters, setFilters] = useState({ search: '', status: [], department_id: '' });
    const [pagination, setPagination] = useState({ 
        perPage: 30, 
        currentPage: 1, 
        total: initialJobs?.total || 0, 
        lastPage: initialJobs?.last_page || 1 
    });
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingJob, setEditingJob] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        department_id: '',
        description: '',
        requirements: '',
        location: '',
        employment_type: 'full_time',
        salary_min: '',
        salary_max: '',
        positions: 1,
        deadline: '',
    });

    // Permissions using HRMAC with proper path
    const canCreateJob = canCreate('hrm.recruitment') || isSuperAdmin();
    const canEditJob = canUpdate('hrm.recruitment') || isSuperAdmin();
    const canDeleteJob = canDelete('hrm.recruitment') || isSuperAdmin();

    const statsData = useMemo(() => [
        { title: "Total Jobs", value: stats.total, icon: <BriefcaseIcon className="w-6 h-6" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "Open Positions", value: stats.open, icon: <CheckCircleIcon className="w-6 h-6" />, color: "text-success", iconBg: "bg-success/20" },
        { title: "Closed", value: stats.closed, icon: <XCircleIcon className="w-6 h-6" />, color: "text-danger", iconBg: "bg-danger/20" },
        { title: "Applications", value: stats.applications, icon: <UserGroupIcon className="w-6 h-6" />, color: "text-warning", iconBg: "bg-warning/20" },
    ], [stats]);

    const columns = [
        { uid: 'title', name: 'Job Title' },
        { uid: 'department', name: 'Department' },
        { uid: 'employment_type', name: 'Type' },
        { uid: 'positions', name: 'Positions' },
        { uid: 'applications_count', name: 'Applications' },
        { uid: 'status', name: 'Status' },
        { uid: 'deadline', name: 'Deadline' },
        { uid: 'actions', name: 'Actions' },
    ];

    // Fetch jobs
    const fetchJobs = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.recruitment.data.index'), {
                params: { 
                    page: pagination.currentPage, 
                    per_page: pagination.perPage, 
                    search: filters.search,
                    status: filters.status.length > 0 ? filters.status.join(',') : undefined,
                    department_id: filters.department_id || undefined,
                },
            });
            if (response.status === 200) {
                const data = response.data.jobs || response.data;
                setJobs(data.data || data || []);
                setPagination(prev => ({
                    ...prev,
                    total: data.total || 0,
                    lastPage: data.last_page || 1
                }));
            }
        } catch (error) {
            console.error('Failed to fetch jobs:', error);
            showToast.error('Failed to fetch job listings');
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    // Fetch stats
    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('hrm.recruitment.statistics'));
            if (response.status === 200) setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchJobs();
        fetchStats();
    }, [fetchJobs, fetchStats]);

    // Modal handlers
    const openCreateModal = () => {
        setEditingJob(null);
        setFormData({
            title: '',
            department_id: '',
            description: '',
            requirements: '',
            location: '',
            employment_type: 'full_time',
            salary_min: '',
            salary_max: '',
            positions: 1,
            deadline: '',
        });
        setIsModalOpen(true);
    };

    const openEditModal = (job) => {
        setEditingJob(job);
        setFormData({
            title: job.title || '',
            department_id: job.department_id ? String(job.department_id) : '',
            description: job.description || '',
            requirements: job.requirements || '',
            location: job.location || '',
            employment_type: job.employment_type || 'full_time',
            salary_min: job.salary_min || '',
            salary_max: job.salary_max || '',
            positions: job.positions || 1,
            deadline: job.deadline ? dayjs(job.deadline).format('YYYY-MM-DD') : '',
        });
        setIsModalOpen(true);
    };

    const handleSubmit = () => {
        const routeName = editingJob ? 'hrm.recruitment.update.ajax' : 'hrm.recruitment.store.ajax';
        const url = editingJob 
            ? route(routeName, editingJob.id) 
            : route(routeName);

        const promise = new Promise(async (resolve, reject) => {
            try {
                const method = editingJob ? 'put' : 'post';
                await axios[method](url, formData);
                setIsModalOpen(false);
                fetchJobs();
                fetchStats();
                resolve([`Job ${editingJob ? 'updated' : 'created'} successfully`]);
            } catch (error) {
                reject([error.response?.data?.message || `Failed to ${editingJob ? 'update' : 'create'} job`]);
            }
        });

        showToast.promise(promise, {
            loading: `${editingJob ? 'Updating' : 'Creating'} job...`,
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    const handleDelete = (job) => {
        if (!confirm('Are you sure you want to delete this job posting?')) return;

        const promise = new Promise(async (resolve, reject) => {
            try {
                await axios.delete(route('hrm.recruitment.destroy', job.id));
                fetchJobs();
                fetchStats();
                resolve(['Job deleted successfully']);
            } catch (error) {
                reject([error.response?.data?.message || 'Failed to delete job']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting job...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    const handlePublish = async (job) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                await axios.post(route('hrm.recruitment.publish', job.id));
                fetchJobs();
                fetchStats();
                resolve(['Job published successfully']);
            } catch (error) {
                reject([error.response?.data?.message || 'Failed to publish job']);
            }
        });

        showToast.promise(promise, {
            loading: 'Publishing job...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    const handleClose = async (job) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                await axios.post(route('hrm.recruitment.close', job.id));
                fetchJobs();
                fetchStats();
                resolve(['Job closed successfully']);
            } catch (error) {
                reject([error.response?.data?.message || 'Failed to close job']);
            }
        });

        showToast.promise(promise, {
            loading: 'Closing job...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    // Pagination handler
    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
    };

    // Filter handler
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const getStatusChip = (status) => {
        const statusConfig = {
            draft: { color: 'default', label: 'Draft' },
            open: { color: 'success', label: 'Open' },
            published: { color: 'success', label: 'Published' },
            closed: { color: 'danger', label: 'Closed' },
            paused: { color: 'warning', label: 'Paused' },
        };
        const config = statusConfig[status] || statusConfig.draft;
        return <Chip size="sm" color={config.color} variant="flat">{config.label}</Chip>;
    };

    const getEmploymentTypeLabel = (type) => {
        const types = {
            full_time: 'Full Time',
            part_time: 'Part Time',
            contract: 'Contract',
            internship: 'Internship',
            freelance: 'Freelance',
        };
        return types[type] || type;
    };

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case 'title':
                return (
                    <div>
                        <p className="font-medium text-sm">{item.title}</p>
                        {item.location && <p className="text-xs text-default-400">{item.location}</p>}
                    </div>
                );
            case 'department':
                return <span className="text-sm">{item.department?.name || '-'}</span>;
            case 'employment_type':
                return <Chip size="sm" variant="flat">{getEmploymentTypeLabel(item.employment_type)}</Chip>;
            case 'positions':
                return <span className="text-sm">{item.positions || 1}</span>;
            case 'applications_count':
                return (
                    <Chip size="sm" variant="flat" color="primary">
                        {item.applications_count || 0}
                    </Chip>
                );
            case 'status':
                return getStatusChip(item.status);
            case 'deadline':
                return item.deadline ? (
                    <span className="text-sm">{dayjs(item.deadline).format('MMM D, YYYY')}</span>
                ) : '-';
            case 'actions':
                return (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                                <EllipsisVerticalIcon className="w-5 h-5" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Job actions">
                            <DropdownItem 
                                key="view" 
                                startContent={<EyeIcon className="w-4 h-4" />}
                                onPress={() => router.visit(route('hrm.recruitment.show', item.id))}
                            >
                                View Details
                            </DropdownItem>
                            <DropdownItem 
                                key="applications" 
                                startContent={<UserGroupIcon className="w-4 h-4" />}
                                onPress={() => router.visit(route('hrm.recruitment.applications.index', item.id))}
                            >
                                Applications ({item.applications_count || 0})
                            </DropdownItem>
                            {canEditJob && item.status === 'draft' && (
                                <DropdownItem 
                                    key="publish" 
                                    startContent={<CheckCircleIcon className="w-4 h-4" />}
                                    onPress={() => handlePublish(item)}
                                    color="success"
                                >
                                    Publish
                                </DropdownItem>
                            )}
                            {canEditJob && (item.status === 'open' || item.status === 'published') && (
                                <DropdownItem 
                                    key="close" 
                                    startContent={<XCircleIcon className="w-4 h-4" />}
                                    onPress={() => handleClose(item)}
                                    color="warning"
                                >
                                    Close
                                </DropdownItem>
                            )}
                            {canEditJob && (
                                <DropdownItem 
                                    key="edit" 
                                    startContent={<PencilIcon className="w-4 h-4" />}
                                    onPress={() => openEditModal(item)}
                                >
                                    Edit
                                </DropdownItem>
                            )}
                            {canDeleteJob && (
                                <DropdownItem 
                                    key="delete" 
                                    className="text-danger" 
                                    color="danger"
                                    startContent={<TrashIcon className="w-4 h-4" />}
                                    onPress={() => handleDelete(item)}
                                >
                                    Delete
                                </DropdownItem>
                            )}
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return item[columnKey];
        }
    };

    const headerActions = (
        <div className="flex gap-2">
            <Button 
                isIconOnly 
                variant="flat" 
                onPress={() => { fetchJobs(); fetchStats(); }}
            >
                <ArrowPathIcon className="w-4 h-4" />
            </Button>
            {canCreateJob && (
                <Button 
                    color="primary" 
                    variant="shadow" 
                    startContent={<PlusIcon className="w-4 h-4" />}
                    onPress={openCreateModal}
                >
                    New Job
                </Button>
            )}
        </div>
    );

    const filtersSection = (
        <div className="flex flex-col sm:flex-row gap-4">
            <Input 
                label="Search" 
                placeholder="Search jobs..." 
                value={filters.search} 
                onChange={(e) => handleFilterChange('search', e.target.value)}
                startContent={<MagnifyingGlassIcon className="w-4 h-4" />} 
                variant="bordered" 
                size="sm" 
                radius={themeRadius}
                className="flex-1"
                isClearable
                onClear={() => handleFilterChange('search', '')}
            />
            <Select 
                label="Status" 
                placeholder="All Statuses" 
                variant="bordered" 
                size="sm" 
                radius={themeRadius} 
                selectionMode="multiple"
                selectedKeys={new Set(filters.status)}
                onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys))}
                className="w-full sm:w-40"
            >
                <SelectItem key="draft">Draft</SelectItem>
                <SelectItem key="open">Open</SelectItem>
                <SelectItem key="published">Published</SelectItem>
                <SelectItem key="closed">Closed</SelectItem>
            </Select>
            {departments.length > 0 && (
                <Select 
                    label="Department" 
                    placeholder="All Departments" 
                    variant="bordered" 
                    size="sm" 
                    radius={themeRadius}
                    selectedKeys={filters.department_id ? [filters.department_id] : []}
                    onSelectionChange={(keys) => handleFilterChange('department_id', Array.from(keys)[0] || '')}
                    className="w-full sm:w-48"
                >
                    {departments.map(dept => (
                        <SelectItem key={String(dept.id)}>{dept.name}</SelectItem>
                    ))}
                </Select>
            )}
        </div>
    );

    const tableContent = (
        <Table
            aria-label="Jobs table"
            isHeaderSticky
            classNames={{
                wrapper: "shadow-none border border-divider rounded-lg",
                th: "bg-default-100 text-default-600 font-semibold",
                td: "py-3"
            }}
        >
            <TableHeader columns={columns}>
                {(column) => (
                    <TableColumn key={column.uid} align={column.uid === 'actions' ? 'center' : 'start'}>
                        {column.name}
                    </TableColumn>
                )}
            </TableHeader>
            <TableBody items={jobs} emptyContent="No job postings found." isLoading={loading}>
                {(item) => (
                    <TableRow key={item.id}>
                        {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );

    return (
        <>
            <Head title={title || "Recruitment"} />
            
            {/* Create/Edit Modal */}
            <Modal isOpen={isModalOpen} onOpenChange={setIsModalOpen} size="2xl" scrollBehavior="inside">
                <ModalContent>
                    <ModalHeader>
                        {editingJob ? 'Edit Job Posting' : 'Create Job Posting'}
                    </ModalHeader>
                    <ModalBody>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Job Title"
                                placeholder="Enter job title"
                                value={formData.title}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, title: value }))}
                                isRequired
                                radius={themeRadius}
                                className="md:col-span-2"
                            />
                            <Select
                                label="Department"
                                placeholder="Select department"
                                selectedKeys={formData.department_id ? [formData.department_id] : []}
                                onSelectionChange={(keys) => setFormData(prev => ({ ...prev, department_id: Array.from(keys)[0] }))}
                                radius={themeRadius}
                            >
                                {departments.map(dept => (
                                    <SelectItem key={String(dept.id)}>{dept.name}</SelectItem>
                                ))}
                            </Select>
                            <Select
                                label="Employment Type"
                                placeholder="Select type"
                                selectedKeys={[formData.employment_type]}
                                onSelectionChange={(keys) => setFormData(prev => ({ ...prev, employment_type: Array.from(keys)[0] }))}
                                radius={themeRadius}
                            >
                                <SelectItem key="full_time">Full Time</SelectItem>
                                <SelectItem key="part_time">Part Time</SelectItem>
                                <SelectItem key="contract">Contract</SelectItem>
                                <SelectItem key="internship">Internship</SelectItem>
                                <SelectItem key="freelance">Freelance</SelectItem>
                            </Select>
                            <Input
                                label="Location"
                                placeholder="Enter location"
                                value={formData.location}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
                                radius={themeRadius}
                            />
                            <Input
                                type="number"
                                label="Positions"
                                placeholder="Number of positions"
                                value={String(formData.positions)}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, positions: parseInt(value) || 1 }))}
                                radius={themeRadius}
                                min={1}
                            />
                            <Input
                                type="number"
                                label="Salary Min"
                                placeholder="Minimum salary"
                                value={formData.salary_min}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, salary_min: value }))}
                                radius={themeRadius}
                            />
                            <Input
                                type="number"
                                label="Salary Max"
                                placeholder="Maximum salary"
                                value={formData.salary_max}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, salary_max: value }))}
                                radius={themeRadius}
                            />
                            <Input
                                type="date"
                                label="Application Deadline"
                                value={formData.deadline}
                                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                                radius={themeRadius}
                            />
                            <Textarea
                                label="Description"
                                placeholder="Job description..."
                                value={formData.description}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                                radius={themeRadius}
                                minRows={3}
                                className="md:col-span-2"
                            />
                            <Textarea
                                label="Requirements"
                                placeholder="Job requirements..."
                                value={formData.requirements}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, requirements: value }))}
                                radius={themeRadius}
                                minRows={3}
                                className="md:col-span-2"
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button color="primary" onPress={handleSubmit}>
                            {editingJob ? 'Update' : 'Create'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <StandardPageLayout
                title="Recruitment"
                subtitle="Manage job postings and applications"
                icon={<BriefcaseIcon />}
                isLoading={loading && statsLoading}
                ariaLabel="Recruitment Management"
                actions={headerActions}
                stats={<StatsCards stats={statsData} isLoading={statsLoading} />}
                filters={filtersSection}
                pagination={
                    pagination.lastPage > 1 && (
                        <div className="flex justify-center">
                            <Pagination
                                total={pagination.lastPage}
                                page={pagination.currentPage}
                                onChange={handlePageChange}
                                showControls
                                radius={themeRadius}
                            />
                        </div>
                    )
                }
            >
                {tableContent}
            </StandardPageLayout>
        </>
    );
};

RecruitmentIndex.layout = (page) => <App children={page} />;
export default RecruitmentIndex;
