import React, { useState, useEffect } from 'react';
import { Card, CardBody, Chip, Spinner } from "@heroui/react";
import { 
    CheckCircleIcon, 
    XCircleIcon, 
    ArrowRightIcon,
    ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import axios from 'axios';

/**
 * LayerDependencyIndicator - Visual layer prerequisite hierarchy
 * 
 * Shows:
 * - Layer sequence with arrows
 * - Completed prerequisites (green)
 * - Missing prerequisites (red)
 * - Current layer (blue)
 * - Coverage percentage per layer
 * 
 * @param {Object} layer - Selected work layer
 * @param {number} projectId - Current project ID
 * @param {number} chainageStart - Start chainage
 * @param {number} chainageEnd - End chainage
 */
const LayerDependencyIndicator = ({ layer, projectId, chainageStart, chainageEnd }) => {
    const [dependencies, setDependencies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [coverage, setCoverage] = useState({});

    useEffect(() => {
        if (!layer || !projectId || !chainageStart || !chainageEnd) {
            return;
        }

        const fetchDependencies = async () => {
            setLoading(true);
            try {
                const response = await axios.get(route('rfi.layers.dependencies', layer.id), {
                    params: {
                        project_id: projectId,
                        chainage_start: chainageStart,
                        chainage_end: chainageEnd
                    }
                });

                if (response.status === 200) {
                    setDependencies(response.data.dependencies || []);
                    setCoverage(response.data.coverage || {});
                }
            } catch (error) {
                console.error('Failed to fetch dependencies:', error);
                setDependencies([]);
                setCoverage({});
            } finally {
                setLoading(false);
            }
        };

        fetchDependencies();
    }, [layer, projectId, chainageStart, chainageEnd]);

    if (!layer) return null;

    // If no dependencies, show simple message
    if (!loading && dependencies.length === 0) {
        return (
            <Card className="bg-content2">
                <CardBody className="p-4">
                    <div className="flex items-center gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-success" />
                        <span className="text-sm text-default-600">
                            No prerequisite layers required
                        </span>
                    </div>
                </CardBody>
            </Card>
        );
    }

    return (
        <Card className="bg-content2">
            <CardBody className="p-4">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-default-700">
                            Layer Sequence
                        </span>
                        {loading && <Spinner size="sm" />}
                    </div>

                    {/* Layer Hierarchy Visualization */}
                    <div className="space-y-2">
                        {/* Prerequisites */}
                        {dependencies.map((dep, index) => {
                            const layerCoverage = coverage[dep.id] || 0;
                            const isComplete = layerCoverage >= 95; // 95% threshold
                            
                            return (
                                <React.Fragment key={dep.id}>
                                    <div className="flex items-center gap-3">
                                        {/* Status Icon */}
                                        <div className="shrink-0">
                                            {isComplete ? (
                                                <CheckCircleIcon className="w-5 h-5 text-success" />
                                            ) : (
                                                <XCircleIcon className="w-5 h-5 text-danger" />
                                            )}
                                        </div>

                                        {/* Layer Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-medium ${
                                                    isComplete ? 'text-success' : 'text-danger'
                                                }`}>
                                                    {dep.name}
                                                </span>
                                                <Chip
                                                    size="sm"
                                                    variant="flat"
                                                    color={isComplete ? 'success' : 'danger'}
                                                >
                                                    {layerCoverage.toFixed(0)}%
                                                </Chip>
                                            </div>
                                            {!isComplete && (
                                                <p className="text-xs text-danger mt-0.5">
                                                    Prerequisite incomplete (need ≥95%)
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Arrow to next layer */}
                                    {index < dependencies.length && (
                                        <div className="flex justify-center">
                                            <ArrowRightIcon className="w-4 h-4 text-default-400 rotate-90" />
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}

                        {/* Current Layer */}
                        {dependencies.length > 0 && (
                            <div className="flex justify-center">
                                <ArrowRightIcon className="w-4 h-4 text-default-400 rotate-90" />
                            </div>
                        )}
                        <div className="flex items-center gap-3 bg-primary/10 rounded-lg p-2">
                            <div className="shrink-0">
                                <ExclamationTriangleIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-primary">
                                        {layer.name}
                                    </span>
                                    <Chip
                                        size="sm"
                                        variant="flat"
                                        color="primary"
                                    >
                                        Current
                                    </Chip>
                                </div>
                                <p className="text-xs text-default-600 mt-0.5">
                                    This is the layer currently being submitted
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Warning if dependencies incomplete */}
                    {dependencies.some(dep => (coverage[dep.id] || 0) < 95) && (
                        <div className="mt-3 p-3 bg-danger/10 rounded-lg border border-danger/20">
                            <div className="flex items-start gap-2">
                                <ExclamationTriangleIcon className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-danger">
                                        Prerequisites Not Met
                                    </p>
                                    <p className="text-xs text-danger/80 mt-1">
                                        You cannot proceed with this layer until all prerequisite layers have at least 95% coverage in the specified chainage range.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </CardBody>
        </Card>
    );
};

export default LayerDependencyIndicator;
