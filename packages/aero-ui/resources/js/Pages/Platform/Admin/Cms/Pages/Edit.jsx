import React, { useCallback, useMemo, useState } from 'react';
import { Head, usePage, useForm } from '@inertiajs/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion } from 'framer-motion';
import {
  Button,
  Card,
  CardBody,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Input,
} from '@heroui/react';
import {
  ArrowLeftIcon,
  CheckIcon,
  EyeIcon,
  SaveIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  DocumentDuplicateIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App';
import BlockPalette from '@/Components/Cms/BlockPalette';
import BlockSettings from '@/Components/Cms/BlockSettings';
import PageSettings from '@/Components/Cms/PageSettings';
import BlockEditor from '@/Components/Cms/BlockEditor';
import { showToast } from '@/utils/toastUtils';

const Edit = ({ title, page, blocks: initialBlocks, blockTypes, blockCategories, layouts }) => {
  const { auth } = usePage().props;
  const { data, setData, put, processing } = useForm({
    title: page.title,
    slug: page.slug,
    meta_title: page.meta_title,
    meta_description: page.meta_description,
    layout: page.layout,
    blocks: initialBlocks,
  });

  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [previewMode, setPreviewMode] = useState('desktop');
  const [rightPanel, setRightPanel] = useState('settings');
  const { isOpen: isPublishOpen, onOpen: onPublishOpen, onOpenChange: onPublishChange } = useDisclosure();

  const selectedBlock = useMemo(
    () => data.blocks.find((b) => b.id === selectedBlockId),
    [data.blocks, selectedBlockId]
  );

  const handleAddBlock = useCallback((blockType) => {
    const newBlock = {
      id: Date.now(),
      block_type: blockType,
      content: blockTypes.find((b) => b.type === blockType)?.defaults || {},
      settings: {},
      order_index: data.blocks.length,
    };

    setData('blocks', [...data.blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
    showToast.success('Block added');
  }, [data.blocks, blockTypes, setData]);

  const handleUpdateBlock = useCallback((blockId, updates) => {
    setData('blocks', data.blocks.map((b) => 
      b.id === blockId ? { ...b, ...updates } : b
    ));
  }, [data.blocks, setData]);

  const handleDeleteBlock = useCallback((blockId) => {
    setData('blocks', data.blocks.filter((b) => b.id !== blockId));
    setSelectedBlockId(null);
    showToast.success('Block deleted');
  }, [data.blocks, setData]);

  const handleMoveBlock = useCallback((blockId, direction) => {
    const index = data.blocks.findIndex((b) => b.id === blockId);
    if (index === -1) return;

    const newBlocks = [...data.blocks];
    if (direction === 'up' && index > 0) {
      [newBlocks[index], newBlocks[index - 1]] = [newBlocks[index - 1], newBlocks[index]];
    } else if (direction === 'down' && index < newBlocks.length - 1) {
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    }

    // Update order indices
    newBlocks.forEach((block, i) => {
      block.order_index = i;
    });

    setData('blocks', newBlocks);
  }, [data.blocks, setData]);

  const handleDuplicateBlock = useCallback((blockId) => {
    const blockToDuplicate = data.blocks.find((b) => b.id === blockId);
    if (!blockToDuplicate) return;

    const newBlock = {
      ...JSON.parse(JSON.stringify(blockToDuplicate)),
      id: Date.now(),
      order_index: data.blocks.length,
    };

    setData('blocks', [...data.blocks, newBlock]);
    showToast.success('Block duplicated');
  }, [data.blocks, setData]);

  const handleSave = () => {
    const promise = new Promise((resolve, reject) => {
      put(route('admin.cms.pages.update', page.id), {
        onSuccess: () => resolve(),
        onError: () => reject(),
      });
    });

    showToast.promise(promise, {
      loading: 'Saving page...',
      success: 'Page saved successfully',
      error: 'Failed to save page',
    });
  };

  const handlePublish = () => {
    const promise = new Promise((resolve, reject) => {
      axios.post(route('admin.cms.pages.publish', page.id), {}, {
        onSuccess: () => resolve(),
        onError: () => reject(),
      });
    });

    showToast.promise(promise, {
      loading: 'Publishing page...',
      success: 'Page published successfully',
      error: 'Failed to publish page',
    });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Head title={title} />

      <div className="h-screen flex flex-col">
        {/* Top Toolbar */}
        <header className="h-16 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 flex items-center justify-between px-4 z-40">
          <div className="flex items-center gap-4">
            <Tooltip content="Back to pages">
              <Button
                isIconOnly
                variant="light"
                onPress={() => window.history.back()}
                startContent={<ArrowLeftIcon className="w-5 h-5" />}
              />
            </Tooltip>
            <div>
              <h1 className="font-bold text-lg">{data.title}</h1>
              <p className="text-xs text-slate-500">/{data.slug}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Device Preview Toggles */}
            <div className="hidden md:flex border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden">
              {['desktop', 'tablet', 'mobile'].map((mode) => (
                <Button
                  key={mode}
                  size="sm"
                  variant={previewMode === mode ? 'solid' : 'light'}
                  className="rounded-none"
                  onPress={() => setPreviewMode(mode)}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Button>
              ))}
            </div>

            <Tooltip content="Preview">
              <Button
                isIconOnly
                variant="light"
                startContent={<EyeIcon className="w-5 h-5" />}
                onPress={() => window.open(route('admin.cms.pages.preview', page.id), '_blank')}
              />
            </Tooltip>

            {page.status === 'published' && (
              <Badge content="Published" color="success" />
            )}

            <Button
              color="primary"
              variant="shadow"
              size="sm"
              startContent={<SaveIcon className="w-4 h-4" />}
              isLoading={processing}
              onPress={handleSave}
            >
              Save
            </Button>

            {page.status !== 'published' && (
              <Button
                color="success"
                variant="flat"
                size="sm"
                startContent={<CheckIcon className="w-4 h-4" />}
                onPress={onPublishOpen}
              >
                Publish
              </Button>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Block Palette */}
          <aside className="hidden lg:flex w-80 border-r border-slate-200 dark:border-white/10 flex-col bg-slate-50 dark:bg-slate-950/50">
            <BlockPalette
              categories={blockCategories}
              blockTypes={blockTypes}
              onAddBlock={handleAddBlock}
            />
          </aside>

          {/* Center - Block Editor */}
          <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-6">
            <div className={`mx-auto transition-all ${
              previewMode === 'mobile' ? 'max-w-sm' :
              previewMode === 'tablet' ? 'max-w-2xl' :
              'max-w-4xl'
            }`}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {data.blocks.length === 0 ? (
                  <Card className="border-2 border-dashed border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/50">
                    <CardBody className="py-12 text-center">
                      <p className="text-slate-500 mb-4">No blocks added yet</p>
                      <p className="text-xs text-slate-400 mb-4">
                        Add blocks from the palette on the left to build your page
                      </p>
                    </CardBody>
                  </Card>
                ) : (
                  <BlockEditor
                    blocks={data.blocks}
                    selectedBlockId={selectedBlockId}
                    onSelectBlock={setSelectedBlockId}
                    onUpdateBlock={handleUpdateBlock}
                    onDeleteBlock={handleDeleteBlock}
                    onMoveBlock={handleMoveBlock}
                    onDuplicateBlock={handleDuplicateBlock}
                  />
                )}
              </motion.div>
            </div>
          </main>

          {/* Right Sidebar - Settings */}
          <aside className="hidden lg:flex w-80 border-l border-slate-200 dark:border-white/10 flex-col bg-slate-50 dark:bg-slate-950/50">
            <Tabs
              selectedKey={rightPanel}
              onSelectionChange={setRightPanel}
              classNames={{ tabList: 'rounded-none border-b border-slate-200 dark:border-white/10' }}
            >
              <Tab key="settings" title="Block Settings">
                {selectedBlock ? (
                  <BlockSettings
                    block={selectedBlock}
                    blockTypes={blockTypes}
                    onChange={(updates) => handleUpdateBlock(selectedBlockId, updates)}
                  />
                ) : (
                  <div className="p-4 text-center text-slate-500 text-sm">
                    Select a block to edit its settings
                  </div>
                )}
              </Tab>
              <Tab key="page" title="Page">
                <PageSettings
                  page={data}
                  onChange={setData}
                  layouts={layouts}
                />
              </Tab>
            </Tabs>
          </aside>
        </div>
      </div>

      {/* Publish Modal */}
      <Modal isOpen={isPublishOpen} onOpenChange={onPublishChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Publish Page</ModalHeader>
              <ModalBody>
                <p>Are you ready to publish "{data.title}"?</p>
                <p className="text-sm text-slate-500">
                  This page will be visible to the public at: /{data.slug}
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="success"
                  onPress={() => {
                    handlePublish();
                    onClose();
                  }}
                >
                  Publish
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </DndProvider>
  );
};

Edit.layout = (page) => <App children={page} />;
export default Edit;
