import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardBody, CardHeader, Button, Chip, Tooltip, Spinner, Select, SelectItem } from "@heroui/react";
import { MapIcon, ExclamationTriangleIcon, CheckCircleIcon, MapPinIcon } from "@heroicons/react/24/outline";
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';

/**
 * LinearProgressMap - PATENTABLE CORE IP
 * 
 * Visual strip map showing layer completion status across linear infrastructure projects.
 * Uses color-coded segments to identify gaps requiring work before next layer approval.
 * 
 * NOVELTY:
 * - Real-time gap detection visualization
 * - Multi-layer dependency tracking
 * - AI-suggested work locations
 * - Click-to-zoom chainage navigation
 * 
 * @param {number} projectId - Project identifier
 * @param {string} selectedLayer - Current layer being validated (e.g., 'base_course')
 * @param {number} startChainage - Start position (km)
 * @param {number} endChainage - End position (km)
 * @param {number} segmentSize - Grid segment size in meters (default: 10m)
 * @param {function} onGapClick - Callback when user clicks gap for work planning
 */
const LinearProgressMap = ({
    projectId,
    selectedLayer = 'base_course',
    startChainage = 0,
    endChainage = 100,
    segmentSize = 10,
    onGapClick = null,
}) => {
    const [loading, setLoading] = useState(false);
    const [mapData, setMapData] = useState({
        grid: [],
        coverage: 0,
        gaps: [],
        suggested_location: null,
        can_approve: false,
        violations: [],
    });
    const [hoveredSegment, setHoveredSegment] = useState(null);
    const [selectedGap, setSelectedGap] = useState(null);

    // Layer hierarchy for display
    const layerHierarchy = {
        'earthwork_excavation': { level: 1, name: 'Earthwork Excavation', color: '#8B4513' },
        'earthwork_compaction': { level: 2, name: 'Earthwork Compaction', color: '#A0522D' },
        'sub_base': { level: 3, name: 'Sub-Base', color: '#CD853F' },
        'base_course': { level: 4, name: 'Base Course', color: '#DAA520' },
        'binder_course': { level: 5, name: 'Binder Course', color: '#708090' },
        'wearing_course': { level: 6, name: 'Wearing Course', color: '#2F4F4F' },
        'surface_treatment': { level: 7, name: 'Surface Treatment', color: '#000000' },
    };

    const currentLayerInfo = layerHierarchy[selectedLayer] || {};

    // Fetch layer completion grid from backend
    const fetchMapData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('rfi.linear-continuity.grid'), {
                params: {
                    project_id: projectId,
                    layer: selectedLayer,
                    start_chainage: startChainage,
                    end_chainage: endChainage,
                    segment_size: segmentSize,
                },
            });

            if (response.status === 200) {
                setMapData(response.data);
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to load progress map',
            });
        } finally {
            setLoading(false);
        }
    }, [projectId, selectedLayer, startChainage, endChainage, segmentSize]);

    useEffect(() => {
        if (projectId) {
            fetchMapData();
        }
    }, [fetchMapData, projectId]);

    // Get segment color based on status
    const getSegmentColor = (status) => {
        switch (status) {
            case 'complete':
                return 'bg-success text-white';
            case 'partial':
                return 'bg-warning text-white';
            case 'incomplete':
                return 'bg-danger text-white';
            default:
                return 'bg-default-200 text-default-600';
        }
    };

    // Handle segment click
    const handleSegmentClick = (segment) => {
        if (segment.status === 'incomplete' || segment.status === 'partial') {
            setSelectedGap(segment);
            if (onGapClick) {
                onGapClick({
                    start_chainage: segment.start_chainage,
                    end_chainage: segment.end_chainage,
                    status: segment.status,
                    coverage_percent: segment.coverage_percent,
                });
            }
        }
    };

    // Suggest next work location (AI planning)
    const handleSuggestLocation = async () => {
        try {
            const response = await axios.post(route('rfi.linear-continuity.suggest-location'), {
                project_id: projectId,
                layer: selectedLayer,
                start_chainage: startChainage,
                end_chainage: endChainage,
            });

            if (response.status === 200 && response.data.suggested_location) {
                const suggestion = response.data.suggested_location;
                showToast.success(
                    `Recommended: Work on Ch ${suggestion.start.toFixed(3)} - Ch ${suggestion.end.toFixed(3)} (${suggestion.length.toFixed(0)}m gap)`
                );
                setSelectedGap({
                    start_chainage: suggestion.start,
                    end_chainage: suggestion.end,
                    status: 'incomplete',
                    coverage_percent: 0,
                });
            } else {
                showToast.info('All areas are adequately covered. Consider next layer.');
            }
        } catch (error) {
            showToast.error('Failed to generate work suggestion');
        }
    };

    // Format chainage for display
    const formatChainage = (ch) => `Ch ${parseFloat(ch).toFixed(3)}`;

    return (
        <Card className="transition-all duration-200">
            <CardHeader className="border-b border-divider p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <MapIcon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">Linear Progress Map</h3>
                            <p className="text-sm text-default-500">
                                {currentLayerInfo.name} (Level {currentLayerInfo.level})
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Chip
                            color={mapData.can_approve ? 'success' : 'danger'}
                            variant="flat"
                            size="sm"
                        >
                            Coverage: {mapData.coverage?.toFixed(1) || 0}%
                        </Chip>
                        <Button
                            size="sm"
                            color="primary"
                            variant="flat"
                            onPress={handleSuggestLocation}
                            startContent={<MapPinIcon className="w-4 h-4" />}
                            isDisabled={loading || mapData.coverage >= 95}
                        >
                            Suggest Next
                        </Button>
                        <Button
                            size="sm"
                            variant="flat"
                            onPress={fetchMapData}
                            isLoading={loading}
                        >
                            Refresh
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardBody className="p-4">
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <Spinner size="lg" label="Loading progress map..." />
                    </div>
                ) : (
                    <>
                        {/* Layer Status Summary */}
                        <div className="mb-4 p-3 rounded-lg bg-default-100">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    {mapData.can_approve ? (
                                        <>
                                            <CheckCircleIcon className="w-5 h-5 text-success" />
                                            <span className="text-success font-semibold">
                                                Layer can be approved
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <ExclamationTriangleIcon className="w-5 h-5 text-danger" />
                                            <span className="text-danger font-semibold">
                                                {mapData.violations?.length || 0} violation(s) detected
                                            </span>
                                        </>
                                    )}
                                </div>
                                <div className="text-default-600">
                                    {mapData.gaps?.length || 0} gap(s) found
                                </div>
                            </div>
                        </div>

                        {/* Violations List */}
                        {mapData.violations && mapData.violations.length > 0 && (
                            <div className="mb-4 space-y-2">
                                {mapData.violations.map((violation, idx) => (
                                    <div
                                        key={idx}
                                        className="p-3 rounded-lg bg-danger/10 border border-danger/20"
                                    >
                                        <p className="text-sm text-danger font-medium">
                                            {violation.message}
                                        </p>
                                        {violation.required_layer && (
                                            <p className="text-xs text-default-600 mt-1">
                                                Required: {layerHierarchy[violation.required_layer]?.name}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Strip Map Visualization */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-default-600 mb-2">
                                <span>{formatChainage(startChainage)}</span>
                                <span>{formatChainage(endChainage)}</span>
                            </div>

                            <div className="flex gap-px overflow-x-auto pb-2">
                                {mapData.grid && mapData.grid.length > 0 ? (
                                    mapData.grid.map((segment, idx) => (
                                        <Tooltip
                                            key={idx}
                                            content={
                                                <div className="p-2">
                                                    <p className="font-semibold">
                                                        {formatChainage(segment.start_chainage)} -{' '}
                                                        {formatChainage(segment.end_chainage)}
                                                    </p>
                                                    <p className="text-xs mt-1">
                                                        Status: {segment.status}
                                                    </p>
                                                    <p className="text-xs">
                                                        Coverage: {segment.coverage_percent?.toFixed(1) || 0}%
                                                    </p>
                                                    {(segment.status === 'incomplete' ||
                                                        segment.status === 'partial') && (
                                                        <p className="text-xs text-warning mt-1">
                                                            Click to select for work
                                                        </p>
                                                    )}
                                                </div>
                                            }
                                            placement="top"
                                        >
                                            <button
                                                className={`
                                                    flex-1 h-12 min-w-[20px] rounded-sm transition-all duration-200
                                                    ${getSegmentColor(segment.status)}
                                                    ${selectedGap?.start_chainage === segment.start_chainage
                                                        ? 'ring-2 ring-primary scale-110'
                                                        : 'hover:scale-105'
                                                    }
                                                    ${(segment.status === 'incomplete' || segment.status === 'partial')
                                                        ? 'cursor-pointer'
                                                        : 'cursor-default'
                                                    }
                                                `}
                                                onClick={() => handleSegmentClick(segment)}
                                                onMouseEnter={() => setHoveredSegment(segment)}
                                                onMouseLeave={() => setHoveredSegment(null)}
                                            />
                                        </Tooltip>
                                    ))
                                ) : (
                                    <div className="w-full text-center py-8 text-default-400">
                                        No data available for this range
                                    </div>
                                )}
                            </div>

                            {/* Legend */}
                            <div className="flex flex-wrap items-center gap-4 mt-4 p-3 rounded-lg bg-content2">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-success" />
                                    <span className="text-xs text-default-600">Complete (100%)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-warning" />
                                    <span className="text-xs text-default-600">Partial (1-99%)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-danger" />
                                    <span className="text-xs text-default-600">Incomplete (0%)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-default-200" />
                                    <span className="text-xs text-default-600">No Data</span>
                                </div>
                            </div>
                        </div>

                        {/* Selected Gap Details */}
                        {selectedGap && (
                            <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                                <h4 className="font-semibold text-primary mb-2">Selected Gap</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-default-600">Start:</span>{' '}
                                        <span className="font-medium">
                                            {formatChainage(selectedGap.start_chainage)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-default-600">End:</span>{' '}
                                        <span className="font-medium">
                                            {formatChainage(selectedGap.end_chainage)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-default-600">Length:</span>{' '}
                                        <span className="font-medium">
                                            {((selectedGap.end_chainage - selectedGap.start_chainage) * 1000).toFixed(0)}m
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-default-600">Coverage:</span>{' '}
                                        <span className="font-medium">
                                            {selectedGap.coverage_percent?.toFixed(1) || 0}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Gaps List */}
                        {mapData.gaps && mapData.gaps.length > 0 && (
                            <div className="mt-4">
                                <h4 className="text-sm font-semibold mb-2">Detected Gaps</h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {mapData.gaps.map((gap, idx) => (
                                        <div
                                            key={idx}
                                            className="p-2 rounded bg-default-100 text-sm flex items-center justify-between cursor-pointer hover:bg-default-200"
                                            onClick={() => setSelectedGap(gap)}
                                        >
                                            <span>
                                                {formatChainage(gap.start)} - {formatChainage(gap.end)}
                                            </span>
                                            <Chip size="sm" variant="flat" color="danger">
                                                {gap.length.toFixed(0)}m
                                            </Chip>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </CardBody>
        </Card>
    );
};

export default LinearProgressMap;
