import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Input,
    Select,
    SelectItem,
    Spinner,
    Tooltip,
    Progress,
    Skeleton
} from "@heroui/react";
import {
    MapIcon,
    ChartBarIcon,
    AdjustmentsHorizontalIcon,
    MagnifyingGlassIcon,
    ArrowPathIcon,
    DocumentArrowDownIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    ClockIcon,
    XCircleIcon,
    InformationCircleIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';

/**
 * ChainageProgressMap - PATENTABLE COMPONENT
 * 
 * Visual linear representation of construction progress indexed by chainage.
 * Shows the "Golden Ledger" of all work layers across the project corridor.
 */
const ChainageProgressIndex = ({ title, workLocations, workLayers, statuses }) => {
    const { auth } = usePage().props;
    
    // Theme radius helper
    const getThemeRadius = () => {
        if (typeof window === 'undefined') return 'lg';
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 16) return 'lg';
        return 'full';
    };
    
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
    const [progressData, setProgressData] = useState([]);
    const [stats, setStats] = useState({
        total_length: 0,
        by_layer: {},
        by_status: {}
    });
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [selectedLayer, setSelectedLayer] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [chainageRange, setChainageRange] = useState({ from: '', to: '' });
    const [selectedChainage, setSelectedChainage] = useState(null);
    const [timelineData, setTimelineData] = useState([]);
    const [showTimeline, setShowTimeline] = useState(false);

    // Status color mapping
    const statusColorMap = {
        not_started: 'default',
        rfi_submitted: 'primary',
        inspected: 'warning',
        approved: 'success',
        rejected: 'danger'
    };

    const statusIconMap = {
        not_started: <ClockIcon className="w-4 h-4" />,
        rfi_submitted: <DocumentArrowDownIcon className="w-4 h-4" />,
        inspected: <InformationCircleIcon className="w-4 h-4" />,
        approved: <CheckCircleIcon className="w-4 h-4" />,
        rejected: <XCircleIcon className="w-4 h-4" />
    };

    // Stats data for StatsCards component
    const statsData = useMemo(() => {
        const layers = Object.values(stats.by_layer || {});
        return [
            {
                title: "Total Corridor Length",
                value: `${stats.total_length?.toFixed(0) || 0}m`,
                icon: <MapIcon className="w-5 h-5" />,
                color: "text-primary",
                iconBg: "bg-primary/20",
                description: "Start to end chainage"
            },
            {
                title: "Approved Progress",
                value: `${layers.reduce((sum, l) => sum + (l.percentage || 0), 0) / (layers.length || 1)}%`,
                icon: <CheckCircleIcon className="w-5 h-5" />,
                color: "text-success",
                iconBg: "bg-success/20",
                description: "Average across all layers"
            },
            {
                title: "Pending Inspections",
                value: stats.by_status?.rfi_submitted?.count || 0,
                icon: <ClockIcon className="w-5 h-5" />,
                color: "text-warning",
                iconBg: "bg-warning/20",
                description: "Awaiting quality check"
            },
            {
                title: "Rejected Segments",
                value: stats.by_status?.rejected?.count || 0,
                icon: <XCircleIcon className="w-5 h-5" />,
                color: "text-danger",
                iconBg: "bg-danger/20",
                description: "Require remediation"
            }
        ];
    }, [stats]);

    // Fetch progress data
    const fetchProgressData = useCallback(async () => {
        if (!selectedLocation) return;
        
        setLoading(true);
        try {
            const params = {
                work_location_id: selectedLocation,
                ...(selectedLayer !== 'all' && { layer_id: selectedLayer }),
                ...(selectedStatus !== 'all' && { status: selectedStatus }),
                ...(chainageRange.from && { chainage_from: chainageRange.from }),
                ...(chainageRange.to && { chainage_to: chainageRange.to }),
            };

            const response = await axios.get(route('rfi.chainage-progress.data'), { params });
            
            if (response.status === 200) {
                setProgressData(response.data.progress || []);
                setStats(response.data.stats || {});
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to load progress data'
            });
        } finally {
            setLoading(false);
        }
    }, [selectedLocation, selectedLayer, selectedStatus, chainageRange]);

    useEffect(() => {
        if (selectedLocation) {
            fetchProgressData();
        }
    }, [fetchProgressData, selectedLocation]);

    // Fetch chainage timeline
    const fetchChainageTimeline = useCallback(async (chainage) => {
        if (!selectedLocation || !chainage) return;
        
        try {
            const response = await axios.get(route('rfi.chainage-progress.timeline'), {
                params: {
                    work_location_id: selectedLocation,
                    chainage: chainage
                }
            });
            
            if (response.status === 200) {
                setTimelineData(response.data.timeline || []);
                setSelectedChainage(chainage);
                setShowTimeline(true);
            }
        } catch (error) {
            console.error('Failed to load timeline', error);
        }
    }, [selectedLocation]);

    // Handle location selection
    const handleLocationChange = (keys) => {
        const locationId = Array.from(keys)[0];
        setSelectedLocation(locationId);
        setProgressData([]);
        setStats({ total_length: 0, by_layer: {}, by_status: {} });
    };

    // Group progress data by layer for visualization
    const groupedByLayer = useMemo(() => {
        const grouped = {};
        progressData.forEach(item => {
            const layerId = item.work_layer_id;
            if (!grouped[layerId]) {
                grouped[layerId] = {
                    layer: item.work_layer,
                    segments: []
                };
            }
            grouped[layerId].segments.push(item);
        });
        return Object.values(grouped);
    }, [progressData]);

    // Calculate segment position and width for visualization
    const calculateSegmentStyle = (segment, totalLength, startOffset) => {
        if (totalLength === 0) return { left: '0%', width: '0%' };
        
        const left = ((segment.start_chainage - startOffset) / totalLength) * 100;
        const width = ((segment.end_chainage - segment.start_chainage) / totalLength) * 100;
        
        return {
            left: `${Math.max(0, left)}%`,
            width: `${Math.min(100, width)}%`
        };
    };

    // Get work location bounds
    const selectedLocationData = useMemo(() => {
        return workLocations?.find(loc => String(loc.id) === String(selectedLocation));
    }, [workLocations, selectedLocation]);

    return (
        <>
            <Head title={title} />
            
            {/* Timeline Modal/Drawer would go here */}
            
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Chainage Progress Map">
                <div className="space-y-4">
                    <div className="w-full">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
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
                                {/* Card Header */}
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
                                            {/* Title Section */}
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
                                                        Chainage Progress Map
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Spatially-indexed construction progress visualization
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Action Buttons */}
                                            <div className="flex gap-2 flex-wrap">
                                                <Button 
                                                    color="default" 
                                                    variant="flat"
                                                    startContent={<ArrowPathIcon className="w-4 h-4" />}
                                                    onPress={fetchProgressData}
                                                    isLoading={loading}
                                                    size={isMobile ? "sm" : "md"}
                                                >
                                                    Refresh
                                                </Button>
                                                <Button 
                                                    color="primary" 
                                                    variant="shadow"
                                                    startContent={<DocumentArrowDownIcon className="w-4 h-4" />}
                                                    size={isMobile ? "sm" : "md"}
                                                >
                                                    Export
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* Stats Cards */}
                                    <StatsCards stats={statsData} className="mb-6" isLoading={loading && !progressData.length} />
                                    
                                    {/* Filter Section */}
                                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                        <Select
                                            label="Work Location"
                                            placeholder="Select corridor/section"
                                            selectedKeys={selectedLocation ? [String(selectedLocation)] : []}
                                            onSelectionChange={handleLocationChange}
                                            className="min-w-[200px]"
                                            radius={getThemeRadius()}
                                            isRequired
                                        >
                                            {(workLocations || []).map(loc => (
                                                <SelectItem key={String(loc.id)}>
                                                    {loc.name} ({loc.start_chainage}m - {loc.end_chainage}m)
                                                </SelectItem>
                                            ))}
                                        </Select>
                                        
                                        <Select
                                            label="Work Layer"
                                            placeholder="All layers"
                                            selectedKeys={selectedLayer !== 'all' ? [selectedLayer] : []}
                                            onSelectionChange={(keys) => setSelectedLayer(Array.from(keys)[0] || 'all')}
                                            className="min-w-[180px]"
                                            radius={getThemeRadius()}
                                        >
                                            <SelectItem key="all">All Layers</SelectItem>
                                            {(workLayers || []).map(layer => (
                                                <SelectItem key={String(layer.id)}>
                                                    <div className="flex items-center gap-2">
                                                        <span 
                                                            className="w-3 h-3 rounded-full" 
                                                            style={{ backgroundColor: layer.color || '#6366f1' }}
                                                        />
                                                        {layer.name}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </Select>
                                        
                                        <Select
                                            label="Status"
                                            placeholder="All statuses"
                                            selectedKeys={selectedStatus !== 'all' ? [selectedStatus] : []}
                                            onSelectionChange={(keys) => setSelectedStatus(Array.from(keys)[0] || 'all')}
                                            className="min-w-[150px]"
                                            radius={getThemeRadius()}
                                        >
                                            <SelectItem key="all">All Statuses</SelectItem>
                                            {Object.entries(statuses || {}).map(([key, label]) => (
                                                <SelectItem key={key}>
                                                    <div className="flex items-center gap-2">
                                                        {statusIconMap[key]}
                                                        {label}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </Select>
                                        
                                        <Input
                                            type="number"
                                            label="From Chainage"
                                            placeholder="0"
                                            value={chainageRange.from}
                                            onValueChange={(v) => setChainageRange(prev => ({ ...prev, from: v }))}
                                            className="max-w-[120px]"
                                            radius={getThemeRadius()}
                                            endContent={<span className="text-default-400 text-xs">m</span>}
                                        />
                                        
                                        <Input
                                            type="number"
                                            label="To Chainage"
                                            placeholder="1000"
                                            value={chainageRange.to}
                                            onValueChange={(v) => setChainageRange(prev => ({ ...prev, to: v }))}
                                            className="max-w-[120px]"
                                            radius={getThemeRadius()}
                                            endContent={<span className="text-default-400 text-xs">m</span>}
                                        />
                                    </div>
                                    
                                    {/* Progress Visualization */}
                                    {!selectedLocation ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-center">
                                            <MapIcon className="w-16 h-16 text-default-300 mb-4" />
                                            <h3 className="text-lg font-semibold text-default-600 mb-2">
                                                Select a Work Location
                                            </h3>
                                            <p className="text-default-400 max-w-md">
                                                Choose a corridor or section from the dropdown above to view 
                                                the chainage-indexed progress map across all work layers.
                                            </p>
                                        </div>
                                    ) : loading ? (
                                        <div className="space-y-4">
                                            {[1, 2, 3, 4].map((i) => (
                                                <div key={i} className="space-y-2">
                                                    <Skeleton className="h-4 w-32 rounded" />
                                                    <Skeleton className="h-10 w-full rounded-lg" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {/* Chainage Scale */}
                                            <div className="relative">
                                                <div className="flex justify-between text-xs text-default-500 mb-2">
                                                    <span>CH {selectedLocationData?.start_chainage || 0}m</span>
                                                    <span>CH {selectedLocationData?.end_chainage || 1000}m</span>
                                                </div>
                                                <div className="h-1 bg-default-200 rounded-full" />
                                            </div>
                                            
                                            {/* Layer Progress Bars */}
                                            {groupedByLayer.length === 0 ? (
                                                <div className="text-center py-8 text-default-400">
                                                    <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-2" />
                                                    <p>No progress data available for this location.</p>
                                                </div>
                                            ) : (
                                                groupedByLayer.map((layerGroup, index) => (
                                                    <div key={layerGroup.layer?.id || index} className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <span 
                                                                className="w-4 h-4 rounded-full" 
                                                                style={{ backgroundColor: layerGroup.layer?.color || '#6366f1' }}
                                                            />
                                                            <span className="font-medium text-sm">
                                                                {layerGroup.layer?.name || `Layer ${index + 1}`}
                                                            </span>
                                                            <Chip size="sm" variant="flat" color="default">
                                                                {layerGroup.segments.length} segments
                                                            </Chip>
                                                            {stats.by_layer?.[layerGroup.layer?.id] && (
                                                                <Chip size="sm" variant="flat" color="success">
                                                                    {stats.by_layer[layerGroup.layer.id].percentage}% complete
                                                                </Chip>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Visual Progress Bar with Segments */}
                                                        <div 
                                                            className="relative h-10 bg-default-100 rounded-lg overflow-hidden border border-divider"
                                                            style={{ borderRadius: `var(--borderRadius, 8px)` }}
                                                        >
                                                            {layerGroup.segments.map((segment, segIndex) => {
                                                                const totalLength = (selectedLocationData?.end_chainage || 1000) - (selectedLocationData?.start_chainage || 0);
                                                                const startOffset = selectedLocationData?.start_chainage || 0;
                                                                const style = calculateSegmentStyle(segment, totalLength, startOffset);
                                                                
                                                                return (
                                                                    <Tooltip
                                                                        key={segment.id || segIndex}
                                                                        content={
                                                                            <div className="p-2">
                                                                                <p className="font-semibold">CH {segment.start_chainage}m - {segment.end_chainage}m</p>
                                                                                <p className="text-xs">Status: {statuses?.[segment.status] || segment.status}</p>
                                                                                {segment.daily_work && (
                                                                                    <p className="text-xs">RFI: {segment.daily_work.reference_number}</p>
                                                                                )}
                                                                            </div>
                                                                        }
                                                                    >
                                                                        <div
                                                                            className="absolute h-full cursor-pointer transition-all hover:opacity-80 hover:scale-y-110"
                                                                            style={{
                                                                                ...style,
                                                                                backgroundColor: segment.status === 'approved' 
                                                                                    ? '#22c55e' 
                                                                                    : segment.status === 'rejected' 
                                                                                        ? '#ef4444' 
                                                                                        : segment.status === 'rfi_submitted'
                                                                                            ? '#3b82f6'
                                                                                            : segment.status === 'inspected'
                                                                                                ? '#f59e0b'
                                                                                                : '#d4d4d8',
                                                                            }}
                                                                            onClick={() => fetchChainageTimeline(segment.start_chainage)}
                                                                        />
                                                                    </Tooltip>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                            
                                            {/* Legend */}
                                            <div className="flex flex-wrap gap-4 pt-4 border-t border-divider">
                                                {Object.entries(statuses || {}).map(([key, label]) => (
                                                    <div key={key} className="flex items-center gap-2 text-xs">
                                                        <span 
                                                            className="w-4 h-4 rounded"
                                                            style={{
                                                                backgroundColor: key === 'approved' 
                                                                    ? '#22c55e' 
                                                                    : key === 'rejected' 
                                                                        ? '#ef4444' 
                                                                        : key === 'rfi_submitted'
                                                                            ? '#3b82f6'
                                                                            : key === 'inspected'
                                                                                ? '#f59e0b'
                                                                                : '#d4d4d8',
                                                            }}
                                                        />
                                                        <span className="text-default-600">{label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Layer Progress Summary */}
                                    {selectedLocation && Object.keys(stats.by_layer || {}).length > 0 && (
                                        <div className="mt-8 pt-6 border-t border-divider">
                                            <h3 className="text-lg font-semibold mb-4">Layer Progress Summary</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {Object.entries(stats.by_layer).map(([layerId, layerStats]) => (
                                                    <Card key={layerId} className="p-4">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <span 
                                                                className="w-4 h-4 rounded-full" 
                                                                style={{ backgroundColor: layerStats.color || '#6366f1' }}
                                                            />
                                                            <span className="font-medium">{layerStats.name}</span>
                                                        </div>
                                                        <Progress 
                                                            value={layerStats.percentage} 
                                                            color="success"
                                                            className="mb-2"
                                                            size="md"
                                                        />
                                                        <div className="flex justify-between text-xs text-default-500">
                                                            <span>{layerStats.approved_length?.toFixed(0) || 0}m approved</span>
                                                            <span>{layerStats.percentage}%</span>
                                                        </div>
                                                    </Card>
                                                ))}
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

ChainageProgressIndex.layout = (page) => <App children={page} />;
export default ChainageProgressIndex;
