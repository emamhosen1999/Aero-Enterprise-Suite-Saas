import React, { useCallback, useEffect, useState } from 'react';
import {
    Card,
    CardBody,
    Chip,
    Progress,
    Skeleton,
    Tooltip
} from "@heroui/react";
import {
    ExclamationTriangleIcon,
    CheckCircleIcon,
    XCircleIcon,
    MapIcon,
    ShieldExclamationIcon,
    InformationCircleIcon
} from "@heroicons/react/24/outline";
import axios from 'axios';

/**
 * ChainageGapAnalysis - PATENTABLE COMPONENT
 * 
 * Real-time validation component that checks if an RFI can be submitted
 * based on prerequisite layer completion and blocking NCRs.
 * 
 * This component displays:
 * 1. Prerequisite gaps (what work must be done first)
 * 2. Blocking NCRs (quality issues blocking this chainage)
 * 3. Compliance warnings (regulatory requirements)
 */
const ChainageGapAnalysis = ({ 
    workLocationId, 
    layerId, 
    startChainage, 
    endChainage,
    onValidationComplete = () => {},
    className = ''
}) => {
    const [loading, setLoading] = useState(false);
    const [analysisData, setAnalysisData] = useState(null);
    const [error, setError] = useState(null);

    // Fetch gap analysis when parameters change
    const fetchGapAnalysis = useCallback(async () => {
        if (!workLocationId || !layerId || startChainage === undefined || endChainage === undefined) {
            setAnalysisData(null);
            return;
        }

        if (parseFloat(startChainage) > parseFloat(endChainage)) {
            setError('Start chainage must be less than or equal to end chainage');
            setAnalysisData(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(route('rfi.chainage-progress.gap-analysis'), {
                params: {
                    work_location_id: workLocationId,
                    layer_id: layerId,
                    start_chainage: startChainage,
                    end_chainage: endChainage
                }
            });

            if (response.status === 200) {
                setAnalysisData(response.data);
                onValidationComplete(response.data.can_submit, response.data);
            }
        } catch (err) {
            setError('Failed to validate chainage requirements');
            console.error('Gap analysis error:', err);
            onValidationComplete(false, null);
        } finally {
            setLoading(false);
        }
    }, [workLocationId, layerId, startChainage, endChainage, onValidationComplete]);

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            fetchGapAnalysis();
        }, 500); // Debounce to avoid too many API calls

        return () => clearTimeout(debounceTimer);
    }, [fetchGapAnalysis]);

    // Don't render if no parameters provided
    if (!workLocationId || !layerId) {
        return null;
    }

    // Loading state
    if (loading) {
        return (
            <Card className={`border border-default-200 ${className}`}>
                <CardBody className="p-4">
                    <div className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-48 rounded" />
                            <Skeleton className="h-3 w-32 rounded" />
                        </div>
                    </div>
                </CardBody>
            </Card>
        );
    }

    // Error state
    if (error) {
        return (
            <Card className={`border border-danger-200 bg-danger-50 ${className}`}>
                <CardBody className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-danger-100 rounded-full">
                            <XCircleIcon className="w-5 h-5 text-danger" />
                        </div>
                        <div>
                            <p className="font-medium text-danger">{error}</p>
                        </div>
                    </div>
                </CardBody>
            </Card>
        );
    }

    // No data yet
    if (!analysisData) {
        return (
            <Card className={`border border-default-200 ${className}`}>
                <CardBody className="p-4">
                    <div className="flex items-center gap-3 text-default-500">
                        <InformationCircleIcon className="w-5 h-5" />
                        <p className="text-sm">Enter chainage range to validate prerequisites</p>
                    </div>
                </CardBody>
            </Card>
        );
    }

    const { can_submit, prerequisite_gaps, blocking_ncrs, layer, chainage_range } = analysisData;
    const hasPrerequisiteGaps = prerequisite_gaps && prerequisite_gaps.length > 0;
    const hasBlockingNcrs = blocking_ncrs && blocking_ncrs.length > 0;

    return (
        <Card 
            className={`border ${can_submit ? 'border-success-200 bg-success-50/50' : 'border-warning-200 bg-warning-50/50'} ${className}`}
        >
            <CardBody className="p-4 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${can_submit ? 'bg-success-100' : 'bg-warning-100'}`}>
                            {can_submit ? (
                                <CheckCircleIcon className="w-5 h-5 text-success" />
                            ) : (
                                <ExclamationTriangleIcon className="w-5 h-5 text-warning" />
                            )}
                        </div>
                        <div>
                            <p className={`font-semibold ${can_submit ? 'text-success' : 'text-warning'}`}>
                                {can_submit ? 'Ready for Submission' : 'Prerequisites Not Met'}
                            </p>
                            <p className="text-xs text-default-500">
                                CH {chainage_range.start}m - {chainage_range.end}m • {layer?.name}
                            </p>
                        </div>
                    </div>
                    
                    {can_submit && (
                        <Chip color="success" variant="flat" size="sm">
                            Validated
                        </Chip>
                    )}
                </div>

                {/* Prerequisite Gaps */}
                {hasPrerequisiteGaps && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-warning">
                            <MapIcon className="w-4 h-4" />
                            <span className="text-sm font-medium">
                                Prerequisite Layer Gaps ({prerequisite_gaps.length})
                            </span>
                        </div>
                        <div className="space-y-1 ml-6">
                            {prerequisite_gaps.map((gap, index) => (
                                <div 
                                    key={index}
                                    className="flex items-center justify-between text-sm p-2 bg-warning-100/50 rounded-lg"
                                >
                                    <span>
                                        CH {gap.start_chainage}m - {gap.end_chainage}m
                                    </span>
                                    <Chip size="sm" variant="flat" color="warning">
                                        {gap.layer_name || 'Prerequisite'} incomplete
                                    </Chip>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-warning-600 ml-6">
                            Complete the prerequisite work at these chainages before submitting this RFI.
                        </p>
                    </div>
                )}

                {/* Blocking NCRs */}
                {hasBlockingNcrs && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-danger">
                            <ShieldExclamationIcon className="w-4 h-4" />
                            <span className="text-sm font-medium">
                                Blocking NCRs ({blocking_ncrs.length})
                            </span>
                        </div>
                        <div className="space-y-1 ml-6">
                            {blocking_ncrs.map((ncr, index) => (
                                <div 
                                    key={index}
                                    className="flex items-center justify-between text-sm p-2 bg-danger-100/50 rounded-lg"
                                >
                                    <div>
                                        <span className="font-medium">{ncr.reference_number}</span>
                                        <p className="text-xs text-danger-600">{ncr.title}</p>
                                    </div>
                                    <div className="text-right">
                                        <Chip size="sm" variant="flat" color="danger">
                                            {ncr.severity}
                                        </Chip>
                                        <p className="text-xs text-default-500 mt-1">
                                            CH {ncr.start_chainage}m - {ncr.end_chainage}m
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-danger-600 ml-6">
                            Resolve these Non-Conformance Reports before submitting this RFI.
                        </p>
                    </div>
                )}

                {/* All Clear Message */}
                {can_submit && !hasPrerequisiteGaps && !hasBlockingNcrs && (
                    <div className="flex items-center gap-2 text-success-600 bg-success-100/50 p-3 rounded-lg">
                        <CheckCircleIcon className="w-5 h-5" />
                        <div>
                            <p className="text-sm font-medium">All prerequisites satisfied</p>
                            <p className="text-xs">
                                No blocking NCRs or incomplete prerequisite layers for this chainage range.
                            </p>
                        </div>
                    </div>
                )}

                {/* Layer Info */}
                {layer && (
                    <div className="pt-2 border-t border-divider">
                        <div className="flex items-center gap-2 text-xs text-default-500">
                            <span 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: layer.color || '#6366f1' }}
                            />
                            <span>
                                Layer {layer.layer_order}: {layer.name}
                                {layer.prerequisite_layer && (
                                    <span className="ml-2 text-default-400">
                                        (requires: {layer.prerequisite_layer.name})
                                    </span>
                                )}
                            </span>
                        </div>
                    </div>
                )}
            </CardBody>
        </Card>
    );
};

export default ChainageGapAnalysis;
