import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Tab, Tabs, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Spinner } from "@heroui/react";
import { ArrowLeftIcon, PlusIcon, EyeIcon, CheckIcon, ClockIcon } from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';
import BlockLibrary from '../../../../Components/CMS/BlockLibrary.jsx';
import BlockEditor from '../../../../Components/CMS/BlockEditor.jsx';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';

const CmsPageEditor = ({ page = null, blockTypes = [] }) => {
    const { auth } = usePage().props;

    const themeRadius = useThemeRadius();

    const [isMobile, setIsMobile] = useState(false);
    const [pageData, setPageData] = useState(page || { title: '', slug: '', content: { blocks: [] } });
    const [blocks, setBlocks] = useState(page?.blocks || []);
    const [draggingBlockId, setDraggingBlockId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const { isOpen: isBlockEditorOpen, onOpen: onBlockEditorOpen, onOpenChange: onBlockEditorChange } = useDisclosure();
    const { isOpen: isBlockLibraryOpen, onOpen: onBlockLibraryOpen, onOpenChange: onBlockLibraryChange } = useDisclosure();

    const [selectedBlock, setSelectedBlock] = useState(null);
    const [selectedBlockType, setSelectedBlockType] = useState(null);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const handleAddBlock = (blockType) => {
        setSelectedBlockType(blockType);
        onBlockLibraryChange(false);
        onBlockEditorOpen();
    };

    const handleSaveBlock = async (blockData) => {
        setSaving(true);
        try {
            let response;
            if (selectedBlock?.id) {
                // Update existing block
                response = await axios.patch(route('admin.cms.blocks.update', selectedBlock.id), blockData);
            } else {
                // Create new block
                response = await axios.post(route('admin.cms.blocks.store', { page: pageData.id }), {
                    ...blockData,
                    type: selectedBlockType.name,
                    order_index: blocks.length
                });
            }

            if (response.status === 200 || response.status === 201) {
                const newBlock = response.data.data || response.data;
                
                if (selectedBlock?.id) {
                    setBlocks(blocks.map(b => b.id === newBlock.id ? newBlock : b));
                } else {
                    setBlocks([...blocks, newBlock]);
                }

                showToast.promise(Promise.resolve([]), {
                    success: selectedBlock?.id ? 'Block updated' : 'Block added'
                });
                onBlockEditorChange(false);
                setSelectedBlock(null);
                setSelectedBlockType(null);
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to save block'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteBlock = async (blockId) => {
        setSaving(true);
        try {
            const response = await axios.delete(route('admin.cms.blocks.destroy', blockId));
            if (response.status === 200) {
                setBlocks(blocks.filter(b => b.id !== blockId));
                showToast.promise(Promise.resolve([]), { success: 'Block deleted' });
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), { error: 'Failed to delete block' });
        } finally {
            setSaving(false);
        }
    };

    const handleReorderBlocks = async (orderedBlocks) => {
        try {
            await axios.post(route('admin.cms.blocks.reorder', { page: pageData.id }), {
                blocks: orderedBlocks.map((b, idx) => ({ id: b.id, order: idx }))
            });
            setBlocks(orderedBlocks);
        } catch (error) {
            showToast.promise(Promise.reject(error), { error: 'Failed to reorder blocks' });
        }
    };

    const handleDragStart = (e, blockId) => {
        setDraggingBlockId(blockId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, targetBlockId) => {
        e.preventDefault();
        if (draggingBlockId === targetBlockId) return;

        const draggedIndex = blocks.findIndex(b => b.id === draggingBlockId);
        const targetIndex = blocks.findIndex(b => b.id === targetBlockId);

        if (draggedIndex < targetIndex) {
            const newBlocks = [
                ...blocks.slice(0, draggedIndex),
                ...blocks.slice(draggedIndex + 1, targetIndex + 1),
                blocks[draggedIndex],
                ...blocks.slice(targetIndex + 1)
            ];
            handleReorderBlocks(newBlocks);
        } else {
            const newBlocks = [
                ...blocks.slice(0, targetIndex),
                blocks[draggedIndex],
                ...blocks.slice(targetIndex, draggedIndex),
                ...blocks.slice(draggedIndex + 1)
            ];
            handleReorderBlocks(newBlocks);
        }
        setDraggingBlockId(null);
    };

    const handleSavePage = async () => {
        setSaving(true);
        try {
            const response = await axios.put(route('admin.cms.pages.update', pageData.id), {
                title: pageData.title,
                slug: pageData.slug,
                status: 'draft'
            });

            if (response.status === 200) {
                showToast.promise(Promise.resolve([]), { success: 'Page saved as draft' });
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), { error: 'Failed to save page' });
        } finally {
            setSaving(false);
        }
    };

    const handlePublish = async () => {
        setSaving(true);
        try {
            const response = await axios.post(route('admin.cms.pages.publish', pageData.id), {
                summary: 'Published from page builder'
            });

            if (response.status === 200) {
                showToast.promise(Promise.resolve([]), { success: 'Page published successfully' });
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), { error: 'Failed to publish page' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Head title={`Edit: ${pageData.title}`} />

            {/* Block Editor Modal */}
            {isBlockEditorOpen && (
                <BlockEditor
                    isOpen={isBlockEditorOpen}
                    onOpenChange={onBlockEditorChange}
                    block={selectedBlock}
                    blockType={selectedBlockType}
                    onSave={handleSaveBlock}
                    saving={saving}
                />
            )}

            {/* Block Library Modal */}
            <Modal isOpen={isBlockLibraryOpen} onOpenChange={onBlockLibraryChange} size="xl">
                <ModalContent>
                    <ModalHeader>Select Block Type</ModalHeader>
                    <ModalBody>
                        <BlockLibrary blockTypes={blockTypes} onSelectType={handleAddBlock} />
                    </ModalBody>
                </ModalContent>
            </Modal>

            <div className="flex flex-col w-full h-full bg-content2" role="main">
                {/* Header */}
                <div className="border-b border-divider bg-content1 p-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                            <Button isIconOnly variant="light" size="sm" onPress={() => router.get(route('admin.cms.pages.index'))}>
                                <ArrowLeftIcon className="w-5 h-5" />
                            </Button>
                            <div>
                                <h1 className="text-xl font-bold">{pageData.title}</h1>
                                <p className="text-xs text-default-500">{pageData.slug}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="flat"
                                size="sm"
                                isLoading={saving}
                                onPress={handleSavePage}
                            >
                                <ClockIcon className="w-4 h-4" />
                                Save Draft
                            </Button>
                            <Button
                                color="primary"
                                size="sm"
                                isLoading={saving}
                                onPress={handlePublish}
                            >
                                <CheckIcon className="w-4 h-4" />
                                Publish
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex gap-4 p-4 overflow-auto">
                    {/* Canvas Area */}
                    <div className="flex-1 min-h-0 flex flex-col gap-4">
                        <Card className="flex-1 border border-divider">
                            <CardHeader className="border-b">
                                <div className="flex items-center gap-2 w-full justify-between">
                                    <span className="text-sm font-semibold">Page Content ({blocks.length} blocks)</span>
                                    <Button
                                        size="sm"
                                        color="primary"
                                        variant="flat"
                                        startContent={<PlusIcon className="w-4 h-4" />}
                                        onPress={onBlockLibraryOpen}
                                    >
                                        Add Block
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardBody className="gap-3 p-4 overflow-auto">
                                {blocks.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="text-4xl mb-2">📦</div>
                                        <p className="text-sm text-default-500">No blocks yet</p>
                                        <p className="text-xs text-default-400 mb-4">Add your first block to get started</p>
                                        <Button
                                            size="sm"
                                            color="primary"
                                            startContent={<PlusIcon className="w-4 h-4" />}
                                            onPress={onBlockLibraryOpen}
                                        >
                                            Add First Block
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {blocks.map((block, idx) => (
                                            <motion.div
                                                key={block.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, block.id)}
                                                onDragOver={handleDragOver}
                                                onDrop={(e) => handleDrop(e, block.id)}
                                                className={`p-3 border-2 rounded-lg cursor-move transition-all ${
                                                    draggingBlockId === block.id
                                                        ? 'border-primary bg-primary/10 opacity-50'
                                                        : 'border-divider hover:border-primary/50 bg-content2'
                                                }`}
                                                whileHover={{ scale: 1.01 }}
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <div className="text-xs font-mono text-default-400">#{idx + 1}</div>
                                                        <div>
                                                            <p className="text-sm font-medium">{block.type}</p>
                                                            <p className="text-xs text-default-500">
                                                                {block.data?.title || block.data?.name || 'Block data'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            isIconOnly
                                                            size="sm"
                                                            variant="light"
                                                            onPress={() => {
                                                                setSelectedBlock(block);
                                                                onBlockEditorOpen();
                                                            }}
                                                        >
                                                            ✏️
                                                        </Button>
                                                        <Button
                                                            isIconOnly
                                                            size="sm"
                                                            variant="light"
                                                            color="danger"
                                                            onPress={() => handleDeleteBlock(block.id)}
                                                            isLoading={saving}
                                                        >
                                                            🗑️
                                                        </Button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </div>

                    {/* Sidebar - Page Settings */}
                    {!isMobile && (
                        <div className="w-72">
                            <Card className="border border-divider">
                                <CardHeader className="border-b text-sm font-semibold">Page Settings</CardHeader>
                                <CardBody className="gap-3">
                                    <Input
                                        label="Title"
                                        value={pageData.title}
                                        onChange={(e) => setPageData({ ...pageData, title: e.target.value })}
                                        size="sm"
                                        radius={themeRadius}
                                    />
                                    <Input
                                        label="Slug"
                                        value={pageData.slug}
                                        onChange={(e) => setPageData({ ...pageData, slug: e.target.value })}
                                        size="sm"
                                        radius={themeRadius}
                                    />
                                    <div className="pt-2 border-t">
                                        <p className="text-xs font-semibold text-default-600 mb-2">Status</p>
                                        <Chip size="sm" color={pageData.status === 'published' ? 'success' : 'warning'} variant="flat">
                                            {pageData.status}
                                        </Chip>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

CmsPageEditor.layout = (page) => <App children={page} />;
export default CmsPageEditor;