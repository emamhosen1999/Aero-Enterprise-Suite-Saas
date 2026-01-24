import React, { useEffect, useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { 
    Card, CardBody, CardHeader, 
    Button, Chip, Progress, Tooltip, Avatar, Divider
} from "@heroui/react";
import { 
    UserIcon, ExclamationTriangleIcon, HeartIcon, FaceSmileIcon,
    ArrowsRightLeftIcon, ChartBarIcon, ArrowLeftIcon, LightBulbIcon,
    CheckCircleIcon, BoltIcon, ClockIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { useHRMAC } from '@/Hooks/useHRMAC';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';

const EmployeeRiskProfile = ({ 
    title, 
    employee, 
    attritionAnalysis, 
    burnoutAnalysis, 
    sentimentAnalysis,
    mobilityRecommendations,
    recentAnomalies 
}) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    
    // HRMAC permissions
    const { hasAccess, canUpdate, isSuperAdmin } = useHRMAC();
    const canViewProfile = hasAccess('hrm.ai-analytics.employee-profile') || isSuperAdmin();

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkScreenSize = () => setIsMobile(window.innerWidth < 640);
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const getRiskColor = (score) => {
        if (score >= 80) return 'danger';
        if (score >= 60) return 'warning';
        if (score >= 40) return 'secondary';
        return 'success';
    };

    const getRiskLabel = (score) => {
        if (score >= 80) return 'Critical';
        if (score >= 60) return 'High';
        if (score >= 40) return 'Moderate';
        return 'Low';
    };

    const getSentimentColor = (label) => {
        if (label === 'positive') return 'success';
        if (label === 'negative') return 'danger';
        return 'secondary';
    };

    const RiskCard = ({ title, icon, score, factors, recommendations, color }) => (
        <Card className="h-full">
            <CardHeader className="border-b border-divider p-4">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg bg-${color}/20`}>
                            {icon}
                        </div>
                        <h3 className="font-semibold">{title}</h3>
                    </div>
                    <Chip color={getRiskColor(score)} variant="flat" size="lg">
                        {score}%
                    </Chip>
                </div>
            </CardHeader>
            <CardBody className="p-4 space-y-4">
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span>Risk Level</span>
                        <span className={`font-medium text-${getRiskColor(score)}`}>
                            {getRiskLabel(score)}
                        </span>
                    </div>
                    <Progress 
                        value={score} 
                        color={getRiskColor(score)}
                        size="md"
                    />
                </div>

                {factors && Object.keys(factors).length > 0 && (
                    <div>
                        <p className="text-sm font-medium mb-2">Contributing Factors</p>
                        <div className="space-y-2">
                            {Object.entries(factors)
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 5)
                                .map(([key, value]) => (
                                    <div key={key} className="flex items-center gap-2">
                                        <span className="text-xs text-default-500 capitalize flex-1">
                                            {key.replace(/_/g, ' ')}
                                        </span>
                                        <Progress 
                                            value={value} 
                                            color={getRiskColor(value)}
                                            size="sm"
                                            className="w-20"
                                        />
                                        <span className="text-xs w-8">{Math.round(value)}</span>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {recommendations && recommendations.length > 0 && (
                    <div>
                        <p className="text-sm font-medium mb-2">Recommendations</p>
                        <ul className="space-y-1">
                            {recommendations.slice(0, 4).map((rec, idx) => (
                                <li key={idx} className="text-xs text-default-600 flex items-start gap-2">
                                    <LightBulbIcon className="w-3 h-3 mt-0.5 text-warning shrink-0" />
                                    {rec}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </CardBody>
        </Card>
    );

    return (
        <StandardPageLayout
            title={employee?.full_name || 'Employee Risk Profile'}
            subtitle={`${employee?.designation?.title || ''} • ${employee?.department?.name || ''}`}
            icon={<UserIcon className="w-6 h-6" />}
            iconColorClass="text-primary"
            iconBgClass="bg-primary/20"
            actions={
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-xs text-default-400">Overall Risk</p>
                        <p className="text-2xl font-bold">
                            {Math.max(
                                attritionAnalysis?.risk_score || 0,
                                burnoutAnalysis?.risk_score || 0
                            )}%
                        </p>
                    </div>
                    <Button 
                        isIconOnly 
                        variant="flat" 
                        onPress={() => router.visit(route('hrm.ai-analytics.dashboard'))}
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                    </Button>
                </div>
            }
            ariaLabel="Employee Risk Profile"
        >
            {/* Employee Info Header */}
            <Card className="aero-card mb-6">
                <CardBody className="p-4">
                    <div className="flex items-center gap-4">
                        <Avatar 
                            src={employee?.profile_image}
                            name={employee?.full_name}
                            size="lg"
                            className="w-16 h-16"
                        />
                        <div>
                            <h2 className="text-lg font-semibold">{employee?.full_name}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <Chip size="sm" variant="flat">
                                    ID: {employee?.employee_id || employee?.id}
                                </Chip>
                                {employee?.manager && (
                                    <Chip size="sm" variant="bordered">
                                        Reports to: {employee.manager.full_name}
                                    </Chip>
                                )}
                            </div>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Risk Analysis Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <RiskCard
                    title="Attrition Risk"
                    icon={<ExclamationTriangleIcon className="w-5 h-5 text-danger" />}
                    score={attritionAnalysis?.risk_score || 0}
                    factors={attritionAnalysis?.factors}
                    recommendations={attritionAnalysis?.recommendations}
                    color="danger"
                />
                <RiskCard
                    title="Burnout Risk"
                    icon={<BoltIcon className="w-5 h-5 text-warning" />}
                    score={burnoutAnalysis?.risk_score || 0}
                    factors={burnoutAnalysis?.factors}
                    recommendations={burnoutAnalysis?.recommendations}
                    color="warning"
                />
            </div>

            {/* Sentiment & Mobility */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Sentiment Analysis */}
                <Card className="h-full">
                    <CardHeader className="border-b border-divider p-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-success/20">
                                <FaceSmileIcon className="w-5 h-5 text-success" />
                            </div>
                            <h3 className="font-semibold">Engagement & Sentiment</h3>
                        </div>
                    </CardHeader>
                    <CardBody className="p-4">
                        {sentimentAnalysis?.has_data ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span>Overall Sentiment</span>
                                    <Chip 
                                        color={getSentimentColor(sentimentAnalysis.sentiment_label)}
                                        variant="flat"
                                    >
                                        {sentimentAnalysis.sentiment_label} ({sentimentAnalysis.overall_score}%)
                                    </Chip>
                                </div>

                                {sentimentAnalysis.dimension_scores && (
                                    <div>
                                        <p className="text-sm font-medium mb-2">Dimension Scores</p>
                                        <div className="space-y-2">
                                            {Object.entries(sentimentAnalysis.dimension_scores).map(([dim, score]) => (
                                                <div key={dim} className="flex items-center gap-2">
                                                    <span className="text-xs text-default-500 capitalize flex-1">
                                                        {dim.replace(/_/g, ' ')}
                                                    </span>
                                                    <Progress 
                                                        value={score} 
                                                        color={score >= 60 ? 'success' : score >= 40 ? 'warning' : 'danger'}
                                                        size="sm"
                                                        className="w-24"
                                                    />
                                                    <span className="text-xs w-8">{Math.round(score)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {sentimentAnalysis.trend && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm">Trend:</span>
                                        <Chip 
                                            size="sm" 
                                            color={sentimentAnalysis.trend.direction === 'improving' ? 'success' : 
                                                   sentimentAnalysis.trend.direction === 'declining' ? 'danger' : 'default'}
                                            variant="flat"
                                        >
                                            {sentimentAnalysis.trend.direction} ({sentimentAnalysis.trend.change > 0 ? '+' : ''}{sentimentAnalysis.trend.change})
                                        </Chip>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-default-400">
                                <FaceSmileIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>No sentiment data available</p>
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* Mobility Recommendations */}
                <Card className="h-full">
                    <CardHeader className="border-b border-divider p-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-primary/20">
                                <ArrowsRightLeftIcon className="w-5 h-5 text-primary" />
                            </div>
                            <h3 className="font-semibold">Career Mobility</h3>
                        </div>
                    </CardHeader>
                    <CardBody className="p-4">
                        {mobilityRecommendations && mobilityRecommendations.length > 0 ? (
                            <div className="space-y-3">
                                {mobilityRecommendations.slice(0, 4).map((rec, idx) => (
                                    <div key={idx} className="p-3 rounded-lg bg-default-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <Chip 
                                                size="sm" 
                                                color="primary" 
                                                variant="flat"
                                            >
                                                {rec.recommendation_type?.replace(/_/g, ' ')}
                                            </Chip>
                                            <span className="text-sm font-medium">
                                                {rec.match_score}% match
                                            </span>
                                        </div>
                                        {rec.target_position && (
                                            <p className="text-sm font-medium">{rec.target_position.title}</p>
                                        )}
                                        <p className="text-xs text-default-500 mt-1">
                                            {rec.rationale}
                                        </p>
                                        {rec.readiness_months && (
                                            <p className="text-xs text-primary mt-1">
                                                Ready in ~{rec.readiness_months} months
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-default-400">
                                <ArrowsRightLeftIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>No mobility recommendations</p>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>

            {/* Recent Anomalies */}
            {recentAnomalies && recentAnomalies.length > 0 && (
                <Card>
                    <CardHeader className="border-b border-divider p-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-warning/20">
                                <ChartBarIcon className="w-5 h-5 text-warning" />
                            </div>
                            <h3 className="font-semibold">Recent Behavioral Anomalies</h3>
                        </div>
                    </CardHeader>
                    <CardBody className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {recentAnomalies.map((anomaly) => (
                                <div key={anomaly.id} className="p-3 rounded-lg bg-default-100">
                                    <div className="flex items-center justify-between mb-1">
                                        <Chip 
                                            size="sm" 
                                            color={anomaly.severity === 'high' ? 'danger' : 'warning'}
                                            variant="flat"
                                        >
                                            {anomaly.anomaly_type?.replace(/_/g, ' ')}
                                        </Chip>
                                        <span className="text-xs text-default-400">
                                            {anomaly.detected_at}
                                        </span>
                                    </div>
                                    <p className="text-sm">{anomaly.description}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs text-default-500">Deviation:</span>
                                        <span className="text-sm font-medium">{anomaly.deviation_score?.toFixed(1)}σ</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            )}
        </StandardPageLayout>
    );
};

EmployeeRiskProfile.layout = (page) => <App children={page} />;
export default EmployeeRiskProfile;
