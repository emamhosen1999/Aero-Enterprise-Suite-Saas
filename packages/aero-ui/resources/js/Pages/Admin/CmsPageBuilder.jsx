import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useHRMAC } from '@/Hooks/access/useHRMAC';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Spinner,
  Textarea,
} from '@heroui/react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  DocumentIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App.jsx';
import BlockTypeSelector from '@/Components/Cms/BlockTypeSelector.jsx';
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';

/**
 * CMS Page Builder Admin Component
 *
 * Allows admins to create and manage CMS pages with advanced block types.
 * Integrates block selection, configuration, and live preview.
 */
const CmsPageBuilder = ({ page = null, blocks = [] }) => {
  const { auth } = usePage().props;

  // Theme radius helper (REQUIRED - matches LeavesAdmin.jsx pattern)
  const themeRadius = useThemeRadius();

  // Responsive breakpoints (REQUIRED)
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
  const [pageTitle, setPageTitle] = useState(page?.title || '');
  const [metaTitle, setMetaTitle] = useState(page?.meta_title || '');
  const [metaDescription, setMetaDescription] = useState(page?.meta_description || '');
  const [pageBlocks, setPageBlocks] = useState(blocks || []);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modal states
  const [modalStates, setModalStates] = useState({
    addBlock: false,
    editBlock: false,
    previewBlock: false,
  });

  // Block form states
  const [selectedBlockType, setSelectedBlockType] = useState(null);
  const [editingBlock, setEditingBlock] = useState(null);
  const [blockData, setBlockData] = useState({});

  // Permission checks (REQUIRED)
  const { hasAccess } = useHRMAC();
  const canCreate = hasAccess('cms.pages.list.create');
  const canEdit = hasAccess('cms.pages.editor.edit');
  const canDelete = hasAccess('cms.pages.list.delete');

  // Open/close modal helpers
  const openModal = (modalName) => {
    setModalStates(prev => ({ ...prev, [modalName]: true }));
  };

  const closeModal = (modalName) => {
    setModalStates(prev => ({ ...prev, [modalName]: false }));
    if (modalName === 'addBlock') {
      setSelectedBlockType(null);
      setBlockData({});
    }
    if (modalName === 'editBlock') {
      setEditingBlock(null);
      setBlockData({});
    }
  };

  // Handle adding a new block
  const handleAddBlock = useCallback(async () => {
    if (!selectedBlockType || !page) {
      showToast.error('Please select a block type');
      return;
    }

    setSaving(true);
    try {
      const response = await axios.post(
        route('admin.pages.blocks.store', page.id),
        {
          type: selectedBlockType.name,
          data: blockData,
          order_index: pageBlocks.length,
        }
      );

      if (response.status === 201) {
        setPageBlocks([...pageBlocks, response.data.block]);
        closeModal('addBlock');
        showToast.success('Block added successfully');
      }
    } catch (error) {
      showToast.error(
        error.response?.data?.message || 'Failed to add block'
      );
    } finally {
      setSaving(false);
    }
  }, [selectedBlockType, blockData, page, pageBlocks]);

  // Handle updating a block
  const handleUpdateBlock = useCallback(async () => {
    if (!editingBlock) return;

    setSaving(true);
    try {
      const response = await axios.put(
        route('admin.pages.blocks.update', editingBlock.id),
        { data: blockData }
      );

      if (response.status === 200) {
        setPageBlocks(
          pageBlocks.map(b => (b.id === editingBlock.id ? response.data.block : b))
        );
        closeModal('editBlock');
        showToast.success('Block updated successfully');
      }
    } catch (error) {
      showToast.error(
        error.response?.data?.message || 'Failed to update block'
      );
    } finally {
      setSaving(false);
    }
  }, [editingBlock, blockData, pageBlocks]);

  // Handle deleting a block
  const handleDeleteBlock = useCallback(async (blockId) => {
    if (!window.confirm('Are you sure you want to delete this block?')) {
      return;
    }

    setSaving(true);
    try {
      await axios.delete(route('admin.pages.blocks.destroy', blockId));
      setPageBlocks(pageBlocks.filter(b => b.id !== blockId));
      showToast.success('Block deleted successfully');
    } catch (error) {
      showToast.error(
        error.response?.data?.message || 'Failed to delete block'
      );
    } finally {
      setSaving(false);
    }
  }, [pageBlocks]);

  // Handle toggling block visibility
  const handleToggleVisibility = useCallback(async (block) => {
    try {
      const response = await axios.put(
        route('admin.pages.blocks.update', block.id),
        { is_visible: !block.is_visible }
      );

      setPageBlocks(
        pageBlocks.map(b => (b.id === block.id ? response.data.block : b))
      );
      showToast.success(
        `Block ${!block.is_visible ? 'shown' : 'hidden'} successfully`
      );
    } catch (error) {
      showToast.error('Failed to toggle block visibility');
    }
  }, [pageBlocks]);

  // Stats data (REQUIRED at top)
  const statsData = useMemo(() => [
    {
      title: 'Total Blocks',
      value: pageBlocks.length,
      icon: <DocumentIcon className="w-6 h-6" />,
      color: 'text-primary',
      iconBg: 'bg-primary/20',
    },
    {
      title: 'Visible',
      value: pageBlocks.filter(b => b.is_visible).length,
      icon: <EyeIcon className="w-6 h-6" />,
      color: 'text-success',
      iconBg: 'bg-success/20',
    },
    {
      title: 'Hidden',
      value: pageBlocks.filter(b => !b.is_visible).length,
      icon: <EyeSlashIcon className="w-6 h-6" />,
      color: 'text-warning',
      iconBg: 'bg-warning/20',
    },
  ], [pageBlocks]);

  if (!page) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner label="Loading page..." color="primary" />
      </div>
    );
  }

  // RENDER STRUCTURE (CRITICAL - Follow exactly)
  return (
    <>
      <Head title={`Edit: ${pageTitle}`} />

      {/* Modals BEFORE main content */}
      {modalStates.addBlock && (
        <Modal
          isOpen={modalStates.addBlock}
          onOpenChange={() => closeModal('addBlock')}
          size="3xl"
          scrollBehavior="inside"
          classNames={{
            base: 'bg-content1',
            header: 'border-b border-divider',
            body: 'py-6',
            footer: 'border-t border-divider',
          }}
        >
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">Add New Block</h2>
              <p className="text-sm text-default-500">
                Select a block type to add to your page
              </p>
            </ModalHeader>
            <ModalBody className="gap-6">
              {/* Block Type Selector */}
              <div>
                <BlockTypeSelector
                  onSelect={setSelectedBlockType}
                  selectedType={selectedBlockType}
                />
              </div>

              {/* Block Configuration Form */}
              {selectedBlockType && (
                <div className="space-y-4 p-4 rounded-lg bg-default-100">
                  <h3 className="font-semibold">Configure Block</h3>
                  <Textarea
                    label="Block Configuration (JSON)"
                    placeholder='{"title": "Example", "content": "Your content here"}'
                    value={JSON.stringify(blockData, null, 2)}
                    onValueChange={(value) => {
                      try {
                        setBlockData(JSON.parse(value));
                      } catch (e) {
                        // Invalid JSON, leave as is
                      }
                    }}
                    minRows={6}
                    radius={themeRadius}
                  />
                  <p className="text-xs text-default-500">
                    Enter configuration data as JSON format
                  </p>
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button
                variant="flat"
                onPress={() => closeModal('addBlock')}
                isDisabled={saving}
              >
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={handleAddBlock}
                isDisabled={!selectedBlockType || saving}
                isLoading={saving}
              >
                Add Block
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Main content wrapper */}
      <div className="flex flex-col w-full h-full p-4" role="main" aria-label="CMS Page Builder">
        <div className="space-y-4">
          <div className="w-full">
            {/* Animated Card wrapper */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* Main Card with theme styling */}
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
                {/* Card Header with title + action buttons */}
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
                      {/* Title Section with icon */}
                      <div className="flex items-center gap-3 lg:gap-4">
                        <div
                          className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                          style={{
                            background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                            borderRadius: `var(--borderRadius, 12px)`,
                          }}
                        >
                          <PencilIcon
                            className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                            style={{ color: 'var(--theme-primary)' }}
                          />
                        </div>
                        <div>
                          <h4
                            className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}
                          >
                            {pageTitle || 'Untitled Page'}
                          </h4>
                          <p
                            className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}
                          >
                            Build and manage page blocks
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 flex-wrap">
                        {canCreate && (
                          <Button
                            color="primary"
                            variant="shadow"
                            startContent={<PlusIcon className="w-4 h-4" />}
                            onPress={() => openModal('addBlock')}
                            size={isMobile ? 'sm' : 'md'}
                          >
                            Add Block
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardBody className="p-6 space-y-6">
                  {/* Page Settings Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Page Settings</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Input
                        label="Page Title"
                        placeholder="Enter page title"
                        value={pageTitle}
                        onValueChange={setPageTitle}
                        radius={themeRadius}
                        classNames={{ inputWrapper: 'bg-default-100' }}
                      />
                      <Input
                        label="Meta Title"
                        placeholder="Enter meta title for SEO"
                        value={metaTitle}
                        onValueChange={setMetaTitle}
                        radius={themeRadius}
                        classNames={{ inputWrapper: 'bg-default-100' }}
                      />
                    </div>
                    <Textarea
                      label="Meta Description"
                      placeholder="Enter meta description for SEO"
                      value={metaDescription}
                      onValueChange={setMetaDescription}
                      minRows={2}
                      radius={themeRadius}
                      classNames={{ inputWrapper: 'bg-default-100' }}
                    />
                  </div>

                  {/* Stats Cards */}
                  <div className="grid gap-4 md:grid-cols-3">
                    {statsData.map((stat, index) => (
                      <Card key={index} className="bg-default-100">
                        <CardBody className="flex-row items-center justify-between gap-4 p-4">
                          <div className={`p-3 rounded-lg ${stat.iconBg}`}>
                            {stat.icon}
                          </div>
                          <div>
                            <p className="text-sm text-default-500">{stat.title}</p>
                            <p className="text-2xl font-bold">{stat.value}</p>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>

                  {/* Blocks Table */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Page Blocks</h3>
                    {pageBlocks.length === 0 ? (
                      <Card className="bg-default-100">
                        <CardBody className="flex items-center justify-center py-8">
                          <p className="text-default-500">
                            No blocks added yet. Click "Add Block" to get started.
                          </p>
                        </CardBody>
                      </Card>
                    ) : (
                      <Table
                        aria-label="Page blocks"
                        isHeaderSticky
                        classNames={{
                          wrapper: 'shadow-none border border-divider rounded-lg',
                          th: 'bg-default-100 text-default-600 font-semibold',
                          td: 'py-3',
                        }}
                      >
                        <TableHeader>
                          <TableColumn>Type</TableColumn>
                          <TableColumn>Status</TableColumn>
                          <TableColumn>Order</TableColumn>
                          <TableColumn align="end">Actions</TableColumn>
                        </TableHeader>
                        <TableBody>
                          {pageBlocks.map((block, index) => (
                            <TableRow key={block.id}>
                              <TableCell>{block.type}</TableCell>
                              <TableCell>
                                <Chip
                                  size="sm"
                                  color={block.is_visible ? 'success' : 'warning'}
                                  variant="flat"
                                >
                                  {block.is_visible ? 'Visible' : 'Hidden'}
                                </Chip>
                              </TableCell>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>
                                <div className="flex gap-2 justify-end">
                                  {canEdit && (
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      variant="light"
                                      onPress={() => {
                                        setEditingBlock(block);
                                        setBlockData(block.data || {});
                                        openModal('editBlock');
                                      }}
                                    >
                                      <PencilIcon className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {canEdit && (
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      variant="light"
                                      onPress={() => handleToggleVisibility(block)}
                                    >
                                      {block.is_visible ? (
                                        <EyeIcon className="w-4 h-4" />
                                      ) : (
                                        <EyeSlashIcon className="w-4 h-4" />
                                      )}
                                    </Button>
                                  )}
                                  {canDelete && (
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      variant="light"
                                      className="text-danger"
                                      onPress={() => handleDeleteBlock(block.id)}
                                    >
                                      <TrashIcon className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

// REQUIRED: Use App layout wrapper
CmsPageBuilder.layout = (page) => <App children={page} />;

export default CmsPageBuilder;