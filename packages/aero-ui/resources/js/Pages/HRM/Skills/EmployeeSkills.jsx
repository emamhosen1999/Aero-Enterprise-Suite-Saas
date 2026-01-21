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
    Avatar,
    Tabs,
    Tab
} from "@heroui/react";
import { 
    UserGroupIcon,
    ChartBarIcon,
    AcademicCapIcon,
    MagnifyingGlassIcon,
    StarIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const EmployeeSkillsPage = ({ title, employees: initialEmployees, skills: initialSkills, departments: initialDepartments }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canUpdate, hasAccess, isSuperAdmin } = useHRMAC();
    
    // Manual responsive state management (HRMAC pattern)
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
    const [employeeSkills, setEmployeeSkills] = useState([]);
    const [employees, setEmployees] = useState(initialEmployees || []);
    const [skills, setSkills] = useState(initialSkills || []);
    const [departments, setDepartments] = useState(initialDepartments || []);
    const [activeTab, setActiveTab] = useState('skills-matrix');
    const [filters, setFilters] = useState({ search: '', department: 'all', skill: 'all', proficiency: 'all' });
    const [pagination, setPagination] = useState({ perPage: 30, currentPage: 1, total: 0 });
    const [stats, setStats] = useState({ totalEmployees: 0, averageSkills: 0, expertLevel: 0, needsTraining: 0 });

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { 
            title: "Total Employees", 
            value: stats.totalEmployees, 
            icon: <UserGroupIcon className="w-5 h-5" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Avg Skills per Employee", 
            value: stats.averageSkills, 
            icon: <ChartBarIcon className="w-5 h-5" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "Expert Level", 
            value: stats.expertLevel, 
            icon: <StarIcon className="w-5 h-5" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Need Training", 
            value: stats.needsTraining, 
            icon: <AcademicCapIcon className="w-5 h-5" />, 
            color: "text-danger", 
            iconBg: "bg-danger/20" 
        }
    ], [stats]);

    // Permission checks
    const canUpdateSkills = canUpdate && hasAccess('hrm.employee-skills.update');

    // Fetch employee skills data
    const fetchEmployeeSkills = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.skills.employee-skills'), {
                params: { page: pagination.currentPage, perPage: pagination.perPage, ...filters }
            });
            if (response.status === 200) {
                setEmployeeSkills(response.data.employeeSkills || []);
                setStats(response.data.stats || { totalEmployees: 0, averageSkills: 0, expertLevel: 0, needsTraining: 0 });
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), { error: 'Failed to fetch employee skills data' });
        } finally {
            setLoading(false);
            setStatsLoading(false);
        }
    }, [filters, pagination]);

    useEffect(() => { fetchEmployeeSkills(); }, [fetchEmployeeSkills]);

    // Filter handlers
    const handleFilterChange = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, []);

    // Render proficiency level
    const renderProficiency = useCallback((level) => {
        const colorMap = {
            'beginner': 'danger',
            'intermediate': 'warning', 
            'advanced': 'primary',
            'expert': 'success'
        };
        return (
            <div className="flex items-center gap-2">
                <Chip color={colorMap[level] || 'default'} size="sm">{level}</Chip>
                <Progress 
                    value={level === 'expert' ? 100 : level === 'advanced' ? 75 : level === 'intermediate' ? 50 : 25}
                    color={colorMap[level] || 'default'}
                    size="sm"
                    className="w-20"
                />
            </div>
        );
    }, []);

    // Skills Matrix Table columns
    const matrixColumns = useMemo(() => [
        { uid: 'employee', name: 'Employee' },
        { uid: 'department', name: 'Department' },
        { uid: 'skills_count', name: 'Skills Count' },
        { uid: 'avg_proficiency', name: 'Avg Proficiency' },
        { uid: 'top_skills', name: 'Top Skills' },
        { uid: 'actions', name: 'Actions' }
    ], []);

    // Individual Skills Table columns
    const skillsColumns = useMemo(() => [
        { uid: 'employee', name: 'Employee' },
        { uid: 'skill', name: 'Skill' },
        { uid: 'proficiency', name: 'Proficiency' },
        { uid: 'last_assessed', name: 'Last Assessed' },
        { uid: 'actions', name: 'Actions' }
    ], []);

    // Render matrix table cell
    const renderMatrixCell = useCallback((employee, columnKey) => {
        switch (columnKey) {
            case 'employee':
                return (
                    <div className="flex items-center gap-3">
                        <Avatar src={employee.avatar} name={employee.name} size="sm" />
                        <div>
                            <p className="font-semibold">{employee.name}</p>
                            <p className="text-xs text-default-500">{employee.email}</p>
                        </div>
                    </div>
                );
            case 'department':
                return employee.department?.name || '-';
            case 'skills_count':
                return <Chip variant="flat" color="primary">{employee.skills_count || 0}</Chip>;
            case 'avg_proficiency':
                return renderProficiency(employee.avg_proficiency || 'beginner');
            case 'top_skills':
                return (
                    <div className="flex gap-1 flex-wrap">
                        {(employee.top_skills || []).slice(0, 3).map((skill, index) => (
                            <Chip key={index} size="sm" variant="flat">{skill}</Chip>
                        ))}
                    </div>
                );
            case 'actions':
                return (
                    <div className="flex gap-2">
                        {canUpdateSkills && (
                            <Button size="sm" variant="flat">
                                Update Skills
                            </Button>
                        )}
                    </div>
                );
            default:
                return employee[columnKey] || '-';
        }
    }, [canUpdateSkills, renderProficiency]);

    // Render skills table cell
    const renderSkillsCell = useCallback((skillRecord, columnKey) => {
        switch (columnKey) {
            case 'employee':
                return (
                    <div className="flex items-center gap-3">
                        <Avatar src={skillRecord.employee?.avatar} name={skillRecord.employee?.name} size="sm" />
                        <span className="font-semibold">{skillRecord.employee?.name}</span>
                    </div>
                );
            case 'skill':
                return skillRecord.skill?.name || '-';
            case 'proficiency':
                return renderProficiency(skillRecord.proficiency_level);
            case 'last_assessed':
                return skillRecord.last_assessed || 'Never';
            case 'actions':
                return (
                    <div className="flex gap-2">
                        {canUpdateSkills && (
                            <Button size="sm" variant="flat">
                                Update
                            </Button>
                        )}
                    </div>
                );
            default:
                return skillRecord[columnKey] || '-';
        }
    }, [canUpdateSkills, renderProficiency]);

    return (
        <>
            <Head title={title} />
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Employee Skills Management">
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
                                                    <UserGroupIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Employee Skills
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        View and manage employee skill assessments
                                                    </p>
                                                </div>
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
                                            placeholder="Search employees or skills..."
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
                                            label="Proficiency"
                                            placeholder="All Levels"
                                            selectedKeys={filters.proficiency !== 'all' ? [filters.proficiency] : []}
                                            onSelectionChange={(keys) => handleFilterChange('proficiency', Array.from(keys)[0] || 'all')}
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

                                    {/* Tabs for different views */}
                                    <Tabs 
                                        selectedKey={activeTab}
                                        onSelectionChange={setActiveTab}
                                        className="mb-6"
                                    >
                                        <Tab key="skills-matrix" title="Skills Matrix">
                                            <Table
                                                aria-label="Skills matrix table"
                                                isHeaderSticky
                                                classNames={{
                                                    wrapper: "shadow-none border border-divider rounded-lg",
                                                    th: "bg-default-100 text-default-600 font-semibold",
                                                    td: "py-3"
                                                }}
                                            >
                                                <TableHeader columns={matrixColumns}>
                                                    {(column) => <TableColumn key={column.uid}>{column.name}</TableColumn>}
                                                </TableHeader>
                                                <TableBody items={employeeSkills} emptyContent="No employee skills data found">
                                                    {(employee) => (
                                                        <TableRow key={employee.id}>
                                                            {(columnKey) => <TableCell>{renderMatrixCell(employee, columnKey)}</TableCell>}
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </Tab>

                                        <Tab key="individual-skills" title="Individual Skills">
                                            <Table
                                                aria-label="Individual skills table"
                                                isHeaderSticky
                                                classNames={{
                                                    wrapper: "shadow-none border border-divider rounded-lg",
                                                    th: "bg-default-100 text-default-600 font-semibold",
                                                    td: "py-3"
                                                }}
                                            >
                                                <TableHeader columns={skillsColumns}>
                                                    {(column) => <TableColumn key={column.uid}>{column.name}</TableColumn>}
                                                </TableHeader>
                                                <TableBody items={employeeSkills} emptyContent="No individual skills found">
                                                    {(skillRecord) => (
                                                        <TableRow key={`${skillRecord.employee_id}-${skillRecord.skill_id}`}>
                                                            {(columnKey) => <TableCell>{renderSkillsCell(skillRecord, columnKey)}</TableCell>}
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </Tab>
                                    </Tabs>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

EmployeeSkillsPage.layout = (page) => <App children={page} />;
export default EmployeeSkillsPage;