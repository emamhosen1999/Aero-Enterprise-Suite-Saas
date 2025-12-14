import { Head, Link } from '@inertiajs/react';
import { Card, CardBody, CardHeader, Chip, Button, Divider } from '@heroui/react';
import { 
    MapPinIcon, 
    BriefcaseIcon, 
    ClockIcon, 
    CurrencyDollarIcon,
    AcademicCapIcon,
    CheckCircleIcon,
    ArrowLeftIcon
} from '@heroicons/react/24/outline';
import PublicLayout from '@/Layouts/PublicLayout';

export default function CareersShow({ job }) {
    const getEmploymentTypeColor = (type) => {
        const colors = {
            'Full-time': 'success',
            'Part-time': 'primary',
            'Contract': 'warning',
            'Internship': 'secondary',
        };
        return colors[type] || 'default';
    };

    return (
        <PublicLayout>
            <Head title={`${job.title} - Career Opportunity`} />

            {/* Header */}
            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-12">
                <div className="container mx-auto px-4">
                    <Button
                        as={Link}
                        href={route('careers.index')}
                        variant="light"
                        className="text-white mb-4"
                        startContent={<ArrowLeftIcon className="w-4 h-4" />}
                    >
                        Back to Careers
                    </Button>
                    <h1 className="text-4xl font-bold mb-3">{job.title}</h1>
                    <div className="flex flex-wrap gap-2">
                        {job.department && (
                            <Chip size="md" variant="flat" className="bg-white/20 text-white">
                                {job.department.name}
                            </Chip>
                        )}
                        <Chip size="md" variant="flat" className="bg-white/20 text-white">
                            {job.employment_type}
                        </Chip>
                        {job.remote_work && (
                            <Chip size="md" variant="flat" className="bg-white/20 text-white">
                                Remote Available
                            </Chip>
                        )}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Overview */}
                        <Card>
                            <CardHeader>
                                <h2 className="text-2xl font-bold">Job Overview</h2>
                            </CardHeader>
                            <CardBody>
                                <div className="prose max-w-none">
                                    <p className="text-default-700 whitespace-pre-line">
                                        {job.description}
                                    </p>
                                </div>
                            </CardBody>
                        </Card>

                        {/* Responsibilities */}
                        {job.responsibilities && (
                            <Card>
                                <CardHeader>
                                    <h2 className="text-2xl font-bold">Key Responsibilities</h2>
                                </CardHeader>
                                <CardBody>
                                    <div className="prose max-w-none">
                                        <p className="text-default-700 whitespace-pre-line">
                                            {job.responsibilities}
                                        </p>
                                    </div>
                                </CardBody>
                            </Card>
                        )}

                        {/* Requirements */}
                        {job.requirements && (
                            <Card>
                                <CardHeader>
                                    <h2 className="text-2xl font-bold">Requirements</h2>
                                </CardHeader>
                                <CardBody>
                                    <div className="prose max-w-none">
                                        <p className="text-default-700 whitespace-pre-line">
                                            {job.requirements}
                                        </p>
                                    </div>
                                </CardBody>
                            </Card>
                        )}

                        {/* Benefits */}
                        {job.benefits && (
                            <Card>
                                <CardHeader>
                                    <h2 className="text-2xl font-bold">Benefits & Perks</h2>
                                </CardHeader>
                                <CardBody>
                                    <div className="prose max-w-none">
                                        <p className="text-default-700 whitespace-pre-line">
                                            {job.benefits}
                                        </p>
                                    </div>
                                </CardBody>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Apply Card */}
                        <Card className="sticky top-4">
                            <CardBody className="text-center">
                                <h3 className="text-xl font-bold mb-4">Interested in this role?</h3>
                                <Button
                                    as={Link}
                                    href={route('careers.apply', job.id)}
                                    color="primary"
                                    size="lg"
                                    className="w-full mb-3"
                                >
                                    Apply Now
                                </Button>
                                <p className="text-sm text-default-500">
                                    Application takes about 5-10 minutes
                                </p>
                            </CardBody>
                        </Card>

                        {/* Job Details */}
                        <Card>
                            <CardHeader>
                                <h3 className="text-lg font-bold">Job Details</h3>
                            </CardHeader>
                            <CardBody className="space-y-4">
                                {job.location && (
                                    <div className="flex items-start gap-3">
                                        <MapPinIcon className="w-5 h-5 text-default-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-default-500">Location</p>
                                            <p className="font-medium">{job.location}</p>
                                        </div>
                                    </div>
                                )}

                                <Divider />

                                <div className="flex items-start gap-3">
                                    <BriefcaseIcon className="w-5 h-5 text-default-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-default-500">Employment Type</p>
                                        <Chip 
                                            size="sm" 
                                            variant="flat" 
                                            color={getEmploymentTypeColor(job.employment_type)}
                                        >
                                            {job.employment_type}
                                        </Chip>
                                    </div>
                                </div>

                                {job.experience_required && (
                                    <>
                                        <Divider />
                                        <div className="flex items-start gap-3">
                                            <AcademicCapIcon className="w-5 h-5 text-default-400 mt-0.5" />
                                            <div>
                                                <p className="text-sm text-default-500">Experience Required</p>
                                                <p className="font-medium">{job.experience_required} years</p>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {job.salary_range_min && job.salary_range_max && (
                                    <>
                                        <Divider />
                                        <div className="flex items-start gap-3">
                                            <CurrencyDollarIcon className="w-5 h-5 text-default-400 mt-0.5" />
                                            <div>
                                                <p className="text-sm text-default-500">Salary Range</p>
                                                <p className="font-medium">
                                                    {job.salary_currency} {job.salary_range_min.toLocaleString()} - {job.salary_range_max.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {job.posted_at && (
                                    <>
                                        <Divider />
                                        <div className="flex items-start gap-3">
                                            <ClockIcon className="w-5 h-5 text-default-400 mt-0.5" />
                                            <div>
                                                <p className="text-sm text-default-500">Posted</p>
                                                <p className="font-medium">
                                                    {new Date(job.posted_at).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {job.application_deadline && (
                                    <>
                                        <Divider />
                                        <div className="flex items-start gap-3">
                                            <CheckCircleIcon className="w-5 h-5 text-default-400 mt-0.5" />
                                            <div>
                                                <p className="text-sm text-default-500">Application Deadline</p>
                                                <p className="font-medium">
                                                    {new Date(job.application_deadline).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardBody>
                        </Card>

                        {/* Share */}
                        <Card>
                            <CardBody>
                                <p className="text-sm text-default-500 mb-2">Share this opportunity</p>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        onClick={() => {
                                            const url = window.location.href;
                                            navigator.clipboard.writeText(url);
                                            alert('Link copied to clipboard!');
                                        }}
                                    >
                                        Copy Link
                                    </Button>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
