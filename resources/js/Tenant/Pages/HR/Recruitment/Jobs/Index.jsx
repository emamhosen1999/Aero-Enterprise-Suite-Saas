import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Chip,
    Input,
    Select,
    SelectItem,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Pagination,
} from '@heroui/react';
import {
    MagnifyingGlassIcon,
    PlusIcon,
    FunnelIcon,
    EllipsisVerticalIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    DocumentDuplicateIcon,
    CheckCircleIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App.jsx';
import PageHeader from '@/Shared/Components/Common/PageHeader';
import { showToast } from '@/utils/toastUtils';

/**
 * Job Manager Index Page
 * Lists all job postings with filters and actions
 */
export default function JobsIndex({ auth, jobs, filters }) {
    const [search, setSearch] = useState(filters?.search || '');
    const [status, setStatus] = useState(filters?.status || 'all');
    const [department, setDepartment] = useState(filters?.department || 'all');

    const handleSearch = () => {
        router.get(route('hr.recruitment.jobs.index'), {
            search,
            status: status !== 'all' ? status : undefined,
            department: department !== 'all' ? department : undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePublish = (jobId) => {
        router.post(route('hr.recruitment.jobs.publish', jobId), {}, {
            onSuccess: () => showToast('Job published successfully', 'success'),
            onError: () => showToast('Failed to publish job', 'error'),
        });
    };

    const handleClose = (jobId) => {
        router.post(route('hr.recruitment.jobs.close', jobId), {}, {
            onSuccess: () => showToast('Job closed successfully', 'success'),
            onError: () => showToast('Failed to close job', 'error'),
        });
    };

    const handleDelete = (jobId) => {
        if (confirm('Are you sure you want to delete this job posting?')) {
            router.delete(route('hr.recruitment.jobs.destroy', jobId), {
                onSuccess: () => showToast('Job deleted successfully', 'success'),
                onError: () => showToast('Failed to delete job', 'error'),
            });
        }
    };

    const handleDuplicate = (jobId) => {
        router.post(route('hr.recruitment.jobs.duplicate', jobId), {}, {
            onSuccess: () => showToast('Job duplicated successfully', 'success'),
            onError: () => showToast('Failed to duplicate job', 'error'),
        });
    };

    const getStatusColor = (status) => {
        const colors = {
            draft: 'default',
            published: 'success',
            closed: 'danger',
            on_hold: 'warning',
        };
        return colors[status] || 'default';
    };

    const renderActions = (job) => (
        <Dropdown>
            <DropdownTrigger>
                <Button isIconOnly size="sm" variant="light">
                    <EllipsisVerticalIcon className="h-5 w-5" />
                </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Job actions">
                <DropdownItem
                    key="view"
                    startContent={<EyeIcon className="h-4 w-4" />}
                    onPress={() => router.visit(route('hr.recruitment.jobs.show', job.id))}
                >
                    View Details
                </DropdownItem>
                <DropdownItem
                    key="edit"
                    startContent={<PencilIcon className="h-4 w-4" />}
                    onPress={() => router.visit(route('hr.recruitment.jobs.edit', job.id))}
                >
                    Edit
                </DropdownItem>
                {job.status === 'draft' && (
                    <DropdownItem
                        key="publish"
                        startContent={<CheckCircleIcon className="h-4 w-4" />}
                        onPress={() => handlePublish(job.id)}
                        color="success"
                    >
                        Publish
                    </DropdownItem>
                )}
                {job.status === 'published' && (
                    <DropdownItem
                        key="close"
                        startContent={<XCircleIcon className="h-4 w-4" />}
                        onPress={() => handleClose(job.id)}
                        color="warning"
                    >
                        Close
                    </DropdownItem>
                )}
                <DropdownItem
                    key="duplicate"
                    startContent={<DocumentDuplicateIcon className="h-4 w-4" />}
                    onPress={() => handleDuplicate(job.id)}
                >
                    Duplicate
                </DropdownItem>
                <DropdownItem
                    key="delete"
                    startContent={<TrashIcon className="h-4 w-4" />}
                    onPress={() => handleDelete(job.id)}
                    color="danger"
                >
                    Delete
                </DropdownItem>
            </DropdownMenu>
        </Dropdown>
    );

    return (
        <App user={auth.user}>
            <Head title="Job Postings" />

            <PageHeader
                title="Job Postings"
                description="Manage job openings and positions"
                action={
                    <Button
                        color="primary"
                        startContent={<PlusIcon className="h-5 w-5" />}
                        onPress={() => router.visit(route('hr.recruitment.jobs.create'))}
                    >
                        Create Job Posting
                    </Button>
                }
            />

            <div className="space-y-6">
                {/* Filters */}
                <Card>
                    <CardBody>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <Input
                                placeholder="Search jobs..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                startContent={<MagnifyingGlassIcon className="h-5 w-5 text-default-400" />}
                                className="flex-1"
                            />
                            <Select
                                placeholder="Status"
                                selectedKeys={[status]}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full sm:w-48"
                            >
                                <SelectItem key="all" value="all">All Status</SelectItem>
                                <SelectItem key="draft" value="draft">Draft</SelectItem>
                                <SelectItem key="published" value="published">Published</SelectItem>
                                <SelectItem key="closed" value="closed">Closed</SelectItem>
                                <SelectItem key="on_hold" value="on_hold">On Hold</SelectItem>
                            </Select>
                            <Select
                                placeholder="Department"
                                selectedKeys={[department]}
                                onChange={(e) => setDepartment(e.target.value)}
                                className="w-full sm:w-48"
                            >
                                <SelectItem key="all" value="all">All Departments</SelectItem>
                                {/* Add actual departments here */}
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

                {/* Jobs Table */}
                <Card>
                    <CardBody className="p-0">
                        <Table aria-label="Job postings table">
                            <TableHeader>
                                <TableColumn>JOB TITLE</TableColumn>
                                <TableColumn>DEPARTMENT</TableColumn>
                                <TableColumn>LOCATION</TableColumn>
                                <TableColumn>TYPE</TableColumn>
                                <TableColumn>APPLICATIONS</TableColumn>
                                <TableColumn>STATUS</TableColumn>
                                <TableColumn>POSTED DATE</TableColumn>
                                <TableColumn align="center">ACTIONS</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {jobs?.data?.map((job) => (
                                    <TableRow key={job.id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-semibold">{job.title}</p>
                                                <p className="text-sm text-default-500">{job.code}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>{job.department?.name || 'N/A'}</TableCell>
                                        <TableCell>{job.location || 'N/A'}</TableCell>
                                        <TableCell>
                                            <Chip size="sm" variant="flat">
                                                {job.employment_type}
                                            </Chip>
                                        </TableCell>
                                        <TableCell>
                                            <Chip size="sm" color="primary" variant="flat">
                                                {job.applications_count || 0}
                                            </Chip>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                size="sm"
                                                color={getStatusColor(job.status)}
                                                variant="flat"
                                            >
                                                {job.status}
                                            </Chip>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(job.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>{renderActions(job)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardBody>
                </Card>

                {/* Pagination */}
                {jobs?.last_page > 1 && (
                    <div className="flex justify-center">
                        <Pagination
                            total={jobs.last_page}
                            page={jobs.current_page}
                            onChange={(page) => router.get(route('hr.recruitment.jobs.index', { page }))}
                        />
                    </div>
                )}
            </div>
        </App>
    );
}
