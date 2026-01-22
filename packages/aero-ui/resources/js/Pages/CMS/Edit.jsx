import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Button,
    Card,
    CardBody,
    Tabs,
    Tab,
    Chip,
    Tooltip,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Spinner,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
} from "@heroui/react";
import {
    DocumentTextIcon,
    ArrowLeftIcon,
    CheckIcon,
    EyeIcon,
    Cog6ToothIcon,
    DevicePhoneMobileIcon,
    ComputerDesktopIcon,
    DeviceTabletIcon,
    CloudArrowUpIcon,
    ArrowPathIcon,
    TrashIcon,
    ChevronDownIcon,
    ClockIcon,
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import BlockPalette from '@/Components/Cms/BlockPalette';
import BlockEditor from '@/Components/Cms/BlockEditor';
import BlockSettings from '@/Components/Cms/BlockSettings';
import PageSettings from '@/Components/Cms/PageSettings';
import BlockRenderer from '@/Blocks/BlockRenderer';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';

// Block categories for the palette
const BLOCK_CATEGORIES = [
    { id: 'hero', label: 'Hero Sections' },
    { id: 'content', label: 'Content' },
    { id: 'features', label: 'Features & Lists' },
    { id: 'media', label: 'Media' },
    { id: 'social', label: 'Social Proof' },
    { id: 'cta', label: 'Call to Action' },
    { id: 'forms', label: 'Forms' },
    { id: 'layout', label: 'Layout' },
];

const CmsEdit = ({ title, page: initialPage, blockTypes = [], layouts = [] }) => {
    const { auth } = usePage().props;

    // Responsive breakpoints
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkScreenSize = () => setIsMobile(window.innerWidth < 640);
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Page state
    const [page, setPage] = useState(initialPage || {
        title: '',
        slug: '',
        status: 'draft',
        blocks: [],
        meta_title: '',
        meta_description: '',
    });
    const [blocks, setBlocks] = useState(initialPage?.blocks || []);
    const [selectedBlockId, setSelectedBlockId] = useState(null);
    const [rightPanelTab, setRightPanelTab] = useState('block');
    const [previewMode, setPreviewMode] = useState('desktop');
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);

    // Permissions
    const canEdit = auth.permissions?.includes('cms.pages.update') || true;
    const canPublish = auth.permissions?.includes('cms.pages.publish') || true;
    const canDelete = auth.permissions?.includes('cms.pages.delete') || true;

    // Selected block
    const selectedBlock = useMemo(() => {
        return blocks.find(b => b.id === selectedBlockId);
    }, [blocks, selectedBlockId]);

    // Mark changes
    useEffect(() => {
        setHasUnsavedChanges(true);
    }, [blocks, page.title, page.slug, page.meta_title, page.meta_description]);

    // Add new block
    const handleAddBlock = useCallback((blockType) => {
        const blockConfig = blockTypes.find(b => b.type === blockType);
        const newBlock = {
            id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            block_type: blockType,
            content: blockConfig?.defaults || {},
            settings: {
                padding: 'md',
                margin: 'md',
                backgroundColor: 'transparent',
            },
            sort_order: blocks.length,
        };
        setBlocks(prev => [...prev, newBlock]);
        setSelectedBlockId(newBlock.id);
        setRightPanelTab('block');
    }, [blockTypes, blocks.length]);

    // Update block
    const handleBlockChange = useCallback((updates) => {
        setBlocks(prev => prev.map(block => 
            block.id === selectedBlockId 
                ? { ...block, ...updates }
                : block
        ));
    }, [selectedBlockId]);

    // Move block
    const handleMoveBlock = useCallback((blockId, direction) => {
        setBlocks(prev => {
            const index = prev.findIndex(b => b.id === blockId);
            if (index === -1) return prev;
            
            const newIndex = direction === 'up' ? index - 1 : index + 1;
            if (newIndex < 0 || newIndex >= prev.length) return prev;
            
            const newBlocks = [...prev];
            [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
            return newBlocks.map((b, i) => ({ ...b, sort_order: i }));
        });
    }, []);

    // Duplicate block
    const handleDuplicateBlock = useCallback((blockId) => {
        setBlocks(prev => {
            const block = prev.find(b => b.id === blockId);
            if (!block) return prev;
            
            const newBlock = {
                ...block,
                id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                sort_order: block.sort_order + 1,
            };
            
            const index = prev.findIndex(b => b.id === blockId);
            const newBlocks = [...prev];
            newBlocks.splice(index + 1, 0, newBlock);
            return newBlocks.map((b, i) => ({ ...b, sort_order: i }));
        });
    }, []);

    // Delete block
    const handleDeleteBlock = useCallback((blockId) => {
        setBlocks(prev => prev.filter(b => b.id !== blockId).map((b, i) => ({ ...b, sort_order: i })));
        if (selectedBlockId === blockId) {
            setSelectedBlockId(null);
        }
    }, [selectedBlockId]);

    // Save page
    const handleSave = useCallback(async () => {
        setIsSaving(true);
        try {
            const response = await axios.put(route('admin.cms.pages.update', page.id), {
                ...page,
                blocks: blocks,
            });
            
            if (response.data?.page) {
                setPage(response.data.page);
                setHasUnsavedChanges(false);
                setLastSaved(new Date());
                showToast.success('Page saved successfully');
            }
        } catch (error) {
            showToast.error(error.response?.data?.message || 'Failed to save page');
        } finally {
            setIsSaving(false);
        }
    }, [page, blocks]);

    // Publish/Unpublish page
    const handlePublish = useCallback(async () => {
        setIsPublishing(true);
        try {
            const action = page.status === 'published' ? 'unpublish' : 'publish';
            const response = await axios.post(route(`admin.cms.pages.${action}`, page.id));
            
            if (response.data?.page) {
                setPage(response.data.page);
                showToast.success(`Page ${action}ed successfully`);
            }
        } catch (error) {
            showToast.error(error.response?.data?.message || 'Failed to update page status');
        } finally {
            setIsPublishing(false);
        }
    }, [page.id, page.status]);

    // Delete page
    const handleDelete = useCallback(async () => {
        try {
            await axios.delete(route('admin.cms.pages.destroy', page.id));
            showToast.success('Page deleted successfully');
            router.visit(route('admin.cms.pages.index'));
        } catch (error) {
            showToast.error(error.response?.data?.message || 'Failed to delete page');
        }
        setShowDeleteModal(false);
    }, [page.id]);

    // Preview width based on mode
    const previewWidth = useMemo(() => {
        switch (previewMode) {
            case 'mobile': return '375px';
            case 'tablet': return '768px';
            default: return '100%';
        }
    }, [previewMode]);

    // Update page field
    const handlePageChange = useCallback((field, value) => {
        setPage(prev => ({ ...prev, [field]: value }));
    }, []);

    return (
        <DndProvider backend={HTML5Backend}>
            <Head title={title || `Edit: ${page.title}`} />

            {/* Delete Confirmation Modal */}
            <Modal isOpen={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <ModalContent>
                    <ModalHeader>Delete Page</ModalHeader>
                    <ModalBody>
                        <p>Are you sure you want to delete "<strong>{page.title}</strong>"?</p>
                        <p className="text-sm text-default-500 mt-2">This action cannot be undone.</p>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => setShowDeleteModal(false)}>Cancel</Button>
                        <Button color="danger" onPress={handleDelete}>Delete</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Preview Modal */}
            <Modal 
                isOpen={isPreviewOpen} 
                onOpenChange={setIsPreviewOpen}
                size="full"
                classNames={{ base: "m-0", wrapper: "p-0" }}
            >
                <ModalContent>
                    <ModalHeader className="border-b border-divider">
                        <div className="flex items-center justify-between w-full">
                            <span>Preview: {page.title}</span>
                            <div className="flex gap-2">
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant={previewMode === 'mobile' ? 'solid' : 'light'}
                                    onPress={() => setPreviewMode('mobile')}
                                >
                                    <DevicePhoneMobileIcon className="w-4 h-4" />
                                </Button>
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant={previewMode === 'tablet' ? 'solid' : 'light'}
                                    onPress={() => setPreviewMode('tablet')}
                                >
                                    <DeviceTabletIcon className="w-4 h-4" />
                                </Button>
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant={previewMode === 'desktop' ? 'solid' : 'light'}
                                    onPress={() => setPreviewMode('desktop')}
                                >
                                    <ComputerDesktopIcon className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </ModalHeader>
                    <ModalBody className="p-0 bg-slate-100 dark:bg-slate-900 overflow-auto">
                        <div 
                            className="mx-auto bg-white dark:bg-content1 min-h-full shadow-lg transition-all duration-300"
                            style={{ width: previewWidth, maxWidth: '100%' }}
                        >
                            {blocks.map((block) => (
                                <BlockRenderer
                                    key={block.id}
                                    type={block.block_type}
                                    content={block.content}
                                    settings={block.settings}
                                />
                            ))}
                        </div>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* Main Layout */}
            <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900">
                {/* Top Bar */}
                <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-content1 border-b border-divider shrink-0">
                    <div className="flex items-center gap-3">
                        <Button
                            isIconOnly
                            variant="light"
                            onPress={() => {
                                if (hasUnsavedChanges) {
                                    if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
                                        router.visit(route('admin.cms.pages.index'));
                                    }
                                } else {
                                    router.visit(route('admin.cms.pages.index'));
                                }
                            }}
                        >
                            <ArrowLeftIcon className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-lg font-semibold flex items-center gap-2">
                                {page.title || 'Untitled Page'}
                                <Chip 
                                    size="sm" 
                                    color={page.status === 'published' ? 'success' : 'default'}
                                    variant="flat"
                                >
                                    {page.status}
                                </Chip>
                            </h1>
                            <p className="text-xs text-default-500">
                                /{page.slug}
                                {lastSaved && (
                                    <span className="ml-2">
                                        <ClockIcon className="w-3 h-3 inline mr-1" />
                                        Saved {lastSaved.toLocaleTimeString()}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Preview Mode Switcher */}
                        <div className="hidden md:flex items-center gap-1 mr-2">
                            <Tooltip content="Mobile">
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant={previewMode === 'mobile' ? 'solid' : 'light'}
                                    onPress={() => setPreviewMode('mobile')}
                                >
                                    <DevicePhoneMobileIcon className="w-4 h-4" />
                                </Button>
                            </Tooltip>
                            <Tooltip content="Tablet">
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant={previewMode === 'tablet' ? 'solid' : 'light'}
                                    onPress={() => setPreviewMode('tablet')}
                                >
                                    <DeviceTabletIcon className="w-4 h-4" />
                                </Button>
                            </Tooltip>
                            <Tooltip content="Desktop">
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant={previewMode === 'desktop' ? 'solid' : 'light'}
                                    onPress={() => setPreviewMode('desktop')}
                                >
                                    <ComputerDesktopIcon className="w-4 h-4" />
                                </Button>
                            </Tooltip>
                        </div>

                        {/* Preview Button */}
                        <Button
                            variant="flat"
                            startContent={<EyeIcon className="w-4 h-4" />}
                            onPress={() => setIsPreviewOpen(true)}
                            size={isMobile ? "sm" : "md"}
                        >
                            {!isMobile && 'Preview'}
                        </Button>

                        {/* Save Button */}
                        <Button
                            variant="flat"
                            color={hasUnsavedChanges ? 'warning' : 'default'}
                            startContent={!isSaving && <CloudArrowUpIcon className="w-4 h-4" />}
                            onPress={handleSave}
                            isLoading={isSaving}
                            isDisabled={!canEdit}
                            size={isMobile ? "sm" : "md"}
                        >
                            {!isMobile && (hasUnsavedChanges ? 'Save*' : 'Saved')}
                        </Button>

                        {/* Publish Button */}
                        {canPublish && (
                            <Button
                                color={page.status === 'published' ? 'default' : 'primary'}
                                variant={page.status === 'published' ? 'flat' : 'shadow'}
                                startContent={!isPublishing && <CheckIcon className="w-4 h-4" />}
                                onPress={handlePublish}
                                isLoading={isPublishing}
                                size={isMobile ? "sm" : "md"}
                            >
                                {!isMobile && (page.status === 'published' ? 'Unpublish' : 'Publish')}
                            </Button>
                        )}

                        {/* More Actions */}
                        <Dropdown>
                            <DropdownTrigger>
                                <Button isIconOnly variant="light" size={isMobile ? "sm" : "md"}>
                                    <ChevronDownIcon className="w-4 h-4" />
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Page actions">
                                <DropdownItem
                                    key="view"
                                    startContent={<EyeIcon className="w-4 h-4" />}
                                    onPress={() => window.open(`/page/${page.slug}`, '_blank')}
                                >
                                    View Live Page
                                </DropdownItem>
                                <DropdownItem
                                    key="duplicate"
                                    startContent={<ArrowPathIcon className="w-4 h-4" />}
                                >
                                    Duplicate Page
                                </DropdownItem>
                                {canDelete && (
                                    <DropdownItem
                                        key="delete"
                                        className="text-danger"
                                        color="danger"
                                        startContent={<TrashIcon className="w-4 h-4" />}
                                        onPress={() => setShowDeleteModal(true)}
                                    >
                                        Delete Page
                                    </DropdownItem>
                                )}
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                </header>

                {/* Main Content Area */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Left Sidebar - Block Palette */}
                    <aside className="w-64 bg-white dark:bg-content1 border-r border-divider shrink-0 hidden lg:block overflow-hidden">
                        <BlockPalette
                            categories={BLOCK_CATEGORIES}
                            blockTypes={blockTypes}
                            onAddBlock={handleAddBlock}
                        />
                    </aside>

                    {/* Center - Canvas */}
                    <main className="flex-1 overflow-auto p-6">
                        <div 
                            className="mx-auto transition-all duration-300"
                            style={{ width: previewMode === 'desktop' ? '100%' : previewWidth, maxWidth: '100%' }}
                        >
                            <Card className="min-h-[600px] bg-white dark:bg-content1">
                                <CardBody className="p-0">
                                    {blocks.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-center">
                                            <DocumentTextIcon className="w-16 h-16 text-default-300 mb-4" />
                                            <h3 className="text-lg font-semibold mb-2">Start Building Your Page</h3>
                                            <p className="text-default-500 mb-6 max-w-md">
                                                Add blocks from the left sidebar to create your page layout.
                                                Drag and drop to reorder blocks.
                                            </p>
                                            <Button
                                                color="primary"
                                                variant="flat"
                                                onPress={() => handleAddBlock('hero')}
                                            >
                                                Add Hero Section
                                            </Button>
                                        </div>
                                    ) : (
                                        <BlockEditor
                                            blocks={blocks}
                                            selectedBlockId={selectedBlockId}
                                            onSelect={setSelectedBlockId}
                                            onMove={handleMoveBlock}
                                            onDuplicate={handleDuplicateBlock}
                                            onDelete={handleDeleteBlock}
                                        />
                                    )}
                                </CardBody>
                            </Card>
                        </div>
                    </main>

                    {/* Right Sidebar - Settings */}
                    <aside className="w-80 bg-white dark:bg-content1 border-l border-divider shrink-0 hidden md:flex flex-col overflow-hidden">
                        <Tabs
                            selectedKey={rightPanelTab}
                            onSelectionChange={setRightPanelTab}
                            variant="underlined"
                            classNames={{
                                base: "w-full",
                                tabList: "gap-0 w-full px-4 pt-2 border-b border-divider",
                                tab: "flex-1 h-10",
                            }}
                        >
                            <Tab
                                key="block"
                                title={
                                    <div className="flex items-center gap-2">
                                        <Cog6ToothIcon className="w-4 h-4" />
                                        <span>Block</span>
                                    </div>
                                }
                            />
                            <Tab
                                key="page"
                                title={
                                    <div className="flex items-center gap-2">
                                        <DocumentTextIcon className="w-4 h-4" />
                                        <span>Page</span>
                                    </div>
                                }
                            />
                        </Tabs>

                        <div className="flex-1 overflow-auto">
                            <AnimatePresence mode="wait">
                                {rightPanelTab === 'block' ? (
                                    <motion.div
                                        key="block"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {selectedBlock ? (
                                            <BlockSettings
                                                block={selectedBlock}
                                                blockTypes={blockTypes}
                                                onChange={handleBlockChange}
                                            />
                                        ) : (
                                            <div className="p-6 text-center text-default-500">
                                                <Cog6ToothIcon className="w-12 h-12 mx-auto mb-3 text-default-300" />
                                                <p className="text-sm">Select a block to edit its settings</p>
                                            </div>
                                        )}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="page"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <PageSettings
                                            page={page}
                                            onChange={handlePageChange}
                                            layouts={layouts}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </aside>
                </div>

                {/* Mobile Bottom Bar - Block Palette Trigger */}
                <div className="lg:hidden shrink-0 p-4 bg-white dark:bg-content1 border-t border-divider">
                    <Button
                        fullWidth
                        variant="flat"
                        onPress={() => {/* Open mobile block palette drawer */}}
                    >
                        Add Block
                    </Button>
                </div>
            </div>
        </DndProvider>
    );
};

// Don't use App layout for the page builder - it has its own full-screen layout
CmsEdit.layout = (page) => page;
export default CmsEdit;
