import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
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
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Pagination,
    Skeleton,
    Textarea,
    Progress,
    Switch,
} from "@heroui/react";
import {
    ChartBarIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    EllipsisVerticalIcon,
    EyeIcon,
    PlayIcon,
    PauseIcon,
    CheckCircleIcon,
    FaceSmileIcon,
    FaceFrownIcon,
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import { useHRMAC } from '@/Hooks/access/useHRMAC';
import { router } from '@inertiajs/react';

const PulseSurveysIndex = ({ title, stats: initialStats, departments }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete, isSuperAdmin, hasAccess } = useHRMAC();

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => setIsMobile(window.innerWidth < 640);
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const [loading, setLoading] = useState(false);
    const [surveys, setSurveys] = useState([]);
    const [stats, setStats] = useState(initialStats || {});
    const [filters, setFilters] = useState({ search: '', status: '' });
    const [pagination, setPagination] = useState({ currentPage: 1, perPage: 15, total: 0, lastPage: 1 });
    const [modalOpen, setModalOpen] = useState(false);
    const [formLoading, setFormLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        questions: [{ text: '', type: 'rating', options: [] }],
        frequency: 'weekly',
        target_departments: [],
        is_anonymous: true,
        start_date: '',
        end_date: '',
    });

    const statsData = useMemo(() => [
        { title: "Total Surveys", value: stats.total || 0, icon: <ChartBarIcon className="w-5 h-5" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "Active", value: stats.active || 0, icon: <PlayIcon className="w-5 h-5" />, color: "text-success", iconBg: "bg-success/20" },
        { title: "Responses This Month", value: stats.responses_this_month || 0, icon: <CheckCircleIcon className="w-5 h-5" />, color: "text-secondary", iconBg: "bg-secondary/20" },
        { title: "Avg Completion Rate", value: `${stats.avg_completion_rate || 0}%`, icon: <ChartBarIcon className="w-5 h-5" />, color: "text-warning", iconBg: "bg-warning/20" },
        { title: "Positive Sentiment", value: `${stats.positive_sentiment_pct || 0}%`, icon: <FaceSmileIcon className="w-5 h-5" />, color: "text-success", iconBg: "bg-success/20" },
    ], [stats]);

    // Permission checks using HRMAC
    const canManage = canCreate('hrm.pulse-surveys') || canUpdate('hrm.pulse-surveys') || isSuperAdmin();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.pulse-surveys.paginate'), {
                params: { page: pagination.currentPage, perPage: pagination.perPage, ...filters }
            });
            if (response.status === 200) {
                setSurveys(response.data.surveys || []);
                setPagination(prev => ({ ...prev, ...response.data.pagination }));
            }
        } catch (error) {
            showToast.error('Failed to fetch surveys');
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    const fetchStats = useCallback(async () => {
        try {
            const response = await axios.get(route('hrm.pulse-surveys.stats'));
            if (response.status === 200) setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { fetchStats(); }, []);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handleSubmit = async () => {
        setFormLoading(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('hrm.pulse-surveys.store'), formData);
                if (response.status === 200) {
                    resolve([response.data.message || 'Survey created']);
                    setModalOpen(false);
                    fetchData();
                    fetchStats();
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['An error occurred']);
            } finally {
                setFormLoading(false);
            }
        });
        showToast.promise(promise, { loading: 'Creating survey...', success: (d) => d.join(', '), error: (d) => Array.isArray(d) ? d.join(', ') : d });
    };

    const handleActivate = async (id) => {
        try {
            await axios.post(route('hrm.pulse-surveys.activate', id));
            showToast.success('Survey activated');
            fetchData();
            fetchStats();
        } catch (error) {
            showToast.error('Failed to activate survey');
        }
    };

    const handlePause = async (id) => {
        try {
            await axios.post(route('hrm.pulse-surveys.pause', id));
            showToast.success('Survey paused');
            fetchData();
            fetchStats();
        } catch (error) {
            showToast.error('Failed to pause survey');
        }
    };

    const statusColorMap = { draft: 'default', active: 'success', paused: 'warning', completed: 'primary' };
    const frequencyLabels = { weekly: 'Weekly', biweekly: 'Bi-weekly', monthly: 'Monthly', one_time: 'One-time' };

    const columns = [
        { uid: 'title', name: 'Survey' },
        { uid: 'frequency', name: 'Frequency' },
        { uid: 'responses', name: 'Responses' },
        { uid: 'completion', name: 'Completion' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case 'title':
                return (
                    <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-default-500">{item.questions?.length || 0} questions</p>
                    </div>
                );
            case 'frequency':
                return <span className="capitalize">{frequencyLabels[item.frequency] || item.frequency}</span>;
            case 'responses':
                return <span className="font-semibold">{item.total_responses || 0}</span>;
            case 'completion':
                return (
                    <div className="flex items-center gap-2">
                        <Progress value={item.completion_rate || 0} size="sm" color={item.completion_rate >= 70 ? 'success' : item.completion_rate >= 40 ? 'warning' : 'danger'} className="max-w-[80px]" />
                        <span className="text-sm">{item.completion_rate || 0}%</span>
                    </div>
                );
            case 'status':
                return <Chip size="sm" color={statusColorMap[item.status]} variant="flat">{item.status}</Chip>;
            case 'actions':
                return (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light"><EllipsisVerticalIcon className="w-5 h-5" /></Button>
                        </DropdownTrigger>
                        <DropdownMenu>
                            <DropdownItem key="view" startContent={<EyeIcon className="w-4 h-4" />}
                                onPress={() => router.visit(route('hrm.pulse-surveys.show', item.id))}>
                                View Results
                            </DropdownItem>
                            {item.status === 'draft' && canManage && (
                                <DropdownItem key="activate" startContent={<PlayIcon className="w-4 h-4" />} onPress={() => handleActivate(item.id)}>
                                    Activate
                                </DropdownItem>
                            )}
                            {item.status === 'active' && canManage && (
                                <DropdownItem key="pause" startContent={<PauseIcon className="w-4 h-4" />} onPress={() => handlePause(item.id)}>
                                    Pause
                                </DropdownItem>
                            )}
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return item[columnKey];
        }
    };

    const addQuestion = () => {
        setFormData(prev => ({
            ...prev,
            questions: [...prev.questions, { text: '', type: 'rating', options: [] }]
        }));
    };

    const updateQuestion = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            questions: prev.questions.map((q, i) => i === index ? { ...q, [field]: value } : q)
        }));
    };

    return (
        <>
            <Head title={title} />

            <Modal isOpen={modalOpen} onOpenChange={setModalOpen} size="3xl" scrollBehavior="inside">
                <ModalContent>
                    <ModalHeader>Create Pulse Survey</ModalHeader>
                    <ModalBody>
                        <div className="space-y-4">
                            <Input label="Survey Title" placeholder="e.g., Weekly Check-in" value={formData.title}
                                onValueChange={(v) => setFormData(prev => ({ ...prev, title: v }))} isRequired />
                            <Textarea label="Description" placeholder="Brief description of the survey" value={formData.description}
                                onValueChange={(v) => setFormData(prev => ({ ...prev, description: v }))} />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select label="Frequency" selectedKeys={[formData.frequency]}
                                    onSelectionChange={(keys) => setFormData(prev => ({ ...prev, frequency: Array.from(keys)[0] || 'weekly' }))}>
                                    <SelectItem key="weekly">Weekly</SelectItem>
                                    <SelectItem key="biweekly">Bi-weekly</SelectItem>
                                    <SelectItem key="monthly">Monthly</SelectItem>
                                    <SelectItem key="one_time">One-time</SelectItem>
                                </Select>
                                <div className="flex items-center gap-2">
                                    <Switch isSelected={formData.is_anonymous}
                                        onValueChange={(v) => setFormData(prev => ({ ...prev, is_anonymous: v }))} />
                                    <span>Anonymous responses</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input type="date" label="Start Date" value={formData.start_date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))} isRequired />
                                <Input type="date" label="End Date (optional)" value={formData.end_date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))} />
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-semibold">Questions</h4>
                                    <Button size="sm" variant="flat" startContent={<PlusIcon className="w-4 h-4" />} onPress={addQuestion}>
                                        Add Question
                                    </Button>
                                </div>
                                {formData.questions.map((q, index) => (
                                    <div key={index} className="p-3 border border-divider rounded-lg space-y-2">
                                        <div className="flex gap-2">
                                            <Input label={`Question ${index + 1}`} placeholder="Enter your question" value={q.text}
                                                onValueChange={(v) => updateQuestion(index, 'text', v)} className="flex-1" />
                                            <Select label="Type" selectedKeys={[q.type]} className="w-40"
                                                onSelectionChange={(keys) => updateQuestion(index, 'type', Array.from(keys)[0] || 'rating')}>
                                                <SelectItem key="rating">Rating (1-5)</SelectItem>
                                                <SelectItem key="text">Text</SelectItem>
                                                <SelectItem key="yes_no">Yes/No</SelectItem>
                                            </Select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => setModalOpen(false)}>Cancel</Button>
                        <Button color="primary" onPress={handleSubmit} isLoading={formLoading}>Create Survey</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <StandardPageLayout
                title="Pulse Surveys"
                subtitle="Quick engagement check-ins"
                icon={<ChartBarIcon className="w-8 h-8" />}
                actions={
                    canManage && (
                        <Button color="primary" variant="shadow" startContent={<PlusIcon className="w-4 h-4" />} onPress={() => setModalOpen(true)}>
                            Create Survey
                        </Button>
                    )
                }
                stats={<StatsCards stats={statsData} />}
                filters={
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Input placeholder="Search surveys..." value={filters.search} onValueChange={(v) => handleFilterChange('search', v)}
                            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />} className="sm:max-w-xs" radius={themeRadius} />
                        <Select placeholder="All Statuses" selectedKeys={filters.status ? [filters.status] : []}
                            onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || '')} className="sm:max-w-xs" radius={themeRadius}>
                            <SelectItem key="draft">Draft</SelectItem>
                            <SelectItem key="active">Active</SelectItem>
                            <SelectItem key="paused">Paused</SelectItem>
                            <SelectItem key="completed">Completed</SelectItem>
                        </Select>
                    </div>
                }
                ariaLabel="Pulse Surveys Management"
            >
                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex gap-4">
                                <Skeleton className="h-12 w-12 rounded-lg" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-3/4 rounded" />
                                    <Skeleton className="h-3 w-1/2 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <Table aria-label="Pulse Surveys" classNames={{ wrapper: "shadow-none border border-divider rounded-lg", th: "bg-default-100", td: "py-3" }}>
                        <TableHeader columns={columns}>
                            {(column) => <TableColumn key={column.uid} align={column.uid === 'actions' ? 'center' : 'start'}>{column.name}</TableColumn>}
                        </TableHeader>
                        <TableBody items={surveys} emptyContent="No pulse surveys found">
                            {(item) => <TableRow key={item.id}>{(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}</TableRow>}
                        </TableBody>
                    </Table>
                )}

                {pagination.lastPage > 1 && (
                    <div className="flex justify-center mt-6">
                        <Pagination total={pagination.lastPage} page={pagination.currentPage}
                            onChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))} showControls />
                    </div>
                )}
            </StandardPageLayout>
        </>
    );
};

PulseSurveysIndex.layout = (page) => <App children={page} />;
export default PulseSurveysIndex;
