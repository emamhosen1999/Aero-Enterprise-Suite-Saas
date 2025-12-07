import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Chip,
    Avatar,
    Tabs,
    Tab,
    Divider,
    Progress,
    Textarea,
} from '@heroui/react';
import {
    ArrowLeftIcon,
    EnvelopeIcon,
    PhoneIcon,
    MapPinIcon,
    BriefcaseIcon,
    AcademicCapIcon,
    DocumentTextIcon,
    CheckCircleIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App.jsx';
import PageHeader from '@/Shared/Components/Common/PageHeader';
import { showToast } from '@/utils/toastUtils';

/**
 * Applicant Detail View
 */
export default function ApplicantShow({ auth, application, timeline }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [notes, setNotes] = useState('');
    const [rating, setRating] = useState(application.rating || 0);

    const handleStatusChange = (newStatus) => {
        router.post(route('hr.recruitment.applicants.update-status', application.id), {
            status: newStatus,
        }, {
            onSuccess: () => showToast(`Application ${newStatus}`, 'success'),
            onError: () => showToast('Failed to update status', 'error'),
        });
    };

    const handleSaveNotes = () => {
        router.post(route('hr.recruitment.applicants.add-note', application.id), {
            note: notes,
        }, {
            onSuccess: () => {
                showToast('Note saved successfully', 'success');
                setNotes('');
            },
            onError: () => showToast('Failed to save note', 'error'),
        });
    };

    const handleRatingChange = (newRating) => {
        setRating(newRating);
        router.post(route('hr.recruitment.applicants.rate', application.id), {
            rating: newRating,
        }, {
            onSuccess: () => showToast('Rating updated', 'success'),
            onError: () => showToast('Failed to update rating', 'error'),
        });
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

    return (
        <App user={auth.user}>
            <Head title={`${application.first_name} ${application.last_name} - Application`} />

            <PageHeader
                title="Application Details"
                description={`${application.first_name} ${application.last_name} - ${application.job?.title}`}
                action={
                    <Button
                        variant="flat"
                        startContent={<ArrowLeftIcon className="h-5 w-5" />}
                        onPress={() => router.visit(route('hr.recruitment.applicants.index'))}
                    >
                        Back to Applications
                    </Button>
                }
            />

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column - Candidate Info */}
                <div className="space-y-6 lg:col-span-1">
                    {/* Candidate Card */}
                    <Card>
                        <CardBody className="text-center">
                            <Avatar
                                src={application.photo_url}
                                name={application.first_name}
                                className="mx-auto h-24 w-24"
                            />
                            <h3 className="mt-4 text-xl font-bold">
                                {application.first_name} {application.last_name}
                            </h3>
                            <p className="text-default-500">{application.job?.title}</p>

                            <Chip
                                className="mt-3"
                                color={getStatusColor(application.status)}
                                variant="flat"
                            >
                                {application.status}
                            </Chip>

                            <Divider className="my-4" />

                            <div className="space-y-3 text-left">
                                <div className="flex items-center gap-2 text-sm">
                                    <EnvelopeIcon className="h-4 w-4 text-default-400" />
                                    <span>{application.email}</span>
                                </div>
                                {application.phone && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <PhoneIcon className="h-4 w-4 text-default-400" />
                                        <span>{application.phone}</span>
                                    </div>
                                )}
                                {application.location && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <MapPinIcon className="h-4 w-4 text-default-400" />
                                        <span>{application.location}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-sm">
                                    <BriefcaseIcon className="h-4 w-4 text-default-400" />
                                    <span>{application.years_of_experience || 0} years experience</span>
                                </div>
                            </div>

                            <Divider className="my-4" />

                            {/* Rating */}
                            <div className="text-left">
                                <p className="mb-2 text-sm font-medium">Rating</p>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => handleRatingChange(star)}
                                            className={`text-2xl transition-colors ${
                                                star <= rating ? 'text-warning' : 'text-default-300'
                                            }`}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Actions Card */}
                    <Card>
                        <CardHeader>
                            <h4 className="font-semibold">Quick Actions</h4>
                        </CardHeader>
                        <CardBody className="space-y-2">
                            <Button
                                color="success"
                                variant="flat"
                                fullWidth
                                startContent={<CheckCircleIcon className="h-5 w-5" />}
                                onPress={() => handleStatusChange('shortlisted')}
                            >
                                Shortlist
                            </Button>
                            <Button
                                color="primary"
                                variant="flat"
                                fullWidth
                                startContent={<EnvelopeIcon className="h-5 w-5" />}
                                onPress={() => router.visit(route('hr.recruitment.applicants.email', application.id))}
                            >
                                Send Email
                            </Button>
                            <Button
                                color="secondary"
                                variant="flat"
                                fullWidth
                                startContent={<DocumentTextIcon className="h-5 w-5" />}
                                onPress={() => window.open(application.resume_url, '_blank')}
                            >
                                View Resume
                            </Button>
                            <Button
                                color="danger"
                                variant="flat"
                                fullWidth
                                startContent={<XCircleIcon className="h-5 w-5" />}
                                onPress={() => handleStatusChange('rejected')}
                            >
                                Reject
                            </Button>
                        </CardBody>
                    </Card>
                </div>

                {/* Right Column - Detailed Info */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardBody>
                            <Tabs
                                selectedKey={activeTab}
                                onSelectionChange={setActiveTab}
                                className="mb-4"
                            >
                                <Tab key="overview" title="Overview">
                                    <div className="space-y-6">
                                        {/* Cover Letter */}
                                        {application.cover_letter && (
                                            <div>
                                                <h4 className="mb-2 font-semibold">Cover Letter</h4>
                                                <div className="rounded-lg bg-default-100 p-4">
                                                    <p className="whitespace-pre-wrap text-sm">
                                                        {application.cover_letter}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Skills */}
                                        {application.skills && (
                                            <div>
                                                <h4 className="mb-2 font-semibold">Skills</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {application.skills.split(',').map((skill, index) => (
                                                        <Chip key={index} size="sm" variant="flat">
                                                            {skill.trim()}
                                                        </Chip>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Work Experience */}
                                        {application.work_experience && (
                                            <div>
                                                <h4 className="mb-2 font-semibold">Work Experience</h4>
                                                <div className="rounded-lg bg-default-100 p-4">
                                                    <p className="whitespace-pre-wrap text-sm">
                                                        {application.work_experience}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Education */}
                                        {application.education && (
                                            <div>
                                                <h4 className="mb-2 font-semibold">Education</h4>
                                                <div className="rounded-lg bg-default-100 p-4">
                                                    <p className="whitespace-pre-wrap text-sm">
                                                        {application.education}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Tab>

                                <Tab key="timeline" title="Timeline">
                                    <div className="space-y-4">
                                        {timeline?.map((event, index) => (
                                            <div key={index} className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className="rounded-full bg-primary p-2">
                                                        <div className="h-2 w-2 rounded-full bg-white" />
                                                    </div>
                                                    {index < timeline.length - 1 && (
                                                        <div className="h-full w-0.5 bg-default-200" />
                                                    )}
                                                </div>
                                                <div className="flex-1 pb-6">
                                                    <p className="font-semibold">{event.title}</p>
                                                    <p className="text-sm text-default-500">{event.description}</p>
                                                    <p className="mt-1 text-xs text-default-400">
                                                        {new Date(event.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Tab>

                                <Tab key="notes" title="Notes & Comments">
                                    <div className="space-y-4">
                                        {/* Add Note */}
                                        <div>
                                            <Textarea
                                                label="Add Note"
                                                placeholder="Write your comments or notes about this candidate..."
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                minRows={4}
                                            />
                                            <Button
                                                color="primary"
                                                className="mt-2"
                                                onPress={handleSaveNotes}
                                                isDisabled={!notes.trim()}
                                            >
                                                Save Note
                                            </Button>
                                        </div>

                                        <Divider />

                                        {/* Notes List */}
                                        <div className="space-y-3">
                                            {application.notes?.map((note, index) => (
                                                <div key={index} className="rounded-lg bg-default-100 p-4">
                                                    <div className="mb-2 flex items-center justify-between">
                                                        <p className="font-semibold">{note.user?.name}</p>
                                                        <p className="text-xs text-default-400">
                                                            {new Date(note.created_at).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <p className="text-sm">{note.content}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Tab>
                            </Tabs>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </App>
    );
}
