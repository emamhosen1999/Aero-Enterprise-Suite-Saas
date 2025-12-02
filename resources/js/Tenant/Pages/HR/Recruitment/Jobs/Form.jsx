import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Input,
    Textarea,
    Select,
    SelectItem,
    Tabs,
    Tab,
    Chip,
    Switch,
} from '@heroui/react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import App from '@/Layouts/App.jsx';
import PageHeader from '@/Components/PageHeader';
import { showToast } from '@/utils/toastUtils';

/**
 * Create/Edit Job Posting Form
 */
export default function JobForm({ auth, job, departments, jobTypes, locations }) {
    const isEdit = !!job;
    const [activeTab, setActiveTab] = useState('basic');

    const { data, setData, post, put, errors, processing } = useForm({
        title: job?.title || '',
        code: job?.code || '',
        department_id: job?.department_id || '',
        job_type_id: job?.job_type_id || '',
        location: job?.location || '',
        employment_type: job?.employment_type || 'full_time',
        experience_required: job?.experience_required || '',
        salary_min: job?.salary_min || '',
        salary_max: job?.salary_max || '',
        salary_currency: job?.salary_currency || 'USD',
        openings: job?.openings || 1,
        description: job?.description || '',
        requirements: job?.requirements || '',
        responsibilities: job?.responsibilities || '',
        benefits: job?.benefits || '',
        application_deadline: job?.application_deadline || '',
        is_published: job?.is_published || false,
        is_remote: job?.is_remote || false,
        status: job?.status || 'draft',
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        if (isEdit) {
            put(route('hr.recruitment.jobs.update', job.id), {
                onSuccess: () => {
                    showToast('Job updated successfully', 'success');
                    router.visit(route('hr.recruitment.jobs.index'));
                },
                onError: () => showToast('Failed to update job', 'error'),
            });
        } else {
            post(route('hr.recruitment.jobs.store'), {
                onSuccess: () => {
                    showToast('Job created successfully', 'success');
                    router.visit(route('hr.recruitment.jobs.index'));
                },
                onError: () => showToast('Failed to create job', 'error'),
            });
        }
    };

    return (
        <App user={auth.user}>
            <Head title={isEdit ? 'Edit Job' : 'Create Job'} />

            <PageHeader
                title={isEdit ? 'Edit Job Posting' : 'Create Job Posting'}
                description={isEdit ? 'Update job details' : 'Create a new job opening'}
                action={
                    <Button
                        variant="flat"
                        startContent={<ArrowLeftIcon className="h-5 w-5" />}
                        onPress={() => router.visit(route('hr.recruitment.jobs.index'))}
                    >
                        Back to Jobs
                    </Button>
                }
            />

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardBody>
                        <Tabs
                            selectedKey={activeTab}
                            onSelectionChange={setActiveTab}
                            className="mb-6"
                        >
                            {/* Basic Information Tab */}
                            <Tab key="basic" title="Basic Information">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <Input
                                        label="Job Title"
                                        placeholder="e.g., Senior Software Engineer"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        isInvalid={!!errors.title}
                                        errorMessage={errors.title}
                                        isRequired
                                    />

                                    <Input
                                        label="Job Code"
                                        placeholder="e.g., JOB-2025-001"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value)}
                                        isInvalid={!!errors.code}
                                        errorMessage={errors.code}
                                        isRequired
                                    />

                                    <Select
                                        label="Department"
                                        placeholder="Select department"
                                        selectedKeys={data.department_id ? [data.department_id.toString()] : []}
                                        onChange={(e) => setData('department_id', e.target.value)}
                                        isInvalid={!!errors.department_id}
                                        errorMessage={errors.department_id}
                                        isRequired
                                    >
                                        {departments?.map((dept) => (
                                            <SelectItem key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </SelectItem>
                                        ))}
                                    </Select>

                                    <Select
                                        label="Job Type"
                                        placeholder="Select job type"
                                        selectedKeys={data.job_type_id ? [data.job_type_id.toString()] : []}
                                        onChange={(e) => setData('job_type_id', e.target.value)}
                                        isInvalid={!!errors.job_type_id}
                                        errorMessage={errors.job_type_id}
                                    >
                                        {jobTypes?.map((type) => (
                                            <SelectItem key={type.id} value={type.id}>
                                                {type.name}
                                            </SelectItem>
                                        ))}
                                    </Select>

                                    <Select
                                        label="Employment Type"
                                        placeholder="Select employment type"
                                        selectedKeys={[data.employment_type]}
                                        onChange={(e) => setData('employment_type', e.target.value)}
                                        isRequired
                                    >
                                        <SelectItem key="full_time" value="full_time">Full Time</SelectItem>
                                        <SelectItem key="part_time" value="part_time">Part Time</SelectItem>
                                        <SelectItem key="contract" value="contract">Contract</SelectItem>
                                        <SelectItem key="internship" value="internship">Internship</SelectItem>
                                        <SelectItem key="temporary" value="temporary">Temporary</SelectItem>
                                    </Select>

                                    <Input
                                        label="Location"
                                        placeholder="e.g., New York, NY"
                                        value={data.location}
                                        onChange={(e) => setData('location', e.target.value)}
                                        isInvalid={!!errors.location}
                                        errorMessage={errors.location}
                                        isRequired
                                    />

                                    <Input
                                        label="Experience Required (years)"
                                        type="number"
                                        placeholder="e.g., 5"
                                        value={data.experience_required}
                                        onChange={(e) => setData('experience_required', e.target.value)}
                                        isInvalid={!!errors.experience_required}
                                        errorMessage={errors.experience_required}
                                    />

                                    <Input
                                        label="Number of Openings"
                                        type="number"
                                        value={data.openings}
                                        onChange={(e) => setData('openings', e.target.value)}
                                        isInvalid={!!errors.openings}
                                        errorMessage={errors.openings}
                                        min="1"
                                        isRequired
                                    />

                                    <div className="flex gap-4">
                                        <Switch
                                            isSelected={data.is_remote}
                                            onValueChange={(value) => setData('is_remote', value)}
                                        >
                                            Remote Work Available
                                        </Switch>
                                    </div>
                                </div>
                            </Tab>

                            {/* Compensation Tab */}
                            <Tab key="compensation" title="Compensation">
                                <div className="grid gap-6 md:grid-cols-3">
                                    <Input
                                        label="Minimum Salary"
                                        type="number"
                                        placeholder="50000"
                                        value={data.salary_min}
                                        onChange={(e) => setData('salary_min', e.target.value)}
                                        isInvalid={!!errors.salary_min}
                                        errorMessage={errors.salary_min}
                                    />

                                    <Input
                                        label="Maximum Salary"
                                        type="number"
                                        placeholder="80000"
                                        value={data.salary_max}
                                        onChange={(e) => setData('salary_max', e.target.value)}
                                        isInvalid={!!errors.salary_max}
                                        errorMessage={errors.salary_max}
                                    />

                                    <Select
                                        label="Currency"
                                        selectedKeys={[data.salary_currency]}
                                        onChange={(e) => setData('salary_currency', e.target.value)}
                                    >
                                        <SelectItem key="USD" value="USD">USD</SelectItem>
                                        <SelectItem key="EUR" value="EUR">EUR</SelectItem>
                                        <SelectItem key="GBP" value="GBP">GBP</SelectItem>
                                        <SelectItem key="BDT" value="BDT">BDT</SelectItem>
                                    </Select>
                                </div>

                                <Textarea
                                    label="Benefits"
                                    placeholder="List benefits and perks..."
                                    value={data.benefits}
                                    onChange={(e) => setData('benefits', e.target.value)}
                                    minRows={4}
                                    className="mt-6"
                                />
                            </Tab>

                            {/* Description Tab */}
                            <Tab key="description" title="Description & Requirements">
                                <div className="space-y-6">
                                    <Textarea
                                        label="Job Description"
                                        placeholder="Provide a detailed job description..."
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        isInvalid={!!errors.description}
                                        errorMessage={errors.description}
                                        minRows={6}
                                        isRequired
                                    />

                                    <Textarea
                                        label="Requirements"
                                        placeholder="List required skills and qualifications..."
                                        value={data.requirements}
                                        onChange={(e) => setData('requirements', e.target.value)}
                                        isInvalid={!!errors.requirements}
                                        errorMessage={errors.requirements}
                                        minRows={6}
                                        isRequired
                                    />

                                    <Textarea
                                        label="Responsibilities"
                                        placeholder="Describe key responsibilities..."
                                        value={data.responsibilities}
                                        onChange={(e) => setData('responsibilities', e.target.value)}
                                        isInvalid={!!errors.responsibilities}
                                        errorMessage={errors.responsibilities}
                                        minRows={6}
                                    />
                                </div>
                            </Tab>

                            {/* Settings Tab */}
                            <Tab key="settings" title="Settings">
                                <div className="space-y-6">
                                    <Input
                                        label="Application Deadline"
                                        type="date"
                                        value={data.application_deadline}
                                        onChange={(e) => setData('application_deadline', e.target.value)}
                                        isInvalid={!!errors.application_deadline}
                                        errorMessage={errors.application_deadline}
                                    />

                                    <Select
                                        label="Status"
                                        selectedKeys={[data.status]}
                                        onChange={(e) => setData('status', e.target.value)}
                                    >
                                        <SelectItem key="draft" value="draft">Draft</SelectItem>
                                        <SelectItem key="published" value="published">Published</SelectItem>
                                        <SelectItem key="closed" value="closed">Closed</SelectItem>
                                        <SelectItem key="on_hold" value="on_hold">On Hold</SelectItem>
                                    </Select>

                                    <Switch
                                        isSelected={data.is_published}
                                        onValueChange={(value) => setData('is_published', value)}
                                    >
                                        Publish Immediately
                                    </Switch>
                                </div>
                            </Tab>
                        </Tabs>

                        {/* Action Buttons */}
                        <div className="mt-6 flex justify-end gap-3">
                            <Button
                                variant="flat"
                                onPress={() => router.visit(route('hr.recruitment.jobs.index'))}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                color="primary"
                                isLoading={processing}
                            >
                                {isEdit ? 'Update Job' : 'Create Job'}
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </form>
        </App>
    );
}
