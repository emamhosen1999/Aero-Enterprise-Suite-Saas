import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Textarea, Avatar, Tabs, Tab, Progress } from "@heroui/react";
import { 
    ArrowTrendingUpIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    StarIcon,
    TrophyIcon,
    CheckBadgeIcon,
    DocumentTextIcon,
    ClockIcon,
    CalendarDaysIcon,
    UserIcon,
    BuildingOfficeIcon,
    AcademicCapIcon,
    BriefcaseIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    UsersIcon,
    ChartBarIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const PromotionRecommendations = ({ title, employees = [], positions = [], departments = [], performanceData = [] }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete } = useHRMAC();
    
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
    const [recommendations, setRecommendations] = useState([]);
    const [filters, setFilters] = useState({ 
        search: '', 
        department_id: 'all', 
        current_position: 'all',
        recommendation_type: 'all',
        priority_level: 'all',
        status: 'all'
    });
    const [pagination, setPagination] = useState({ currentPage: 1, perPage: 20, total: 0, lastPage: 1 });
    const [stats, setStats] = useState({ 
        total_recommendations: 0, 
        pending_recommendations: 0, 
        approved_recommendations: 0, 
        implemented_promotions: 0,
        high_priority: 0,
        ready_for_promotion: 0
    });
    const [modalStates, setModalStates] = useState({ 
        recommend: false, 
        edit: false, 
        delete: false, 
        view: false, 
        approve: false, 
        bulk: false,
        generate: false
    });
    const [selectedRecommendation, setSelectedRecommendation] = useState(null);
    const [formData, setFormData] = useState({
        employee_id: '',
        current_position_id: '',
        recommended_position_id: '',
        department_id: '',
        
        // Recommendation details
        recommendation_type: 'promotion', // promotion, lateral_move, role_expansion
        priority_level: 'medium', // high, medium, low
        timeline: 'immediate', // immediate, 3_months, 6_months, 1_year
        
        // Performance justification
        performance_rating: '',
        performance_trend: '', // improving, stable, declining
        current_salary: '',
        recommended_salary: '',
        salary_increase_percentage: '',
        
        // Skills and qualifications
        current_skills: '',
        required_skills: '',
        skill_gaps: '',
        development_plan: '',
        
        // Readiness assessment
        readiness_score: '0', // 1-10 scale
        leadership_potential: '0', // 1-10 scale
        technical_competency: '0', // 1-10 scale
        culture_fit: '0', // 1-10 scale
        
        // Business justification
        business_need: '',
        impact_assessment: '',
        risk_factors: '',
        success_metrics: '',
        
        // Implementation details
        proposed_start_date: '',
        transition_plan: '',
        training_requirements: '',
        budget_impact: '',
        
        // Approval workflow
        recommended_by: '',
        reviewed_by: '',
        approved_by: '',
        status: 'pending', // pending, under_review, approved, rejected, implemented
        
        // Additional notes
        notes: '',
        supporting_documents: '',
        manager_endorsement: '',
        hr_comments: ''
    });

    // Permission checks
    const canRecommend = canCreate('hrm.performance.promotions');
    const canEditRecommendations = canUpdate('hrm.performance.promotions');
    const canDeleteRecommendations = canDelete('hrm.performance.promotions');

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { 
            title: "Total Recommendations", 
            value: stats.total_recommendations, 
            icon: <ArrowTrendingUpIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Approved", 
            value: stats.approved_recommendations, 
            icon: <CheckBadgeIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "High Priority", 
            value: stats.high_priority, 
            icon: <StarIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Implemented", 
            value: stats.implemented_promotions, 
            icon: <TrophyIcon className="w-6 h-6" />, 
            color: "text-danger", 
            iconBg: "bg-danger/20" 
        },
    ], [stats]);

    // Recommendation configuration
    const recommendationTypes = [
        { key: 'promotion', label: 'Vertical Promotion', description: 'Move to higher level position' },
        { key: 'lateral_move', label: 'Lateral Move', description: 'Same level, different role' },
        { key: 'role_expansion', label: 'Role Expansion', description: 'Additional responsibilities' },
        { key: 'succession', label: 'Succession Planning', description: 'Future leadership role' },
    ];

    const priorityLevels = [
        { key: 'high', label: 'High Priority', color: 'danger' },
        { key: 'medium', label: 'Medium Priority', color: 'warning' },
        { key: 'low', label: 'Low Priority', color: 'primary' },
    ];

    const timelines = [
        { key: 'immediate', label: 'Immediate (0-1 months)', color: 'danger' },
        { key: '3_months', label: 'Short Term (3 months)', color: 'warning' },
        { key: '6_months', label: 'Medium Term (6 months)', color: 'primary' },
        { key: '1_year', label: 'Long Term (1+ years)', color: 'secondary' },
    ];

    const statuses = [
        { key: 'pending', label: 'Pending Review', color: 'default' },
        { key: 'under_review', label: 'Under Review', color: 'primary' },
        { key: 'approved', label: 'Approved', color: 'success' },
        { key: 'rejected', label: 'Rejected', color: 'danger' },
        { key: 'implemented', label: 'Implemented', color: 'secondary' },
    ];

    const getStatusColor = (status) => {
        return statuses.find(s => s.key === status)?.color || 'default';
    };

    const getStatusLabel = (status) => {
        return statuses.find(s => s.key === status)?.label || status;
    };

    const getPriorityColor = (priority) => {
        return priorityLevels.find(p => p.key === priority)?.color || 'default';
    };

    const getPriorityLabel = (priority) => {
        return priorityLevels.find(p => p.key === priority)?.label || priority;
    };

    const getTimelineColor = (timeline) => {
        return timelines.find(t => t.key === timeline)?.color || 'default';
    };

    const getTimelineLabel = (timeline) => {
        return timelines.find(t => t.key === timeline)?.label || timeline;
    };

    const getReadinessColor = (score) => {
        if (score >= 8) return 'success';
        if (score >= 6) return 'primary';
        if (score >= 4) return 'warning';
        return 'danger';
    };

    const calculateOverallReadiness = (technical, leadership, culture) => {
        const scores = [technical, leadership, culture].filter(s => s);
        if (scores.length === 0) return 0;
        return (scores.reduce((sum, score) => sum + parseFloat(score), 0) / scores.length).toFixed(1);
    };

    // Data fetching
    const fetchRecommendations = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.performance.promotions.paginate'), {
                params: { 
                    page: pagination.currentPage, 
                    perPage: pagination.perPage,
                    ...filters
                }
            });
            if (response.status === 200) {
                setRecommendations(response.data.recommendations || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total || 0,
                    lastPage: response.data.last_page || 1
                }));
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to fetch promotion recommendations'
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('hrm.performance.promotions.stats'));
            if (response.status === 200) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch promotion stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRecommendations();
        fetchStats();
    }, [fetchRecommendations, fetchStats]);

    // CRUD operations
    const handleSubmit = async () => {
        const overallReadiness = calculateOverallReadiness(
            formData.technical_competency,
            formData.leadership_potential,
            formData.culture_fit
        );

        const submissionData = { 
            ...formData,
            readiness_score: overallReadiness
        };

        const promise = new Promise(async (resolve, reject) => {
            try {
                const url = selectedRecommendation 
                    ? route('hrm.performance.promotions.update', selectedRecommendation.id)
                    : route('hrm.performance.promotions.store');
                
                const response = await axios({
                    method: selectedRecommendation ? 'PUT' : 'POST',
                    url,
                    data: submissionData
                });
                
                if (response.status === 200) {
                    resolve([response.data.message || `Recommendation ${selectedRecommendation ? 'updated' : 'created'} successfully`]);
                    fetchRecommendations();
                    fetchStats();
                    closeModal(selectedRecommendation ? 'edit' : 'recommend');
                    resetForm();
                }
            } catch (error) {
                reject(error.response?.data?.errors || [`Failed to ${selectedRecommendation ? 'update' : 'create'} recommendation`]);
            }
        });

        showToast.promise(promise, {
            loading: `${selectedRecommendation ? 'Updating' : 'Creating'} promotion recommendation...`,
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleApprove = async (approved = true) => {
        if (!selectedRecommendation) return;

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('hrm.performance.promotions.approve', selectedRecommendation.id), {
                    approved,
                    comments: formData.hr_comments
                });
                if (response.status === 200) {
                    resolve([response.data.message || `Recommendation ${approved ? 'approved' : 'rejected'} successfully`]);
                    fetchRecommendations();
                    fetchStats();
                    closeModal('approve');
                }
            } catch (error) {
                reject(error.response?.data?.errors || [`Failed to ${approved ? 'approve' : 'reject'} recommendation`]);
            }
        });

        showToast.promise(promise, {
            loading: `${approved ? 'Approving' : 'Rejecting'} recommendation...`,
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleGenerateRecommendations = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('hrm.performance.promotions.generate'), {
                    department_id: formData.department_id,
                    performance_threshold: 4.0,
                    tenure_minimum: 12
                });
                if (response.status === 200) {
                    resolve([response.data.message || 'AI recommendations generated successfully']);
                    fetchRecommendations();
                    fetchStats();
                    closeModal('generate');
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to generate recommendations']);
            }
        });

        showToast.promise(promise, {
            loading: 'Generating AI recommendations...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleDelete = async () => {
        if (!selectedRecommendation) return;

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('hrm.performance.promotions.destroy', selectedRecommendation.id));
                if (response.status === 200) {
                    resolve([response.data.message || 'Recommendation deleted successfully']);
                    fetchRecommendations();
                    fetchStats();
                    closeModal('delete');
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to delete recommendation']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting recommendation...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Modal handlers
    const openModal = (type, recommendation = null) => {
        setSelectedRecommendation(recommendation);
        if (recommendation && (type === 'edit' || type === 'view' || type === 'approve')) {
            setFormData({
                employee_id: recommendation.employee_id || '',
                current_position_id: recommendation.current_position_id || '',
                recommended_position_id: recommendation.recommended_position_id || '',
                department_id: recommendation.department_id || '',
                
                recommendation_type: recommendation.recommendation_type || 'promotion',
                priority_level: recommendation.priority_level || 'medium',
                timeline: recommendation.timeline || 'immediate',
                
                performance_rating: recommendation.performance_rating || '',
                performance_trend: recommendation.performance_trend || '',
                current_salary: recommendation.current_salary || '',
                recommended_salary: recommendation.recommended_salary || '',
                salary_increase_percentage: recommendation.salary_increase_percentage || '',
                
                current_skills: recommendation.current_skills || '',
                required_skills: recommendation.required_skills || '',
                skill_gaps: recommendation.skill_gaps || '',
                development_plan: recommendation.development_plan || '',
                
                readiness_score: recommendation.readiness_score || '0',
                leadership_potential: recommendation.leadership_potential || '0',
                technical_competency: recommendation.technical_competency || '0',
                culture_fit: recommendation.culture_fit || '0',
                
                business_need: recommendation.business_need || '',
                impact_assessment: recommendation.impact_assessment || '',
                risk_factors: recommendation.risk_factors || '',
                success_metrics: recommendation.success_metrics || '',
                
                proposed_start_date: recommendation.proposed_start_date || '',
                transition_plan: recommendation.transition_plan || '',
                training_requirements: recommendation.training_requirements || '',
                budget_impact: recommendation.budget_impact || '',
                
                recommended_by: recommendation.recommended_by || auth.user?.name || '',
                reviewed_by: recommendation.reviewed_by || '',
                approved_by: recommendation.approved_by || '',
                status: recommendation.status || 'pending',
                
                notes: recommendation.notes || '',
                supporting_documents: recommendation.supporting_documents || '',
                manager_endorsement: recommendation.manager_endorsement || '',
                hr_comments: recommendation.hr_comments || ''
            });
        }
        setModalStates(prev => ({ ...prev, [type]: true }));
    };

    const closeModal = (type) => {
        setModalStates(prev => ({ ...prev, [type]: false }));
        setSelectedRecommendation(null);
    };

    const resetForm = () => {
        setFormData({
            employee_id: '',
            current_position_id: '',
            recommended_position_id: '',
            department_id: '',
            
            recommendation_type: 'promotion',
            priority_level: 'medium',
            timeline: 'immediate',
            
            performance_rating: '',
            performance_trend: '',
            current_salary: '',
            recommended_salary: '',
            salary_increase_percentage: '',
            
            current_skills: '',
            required_skills: '',
            skill_gaps: '',
            development_plan: '',
            
            readiness_score: '0',
            leadership_potential: '0',
            technical_competency: '0',
            culture_fit: '0',
            
            business_need: '',
            impact_assessment: '',
            risk_factors: '',
            success_metrics: '',
            
            proposed_start_date: '',
            transition_plan: '',
            training_requirements: '',
            budget_impact: '',
            
            recommended_by: auth.user?.name || '',
            reviewed_by: '',
            approved_by: '',
            status: 'pending',
            
            notes: '',
            supporting_documents: '',
            manager_endorsement: '',
            hr_comments: ''
        });
    };

    // Filter handlers
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    // Form handlers
    const handleFormChange = (key, value) => {
        setFormData(prev => {
            const newData = { ...prev, [key]: value };
            
            // Auto-calculate salary increase percentage
            if (key === 'current_salary' || key === 'recommended_salary') {
                const current = parseFloat(newData.current_salary || 0);
                const recommended = parseFloat(newData.recommended_salary || 0);
                if (current > 0 && recommended > 0) {
                    const percentage = ((recommended - current) / current * 100).toFixed(1);
                    newData.salary_increase_percentage = percentage;
                }
            }
            
            return newData;
        });
    };

    // Table columns
    const columns = [
        { uid: 'employee', name: 'Employee' },
        { uid: 'recommendation', name: 'Recommendation' },
        { uid: 'priority', name: 'Priority' },
        { uid: 'readiness', name: 'Readiness Score' },
        { uid: 'timeline', name: 'Timeline' },
        { uid: 'salary_impact', name: 'Salary Impact' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = useCallback((recommendation, columnKey) => {
        switch (columnKey) {
            case 'employee':
                return (
                    <div className="flex items-center gap-3">
                        <Avatar 
                            src={recommendation.employee?.avatar} 
                            name={recommendation.employee?.name} 
                            size="sm"
                        />
                        <div>
                            <p className="font-medium">{recommendation.employee?.name}</p>
                            <p className="text-xs text-default-500">{recommendation.current_position?.title}</p>
                        </div>
                    </div>
                );
            case 'recommendation':
                const typeInfo = recommendationTypes.find(t => t.key === recommendation.recommendation_type);
                return (
                    <div>
                        <Chip size="sm" variant="flat" color="primary" className="mb-1">
                            {typeInfo?.label || recommendation.recommendation_type}
                        </Chip>
                        <p className="text-xs text-default-600">{recommendation.recommended_position?.title}</p>
                    </div>
                );
            case 'priority':
                return (
                    <Chip 
                        color={getPriorityColor(recommendation.priority_level)} 
                        size="sm" 
                        variant="flat"
                    >
                        {getPriorityLabel(recommendation.priority_level)}
                    </Chip>
                );
            case 'readiness':
                const readinessScore = parseFloat(recommendation.readiness_score || 0);
                return (
                    <div className="flex items-center gap-2">
                        <Chip 
                            color={getReadinessColor(readinessScore)} 
                            size="sm" 
                            variant="solid"
                            startContent={<StarIcon className="w-3 h-3" />}
                        >
                            {readinessScore.toFixed(1)}/10
                        </Chip>
                        <Progress
                            value={readinessScore * 10}
                            color={getReadinessColor(readinessScore)}
                            size="sm"
                            className="w-12"
                        />
                    </div>
                );
            case 'timeline':
                return (
                    <Chip 
                        color={getTimelineColor(recommendation.timeline)} 
                        size="sm" 
                        variant="flat"
                    >
                        {getTimelineLabel(recommendation.timeline)}
                    </Chip>
                );
            case 'salary_impact':
                const currentSalary = parseFloat(recommendation.current_salary || 0);
                const recommendedSalary = parseFloat(recommendation.recommended_salary || 0);
                const percentage = parseFloat(recommendation.salary_increase_percentage || 0);
                
                return currentSalary && recommendedSalary ? (
                    <div className="text-sm">
                        <div className="font-medium">
                            ${currentSalary.toLocaleString()} → ${recommendedSalary.toLocaleString()}
                        </div>
                        <div className={`text-xs ${percentage > 0 ? 'text-success' : percentage < 0 ? 'text-danger' : 'text-default-500'}`}>
                            {percentage > 0 ? '+' : ''}{percentage}%
                        </div>
                    </div>
                ) : (
                    <span className="text-default-400">Not specified</span>
                );
            case 'status':
                return (
                    <Chip 
                        color={getStatusColor(recommendation.status)} 
                        size="sm" 
                        variant="flat"
                    >
                        {getStatusLabel(recommendation.status)}
                    </Chip>
                );
            case 'actions':
                return (
                    <div className="flex items-center gap-1">
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => openModal('view', recommendation)}
                        >
                            <EyeIcon className="w-4 h-4" />
                        </Button>
                        {canEditRecommendations && (
                            <>
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    onPress={() => openModal('edit', recommendation)}
                                >
                                    <PencilIcon className="w-4 h-4" />
                                </Button>
                                {recommendation.status === 'pending' && (
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        color="success"
                                        onPress={() => openModal('approve', recommendation)}
                                    >
                                        <CheckBadgeIcon className="w-4 h-4" />
                                    </Button>
                                )}
                            </>
                        )}
                        {canDeleteRecommendations && (
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={() => openModal('delete', recommendation)}
                            >
                                <TrashIcon className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                );
            default:
                return recommendation[columnKey] || '-';
        }
    }, [canEditRecommendations, canDeleteRecommendations]);

    return (
        <>
            <Head title={title} />
            
            {/* Add/Edit Recommendation Modal */}
            {(modalStates.recommend || modalStates.edit) && (
                <Modal 
                    isOpen={modalStates.recommend || modalStates.edit} 
                    onOpenChange={() => closeModal(modalStates.recommend ? 'recommend' : 'edit')}
                    size="5xl"
                    scrollBehavior="inside"
                >
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">
                                {selectedRecommendation ? 'Edit Promotion Recommendation' : 'Create Promotion Recommendation'}
                            </h2>
                        </ModalHeader>
                        <ModalBody>
                            <Tabs aria-label="Promotion Recommendation Form">
                                <Tab key="basic" title="Basic Info">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Select
                                                label="Employee"
                                                placeholder="Select employee"
                                                selectedKeys={formData.employee_id ? [formData.employee_id] : []}
                                                onSelectionChange={(keys) => handleFormChange('employee_id', Array.from(keys)[0] || '')}
                                                isRequired
                                                radius={themeRadius}
                                            >
                                                {employees.map(employee => (
                                                    <SelectItem key={employee.id}>
                                                        {employee.name} - {employee.current_position}
                                                    </SelectItem>
                                                ))}
                                            </Select>

                                            <Select
                                                label="Recommended Position"
                                                placeholder="Select target position"
                                                selectedKeys={formData.recommended_position_id ? [formData.recommended_position_id] : []}
                                                onSelectionChange={(keys) => handleFormChange('recommended_position_id', Array.from(keys)[0] || '')}
                                                isRequired
                                                radius={themeRadius}
                                            >
                                                {positions.map(position => (
                                                    <SelectItem key={position.id}>{position.title}</SelectItem>
                                                ))}
                                            </Select>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <Select
                                                label="Recommendation Type"
                                                selectedKeys={[formData.recommendation_type]}
                                                onSelectionChange={(keys) => handleFormChange('recommendation_type', Array.from(keys)[0])}
                                                radius={themeRadius}
                                            >
                                                {recommendationTypes.map(type => (
                                                    <SelectItem key={type.key} description={type.description}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </Select>

                                            <Select
                                                label="Priority Level"
                                                selectedKeys={[formData.priority_level]}
                                                onSelectionChange={(keys) => handleFormChange('priority_level', Array.from(keys)[0])}
                                                radius={themeRadius}
                                            >
                                                {priorityLevels.map(priority => (
                                                    <SelectItem key={priority.key}>{priority.label}</SelectItem>
                                                ))}
                                            </Select>

                                            <Select
                                                label="Timeline"
                                                selectedKeys={[formData.timeline]}
                                                onSelectionChange={(keys) => handleFormChange('timeline', Array.from(keys)[0])}
                                                radius={themeRadius}
                                            >
                                                {timelines.map(timeline => (
                                                    <SelectItem key={timeline.key}>{timeline.label}</SelectItem>
                                                ))}
                                            </Select>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <Input
                                                label="Current Salary"
                                                type="number"
                                                placeholder="50000"
                                                value={formData.current_salary}
                                                onValueChange={(value) => handleFormChange('current_salary', value)}
                                                radius={themeRadius}
                                                startContent={<span className="text-default-400 text-small">$</span>}
                                            />

                                            <Input
                                                label="Recommended Salary"
                                                type="number"
                                                placeholder="65000"
                                                value={formData.recommended_salary}
                                                onValueChange={(value) => handleFormChange('recommended_salary', value)}
                                                radius={themeRadius}
                                                startContent={<span className="text-default-400 text-small">$</span>}
                                            />

                                            <Input
                                                label="Increase Percentage"
                                                value={formData.salary_increase_percentage}
                                                isReadOnly
                                                radius={themeRadius}
                                                endContent={<span className="text-default-400 text-small">%</span>}
                                                color={parseFloat(formData.salary_increase_percentage) > 0 ? 'success' : 'default'}
                                            />
                                        </div>
                                    </div>
                                </Tab>

                                <Tab key="assessment" title="Readiness Assessment">
                                    <div className="space-y-4">
                                        <p className="text-sm text-default-600">Rate the employee's readiness across key competencies (1-10 scale)</p>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <Input
                                                label="Technical Competency"
                                                type="number"
                                                min="1"
                                                max="10"
                                                value={formData.technical_competency}
                                                onValueChange={(value) => handleFormChange('technical_competency', value)}
                                                radius={themeRadius}
                                                color={getReadinessColor(parseFloat(formData.technical_competency))}
                                            />

                                            <Input
                                                label="Leadership Potential"
                                                type="number"
                                                min="1"
                                                max="10"
                                                value={formData.leadership_potential}
                                                onValueChange={(value) => handleFormChange('leadership_potential', value)}
                                                radius={themeRadius}
                                                color={getReadinessColor(parseFloat(formData.leadership_potential))}
                                            />

                                            <Input
                                                label="Culture Fit"
                                                type="number"
                                                min="1"
                                                max="10"
                                                value={formData.culture_fit}
                                                onValueChange={(value) => handleFormChange('culture_fit', value)}
                                                radius={themeRadius}
                                                color={getReadinessColor(parseFloat(formData.culture_fit))}
                                            />
                                        </div>

                                        <Card className="bg-content2">
                                            <CardBody className="text-center py-4">
                                                <p className="text-sm text-default-600 mb-2">Overall Readiness Score</p>
                                                <div className="text-3xl font-bold text-primary">
                                                    {calculateOverallReadiness(
                                                        formData.technical_competency,
                                                        formData.leadership_potential,
                                                        formData.culture_fit
                                                    )} / 10
                                                </div>
                                            </CardBody>
                                        </Card>

                                        <div className="grid grid-cols-1 gap-4">
                                            <Textarea
                                                label="Current Skills"
                                                placeholder="List employee's current skills and competencies..."
                                                value={formData.current_skills}
                                                onValueChange={(value) => handleFormChange('current_skills', value)}
                                                radius={themeRadius}
                                            />

                                            <Textarea
                                                label="Required Skills for New Role"
                                                placeholder="Skills required for the recommended position..."
                                                value={formData.required_skills}
                                                onValueChange={(value) => handleFormChange('required_skills', value)}
                                                radius={themeRadius}
                                            />

                                            <Textarea
                                                label="Skill Gaps & Development Plan"
                                                placeholder="Identify gaps and development plan to bridge them..."
                                                value={formData.skill_gaps}
                                                onValueChange={(value) => handleFormChange('skill_gaps', value)}
                                                radius={themeRadius}
                                            />
                                        </div>
                                    </div>
                                </Tab>

                                <Tab key="business" title="Business Case">
                                    <div className="space-y-4">
                                        <Textarea
                                            label="Business Need"
                                            placeholder="Describe the business need for this promotion..."
                                            value={formData.business_need}
                                            onValueChange={(value) => handleFormChange('business_need', value)}
                                            radius={themeRadius}
                                            isRequired
                                        />

                                        <Textarea
                                            label="Impact Assessment"
                                            placeholder="Expected impact of this promotion on team/department..."
                                            value={formData.impact_assessment}
                                            onValueChange={(value) => handleFormChange('impact_assessment', value)}
                                            radius={themeRadius}
                                        />

                                        <Textarea
                                            label="Risk Factors"
                                            placeholder="Potential risks and mitigation strategies..."
                                            value={formData.risk_factors}
                                            onValueChange={(value) => handleFormChange('risk_factors', value)}
                                            radius={themeRadius}
                                        />

                                        <Textarea
                                            label="Success Metrics"
                                            placeholder="How will you measure success of this promotion..."
                                            value={formData.success_metrics}
                                            onValueChange={(value) => handleFormChange('success_metrics', value)}
                                            radius={themeRadius}
                                        />

                                        <Input
                                            label="Budget Impact"
                                            placeholder="Annual budget impact"
                                            value={formData.budget_impact}
                                            onValueChange={(value) => handleFormChange('budget_impact', value)}
                                            radius={themeRadius}
                                            startContent={<span className="text-default-400 text-small">$</span>}
                                        />
                                    </div>
                                </Tab>

                                <Tab key="implementation" title="Implementation">
                                    <div className="space-y-4">
                                        <Input
                                            label="Proposed Start Date"
                                            type="date"
                                            value={formData.proposed_start_date}
                                            onValueChange={(value) => handleFormChange('proposed_start_date', value)}
                                            radius={themeRadius}
                                        />

                                        <Textarea
                                            label="Transition Plan"
                                            placeholder="Detailed transition plan and timeline..."
                                            value={formData.transition_plan}
                                            onValueChange={(value) => handleFormChange('transition_plan', value)}
                                            radius={themeRadius}
                                        />

                                        <Textarea
                                            label="Training Requirements"
                                            placeholder="Required training and development programs..."
                                            value={formData.training_requirements}
                                            onValueChange={(value) => handleFormChange('training_requirements', value)}
                                            radius={themeRadius}
                                        />

                                        <Textarea
                                            label="Manager Endorsement"
                                            placeholder="Manager's endorsement and comments..."
                                            value={formData.manager_endorsement}
                                            onValueChange={(value) => handleFormChange('manager_endorsement', value)}
                                            radius={themeRadius}
                                        />

                                        <Textarea
                                            label="Additional Notes"
                                            placeholder="Any additional notes or considerations..."
                                            value={formData.notes}
                                            onValueChange={(value) => handleFormChange('notes', value)}
                                            radius={themeRadius}
                                        />
                                    </div>
                                </Tab>
                            </Tabs>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal(modalStates.recommend ? 'recommend' : 'edit')}>
                                Cancel
                            </Button>
                            <Button color="primary" onPress={handleSubmit}>
                                {selectedRecommendation ? 'Update Recommendation' : 'Create Recommendation'}
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {/* Approval Modal */}
            {modalStates.approve && (
                <Modal isOpen={modalStates.approve} onOpenChange={() => closeModal('approve')} size="2xl">
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">Review Promotion Recommendation</h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <div className="text-sm space-y-2">
                                    <p><strong>Employee:</strong> {selectedRecommendation?.employee?.name}</p>
                                    <p><strong>Current Position:</strong> {selectedRecommendation?.current_position?.title}</p>
                                    <p><strong>Recommended Position:</strong> {selectedRecommendation?.recommended_position?.title}</p>
                                    <p><strong>Readiness Score:</strong> {selectedRecommendation?.readiness_score}/10</p>
                                    <p><strong>Salary Impact:</strong> {selectedRecommendation?.salary_increase_percentage}%</p>
                                </div>

                                <Textarea
                                    label="HR Comments"
                                    placeholder="Add your review comments..."
                                    value={formData.hr_comments}
                                    onValueChange={(value) => handleFormChange('hr_comments', value)}
                                    radius={themeRadius}
                                />
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('approve')}>Cancel</Button>
                            <Button color="danger" onPress={() => handleApprove(false)}>Reject</Button>
                            <Button color="success" onPress={() => handleApprove(true)}>Approve</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {/* Generate AI Recommendations Modal */}
            {modalStates.generate && (
                <Modal isOpen={modalStates.generate} onOpenChange={() => closeModal('generate')}>
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">Generate AI Recommendations</h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <Select
                                    label="Department"
                                    placeholder="Select department for analysis"
                                    selectedKeys={formData.department_id ? [formData.department_id] : []}
                                    onSelectionChange={(keys) => handleFormChange('department_id', Array.from(keys)[0] || '')}
                                    radius={themeRadius}
                                >
                                    <SelectItem key="all">All Departments</SelectItem>
                                    {departments.map(department => (
                                        <SelectItem key={department.id}>{department.name}</SelectItem>
                                    ))}
                                </Select>

                                <div className="bg-primary-50 p-4 rounded-lg border border-primary-200">
                                    <p className="text-sm text-primary-700">
                                        <strong>AI Analysis Criteria:</strong><br />
                                        • Performance rating ≥ 4.0<br />
                                        • Minimum tenure of 12 months<br />
                                        • Skills alignment with higher positions<br />
                                        • Career progression readiness
                                    </p>
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('generate')}>Cancel</Button>
                            <Button color="primary" onPress={handleGenerateRecommendations}>Generate Recommendations</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {/* Delete Confirmation Modal */}
            {modalStates.delete && (
                <Modal isOpen={modalStates.delete} onOpenChange={() => closeModal('delete')}>
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold text-danger">Delete Promotion Recommendation</h2>
                        </ModalHeader>
                        <ModalBody>
                            <p>Are you sure you want to delete the promotion recommendation for <strong>{selectedRecommendation?.employee?.name}</strong>?</p>
                            <p className="text-sm text-danger">This action cannot be undone and will permanently remove the recommendation data.</p>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('delete')}>Cancel</Button>
                            <Button color="danger" onPress={handleDelete}>Delete Recommendation</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Promotion Recommendations Management">
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
                                                    <ArrowTrendingUpIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Promotion Recommendations
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Manage employee promotion and career advancement recommendations
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2 flex-wrap">
                                                {canRecommend && (
                                                    <>
                                                        <Button 
                                                            color="secondary" 
                                                            variant="flat"
                                                            startContent={<BriefcaseIcon className="w-4 h-4" />}
                                                            onPress={() => openModal('generate')}
                                                            size={isMobile ? "sm" : "md"}
                                                        >
                                                            AI Recommendations
                                                        </Button>
                                                        <Button 
                                                            color="primary" 
                                                            variant="shadow"
                                                            startContent={<PlusIcon className="w-4 h-4" />}
                                                            onPress={() => openModal('recommend')}
                                                            size={isMobile ? "sm" : "md"}
                                                        >
                                                            New Recommendation
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    <StatsCards stats={statsData} isLoading={statsLoading} className="mb-6" />
                                    
                                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                        <Input
                                            label="Search"
                                            placeholder="Search employees or positions..."
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                        />
                                        
                                        <Select
                                            placeholder="All Departments"
                                            selectedKeys={filters.department_id !== 'all' ? [filters.department_id] : []}
                                            onSelectionChange={(keys) => handleFilterChange('department_id', Array.from(keys)[0] || 'all')}
                                        >
                                            <SelectItem key="all">All Departments</SelectItem>
                                            {departments.map(department => (
                                                <SelectItem key={department.id}>{department.name}</SelectItem>
                                            ))}
                                        </Select>

                                        <Select
                                            placeholder="Recommendation Type"
                                            selectedKeys={filters.recommendation_type !== 'all' ? [filters.recommendation_type] : []}
                                            onSelectionChange={(keys) => handleFilterChange('recommendation_type', Array.from(keys)[0] || 'all')}
                                        >
                                            <SelectItem key="all">All Types</SelectItem>
                                            {recommendationTypes.map(type => (
                                                <SelectItem key={type.key}>{type.label}</SelectItem>
                                            ))}
                                        </Select>

                                        <Select
                                            placeholder="Priority"
                                            selectedKeys={filters.priority_level !== 'all' ? [filters.priority_level] : []}
                                            onSelectionChange={(keys) => handleFilterChange('priority_level', Array.from(keys)[0] || 'all')}
                                        >
                                            <SelectItem key="all">All Priorities</SelectItem>
                                            {priorityLevels.map(priority => (
                                                <SelectItem key={priority.key}>{priority.label}</SelectItem>
                                            ))}
                                        </Select>

                                        <Select
                                            placeholder="Status"
                                            selectedKeys={filters.status !== 'all' ? [filters.status] : []}
                                            onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || 'all')}
                                        >
                                            <SelectItem key="all">All Statuses</SelectItem>
                                            {statuses.map(status => (
                                                <SelectItem key={status.key}>{status.label}</SelectItem>
                                            ))}
                                        </Select>
                                    </div>
                                    
                                    <Table 
                                        aria-label="Promotion Recommendations" 
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
                                            items={recommendations} 
                                            emptyContent={loading ? "Loading..." : "No promotion recommendations found"}
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

PromotionRecommendations.layout = (page) => <App children={page} />;
export default PromotionRecommendations;