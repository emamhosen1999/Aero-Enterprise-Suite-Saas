import React, { useMemo } from 'react';
import { router } from '@inertiajs/react';
import {
    Card,
    CardBody,
    CardHeader,
    Progress,
    Chip,
    Button,
    Tooltip,
    Avatar,
    Badge,
    Divider,
} from "@heroui/react";
import {
    CalendarDaysIcon,
    ClockIcon,
    BriefcaseIcon,
    PlayCircleIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    UserIcon,
    ChartBarSquareIcon,
    ArrowRightIcon,
    FlagIcon,
} from "@heroicons/react/24/outline";

const ProjectTimelineView = ({
    projects = [],
    selectedProjects = new Set(),
    onProjectSelect,
    canView,
    getStatusColor,
    getStatusIcon,
    getPriorityColor,
    getHealthColor,
    handleQuickAction,
    userRole,
    formatDate,
    className = "",
}) => {
    // Group projects by timeline and create Gantt-style view
    const timelineData = useMemo(() => {
        if (!projects || projects.length === 0) return [];

        const currentDate = new Date();
        const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
        const endOfYear = new Date(currentDate.getFullYear(), 11, 31);

        return projects.map(project => {
            const startDate = project.start_date ? new Date(project.start_date) : startOfYear;
            const endDate = project.end_date ? new Date(project.end_date) : endOfYear;
            const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
            const elapsedDays = Math.ceil((currentDate - startDate) / (1000 * 60 * 60 * 24));
            const progress = project.progress || 0;

            return {
                ...project,
                startDate,
                endDate,
                totalDays,
                elapsedDays,
                progress,
                isOverdue: currentDate > endDate && project.status !== 'completed',
                isStarted: currentDate >= startDate,
                daysRemaining: Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24)),
            };
        }).sort((a, b) => a.startDate - b.startDate);
    }, [projects]);

    const getTimelineColor = (project) => {
        if (project.isOverdue) return 'danger';
        if (project.daysRemaining <= 30) return 'warning';
        if (project.status === 'completed') return 'success';
        return 'primary';
    };

    const getTimelineWidth = (project) => {
        const yearStart = new Date(new Date().getFullYear(), 0, 1);
        const yearEnd = new Date(new Date().getFullYear(), 11, 31);
        const yearDays = Math.ceil((yearEnd - yearStart) / (1000 * 60 * 60 * 24));
        return Math.max(10, (project.totalDays / yearDays) * 100);
    };

    const getTimelinePosition = (project) => {
        const yearStart = new Date(new Date().getFullYear(), 0, 1);
        const yearEnd = new Date(new Date().getFullYear(), 11, 31);
        const yearDays = Math.ceil((yearEnd - yearStart) / (1000 * 60 * 60 * 24));
        const daysFromStart = Math.ceil((project.startDate - yearStart) / (1000 * 60 * 60 * 24));
        return Math.max(0, (daysFromStart / yearDays) * 100);
    };

    if (!projects || projects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <CalendarDaysIcon className="w-16 h-16 text-default-300 mb-4" />
                <h3 className="text-lg font-medium text-default-700 mb-2">No Timeline Data</h3>
                <p className="text-default-500 mb-4">
                    Projects need start and end dates to display timeline view.
                </p>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Timeline Header */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-2">
                            <CalendarDaysIcon className="w-5 h-5" />
                            <h3 className="text-lg font-semibold">Project Timeline - {new Date().getFullYear()}</h3>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-default-600">
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-success rounded-full"></div>
                                <span>Completed</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-primary rounded-full"></div>
                                <span>In Progress</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-warning rounded-full"></div>
                                <span>At Risk</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-danger rounded-full"></div>
                                <span>Overdue</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardBody>
                    {/* Month Headers */}
                    <div className="grid grid-cols-12 gap-1 mb-4 text-xs text-default-500">
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => (
                            <div key={index} className="text-center font-medium">
                                {month}
                            </div>
                        ))}
                    </div>
                    
                    {/* Current Date Indicator */}
                    <div className="relative mb-4">
                        <div className="absolute top-0 h-2 bg-red-500 w-0.5 z-10" style={{
                            left: `${(new Date().getMonth() + (new Date().getDate() / 31)) * 8.33}%`
                        }}>
                            <div className="absolute top-0 left-0 transform -translate-x-1/2 -translate-y-1 w-2 h-2 bg-red-500 rounded-full"></div>
                        </div>
                        <div className="h-2 bg-default-200 rounded-full">
                            <div className="grid grid-cols-12 h-full">
                                {Array.from({length: 12}).map((_, i) => (
                                    <div key={i} className="border-r border-default-300 last:border-r-0"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Timeline Projects */}
            <div className="space-y-4">
                {timelineData.map((project, index) => (
                    <Card key={project.id} className="bg-white/5 backdrop-blur-xs border-white/10">
                        <CardBody className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                    <div className="flex items-center space-x-2">
                                        <h4 className="font-semibold text-lg">{project.project_name}</h4>
                                        <Chip
                                            size="sm"
                                            color={getStatusColor(project.status)}
                                            variant="flat"
                                            startContent={getStatusIcon(project.status)}
                                        >
                                            {project.status?.replace('_', ' ')}
                                        </Chip>
                                    </div>
                                    <Chip
                                        size="sm"
                                        color={getPriorityColor(project.priority)}
                                        variant="flat"
                                        startContent={<FlagIcon className="w-3 h-3" />}
                                    >
                                        {project.priority}
                                    </Chip>
                                </div>
                                
                                <div className="flex items-center space-x-4 text-sm text-default-600">
                                    <div className="flex items-center space-x-2">
                                        <UserIcon className="w-4 h-4" />
                                        <span>{project.project_leader?.name || 'Unassigned'}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <CalendarDaysIcon className="w-4 h-4" />
                                        <span>{formatDate(project.start_date)} - {formatDate(project.end_date)}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <ClockIcon className="w-4 h-4" />
                                        <span>
                                            {project.daysRemaining > 0 ? `${project.daysRemaining} days left` : 
                                             project.daysRemaining === 0 ? 'Due today' : 
                                             `${Math.abs(project.daysRemaining)} days overdue`}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Timeline Bar */}
                            <div className="relative mb-3">
                                <div className="h-8 bg-default-200 rounded-lg overflow-hidden">
                                    {/* Year grid */}
                                    <div className="absolute inset-0 grid grid-cols-12 border-default-300">
                                        {Array.from({length: 12}).map((_, i) => (
                                            <div key={i} className="border-r border-default-300 last:border-r-0"></div>
                                        ))}
                                    </div>
                                    
                                    {/* Project Timeline */}
                                    <div 
                                        className={`absolute top-0 h-full bg-${getTimelineColor(project)}-500 rounded-lg flex items-center justify-center text-white text-xs font-medium`}
                                        style={{
                                            left: `${getTimelinePosition(project)}%`,
                                            width: `${getTimelineWidth(project)}%`
                                        }}
                                    >
                                        {project.progress}%
                                    </div>
                                    
                                    {/* Progress overlay */}
                                    <div 
                                        className={`absolute top-0 h-full bg-${getTimelineColor(project)}-700 rounded-lg opacity-80`}
                                        style={{
                                            left: `${getTimelinePosition(project)}%`,
                                            width: `${(getTimelineWidth(project) * project.progress) / 100}%`
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Project Details */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div className="flex items-center space-x-2">
                                    <ChartBarSquareIcon className="w-4 h-4 text-default-400" />
                                    <span>Progress: {project.progress}%</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-default-600">SPI:</span>
                                    <Chip
                                        size="sm"
                                        variant="flat"
                                        color={project.spi >= 0.95 ? 'success' : project.spi >= 0.85 ? 'warning' : 'danger'}
                                    >
                                        {project.spi?.toFixed(2) || '1.00'}
                                    </Chip>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-default-600">CPI:</span>
                                    <Chip
                                        size="sm"
                                        variant="flat"
                                        color={project.cpi >= 0.95 ? 'success' : project.cpi >= 0.85 ? 'warning' : 'danger'}
                                    >
                                        {project.cpi?.toFixed(2) || '1.00'}
                                    </Chip>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-default-600">Health:</span>
                                    <Chip
                                        size="sm"
                                        variant="flat"
                                        color={getHealthColor(project.health_status)}
                                    >
                                        {project.health_status === 'good' ? '✅' : 
                                         project.health_status === 'at_risk' ? '⚠️' : 
                                         project.health_status === 'critical' ? '🔴' : '⚪'}
                                    </Chip>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex items-center justify-between pt-3 border-t border-default-200">
                                <div className="flex items-center space-x-2">
                                    {project.next_milestone && (
                                        <Tooltip content={`Next milestone: ${project.next_milestone}`}>
                                            <Chip size="sm" variant="flat" color="secondary">
                                                📅 {project.next_milestone}
                                            </Chip>
                                        </Tooltip>
                                    )}
                                    {project.isOverdue && (
                                        <Chip size="sm" variant="flat" color="danger">
                                            ⚠️ Overdue
                                        </Chip>
                                    )}
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                    {canView('view') && (
                                        <Button
                                            size="sm"
                                            variant="light"
                                            onPress={() => handleQuickAction('view', project)}
                                        >
                                            View
                                        </Button>
                                    )}
                                    {canView('edit') && (
                                        <Button
                                            size="sm"
                                            variant="light"
                                            onPress={() => handleQuickAction('edit', project)}
                                        >
                                            Edit
                                        </Button>
                                    )}
                                    {canView('view') && (
                                        <Button
                                            size="sm"
                                            variant="light"
                                            onPress={() => handleQuickAction('tasks', project)}
                                        >
                                            Tasks
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </div>

            {/* Timeline Summary */}
            <Card className="bg-linear-to-r from-primary-500/10 to-secondary-500/10 border-primary-500/20">
                <CardBody className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                            <div className="text-lg font-bold text-success">
                                {timelineData.filter(p => p.status === 'completed').length}
                            </div>
                            <div className="text-default-600">Completed</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold text-primary">
                                {timelineData.filter(p => p.status === 'in_progress').length}
                            </div>
                            <div className="text-default-600">In Progress</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold text-warning">
                                {timelineData.filter(p => p.daysRemaining <= 30 && p.daysRemaining > 0).length}
                            </div>
                            <div className="text-default-600">Due Soon</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold text-danger">
                                {timelineData.filter(p => p.isOverdue).length}
                            </div>
                            <div className="text-default-600">Overdue</div>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};

export default ProjectTimelineView;
