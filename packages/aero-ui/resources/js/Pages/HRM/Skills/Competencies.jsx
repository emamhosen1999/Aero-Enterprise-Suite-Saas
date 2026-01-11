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
    Progress,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter
} from "@heroui/react";
import { 
    AcademicCapIcon,
    ChartBarIcon,
    PlusIcon,
    MagnifyingGlassIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const CompetenciesPage = ({ title, competencies: initialCompetencies, departments: initialDepartments }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete, hasAccess } = useHRMAC();
    
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
    const [competencies, setCompetencies] = useState(initialCompetencies || []);
    const [departments, setDepartments] = useState(initialDepartments || []);
    const [filters, setFilters] = useState({ search: '', department: 'all', level: 'all' });
    const [pagination, setPagination] = useState({ perPage: 30, currentPage: 1, total: 0 });
    const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, advanced: 0 });
    const [modalStates, setModalStates] = useState({ add: false, edit: false, delete: false });
    const [selectedCompetency, setSelectedCompetency] = useState(null);

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { 
            title: "Total Competencies", 
            value: stats.total, 
            icon: <AcademicCapIcon className="w-5 h-5" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Active", 
            value: stats.active, 
            icon: <ChartBarIcon className="w-5 h-5" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "Pending Review", 
            value: stats.pending, 
            icon: <AcademicCapIcon className="w-5 h-5" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Advanced Level", 
            value: stats.advanced, 
            icon: <ChartBarIcon className="w-5 h-5" />, 
            color: "text-secondary", 
            iconBg: "bg-secondary/20" 
        }
    ], [stats]);

    // Permission checks
    const canCreateCompetency = canCreate && hasAccess('hrm.competencies.create');
    const canEditCompetency = canUpdate && hasAccess('hrm.competencies.update');

    // Fetch competencies data
    const fetchCompetencies = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.competencies.index'), {
                params: { page: pagination.currentPage, perPage: pagination.perPage, ...filters }
            });
            if (response.status === 200) {
                setCompetencies(response.data.competencies || []);
                setStats(response.data.stats || { total: 0, active: 0, pending: 0, advanced: 0 });
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), { error: 'Failed to fetch competencies data' });
        } finally {
            setLoading(false);
            setStatsLoading(false);
        }
    }, [filters, pagination]);

    useEffect(() => { fetchCompetencies(); }, [fetchCompetencies]);

    // Modal management
    const openModal = useCallback((type, competency = null) => {
        setSelectedCompetency(competency);
        setModalStates(prev => ({ ...prev, [type]: true }));
    }, []);

    const closeModal = useCallback((type) => {
        setModalStates(prev => ({ ...prev, [type]: false }));
        setSelectedCompetency(null);
    }, []);

    // Filter handlers
    const handleFilterChange = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, []);

    // Render competency level
    const renderLevel = useCallback((level) => {
        const colorMap = {
            'beginner': 'default',
            'intermediate': 'primary', 
            'advanced': 'success',
            'expert': 'secondary'
        };
        return <Chip color={colorMap[level] || 'default'} size="sm">{level}</Chip>;
    }, []);

    // Table columns
    const columns = useMemo(() => [
        { uid: 'name', name: 'Competency Name' },
        { uid: 'category', name: 'Category' },
        { uid: 'level', name: 'Level' },
        { uid: 'department', name: 'Department' },
        { uid: 'employees_count', name: 'Employees' },
        { uid: 'actions', name: 'Actions' }
    ], []);

    // Render table cell
    const renderCell = useCallback((competency, columnKey) => {
        switch (columnKey) {
            case 'name':
                return <span className="font-semibold">{competency.name}</span>;
            case 'category':
                return competency.category || '-';
            case 'level':
                return renderLevel(competency.level);
            case 'department':
                return competency.department?.name || 'All Departments';
            case 'employees_count':
                return <Chip variant="flat">{competency.employees_count || 0}</Chip>;
            case 'actions':
                return (
                    <div className="flex gap-2">
                        {canEditCompetency && (
                            <Button 
                                size="sm" 
                                variant="flat" 
                                onPress={() => openModal('edit', competency)}
                            >
                                Edit
                            </Button>
                        )}
                    </div>
                );
            default:
                return competency[columnKey] || '-';
        }
    }, [canEditCompetency, openModal, renderLevel]);

    return (
        <>
            <Head title={title} />
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Competencies Management">
                <div className="space-y-4">
                    <div className="w-full">
                        {/* Animated Card wrapper */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            {/* Main Card with theme styling */}
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
                                {/* Card Header */}
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
                                            {/* Title Section */}
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <AcademicCapIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Competencies Management
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Manage employee competencies and skill requirements
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Action Buttons */}
                                            <div className="flex gap-2 flex-wrap">
                                                {canCreateCompetency && (
                                                    <Button 
                                                        color="primary" 
                                                        variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={() => openModal('add')}
                                                        size={isMobile ? "sm" : "md"}
                                                    >
                                                        Add Competency
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* Stats Cards */}
                                    <StatsCards stats={statsData} isLoading={statsLoading} className="mb-6" />
                                    
                                    {/* Filter Section */}
                                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                        <Input
                                            label="Search"
                                            placeholder="Search competencies..."
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                        />
                                        
                                        <Select
                                            label="Department"
                                            placeholder="All Departments"
                                            selectedKeys={filters.department !== 'all' ? [filters.department] : []}
                                            onSelectionChange={(keys) => handleFilterChange('department', Array.from(keys)[0] || 'all')}
                                            size="sm"
                                            radius={themeRadius}
                                        >
                                            <SelectItem key="all">All Departments</SelectItem>
                                            {departments.map(dept => (
                                                <SelectItem key={dept.id}>{dept.name}</SelectItem>
                                            ))}
                                        </Select>

                                        <Select
                                            label="Level"
                                            placeholder="All Levels"
                                            selectedKeys={filters.level !== 'all' ? [filters.level] : []}
                                            onSelectionChange={(keys) => handleFilterChange('level', Array.from(keys)[0] || 'all')}
                                            size="sm"
                                            radius={themeRadius}
                                        >
                                            <SelectItem key="all">All Levels</SelectItem>
                                            <SelectItem key="beginner">Beginner</SelectItem>
                                            <SelectItem key="intermediate">Intermediate</SelectItem>
                                            <SelectItem key="advanced">Advanced</SelectItem>
                                            <SelectItem key="expert">Expert</SelectItem>
                                        </Select>
                                    </div>
                                    
                                    {/* Data Table */}
                                    <Table
                                        aria-label="Competencies table"
                                        isHeaderSticky
                                        classNames={{
                                            wrapper: "shadow-none border border-divider rounded-lg",
                                            th: "bg-default-100 text-default-600 font-semibold",
                                            td: "py-3"
                                        }}
                                    >
                                        <TableHeader columns={columns}>
                                            {(column) => <TableColumn key={column.uid}>{column.name}</TableColumn>}
                                        </TableHeader>
                                        <TableBody items={competencies} emptyContent="No competencies found">
                                            {(competency) => (
                                                <TableRow key={competency.id}>
                                                    {(columnKey) => <TableCell>{renderCell(competency, columnKey)}</TableCell>}
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

CompetenciesPage.layout = (page) => <App children={page} />;
export default CompetenciesPage;