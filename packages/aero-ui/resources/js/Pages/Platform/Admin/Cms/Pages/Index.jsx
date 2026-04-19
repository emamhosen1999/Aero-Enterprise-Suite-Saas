import React, { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Input,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Pagination,
} from '@heroui/react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  DocumentPlusIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App';
import StatsCards from '@/Components/StatsCards';
import { showToast } from '@/utils/toastUtils';

const Index = ({ title, pages, filters, stats }) => {
  const [search, setSearch] = useState(filters.search || '');
  const [status, setStatus] = useState(filters.status || '');
  const [currentPage, setCurrentPage] = useState(pages.current_page || 1);

  const palette = useMemo(() => ({
    baseText: 'text-slate-900 dark:text-white',
    mutedText: 'text-slate-600 dark:text-slate-400',
    card: 'bg-background/50 border border-slate-200 dark:border-white/10',
    header: 'border-b border-slate-200 dark:border-white/10',
  }), []);

  const handleSearch = (value) => {
    setSearch(value);
    setCurrentPage(1);
    router.get(route('admin.cms.pages.index'), {
      search: value,
      status: status || undefined,
      per_page: 20,
    }, { preserveState: true });
  };

  const handleStatusChange = (value) => {
    setStatus(value);
    setCurrentPage(1);
    router.get(route('admin.cms.pages.index'), {
      search: search || undefined,
      status: value || undefined,
      per_page: 20,
    }, { preserveState: true });
  };

  const handleDuplicate = (page) => {
    const promise = new Promise((resolve, reject) => {
      router.post(route('admin.cms.pages.duplicate', page.id), {}, {
        onSuccess: () => resolve(),
        onError: () => reject(),
      });
    });

    showToast.promise(promise, {
      loading: 'Duplicating page...',
      success: 'Page duplicated successfully',
      error: 'Failed to duplicate page',
    });
  };

  const handleDelete = (page) => {
    if (!window.confirm(`Are you sure you want to delete "${page.title}"?`)) return;

    const promise = new Promise((resolve, reject) => {
      router.delete(route('admin.cms.pages.destroy', page.id), {
        onSuccess: () => resolve(),
        onError: () => reject(),
      });
    });

    showToast.promise(promise, {
      loading: 'Deleting page...',
      success: 'Page deleted successfully',
      error: 'Failed to delete page',
    });
  };

  const statsData = useMemo(() => [
    { title: 'Total Pages', value: stats.total, icon: '📄', color: 'text-blue-500', iconBg: 'bg-blue-100 dark:bg-blue-900/30' },
    { title: 'Published', value: stats.published, icon: '✓', color: 'text-green-500', iconBg: 'bg-green-100 dark:bg-green-900/30' },
    { title: 'Drafts', value: stats.draft, icon: '📝', color: 'text-amber-500', iconBg: 'bg-amber-100 dark:bg-amber-900/30' },
    { title: 'Scheduled', value: stats.scheduled, icon: '⏰', color: 'text-purple-500', iconBg: 'bg-purple-100 dark:bg-purple-900/30' },
  ], [stats]);

  const statusColorMap = {
    published: 'success',
    draft: 'warning',
    scheduled: 'secondary',
  };

  return (
    <>
      <Head title={title} />

      <div className="flex flex-col w-full h-full p-4" role="main" aria-label="CMS Pages Management">
        <div className="space-y-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className={`${palette.card} transition-all duration-200`}>
              <CardHeader className={`${palette.header} p-0`}>
                <div className="w-full p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <DocumentPlusIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold">CMS Pages</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Create and manage your website pages</p>
                      </div>
                    </div>

                    <Button
                      as={Link}
                      href={route('admin.cms.pages.create')}
                      color="primary"
                      variant="shadow"
                      startContent={<PlusIcon className="w-4 h-4" />}
                      size="lg"
                    >
                      New Page
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardBody className="p-6">
                {/* Stats Cards */}
                <StatsCards stats={statsData} className="mb-6" />

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <Input
                    placeholder="Search pages..."
                    value={search}
                    onValueChange={handleSearch}
                    startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                    variant="bordered"
                    size="sm"
                    classNames={{ inputWrapper: 'bg-slate-50 dark:bg-slate-900/50' }}
                  />

                  <Select
                    placeholder="All Statuses"
                    selectedKeys={status ? [status] : []}
                    onSelectionChange={(keys) => handleStatusChange(Array.from(keys)[0] || '')}
                    className="sm:max-w-xs"
                    variant="bordered"
                    size="sm"
                    classNames={{ trigger: 'bg-slate-50 dark:bg-slate-900/50' }}
                  >
                    <SelectItem key="published">Published</SelectItem>
                    <SelectItem key="draft">Draft</SelectItem>
                    <SelectItem key="scheduled">Scheduled</SelectItem>
                  </Select>
                </div>

                {/* Pages Table */}
                <Table
                  aria-label="CMS pages table"
                  isHeaderSticky
                  classNames={{
                    wrapper: 'shadow-none border border-slate-200 dark:border-white/10 rounded-lg',
                    th: 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-semibold',
                    td: 'py-4',
                  }}
                >
                  <TableHeader>
                    <TableColumn key="title">Title</TableColumn>
                    <TableColumn key="slug">Slug</TableColumn>
                    <TableColumn key="status" align="center">Status</TableColumn>
                    <TableColumn key="blocks" align="center">Blocks</TableColumn>
                    <TableColumn key="updated" align="center">Updated</TableColumn>
                    <TableColumn key="actions" align="center" width="50">Actions</TableColumn>
                  </TableHeader>

                  <TableBody
                    items={pages.data}
                    emptyContent={<div className="py-8 text-center text-slate-500">No pages found</div>}
                  >
                    {(item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <p className="font-medium">{item.title}</p>
                            {item.is_homepage && (
                              <Chip size="sm" variant="flat" color="primary">
                                Homepage
                              </Chip>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">
                            /{item.slug}
                          </code>
                        </TableCell>
                        <TableCell className="text-center">
                          <Chip
                            size="sm"
                            color={statusColorMap[item.status] || 'default'}
                            variant="flat"
                          >
                            {item.status}
                          </Chip>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-semibold">{item.blocks_count}</span>
                        </TableCell>
                        <TableCell className="text-center text-xs">
                          {new Date(item.updated_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Dropdown>
                            <DropdownTrigger>
                              <Button isIconOnly size="sm" variant="light">
                                <EllipsisVerticalIcon className="w-4 h-4" />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Page actions">
                              <DropdownItem
                                key="edit"
                                startContent={<EyeIcon className="w-4 h-4" />}
                                as={Link}
                                href={route('admin.cms.pages.edit', item.id)}
                              >
                                Edit
                              </DropdownItem>
                              <DropdownItem
                                key="duplicate"
                                startContent={<DocumentDuplicateIcon className="w-4 h-4" />}
                                onPress={() => handleDuplicate(item)}
                              >
                                Duplicate
                              </DropdownItem>
                              <DropdownItem
                                key="delete"
                                className="text-danger"
                                color="danger"
                                startContent={<TrashIcon className="w-4 h-4" />}
                                onPress={() => handleDelete(item)}
                              >
                                Delete
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {pages.last_page > 1 && (
                  <div className="flex justify-center mt-6">
                    <Pagination
                      total={pages.last_page}
                      initialPage={currentPage}
                      onChange={(page) => {
                        setCurrentPage(page);
                        router.get(route('admin.cms.pages.index'), {
                          page,
                          search: search || undefined,
                          status: status || undefined,
                        }, { preserveState: true });
                      }}
                    />
                  </div>
                )}
              </CardBody>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
};

Index.layout = (page) => <App children={page} />;
export default Index;
