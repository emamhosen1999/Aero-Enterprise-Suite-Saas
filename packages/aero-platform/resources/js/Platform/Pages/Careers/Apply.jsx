import { Head, Link, useForm } from '@inertiajs/react';
import { Card, CardBody, CardHeader, Button, Input, Textarea, Select, SelectItem } from '@heroui/react';
import { ArrowLeftIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';

export default function CareersApply({ job }) {
    const { data, setData, post, processing, errors, progress } = useForm({
        job_id: job.id,
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        location: '',
        linkedin_url: '',
        portfolio_url: '',
        years_of_experience: '',
        current_position: '',
        current_company: '',
        expected_salary: '',
        notice_period: '',
        available_from: '',
        cover_letter: '',
        resume: null,
        education: '',
        skills: '',
        references: '',
    });

    const [resumeFile, setResumeFile] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('careers.submit', job.id), {
            forceFormData: true,
        });
    };

    const handleResumeChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setResumeFile(file);
            setData('resume', file);
        }
    };

    return (
        <PublicLayout>
            <Head title={`Apply for ${job.title}`} />

            {/* Header */}
            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-8">
                <div className="container mx-auto px-4">
                    <Button
                        as={Link}
                        href={route('careers.show', job.id)}
                        variant="light"
                        className="text-white mb-3"
                        startContent={<ArrowLeftIcon className="w-4 h-4" />}
                    >
                        Back to Job Details
                    </Button>
                    <h1 className="text-3xl font-bold">Apply for {job.title}</h1>
                    <p className="text-lg opacity-90 mt-2">
                        {job.department?.name} • {job.employment_type}
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <form onSubmit={handleSubmit}>
                        {/* Personal Information */}
                        <Card className="mb-6">
                            <CardHeader>
                                <h2 className="text-xl font-bold">Personal Information</h2>
                            </CardHeader>
                            <CardBody className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="First Name"
                                        placeholder="John"
                                        value={data.first_name}
                                        onChange={e => setData('first_name', e.target.value)}
                                        isRequired
                                        isInvalid={!!errors.first_name}
                                        errorMessage={errors.first_name}
                                    />
                                    <Input
                                        label="Last Name"
                                        placeholder="Doe"
                                        value={data.last_name}
                                        onChange={e => setData('last_name', e.target.value)}
                                        isRequired
                                        isInvalid={!!errors.last_name}
                                        errorMessage={errors.last_name}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        type="email"
                                        label="Email Address"
                                        placeholder="john.doe@example.com"
                                        value={data.email}
                                        onChange={e => setData('email', e.target.value)}
                                        isRequired
                                        isInvalid={!!errors.email}
                                        errorMessage={errors.email}
                                    />
                                    <Input
                                        type="tel"
                                        label="Phone Number"
                                        placeholder="+1 (555) 123-4567"
                                        value={data.phone}
                                        onChange={e => setData('phone', e.target.value)}
                                        isRequired
                                        isInvalid={!!errors.phone}
                                        errorMessage={errors.phone}
                                    />
                                </div>

                                <Input
                                    label="Current Location"
                                    placeholder="City, Country"
                                    value={data.location}
                                    onChange={e => setData('location', e.target.value)}
                                    isInvalid={!!errors.location}
                                    errorMessage={errors.location}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="LinkedIn Profile (Optional)"
                                        placeholder="https://linkedin.com/in/johndoe"
                                        value={data.linkedin_url}
                                        onChange={e => setData('linkedin_url', e.target.value)}
                                        isInvalid={!!errors.linkedin_url}
                                        errorMessage={errors.linkedin_url}
                                    />
                                    <Input
                                        label="Portfolio/Website (Optional)"
                                        placeholder="https://johndoe.com"
                                        value={data.portfolio_url}
                                        onChange={e => setData('portfolio_url', e.target.value)}
                                        isInvalid={!!errors.portfolio_url}
                                        errorMessage={errors.portfolio_url}
                                    />
                                </div>
                            </CardBody>
                        </Card>

                        {/* Professional Experience */}
                        <Card className="mb-6">
                            <CardHeader>
                                <h2 className="text-xl font-bold">Professional Experience</h2>
                            </CardHeader>
                            <CardBody className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        type="number"
                                        label="Years of Experience"
                                        placeholder="5"
                                        value={data.years_of_experience}
                                        onChange={e => setData('years_of_experience', e.target.value)}
                                        isRequired
                                        isInvalid={!!errors.years_of_experience}
                                        errorMessage={errors.years_of_experience}
                                    />
                                    <Input
                                        label="Current Position"
                                        placeholder="Software Engineer"
                                        value={data.current_position}
                                        onChange={e => setData('current_position', e.target.value)}
                                        isInvalid={!!errors.current_position}
                                        errorMessage={errors.current_position}
                                    />
                                </div>

                                <Input
                                    label="Current Company (Optional)"
                                    placeholder="Tech Corp Inc."
                                    value={data.current_company}
                                    onChange={e => setData('current_company', e.target.value)}
                                    isInvalid={!!errors.current_company}
                                    errorMessage={errors.current_company}
                                />

                                <Textarea
                                    label="Education"
                                    placeholder="List your educational qualifications..."
                                    value={data.education}
                                    onChange={e => setData('education', e.target.value)}
                                    minRows={3}
                                    isInvalid={!!errors.education}
                                    errorMessage={errors.education}
                                />

                                <Textarea
                                    label="Skills"
                                    placeholder="List your relevant skills (e.g., JavaScript, React, Node.js, etc.)"
                                    value={data.skills}
                                    onChange={e => setData('skills', e.target.value)}
                                    minRows={3}
                                    isRequired
                                    isInvalid={!!errors.skills}
                                    errorMessage={errors.skills}
                                />
                            </CardBody>
                        </Card>

                        {/* Application Details */}
                        <Card className="mb-6">
                            <CardHeader>
                                <h2 className="text-xl font-bold">Application Details</h2>
                            </CardHeader>
                            <CardBody className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        type="number"
                                        label="Expected Salary (Annual)"
                                        placeholder="75000"
                                        value={data.expected_salary}
                                        onChange={e => setData('expected_salary', e.target.value)}
                                        startContent={
                                            <div className="pointer-events-none flex items-center">
                                                <span className="text-default-400 text-small">{job.salary_currency || '$'}</span>
                                            </div>
                                        }
                                        isInvalid={!!errors.expected_salary}
                                        errorMessage={errors.expected_salary}
                                    />
                                    <Input
                                        label="Notice Period (in days)"
                                        placeholder="30"
                                        value={data.notice_period}
                                        onChange={e => setData('notice_period', e.target.value)}
                                        isInvalid={!!errors.notice_period}
                                        errorMessage={errors.notice_period}
                                    />
                                </div>

                                <Input
                                    type="date"
                                    label="Available From"
                                    value={data.available_from}
                                    onChange={e => setData('available_from', e.target.value)}
                                    isInvalid={!!errors.available_from}
                                    errorMessage={errors.available_from}
                                />

                                <Textarea
                                    label="Cover Letter"
                                    placeholder="Tell us why you're interested in this position and what makes you a great fit..."
                                    value={data.cover_letter}
                                    onChange={e => setData('cover_letter', e.target.value)}
                                    minRows={6}
                                    isRequired
                                    isInvalid={!!errors.cover_letter}
                                    errorMessage={errors.cover_letter}
                                />
                            </CardBody>
                        </Card>

                        {/* Resume Upload */}
                        <Card className="mb-6">
                            <CardHeader>
                                <h2 className="text-xl font-bold">Resume/CV</h2>
                            </CardHeader>
                            <CardBody>
                                <div className="border-2 border-dashed border-default-300 rounded-xl p-8 text-center">
                                    <DocumentArrowUpIcon className="w-12 h-12 mx-auto text-default-400 mb-3" />
                                    <input
                                        type="file"
                                        id="resume"
                                        accept=".pdf,.doc,.docx"
                                        onChange={handleResumeChange}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="resume"
                                        className="cursor-pointer text-primary-600 hover:text-primary-700 font-medium"
                                    >
                                        Click to upload
                                    </label>
                                    <span className="text-default-500"> or drag and drop</span>
                                    <p className="text-sm text-default-400 mt-2">
                                        PDF, DOC, or DOCX (max. 5MB)
                                    </p>
                                    {resumeFile && (
                                        <p className="text-sm text-success-600 mt-3">
                                            ✓ {resumeFile.name}
                                        </p>
                                    )}
                                    {errors.resume && (
                                        <p className="text-sm text-danger mt-2">{errors.resume}</p>
                                    )}
                                </div>
                                {progress && (
                                    <div className="mt-4">
                                        <div className="h-2 bg-default-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary-500 transition-all duration-300"
                                                style={{ width: `${progress.percentage}%` }}
                                            />
                                        </div>
                                        <p className="text-sm text-default-500 mt-1 text-center">
                                            Uploading... {progress.percentage}%
                                        </p>
                                    </div>
                                )}
                            </CardBody>
                        </Card>

                        {/* References (Optional) */}
                        <Card className="mb-6">
                            <CardHeader>
                                <h2 className="text-xl font-bold">References (Optional)</h2>
                            </CardHeader>
                            <CardBody>
                                <Textarea
                                    label="Professional References"
                                    placeholder="Name, Position, Company, Contact Information..."
                                    value={data.references}
                                    onChange={e => setData('references', e.target.value)}
                                    minRows={4}
                                    isInvalid={!!errors.references}
                                    errorMessage={errors.references}
                                />
                            </CardBody>
                        </Card>

                        {/* Submit */}
                        <Card>
                            <CardBody>
                                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                                    <p className="text-sm text-default-500">
                                        By submitting this application, you agree to our terms and privacy policy.
                                    </p>
                                    <div className="flex gap-3">
                                        <Button
                                            as={Link}
                                            href={route('careers.show', job.id)}
                                            variant="flat"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            color="primary"
                                            isLoading={processing}
                                        >
                                            Submit Application
                                        </Button>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </form>
                </div>
            </div>
        </PublicLayout>
    );
}
