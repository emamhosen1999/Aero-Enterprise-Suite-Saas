import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardHeader, CardBody, Chip, Badge } from '@heroui/react';
import { motion } from 'framer-motion';
import CandidateCard from './CandidateCard';

/**
 * KanbanColumn Component
 * 
 * Droppable column for recruitment Kanban board
 */
const KanbanColumn = ({ stage, color, onViewCandidate, themeRadius }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: stage.id,
    });

    const itemIds = stage.applications.map(app => app.id);

    return (
        <motion.div
            layout
            className="flex-shrink-0 w-80"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card
                ref={setNodeRef}
                className={`h-full transition-all duration-200 ${
                    isOver ? 'ring-2 ring-primary' : ''
                }`}
                style={{
                    borderRadius: `var(--borderRadius, 12px)`,
                    background: isOver
                        ? `color-mix(in srgb, var(--theme-primary) 5%, var(--theme-content1))`
                        : 'var(--theme-content1)',
                }}
            >
                <CardHeader className="flex justify-between items-center px-4 py-3 border-b border-divider">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground">
                            {stage.name}
                        </h3>
                        <Badge
                            content={stage.applications.length}
                            color={color}
                            size="sm"
                            variant="flat"
                        >
                            <div className="w-2 h-2" />
                        </Badge>
                    </div>
                </CardHeader>

                <CardBody className="p-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                    <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                        <div className="space-y-3">
                            {stage.applications.length === 0 ? (
                                <div
                                    className="text-center py-8 text-default-400 text-sm"
                                    style={{
                                        background: `color-mix(in srgb, var(--theme-default-100) 30%, transparent)`,
                                        borderRadius: `var(--borderRadius, 8px)`,
                                        border: '2px dashed',
                                        borderColor: 'var(--theme-default-200)',
                                    }}
                                >
                                    Drop candidates here
                                </div>
                            ) : (
                                stage.applications.map(application => (
                                    <CandidateCard
                                        key={application.id}
                                        application={application}
                                        onView={() => onViewCandidate(application)}
                                        themeRadius={themeRadius}
                                    />
                                ))
                            )}
                        </div>
                    </SortableContext>
                </CardBody>
            </Card>
        </motion.div>
    );
};

export default KanbanColumn;
