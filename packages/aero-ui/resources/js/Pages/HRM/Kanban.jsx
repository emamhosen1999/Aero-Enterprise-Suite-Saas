import React, {useEffect, useState} from 'react';
import {Head, router} from '@inertiajs/react';
import {closestCorners, DndContext, DragOverlay, PointerSensor, useSensor, useSensors} from '@dnd-kit/core';
import {Button, Card, CardBody, Chip, Input, Select, SelectItem,} from '@heroui/react';
import {
    ArrowPathIcon,
    BriefcaseIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    UserIcon,
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App';
import {showToast} from '@/utils/toastUtils';
import axios from 'axios';
import KanbanColumn from '@/Components/Recruitment/KanbanColumn';
import CandidateCard from '@/Components/Recruitment/CandidateCard';

/**
 * RecruitmentKanban Component
 * 
 * Drag-and-drop recruitment pipeline board
 * Tracks candidates through: Applied → Screening → Interview → Offer → Hired
 */
const RecruitmentKanban = ({ job, hiringStages, applicationsByStage, departments, jobTypes }) => {
    const [activeId, setActiveId] = useState(null);
    const [stages, setStages] = useState([]);
    const [filters, setFilters] = useState({
        search: '',
        source: '',
        experienceMin: '',
        experienceMax: '',
        salaryMin: '',
        salaryMax: '',
    });
    const [viewMode, setViewMode] = useState('kanban'); // kanban or list
    const [loading, setLoading] = useState(false);
    const [detailModal, setDetailModal] = useState({ open: false, application: null });
    const [themeRadius, setThemeRadius] = useState('lg');

    // Theme utility
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

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setThemeRadius(getThemeRadius());
        }
    }, []);

    // Initialize stages with applications
    useEffect(() => {
        if (hiringStages && applicationsByStage) {
            const initializedStages = hiringStages.map(stage => ({
                ...stage,
                applications: applicationsByStage[stage.id]?.applications || [],
                count: applicationsByStage[stage.id]?.count || 0,
            }));
            setStages(initializedStages);
        }
    }, [hiringStages, applicationsByStage]);

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    // Handle drag start
    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    // Handle drag end
    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (!over) {
            setActiveId(null);
            return;
        }

        const applicationId = active.id;
        const newStageId = over.id;

        // Find current stage
        const currentStage = stages.find(stage =>
            stage.applications.some(app => app.id === applicationId)
        );

        if (!currentStage || currentStage.id === newStageId) {
            setActiveId(null);
            return;
        }

        // Optimistic update
        const updatedStages = stages.map(stage => {
            if (stage.id === currentStage.id) {
                return {
                    ...stage,
                    applications: stage.applications.filter(app => app.id !== applicationId),
                    count: stage.count - 1,
                };
            }
            if (stage.id === newStageId) {
                const movedApp = currentStage.applications.find(app => app.id === applicationId);
                return {
                    ...stage,
                    applications: [...stage.applications, { ...movedApp, current_stage_id: newStageId }],
                    count: stage.count + 1,
                };
            }
            return stage;
        });

        setStages(updatedStages);
        setActiveId(null);

        // API call to update stage
        try {
            await axios.put(route('hr.recruitment.applications.update-stage', {
                job: job.id,
                application: applicationId,
            }), {
                stage_id: newStageId,
                notes: `Moved to ${stages.find(s => s.id === newStageId)?.name}`,
            });

            showToast.success('Candidate moved successfully');
        } catch (error) {
            console.error('Error moving candidate:', error);
            showToast.error('Failed to move candidate');
            // Revert optimistic update
            setStages(stages);
        }
    };

    // Handle drag cancel
    const handleDragCancel = () => {
        setActiveId(null);
    };

    // Filter applications
    const filteredStages = stages.map(stage => ({
        ...stage,
        applications: stage.applications.filter(app => {
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const matchesSearch =
                    app.applicant_name?.toLowerCase().includes(searchLower) ||
                    app.email?.toLowerCase().includes(searchLower) ||
                    app.phone?.includes(searchLower);
                if (!matchesSearch) return false;
            }

            if (filters.source && app.source !== filters.source) return false;

            if (filters.experienceMin && app.experience_years < parseFloat(filters.experienceMin)) return false;
            if (filters.experienceMax && app.experience_years > parseFloat(filters.experienceMax)) return false;

            if (filters.salaryMin && app.expected_salary < parseFloat(filters.salaryMin)) return false;
            if (filters.salaryMax && app.expected_salary > parseFloat(filters.salaryMax)) return false;

            return true;
        }),
    }));

    // Get active dragging application
    const activeApplication = activeId
        ? stages.flatMap(s => s.applications).find(app => app.id === activeId)
        : null;

    // Calculate total candidates
    const totalCandidates = stages.reduce((sum, stage) => sum + stage.count, 0);

    // View candidate details
    const viewCandidate = (application) => {
        router.visit(route('hr.recruitment.applications.show', {
            job: job.id,
            application: application.id,
        }));
    };

    // Stage colors
    const getStageColor = (sequence) => {
        const colors = ['default', 'primary', 'secondary', 'warning', 'success', 'danger'];
        return colors[sequence % colors.length] || 'default';
    };

    return (
        <>
            <Head title={`Recruitment Pipeline - ${job.title}`} />

            <div className="flex flex-col w-full h-full p-4 md:p-6" role="main">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                                {job.title}
                            </h1>
                            <div className="flex items-center gap-3 text-sm text-default-600">
                                <span className="flex items-center gap-1">
                                    <BriefcaseIcon className="w-4 h-4" />
                                    {job.department?.name}
                                </span>
                                <span className="flex items-center gap-1">
                                    <UserIcon className="w-4 h-4" />
                                    {totalCandidates} candidates
                                </span>
                                <Chip size="sm" color={job.status === 'open' ? 'success' : 'default'}>
                                    {job.status}
                                </Chip>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="flat"
                                startContent={<ArrowPathIcon className="w-4 h-4" />}
                                onPress={() => router.reload()}
                                radius={themeRadius}
                            >
                                Refresh
                            </Button>
                            <Button
                                size="sm"
                                color="primary"
                                startContent={<PlusIcon className="w-4 h-4" />}
                                onPress={() => router.visit(route('hr.recruitment.applications.create', job.id))}
                                radius={themeRadius}
                            >
                                Add Candidate
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <Card className="mb-6" radius={themeRadius}>
                    <CardBody className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            <Input
                                placeholder="Search candidates..."
                                value={filters.search}
                                onValueChange={(value) => setFilters({ ...filters, search: value })}
                                startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                size="sm"
                                radius={themeRadius}
                                className="md:col-span-2"
                            />

                            <Select
                                placeholder="Source"
                                selectedKeys={filters.source ? [filters.source] : []}
                                onSelectionChange={(keys) => setFilters({ ...filters, source: Array.from(keys)[0] })}
                                size="sm"
                                radius={themeRadius}
                            >
                                <SelectItem key="">All Sources</SelectItem>
                                <SelectItem key="referral">Referral</SelectItem>
                                <SelectItem key="linkedin">LinkedIn</SelectItem>
                                <SelectItem key="indeed">Indeed</SelectItem>
                                <SelectItem key="website">Website</SelectItem>
                                <SelectItem key="other">Other</SelectItem>
                            </Select>

                            <Input
                                type="number"
                                placeholder="Min Experience"
                                value={filters.experienceMin}
                                onValueChange={(value) => setFilters({ ...filters, experienceMin: value })}
                                size="sm"
                                radius={themeRadius}
                                endContent={<span className="text-xs text-default-400">yrs</span>}
                            />

                            <Input
                                type="number"
                                placeholder="Max Experience"
                                value={filters.experienceMax}
                                onValueChange={(value) => setFilters({ ...filters, experienceMax: value })}
                                size="sm"
                                radius={themeRadius}
                                endContent={<span className="text-xs text-default-400">yrs</span>}
                            />

                            <Button
                                size="sm"
                                variant="flat"
                                startContent={<FunnelIcon className="w-4 h-4" />}
                                onPress={() => setFilters({
                                    search: '',
                                    source: '',
                                    experienceMin: '',
                                    experienceMax: '',
                                    salaryMin: '',
                                    salaryMax: '',
                                })}
                                radius={themeRadius}
                            >
                                Clear
                            </Button>
                        </div>
                    </CardBody>
                </Card>

                {/* Kanban Board */}
                <div className="flex-1 overflow-x-auto">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCorners}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDragCancel={handleDragCancel}
                    >
                        <div className="flex gap-4 pb-4 min-w-max">
                            {filteredStages.map((stage, index) => (
                                <KanbanColumn
                                    key={stage.id}
                                    stage={stage}
                                    color={getStageColor(index)}
                                    onViewCandidate={viewCandidate}
                                    themeRadius={themeRadius}
                                />
                            ))}
                        </div>

                        <DragOverlay>
                            {activeApplication ? (
                                <div className="rotate-3 opacity-90">
                                    <CandidateCard
                                        application={activeApplication}
                                        isDragging={true}
                                        themeRadius={themeRadius}
                                    />
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                </div>
            </div>
        </>
    );
};

RecruitmentKanban.layout = (page) => <App>{page}</App>;
export default RecruitmentKanban;
