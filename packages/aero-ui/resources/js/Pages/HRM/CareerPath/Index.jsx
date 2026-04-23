import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Head, usePage} from '@inertiajs/react';
import {
    Button, 
    Chip, 
    Input, 
    Select, 
    SelectItem,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Pagination,
    Skeleton,
    Progress
} from "@heroui/react";
import {
    AcademicCapIcon,
    ArrowTrendingUpIcon,
    BriefcaseIcon,
    ChartBarIcon,
    CheckCircleIcon,
    ClockIcon,
    EllipsisVerticalIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    PlusIcon,
    TrashIcon,
    UserGroupIcon,
    StarIcon,
    FlagIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import {showToast} from '@/utils/ui/toastUtils';
import axios from 'axios';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import { useHRMAC } from '@/Hooks/access/useHRMAC';

const CareerPathIndex = ({title}) => {
    const {auth} = usePage().props;
    const themeRadius = useThemeRadius();
    const { canCreate: hrmCanCreate, canUpdate: hrmCanUpdate, canDelete: hrmCanDelete, isSuperAdmin, hasAccess } = useHRMAC();
    
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
    const [careerPaths, setCareerPaths] = useState([]);
    const [stats, setStats] = useState({
        total_paths: 0,
        total_milestones: 0,
        employees_on_path: 0,
        completed_progressions: 0
    });
    const [pagination, setPagination] = useState({perPage: 15, currentPage: 1, total: 0, lastPage: 1});
    const [filters, setFilters] = useState({search: '', department_id: ''});
    const [departments, setDepartments] = useState([]);
    
    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedPath, setSelectedPath] = useState(null);
    
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        department_id: '',
        path_type: 'technical',
        typical_duration_months: '',
        required_competencies: []
    });

    // Permission checks using HRMAC
    const canCreate = hrmCanCreate('hrm.career-paths') || isSuperAdmin();
    const canEdit = hrmCanUpdate('hrm.career-paths') || isSuperAdmin();
    const canDelete = hrmCanDelete('hrm.career-paths') || isSuperAdmin();

    // Stats data for StatsCards
    const statsData = useMemo(() => [
        {
            title: "Career Paths",
            value: stats.total_paths,
            icon: <ArrowTrendingUpIcon className="w-6 h-6" />,
            color: "text-primary",
            iconBg: "bg-primary/20",
            description: "Active career paths"
        },
        {
            title: "Milestones",
            value: stats.total_milestones,
            icon: <FlagIcon className="w-6 h-6" />,
            color: "text-success",
            iconBg: "bg-success/20",
            description: "Total milestones defined"
        },
        {
            title: "Employees on Path",
            value: stats.employees_on_path,
            icon: <UserGroupIcon className="w-6 h-6" />,
            color: "text-warning",
            iconBg: "bg-warning/20",
            description: "Currently progressing"
        },
        {
            title: "Completed",
            value: stats.completed_progressions,
            icon: <CheckCircleIcon className="w-6 h-6" />,
            color: "text-secondary",
            iconBg: "bg-secondary/20",
            description: "Paths completed"
        }
    ], [stats]);

    // Fetch data
    const fetchCareerPaths = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.career-paths.paginate'), {
                params: {
                    page: pagination.currentPage,
                    perPage: pagination.perPage,
                    ...filters
                }
            });
            if (response.status === 200) {
                const data = response.data.items;
                setCareerPaths(data.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: data.total || 0,
                    lastPage: data.last_page || 1
                }));
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to fetch career paths'
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    const fetchStats = useCallback(async () => {
        try {
            const response = await axios.get(route('hrm.career-paths.stats'));
            if (response.status === 200) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    }, []);

    const fetchDepartments = useCallback(async () => {
        try {
            const response = await axios.get(route('hrm.departments.list'));
            if (response.status === 200) {
                setDepartments(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch departments:', error);
        }
    }, []);

    useEffect(() => {
        fetchCareerPaths();
    }, [fetchCareerPaths]);

    useEffect(() => {
        fetchStats();
        fetchDepartments();
    }, [fetchStats, fetchDepartments]);

    // Handlers
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({...prev, [key]: value}));
        setPagination(prev => ({...prev, currentPage: 1}));
    };

    const handleSubmit = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const endpoint = selectedPath
                    ? route('hrm.career-paths.update', selectedPath.id)
                    : route('hrm.career-paths.store');
                const method = selectedPath ? 'put' : 'post';
                
                const response = await axios[method](endpoint, formData);
                if (response.status === 200) {
                    resolve([response.data.message || 'Career path saved successfully']);
                    setShowAddModal(false);
                    setShowEditModal(false);
                    fetchCareerPaths();
                    fetchStats();
                    resetForm();
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to save career path']);
            }
        });

        showToast.promise(promise, {
            loading: selectedPath ? 'Updating career path...' : 'Creating career path...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? Object.values(data).flat().join(', ') : data
        });
    };

    const handleDelete = async (path) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('hrm.career-paths.destroy', path.id));
                if (response.status === 200) {
                    resolve(['Career path deleted successfully']);
                    fetchCareerPaths();
                    fetchStats();
                }
            } catch (error) {
                reject(['Failed to delete career path']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting career path...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', ')
        });
    };

    const openEditModal = (path) => {
        setSelectedPath(path);
        setFormData({
            name: path.name,
            description: path.description || '',
            department_id: path.department_id || '',
            path_type: path.path_type,
            typical_duration_months: path.typical_duration_months || '',
            required_competencies: path.required_competencies || []
        });
        setShowEditModal(true);
    };

    const resetForm = () => {
        setSelectedPath(null);
        setFormData({
            name: '',
            description: '',
            department_id: '',
            path_type: 'technical',
            typical_duration_months: '',
            required_competencies: []
        });
    };

    const pathTypeColorMap = {
        technical: 'primary',
        management: 'success',
        specialist: 'warning',
        hybrid: 'secondary'
    };

    const columns = [
        {uid: 'name', name: 'Career Path'},
        {uid: 'department', name: 'Department'},
        {uid: 'path_type', name: 'Type'},
        {uid: 'milestones', name: 'Milestones'},
        {uid: 'employees', name: 'Employees'},
        {uid: 'duration', name: 'Duration'},
        {uid: 'actions', name: 'Actions'}
    ];

    const renderCell = (path, columnKey) => {
        switch (columnKey) {
            case 'name':
                return (
                    <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{path.name}</span>
                        {path.description && (
                            <span className="text-xs text-default-500 line-clamp-1">{path.description}</span>
                        )}
                    </div>
                );
            case 'department':
                return path.department?.name || <span className="text-default-400">All Departments</span>;
            case 'path_type':
                return (
                    <Chip color={pathTypeColorMap[path.path_type]} variant="flat" size="sm">
                        {path.path_type?.charAt(0).toUpperCase() + path.path_type?.slice(1)}
                    </Chip>
                );
            case 'milestones':
                return (
                    <Chip variant="bordered" size="sm">
                        {path.milestones_count || 0} steps
                    </Chip>
                );
            case 'employees':
                return (
                    <div className="flex items-center gap-1">
                        <UserGroupIcon className="w-4 h-4 text-default-400" />
                        <span>{path.employee_progressions_count || 0}</span>
                    </div>
                );
            case 'duration':
                return path.typical_duration_months 
                    ? `${path.typical_duration_months} months` 
                    : <span className="text-default-400">-</span>;
            case 'actions':
                return (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                                <EllipsisVerticalIcon className="w-5 h-5" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Actions">
                            <DropdownItem 
                                key="view" 
                                startContent={<AcademicCapIcon className="w-4 h-4" />}
                                onPress={() => {
                                    setSelectedPath(path);
                                    setShowViewModal(true);
                                }}
                            >
                                View Details
                            </DropdownItem>
                            {canEdit && (
                                <DropdownItem 
                                    key="edit" 
                                    startContent={<PencilIcon className="w-4 h-4" />}
                                    onPress={() => openEditModal(path)}
                                >
                                    Edit
                                </DropdownItem>
                            )}
                            {canDelete && (
                                <DropdownItem 
                                    key="delete" 
                                    className="text-danger" 
                                    color="danger" 
                                    startContent={<TrashIcon className="w-4 h-4" />}
                                    onPress={() => handleDelete(path)}
                                >
                                    Delete
                                </DropdownItem>
                            )}
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <Head title={title || "Career Pathing"} />
            
            {/* Add/Edit Modal */}
            <Modal 
                isOpen={showAddModal || showEditModal} 
                onOpenChange={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                }}
                size="2xl"
                scrollBehavior="inside"
            >
                <ModalContent>
                    <ModalHeader className="border-b border-divider">
                        <h2 className="text-lg font-semibold">
                            {selectedPath ? 'Edit Career Path' : 'Create Career Path'}
                        </h2>
                    </ModalHeader>
                    <ModalBody className="py-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Path Name"
                                placeholder="e.g., Software Engineer Track"
                                value={formData.name}
                                onValueChange={(v) => setFormData(p => ({...p, name: v}))}
                                isRequired
                                radius={themeRadius}
                            />
                            <Select
                                label="Path Type"
                                selectedKeys={formData.path_type ? [formData.path_type] : []}
                                onSelectionChange={(keys) => setFormData(p => ({...p, path_type: Array.from(keys)[0]}))}
                                isRequired
                                radius={themeRadius}
                            >
                                <SelectItem key="technical">Technical</SelectItem>
                                <SelectItem key="management">Management</SelectItem>
                                <SelectItem key="specialist">Specialist</SelectItem>
                                <SelectItem key="hybrid">Hybrid</SelectItem>
                            </Select>
                            <Select
                                label="Department"
                                placeholder="All Departments"
                                selectedKeys={formData.department_id ? [String(formData.department_id)] : []}
                                onSelectionChange={(keys) => setFormData(p => ({...p, department_id: Array.from(keys)[0] || ''}))}
                                radius={themeRadius}
                            >
                                {departments.map(dept => (
                                    <SelectItem key={String(dept.id)}>{dept.name}</SelectItem>
                                ))}
                            </Select>
                            <Input
                                label="Typical Duration (months)"
                                placeholder="e.g., 24"
                                type="number"
                                value={formData.typical_duration_months}
                                onValueChange={(v) => setFormData(p => ({...p, typical_duration_months: v}))}
                                radius={themeRadius}
                            />
                            <div className="md:col-span-2">
                                <Input
                                    label="Description"
                                    placeholder="Describe the career path..."
                                    value={formData.description}
                                    onValueChange={(v) => setFormData(p => ({...p, description: v}))}
                                    radius={themeRadius}
                                />
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter className="border-t border-divider">
                        <Button variant="flat" onPress={() => {
                            setShowAddModal(false);
                            setShowEditModal(false);
                            resetForm();
                        }}>
                            Cancel
                        </Button>
                        <Button color="primary" onPress={handleSubmit}>
                            {selectedPath ? 'Update' : 'Create'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <StandardPageLayout
                title="Career Pathing"
                subtitle="Define and manage employee career progression tracks"
                icon={<ArrowTrendingUpIcon className="w-8 h-8" />}
                actions={
                    canCreate && (
                        <Button 
                            color="primary" 
                            variant="shadow"
                            startContent={<PlusIcon className="w-4 h-4" />}
                            onPress={() => setShowAddModal(true)}
                        >
                            Add Career Path
                        </Button>
                    )
                }
                stats={<StatsCards stats={statsData} isLoading={loading} />}
                filters={
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Input
                            placeholder="Search career paths..."
                            value={filters.search}
                            onValueChange={(v) => handleFilterChange('search', v)}
                            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                            radius={themeRadius}
                            className="sm:max-w-xs"
                        />
                        <Select
                            placeholder="All Departments"
                            selectedKeys={filters.department_id ? [String(filters.department_id)] : []}
                            onSelectionChange={(keys) => handleFilterChange('department_id', Array.from(keys)[0] || '')}
                            radius={themeRadius}
                            className="sm:max-w-xs"
                        >
                            {departments.map(dept => (
                                <SelectItem key={String(dept.id)}>{dept.name}</SelectItem>
                            ))}
                        </Select>
                    </div>
                }
                ariaLabel="Career Path Management"
            >
                {/* Table */}
                {loading ? (
                    <div className="space-y-3">
                        {Array.from({length: 5}).map((_, i) => (
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
                    <>
                        <Table
                            aria-label="Career paths table"
                            isHeaderSticky
                            classNames={{
                                wrapper: "shadow-none border border-divider rounded-lg",
                                th: "bg-default-100 text-default-600 font-semibold",
                                td: "py-3"
                            }}
                        >
                            <TableHeader columns={columns}>
                                {(column) => (
                                    <TableColumn key={column.uid}>
                                        {column.name}
                                    </TableColumn>
                                )}
                            </TableHeader>
                            <TableBody 
                                items={careerPaths} 
                                emptyContent="No career paths found"
                            >
                                {(item) => (
                                    <TableRow key={item.id}>
                                        {(columnKey) => (
                                            <TableCell>{renderCell(item, columnKey)}</TableCell>
                                        )}
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        
                        {/* Pagination */}
                        {pagination.lastPage > 1 && (
                            <div className="flex justify-center mt-4">
                                <Pagination
                                    total={pagination.lastPage}
                                    page={pagination.currentPage}
                                    onChange={(page) => setPagination(p => ({...p, currentPage: page}))}
                                    showControls
                                />
                            </div>
                        )}
                    </>
                )}
            </StandardPageLayout>
        </>
    );
};

CareerPathIndex.layout = (page) => <App children={page} />;
export default CareerPathIndex;
