import React, { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Select,
  SelectItem,
  Input,
} from "@heroui/react";
import { DocumentArrowDownIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { showToast } from '@/utils/toastUtils';
import { router } from '@inertiajs/react';

const ExportUsersModal = ({ open, onClose, roles, departments, themeRadius = 'lg' }) => {
  const [filters, setFilters] = useState({
    role_id: '',
    active: '',
    department_id: '',
    from_date: '',
    to_date: '',
  });
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    const promise = new Promise(async (resolve, reject) => {
      try {
        // Build query params
        const params = new URLSearchParams();
        if (filters.role_id) params.append('role_id', filters.role_id);
        if (filters.active !== '') params.append('active', filters.active);
        if (filters.department_id) params.append('department_id', filters.department_id);
        if (filters.from_date) params.append('from_date', filters.from_date);
        if (filters.to_date) params.append('to_date', filters.to_date);

        // Trigger download
        const url = route('users.export') + '?' + params.toString();
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Wait a bit to show the toast
        setTimeout(() => {
          resolve(['Users exported successfully']);
          onClose();
          setFilters({
            role_id: '',
            active: '',
            department_id: '',
            from_date: '',
            to_date: '',
          });
        }, 1000);
      } catch (error) {
        reject([error.message || 'Failed to export users']);
      } finally {
        setIsExporting(false);
      }
    });

    showToast.promise(promise, {
      loading: 'Exporting users...',
      success: (data) => data.join(', '),
      error: (data) => Array.isArray(data) ? data.join(', ') : data,
    });
  };

  const handleClose = () => {
    if (!isExporting) {
      setFilters({
        role_id: '',
        active: '',
        department_id: '',
        from_date: '',
        to_date: '',
      });
      onClose();
    }
  };

  return (
    <Modal
      isOpen={open}
      onOpenChange={handleClose}
      size="2xl"
      scrollBehavior="inside"
      classNames={{
        base: "bg-content1",
        header: "border-b border-divider",
        body: "py-6",
        footer: "border-t border-divider",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <DocumentArrowDownIcon className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Export Users</h2>
          </div>
          <p className="text-sm text-default-500 font-normal">
            Apply filters to export specific users to CSV
          </p>
        </ModalHeader>
        
        <ModalBody>
          <div className="space-y-4">
            {/* Role Filter */}
            <Select
              label="Filter by Role"
              placeholder="All Roles"
              selectedKeys={filters.role_id ? [filters.role_id] : []}
              onSelectionChange={(keys) => setFilters({ ...filters, role_id: Array.from(keys)[0] || '' })}
              radius={themeRadius}
              classNames={{
                trigger: "bg-default-100",
              }}
            >
              <SelectItem key="">All Roles</SelectItem>
              {roles?.map((role) => (
                <SelectItem key={String(role.id)} value={String(role.id)}>
                  {role.name}
                </SelectItem>
              ))}
            </Select>

            {/* Status Filter */}
            <Select
              label="Filter by Status"
              placeholder="All Statuses"
              selectedKeys={filters.active !== '' ? [filters.active] : []}
              onSelectionChange={(keys) => setFilters({ ...filters, active: Array.from(keys)[0] || '' })}
              radius={themeRadius}
              classNames={{
                trigger: "bg-default-100",
              }}
            >
              <SelectItem key="">All Statuses</SelectItem>
              <SelectItem key="1">Active</SelectItem>
              <SelectItem key="0">Inactive</SelectItem>
            </Select>

            {/* Department Filter (if available) */}
            {departments && departments.length > 0 && (
              <Select
                label="Filter by Department"
                placeholder="All Departments"
                selectedKeys={filters.department_id ? [filters.department_id] : []}
                onSelectionChange={(keys) => setFilters({ ...filters, department_id: Array.from(keys)[0] || '' })}
                radius={themeRadius}
                classNames={{
                  trigger: "bg-default-100",
                }}
              >
                <SelectItem key="">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={String(dept.id)} value={String(dept.id)}>
                    {dept.name}
                  </SelectItem>
                ))}
              </Select>
            )}

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="date"
                label="From Date"
                placeholder="Select start date"
                value={filters.from_date}
                onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
                radius={themeRadius}
                classNames={{
                  inputWrapper: "bg-default-100",
                }}
              />
              <Input
                type="date"
                label="To Date"
                placeholder="Select end date"
                value={filters.to_date}
                onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
                radius={themeRadius}
                classNames={{
                  inputWrapper: "bg-default-100",
                }}
              />
            </div>

            <p className="text-xs text-default-400">
              * CSV file will include: ID, Name, Username, Email, Phone, Status, Roles, Email Verified, Created At
            </p>
          </div>
        </ModalBody>
        
        <ModalFooter>
          <Button
            variant="flat"
            onPress={handleClose}
            isDisabled={isExporting}
            radius={themeRadius}
            startContent={<XMarkIcon className="w-4 h-4" />}
          >
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleExport}
            isLoading={isExporting}
            radius={themeRadius}
            startContent={!isExporting && <DocumentArrowDownIcon className="w-4 h-4" />}
          >
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ExportUsersModal;
