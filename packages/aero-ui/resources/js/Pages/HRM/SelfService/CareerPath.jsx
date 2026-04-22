import React, { useEffect, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import {
    Button, Card, CardBody, Chip,
    Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Textarea,
} from "@heroui/react";
import { ArrowTrendingUpIcon, BriefcaseIcon, PlusIcon, StarIcon } from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { useHRMAC } from '@/Hooks/useHRMAC';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';

const statusColorMap = {
    active: 'primary',
    completed: 'success',
    on_hold: 'warning',
    inactive: 'default',
};

const CareerPath = ({ title, careerPaths = [] }) => {
    const themeRadius = useThemeRadius();
    const { canCreate, isSuperAdmin } = useHRMAC();
    const canRequest = canCreate('hrm.self-service.career-path') || isSuperAdmin();

    const [isMobile, setIsMobile] = useState(false);
    const [requestModalOpen, setRequestModalOpen] = useState(false);
    const [requestNotes, setRequestNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const stats = useMemo(() => {
        const active = careerPaths.filter(p => p.status === 'active').length;
        const avgProgress = careerPaths.length > 0
            ? Math.round(careerPaths.reduce((sum, p) => sum + (parseFloat(p.progress) || 0), 0) / careerPaths.length)
            : 0;
        return { total: careerPaths.length, active, avgProgress };
    }, [careerPaths]);

    const statsData = useMemo(() => [
        { title: "Total Paths", value: stats.total, icon: <ArrowTrendingUpIcon className="w-6 h-6" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "Active Paths", value: stats.active, icon: <BriefcaseIcon className="w-6 h-6" />, color: "text-success", iconBg: "bg-success/20" },
        { title: "Avg Progress", value: `${stats.avgProgress}%`, icon: <StarIcon className="w-6 h-6" />, color: "text-secondary", iconBg: "bg-secondary/20" },
    ], [stats]);

    const handleRequest = () => {
        setSubmitting(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post('/hrm/self-service/career-path/request', { notes: requestNotes });
                if (response.status === 200 || response.status === 201) {
                    resolve([response.data.message || 'Career path request submitted']);
                    setRequestModalOpen(false);
                    setRequestNotes('');
                }
            } catch (error) {
                if (error.response?.status === 404) {
                    reject('This feature is not available yet. Please contact HR directly.');
                } else {
                    reject(error.response?.data?.message || 'Failed to submit request');
                }
            } finally { setSubmitting(false); }
        });
        showToast.promise(promise, {
            loading: 'Submitting career path request...',
            success: (d) => d.join(', '),
            error: (e) => String(e),
        });
    };

    return (
        <>
            <Head title={title || 'My Career Path'} />

            {requestModalOpen && (
                <Modal isOpen scrollBehavior="inside" size="lg"
                    onOpenChange={(open) => { setRequestModalOpen(open); if (!open) setRequestNotes(''); }}
                    classNames={{ base: 'bg-content1', header: 'border-b border-divider', footer: 'border-t border-divider' }}>
                    <ModalContent>
                        <ModalHeader>Request Career Path</ModalHeader>
                        <ModalBody className="py-4">
                            <Textarea
                                label="Request Notes"
                                placeholder="Describe the career path you're interested in, your goals, and any relevant experience..."
                                radius={themeRadius}
                                minRows={4}
                                value={requestNotes}
                                onValueChange={setRequestNotes}
                            />
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => { setRequestModalOpen(false); setRequestNotes(''); }}>Cancel</Button>
                            <Button color="primary" isLoading={submitting} onPress={handleRequest}>Submit Request</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            <StandardPageLayout
                title="My Career Path"
                subtitle="Explore your career growth and development opportunities"
                icon={ArrowTrendingUpIcon}
                iconColorClass="text-success"
                iconBgClass="bg-success/20"
                stats={<StatsCards stats={statsData} />}
                actions={canRequest && (
                    <Button color="primary" variant="shadow" startContent={<PlusIcon className="w-4 h-4" />}
                        size={isMobile ? 'sm' : 'md'} onPress={() => setRequestModalOpen(true)}>
                        Request Career Path
                    </Button>
                )}
                ariaLabel="My Career Path"
            >
                {careerPaths.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {careerPaths.map(path => (
                            <Card key={path.id} className="border border-divider shadow-none">
                                <CardBody className="p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="font-semibold text-foreground text-sm leading-tight">{path.path_name}</h3>
                                        <Chip color={statusColorMap[path.status] || 'default'} size="sm" variant="flat" className="shrink-0">
                                            {path.status?.replace('_', ' ') || 'Unknown'}
                                        </Chip>
                                    </div>

                                    {(path.current_milestone || path.target_milestone) && (
                                        <div className="flex items-center gap-2 text-xs text-default-500">
                                            <span className="truncate">{path.current_milestone || 'Current'}</span>
                                            <ArrowTrendingUpIcon className="w-3 h-3 shrink-0" />
                                            <span className="truncate">{path.target_milestone || 'Target'}</span>
                                        </div>
                                    )}

                                    <div>
                                        <div className="flex justify-between text-xs text-default-500 mb-1">
                                            <span>Progress</span>
                                            <span>{path.progress ?? 0}%</span>
                                        </div>
                                        <div className="h-2 bg-default-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-2 bg-primary rounded-full transition-all duration-300"
                                                style={{ width: `${Math.min(100, Math.max(0, path.progress ?? 0))}%` }}
                                            />
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-default-500">
                        <ArrowTrendingUpIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium">No Career Paths Assigned</p>
                        <p className="text-sm">No career paths assigned. Contact HR to request a career path.</p>
                        {canRequest && (
                            <Button color="primary" variant="flat" className="mt-4"
                                startContent={<PlusIcon className="w-4 h-4" />}
                                onPress={() => setRequestModalOpen(true)}>
                                Request a Career Path
                            </Button>
                        )}
                    </div>
                )}
            </StandardPageLayout>
        </>
    );
};

CareerPath.layout = (page) => <App children={page} />;
export default CareerPath;
