import React from 'react';
import {Head, router, useForm} from '@inertiajs/react';
import { hasRoute, safeRoute, safeNavigate, safePost, safePut, safeDelete } from '@/utils/routeUtils';
import {
    Avatar,
    Button,
    Card,
    CardBody,
    Chip,
    Divider,
    Input,
    Select,
    SelectItem,
    Slider,
    Textarea,
} from '@heroui/react';
import {ArrowLeftIcon} from '@heroicons/react/24/outline';
import App from '@/Layouts/App';
import PageHeader from '@/Components/PageHeader';
import {showToast} from '@/utils/toastUtils';

/**
 * Candidate Evaluation Form
 */
export default function CandidateEvaluation({ auth, application, evaluation, criteria }) {
    const isEdit = !!evaluation;

    const { data, setData, post, put, errors, processing } = useForm({
        technical_skills: evaluation?.technical_skills || 0,
        communication_skills: evaluation?.communication_skills || 0,
        problem_solving: evaluation?.problem_solving || 0,
        cultural_fit: evaluation?.cultural_fit || 0,
        leadership: evaluation?.leadership || 0,
        overall_rating: evaluation?.overall_rating || 0,
        strengths: evaluation?.strengths || '',
        weaknesses: evaluation?.weaknesses || '',
        recommendation: evaluation?.recommendation || 'pending',
        comments: evaluation?.comments || '',
        salary_expectation: evaluation?.salary_expectation || '',
        notice_period: evaluation?.notice_period || '',
        availability: evaluation?.availability || '',
    });

    // Auto-calculate overall rating
    React.useEffect(() => {
        const avg = (
            data.technical_skills +
            data.communication_skills +
            data.problem_solving +
            data.cultural_fit +
            data.leadership
        ) / 5;
        setData('overall_rating', Math.round(avg * 10) / 10);
    }, [
        data.technical_skills,
        data.communication_skills,
        data.problem_solving,
        data.cultural_fit,
        data.leadership,
    ]);

    const handleSubmit = (e) => {
        e.preventDefault();

        const url = isEdit
            ? route('hr.recruitment.evaluations.update', evaluation.id)
            : route('hr.recruitment.evaluations.store', application.id);

        const method = isEdit ? put : post;

        method(url, {
            onSuccess: () => {
                showToast('Evaluation saved successfully', 'success');
                safeNavigate('hr.recruitment.applicants.show', application.id);
            },
            onError: () => showToast('Failed to save evaluation', 'error'),
        });
    };

    const getScoreColor = (score) => {
        if (score >= 8) return 'success';
        if (score >= 6) return 'warning';
        return 'danger';
    };

    return (
        <App user={auth.user}>
            <Head title={`Evaluate ${application.first_name} ${application.last_name}`} />

            <PageHeader
                title="Candidate Evaluation"
                description={`Evaluate ${application.first_name} ${application.last_name} for ${application.job?.title}`}
                action={
                    <Button
                        variant="flat"
                        startContent={<ArrowLeftIcon className="h-5 w-5" />}
                        onPress={() => safeNavigate('hr.recruitment.applicants.show', application.id)}
                    >
                        Back
                    </Button>
                }
            />

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Candidate Summary */}
                <Card className="lg:col-span-1">
                    <CardBody>
                        <div className="text-center">
                            <Avatar
                                src={application.photo_url}
                                name={application.first_name}
                                className="mx-auto h-20 w-20"
                            />
                            <h3 className="mt-3 font-bold">
                                {application.first_name} {application.last_name}
                            </h3>
                            <p className="text-sm text-default-500">{application.job?.title}</p>

                            <Divider className="my-4" />

                            <div className="space-y-2 text-left text-sm">
                                <div className="flex justify-between">
                                    <span className="text-default-500">Experience:</span>
                                    <span className="font-medium">
                                        {application.years_of_experience || 0} years
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-default-500">Applied:</span>
                                    <span className="font-medium">
                                        {new Date(application.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-default-500">Status:</span>
                                    <Chip size="sm" variant="flat" color="primary">
                                        {application.status}
                                    </Chip>
                                </div>
                            </div>

                            {data.overall_rating > 0 && (
                                <>
                                    <Divider className="my-4" />
                                    <div>
                                        <p className="mb-2 text-sm text-default-500">Overall Rating</p>
                                        <div className="text-3xl font-bold" style={{ color: 'hsl(var(--heroui-success))' }}>
                                            {data.overall_rating}/10
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </CardBody>
                </Card>

                {/* Evaluation Form */}
                <Card className="lg:col-span-2">
                    <CardBody>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Skills Rating */}
                            <div>
                                <h4 className="mb-4 text-lg font-semibold">Skills Assessment</h4>
                                <div className="space-y-6">
                                    <div>
                                        <div className="mb-2 flex items-center justify-between">
                                            <label className="text-sm font-medium">Technical Skills</label>
                                            <Chip
                                                size="sm"
                                                color={getScoreColor(data.technical_skills)}
                                                variant="flat"
                                            >
                                                {data.technical_skills}/10
                                            </Chip>
                                        </div>
                                        <Slider
                                            value={data.technical_skills}
                                            onChange={(value) => setData('technical_skills', value)}
                                            maxValue={10}
                                            step={1}
                                            color={getScoreColor(data.technical_skills)}
                                            showSteps
                                        />
                                    </div>

                                    <div>
                                        <div className="mb-2 flex items-center justify-between">
                                            <label className="text-sm font-medium">Communication Skills</label>
                                            <Chip
                                                size="sm"
                                                color={getScoreColor(data.communication_skills)}
                                                variant="flat"
                                            >
                                                {data.communication_skills}/10
                                            </Chip>
                                        </div>
                                        <Slider
                                            value={data.communication_skills}
                                            onChange={(value) => setData('communication_skills', value)}
                                            maxValue={10}
                                            step={1}
                                            color={getScoreColor(data.communication_skills)}
                                            showSteps
                                        />
                                    </div>

                                    <div>
                                        <div className="mb-2 flex items-center justify-between">
                                            <label className="text-sm font-medium">Problem Solving</label>
                                            <Chip
                                                size="sm"
                                                color={getScoreColor(data.problem_solving)}
                                                variant="flat"
                                            >
                                                {data.problem_solving}/10
                                            </Chip>
                                        </div>
                                        <Slider
                                            value={data.problem_solving}
                                            onChange={(value) => setData('problem_solving', value)}
                                            maxValue={10}
                                            step={1}
                                            color={getScoreColor(data.problem_solving)}
                                            showSteps
                                        />
                                    </div>

                                    <div>
                                        <div className="mb-2 flex items-center justify-between">
                                            <label className="text-sm font-medium">Cultural Fit</label>
                                            <Chip
                                                size="sm"
                                                color={getScoreColor(data.cultural_fit)}
                                                variant="flat"
                                            >
                                                {data.cultural_fit}/10
                                            </Chip>
                                        </div>
                                        <Slider
                                            value={data.cultural_fit}
                                            onChange={(value) => setData('cultural_fit', value)}
                                            maxValue={10}
                                            step={1}
                                            color={getScoreColor(data.cultural_fit)}
                                            showSteps
                                        />
                                    </div>

                                    <div>
                                        <div className="mb-2 flex items-center justify-between">
                                            <label className="text-sm font-medium">Leadership Potential</label>
                                            <Chip
                                                size="sm"
                                                color={getScoreColor(data.leadership)}
                                                variant="flat"
                                            >
                                                {data.leadership}/10
                                            </Chip>
                                        </div>
                                        <Slider
                                            value={data.leadership}
                                            onChange={(value) => setData('leadership', value)}
                                            maxValue={10}
                                            step={1}
                                            color={getScoreColor(data.leadership)}
                                            showSteps
                                        />
                                    </div>
                                </div>
                            </div>

                            <Divider />

                            {/* Detailed Feedback */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <Textarea
                                    label="Strengths"
                                    placeholder="List candidate's key strengths..."
                                    value={data.strengths}
                                    onChange={(e) => setData('strengths', e.target.value)}
                                    minRows={4}
                                    isInvalid={!!errors.strengths}
                                    errorMessage={errors.strengths}
                                />

                                <Textarea
                                    label="Areas for Improvement"
                                    placeholder="List areas where candidate can improve..."
                                    value={data.weaknesses}
                                    onChange={(e) => setData('weaknesses', e.target.value)}
                                    minRows={4}
                                    isInvalid={!!errors.weaknesses}
                                    errorMessage={errors.weaknesses}
                                />
                            </div>

                            <Textarea
                                label="Overall Comments"
                                placeholder="Provide overall feedback and observations..."
                                value={data.comments}
                                onChange={(e) => setData('comments', e.target.value)}
                                minRows={6}
                                isInvalid={!!errors.comments}
                                errorMessage={errors.comments}
                            />

                            <Divider />

                            {/* Additional Information */}
                            <div className="grid gap-4 md:grid-cols-3">
                                <Input
                                    label="Salary Expectation"
                                    placeholder="e.g., $80,000"
                                    value={data.salary_expectation}
                                    onChange={(e) => setData('salary_expectation', e.target.value)}
                                />

                                <Input
                                    label="Notice Period"
                                    placeholder="e.g., 2 weeks"
                                    value={data.notice_period}
                                    onChange={(e) => setData('notice_period', e.target.value)}
                                />

                                <Input
                                    label="Availability"
                                    placeholder="e.g., Immediate"
                                    value={data.availability}
                                    onChange={(e) => setData('availability', e.target.value)}
                                />
                            </div>

                            {/* Recommendation */}
                            <Select
                                label="Recommendation"
                                placeholder="Select recommendation"
                                selectedKeys={[data.recommendation]}
                                onChange={(e) => setData('recommendation', e.target.value)}
                                isRequired
                            >
                                <SelectItem key="strongly_recommend" value="strongly_recommend">
                                    Strongly Recommend
                                </SelectItem>
                                <SelectItem key="recommend" value="recommend">
                                    Recommend
                                </SelectItem>
                                <SelectItem key="pending" value="pending">
                                    Pending Decision
                                </SelectItem>
                                <SelectItem key="not_recommend" value="not_recommend">
                                    Do Not Recommend
                                </SelectItem>
                            </Select>

                            {/* Submit Buttons */}
                            <div className="flex justify-end gap-3">
                                <Button
                                    variant="flat"
                                    onPress={() => safeNavigate('hr.recruitment.applicants.show', application.id)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    color="primary"
                                    isLoading={processing}
                                >
                                    {isEdit ? 'Update Evaluation' : 'Submit Evaluation'}
                                </Button>
                            </div>
                        </form>
                    </CardBody>
                </Card>
            </div>
        </App>
    );
}
