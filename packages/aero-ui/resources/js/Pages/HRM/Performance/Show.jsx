import {Head, router} from '@inertiajs/react';
import {Avatar, Button, Card, CardBody, Chip, Divider, Progress, Tab, Tabs} from '@heroui/react';
import {ArrowLeftIcon, CalendarIcon, ChartBarIcon, CheckCircleIcon, PencilIcon} from '@heroicons/react/24/outline';
import App from '@ui/Layouts/App';
import PageHeader from '@ui/Components/PageHeader';

export default function PerformanceShow({ auth, review, canEdit }) {
    const statusColors = {
        draft: 'default',
        in_progress: 'primary',
        completed: 'success',
        overdue: 'danger'
    };

    const handleBack = () => {
        router.visit(route('hr.performance.index'));
    };

    const handleEdit = () => {
        router.visit(route('hr.performance.edit', review.id));
    };

    const renderScoreColor = (score) => {
        if (score >= 80) return 'success';
        if (score >= 60) return 'warning';
        return 'danger';
    };

    return (
        <App user={auth.user}>
            <Head title={`Performance Review - ${review.employee_name}`} />
            
            <PageHeader
                title="Performance Review Details"
                subtitle={`Review for ${review.employee_name}`}
                action={
                    <div className="flex gap-2">
                        <Button
                            variant="flat"
                            startContent={<ArrowLeftIcon className="w-4 h-4" />}
                            onPress={handleBack}
                        >
                            Back
                        </Button>
                        {canEdit && (
                            <Button
                                color="primary"
                                startContent={<PencilIcon className="w-4 h-4" />}
                                onPress={handleEdit}
                            >
                                Edit
                            </Button>
                        )}
                    </div>
                }
            />

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardBody>
                        <div className="flex items-center gap-3">
                            <Avatar 
                                src={review.employee_avatar}
                                name={review.employee_name}
                                size="lg"
                            />
                            <div>
                                <p className="font-semibold">{review.employee_name}</p>
                                <p className="text-sm text-gray-600">{review.designation}</p>
                                <p className="text-xs text-gray-500">{review.department}</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                                <Chip color={statusColors[review.status]} className="mt-2">
                                    {review.status.replace('_', ' ').toUpperCase()}
                                </Chip>
                            </div>
                            <CheckCircleIcon className="w-8 h-8 text-gray-400" />
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Review Period</p>
                                <p className="text-lg font-semibold mt-1">{review.review_period}</p>
                            </div>
                            <CalendarIcon className="w-8 h-8 text-blue-500" />
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Final Score</p>
                                {review.final_score ? (
                                    <>
                                        <p className="text-3xl font-bold mt-1">{review.final_score}%</p>
                                        <Progress 
                                            value={review.final_score} 
                                            maxValue={100} 
                                            color={renderScoreColor(review.final_score)}
                                            size="sm"
                                            className="mt-2"
                                        />
                                    </>
                                ) : (
                                    <p className="text-gray-400 mt-1">Not scored yet</p>
                                )}
                            </div>
                            <ChartBarIcon className="w-8 h-8 text-green-500" />
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Main Content */}
            <Card>
                <CardBody>
                    <Tabs aria-label="Review details">
                        <Tab key="overview" title="Overview">
                            <div className="space-y-6 pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="font-semibold mb-2">Review Information</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Review Type:</span>
                                                <span className="font-medium capitalize">{review.review_type}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Reviewer:</span>
                                                <span className="font-medium">{review.reviewer_name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Due Date:</span>
                                                <span className="font-medium">{review.due_date}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Created:</span>
                                                <span className="font-medium">{review.created_at}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold mb-2">Employee Information</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Department:</span>
                                                <span className="font-medium">{review.department}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Designation:</span>
                                                <span className="font-medium">{review.designation}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Join Date:</span>
                                                <span className="font-medium">{review.employee_join_date}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {review.goals && (
                                    <>
                                        <Divider />
                                        <div>
                                            <h4 className="font-semibold mb-2">Goals & Objectives</h4>
                                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                                {review.goals}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </Tab>

                        <Tab key="kpis" title="KPIs & Performance">
                            <div className="space-y-4 pt-4">
                                {review.kpis && review.kpis.length > 0 ? (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                            <Card>
                                                <CardBody>
                                                    <p className="text-sm text-gray-600">Total KPIs</p>
                                                    <p className="text-2xl font-bold">{review.kpis.length}</p>
                                                </CardBody>
                                            </Card>
                                            <Card>
                                                <CardBody>
                                                    <p className="text-sm text-gray-600">Average Score</p>
                                                    <p className="text-2xl font-bold">{review.average_kpi_score}%</p>
                                                </CardBody>
                                            </Card>
                                            <Card>
                                                <CardBody>
                                                    <p className="text-sm text-gray-600">Weighted Score</p>
                                                    <p className="text-2xl font-bold">{review.weighted_score}%</p>
                                                </CardBody>
                                            </Card>
                                        </div>

                                        <div className="space-y-4">
                                            {review.kpis.map((kpi, index) => (
                                                <Card key={index}>
                                                    <CardBody>
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div>
                                                                <h5 className="font-semibold">{kpi.name}</h5>
                                                                {kpi.description && (
                                                                    <p className="text-sm text-gray-600 mt-1">{kpi.description}</p>
                                                                )}
                                                                <Chip size="sm" className="mt-2 capitalize">
                                                                    {kpi.category}
                                                                </Chip>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm text-gray-600">Weight</p>
                                                                <p className="font-semibold">{kpi.weight}%</p>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-3 gap-4 mb-3">
                                                            <div>
                                                                <p className="text-sm text-gray-600">Target</p>
                                                                <p className="font-semibold">{kpi.target}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm text-gray-600">Actual</p>
                                                                <p className="font-semibold">{kpi.actual}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm text-gray-600">Score</p>
                                                                <p className={`font-semibold text-${renderScoreColor(kpi.score)}`}>
                                                                    {kpi.score}%
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <Progress 
                                                            value={kpi.score} 
                                                            maxValue={100} 
                                                            color={renderScoreColor(kpi.score)}
                                                            size="sm"
                                                        />
                                                    </CardBody>
                                                </Card>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-center text-gray-500 py-8">No KPIs defined for this review</p>
                                )}
                            </div>
                        </Tab>

                        <Tab key="comments" title="Comments & Feedback">
                            <div className="space-y-4 pt-4">
                                {review.comments ? (
                                    <Card>
                                        <CardBody>
                                            <h5 className="font-semibold mb-2">Reviewer Comments</h5>
                                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                                {review.comments}
                                            </p>
                                        </CardBody>
                                    </Card>
                                ) : (
                                    <p className="text-center text-gray-500 py-8">No comments added yet</p>
                                )}

                                {review.employee_comments && (
                                    <Card>
                                        <CardBody>
                                            <h5 className="font-semibold mb-2">Employee Response</h5>
                                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                                {review.employee_comments}
                                            </p>
                                        </CardBody>
                                    </Card>
                                )}
                            </div>
                        </Tab>
                    </Tabs>
                </CardBody>
            </Card>
        </App>
    );
}
