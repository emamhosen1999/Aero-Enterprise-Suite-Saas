import React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableColumn, 
  TableHeader, 
  TableRow,
  Chip,
  Tooltip,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Spinner,
  Pagination
} from "@heroui/react";
import {
  PencilSquareIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";

const RolesTable = ({ 
  roles = [], 
  permissions = [],
  getRolePermissions,
  onEdit,
  onDelete,
  canManageRole,
  isMobile,
  isTablet,
  pagination,
  onPageChange,
  loading = false
}) => {
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
      { name: "ROLE", uid: "role", width: "auto", minWidth: 200 },
      { name: "DESCRIPTION", uid: "description", width: 250 },
      { name: "STATUS", uid: "status", width: 100 },
      { name: "ACTIONS", uid: "actions", width: 100 }
    ];

    if (isMobile) {
      return baseColumns.filter(col => ['sl', 'role', 'status', 'actions'].includes(col.uid));
    }

    if (isTablet) {
      return baseColumns.filter(col => !['description'].includes(col.uid));
    }
    
    return baseColumns;
  };

  const columns = getColumns();

  const renderCell = (role, columnKey, index) => {
    const startIndex = pagination?.currentPage && pagination?.perPage 
      ? Number((pagination.currentPage - 1) * pagination.perPage) 
      : 0;
    const safeIndex = typeof index === 'number' ? index : 0;
    const serialNumber = startIndex + safeIndex + 1;
    
    const rolePerms = getRolePermissions ? getRolePermissions(role.id) : [];
    const permissionNames = rolePerms
      .map(permId => permissions.find(p => p.id === permId)?.name)
      .filter(Boolean);
      
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

      case "role":
        return (
          <div className="min-w-max">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                style={{
                  background: `linear-gradient(135deg, var(--theme-primary), color-mix(in srgb, var(--theme-primary) 70%, var(--theme-secondary)))`
                }}
              >
                {role.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground text-left whitespace-nowrap">
                    {role.name}
                  </p>
                  {role.name === 'Super Administrator' && (
                    <Chip size="sm" color="warning" variant="flat">
                      System
                    </Chip>
                  )}
                </div>
                {isMobile && role.description && (
                  <p className="text-default-500 text-left text-xs truncate max-w-[150px]">
                    {role.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case "description":
        return (
          <div className="max-w-[250px]">
            <p className="text-sm text-default-600 truncate">
              {role.description || <span className="text-default-400 italic">No description</span>}
            </p>
          </div>
        );

      case "status":
        return (
          <Chip
            size="sm"
            color={role.is_active !== false ? "success" : "default"}
            variant="flat"
          >
            {role.is_active !== false ? "Active" : "Inactive"}
          </Chip>
        );

      case "actions":
        // Check if role is a protected Super Administrator role
        const isProtectedRole = ['Super Administrator', 'platform_super_administrator', 'tenant_super_administrator'].includes(role.name);
        const canManage = !isProtectedRole && (canManageRole ? canManageRole(role) : true);
        
        return (
          <div className="relative flex justify-center items-center gap-2">
            <Tooltip content={isProtectedRole ? "Protected role cannot be edited" : "Edit Role"}>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => onEdit?.(role)}
                isDisabled={!canManage}
                className={canManage ? "text-primary hover:text-primary/80" : "text-default-300 cursor-not-allowed"}
              >
                <PencilSquareIcon className="w-4 h-4" />
              </Button>
            </Tooltip>
            <Tooltip content={isProtectedRole ? "Protected role cannot be deleted" : "Delete Role"}>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => onDelete?.(role)}
                isDisabled={!canManage}
                className={canManage ? "text-danger hover:text-danger/80" : "text-default-300 cursor-not-allowed"}
              >
                <TrashIcon className="w-4 h-4" />
              </Button>
            </Tooltip>
          </div>
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
          } of {pagination.total} roles
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
              Loading roles...
            </span>
          </div>
        </div>
      )}
      
      <div className="overflow-auto grow">
        <Table
          aria-label="Roles table"
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
            items={roles || []} 
            emptyContent={
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <UserGroupIcon 
                  className="w-12 h-12 mb-4 opacity-40"
                  style={{ color: 'var(--theme-foreground)' }}
                />
                <h6 className="text-lg font-semibold mb-2" style={{ color: 'var(--theme-foreground)' }}>
                  No roles found
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
              const itemIndex = roles ? roles.findIndex(role => role.id === item.id) : 0;
              return (
                <TableRow 
                  key={item.id}
                  className="transition-all duration-200"
                  style={{
                    color: 'var(--theme-foreground)',
                    borderBottom: `1px solid color-mix(in srgb, var(--theme-content3) 30%, transparent)`,
                  }}
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

export default RolesTable;
