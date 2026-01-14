import { Card, CardBody, CardHeader, Chip, Button, Skeleton, Progress } from '@heroui/react';
import { ShieldCheckIcon, CheckBadgeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';

export default function ComplianceScoreWidget({ score = 0, grade = 'N/A', compliant_items = 0, non_compliant_items = 0, pending_review = 0, trend = 'stable', loading, show_more_url, title }) {
    if (loading) {
        return (
            <Card className="aero-card">
                <CardHeader className="border-b border-divider p-4">
                    <Skeleton className="h-6 w-40 rounded" />
                </CardHeader>
                <CardBody className="p-4">
                    <div className="space-y-3">
                        <Skeleton className="h-16 w-full rounded" />
                        <Skeleton className="h-4 w-full rounded" />
                        <Skeleton className="h-8 w-full rounded" />
                    </div>
                </CardBody>
            </Card>
        );
    }

    const getScoreColor = () => {
        if (score >= 90) return 'success';
        if (score >= 70) return 'warning';
        return 'danger';
    };

    const getGradeColor = () => {
        if (grade === 'A' || grade === 'A+') return 'success';
        if (grade === 'B' || grade === 'B+') return 'primary';
        if (grade === 'C' || grade === 'C+') return 'warning';
        return 'danger';
    };

    return (
        <Card className="aero-card">
            <CardHeader className="border-b border-divider p-4">
                <div className="flex items-center gap-2">
                    <ShieldCheckIcon className="w-5 h-5 text-primary" />
                    <span className="font-semibold">{title || 'Compliance Score'}</span>
                </div>
            </CardHeader>
            <CardBody className="p-4">
                <div className="space-y-4">
                    <div className="flex items-center justify-center gap-4">
                        <div className="text-center">
                            <p className={`text-4xl font-bold text-${getScoreColor()}`}>{score}%</p>
                            <p className="text-xs text-default-500">Overall Score</p>
                        </div>
                        <div className={`p-3 rounded-full bg-${getGradeColor()}/20`}>
                            <span className={`text-2xl font-bold text-${getGradeColor()}`}>{grade}</span>
                        </div>
                    </div>
                    <Progress 
                        value={score} 
                        color={getScoreColor()} 
                        size="lg" 
                        className="h-3"
                    />
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div className="p-2 bg-success/10 rounded-lg">
                            <CheckBadgeIcon className="w-4 h-4 mx-auto text-success mb-1" />
                            <p className="font-bold text-success">{compliant_items}</p>
                            <p className="text-xs text-default-500">Compliant</p>
                        </div>
                        <div className="p-2 bg-danger/10 rounded-lg">
                            <ExclamationTriangleIcon className="w-4 h-4 mx-auto text-danger mb-1" />
                            <p className="font-bold text-danger">{non_compliant_items}</p>
                            <p className="text-xs text-default-500">Non-Compliant</p>
                        </div>
                        <div className="p-2 bg-warning/10 rounded-lg">
                            <ShieldCheckIcon className="w-4 h-4 mx-auto text-warning mb-1" />
                            <p className="font-bold text-warning">{pending_review}</p>
                            <p className="text-xs text-default-500">Pending</p>
                        </div>
                    </div>
                    {show_more_url && (
                        <Button
                            as={Link}
                            href={show_more_url}
                            size="sm"
                            variant="flat"
                            color="primary"
                            className="w-full"
                        >
                            View Details
                        </Button>
                    )}
                </div>
            </CardBody>
        </Card>
    );
}
