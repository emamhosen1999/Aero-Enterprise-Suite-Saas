import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Chip,
  Spinner,
  Pagination,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button
} from "@heroui/react";
import {
  UsersIcon,
  EnvelopeIcon
} from "@heroicons/react/24/outline";
import ProfileAvatar from '@/Components/ProfileAvatar';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils';

const UserRolesTable = ({ 
  users = [], 
  roles = [],
  onRowClick,
  onRoleChange,
  isMobile,
  isTablet,
  pagination,
  onPageChange,
  loading = false,
  context = 'tenant', // 'tenant' or 'admin'
}) => {
  const [loadingStates, setLoadingStates] = useState({});

  const setLoading = (userId, operation, isLoading) => {
    setLoadingStates(prev => ({
      ...prev,
      [`${userId}-${operation}`]: isLoading
    }));
  };

  const isLoadingState = (userId, operation) => {
    return loadingStates[`${userId}-${operation}`] || false;
  };

  // Handle role change for a user
  const handleRoleChange = async (userId, newRoleNames) => {
    setLoading(userId, 'role', true);
    const promise = new Promise(async (resolve, reject) => {
      try {
        // Use context-aware route and HTTP method for role updates
        // Admin context uses PATCH, tenant context uses POST
        const isAdminContext = context === 'admin' || context === 'platform';
        const updateRoute = isAdminContext
          ? route('admin.users.update-roles', { user: userId })
          : route('users.updateRole', { id: userId });
        
        // Admin uses PATCH, tenant uses POST
        const response = isAdminContext
          ? await axios.patch(updateRoute, { roles: newRoleNames })
          : await axios.post(updateRoute, { roles: newRoleNames });
        
        if (response.status === 200) {
          // Call parent callback to update the user in state
          if (onRoleChange) {
            onRoleChange(userId, newRoleNames);
          }
          resolve([response.data.message || 'Role updated successfully']);
        }
      } catch (error) {
        if (error.response?.status === 422) {
          reject(error.response.data.errors || ['Failed to update user role.']);
        } else {
          reject(['An unexpected error occurred. Please try again later.']);
        }
      } finally {
        setLoading(userId, 'role', false);
      }
    });
    showToast.promise(promise, {
      loading: 'Updating user role...',
      success: (data) => data.join(', '),
      error: (data) => Array.isArray(data) ? data.join(', ') : data,
    });
  };

  // Helper function to convert theme borderRadius to HeroUI radius values
  const getThemeRadius = () => {
    if (typeof window === 'undefined') return 'lg';
    const rootStyles = getComputedStyle(document.documentElement);
    const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
    const radiusValue = parseInt(borderRadius);
    if (radiusValue === 0) return 'none';
    if (radiusValue <= 4) return 'sm';
    if (radiusValue <= 8) return 'md';
    if (radiusValue <= 16) return 'lg';
    return 'full';
  };

  const getColumns = () => {
    const baseColumns = [
      { name: "#", uid: "sl", width: 60 },
      { name: "USER", uid: "user", width: "auto", minWidth: 200 },
      { name: "EMAIL", uid: "email", width: 220 },
      { name: "ASSIGNED ROLES", uid: "roles", width: "auto", minWidth: 300 },
      { name: "STATUS", uid: "status", width: 100 }
    ];

    if (isMobile) {
      return baseColumns.filter(col => ['sl', 'user', 'roles'].includes(col.uid));
    }

    if (isTablet) {
      return baseColumns.filter(col => !['status'].includes(col.uid));
    }
    
    return baseColumns;
  };

  const columns = getColumns();

  const renderCell = (user, columnKey, index) => {
    const startIndex = pagination?.currentPage && pagination?.perPage 
      ? Number((pagination.currentPage - 1) * pagination.perPage) 
      : 0;
    const safeIndex = typeof index === 'number' ? index : 0;
    const serialNumber = startIndex + safeIndex + 1;
    
    const userRoles = user.roles || [];
      
    switch (columnKey) {
      case "sl":
        return (
          <div className="flex items-center justify-center">
            <div className="flex items-center justify-center w-8 h-8 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
              <span className="text-sm font-semibold text-foreground">
                {serialNumber}
              </span>
            </div>
          </div>
        );

      case "user":
        return (
          <div className="min-w-max">
            <div className="flex items-center gap-3">
              <ProfileAvatar
                src={user.profile_image_url || user.avatar}
                name={user.name}
                size="sm"
                className="shrink-0"
              />
              <div className="flex flex-col">
                <p className="font-semibold text-foreground text-left whitespace-nowrap">
                  {user.name || 'Unknown User'}
                </p>
                {isMobile && user.email && (
                  <p className="text-default-500 text-left text-xs truncate max-w-[150px]">
                    {user.email}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case "email":
        return (
          <div className="flex items-center gap-2">
            <EnvelopeIcon className="w-4 h-4 text-default-400" />
            <span className="text-sm text-default-600">
              {user.email || 'No email'}
            </span>
          </div>
        );

      case "roles":
        // Get simple role names for display - matching UsersTable exactly
        const roleNames = userRoles.map(role => 
          typeof role === 'object' && role !== null ? role.name : role
        ) || [];
        
        // Convert the role names to a Set for selection
        const roleSet = new Set(roleNames);
        
        // Create a simple string representation of roles
        const selectedValue = Array.from(roleSet).join(", ") || "No Roles";
        
        return (
          <div className="flex items-center">
            <Dropdown 
              isDisabled={isLoadingState(user.id, 'role')}
              className="max-w-[220px]"
            >
              <DropdownTrigger>
                <Button 
                  className="capitalize"
                  variant="solid"
                  size="sm"
                  radius={getThemeRadius()}
                  startContent={isLoadingState(user.id, 'role') ? <Spinner size="sm" /> : null}
                  style={{
                    background: `var(--theme-primary, #3B82F6)`,
                    color: 'white',
                    fontFamily: `var(--fontFamily, "Inter")`,
                    borderRadius: getThemeRadius(),
                    cursor: 'pointer',
                  }}
                >
                  {selectedValue}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection={false}
                aria-label="Role selection"
                closeOnSelect={false}
                selectedKeys={roleSet}
                selectionMode="multiple"
                variant="flat"
                onSelectionChange={(keys) => {
                  const newRoles = Array.from(keys);
                  handleRoleChange(user.id, newRoles);
                }}
              >
                {(roles || []).map((role) => (
                  <DropdownItem 
                    key={typeof role === 'object' && role !== null ? role.name : role}
                  >
                    {typeof role === 'object' && role !== null ? role.name : role}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
        );

      case "status":
        return (
          <Chip
            size="sm"
            color={user.is_active !== false ? "success" : "default"}
            variant="flat"
          >
            {user.is_active !== false ? "Active" : "Inactive"}
          </Chip>
        );

      default:
        return null;
    }
  };

  const renderPagination = () => {
    if (!pagination || loading) return null;
    
    return (
      <div 
        className="flex flex-col sm:flex-row items-center justify-between px-4 py-2"
        style={{
          borderTop: `1px solid color-mix(in srgb, var(--theme-content3) 30%, transparent)`,
          background: `color-mix(in srgb, var(--theme-content2) 30%, transparent)`,
          backdropFilter: 'blur(16px)',
        }}
      >
        <span 
          className="text-xs mb-3 sm:mb-0 opacity-70"
          style={{ color: 'var(--theme-foreground)' }}
        >
          Showing {((pagination.currentPage - 1) * pagination.perPage) + 1} to {
            Math.min(pagination.currentPage * pagination.perPage, pagination.total)
          } of {pagination.total} users
        </span>
        
        <Pagination
          total={Math.ceil(pagination.total / pagination.perPage)}
          initialPage={pagination.currentPage}
          page={pagination.currentPage}
          onChange={onPageChange}
          size={isMobile ? "sm" : "md"}
          variant="bordered"
          showControls
        />
      </div>
    );
  };

  return (
    <div 
      className="w-full overflow-hidden flex flex-col relative" 
      style={{ 
        maxHeight: 'calc(100vh - 400px)',
        background: `color-mix(in srgb, var(--theme-content1) 85%, transparent)`,
        backdropFilter: 'blur(16px)',
        border: `1px solid color-mix(in srgb, var(--theme-content2) 50%, transparent)`,
        borderRadius: getThemeRadius(),
      }}
    >
      {loading && (
        <div 
          className="absolute inset-0 flex items-center justify-center z-50"
          style={{
            background: 'color-mix(in srgb, var(--theme-content1) 20%, transparent)',
            backdropFilter: 'blur(8px)',
            borderRadius: getThemeRadius(),
          }}
        >
          <div className="flex flex-col items-center gap-4 p-6">
            <Spinner size="lg" color="primary" />
            <span className="text-sm" style={{ color: 'var(--theme-foreground)' }}>
              Loading users...
            </span>
          </div>
        </div>
      )}
      
      <div className="overflow-auto grow">
        <Table
          aria-label="User roles table"
          removeWrapper
          classNames={{
            base: "bg-transparent min-w-[600px]",
            th: "backdrop-blur-md font-medium text-xs sticky top-0 z-10 whitespace-nowrap",
            td: "py-3 whitespace-nowrap",
            table: "border-collapse table-auto",
            tr: "hover:opacity-80 transition-all duration-200"
          }}
          isHeaderSticky
          isCompact={isMobile}
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn 
                key={column.uid} 
                align={column.uid === "actions" ? "center" : column.uid === "sl" ? "center" : "start"}
                width={column.width}
                minWidth={column.minWidth}
                className="backdrop-blur-md"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--theme-content2) 60%, transparent)',
                  color: 'var(--theme-foreground)',
                  borderBottom: `1px solid color-mix(in srgb, var(--theme-content3) 50%, transparent)`,
                }}
              >
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody 
            items={users || []} 
            emptyContent={
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <UsersIcon 
                  className="w-12 h-12 mb-4 opacity-40"
                  style={{ color: 'var(--theme-foreground)' }}
                />
                <h6 className="text-lg font-semibold mb-2" style={{ color: 'var(--theme-foreground)' }}>
                  No users found
                </h6>
                <p className="text-sm opacity-70" style={{ color: 'var(--theme-foreground)' }}>
                  Try adjusting your search or filter criteria
                </p>
              </div>
            }
            loadingContent={<Spinner />}
            isLoading={loading}
          >
            {(item) => {
              const itemIndex = users ? users.findIndex(user => user.id === item.id) : 0;
              return (
                <TableRow 
                  key={item.id}
                  className="transition-all duration-200 cursor-pointer hover:bg-default-100/50"
                  style={{
                    color: 'var(--theme-foreground)',
                    borderBottom: `1px solid color-mix(in srgb, var(--theme-content3) 30%, transparent)`,
                  }}
                  onClick={() => onRowClick?.(item)}
                >
                  {(columnKey) => (
                    <TableCell className="transition-all duration-300">
                      {renderCell(item, columnKey, itemIndex)}
                    </TableCell>
                  )}
                </TableRow>
              );
            }}
          </TableBody>
        </Table>
      </div>
      {renderPagination()}
    </div>
  );
};

export default UserRolesTable;
