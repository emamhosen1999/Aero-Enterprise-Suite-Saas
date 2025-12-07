import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Card,
    CardBody,
    Button,
    Input,
    Select,
    SelectItem,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Avatar,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Pagination,
    Tabs,
    Tab,
} from '@heroui/react';
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    EyeIcon,
    DocumentTextIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    EnvelopeIcon,
    PhoneIcon,
} from '@heroicons/react/24/outline';
import App from '@/Shared/Layouts/App';
import PageHeader from '@/Shared/Components/Common/PageHeader';
import { showToast } from '@/utils/toastUtils';

/**
 * Applicant List - View and manage job applications
 */
export default function ApplicantsIndex({ auth, applications, jobs, filters, stats }) {
    const [search, setSearch] = useState(filters?.search || '');
    const [status, setStatus] = useState(filters?.status || 'all');
    const [job, setJob] = useState(filters?.job || 'all');
    const [activeTab, setActiveTab] = useState('all');

    const handleSearch = () => {
        router.get(route('hr.recruitment.applicants.index'), {
            search,
            status: status !== 'all' ? status : undefined,
            job: job !== 'all' ? job : undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleStatusChange = (applicationId, newStatus) => {
        router.post(route('hr.recruitment.applicants.update-status', applicationId), {
            status: newStatus,
        }, {
            onSuccess: () => showToast(`Application ${newStatus}`, 'success'),
            onError: () => showToast('Failed to update status', 'error'),
        });
    };

    const handleSendEmail = (applicationId) => {
        router.visit(route('hr.recruitment.applicants.email', applicationId));
    };

    const getStatusColor = (status) => {
        const colors = {
            new: 'primary',
            reviewing: 'warning',
            shortlisted: 'success',
            interview_scheduled: 'secondary',
            interviewed: 'default',
            offered: 'success',
            rejected: 'danger',
            withdrawn: 'default',
        };
        return colors[status] || 'default';
    };

    const getStatusLabel = (status) => {
        return status.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    const renderActions = (application) => (
        <Dropdown>
            <DropdownTrigger>
                <Button isIconOnly size="sm" variant="light">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Application actions">
                <DropdownItem
                    key="view"
                    startContent={<EyeIcon className="h-4 w-4" />}
                    onPress={() => router.visit(route('hr.recruitment.applicants.show', application.id))}
                >
                    View Details
                </DropdownItem>
                <DropdownItem
                    key="resume"
                    startContent={<DocumentTextIcon className="h-4 w-4" />}
                    onPress={() => router.visit(route('hr.recruitment.applicants.resume', application.id))}
                >
                    View Resume
                </DropdownItem>
                <DropdownItem
                    key="email"
                    startContent={<EnvelopeIcon className="h-4 w-4" />}
                    onPress={() => handleSendEmail(application.id)}
                >
                    Send Email
                </DropdownItem>
                {application.status === 'new' && (
                    <>
                        <DropdownItem
                            key="shortlist"
                            startContent={<CheckCircleIcon className="h-4 w-4" />}
                            onPress={() => handleStatusChange(application.id, 'shortlisted')}
                            color="success"
                        >
                            Shortlist
                        </DropdownItem>
                        <DropdownItem
                            key="reject"
                            startContent={<XCircleIcon className="h-4 w-4" />}
                            onPress={() => handleStatusChange(application.id, 'rejected')}
                            color="danger"
                        >
                            Reject
                        </DropdownItem>
                    </>
                )}
            </DropdownMenu>
        </Dropdown>
    );

    return (
        <App user={auth.user}>
            <Head title="Job Applications" />

            <PageHeader
                title="Job Applications"
                description="Review and manage candidate applications"
            />

            <div className="space-y-6">
                {/* Statistics Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardBody>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-default-500">Total Applications</p>
                                    <p className="text-2xl font-bold">{stats?.total || 0}</p>
                                </div>
                                <div className="rounded-lg bg-primary/10 p-3">
                                    <DocumentTextIcon className="h-6 w-6 text-primary" />
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-default-500">New Applications</p>
                                    <p className="text-2xl font-bold">{stats?.new || 0}</p>
                                </div>
                                <div className="rounded-lg bg-warning/10 p-3">
                                    <ClockIcon className="h-6 w-6 text-warning" />
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-default-500">Shortlisted</p>
                                    <p className="text-2xl font-bold">{stats?.shortlisted || 0}</p>
                                </div>
                                <div className="rounded-lg bg-success/10 p-3">
                                    <CheckCircleIcon className="h-6 w-6 text-success" />
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-default-500">Interviews Scheduled</p>
                                    <p className="text-2xl font-bold">{stats?.interviews || 0}</p>
                                </div>
                                <div className="rounded-lg bg-secondary/10 p-3">
                                    <svg className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardBody>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <Input
                                placeholder="Search by name, email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                startContent={<MagnifyingGlassIcon className="h-5 w-5 text-default-400" />}
                                className="flex-1"
                            />
                            <Select
                                placeholder="Job Position"
                                selectedKeys={[job]}
                                onChange={(e) => setJob(e.target.value)}
                                className="w-full sm:w-64"
                            >
                                <SelectItem key="all" value="all">All Jobs</SelectItem>
                                {jobs?.map((j) => (
                                    <SelectItem key={j.id} value={j.id.toString()}>
                                        {j.title}
                                    </SelectItem>
                                ))}
                            </Select>
                            <Select
                                placeholder="Status"
                                selectedKeys={[status]}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full sm:w-48"
                            >
                                <SelectItem key="all" value="all">All Status</SelectItem>
                                <SelectItem key="new" value="new">New</SelectItem>
                                <SelectItem key="reviewing" value="reviewing">Reviewing</SelectItem>
                                <SelectItem key="shortlisted" value="shortlisted">Shortlisted</SelectItem>
                                <SelectItem key="interview_scheduled" value="interview_scheduled">Interview Scheduled</SelectItem>
                                <SelectItem key="interviewed" value="interviewed">Interviewed</SelectItem>
                                <SelectItem key="offered" value="offered">Offered</SelectItem>
                                <SelectItem key="rejected" value="rejected">Rejected</SelectItem>
                            </Select>
                            <Button
                                color="primary"
                                startContent={<FunnelIcon className="h-5 w-5" />}
                                onPress={handleSearch}
                            >
                                Filter
                            </Button>
                        </div>
                    </CardBody>
                </Card>

                {/* Applications Table */}
                <Card>
                    <CardBody className="p-0">
                        <Table aria-label="Applications table">
                            <TableHeader>
                                <TableColumn>CANDIDATE</TableColumn>
                                <TableColumn>JOB POSITION</TableColumn>
                                <TableColumn>APPLIED DATE</TableColumn>
                                <TableColumn>EXPERIENCE</TableColumn>
                                <TableColumn>STATUS</TableColumn>
                                <TableColumn>RATING</TableColumn>
                                <TableColumn align="center">ACTIONS</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {applications?.data?.map((application) => (
                                    <TableRow key={application.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    name={application.first_name}
                                                    size="sm"
                                                    src={application.photo_url}
                                                />
                                                <div>
                                                    <p className="font-semibold">
                                                        {application.first_name} {application.last_name}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-xs text-default-500">
                                                        <EnvelopeIcon className="h-3 w-3" />
                                                        {application.email}
                                                    </div>
                                                    {application.phone && (
                                                        <div className="flex items-center gap-2 text-xs text-default-500">
                                                            <PhoneIcon className="h-3 w-3" />
                                                            {application.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{application.job?.title}</p>
                                                <p className="text-xs text-default-500">{application.job?.code}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(application.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            {application.years_of_experience || 0} years
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                size="sm"
                                                color={getStatusColor(application.status)}
                                                variant="flat"
                                            >
                                                {getStatusLabel(application.status)}
                                            </Chip>
                                        </TableCell>
                                        <TableCell>
                                            {application.rating ? (
                                                <div className="flex items-center gap-1">
                                                    <span className="text-warning">★</span>
                                                    <span>{application.rating}/5</span>
                                                </div>
                                            ) : (
                                                <span className="text-default-400">Not rated</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{renderActions(application)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardBody>
                </Card>

                {/* Pagination */}
                {applications?.last_page > 1 && (
                    <div className="flex justify-center">
                        <Pagination
                            total={applications.last_page}
                            page={applications.current_page}
                            onChange={(page) => router.get(route('hr.recruitment.applicants.index', { page }))}
                        />
                    </div>
                )}
            </div>
        </App>
    );
}
