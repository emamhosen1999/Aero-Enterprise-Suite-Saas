import React, { useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Select,
    SelectItem,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
} from '@heroui/react';
import {
    AdjustmentsHorizontalIcon,
    ChartBarIcon,
    CheckBadgeIcon,
    ClockIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { useHRMAC } from '@/Hooks/useHRMAC';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { showToast } from '@/utils/toastUtils.jsx';
import axios from 'axios';

const ratingColorMap = {
    exceptional: 'success',
    exceeds: 'primary',
    meets: 'warning',
    below: 'danger',
    unsatisfactory: 'danger',
};

const NINE_BOX_LABELS = [
    { row: 0, col: 0, label: 'Underperformer', bg: 'bg-danger/10 border-danger/30' },
    { row: 0, col: 1, label: 'Effective', bg: 'bg-warning/10 border-warning/30' },
    { row: 0, col: 2, label: 'Strong Performer', bg: 'bg-success/10 border-success/30' },
    { row: 1, col: 0, label: 'Risk', bg: 'bg-danger/10 border-danger/30' },
    { row: 1, col: 1, label: 'Core Employee', bg: 'bg-warning/10 border-warning/30' },
    { row: 1, col: 2, label: 'High Performer', bg: 'bg-primary/10 border-primary/30' },
    { row: 2, col: 0, label: 'Enigma', bg: 'bg-secondary/10 border-secondary/30' },
    { row: 2, col: 1, label: 'High Potential', bg: 'bg-primary/10 border-primary/30' },
    { row: 2, col: 2, label: 'Star', bg: 'bg-success/10 border-success/30' },
];

const PerformanceCalibration = ({ title, calibrationSessions = [], distributionData = [], stats = {}, error }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate } = useHRMAC();

    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
            setIsTablet(window.innerWidth < 768);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const [selectedSession, setSelectedSession] = useState(calibrationSessions[0] || null);
    const [sessionReviews, setSessionReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [activeView, setActiveView] = useState('distribution');
    const [search, setSearch] = useState('');

    const statsData = useMemo(() => [
        {
            title: 'Total Calibrated',
            value: stats.total_employees_calibrated ?? 0,
            icon: <UserGroupIcon className="w-6 h-6" />,
            color: 'text-primary',
            iconBg: 'bg-primary/20',
        },
        {
            title: 'Pending Calibration',
            value: stats.pending_calibration ?? 0,
            icon: <ClockIcon className="w-6 h-6" />,
            color: 'text-warning',
            iconBg: 'bg-warning/20',
        },
        {
            title: 'Completed Sessions',
            value: stats.completed_sessions ?? 0,
            icon: <CheckBadgeIcon className="w-6 h-6" />,
            color: 'text-success',
            iconBg: 'bg-success/20',
        },
        {
            title: 'Total Sessions',
            value: calibrationSessions.length,
            icon: <AdjustmentsHorizontalIcon className="w-6 h-6" />,
            color: 'text-secondary',
            iconBg: 'bg-secondary/20',
        },
    ], [stats, calibrationSessions]);

    const loadSessionReviews = async (session) => {
        if (!session) { return; }
        setLoadingReviews(true);
        try {
            const response = await axios.get(route('hrm.performance.calibration.show', session.id));
            if (response.status === 200) {
                setSessionReviews(response.data.data?.reviews || []);
            }
        } catch (err) {
            showToast.promise(Promise.reject(err), { error: 'Failed to load session reviews' });
        } finally {
            setLoadingReviews(false);
        }
    };

    const handleSessionChange = (session) => {
        setSelectedSession(session);
        loadSessionReviews(session);
    };

    const handleFinalize = (session) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('hrm.performance.calibration.finalize', session.id));
                if (response.status === 200) {
                    resolve([response.data.message || 'Session finalized successfully']);
                }
            } catch (err) {
                reject(err.response?.data?.errors || ['Failed to finalize session']);
            }
        });

        showToast.promise(promise, {
            loading: 'Finalizing calibration session...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Build distribution bar chart data from distributionData
    const distributionBars = useMemo(() => {
        if (!distributionData || Object.keys(distributionData).length === 0) { return []; }
        const categories = ['exceptional', 'exceeds', 'meets', 'below', 'unsatisfactory'];
        const total = Object.values(distributionData).reduce((sum, v) => sum + (v?.count || v || 0), 0);
        return categories.map(cat => {
            const count = distributionData[cat]?.count ?? distributionData[cat] ?? 0;
            const target = distributionData[cat]?.target_percentage ?? null;
            return {
                label: cat.charAt(0).toUpperCase() + cat.slice(1),
                count,
                pct: total > 0 ? Math.round((count / total) * 100) : 0,
                target,
                color: ratingColorMap[cat] || 'default',
            };
        });
    }, [distributionData]);

    const filteredSessions = useMemo(() => {
        return calibrationSessions.filter(s =>
            !search || s.period_end?.includes(search)
        );
    }, [calibrationSessions, search]);

    const sessionColumns = [
        { uid: 'period', name: 'Review Period' },
        { uid: 'total', name: 'Total Reviews' },
        { uid: 'completed', name: 'Completed' },
        { uid: 'pending', name: 'Pending' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderSessionCell = (session, columnKey) => {
        switch (columnKey) {
            case 'period':
                return <span className="font-semibold text-sm">{session.period_end}</span>;
            case 'total':
                return <span>{session.total_reviews}</span>;
            case 'completed':
                return <Chip size="sm" color="success" variant="flat">{session.completed_reviews}</Chip>;
            case 'pending':
                return session.pending_reviews > 0
                    ? <Chip size="sm" color="warning" variant="flat">{session.pending_reviews}</Chip>
                    : <Chip size="sm" color="default" variant="flat">0</Chip>;
            case 'actions':
                return (
                    <div className="flex gap-2">
                        <Button size="sm" variant="flat" color="primary"
                            onPress={() => handleSessionChange(session)}>
                            View
                        </Button>
                        {canUpdate && session.pending_reviews === 0 && (
                            <Button size="sm" variant="flat" color="success"
                                onPress={() => handleFinalize(session)}>
                                Finalize
                            </Button>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <Head title={title} />

            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Performance Calibration">
                <div className="space-y-4">
                    <div className="w-full">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
                            <Card
                                className="transition-all duration-200"
                                style={{
                                    border: `var(--borderWidth, 2px) solid transparent`,
                                    borderRadius: `var(--borderRadius, 12px)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                    transform: `scale(var(--scale, 1))`,
                                    background: `linear-gradient(135deg, var(--theme-content1, #FAFAFA) 20%, var(--theme-content2, #F4F4F5) 10%, var(--theme-content3, #F1F3F4) 20%)`,
                                }}
                            >
                                <CardHeader className="border-b p-0" style={{ borderColor: `var(--theme-divider, #E4E4E7)` }}>
                                    <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div
                                                    className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                    style={{ background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`, borderRadius: `var(--borderRadius, 12px)` }}
                                                >
                                                    <AdjustmentsHorizontalIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>Performance Calibration</h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Bell curve calibration & 9-box grid placement
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    <StatsCards stats={statsData} className="mb-6" />

                                    {error && (
                                        <div className="mb-4 p-3 rounded-lg bg-warning/10 border border-warning/20 text-warning text-sm">{error}</div>
                                    )}

                                    {/* View Toggle */}
                                    <div className="flex gap-2 mb-6">
                                        <Button
                                            size="sm"
                                            variant={activeView === 'distribution' ? 'shadow' : 'flat'}
                                            color={activeView === 'distribution' ? 'primary' : 'default'}
                                            startContent={<ChartBarIcon className="w-4 h-4" />}
                                            onPress={() => setActiveView('distribution')}
                                        >
                                            Distribution
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={activeView === 'sessions' ? 'shadow' : 'flat'}
                                            color={activeView === 'sessions' ? 'primary' : 'default'}
                                            startContent={<AdjustmentsHorizontalIcon className="w-4 h-4" />}
                                            onPress={() => setActiveView('sessions')}
                                        >
                                            Sessions
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={activeView === 'ninebox' ? 'shadow' : 'flat'}
                                            color={activeView === 'ninebox' ? 'primary' : 'default'}
                                            startContent={<UserGroupIcon className="w-4 h-4" />}
                                            onPress={() => setActiveView('ninebox')}
                                        >
                                            9-Box Grid
                                        </Button>
                                    </div>

                                    {/* Distribution View */}
                                    {activeView === 'distribution' && (
                                        <div>
                                            <h5 className="text-base font-semibold mb-4 flex items-center gap-2">
                                                <ChartBarIcon className="w-5 h-5 text-primary" />
                                                Rating Distribution (Bell Curve)
                                            </h5>
                                            {distributionBars.length > 0 ? (
                                                <div className="space-y-3">
                                                    {distributionBars.map((bar, i) => (
                                                        <div key={i} className="flex items-center gap-4">
                                                            <span className="text-sm w-32 text-right text-default-600">{bar.label}</span>
                                                            <div className="flex-1 flex items-center gap-2">
                                                                <div className="flex-1 h-6 rounded-lg bg-default-100 overflow-hidden">
                                                                    <div
                                                                        className={`h-6 rounded-lg transition-all duration-500 ${
                                                                            bar.color === 'success' ? 'bg-success/70' :
                                                                            bar.color === 'primary' ? 'bg-primary/70' :
                                                                            bar.color === 'warning' ? 'bg-warning/70' :
                                                                            'bg-danger/70'
                                                                        }`}
                                                                        style={{ width: `${bar.pct}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-sm font-semibold w-12">{bar.pct}%</span>
                                                                <Chip size="sm" color={bar.color} variant="flat">{bar.count}</Chip>
                                                                {bar.target !== null && (
                                                                    <span className="text-xs text-default-400">target: {bar.target}%</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-12 text-center text-default-400">
                                                    <ChartBarIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                                    <p>No distribution data available yet</p>
                                                    <p className="text-xs mt-1">Start a calibration session to see rating distributions</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Sessions View */}
                                    {activeView === 'sessions' && (
                                        <div>
                                            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                                <Input
                                                    label="Search"
                                                    placeholder="Search by period..."
                                                    value={search}
                                                    onValueChange={setSearch}
                                                    startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                                    variant="bordered"
                                                    size="sm"
                                                    radius={themeRadius}
                                                />
                                            </div>
                                            <Table
                                                aria-label="Calibration sessions"
                                                isHeaderSticky
                                                classNames={{
                                                    wrapper: 'shadow-none border border-divider rounded-lg',
                                                    th: 'bg-default-100 text-default-600 font-semibold',
                                                    td: 'py-3',
                                                }}
                                            >
                                                <TableHeader columns={sessionColumns}>
                                                    {(col) => <TableColumn key={col.uid}>{col.name}</TableColumn>}
                                                </TableHeader>
                                                <TableBody items={filteredSessions} emptyContent={
                                                    <div className="py-12 text-center text-default-400">
                                                        <AdjustmentsHorizontalIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                                        <p>No calibration sessions found</p>
                                                    </div>
                                                }>
                                                    {(item) => (
                                                        <TableRow key={item.id}>
                                                            {(colKey) => <TableCell>{renderSessionCell(item, colKey)}</TableCell>}
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}

                                    {/* 9-Box Grid View */}
                                    {activeView === 'ninebox' && (
                                        <div>
                                            <h5 className="text-base font-semibold mb-4 flex items-center gap-2">
                                                <UserGroupIcon className="w-5 h-5 text-primary" />
                                                9-Box Grid — Performance vs Potential
                                            </h5>
                                            <div className="flex gap-3 items-start">
                                                {/* Y-axis label */}
                                                <div className="flex items-center" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: '280px' }}>
                                                    <span className="text-xs text-default-400 font-medium">Potential →</span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="grid grid-cols-3 gap-2" style={{ height: '280px' }}>
                                                        {NINE_BOX_LABELS.map((cell) => (
                                                            <div
                                                                key={`${cell.row}-${cell.col}`}
                                                                className={`rounded-lg border p-3 flex flex-col items-center justify-center text-center ${cell.bg}`}
                                                            >
                                                                <p className="text-xs font-semibold text-default-700">{cell.label}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {/* X-axis label */}
                                                    <div className="text-center mt-2">
                                                        <span className="text-xs text-default-400 font-medium">→ Performance</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-4 p-3 rounded-lg bg-default-50 border border-divider text-sm text-default-500">
                                                <p>Employee placements in the 9-box grid are computed via <strong>PerformanceCalibrationService</strong> using <code>placeOnNineBox()</code>. Individual placement data appears when a calibration session is selected and employee reviews are loaded.</p>
                                            </div>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

PerformanceCalibration.layout = (page) => <App children={page} />;
export default PerformanceCalibration;
