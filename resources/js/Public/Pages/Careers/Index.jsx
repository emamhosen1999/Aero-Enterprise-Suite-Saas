import { Head, Link } from '@inertiajs/react';
import { Card, CardBody, CardHeader, Chip, Button, Input } from '@heroui/react';
import { MagnifyingGlassIcon, MapPinIcon, BriefcaseIcon, ClockIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';

export default function CareersIndex({ jobs, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [selectedDepartment, setSelectedDepartment] = useState(filters?.department || '');
    const [selectedType, setSelectedType] = useState(filters?.employment_type || '');

    const departments = [...new Set(jobs.map(job => job.department?.name).filter(Boolean))];
    const employmentTypes = [...new Set(jobs.map(job => job.employment_type).filter(Boolean))];

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = !searchTerm || 
            job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDepartment = !selectedDepartment || job.department?.name === selectedDepartment;
        const matchesType = !selectedType || job.employment_type === selectedType;
        return matchesSearch && matchesDepartment && matchesType;
    });

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
            <Head title="Careers - Join Our Team" />

            {/* Hero Section */}
            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-5xl font-bold mb-4">Join Our Team</h1>
                        <p className="text-xl opacity-90 mb-8">
                            Discover exciting career opportunities and be part of something great
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Chip size="lg" variant="flat" className="bg-white/20 text-white">
                                {jobs.length} Open Positions
                            </Chip>
                            <Chip size="lg" variant="flat" className="bg-white/20 text-white">
                                {departments.length} Departments
                            </Chip>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="container mx-auto px-4 py-8">
                <Card className="mb-8">
                    <CardBody>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                                placeholder="Search jobs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                startContent={<MagnifyingGlassIcon className="w-5 h-5 text-default-400" />}
                                isClearable
                                onClear={() => setSearchTerm('')}
                            />
                            
                            <select
                                className="px-4 py-2 rounded-xl border-2 border-default-200 focus:border-primary-500 outline-none"
                                value={selectedDepartment}
                                onChange={(e) => setSelectedDepartment(e.target.value)}
                            >
                                <option value="">All Departments</option>
                                {departments.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>

                            <select
                                className="px-4 py-2 rounded-xl border-2 border-default-200 focus:border-primary-500 outline-none"
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                            >
                                <option value="">All Types</option>
                                {employmentTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                    </CardBody>
                </Card>

                {/* Job Listings */}
                {filteredJobs.length === 0 ? (
                    <Card>
                        <CardBody className="text-center py-12">
                            <BriefcaseIcon className="w-16 h-16 mx-auto text-default-300 mb-4" />
                            <h3 className="text-xl font-semibold mb-2">No Jobs Found</h3>
                            <p className="text-default-500">
                                Try adjusting your search criteria or check back later for new opportunities.
                            </p>
                        </CardBody>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {filteredJobs.map(job => (
                            <Card key={job.id} className="hover:shadow-lg transition-shadow">
                                <CardBody>
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-start gap-3 mb-3">
                                                <div className="flex-1">
                                                    <Link
                                                        href={route('careers.show', job.id)}
                                                        className="text-2xl font-bold text-primary-600 hover:text-primary-700"
                                                    >
                                                        {job.title}
                                                    </Link>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {job.department && (
                                                            <Chip size="sm" variant="flat" color="primary">
                                                                {job.department.name}
                                                            </Chip>
                                                        )}
                                                        <Chip 
                                                            size="sm" 
                                                            variant="flat" 
                                                            color={getEmploymentTypeColor(job.employment_type)}
                                                        >
                                                            {job.employment_type}
                                                        </Chip>
                                                        {job.remote_work && (
                                                            <Chip size="sm" variant="flat" color="secondary">
                                                                Remote
                                                            </Chip>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="text-default-600 mb-4 line-clamp-2">
                                                {job.description}
                                            </p>

                                            <div className="flex flex-wrap gap-4 text-sm text-default-500">
                                                {job.location && (
                                                    <div className="flex items-center gap-1">
                                                        <MapPinIcon className="w-4 h-4" />
                                                        {job.location}
                                                    </div>
                                                )}
                                                {job.experience_required && (
                                                    <div className="flex items-center gap-1">
                                                        <BriefcaseIcon className="w-4 h-4" />
                                                        {job.experience_required} years exp
                                                    </div>
                                                )}
                                                {job.salary_range_min && job.salary_range_max && (
                                                    <div className="flex items-center gap-1">
                                                        <CurrencyDollarIcon className="w-4 h-4" />
                                                        {job.salary_currency} {job.salary_range_min.toLocaleString()} - {job.salary_range_max.toLocaleString()}
                                                    </div>
                                                )}
                                                {job.posted_at && (
                                                    <div className="flex items-center gap-1">
                                                        <ClockIcon className="w-4 h-4" />
                                                        Posted {new Date(job.posted_at).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <Button
                                                as={Link}
                                                href={route('careers.show', job.id)}
                                                color="primary"
                                                variant="flat"
                                            >
                                                View Details
                                            </Button>
                                            <Button
                                                as={Link}
                                                href={route('careers.apply', job.id)}
                                                color="primary"
                                            >
                                                Apply Now
                                            </Button>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Call to Action */}
            <div className="bg-default-100 py-12 mt-12">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-4">Why Join Us?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 max-w-5xl mx-auto">
                        <div>
                            <div className="text-4xl mb-2">🚀</div>
                            <h3 className="text-xl font-semibold mb-2">Growth Opportunities</h3>
                            <p className="text-default-600">
                                Continuous learning and career advancement paths
                            </p>
                        </div>
                        <div>
                            <div className="text-4xl mb-2">🤝</div>
                            <h3 className="text-xl font-semibold mb-2">Great Team Culture</h3>
                            <p className="text-default-600">
                                Collaborative environment with supportive colleagues
                            </p>
                        </div>
                        <div>
                            <div className="text-4xl mb-2">⚖️</div>
                            <h3 className="text-xl font-semibold mb-2">Work-Life Balance</h3>
                            <p className="text-default-600">
                                Flexible schedules and remote work options
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
