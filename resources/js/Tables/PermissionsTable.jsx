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
  Spinner,
  Pagination
} from "@heroui/react";
import {
  PencilSquareIcon,
  TrashIcon,
  KeyIcon
} from "@heroicons/react/24/outline";

const PermissionsTable = ({ 
  permissions = [], 
  onEdit,
  onDelete,
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
      { name: "NAME", uid: "name", width: "auto", minWidth: 300 },
      { name: "DESCRIPTION", uid: "description", width: "auto", minWidth: 350 },
      { name: "ACTIONS", uid: "actions", width: 100 }
    ];

    if (isMobile) {
      return baseColumns.filter(col => ['sl', 'name', 'actions'].includes(col.uid));
    }

    if (isTablet) {
      return baseColumns.filter(col => !['description'].includes(col.uid));
    }
    
    return baseColumns;
  };

  const columns = getColumns();

  const renderCell = (permission, columnKey, index) => {
    const startIndex = pagination?.currentPage && pagination?.perPage 
      ? Number((pagination.currentPage - 1) * pagination.perPage) 
      : 0;
    const safeIndex = typeof index === 'number' ? index : 0;
    const serialNumber = startIndex + safeIndex + 1;
    
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

      case "name":
        return (
          <div className="min-w-max">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                style={{
                  background: `linear-gradient(135deg, var(--theme-success), color-mix(in srgb, var(--theme-success) 70%, var(--theme-primary)))`
                }}
              >
                {permission.name ? permission.name.charAt(0).toUpperCase() : 'P'}
              </div>
              <div className="flex flex-col">
                <p className="font-semibold text-foreground text-left whitespace-nowrap">
                  {permission.name}
                </p>
              </div>
            </div>
          </div>
        );

      case "description":
        return (
          <div className="max-w-[350px]">
            <p className="text-sm text-default-600 truncate">
              {permission.description || <span className="text-default-400 italic">No description</span>}
            </p>
          </div>
        );

      case "actions":
        return (
          <div className="relative flex justify-center items-center gap-2">
            <Tooltip content="Edit Permission">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => onEdit?.(permission)}
                className="text-primary hover:text-primary/80"
              >
                <PencilSquareIcon className="w-4 h-4" />
              </Button>
            </Tooltip>
            <Tooltip content="Delete Permission">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => onDelete?.(permission)}
                className="text-danger hover:text-danger/80"
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
          } of {pagination.total} permissions
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
              Loading permissions...
            </span>
          </div>
        </div>
      )}
      
      <div className="overflow-auto grow">
        <Table
          aria-label="Permissions table"
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
            items={permissions || []} 
            emptyContent={
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <KeyIcon 
                  className="w-12 h-12 mb-4 opacity-40"
                  style={{ color: 'var(--theme-foreground)' }}
                />
                <h6 className="text-lg font-semibold mb-2" style={{ color: 'var(--theme-foreground)' }}>
                  No permissions found
                </h6>
                <p className="text-sm opacity-70" style={{ color: 'var(--theme-foreground)' }}>
                  Try adjusting your search or filter criteria
                </p>
              </div>
            }
            loadingContent={<Spinner />}
            isLoading={loading}
          >
            {(permissions || []).map((item, index) => (
              <TableRow 
                key={item.id}
                className="transition-all duration-200"
                style={{
                  color: 'var(--theme-foreground)',
                  borderBottom: `1px solid color-mix(in srgb, var(--theme-content3) 30%, transparent)`,
                }}
              >
                {columns.map((column) => (
                  <TableCell key={column.uid} className="transition-all duration-300">
                    {renderCell(item, column.uid, index)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {renderPagination()}
    </div>
  );
};

export default PermissionsTable;
