import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Textarea, Avatar, Tabs, Tab, Progress } from "@heroui/react";
import { 
    ChartBarIcon,
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
    AdjustmentsHorizontalIcon,
    ArrowTrendingUpIcon,
    ListBulletIcon,
    ArrowPathIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const ScoreAggregation = ({ title, performanceCycles = [], employees = [], departments = [], evaluations = [] }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete } = useHRMAC();
    
    // Theme radius helper
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
    const [processing, setProcessing] = useState(false);
    const [statsLoading, setStatsLoading] = useState(true);
    const [scoreData, setScoreData] = useState([]);
    const [filters, setFilters] = useState({ 
        search: '', 
        cycle_id: 'all', 
        department_id: 'all',
        status: 'all',
        score_range: 'all',
        aggregation_method: 'all'
    });
    const [pagination, setPagination] = useState({ currentPage: 1, perPage: 20, total: 0, lastPage: 1 });
    const [stats, setStats] = useState({ 
        total_scores: 0, 
        completed_aggregations: 0, 
        pending_aggregations: 0, 
        avg_score: 0,
        high_performers: 0,
        improvement_needed: 0
    });
    const [modalStates, setModalStates] = useState({ aggregate: false, edit: false, delete: false, view: false, recalculate: false, bulk: false });
    const [selectedScore, setSelectedScore] = useState(null);
    const [formData, setFormData] = useState({
        employee_id: '',
        cycle_id: '',
        aggregation_method: 'weighted_average', // weighted_average, simple_average, highest, latest
        
        // Score components with weights
        goal_scores: [],
        competency_scores: [],
        feedback_scores: [],
        self_assessment_scores: [],
        
        // Aggregation settings
        goal_weight: '50',
        competency_weight: '30',
        feedback_weight: '15',
        self_assessment_weight: '5',
        
        // Calculated results
        raw_score: 0,
        weighted_score: 0,
        final_score: 0,
        
        // Performance rating
        performance_rating: '', // excellent, exceeds, meets, below, unsatisfactory
        percentile_rank: 0,
        
        // Metadata
        calculation_date: new Date().toISOString().split('T')[0],
        reviewer_notes: '',
        adjustment_factor: '0',
        adjustment_reason: '',
        
        // Status
        status: 'pending', // pending, approved, revised, final
        approved_by: '',
        approved_date: '',
        
        // Historical tracking
        previous_score: 0,
        score_trend: '', // improving, declining, stable
        rank_change: 0
    });

    // Permission checks
    const canAggregate = canCreate('hrm.performance.scores');
    const canEditScores = canUpdate('hrm.performance.scores');
    const canDeleteScores = canDelete('hrm.performance.scores');

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { 
            title: "Total Scores", 
            value: stats.total_scores, 
            icon: <ChartBarIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Completed", 
            value: stats.completed_aggregations, 
            icon: <CheckBadgeIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "Average Score", 
            value: `${stats.avg_score}/5.0`, 
            icon: <StarIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "High Performers", 
            value: stats.high_performers, 
            icon: <TrophyIcon className="w-6 h-6" />, 
            color: "text-danger", 
            iconBg: "bg-danger/20" 
        },
    ], [stats]);

    // Performance configuration
    const aggregationMethods = [
        { 
            key: 'weighted_average', 
            label: 'Weighted Average', 
            description: 'Scores weighted by importance' 
        },
        { 
            key: 'simple_average', 
            label: 'Simple Average', 
            description: 'Equal weight for all components' 
        },
        { 
            key: 'highest', 
            label: 'Highest Score', 
            description: 'Takes the highest component score' 
        },
        { 
            key: 'latest', 
            label: 'Latest Evaluation', 
            description: 'Uses most recent evaluation only' 
        },
    ];

    const performanceRatings = [
        { key: 'excellent', label: 'Excellent (4.5-5.0)', color: 'success', range: [4.5, 5.0] },
        { key: 'exceeds', label: 'Exceeds Expectations (3.5-4.49)', color: 'primary', range: [3.5, 4.49] },
        { key: 'meets', label: 'Meets Expectations (2.5-3.49)', color: 'warning', range: [2.5, 3.49] },
        { key: 'below', label: 'Below Expectations (1.5-2.49)', color: 'danger', range: [1.5, 2.49] },
        { key: 'unsatisfactory', label: 'Unsatisfactory (0-1.49)', color: 'default', range: [0, 1.49] },
    ];

    const scoreRanges = [
        { key: 'excellent', label: 'Excellent (4.5+)', color: 'success' },
        { key: 'good', label: 'Good (3.5-4.4)', color: 'primary' },
        { key: 'average', label: 'Average (2.5-3.4)', color: 'warning' },
        { key: 'poor', label: 'Poor (Below 2.5)', color: 'danger' },
    ];

    const getPerformanceRating = (score) => {
        return performanceRatings.find(r => score >= r.range[0] && score <= r.range[1]) || performanceRatings[4];
    };

    const getRatingColor = (rating) => {
        return performanceRatings.find(r => r.key === rating)?.color || 'default';
    };

    const getRatingLabel = (rating) => {
        return performanceRatings.find(r => r.key === rating)?.label || rating;
    };

    const getScoreColor = (score) => {
        if (score >= 4.5) return 'success';
        if (score >= 3.5) return 'primary';
        if (score >= 2.5) return 'warning';
        return 'danger';
    };

    const getTrendIcon = (trend) => {
        switch (trend) {
            case 'improving':
                return <ArrowTrendingUpIcon className="w-4 h-4 text-success" />;
            case 'declining':
                return <ArrowTrendingUpIcon className="w-4 h-4 text-danger rotate-180" />;
            default:
                return <ArrowPathIcon className="w-4 h-4 text-default-400" />;
        }
    };

    // Score calculation functions
    const calculateWeightedScore = (scores, weights) => {
        const totalWeight = Object.values(weights).reduce((sum, weight) => sum + parseFloat(weight || 0), 0);
        if (totalWeight === 0) return 0;

        let weightedSum = 0;
        Object.entries(scores).forEach(([key, scoreList]) => {
            const weight = parseFloat(weights[`${key}_weight`] || 0);
            const avgScore = scoreList.reduce((sum, score) => sum + parseFloat(score || 0), 0) / (scoreList.length || 1);
            weightedSum += avgScore * weight;
        });

        return (weightedSum / totalWeight).toFixed(2);
    };

    const calculateSimpleAverage = (scores) => {
        const allScores = Object.values(scores).flat().filter(score => score);
        if (allScores.length === 0) return 0;
        const sum = allScores.reduce((sum, score) => sum + parseFloat(score), 0);
        return (sum / allScores.length).toFixed(2);
    };

    const calculateFinalScore = () => {
        const scores = {
            goals: formData.goal_scores,
            competency: formData.competency_scores,
            feedback: formData.feedback_scores,
            self_assessment: formData.self_assessment_scores
        };

        const weights = {
            goals_weight: formData.goal_weight,
            competency_weight: formData.competency_weight,
            feedback_weight: formData.feedback_weight,
            self_assessment_weight: formData.self_assessment_weight
        };

        let calculatedScore = 0;
        
        switch (formData.aggregation_method) {
            case 'weighted_average':
                calculatedScore = calculateWeightedScore(scores, weights);
                break;
            case 'simple_average':
                calculatedScore = calculateSimpleAverage(scores);
                break;
            case 'highest':
                const allScores = Object.values(scores).flat().filter(score => score);
                calculatedScore = allScores.length > 0 ? Math.max(...allScores.map(s => parseFloat(s))).toFixed(2) : 0;
                break;
            case 'latest':
                // Implementation would depend on timestamp data
                calculatedScore = calculateSimpleAverage(scores);
                break;
            default:
                calculatedScore = calculateWeightedScore(scores, weights);
        }

        // Apply adjustment factor
        const adjustment = parseFloat(formData.adjustment_factor || 0);
        const finalScore = Math.max(0, Math.min(5, parseFloat(calculatedScore) + adjustment)).toFixed(2);
        
        return {
            raw: calculatedScore,
            final: finalScore,
            rating: getPerformanceRating(parseFloat(finalScore))
        };
    };

    // Data fetching
    const fetchScores = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.performance.scores.paginate'), {
                params: { 
                    page: pagination.currentPage, 
                    perPage: pagination.perPage,
                    ...filters
                }
            });
            if (response.status === 200) {
                setScoreData(response.data.scores || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total || 0,
                    lastPage: response.data.last_page || 1
                }));
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to fetch performance scores'
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('hrm.performance.scores.stats'));
            if (response.status === 200) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch score stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchScores();
        fetchStats();
    }, [fetchScores, fetchStats]);

    // CRUD operations
    const handleSubmit = async () => {
        const calculationResults = calculateFinalScore();
        
        const submissionData = { 
            ...formData,
            raw_score: calculationResults.raw,
            final_score: calculationResults.final,
            performance_rating: calculationResults.rating.key
        };

        const promise = new Promise(async (resolve, reject) => {
            try {
                const url = selectedScore 
                    ? route('hrm.performance.scores.update', selectedScore.id)
                    : route('hrm.performance.scores.store');
                
                const response = await axios({
                    method: selectedScore ? 'PUT' : 'POST',
                    url,
                    data: submissionData
                });
                
                if (response.status === 200) {
                    resolve([response.data.message || `Score ${selectedScore ? 'updated' : 'aggregated'} successfully`]);
                    fetchScores();
                    fetchStats();
                    closeModal(selectedScore ? 'edit' : 'aggregate');
                    resetForm();
                }
            } catch (error) {
                reject(error.response?.data?.errors || [`Failed to ${selectedScore ? 'update' : 'aggregate'} score`]);
            }
        });

        showToast.promise(promise, {
            loading: `${selectedScore ? 'Updating' : 'Aggregating'} performance score...`,
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleRecalculate = async () => {
        if (!selectedScore) return;

        setProcessing(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('hrm.performance.scores.recalculate', selectedScore.id));
                if (response.status === 200) {
                    resolve([response.data.message || 'Score recalculated successfully']);
                    fetchScores();
                    fetchStats();
                    closeModal('recalculate');
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to recalculate score']);
            }
        });

        showToast.promise(promise, {
            loading: 'Recalculating performance score...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
        
        setProcessing(false);
    };

    const handleBulkAggregate = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('hrm.performance.scores.bulk-aggregate'), {
                    cycle_id: formData.cycle_id,
                    department_id: formData.department_id,
                    aggregation_method: formData.aggregation_method
                });
                if (response.status === 200) {
                    resolve([response.data.message || 'Bulk aggregation completed successfully']);
                    fetchScores();
                    fetchStats();
                    closeModal('bulk');
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to perform bulk aggregation']);
            }
        });

        showToast.promise(promise, {
            loading: 'Processing bulk aggregation...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleDelete = async () => {
        if (!selectedScore) return;

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('hrm.performance.scores.destroy', selectedScore.id));
                if (response.status === 200) {
                    resolve([response.data.message || 'Score deleted successfully']);
                    fetchScores();
                    fetchStats();
                    closeModal('delete');
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to delete score']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting performance score...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Modal handlers
    const openModal = (type, score = null) => {
        setSelectedScore(score);
        if (score && (type === 'edit' || type === 'view' || type === 'recalculate')) {
            setFormData({
                employee_id: score.employee_id || '',
                cycle_id: score.cycle_id || '',
                aggregation_method: score.aggregation_method || 'weighted_average',
                
                goal_scores: score.goal_scores || [],
                competency_scores: score.competency_scores || [],
                feedback_scores: score.feedback_scores || [],
                self_assessment_scores: score.self_assessment_scores || [],
                
                goal_weight: score.goal_weight || '50',
                competency_weight: score.competency_weight || '30',
                feedback_weight: score.feedback_weight || '15',
                self_assessment_weight: score.self_assessment_weight || '5',
                
                raw_score: score.raw_score || 0,
                weighted_score: score.weighted_score || 0,
                final_score: score.final_score || 0,
                
                performance_rating: score.performance_rating || '',
                percentile_rank: score.percentile_rank || 0,
                
                calculation_date: score.calculation_date || new Date().toISOString().split('T')[0],
                reviewer_notes: score.reviewer_notes || '',
                adjustment_factor: score.adjustment_factor || '0',
                adjustment_reason: score.adjustment_reason || '',
                
                status: score.status || 'pending',
                approved_by: score.approved_by || '',
                approved_date: score.approved_date || '',
                
                previous_score: score.previous_score || 0,
                score_trend: score.score_trend || '',
                rank_change: score.rank_change || 0
            });
        }
        setModalStates(prev => ({ ...prev, [type]: true }));
    };

    const closeModal = (type) => {
        setModalStates(prev => ({ ...prev, [type]: false }));
        setSelectedScore(null);
    };

    const resetForm = () => {
        setFormData({
            employee_id: '',
            cycle_id: '',
            aggregation_method: 'weighted_average',
            
            goal_scores: [],
            competency_scores: [],
            feedback_scores: [],
            self_assessment_scores: [],
            
            goal_weight: '50',
            competency_weight: '30',
            feedback_weight: '15',
            self_assessment_weight: '5',
            
            raw_score: 0,
            weighted_score: 0,
            final_score: 0,
            
            performance_rating: '',
            percentile_rank: 0,
            
            calculation_date: new Date().toISOString().split('T')[0],
            reviewer_notes: '',
            adjustment_factor: '0',
            adjustment_reason: '',
            
            status: 'pending',
            approved_by: '',
            approved_date: '',
            
            previous_score: 0,
            score_trend: '',
            rank_change: 0
        });
    };

    // Filter handlers
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    // Form handlers
    const handleFormChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    // Table columns
    const columns = [
        { uid: 'employee', name: 'Employee' },
        { uid: 'cycle', name: 'Performance Cycle' },
        { uid: 'scores', name: 'Component Scores' },
        { uid: 'final_score', name: 'Final Score' },
        { uid: 'rating', name: 'Performance Rating' },
        { uid: 'trend', name: 'Trend' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = useCallback((scoreItem, columnKey) => {
        switch (columnKey) {
            case 'employee':
                return (
                    <div className="flex items-center gap-3">
                        <Avatar 
                            src={scoreItem.employee?.avatar} 
                            name={scoreItem.employee?.name} 
                            size="sm"
                        />
                        <div>
                            <p className="font-medium">{scoreItem.employee?.name}</p>
                            <p className="text-xs text-default-500">{scoreItem.employee?.department}</p>
                        </div>
                    </div>
                );
            case 'cycle':
                return (
                    <div>
                        <p className="font-medium">{scoreItem.cycle?.name}</p>
                        <p className="text-xs text-default-500">{scoreItem.cycle?.period}</p>
                    </div>
                );
            case 'scores':
                const components = [
                    { label: 'Goals', value: scoreItem.goal_average, color: 'primary' },
                    { label: 'Comp', value: scoreItem.competency_average, color: 'secondary' },
                    { label: 'Feed', value: scoreItem.feedback_average, color: 'success' },
                    { label: 'Self', value: scoreItem.self_average, color: 'warning' }
                ].filter(s => s.value);

                return (
                    <div className="flex flex-wrap gap-1">
                        {components.map(component => (
                            <Chip 
                                key={component.label}
                                color={component.color} 
                                size="sm" 
                                variant="flat"
                            >
                                {component.label}: {parseFloat(component.value).toFixed(1)}
                            </Chip>
                        ))}
                    </div>
                );
            case 'final_score':
                return (
                    <div className="flex items-center gap-2">
                        <Chip 
                            color={getScoreColor(parseFloat(scoreItem.final_score))} 
                            size="sm" 
                            variant="solid"
                            startContent={<StarIcon className="w-3 h-3" />}
                        >
                            {parseFloat(scoreItem.final_score).toFixed(2)}
                        </Chip>
                        <Progress
                            value={(parseFloat(scoreItem.final_score) / 5) * 100}
                            color={getScoreColor(parseFloat(scoreItem.final_score))}
                            size="sm"
                            className="w-12"
                        />
                    </div>
                );
            case 'rating':
                return (
                    <Chip 
                        color={getRatingColor(scoreItem.performance_rating)} 
                        size="sm" 
                        variant="flat"
                    >
                        {getRatingLabel(scoreItem.performance_rating)}
                    </Chip>
                );
            case 'trend':
                return (
                    <div className="flex items-center gap-2">
                        {getTrendIcon(scoreItem.score_trend)}
                        <span className="text-sm">
                            {scoreItem.rank_change !== 0 && (
                                <span className={scoreItem.rank_change > 0 ? 'text-success' : 'text-danger'}>
                                    {scoreItem.rank_change > 0 ? '+' : ''}{scoreItem.rank_change}
                                </span>
                            )}
                        </span>
                    </div>
                );
            case 'status':
                const statusColorMap = {
                    pending: 'warning',
                    approved: 'success',
                    revised: 'primary',
                    final: 'default'
                };
                return (
                    <Chip 
                        color={statusColorMap[scoreItem.status] || 'default'} 
                        size="sm" 
                        variant="flat"
                    >
                        {scoreItem.status?.charAt(0).toUpperCase() + scoreItem.status?.slice(1) || 'Pending'}
                    </Chip>
                );
            case 'actions':
                return (
                    <div className="flex items-center gap-1">
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => openModal('view', scoreItem)}
                        >
                            <EyeIcon className="w-4 h-4" />
                        </Button>
                        {canEditScores && (
                            <>
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    onPress={() => openModal('edit', scoreItem)}
                                >
                                    <PencilIcon className="w-4 h-4" />
                                </Button>
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    color="primary"
                                    onPress={() => openModal('recalculate', scoreItem)}
                                >
                                    <ArrowPathIcon className="w-4 h-4" />
                                </Button>
                            </>
                        )}
                        {canDeleteScores && (
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={() => openModal('delete', scoreItem)}
                            >
                                <TrashIcon className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                );
            default:
                return scoreItem[columnKey] || '-';
        }
    }, [canEditScores, canDeleteScores]);

    return (
        <>
            <Head title={title} />
            
            {/* Aggregate/Edit Score Modal */}
            {(modalStates.aggregate || modalStates.edit) && (
                <Modal 
                    isOpen={modalStates.aggregate || modalStates.edit} 
                    onOpenChange={() => closeModal(modalStates.aggregate ? 'aggregate' : 'edit')}
                    size="5xl"
                    scrollBehavior="inside"
                >
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">
                                {selectedScore ? 'Edit Score Aggregation' : 'Create Score Aggregation'}
                            </h2>
                        </ModalHeader>
                        <ModalBody>
                            <Tabs aria-label="Score Aggregation Form">
                                <Tab key="basic" title="Basic Info">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Select
                                                label="Employee"
                                                placeholder="Select employee"
                                                selectedKeys={formData.employee_id ? [formData.employee_id] : []}
                                                onSelectionChange={(keys) => handleFormChange('employee_id', Array.from(keys)[0] || '')}
                                                isRequired
                                                radius={getThemeRadius()}
                                            >
                                                {employees.map(employee => (
                                                    <SelectItem key={employee.id}>
                                                        {employee.name} ({employee.department})
                                                    </SelectItem>
                                                ))}
                                            </Select>

                                            <Select
                                                label="Performance Cycle"
                                                placeholder="Select cycle"
                                                selectedKeys={formData.cycle_id ? [formData.cycle_id] : []}
                                                onSelectionChange={(keys) => handleFormChange('cycle_id', Array.from(keys)[0] || '')}
                                                isRequired
                                                radius={getThemeRadius()}
                                            >
                                                {performanceCycles.map(cycle => (
                                                    <SelectItem key={cycle.id}>{cycle.name}</SelectItem>
                                                ))}
                                            </Select>
                                        </div>

                                        <Select
                                            label="Aggregation Method"
                                            selectedKeys={[formData.aggregation_method]}
                                            onSelectionChange={(keys) => handleFormChange('aggregation_method', Array.from(keys)[0])}
                                            radius={getThemeRadius()}
                                        >
                                            {aggregationMethods.map(method => (
                                                <SelectItem key={method.key} description={method.description}>
                                                    {method.label}
                                                </SelectItem>
                                            ))}
                                        </Select>

                                        <Input
                                            label="Calculation Date"
                                            type="date"
                                            value={formData.calculation_date}
                                            onValueChange={(value) => handleFormChange('calculation_date', value)}
                                            radius={getThemeRadius()}
                                        />
                                    </div>
                                </Tab>

                                <Tab key="weights" title="Component Weights">
                                    <div className="space-y-4">
                                        <p className="text-sm text-default-600">Configure the weight of each performance component (total should equal 100%)</p>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input
                                                label="Goals Weight (%)"
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={formData.goal_weight}
                                                onValueChange={(value) => handleFormChange('goal_weight', value)}
                                                radius={getThemeRadius()}
                                                color={formData.aggregation_method === 'weighted_average' ? 'primary' : 'default'}
                                                isDisabled={formData.aggregation_method !== 'weighted_average'}
                                            />

                                            <Input
                                                label="Competency Weight (%)"
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={formData.competency_weight}
                                                onValueChange={(value) => handleFormChange('competency_weight', value)}
                                                radius={getThemeRadius()}
                                                color={formData.aggregation_method === 'weighted_average' ? 'primary' : 'default'}
                                                isDisabled={formData.aggregation_method !== 'weighted_average'}
                                            />

                                            <Input
                                                label="Feedback Weight (%)"
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={formData.feedback_weight}
                                                onValueChange={(value) => handleFormChange('feedback_weight', value)}
                                                radius={getThemeRadius()}
                                                color={formData.aggregation_method === 'weighted_average' ? 'primary' : 'default'}
                                                isDisabled={formData.aggregation_method !== 'weighted_average'}
                                            />

                                            <Input
                                                label="Self Assessment Weight (%)"
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={formData.self_assessment_weight}
                                                onValueChange={(value) => handleFormChange('self_assessment_weight', value)}
                                                radius={getThemeRadius()}
                                                color={formData.aggregation_method === 'weighted_average' ? 'primary' : 'default'}
                                                isDisabled={formData.aggregation_method !== 'weighted_average'}
                                            />
                                        </div>

                                        <div className="bg-default-100 p-4 rounded-lg">
                                            <p className="text-sm font-medium mb-2">Weight Distribution Check</p>
                                            <div className="text-sm">
                                                Total Weight: <span className={`font-bold ${
                                                    (parseFloat(formData.goal_weight) + parseFloat(formData.competency_weight) + 
                                                     parseFloat(formData.feedback_weight) + parseFloat(formData.self_assessment_weight)) === 100 
                                                    ? 'text-success' : 'text-danger'
                                                }`}>
                                                    {(parseFloat(formData.goal_weight || 0) + parseFloat(formData.competency_weight || 0) + 
                                                      parseFloat(formData.feedback_weight || 0) + parseFloat(formData.self_assessment_weight || 0))}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Tab>

                                <Tab key="adjustment" title="Score Adjustment">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Adjustment Factor"
                                                type="number"
                                                step="0.1"
                                                min="-2"
                                                max="2"
                                                value={formData.adjustment_factor}
                                                onValueChange={(value) => handleFormChange('adjustment_factor', value)}
                                                radius={getThemeRadius()}
                                                description="Adjustment to final score (-2 to +2)"
                                            />
                                        </div>

                                        <Textarea
                                            label="Adjustment Reason"
                                            placeholder="Reason for score adjustment..."
                                            value={formData.adjustment_reason}
                                            onValueChange={(value) => handleFormChange('adjustment_reason', value)}
                                            radius={getThemeRadius()}
                                        />

                                        <Textarea
                                            label="Reviewer Notes"
                                            placeholder="Additional notes about this performance evaluation..."
                                            value={formData.reviewer_notes}
                                            onValueChange={(value) => handleFormChange('reviewer_notes', value)}
                                            radius={getThemeRadius()}
                                        />

                                        {/* Score Preview */}
                                        <Card className="bg-default-50">
                                            <CardBody className="text-center py-6">
                                                <p className="text-sm text-default-600 mb-4">Score Preview</p>
                                                <div className="space-y-2">
                                                    <div className="text-4xl font-bold text-primary">
                                                        {calculateFinalScore().final}
                                                    </div>
                                                    <Chip 
                                                        color={calculateFinalScore().rating.color} 
                                                        variant="flat" 
                                                        size="lg"
                                                    >
                                                        {calculateFinalScore().rating.label}
                                                    </Chip>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    </div>
                                </Tab>
                            </Tabs>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal(modalStates.aggregate ? 'aggregate' : 'edit')}>
                                Cancel
                            </Button>
                            <Button color="primary" onPress={handleSubmit}>
                                {selectedScore ? 'Update Score' : 'Aggregate Score'}
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {/* Bulk Aggregation Modal */}
            {modalStates.bulk && (
                <Modal isOpen={modalStates.bulk} onOpenChange={() => closeModal('bulk')} size="2xl">
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">Bulk Score Aggregation</h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <Select
                                    label="Performance Cycle"
                                    placeholder="Select cycle for bulk processing"
                                    selectedKeys={formData.cycle_id ? [formData.cycle_id] : []}
                                    onSelectionChange={(keys) => handleFormChange('cycle_id', Array.from(keys)[0] || '')}
                                    isRequired
                                    radius={getThemeRadius()}
                                >
                                    {performanceCycles.map(cycle => (
                                        <SelectItem key={cycle.id}>{cycle.name}</SelectItem>
                                    ))}
                                </Select>

                                <Select
                                    label="Department (Optional)"
                                    placeholder="Select department or leave empty for all"
                                    selectedKeys={formData.department_id && formData.department_id !== 'all' ? [formData.department_id] : []}
                                    onSelectionChange={(keys) => handleFormChange('department_id', Array.from(keys)[0] || 'all')}
                                    radius={getThemeRadius()}
                                >
                                    <SelectItem key="all">All Departments</SelectItem>
                                    {departments.map(department => (
                                        <SelectItem key={department.id}>{department.name}</SelectItem>
                                    ))}
                                </Select>

                                <Select
                                    label="Aggregation Method"
                                    selectedKeys={[formData.aggregation_method]}
                                    onSelectionChange={(keys) => handleFormChange('aggregation_method', Array.from(keys)[0])}
                                    radius={getThemeRadius()}
                                >
                                    {aggregationMethods.map(method => (
                                        <SelectItem key={method.key} description={method.description}>
                                            {method.label}
                                        </SelectItem>
                                    ))}
                                </Select>

                                <div className="bg-warning-50 p-4 rounded-lg border border-warning-200">
                                    <p className="text-sm text-warning-700">
                                        <strong>Note:</strong> This will process all eligible employees in the selected cycle/department. 
                                        Existing aggregations will be recalculated.
                                    </p>
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('bulk')}>Cancel</Button>
                            <Button color="primary" onPress={handleBulkAggregate}>Process Bulk Aggregation</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {/* Recalculate Confirmation Modal */}
            {modalStates.recalculate && (
                <Modal isOpen={modalStates.recalculate} onOpenChange={() => closeModal('recalculate')}>
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">Recalculate Performance Score</h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <p>Recalculate the performance score for <strong>{selectedScore?.employee?.name}</strong>?</p>
                                <p className="text-sm text-default-600">
                                    This will fetch the latest evaluation data and recalculate the aggregated score using 
                                    the current aggregation method and weights.
                                </p>
                                
                                <div className="bg-default-100 p-4 rounded-lg">
                                    <p className="text-sm"><strong>Current Score:</strong> {selectedScore?.final_score}</p>
                                    <p className="text-sm"><strong>Method:</strong> {selectedScore?.aggregation_method}</p>
                                    <p className="text-sm"><strong>Last Updated:</strong> {selectedScore?.updated_at}</p>
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('recalculate')}>Cancel</Button>
                            <Button color="primary" onPress={handleRecalculate} isLoading={processing}>
                                Recalculate Score
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {/* Delete Confirmation Modal */}
            {modalStates.delete && (
                <Modal isOpen={modalStates.delete} onOpenChange={() => closeModal('delete')}>
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold text-danger">Delete Performance Score</h2>
                        </ModalHeader>
                        <ModalBody>
                            <p>Are you sure you want to delete the performance score for <strong>{selectedScore?.employee?.name}</strong>?</p>
                            <p className="text-sm text-danger">This action cannot be undone and will permanently remove the aggregated score data.</p>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('delete')}>Cancel</Button>
                            <Button color="danger" onPress={handleDelete}>Delete Score</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Score Aggregation Management">
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
                                                    <ChartBarIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Score Aggregation
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Aggregate and manage performance scores
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2 flex-wrap">
                                                {canAggregate && (
                                                    <>
                                                        <Button 
                                                            color="secondary" 
                                                            variant="flat"
                                                            startContent={<ListBulletIcon className="w-4 h-4" />}
                                                            onPress={() => openModal('bulk')}
                                                            size={isMobile ? "sm" : "md"}
                                                        >
                                                            Bulk Aggregate
                                                        </Button>
                                                        <Button 
                                                            color="primary" 
                                                            variant="shadow"
                                                            startContent={<PlusIcon className="w-4 h-4" />}
                                                            onPress={() => openModal('aggregate')}
                                                            size={isMobile ? "sm" : "md"}
                                                        >
                                                            New Aggregation
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
                                            placeholder="Search employees..."
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                                            variant="bordered"
                                            size="sm"
                                            radius={getThemeRadius()}
                                        />
                                        
                                        <Select
                                            placeholder="All Cycles"
                                            selectedKeys={filters.cycle_id !== 'all' ? [filters.cycle_id] : []}
                                            onSelectionChange={(keys) => handleFilterChange('cycle_id', Array.from(keys)[0] || 'all')}
                                        >
                                            <SelectItem key="all">All Cycles</SelectItem>
                                            {performanceCycles.map(cycle => (
                                                <SelectItem key={cycle.id}>{cycle.name}</SelectItem>
                                            ))}
                                        </Select>

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
                                            placeholder="Score Range"
                                            selectedKeys={filters.score_range !== 'all' ? [filters.score_range] : []}
                                            onSelectionChange={(keys) => handleFilterChange('score_range', Array.from(keys)[0] || 'all')}
                                        >
                                            <SelectItem key="all">All Ranges</SelectItem>
                                            {scoreRanges.map(range => (
                                                <SelectItem key={range.key}>{range.label}</SelectItem>
                                            ))}
                                        </Select>
                                    </div>
                                    
                                    <Table 
                                        aria-label="Performance Scores" 
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
                                            items={scoreData} 
                                            emptyContent={loading ? "Loading..." : "No performance scores found"}
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

ScoreAggregation.layout = (page) => <App children={page} />;
export default ScoreAggregation;