import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Pagination,
  Skeleton,
} from '@heroui/react';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';
import TaskTemplateForm from './TaskTemplateForm';

export default function TaskTemplateManager({ departments = [], initialFilters = {} }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, perPage: 20, total: 0 });
  const [filters, setFilters] = useState({
    search: initialFilters.search || '',
    department_id: initialFilters.department_id || 'all',
    is_active: initialFilters.is_active !== undefined ? initialFilters.is_active : 'all',
  });
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch templates
  const fetchTemplates = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        ...filters,
      });

      const response = await axios.get(`/hrm/task-templates?${params}`);
      setTemplates(response.data.data);
      setPagination({
        currentPage: response.data.current_page,
        perPage: response.data.per_page,
        total: response.data.total,
      });
    } catch (error) {
      showToast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates(pagination.currentPage);
  }, [filters]);

  // Handle filter changes
  const handleSearchChange = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleDepartmentFilterChange = (value) => {
    setFilters(prev => ({ ...prev, department_id: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleStatusFilterChange = (value) => {
    setFilters(prev => ({ ...prev, is_active: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Handle actions
  const handleCreate = () => {
    setSelectedTemplate(null);
    setShowFormModal(true);
  };

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setShowFormModal(true);
  };

  const handleDelete = (template) => {
    setSelectedTemplate(template);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedTemplate) return;

    setDeleteLoading(true);
    const promise = new Promise(async (resolve, reject) => {
      try {
        await axios.delete(`/hrm/task-templates/${selectedTemplate.id}`);
        await fetchTemplates(pagination.currentPage);
        setShowDeleteModal(false);
        setSelectedTemplate(null);
        resolve(['Template deleted successfully']);
      } catch (error) {
        reject(error.response?.data?.errors || ['Failed to delete template']);
      } finally {
        setDeleteLoading(false);
      }
    });

    showToast.promise(promise, {
      loading: 'Deleting template...',
      success: (data) => data.join(', '),
      error: (data) => (Array.isArray(data) ? data.join(', ') : data),
    });
  };

  const handleDuplicate = async (template) => {
    const promise = new Promise(async (resolve, reject) => {
      try {
        const response = await axios.post(`/hrm/task-templates/${template.id}/duplicate`);
        await fetchTemplates(pagination.currentPage);
        resolve(['Template duplicated successfully']);
      } catch (error) {
        reject(error.response?.data?.errors || ['Failed to duplicate template']);
      }
    });

    showToast.promise(promise, {
      loading: 'Duplicating template...',
      success: (data) => data.join(', '),
      error: (data) => (Array.isArray(data) ? data.join(', ') : data),
    });
  };

  const handleFormSuccess = () => {
    setShowFormModal(false);
    setSelectedTemplate(null);
    fetchTemplates(pagination.currentPage);
  };

  // Render columns
  const columns = [
    { key: 'name', label: 'Template Name' },
    { key: 'department', label: 'Department' },
    { key: 'role', label: 'Role' },
    { key: 'tasks_count', label: 'Tasks' },
    { key: 'is_default', label: 'Default' },
    { key: 'is_active', label: 'Status' },
    { key: 'actions', label: 'Actions' },
  ];

  const renderCell = (template, columnKey) => {
    switch (columnKey) {
      case 'name':
        return <span className="font-medium">{template.name}</span>;
      case 'department':
        return template.department?.name || <span className="text-default-400">All</span>;
      case 'role':
        return template.role || <span className="text-default-400">All</span>;
      case 'tasks_count':
        return <Chip size="sm" variant="flat">{template.tasks?.length || 0} tasks</Chip>;
      case 'is_default':
        return template.is_default ? (
          <CheckCircleIcon className="w-5 h-5 text-success" />
        ) : (
          <XCircleIcon className="w-5 h-5 text-default-300" />
        );
      case 'is_active':
        return (
          <Chip color={template.is_active ? 'success' : 'danger'} variant="flat" size="sm">
            {template.is_active ? 'Active' : 'Inactive'}
          </Chip>
        );
      case 'actions':
        return (
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly size="sm" variant="light">
                <EllipsisVerticalIcon className="w-5 h-5" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Template actions">
              <DropdownItem
                key="edit"
                startContent={<PencilIcon className="w-4 h-4" />}
                onPress={() => handleEdit(template)}
              >
                Edit
              </DropdownItem>
              <DropdownItem
                key="duplicate"
                startContent={<DocumentDuplicateIcon className="w-4 h-4" />}
                onPress={() => handleDuplicate(template)}
              >
                Duplicate
              </DropdownItem>
              <DropdownItem
                key="delete"
                className="text-danger"
                color="danger"
                startContent={<TrashIcon className="w-4 h-4" />}
                onPress={() => handleDelete(template)}
              >
                Delete
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        );
      default:
        return null;
    }
  };

  if (loading && templates.length === 0) {
    return (
      <Card>
        <CardBody className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-12 w-full rounded" />
            </div>
          ))}
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Task Templates</h2>
          <Button
            color="primary"
            startContent={<PlusIcon className="w-5 h-5" />}
            onPress={handleCreate}
          >
            Create Template
          </Button>
        </CardHeader>
        <CardBody className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search templates..."
              value={filters.search}
              onValueChange={handleSearchChange}
              startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
              classNames={{ inputWrapper: 'bg-default-100' }}
              className="flex-1"
            />
            <Select
              placeholder="All Departments"
              selectedKeys={filters.department_id !== 'all' ? [filters.department_id] : []}
              onSelectionChange={(keys) => handleDepartmentFilterChange(Array.from(keys)[0] || 'all')}
              classNames={{ trigger: 'bg-default-100' }}
              className="sm:w-64"
            >
              <SelectItem key="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id}>{dept.name}</SelectItem>
              ))}
            </Select>
            <Select
              placeholder="All Status"
              selectedKeys={filters.is_active !== 'all' ? [String(filters.is_active)] : []}
              onSelectionChange={(keys) => handleStatusFilterChange(Array.from(keys)[0] || 'all')}
              classNames={{ trigger: 'bg-default-100' }}
              className="sm:w-48"
            >
              <SelectItem key="all">All Status</SelectItem>
              <SelectItem key="true">Active</SelectItem>
              <SelectItem key="false">Inactive</SelectItem>
            </Select>
          </div>

          {/* Table */}
          <Table
            aria-label="Task templates table"
            classNames={{
              wrapper: 'shadow-none border border-divider rounded-lg',
            }}
          >
            <TableHeader columns={columns}>
              {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
            </TableHeader>
            <TableBody
              items={templates}
              emptyContent="No templates found. Create your first template to get started."
            >
              {(template) => (
                <TableRow key={template.id}>
                  {(columnKey) => <TableCell>{renderCell(template, columnKey)}</TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination.total > pagination.perPage && (
            <div className="flex justify-center">
              <Pagination
                total={Math.ceil(pagination.total / pagination.perPage)}
                page={pagination.currentPage}
                onChange={(page) => {
                  setPagination(prev => ({ ...prev, currentPage: page }));
                  fetchTemplates(page);
                }}
              />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showFormModal}
        onOpenChange={setShowFormModal}
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            {selectedTemplate ? 'Edit Template' : 'Create Template'}
          </ModalHeader>
          <ModalBody>
            <TaskTemplateForm
              template={selectedTemplate}
              departments={departments}
              onSuccess={handleFormSuccess}
              onCancel={() => setShowFormModal(false)}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <ModalContent>
          <ModalHeader>Confirm Delete</ModalHeader>
          <ModalBody>
            <p>Are you sure you want to delete "{selectedTemplate?.name}"?</p>
            <p className="text-sm text-danger">This action cannot be undone.</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              color="danger"
              onPress={confirmDelete}
              isLoading={deleteLoading}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
