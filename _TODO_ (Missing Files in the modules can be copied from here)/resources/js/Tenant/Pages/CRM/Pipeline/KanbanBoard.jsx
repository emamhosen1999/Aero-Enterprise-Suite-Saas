import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    pointerWithin,
    rectIntersection,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import {
    Card,
    CardBody,
    Button,
    Spinner,
    Chip,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Input,
    Tooltip,
} from '@heroui/react';
import {
    FunnelIcon,
    MagnifyingGlassIcon,
    ArrowPathIcon,
    PlusIcon,
    ExclamationTriangleIcon,
    CurrencyDollarIcon,
    ChartBarIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';

import KanbanColumn from './KanbanColumn';
import DealCard from './DealCard';

/**
 * KanbanBoard - Main container component for CRM Pipeline Kanban
 * 
 * Features:
 * - Drag and drop between stages
 * - Optimistic UI updates with rollback on failure
 * - Real-time summary statistics
 * - Filtering by assignee, status, search
 */
const KanbanBoard = ({
    initialPipeline,
    initialColumns = [],
    initialSummary = {},
    users = [],
}) => {
    // ========== STATE ==========
    const [columns, setColumns] = useState(() => {
        // Initialize columns with deals from initialColumns
        return initialColumns.map((col) => ({
            ...col,
            deals: col.deals || [],
        }));
    });
    const [summary, setSummary] = useState(initialSummary);
    const [activeId, setActiveId] = useState(null);
    const [activeDeal, setActiveDeal] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterAssignee, setFilterAssignee] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');

    // Track previous state for rollback
    const [previousState, setPreviousState] = useState(null);

    // ========== SENSORS ==========
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Minimum drag distance before activating
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // ========== COLLISION DETECTION ==========
    // Custom collision detection to handle both stage drops and card reordering
    const collisionDetection = useCallback((args) => {
        // First, check for intersections with droppable stages
        const pointerCollisions = pointerWithin(args);
        const rectCollisions = rectIntersection(args);
        const cornerCollisions = closestCorners(args);

        // Prioritize pointer collisions, then rect, then corners
        if (pointerCollisions.length > 0) return pointerCollisions;
        if (rectCollisions.length > 0) return rectCollisions;
        return cornerCollisions;
    }, []);

    // ========== HELPERS ==========
    const findColumnByDealId = useCallback((dealId) => {
        return columns.find((col) =>
            col.deals.some((deal) => deal.id === dealId)
        );
    }, [columns]);

    const findColumnById = useCallback((columnId) => {
        const stageId = columnId.toString().replace('stage-', '');
        return columns.find((col) => col.id.toString() === stageId);
    }, [columns]);

    const getDealById = useCallback((dealId) => {
        for (const col of columns) {
            const deal = col.deals.find((d) => d.id === dealId);
            if (deal) return deal;
        }
        return null;
    }, [columns]);

    // ========== CURRENCY FORMATTER ==========
    const formatCurrency = useCallback((value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: initialPipeline?.currency || 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    }, [initialPipeline?.currency]);

    // ========== RECALCULATE SUMMARY ==========
    const recalculateSummary = useCallback((cols) => {
        const allDeals = cols.flatMap((col) => col.deals);
        const openDeals = allDeals.filter((d) => d.status === 'open');
        
        return {
            total_deals: allDeals.length,
            total_value: allDeals.reduce((sum, d) => sum + (d.value || 0), 0),
            weighted_value: allDeals.reduce(
                (sum, d) => sum + (d.value || 0) * ((d.probability || 0) / 100),
                0
            ),
            rotting_deals: openDeals.filter((d) => d.is_rotting).length,
        };
    }, []);

    // ========== DRAG HANDLERS ==========
    const handleDragStart = useCallback((event) => {
        const { active } = event;
        setActiveId(active.id);
        setActiveDeal(getDealById(active.id));
        
        // Store current state for potential rollback
        setPreviousState({
            columns: JSON.parse(JSON.stringify(columns)),
            summary: { ...summary },
        });
    }, [columns, summary, getDealById]);

    const handleDragOver = useCallback((event) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // Find the columns
        const activeColumn = findColumnByDealId(activeId);
        let overColumn = findColumnByDealId(overId);

        // If over a stage droppable zone
        if (!overColumn && overId.toString().startsWith('stage-')) {
            overColumn = findColumnById(overId);
        }

        if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) {
            return;
        }

        // Move deal to new column during drag (preview)
        setColumns((prev) => {
            const activeColumnIndex = prev.findIndex((c) => c.id === activeColumn.id);
            const overColumnIndex = prev.findIndex((c) => c.id === overColumn.id);

            const activeDeal = prev[activeColumnIndex].deals.find(
                (d) => d.id === activeId
            );

            if (!activeDeal) return prev;

            const newColumns = [...prev];

            // Remove from source
            newColumns[activeColumnIndex] = {
                ...newColumns[activeColumnIndex],
                deals: newColumns[activeColumnIndex].deals.filter(
                    (d) => d.id !== activeId
                ),
            };

            // Add to destination
            const overDealIndex = overColumn.deals.findIndex((d) => d.id === overId);
            const insertIndex = overDealIndex >= 0 ? overDealIndex : overColumn.deals.length;

            const updatedDeal = {
                ...activeDeal,
                probability: overColumn.probability,
            };

            newColumns[overColumnIndex] = {
                ...newColumns[overColumnIndex],
                deals: [
                    ...newColumns[overColumnIndex].deals.slice(0, insertIndex),
                    updatedDeal,
                    ...newColumns[overColumnIndex].deals.slice(insertIndex),
                ],
            };

            return newColumns;
        });
    }, [findColumnByDealId, findColumnById]);

    const handleDragEnd = useCallback(async (event) => {
        const { active, over } = event;

        setActiveId(null);
        setActiveDeal(null);

        if (!over) {
            // Rollback if dropped outside
            if (previousState) {
                setColumns(previousState.columns);
                setSummary(previousState.summary);
            }
            setPreviousState(null);
            return;
        }

        const activeId = active.id;
        const overId = over.id;

        // Find final positions
        const activeColumn = findColumnByDealId(activeId);
        let overColumn = findColumnByDealId(overId);

        if (!overColumn && overId.toString().startsWith('stage-')) {
            overColumn = findColumnById(overId);
        }

        if (!activeColumn || !overColumn) {
            if (previousState) {
                setColumns(previousState.columns);
                setSummary(previousState.summary);
            }
            setPreviousState(null);
            return;
        }

        // Calculate final position
        const dealIndex = overColumn.deals.findIndex((d) => d.id === activeId);
        const newPosition = dealIndex >= 0 ? dealIndex + 1 : overColumn.deals.length;
        const newStageId = overColumn.id;

        // Update summary optimistically
        setSummary(recalculateSummary(columns));

        // ========== ASYNC API SYNC ==========
        setIsSyncing(true);

        try {
            const response = await axios.post(
                route('crm.deals.move', { deal: activeId }),
                {
                    pipeline_stage_id: newStageId,
                    position: newPosition,
                }
            );

            if (response.data.success) {
                // Update with server response if needed
                if (response.data.deal) {
                    setColumns((prev) =>
                        prev.map((col) => ({
                            ...col,
                            deals: col.deals.map((d) =>
                                d.id === activeId ? { ...d, ...response.data.deal } : d
                            ),
                        }))
                    );
                }

                toast.success('Deal moved successfully', {
                    position: 'bottom-right',
                    autoClose: 2000,
                });
            }
        } catch (error) {
            console.error('Failed to sync deal move:', error);

            // ========== ROLLBACK ON FAILURE ==========
            if (previousState) {
                setColumns(previousState.columns);
                setSummary(previousState.summary);
            }

            const errorMessage =
                error.response?.data?.message || 'Failed to move deal. Please try again.';

            toast.error(errorMessage, {
                position: 'bottom-right',
                autoClose: 4000,
            });
        } finally {
            setIsSyncing(false);
            setPreviousState(null);
        }
    }, [
        columns,
        findColumnByDealId,
        findColumnById,
        previousState,
        recalculateSummary,
    ]);

    const handleDragCancel = useCallback(() => {
        setActiveId(null);
        setActiveDeal(null);

        // Rollback on cancel
        if (previousState) {
            setColumns(previousState.columns);
            setSummary(previousState.summary);
        }
        setPreviousState(null);
    }, [previousState]);

    // ========== FILTERED COLUMNS ==========
    const filteredColumns = useMemo(() => {
        return columns.map((col) => ({
            ...col,
            deals: col.deals.filter((deal) => {
                // Search filter
                if (searchQuery) {
                    const query = searchQuery.toLowerCase();
                    const matchesSearch =
                        deal.title?.toLowerCase().includes(query) ||
                        deal.deal_number?.toLowerCase().includes(query) ||
                        deal.customer?.name?.toLowerCase().includes(query);
                    if (!matchesSearch) return false;
                }

                // Assignee filter
                if (filterAssignee && deal.assigned_to !== filterAssignee) {
                    return false;
                }

                // Status filter
                if (filterStatus !== 'all' && deal.status !== filterStatus) {
                    return false;
                }

                return true;
            }),
        }));
    }, [columns, searchQuery, filterAssignee, filterStatus]);

    // ========== REFRESH DATA ==========
    const handleRefresh = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(
                route('crm.pipeline.data', { pipeline: initialPipeline.id })
            );

            if (response.data.columns) {
                setColumns(response.data.columns);
            }
            if (response.data.summary) {
                setSummary(response.data.summary);
            }

            toast.success('Pipeline refreshed', {
                position: 'bottom-right',
                autoClose: 1500,
            });
        } catch (error) {
            console.error('Failed to refresh pipeline:', error);
            toast.error('Failed to refresh. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [initialPipeline?.id]);

    return (
        <div className="flex flex-col h-full">
            {/* ========== HEADER / TOOLBAR ========== */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4 px-2">
                {/* Left - Pipeline Info */}
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-foreground">
                        {initialPipeline?.name || 'Sales Pipeline'}
                    </h2>
                    {isSyncing && (
                        <Chip size="sm" variant="flat" color="primary">
                            <Spinner size="sm" className="mr-1" />
                            Syncing...
                        </Chip>
                    )}
                </div>

                {/* Center - Summary Stats */}
                <div className="flex items-center gap-4">
                    <Tooltip content="Total Deals">
                        <div className="flex items-center gap-1.5 text-default-600">
                            <ChartBarIcon className="w-4 h-4" />
                            <span className="text-sm font-medium">{summary.total_deals || 0}</span>
                        </div>
                    </Tooltip>
                    <Tooltip content="Total Value">
                        <div className="flex items-center gap-1.5 text-success-600">
                            <CurrencyDollarIcon className="w-4 h-4" />
                            <span className="text-sm font-medium">
                                {formatCurrency(summary.total_value || 0)}
                            </span>
                        </div>
                    </Tooltip>
                    <Tooltip content="Weighted Value">
                        <div className="flex items-center gap-1.5 text-primary-600">
                            <CurrencyDollarIcon className="w-4 h-4" />
                            <span className="text-sm font-medium">
                                {formatCurrency(summary.weighted_value || 0)}
                            </span>
                            <span className="text-xs text-default-400">(weighted)</span>
                        </div>
                    </Tooltip>
                    {summary.rotting_deals > 0 && (
                        <Tooltip content="Rotting Deals">
                            <Chip size="sm" color="warning" variant="flat">
                                <ExclamationTriangleIcon className="w-3.5 h-3.5 mr-1" />
                                {summary.rotting_deals} rotting
                            </Chip>
                        </Tooltip>
                    )}
                </div>

                {/* Right - Actions */}
                <div className="flex items-center gap-2">
                    {/* Search */}
                    <Input
                        size="sm"
                        placeholder="Search deals..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                        className="w-48"
                        isClearable
                        onClear={() => setSearchQuery('')}
                    />

                    {/* Filter Dropdown */}
                    <Dropdown>
                        <DropdownTrigger>
                            <Button
                                size="sm"
                                variant="flat"
                                startContent={<FunnelIcon className="w-4 h-4" />}
                            >
                                Filters
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            aria-label="Filter options"
                            selectionMode="single"
                            selectedKeys={[filterStatus]}
                            onSelectionChange={(keys) =>
                                setFilterStatus(Array.from(keys)[0] || 'all')
                            }
                        >
                            <DropdownItem key="all">All Deals</DropdownItem>
                            <DropdownItem key="open">Open Only</DropdownItem>
                            <DropdownItem key="won">Won</DropdownItem>
                            <DropdownItem key="lost">Lost</DropdownItem>
                        </DropdownMenu>
                    </Dropdown>

                    {/* Refresh */}
                    <Tooltip content="Refresh pipeline">
                        <Button
                            size="sm"
                            variant="flat"
                            isIconOnly
                            onPress={handleRefresh}
                            isLoading={isLoading}
                        >
                            <ArrowPathIcon className="w-4 h-4" />
                        </Button>
                    </Tooltip>

                    {/* Add Deal */}
                    <Button
                        size="sm"
                        color="primary"
                        startContent={<PlusIcon className="w-4 h-4" />}
                    >
                        New Deal
                    </Button>
                </div>
            </div>

            {/* ========== KANBAN BOARD ========== */}
            <DndContext
                sensors={sensors}
                collisionDetection={collisionDetection}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
            >
                <div
                    className="
                        flex-1 flex gap-4 overflow-x-auto pb-4 px-2
                        scrollbar-thin scrollbar-thumb-default-300 
                        scrollbar-track-transparent
                    "
                >
                    {filteredColumns.map((column) => (
                        <KanbanColumn
                            key={column.id}
                            stage={column}
                            deals={column.deals}
                            isLoading={isLoading}
                            formatCurrency={formatCurrency}
                        />
                    ))}
                </div>

                {/* ========== DRAG OVERLAY ========== */}
                <DragOverlay dropAnimation={null}>
                    {activeDeal ? (
                        <div className="opacity-90 rotate-3 scale-105">
                            <DealCard
                                deal={activeDeal}
                                isDragging
                                formatCurrency={formatCurrency}
                            />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
};

export default KanbanBoard;
