import React from 'react';
import { router } from '@inertiajs/react';
import {
    Grid,
    Card,
    CardBody,
    CardHeader,
    CardFooter,
    Progress,
    Chip,
    Button,
    Avatar,
    AvatarGroup,
    Tooltip,
    Badge,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Checkbox,
} from "@heroui/react";
import {
    BriefcaseIcon,
    CalendarDaysIcon,
    UserIcon,
    ChartBarSquareIcon,
    ClockIcon,
    DocumentTextIcon,
    PlayCircleIcon,
    CheckCircleIcon,
    XCircleIcon,
    PauseCircleIcon,
    ArchiveBoxIcon,
    ExclamationTriangleIcon,
    BanknotesIcon,
    EllipsisVerticalIcon,
    EyeIcon,
    PencilIcon,
    DocumentDuplicateIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import ProjectCard from './ProjectCard.jsx';

const ProjectGridView = ({
    projects = [],
    selectedProjects = new Set(),
    onProjectSelect,
    onSelectAll,
    canView,
    getStatusColor,
    getStatusIcon,
    getPriorityColor,
    getHealthColor,
    getRiskColor,
    handleQuickAction,
    userRole,
    formatCurrency,
    formatDate,
    calculateProjectHealth,
}) => {
    if (!projects || projects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <BriefcaseIcon className="w-16 h-16 text-default-300 mb-4" />
                <h3 className="text-lg font-medium text-default-700 mb-2">No Projects Found</h3>
                <p className="text-default-500 mb-4">
                    Get started by creating your first project or adjusting your filters.
                </p>
                {canView('create') && (
                    <Button
                        color="primary"
                        onPress={() => router.visit(route('project-management.projects.create'))}
                    >
                        Create New Project
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Bulk Selection Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Checkbox
                        isSelected={selectedProjects.size === projects.length && projects.length > 0}
                        isIndeterminate={selectedProjects.size > 0 && selectedProjects.size < projects.length}
                        onValueChange={onSelectAll}
                    >
                        Select All ({projects.length})
                    </Checkbox>
                    {selectedProjects.size > 0 && (
                        <Chip color="primary" variant="flat">
                            {selectedProjects.size} selected
                        </Chip>
                    )}
                </div>
            </div>

            {/* Project Grid */}
            <Grid container spacing={3}>
                {projects.map((project) => {
                    const isSelected = selectedProjects.has(project.id);

                    return (
                        <Grid item xs={12} sm={6} lg={4} key={project.id}>
                            <ProjectCard
                                project={project}
                                isSelected={isSelected}
                                onSelect={() => onProjectSelect(project.id)}
                                canView={canView}
                                getStatusColor={getStatusColor}
                                getStatusIcon={getStatusIcon}
                                getPriorityColor={getPriorityColor}
                                getHealthColor={getHealthColor}
                                getRiskColor={getRiskColor}
                                onQuickAction={handleQuickAction}
                                formatCurrency={formatCurrency}
                                formatDate={formatDate}
                                userRole={userRole}
                            />
                        </Grid>
                    );
                })}
            </Grid>
        </div>
    );
};

export default ProjectGridView;
