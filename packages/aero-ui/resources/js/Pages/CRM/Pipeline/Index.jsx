import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Tabs,
    Tab,
    Card,
    CardBody,
    Button,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Skeleton,
} from '@heroui/react';
import {
    ViewColumnsIcon,
    Squares2X2Icon,
    Cog6ToothIcon,
    ChevronDownIcon,
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App';
import KanbanBoard from './KanbanBoard';

export default function Index({
    auth,
    pipeline,
    columns,
    summary,
    pipelines = [],
    users = [],
}) {
    const [selectedPipelineId, setSelectedPipelineId] = useState(pipeline?.id);
    const [viewMode, setViewMode] = useState('kanban');

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.4,
                ease: 'easeOut',
            },
        },
    };

    const handlePipelineChange = (pipelineId) => {
        setSelectedPipelineId(pipelineId);
        // Navigate to the selected pipeline
        router.visit(route('crm.pipeline', { pipeline: pipelineId }));
    };

    return (
        <App auth={auth}>
            <Head title="Sales Pipeline" />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-col h-[calc(100vh-120px)] p-4"
            >
                {/* Page Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-foreground">
                            Sales Pipeline
                        </h1>

                        {/* Pipeline Selector */}
                        {pipelines.length > 1 && (
                            <Dropdown>
                                <DropdownTrigger>
                                    <Button
                                        variant="flat"
                                        endContent={<ChevronDownIcon className="w-4 h-4" />}
                                    >
                                        {pipeline?.name || 'Select Pipeline'}
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu
                                    aria-label="Select Pipeline"
                                    selectionMode="single"
                                    selectedKeys={[String(selectedPipelineId)]}
                                    onSelectionChange={(keys) => {
                                        const id = Array.from(keys)[0];
                                        if (id) handlePipelineChange(id);
                                    }}
                                >
                                    {pipelines.map((p) => (
                                        <DropdownItem key={String(p.id)}>
                                            {p.name}
                                        </DropdownItem>
                                    ))}
                                </DropdownMenu>
                            </Dropdown>
                        )}
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-2">
                        <Tabs
                            size="sm"
                            selectedKey={viewMode}
                            onSelectionChange={setViewMode}
                            aria-label="View mode"
                        >
                            <Tab
                                key="kanban"
                                title={
                                    <div className="flex items-center gap-1.5">
                                        <ViewColumnsIcon className="w-4 h-4" />
                                        <span>Kanban</span>
                                    </div>
                                }
                            />
                            <Tab
                                key="list"
                                title={
                                    <div className="flex items-center gap-1.5">
                                        <Squares2X2Icon className="w-4 h-4" />
                                        <span>List</span>
                                    </div>
                                }
                            />
                        </Tabs>

                        <Button
                            size="sm"
                            variant="flat"
                            isIconOnly
                            aria-label="Pipeline Settings"
                        >
                            <Cog6ToothIcon className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <Card className="flex-1 overflow-hidden">
                    <CardBody className="p-4 overflow-hidden">
                        {viewMode === 'kanban' ? (
                            <KanbanBoard
                                initialPipeline={pipeline}
                                initialColumns={columns}
                                initialSummary={summary}
                                users={users}
                            />
                        ) : (
                            // Placeholder for list view
                            <div className="flex items-center justify-center h-full text-default-400">
                                <p>List view coming soon...</p>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </motion.div>
        </App>
    );
}
