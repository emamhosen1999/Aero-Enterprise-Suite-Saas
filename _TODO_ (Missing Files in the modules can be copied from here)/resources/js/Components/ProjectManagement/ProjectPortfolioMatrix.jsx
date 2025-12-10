import React, { useMemo } from 'react';
import { router } from '@inertiajs/react';
import {
    Card,
    CardBody,
    CardHeader,
    Chip,
    Button,
    Tooltip,
    Badge,
    Avatar,
} from "@heroui/react";
import {
    ChartBarSquareIcon,
    CurrencyDollarIcon,
    ExclamationTriangleIcon,
    ClockIcon,
    UserGroupIcon,
    TrophyIcon,
    FireIcon,
    ShieldCheckIcon,
    StarIcon,
    BriefcaseIcon,
} from "@heroicons/react/24/outline";

const ProjectPortfolioMatrix = ({
    projects = [],
    selectedProjects = new Set(),
    onProjectSelect,
    canView,
    getStatusColor,
    getPriorityColor,
    getHealthColor,
    getRiskColor,
    handleQuickAction,
    userRole,
    formatCurrency,
    className = "",
}) => {
    // Calculate matrix data based on Risk vs Value
    const matrixData = useMemo(() => {
        if (!projects || projects.length === 0) return { quadrants: [], maxValue: 0, maxRisk: 0 };

        const projectsWithMetrics = projects.map(project => {
            // Calculate project value score (0-100)
            const budgetWeight = 0.3;
            const strategicWeight = 0.3;
            const roiWeight = 0.2;
            const impactWeight = 0.2;

            const budgetScore = project.budget_allocated ? Math.min(100, (project.budget_allocated / 5000000) * 100) : 50;
            const strategicScore = project.strategic_importance || 50;
            const roiScore = project.expected_roi || 50;
            const impactScore = project.business_impact || 50;

            const valueScore = (budgetScore * budgetWeight) + 
                             (strategicScore * strategicWeight) + 
                             (roiScore * roiWeight) + 
                             (impactScore * impactWeight);

            // Calculate risk score (0-100)
            const riskWeights = { low: 20, medium: 50, high: 75, critical: 95 };
            const riskScore = riskWeights[project.risk_level] || 50;

            return {
                ...project,
                valueScore: Math.round(valueScore),
                riskScore,
                matrixPosition: {
                    x: riskScore,
                    y: valueScore
                }
            };
        });

        // Define quadrants
        const quadrants = [
            {
                id: 'high-value-low-risk',
                name: 'Stars',
                description: 'High Value, Low Risk - Invest & Expand',
                color: 'success',
                icon: <StarIcon className="w-5 h-5" />,
                position: { x: [0, 50], y: [50, 100] },
                projects: projectsWithMetrics.filter(p => p.riskScore <= 50 && p.valueScore > 50)
            },
            {
                id: 'high-value-high-risk',
                name: 'Question Marks',
                description: 'High Value, High Risk - Selective Investment',
                color: 'warning',
                icon: <ExclamationTriangleIcon className="w-5 h-5" />,
                position: { x: [50, 100], y: [50, 100] },
                projects: projectsWithMetrics.filter(p => p.riskScore > 50 && p.valueScore > 50)
            },
            {
                id: 'low-value-low-risk',
                name: 'Cash Cows',
                description: 'Low Value, Low Risk - Maintain & Optimize',
                color: 'primary',
                icon: <CurrencyDollarIcon className="w-5 h-5" />,
                position: { x: [0, 50], y: [0, 50] },
                projects: projectsWithMetrics.filter(p => p.riskScore <= 50 && p.valueScore <= 50)
            },
            {
                id: 'low-value-high-risk',
                name: 'Dogs',
                description: 'Low Value, High Risk - Divest or Transform',
                color: 'danger',
                icon: <FireIcon className="w-5 h-5" />,
                position: { x: [50, 100], y: [0, 50] },
                projects: projectsWithMetrics.filter(p => p.riskScore > 50 && p.valueScore <= 50)
            }
        ];

        return {
            quadrants,
            projectsWithMetrics,
            maxValue: 100,
            maxRisk: 100
        };
    }, [projects]);

    const getQuadrantRecommendation = (quadrantId) => {
        const recommendations = {
            'high-value-low-risk': 'Prioritize these projects for maximum ROI with minimal risk.',
            'high-value-high-risk': 'Carefully evaluate and mitigate risks before proceeding.',
            'low-value-low-risk': 'Consider as supporting projects or efficiency improvements.',
            'low-value-high-risk': 'Re-evaluate business case or consider termination.'
        };
        return recommendations[quadrantId] || '';
    };

    const getBubbleSize = (project) => {
        const baseSize = 40;
        const budgetFactor = project.budget_allocated ? Math.min(2, project.budget_allocated / 1000000) : 1;
        return Math.max(baseSize, baseSize * budgetFactor);
    };

    if (!projects || projects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <ChartBarSquareIcon className="w-16 h-16 text-default-300 mb-4" />
                <h3 className="text-lg font-medium text-default-700 mb-2">No Portfolio Data</h3>
                <p className="text-default-500 mb-4">
                    Projects need risk and value metrics for portfolio matrix analysis.
                </p>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Matrix Header */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-2">
                            <ChartBarSquareIcon className="w-5 h-5" />
                            <h3 className="text-lg font-semibold">Portfolio Risk-Value Matrix</h3>
                            <Badge content={projects.length} color="primary" />
                        </div>
                        <div className="text-sm text-default-600">
                            Boston Consulting Group (BCG) Matrix Analysis
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Matrix Visualization */}
            <Card className="bg-white/5 backdrop-blur-xs border-white/10">
                <CardBody className="p-6">
                    <div className="relative">
                        {/* Matrix Grid */}
                        <div className="relative w-full h-96 border-2 border-default-300 rounded-lg overflow-hidden">
                            {/* Quadrant Backgrounds */}
                            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                                {matrixData.quadrants.map((quadrant) => (
                                    <div
                                        key={quadrant.id}
                                        className={`border border-default-200 bg-${quadrant.color}-500/10 flex items-center justify-center p-4`}
                                    >
                                        <div className="text-center">
                                            <div className={`flex items-center justify-center mb-2 text-${quadrant.color}-600`}>
                                                {quadrant.icon}
                                                <span className="ml-2 font-medium">{quadrant.name}</span>
                                            </div>
                                            <div className="text-xs text-default-500 max-w-32">
                                                {quadrant.description}
                                            </div>
                                            <div className="mt-2">
                                                <Badge content={quadrant.projects.length} color={quadrant.color} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Axis Labels */}
                            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-sm font-medium text-default-700">
                                Risk Level →
                            </div>
                            <div className="absolute -left-12 top-1/2 transform -translate-y-1/2 -rotate-90 text-sm font-medium text-default-700">
                                ← Business Value
                            </div>

                            {/* Project Bubbles */}
                            {matrixData.projectsWithMetrics.map((project) => (
                                <Tooltip
                                    key={project.id}
                                    content={
                                        <div className="p-2 max-w-64">
                                            <div className="font-medium">{project.project_name}</div>
                                            <div className="text-xs text-default-500 mt-1">
                                                Risk: {project.riskScore}/100 | Value: {project.valueScore}/100
                                            </div>
                                            <div className="text-xs text-default-500">
                                                Budget: {formatCurrency(project.budget_allocated || 0)}
                                            </div>
                                            <div className="text-xs text-default-500">
                                                Progress: {project.progress || 0}%
                                            </div>
                                        </div>
                                    }
                                >
                                    <div
                                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 hover:scale-110 ${
                                            selectedProjects.has(project.id) ? 'ring-2 ring-primary-500' : ''
                                        }`}
                                        style={{
                                            left: `${project.matrixPosition.x}%`,
                                            bottom: `${project.matrixPosition.y}%`,
                                            width: `${getBubbleSize(project)}px`,
                                            height: `${getBubbleSize(project)}px`,
                                        }}
                                        onClick={() => onProjectSelect(project.id)}
                                    >
                                        <div
                                            className={`w-full h-full rounded-full bg-${getPriorityColor(project.priority)}-500 opacity-70 flex items-center justify-center text-white text-xs font-medium shadow-lg`}
                                        >
                                            {project.project_code || project.project_name.substring(0, 3).toUpperCase()}
                                        </div>
                                        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-center text-default-700 whitespace-nowrap">
                                            {project.project_name.length > 15 ? 
                                                `${project.project_name.substring(0, 15)}...` : 
                                                project.project_name}
                                        </div>
                                    </div>
                                </Tooltip>
                            ))}
                        </div>

                        {/* Axis Scale */}
                        <div className="flex justify-between mt-2 text-xs text-default-500">
                            <span>Low Risk</span>
                            <span>High Risk</span>
                        </div>
                        <div className="flex flex-col items-start mt-2">
                            <div className="text-xs text-default-500 transform -rotate-90 origin-left">
                                High Value
                            </div>
                            <div className="text-xs text-default-500 transform -rotate-90 origin-left mt-20">
                                Low Value
                            </div>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Quadrant Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {matrixData.quadrants.map((quadrant) => (
                    <Card key={quadrant.id} className={`bg-${quadrant.color}-500/10 border-${quadrant.color}-500/20`}>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center space-x-2">
                                    <div className={`text-${quadrant.color}-600`}>
                                        {quadrant.icon}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">{quadrant.name}</h4>
                                        <p className="text-sm text-default-600">{quadrant.description}</p>
                                    </div>
                                </div>
                                <Badge content={quadrant.projects.length} color={quadrant.color} />
                            </div>
                        </CardHeader>
                        <CardBody className="pt-0">
                            <div className="space-y-3">
                                <div className="text-sm text-default-600">
                                    <strong>Strategy:</strong> {getQuadrantRecommendation(quadrant.id)}
                                </div>
                                
                                {/* Projects in this quadrant */}
                                {quadrant.projects.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium">Projects ({quadrant.projects.length}):</div>
                                        <div className="space-y-2 max-h-32 overflow-y-auto">
                                            {quadrant.projects.slice(0, 3).map((project) => (
                                                <div 
                                                    key={project.id} 
                                                    className="flex items-center justify-between text-sm p-2 rounded-lg bg-white/10"
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <div className={`w-3 h-3 bg-${getPriorityColor(project.priority)}-500 rounded-full`}></div>
                                                        <span className="truncate">{project.project_name}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-xs text-default-500">
                                                            {project.progress || 0}%
                                                        </span>
                                                        <Button
                                                            size="sm"
                                                            variant="light"
                                                            onPress={() => handleQuickAction('view', project)}
                                                        >
                                                            View
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                            {quadrant.projects.length > 3 && (
                                                <div className="text-xs text-default-500 text-center">
                                                    +{quadrant.projects.length - 3} more projects
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Quadrant Metrics */}
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <div className="text-default-500">Total Budget</div>
                                        <div className="font-medium">
                                            {formatCurrency(quadrant.projects.reduce((sum, p) => sum + (p.budget_allocated || 0), 0))}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-default-500">Avg Progress</div>
                                        <div className="font-medium">
                                            {quadrant.projects.length > 0 ? 
                                                Math.round(quadrant.projects.reduce((sum, p) => sum + (p.progress || 0), 0) / quadrant.projects.length) : 0}%
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </div>

            {/* Portfolio Summary */}
            <Card className="bg-linear-to-r from-primary-500/10 to-secondary-500/10 border-primary-500/20">
                <CardBody className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                            <div className="text-lg font-bold text-success">
                                {matrixData.quadrants.find(q => q.id === 'high-value-low-risk')?.projects.length || 0}
                            </div>
                            <div className="text-default-600">Star Projects</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold text-warning">
                                {matrixData.quadrants.find(q => q.id === 'high-value-high-risk')?.projects.length || 0}
                            </div>
                            <div className="text-default-600">Question Marks</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold text-primary">
                                {matrixData.quadrants.find(q => q.id === 'low-value-low-risk')?.projects.length || 0}
                            </div>
                            <div className="text-default-600">Cash Cows</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold text-danger">
                                {matrixData.quadrants.find(q => q.id === 'low-value-high-risk')?.projects.length || 0}
                            </div>
                            <div className="text-default-600">Dogs</div>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};

export default ProjectPortfolioMatrix;
