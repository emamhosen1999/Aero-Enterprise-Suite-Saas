import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Textarea, Avatar, Tabs, Tab } from "@heroui/react";
import { 
    StarIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    CalendarDaysIcon,
    UserIcon,
    BuildingOfficeIcon,
    ChartBarIcon,
    DocumentCheckIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    AcademicCapIcon,
    TrophyIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import { useHRMAC } from '@/Hooks/access/useHRMAC';

const EvaluationScores = ({ title, interviews = [], evaluationCriteria = [], interviewers = [], candidates = [] }) => {
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
    const [evaluations, setEvaluations] = useState([]);
    const [filters, setFilters] = useState({ 
        search: '', 
        interview_id: 'all', 
        interviewer_id: 'all',
        status: 'all',
        score_range: 'all'
    });
    const [pagination, setPagination] = useState({ currentPage: 1, perPage: 20, total: 0, lastPage: 1 });
    const [stats, setStats] = useState({ 
        total_evaluations: 0, 
        completed_evaluations: 0, 
        avg_score: 0, 
        pending_evaluations: 0,
        top_scorers: 0,
        poor_performers: 0
    });
    const [modalStates, setModalStates] = useState({ add: false, edit: false, delete: false, view: false });
    const [selectedEvaluation, setSelectedEvaluation] = useState(null);
    const [formData, setFormData] = useState({
        interview_id: '',
        interviewer_id: '',
        candidate_id: '',
        
        // Scoring criteria
        technical_skills: '',
        communication: '',
        problem_solving: '',
        cultural_fit: '',
        experience: '',
        leadership: '',
        
        // Overall assessment
        overall_score: '',
        recommendation: 'pending', // hire, reject, pending, maybe
        strengths: '',
        weaknesses: '',
        comments: '',
        follow_up_required: false,
        
        // Additional fields
        interview_date: new Date().toISOString().split('T')[0],
        duration_minutes: '',
        next_round_recommended: false,
        salary_expectation_met: true
    });

    // Permission checks
    const canScore = canCreate('hrm.recruitment.evaluations');
    const canEditScores = canUpdate('hrm.recruitment.evaluations');
    const canDeleteScores = canDelete('hrm.recruitment.evaluations');

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { 
            title: "Total Evaluations", 
            value: stats.total_evaluations, 
            icon: <DocumentCheckIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Completed", 
            value: stats.completed_evaluations, 
            icon: <CheckCircleIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "Average Score", 
            value: `${stats.avg_score}/10`, 
            icon: <StarIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Pending", 
            value: stats.pending_evaluations, 
            icon: <ClockIcon className="w-6 h-6" />, 
            color: "text-danger", 
            iconBg: "bg-danger/20" 
        },
    ], [stats]);

    // Evaluation configuration
    const recommendations = [
        { key: 'hire', label: 'Strong Hire', color: 'success' },
        { key: 'maybe', label: 'Maybe Hire', color: 'warning' },
        { key: 'reject', label: 'No Hire', color: 'danger' },
        { key: 'pending', label: 'Pending Review', color: 'default' },
    ];

    const scoreRanges = [
        { key: 'excellent', label: 'Excellent (9-10)', color: 'success' },
        { key: 'good', label: 'Good (7-8)', color: 'primary' },
        { key: 'average', label: 'Average (5-6)', color: 'warning' },
        { key: 'poor', label: 'Poor (1-4)', color: 'danger' },
    ];

    const getRecommendationColor = (recommendation) => {
        return recommendations.find(r => r.key === recommendation)?.color || 'default';
    };

    const getRecommendationLabel = (recommendation) => {
        return recommendations.find(r => r.key === recommendation)?.label || recommendation;
    };

    const getScoreColor = (score) => {
        if (score >= 9) return 'success';
        if (score >= 7) return 'primary';
        if (score >= 5) return 'warning';
        return 'danger';
    };

    const calculateOverallScore = (scores) => {
        const validScores = Object.values(scores).filter(score => score && !isNaN(parseFloat(score)));
        if (validScores.length === 0) return 0;
        const total = validScores.reduce((sum, score) => sum + parseFloat(score), 0);
        return (total / validScores.length).toFixed(1);
    };

    // Data fetching
    const fetchEvaluations = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.recruitment.evaluations.paginate'), {
                params: { 
                    page: pagination.currentPage, 
                    perPage: pagination.perPage,
                    ...filters
                }
            });
            if (response.status === 200) {
                setEvaluations(response.data.evaluations || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total || 0,
                    lastPage: response.data.last_page || 1
                }));
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to fetch evaluation scores'
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('hrm.recruitment.evaluations.stats'));
            if (response.status === 200) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch evaluation stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvaluations();
        fetchStats();
    }, [fetchEvaluations, fetchStats]);

    // CRUD operations
    const handleSubmit = async () => {
        const calculatedScore = calculateOverallScore({
            technical_skills: formData.technical_skills,
            communication: formData.communication,
            problem_solving: formData.problem_solving,
            cultural_fit: formData.cultural_fit,
            experience: formData.experience,
            leadership: formData.leadership
        });

        const submissionData = { 
            ...formData, 
            overall_score: calculatedScore 
        };

        const promise = new Promise(async (resolve, reject) => {
            try {
                const url = selectedEvaluation 
                    ? route('hrm.recruitment.evaluations.update', selectedEvaluation.id)
                    : route('hrm.recruitment.evaluations.store');
                
                const response = await axios({
                    method: selectedEvaluation ? 'PUT' : 'POST',
                    url,
                    data: submissionData
                });
                
                if (response.status === 200) {
                    resolve([response.data.message || `Evaluation ${selectedEvaluation ? 'updated' : 'submitted'} successfully`]);
                    fetchEvaluations();
                    fetchStats();
                    closeModal(selectedEvaluation ? 'edit' : 'add');
                    resetForm();
                }
            } catch (error) {
                reject(error.response?.data?.errors || [`Failed to ${selectedEvaluation ? 'update' : 'submit'} evaluation`]);
            }
        });

        showToast.promise(promise, {
            loading: `${selectedEvaluation ? 'Updating' : 'Submitting'} evaluation...`,
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleDelete = async () => {
        if (!selectedEvaluation) return;

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('hrm.recruitment.evaluations.destroy', selectedEvaluation.id));
                if (response.status === 200) {
                    resolve([response.data.message || 'Evaluation deleted successfully']);
                    fetchEvaluations();
                    fetchStats();
                    closeModal('delete');
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to delete evaluation']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting evaluation...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Modal handlers
    const openModal = (type, evaluation = null) => {
        setSelectedEvaluation(evaluation);
        if (evaluation && (type === 'edit' || type === 'view')) {
            setFormData({
                interview_id: evaluation.interview_id || '',
                interviewer_id: evaluation.interviewer_id || '',
                candidate_id: evaluation.candidate_id || '',
                
                technical_skills: evaluation.technical_skills || '',
                communication: evaluation.communication || '',
                problem_solving: evaluation.problem_solving || '',
                cultural_fit: evaluation.cultural_fit || '',
                experience: evaluation.experience || '',
                leadership: evaluation.leadership || '',
                
                overall_score: evaluation.overall_score || '',
                recommendation: evaluation.recommendation || 'pending',
                strengths: evaluation.strengths || '',
                weaknesses: evaluation.weaknesses || '',
                comments: evaluation.comments || '',
                follow_up_required: evaluation.follow_up_required || false,
                
                interview_date: evaluation.interview_date || new Date().toISOString().split('T')[0],
                duration_minutes: evaluation.duration_minutes || '',
                next_round_recommended: evaluation.next_round_recommended || false,
                salary_expectation_met: evaluation.salary_expectation_met !== false
            });
        }
        setModalStates(prev => ({ ...prev, [type]: true }));
    };

    const closeModal = (type) => {
        setModalStates(prev => ({ ...prev, [type]: false }));
        setSelectedEvaluation(null);
    };

    const resetForm = () => {
        setFormData({
            interview_id: '',
            interviewer_id: '',
            candidate_id: '',
            
            technical_skills: '',
            communication: '',
            problem_solving: '',
            cultural_fit: '',
            experience: '',
            leadership: '',
            
            overall_score: '',
            recommendation: 'pending',
            strengths: '',
            weaknesses: '',
            comments: '',
            follow_up_required: false,
            
            interview_date: new Date().toISOString().split('T')[0],
            duration_minutes: '',
            next_round_recommended: false,
            salary_expectation_met: true
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
        { uid: 'candidate', name: 'Candidate' },
        { uid: 'interview', name: 'Interview' },
        { uid: 'interviewer', name: 'Interviewer' },
        { uid: 'scores', name: 'Scores' },
        { uid: 'overall_score', name: 'Overall' },
        { uid: 'recommendation', name: 'Recommendation' },
        { uid: 'date', name: 'Date' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = useCallback((evaluation, columnKey) => {
        switch (columnKey) {
            case 'candidate':
                return (
                    <div className="flex items-center gap-3">
                        <Avatar 
                            src={evaluation.candidate?.avatar} 
                            name={evaluation.candidate?.name} 
                            size="sm"
                        />
                        <div>
                            <p className="font-medium">{evaluation.candidate?.name}</p>
                            <p className="text-xs text-default-500">{evaluation.candidate?.email}</p>
                        </div>
                    </div>
                );
            case 'interview':
                return (
                    <div>
                        <p className="font-medium">{evaluation.interview?.title}</p>
                        <p className="text-xs text-default-500">{evaluation.interview?.job_position}</p>
                    </div>
                );
            case 'interviewer':
                return (
                    <div className="flex items-center gap-2">
                        <Avatar 
                            src={evaluation.interviewer?.avatar} 
                            name={evaluation.interviewer?.name} 
                            size="sm"
                        />
                        <span className="text-sm">{evaluation.interviewer?.name}</span>
                    </div>
                );
            case 'scores':
                const scores = [
                    { label: 'Tech', value: evaluation.technical_skills },
                    { label: 'Comm', value: evaluation.communication },
                    { label: 'Problem', value: evaluation.problem_solving },
                    { label: 'Culture', value: evaluation.cultural_fit }
                ].filter(s => s.value);

                return (
                    <div className="flex flex-wrap gap-1">
                        {scores.map(score => (
                            <Chip 
                                key={score.label}
                                color={getScoreColor(parseFloat(score.value))} 
                                size="sm" 
                                variant="flat"
                            >
                                {score.label}: {score.value}
                            </Chip>
                        ))}
                    </div>
                );
            case 'overall_score':
                return (
                    <div className="flex items-center gap-2">
                        <Chip 
                            color={getScoreColor(parseFloat(evaluation.overall_score))} 
                            size="sm" 
                            variant="solid"
                            startContent={<StarIcon className="w-3 h-3" />}
                        >
                            {evaluation.overall_score}/10
                        </Chip>
                    </div>
                );
            case 'recommendation':
                return (
                    <Chip 
                        color={getRecommendationColor(evaluation.recommendation)} 
                        size="sm" 
                        variant="flat"
                    >
                        {getRecommendationLabel(evaluation.recommendation)}
                    </Chip>
                );
            case 'date':
                return evaluation.interview_date ? new Date(evaluation.interview_date).toLocaleDateString() : 'N/A';
            case 'actions':
                return (
                    <div className="flex items-center gap-1">
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => openModal('view', evaluation)}
                        >
                            <EyeIcon className="w-4 h-4" />
                        </Button>
                        {canEditScores && (
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onPress={() => openModal('edit', evaluation)}
                            >
                                <PencilIcon className="w-4 h-4" />
                            </Button>
                        )}
                        {canDeleteScores && (
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={() => openModal('delete', evaluation)}
                            >
                                <TrashIcon className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                );
            default:
                return evaluation[columnKey] || '-';
        }
    }, [canEditScores, canDeleteScores]);

    return (
        <>
            <Head title={title} />
            
            {/* Add/Edit Evaluation Modal */}
            {(modalStates.add || modalStates.edit) && (
                <Modal 
                    isOpen={modalStates.add || modalStates.edit} 
                    onOpenChange={() => closeModal(modalStates.add ? 'add' : 'edit')}
                    size="4xl"
                    scrollBehavior="inside"
                >
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">
                                {selectedEvaluation ? 'Edit Evaluation Score' : 'Add Evaluation Score'}
                            </h2>
                        </ModalHeader>
                        <ModalBody>
                            <Tabs aria-label="Evaluation Form">
                                <Tab key="basic" title="Basic Info">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Select
                                                label="Interview"
                                                placeholder="Select interview"
                                                selectedKeys={formData.interview_id ? [formData.interview_id] : []}
                                                onSelectionChange={(keys) => handleFormChange('interview_id', Array.from(keys)[0] || '')}
                                                isRequired
                                                radius={themeRadius}
                                            >
                                                {interviews.map(interview => (
                                                    <SelectItem key={interview.id}>
                                                        {interview.title} - {interview.candidate_name}
                                                    </SelectItem>
                                                ))}
                                            </Select>

                                            <Select
                                                label="Interviewer"
                                                placeholder="Select interviewer"
                                                selectedKeys={formData.interviewer_id ? [formData.interviewer_id] : []}
                                                onSelectionChange={(keys) => handleFormChange('interviewer_id', Array.from(keys)[0] || '')}
                                                isRequired
                                                radius={themeRadius}
                                            >
                                                {interviewers.map(interviewer => (
                                                    <SelectItem key={interviewer.id}>{interviewer.name}</SelectItem>
                                                ))}
                                            </Select>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Interview Date"
                                                type="date"
                                                value={formData.interview_date}
                                                onValueChange={(value) => handleFormChange('interview_date', value)}
                                                radius={themeRadius}
                                            />

                                            <Input
                                                label="Duration (minutes)"
                                                type="number"
                                                placeholder="60"
                                                value={formData.duration_minutes}
                                                onValueChange={(value) => handleFormChange('duration_minutes', value)}
                                                radius={themeRadius}
                                            />
                                        </div>
                                    </div>
                                </Tab>

                                <Tab key="scores" title="Evaluation Scores">
                                    <div className="space-y-4">
                                        <p className="text-sm text-default-600 mb-4">Rate each area from 1 (Poor) to 10 (Excellent)</p>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Technical Skills"
                                                type="number"
                                                min="1"
                                                max="10"
                                                placeholder="1-10"
                                                value={formData.technical_skills}
                                                onValueChange={(value) => handleFormChange('technical_skills', value)}
                                                radius={themeRadius}
                                            />

                                            <Input
                                                label="Communication"
                                                type="number"
                                                min="1"
                                                max="10"
                                                placeholder="1-10"
                                                value={formData.communication}
                                                onValueChange={(value) => handleFormChange('communication', value)}
                                                radius={themeRadius}
                                            />

                                            <Input
                                                label="Problem Solving"
                                                type="number"
                                                min="1"
                                                max="10"
                                                placeholder="1-10"
                                                value={formData.problem_solving}
                                                onValueChange={(value) => handleFormChange('problem_solving', value)}
                                                radius={themeRadius}
                                            />

                                            <Input
                                                label="Cultural Fit"
                                                type="number"
                                                min="1"
                                                max="10"
                                                placeholder="1-10"
                                                value={formData.cultural_fit}
                                                onValueChange={(value) => handleFormChange('cultural_fit', value)}
                                                radius={themeRadius}
                                            />

                                            <Input
                                                label="Experience"
                                                type="number"
                                                min="1"
                                                max="10"
                                                placeholder="1-10"
                                                value={formData.experience}
                                                onValueChange={(value) => handleFormChange('experience', value)}
                                                radius={themeRadius}
                                            />

                                            <Input
                                                label="Leadership"
                                                type="number"
                                                min="1"
                                                max="10"
                                                placeholder="1-10"
                                                value={formData.leadership}
                                                onValueChange={(value) => handleFormChange('leadership', value)}
                                                radius={themeRadius}
                                            />
                                        </div>

                                        {/* Overall Score Preview */}
                                        <Card className="bg-default-100">
                                            <CardBody className="text-center py-4">
                                                <p className="text-sm text-default-600 mb-2">Calculated Overall Score</p>
                                                <div className="text-3xl font-bold text-primary">
                                                    {calculateOverallScore({
                                                        technical_skills: formData.technical_skills,
                                                        communication: formData.communication,
                                                        problem_solving: formData.problem_solving,
                                                        cultural_fit: formData.cultural_fit,
                                                        experience: formData.experience,
                                                        leadership: formData.leadership
                                                    })} / 10
                                                </div>
                                            </CardBody>
                                        </Card>
                                    </div>
                                </Tab>

                                <Tab key="assessment" title="Assessment">
                                    <div className="space-y-4">
                                        <Select
                                            label="Recommendation"
                                            selectedKeys={[formData.recommendation]}
                                            onSelectionChange={(keys) => handleFormChange('recommendation', Array.from(keys)[0])}
                                            radius={themeRadius}
                                        >
                                            {recommendations.map(rec => (
                                                <SelectItem key={rec.key}>{rec.label}</SelectItem>
                                            ))}
                                        </Select>

                                        <Textarea
                                            label="Strengths"
                                            placeholder="List candidate's key strengths..."
                                            value={formData.strengths}
                                            onValueChange={(value) => handleFormChange('strengths', value)}
                                            radius={themeRadius}
                                        />

                                        <Textarea
                                            label="Areas for Improvement"
                                            placeholder="List areas where candidate can improve..."
                                            value={formData.weaknesses}
                                            onValueChange={(value) => handleFormChange('weaknesses', value)}
                                            radius={themeRadius}
                                        />

                                        <Textarea
                                            label="Additional Comments"
                                            placeholder="Any additional observations or feedback..."
                                            value={formData.comments}
                                            onValueChange={(value) => handleFormChange('comments', value)}
                                            radius={themeRadius}
                                        />

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span>Follow-up Required</span>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.follow_up_required}
                                                    onChange={(e) => handleFormChange('follow_up_required', e.target.checked)}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span>Recommend for Next Round</span>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.next_round_recommended}
                                                    onChange={(e) => handleFormChange('next_round_recommended', e.target.checked)}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span>Salary Expectation Met</span>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.salary_expectation_met}
                                                    onChange={(e) => handleFormChange('salary_expectation_met', e.target.checked)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </Tab>
                            </Tabs>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal(modalStates.add ? 'add' : 'edit')}>
                                Cancel
                            </Button>
                            <Button color="primary" onPress={handleSubmit}>
                                {selectedEvaluation ? 'Update Evaluation' : 'Submit Evaluation'}
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
                            <h2 className="text-lg font-semibold text-danger">Delete Evaluation</h2>
                        </ModalHeader>
                        <ModalBody>
                            <p>Are you sure you want to delete this evaluation for <strong>"{selectedEvaluation?.candidate?.name}"</strong>?</p>
                            <p className="text-sm text-danger">This action cannot be undone and will permanently remove all scores and feedback.</p>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('delete')}>Cancel</Button>
                            <Button color="danger" onPress={handleDelete}>Delete Evaluation</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Evaluation Scores Management">
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
                                                    <StarIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Evaluation Scores
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Manage candidate interview evaluations and scoring
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2 flex-wrap">
                                                {canScore && (
                                                    <Button 
                                                        color="primary" 
                                                        variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={() => openModal('add')}
                                                        size={isMobile ? "sm" : "md"}
                                                    >
                                                        Add Evaluation
                                                    </Button>
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
                                            placeholder="Search candidates or interviewers..."
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                        />
                                        
                                        <Select
                                            placeholder="All Interviews"
                                            selectedKeys={filters.interview_id !== 'all' ? [filters.interview_id] : []}
                                            onSelectionChange={(keys) => handleFilterChange('interview_id', Array.from(keys)[0] || 'all')}
                                        >
                                            <SelectItem key="all">All Interviews</SelectItem>
                                            {interviews.map(interview => (
                                                <SelectItem key={interview.id}>{interview.title}</SelectItem>
                                            ))}
                                        </Select>

                                        <Select
                                            placeholder="All Interviewers"
                                            selectedKeys={filters.interviewer_id !== 'all' ? [filters.interviewer_id] : []}
                                            onSelectionChange={(keys) => handleFilterChange('interviewer_id', Array.from(keys)[0] || 'all')}
                                        >
                                            <SelectItem key="all">All Interviewers</SelectItem>
                                            {interviewers.map(interviewer => (
                                                <SelectItem key={interviewer.id}>{interviewer.name}</SelectItem>
                                            ))}
                                        </Select>

                                        <Select
                                            placeholder="Score Range"
                                            selectedKeys={filters.score_range !== 'all' ? [filters.score_range] : []}
                                            onSelectionChange={(keys) => handleFilterChange('score_range', Array.from(keys)[0] || 'all')}
                                        >
                                            <SelectItem key="all">All Scores</SelectItem>
                                            {scoreRanges.map(range => (
                                                <SelectItem key={range.key}>{range.label}</SelectItem>
                                            ))}
                                        </Select>
                                    </div>
                                    
                                    <Table 
                                        aria-label="Evaluation Scores" 
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
                                            items={evaluations} 
                                            emptyContent={loading ? "Loading..." : "No evaluations found"}
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

EvaluationScores.layout = (page) => <App children={page} />;
export default EvaluationScores;