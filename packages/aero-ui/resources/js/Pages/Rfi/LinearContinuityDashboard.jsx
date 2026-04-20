import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useHRMAC } from '@/Hooks/useHRMAC';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Input,
    Select,
    SelectItem,
    Chip,
    Tabs,
    Tab,
} from "@heroui/react";
import {
    PlusIcon,
    MapIcon,
    ChartBarIcon,
    ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import LinearProgressMap from '@/Components/Rfi/LinearProgressMap.jsx';
import GeoLockedRfiForm from '@/Components/Rfi/GeoLockedRfiForm.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius';

/**
 * Linear Continuity Dashboard - PATENTABLE COMPONENT
 * 
 * Central hub for managing construction sequence integrity across linear projects.
 * Integrates GPS validation, layer progression rules, and gap detection.
 * 
 * CORE IP FEATURES:
 * - Real-time layer completion visualization
 * - Automatic gap detection and work suggestion
 * - GPS-locked RFI submission
 * - Cross-layer dependency validation
 * - Claims defense documentation
 */
const LinearContinuityDashboard = ({ title, projects }) => {
    const { auth } = usePage().props;

    // Theme radius helper
    const themeRadius = useThemeRadius();
// Responsive breakpoints
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

    // State management
    const [loading, setLoading] = useState(false);
    const [selectedProject, setSelectedProject] = useState(projects?.[0]?.id || null);
    const [selectedLayer, setSelectedLayer] = useState('base_course');
    const [chainageRange, setChainageRange] = useState({ start: 0, end: 100 });
    const [stats, setStats] = useState({
        total_layers: 7,
        active_rfis: 0,
        validated_rfis: 0,
        avg_coverage: 0,
        blocked_approvals: 0,
    });
    const [showRfiModal, setShowRfiModal] = useState(false);
    const [selectedGapForWork, setSelectedGapForWork] = useState(null);

    // Layer options
    const layerOptions = [
        { key: 'earthwork_excavation', label: 'Earthwork Excavation', level: 1 },
        { key: 'earthwork_compaction', label: 'Earthwork Compaction', level: 2 },
        { key: 'sub_base', label: 'Sub-Base', level: 3 },
        { key: 'base_course', label: 'Base Course', level: 4 },
        { key: 'binder_course', label: 'Binder Course', level: 5 },
        { key: 'wearing_course', label: 'Wearing Course', level: 6 },
        { key: 'surface_treatment', label: 'Surface Treatment', level: 7 },
    ];

    // Stats data for StatsCards component
    const statsData = useMemo(
        () => [
            {
                title: 'Total Layers',
                value: stats.total_layers,
                icon: <ChartBarIcon className="w-6 h-6" />,
                color: 'text-primary',
                iconBg: 'bg-primary/20',
            },
            {
                title: 'Active RFIs',
                value: stats.active_rfis,
                icon: <ClipboardDocumentCheckIcon className="w-6 h-6" />,
                color: 'text-success',
                iconBg: 'bg-success/20',
            },
            {
                title: 'GPS Validated',
                value: stats.validated_rfis,
                icon: <MapIcon className="w-6 h-6" />,
                color: 'text-secondary',
                iconBg: 'bg-secondary/20',
            },
            {
                title: 'Avg Coverage',
                value: `${stats.avg_coverage}%`,
                icon: <ChartBarIcon className="w-6 h-6" />,
                color: 'text-warning',
                iconBg: 'bg-warning/20',
            },
        ],
        [stats]
    );

    // Permission checks
    const { hasAccess } = useHRMAC();
    const canCreate = hasAccess('rfi.linear-progress.linear-reports.create');

    // Fetch dashboard stats
    const fetchStats = useCallback(async () => {
        if (!selectedProject) return;

        try {
            const response = await axios.get(route('rfi.linear-continuity.stats'), {
                params: { project_id: selectedProject },
            });

            if (response.status === 200) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch stats', error);
        }
    }, [selectedProject]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Handle gap click from map
    const handleGapClick = (gapData) => {
        setSelectedGapForWork(gapData);
        setShowRfiModal(true);
    };

    // Handle RFI success
    const handleRfiSuccess = () => {
        fetchStats();
        // Refresh the map component by updating a key
        setSelectedLayer(prevLayer => prevLayer);
    };

    return (
        <>
            <Head title={title} />

            {/* Geo-Locked RFI Modal */}
            {showRfiModal && (
                <GeoLockedRfiForm
                    open={showRfiModal}
                    onClose={() => {
                        setShowRfiModal(false);
                        setSelectedGapForWork(null);
                    }}
                    projectId={selectedProject}
                    onSuccess={handleRfiSuccess}
                />
            )}

            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Linear Continuity Dashboard">
                <div className="space-y-4">
                    <div className="w-full">
                        {/* Animated Card wrapper */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            {/* Main Card with theme styling */}
                            <Card
                                className="transition-all duration-200"
                                style={{
                                    border: `var(--borderWidth, 2px) solid transparent`,
                                    borderRadius: `var(--borderRadius, 12px)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                    transform: `scale(var(--scale, 1))`,
                                    background: `linear-gradient(135deg, 
                                        var(--theme-content1, #FAFAFA) 20%, 
                                        var(--theme-content2, #F4F4F5) 10%, 
                                        var(--theme-content3, #F1F3F4) 20%)`,
                                }}
                            >
                                {/* Card Header with title + action buttons */}
                                <CardHeader
                                    className="border-b p-0"
                                    style={{
                                        borderColor: `var(--theme-divider, #E4E4E7)`,
                                        background: `linear-gradient(135deg, 
                                            color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, 
                                            color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
                                    }}
                                >
                                    <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            {/* Title Section with icon */}
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div
                                                    className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <MapIcon
                                                        className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                        style={{ color: 'var(--theme-primary)' }}
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Linear Continuity Dashboard
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        GPS-validated layer progression tracking with gap detection
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2 flex-wrap">
                                                {canCreate && (
                                                    <Button
                                                        color="primary"
                                                        variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={() => setShowRfiModal(true)}
                                                        size={isMobile ? 'sm' : 'md'}
                                                    >
                                                        New Geo-Locked RFI
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* Stats Cards */}
                                    <StatsCards stats={statsData} className="mb-6" />

                                    {/* Project & Layer Selection */}
                                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                        <Select
                                            label="Project"
                                            placeholder="Select project"
                                            selectedKeys={selectedProject ? [String(selectedProject)] : []}
                                            onSelectionChange={(keys) =>
                                                setSelectedProject(Array.from(keys)[0])
                                            }
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                            className="flex-1"
                                        >
                                            {projects?.map((project) => (
                                                <SelectItem key={String(project.id)}>
                                                    {project.name}
                                                </SelectItem>
                                            )) || []}
                                        </Select>

                                        <Select
                                            label="Layer"
                                            placeholder="Select layer"
                                            selectedKeys={selectedLayer ? [selectedLayer] : []}
                                            onSelectionChange={(keys) => setSelectedLayer(Array.from(keys)[0])}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                            className="flex-1"
                                        >
                                            {layerOptions.map((layer) => (
                                                <SelectItem
                                                    key={layer.key}
                                                    textValue={layer.label}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span>{layer.label}</span>
                                                        <Chip size="sm" variant="flat" color="primary">
                                                            L{layer.level}
                                                        </Chip>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </Select>

                                        <div className="flex gap-2 flex-1">
                                            <Input
                                                type="number"
                                                label="Start Ch (km)"
                                                placeholder="0"
                                                step="0.001"
                                                value={chainageRange.start}
                                                onValueChange={(value) =>
                                                    setChainageRange((prev) => ({ ...prev, start: value }))
                                                }
                                                variant="bordered"
                                                size="sm"
                                                radius={themeRadius}
                                            />
                                            <Input
                                                type="number"
                                                label="End Ch (km)"
                                                placeholder="100"
                                                step="0.001"
                                                value={chainageRange.end}
                                                onValueChange={(value) =>
                                                    setChainageRange((prev) => ({ ...prev, end: value }))
                                                }
                                                variant="bordered"
                                                size="sm"
                                                radius={themeRadius}
                                            />
                                        </div>
                                    </div>

                                    {/* Tabs for different views */}
                                    <Tabs
                                        aria-label="Dashboard views"
                                        color="primary"
                                        variant="underlined"
                                        className="mb-4"
                                    >
                                        <Tab
                                            key="map"
                                            title={
                                                <div className="flex items-center gap-2">
                                                    <MapIcon className="w-4 h-4" />
                                                    <span>Progress Map</span>
                                                </div>
                                            }
                                        >
                                            {/* Linear Progress Map Component */}
                                            {selectedProject && selectedLayer && (
                                                <LinearProgressMap
                                                    projectId={selectedProject}
                                                    selectedLayer={selectedLayer}
                                                    startChainage={parseFloat(chainageRange.start) || 0}
                                                    endChainage={parseFloat(chainageRange.end) || 100}
                                                    segmentSize={10}
                                                    onGapClick={handleGapClick}
                                                />
                                            )}

                                            {!selectedProject && (
                                                <div className="text-center py-12 text-default-400">
                                                    Please select a project to view progress map
                                                </div>
                                            )}
                                        </Tab>

                                        <Tab
                                            key="analytics"
                                            title={
                                                <div className="flex items-center gap-2">
                                                    <ChartBarIcon className="w-4 h-4" />
                                                    <span>Analytics</span>
                                                </div>
                                            }
                                        >
                                            <Card className="bg-content2">
                                                <CardBody className="p-8">
                                                    <div className="text-center text-default-500">
                                                        <ChartBarIcon className="w-16 h-16 mx-auto mb-4 text-default-300" />
                                                        <h3 className="text-lg font-semibold mb-2">
                                                            Analytics Dashboard
                                                        </h3>
                                                        <p className="text-sm">
                                                            Advanced analytics and reporting features coming soon
                                                        </p>
                                                        <div className="mt-4 p-4 bg-default-100 rounded-lg text-left">
                                                            <p className="text-xs font-semibold mb-2">Planned Features:</p>
                                                            <ul className="text-xs space-y-1 list-disc list-inside">
                                                                <li>Layer completion trends over time</li>
                                                                <li>GPS validation success rates</li>
                                                                <li>Gap detection heatmaps</li>
                                                                <li>Productivity metrics by layer</li>
                                                                <li>Claims defense documentation export</li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </CardBody>
                                            </Card>
                                        </Tab>

                                        <Tab
                                            key="violations"
                                            title={
                                                <div className="flex items-center gap-2">
                                                    <ClipboardDocumentCheckIcon className="w-4 h-4" />
                                                    <span>Violations</span>
                                                    {stats.blocked_approvals > 0 && (
                                                        <Chip size="sm" color="danger" variant="flat">
                                                            {stats.blocked_approvals}
                                                        </Chip>
                                                    )}
                                                </div>
                                            }
                                        >
                                            <Card className="bg-content2">
                                                <CardBody className="p-8">
                                                    <div className="text-center text-default-500">
                                                        <ClipboardDocumentCheckIcon className="w-16 h-16 mx-auto mb-4 text-default-300" />
                                                        <h3 className="text-lg font-semibold mb-2">
                                                            Violation Tracking
                                                        </h3>
                                                        <p className="text-sm">
                                                            Track sequence violations, GPS mismatches, and blocked approvals
                                                        </p>
                                                        <div className="mt-4 p-4 bg-default-100 rounded-lg text-left">
                                                            <p className="text-xs font-semibold mb-2">Violation Types:</p>
                                                            <ul className="text-xs space-y-1 list-disc list-inside">
                                                                <li>Insufficient prerequisite layer coverage</li>
                                                                <li>GPS location mismatch (&gt;50m tolerance)</li>
                                                                <li>Missing Permit to Work authorization</li>
                                                                <li>Unsuitable weather conditions</li>
                                                                <li>Missing required test results</li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </CardBody>
                                            </Card>
                                        </Tab>
                                    </Tabs>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

// REQUIRED: Use App layout wrapper
LinearContinuityDashboard.layout = (page) => <App children={page} />;
export default LinearContinuityDashboard;
