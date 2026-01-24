import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { 
    Button, 
    Input, 
    Select, 
    SelectItem, 
    Pagination, 
    Modal, 
    ModalContent, 
    ModalHeader, 
    ModalBody, 
    ModalFooter,
    Tabs,
    Tab,
    Progress,
    Chip
} from "@heroui/react";
import { 
    AcademicCapIcon,
    SparklesIcon,
    UserGroupIcon,
    ChartBarIcon,
    PlusIcon,
    ArrowPathIcon,
    CheckBadgeIcon
} from "@heroicons/react/24/outline";
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import SkillsTable from '@/Tables/HRM/SkillsTable.jsx';
import SkillForm from '@/Forms/HRM/SkillForm.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const SkillsIndex = ({ title, employees: initialEmployees, categories: initialCategories }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete, isSuperAdmin, hasAccess } = useHRMAC();
    
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

    // Data state
    const [loading, setLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(true);
    const [skills, setSkills] = useState([]);
    const [employeeSkills, setEmployeeSkills] = useState([]);
    const [employees, setEmployees] = useState(initialEmployees || []);
    const [categories, setCategories] = useState(initialCategories || []);
    const [activeTab, setActiveTab] = useState('employee-skills');
    const [stats, setStats] = useState({ 
        total_skills: 0, 
        total_competencies: 0, 
        certified_employees: 0,
        skill_gaps: 0 
    });
    
    // Filter state
    const [filters, setFilters] = useState({ search: '', category: '', level: '' });
    const [pagination, setPagination] = useState({ perPage: 30, currentPage: 1, total: 0, lastPage: 1 });
    
    // Modal state
    const [modalState, setModalState] = useState({ type: null, skill: null });

    // Permissions using HRMAC
    const canCreateSkill = canCreate('hrm.training.skills') || isSuperAdmin();
    const canEditSkill = canUpdate('hrm.training.skills') || isSuperAdmin();
    const canDeleteSkill = canDelete('hrm.training.skills') || isSuperAdmin();
    const canManageMatrix = hasAccess('hrm.training.skills') || isSuperAdmin();

    const statsData = useMemo(() => [
        { title: "Skills Defined", value: stats.total_skills, icon: <SparklesIcon className="w-6 h-6" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "Competencies", value: stats.total_competencies, icon: <ChartBarIcon className="w-6 h-6" />, color: "text-info", iconBg: "bg-info/20" },
        { title: "Certified Employees", value: stats.certified_employees, icon: <CheckBadgeIcon className="w-6 h-6" />, color: "text-success", iconBg: "bg-success/20" },
        { title: "Skill Gaps", value: stats.skill_gaps, icon: <UserGroupIcon className="w-6 h-6" />, color: "text-warning", iconBg: "bg-warning/20" },
    ], [stats]);

    // Fetch skills based on active tab
    const fetchSkills = useCallback(async () => {
        setLoading(true);
        try {
            const endpoint = activeTab === 'skill-library' 
                ? 'hrm.skills.index' 
                : 'hrm.skills.employee-skills.index';
            
            const response = await axios.get(route(endpoint), {
                params: { 
                    page: pagination.currentPage, 
                    per_page: pagination.perPage, 
                    search: filters.search,
                    category: filters.category || undefined,
                    level: filters.level || undefined
                },
                headers: { 'Accept': 'application/json' }
            });
            if (response.status === 200) {
                const data = response.data.skills || response.data;
                if (activeTab === 'skill-library') {
                    setSkills(data.data || []);
                } else {
                    setEmployeeSkills(data.data || []);
                }
                setPagination(prev => ({
                    ...prev,
                    total: data.total || 0,
                    lastPage: data.last_page || 1
                }));
            }
        } catch (error) {
            console.error('Failed to fetch skills:', error);
            showToast.error('Failed to fetch skills');
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage, activeTab]);

    // Fetch stats
    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('hrm.skills.stats'));
            if (response.status === 200) setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    // Fetch employees if not provided
    const fetchEmployees = useCallback(async () => {
        if (employees.length > 0) return;
        try {
            const response = await axios.get(route('hrm.employees.list'));
            if (response.status === 200) setEmployees(response.data);
        } catch (error) {
            console.error('Failed to fetch employees:', error);
        }
    }, [employees.length]);

    useEffect(() => {
        fetchSkills();
        fetchStats();
        fetchEmployees();
    }, [fetchSkills, fetchStats, fetchEmployees]);

    // Handle tab change
    const handleTabChange = (key) => {
        setActiveTab(key);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
        setFilters({ search: '', category: '', level: '' });
    };

    // CRUD handlers
    const handleView = (skill) => {
        setModalState({ type: 'view', skill });
    };
    
    const handleEdit = (skill) => {
        setModalState({ type: 'edit', skill });
    };
    
    const handleDelete = async (skill) => {
        const itemType = activeTab === 'skill-library' ? 'skill' : 'employee skill';
        if (!confirm(`Are you sure you want to delete this ${itemType}?`)) return;
        
        const endpoint = activeTab === 'skill-library' 
            ? route('hrm.skills.destroy', skill.id)
            : route('hrm.skills.employee-skills.destroy', skill.id);
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                await axios.delete(endpoint);
                resolve([`${itemType} deleted successfully`]);
                fetchSkills();
                fetchStats();
            } catch (error) {
                reject([error.response?.data?.message || `Failed to delete ${itemType}`]);
            }
        });
        
        showToast.promise(promise, {
            loading: `Deleting ${itemType}...`,
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    const handleVerify = async (employeeSkill) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                await axios.post(route('hrm.skills.employee-skills.verify', employeeSkill.id));
                resolve(['Skill verified successfully']);
                fetchSkills();
                fetchStats();
            } catch (error) {
                reject([error.response?.data?.message || 'Failed to verify skill']);
            }
        });
        
        showToast.promise(promise, {
            loading: 'Verifying skill...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    // Form submit handler
    const handleFormSubmit = async (formData) => {
        const isEdit = modalState.type === 'edit';
        const isLibrary = activeTab === 'skill-library';
        
        let url, method;
        if (isLibrary) {
            url = isEdit 
                ? route('hrm.skills.update', modalState.skill.id) 
                : route('hrm.skills.store');
        } else {
            url = isEdit 
                ? route('hrm.skills.employee-skills.update', modalState.skill.id) 
                : route('hrm.skills.employee-skills.store');
        }
        method = isEdit ? 'put' : 'post';
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                await axios[method](url, formData);
                resolve([`Skill ${isEdit ? 'updated' : 'created'} successfully`]);
                setModalState({ type: null, skill: null });
                fetchSkills();
                fetchStats();
            } catch (error) {
                reject([error.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} skill`]);
            }
        });
        
        showToast.promise(promise, {
            loading: `${isEdit ? 'Updating' : 'Creating'} skill...`,
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

    const closeModal = () => setModalState({ type: null, skill: null });

    const permissions = {
        canCreate: canCreateSkill,
        canEdit: canEditSkill,
        canDelete: canDeleteSkill,
        canVerify: canManageMatrix
    };

    const data = activeTab === 'skill-library' ? skills : employeeSkills;

    const skillLevelOptions = [
        { key: 'beginner', label: 'Beginner' },
        { key: 'intermediate', label: 'Intermediate' },
        { key: 'advanced', label: 'Advanced' },
        { key: 'expert', label: 'Expert' }
    ];

    const categoryOptions = categories.length > 0 ? categories : [
        { key: 'technical', label: 'Technical' },
        { key: 'soft', label: 'Soft Skills' },
        { key: 'leadership', label: 'Leadership' },
        { key: 'domain', label: 'Domain Knowledge' },
        { key: 'certification', label: 'Certifications' },
        { key: 'language', label: 'Languages' },
        { key: 'tool', label: 'Tools & Software' }
    ];

    return (
        <>
            <Head title={title || "Skills & Competencies"} />
            
            {/* Create/Edit Modal */}
            <Modal 
                isOpen={modalState.type === 'create' || modalState.type === 'edit'} 
                onOpenChange={closeModal} 
                size="2xl"
                scrollBehavior="inside"
            >
                <ModalContent>
                    <ModalHeader>
                        {modalState.type === 'edit' 
                            ? `Edit ${activeTab === 'skill-library' ? 'Skill' : 'Employee Skill'}` 
                            : `Add ${activeTab === 'skill-library' ? 'Skill to Library' : 'Employee Skill'}`}
                    </ModalHeader>
                    <ModalBody>
                        <SkillForm
                            skill={modalState.skill}
                            employees={employees}
                            skills={skills}
                            categories={categoryOptions}
                            levels={skillLevelOptions}
                            mode={activeTab === 'skill-library' ? 'library' : 'employee'}
                            onSubmit={handleFormSubmit}
                            onCancel={closeModal}
                        />
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* View Modal */}
            <Modal 
                isOpen={modalState.type === 'view'} 
                onOpenChange={closeModal} 
                size="xl"
            >
                <ModalContent>
                    <ModalHeader>
                        {modalState.skill?.name || modalState.skill?.skill?.name}
                    </ModalHeader>
                    <ModalBody>
                        {modalState.skill && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Chip variant="flat" size="sm">
                                        {modalState.skill.category || modalState.skill.skill?.category}
                                    </Chip>
                                    <Chip 
                                        color={
                                            modalState.skill.level === 'expert' ? 'success' :
                                            modalState.skill.level === 'advanced' ? 'primary' :
                                            modalState.skill.level === 'intermediate' ? 'warning' : 'default'
                                        }
                                        size="sm"
                                        variant="flat"
                                    >
                                        {modalState.skill.level}
                                    </Chip>
                                    {modalState.skill.is_verified && (
                                        <Chip color="success" size="sm" startContent={<CheckBadgeIcon className="w-3 h-3" />}>
                                            Verified
                                        </Chip>
                                    )}
                                </div>
                                
                                {modalState.skill.description && (
                                    <p className="text-default-600">{modalState.skill.description}</p>
                                )}

                                {activeTab !== 'skill-library' && (
                                    <>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>Proficiency</span>
                                                <span>{modalState.skill.proficiency || 0}%</span>
                                            </div>
                                            <Progress 
                                                value={modalState.skill.proficiency || 0} 
                                                color={modalState.skill.proficiency >= 80 ? 'success' : 'primary'}
                                                radius={themeRadius}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-default-500">Employee</span>
                                                <p className="font-medium">{modalState.skill.employee?.name}</p>
                                            </div>
                                            <div>
                                                <span className="text-default-500">Years of Experience</span>
                                                <p className="font-medium">{modalState.skill.years_experience || 0} years</p>
                                            </div>
                                            <div>
                                                <span className="text-default-500">Last Used</span>
                                                <p className="font-medium">{modalState.skill.last_used || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <span className="text-default-500">Certification</span>
                                                <p className="font-medium">{modalState.skill.certification || 'None'}</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={closeModal}>Close</Button>
                        {permissions.canVerify && activeTab !== 'skill-library' && !modalState.skill?.is_verified && (
                            <Button color="success" onPress={() => handleVerify(modalState.skill)}>
                                Verify Skill
                            </Button>
                        )}
                    </ModalFooter>
                </ModalContent>
            </Modal>
            
            <StandardPageLayout
                title="Skills & Competencies"
                subtitle="Manage employee skills, competencies, and certifications"
                icon={<AcademicCapIcon />}
                isLoading={loading && statsLoading}
                ariaLabel="Skills Management"
                actions={
                    <div className="flex gap-2">
                        <Button 
                            isIconOnly 
                            variant="flat" 
                            onPress={() => { fetchSkills(); fetchStats(); }}
                        >
                            <ArrowPathIcon className="w-4 h-4" />
                        </Button>
                        {canCreateSkill && (
                            <Button 
                                color="primary" 
                                variant="shadow" 
                                startContent={<PlusIcon className="w-4 h-4" />}
                                onPress={() => setModalState({ type: 'create', skill: null })}
                            >
                                {activeTab === 'skill-library' ? 'Add Skill' : 'Assign Skill'}
                            </Button>
                        )}
                    </div>
                }
                stats={<StatsCards stats={statsData} isLoading={statsLoading} />}
                filters={
                    <div className="space-y-4">
                        <Tabs 
                            selectedKey={activeTab} 
                            onSelectionChange={handleTabChange}
                            variant="underlined"
                            color="primary"
                        >
                            <Tab key="employee-skills" title="Employee Skills" />
                            <Tab key="skill-library" title="Skill Library" />
                            <Tab key="skill-matrix" title="Skills Matrix" />
                        </Tabs>
                        
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Input 
                                label="Search" 
                                placeholder="Search skills..."
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
                                label="Category" 
                                placeholder="All Categories" 
                                variant="bordered" 
                                size="sm" 
                                radius={themeRadius}
                                selectedKeys={filters.category ? [filters.category] : []}
                                onSelectionChange={(keys) => handleFilterChange('category', Array.from(keys)[0] || '')}
                                className="w-full sm:w-48"
                            >
                                {categoryOptions.map(cat => (
                                    <SelectItem key={cat.key}>{cat.label}</SelectItem>
                                ))}
                            </Select>
                            <Select 
                                label="Level" 
                                placeholder="All Levels" 
                                variant="bordered" 
                                size="sm" 
                                radius={themeRadius}
                                selectedKeys={filters.level ? [filters.level] : []}
                                onSelectionChange={(keys) => handleFilterChange('level', Array.from(keys)[0] || '')}
                                className="w-full sm:w-40"
                            >
                                {skillLevelOptions.map(level => (
                                    <SelectItem key={level.key}>{level.label}</SelectItem>
                                ))}
                            </Select>
                        </div>
                    </div>
                }
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
                <SkillsTable
                    data={data}
                    loading={loading}
                    mode={activeTab}
                    permissions={permissions}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onVerify={handleVerify}
                />
            </StandardPageLayout>
        </>
    );
};

SkillsIndex.layout = (page) => <App children={page} />;
export default SkillsIndex;
