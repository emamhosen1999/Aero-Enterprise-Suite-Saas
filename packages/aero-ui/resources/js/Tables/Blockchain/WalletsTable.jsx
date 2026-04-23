import React, { useState, useMemo, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Button,
  Chip,
  Tooltip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Spinner,
  Pagination
} from "@heroui/react";
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import {
  EyeIcon,
  EyeSlashIcon,
  DocumentDuplicateIcon,
  PencilIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  ArrowsRightLeftIcon,
  BanknotesIcon
} from "@heroicons/react/24/outline";

const WalletsTable = ({
  wallets = [],
  loading = false,
  onEdit = () => {},
  onDelete = () => {},
  onTransaction = () => {},
  pagination = { currentPage: 1, perPage: 10, total: 0 },
  onPageChange = () => {},
  onRowsPerPageChange = () => {},
}) => {
  const [visibleAddresses, setVisibleAddresses] = useState(new Set());

  // Theme radius helper
  const themeRadius = useThemeRadius();
// Toggle address visibility
  const toggleAddressVisibility = useCallback((walletId) => {
    setVisibleAddresses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(walletId)) {
        newSet.delete(walletId);
      } else {
        newSet.add(walletId);
      }
      return newSet;
    });
  }, []);

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }, []);

  // Mask wallet address
  const maskAddress = useCallback((address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }, []);

  // Status color map
  const statusColorMap = {
    active: "success",
    inactive: "default",
    suspended: "warning",
    frozen: "danger"
  };

  const columns = [
    { name: "Name", uid: "name" },
    { name: "Blockchain", uid: "blockchain" },
    { name: "Address", uid: "address" },
    { name: "Balance", uid: "balance" },
    { name: "Status", uid: "status" },
    { name: "Actions", uid: "actions" },
  ];

  const renderCell = useCallback((wallet, columnKey) => {
    const cellValue = wallet[columnKey];

    switch (columnKey) {
      case "name":
        return (
          <div className="flex items-center gap-2">
            <BanknotesIcon className="w-5 h-5 text-default-500" />
            <div>
              <p className="text-bold text-small capitalize">{wallet.name}</p>
              {wallet.description && (
                <p className="text-tiny text-default-400">{wallet.description}</p>
              )}
            </div>
          </div>
        );
      case "blockchain":
        return (
          <Chip
            className="capitalize"
            color="primary"
            size="sm"
            variant="flat"
          >
            {wallet.blockchain || 'Unknown'}
          </Chip>
        );
      case "address":
        const isVisible = visibleAddresses.has(wallet.id);
        return (
          <div className="flex items-center gap-2">
            <span className="text-small font-mono">
              {isVisible ? wallet.address : maskAddress(wallet.address)}
            </span>
            <div className="flex gap-1">
              <Tooltip content={isVisible ? "Hide address" : "Show address"}>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={() => toggleAddressVisibility(wallet.id)}
                >
                  {isVisible ? 
                    <EyeSlashIcon className="w-4 h-4" /> : 
                    <EyeIcon className="w-4 h-4" />
                  }
                </Button>
              </Tooltip>
              <Tooltip content="Copy address">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={() => copyToClipboard(wallet.address)}
                >
                  <DocumentDuplicateIcon className="w-4 h-4" />
                </Button>
              </Tooltip>
            </div>
          </div>
        );
      case "balance":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small">{wallet.balance || '0.00'}</p>
            {wallet.currency && (
              <p className="text-tiny text-default-400 uppercase">{wallet.currency}</p>
            )}
          </div>
        );
      case "status":
        return (
          <Chip
            className="capitalize"
            color={statusColorMap[wallet.status] || "default"}
            size="sm"
            variant="flat"
          >
            {wallet.status || 'Unknown'}
          </Chip>
        );
      case "actions":
        return (
          <div className="relative flex justify-end items-center gap-2">
            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly size="sm" variant="light">
                  <EllipsisVerticalIcon className="w-5 h-5" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem
                  startContent={<ArrowsRightLeftIcon className="w-4 h-4" />}
                  onPress={() => onTransaction(wallet)}
                >
                  Transaction
                </DropdownItem>
                <DropdownItem
                  startContent={<PencilIcon className="w-4 h-4" />}
                  onPress={() => onEdit(wallet)}
                >
                  Edit
                </DropdownItem>
                <DropdownItem
                  key="delete"
                  className="text-danger"
                  color="danger"
                  startContent={<TrashIcon className="w-4 h-4" />}
                  onPress={() => onDelete(wallet)}
                >
                  Delete
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        return cellValue;
    }
  }, [visibleAddresses, toggleAddressVisibility, copyToClipboard, maskAddress, onEdit, onDelete, onTransaction]);

  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">
            Total {pagination.total} wallets
          </span>
        </div>
      </div>
    );
  }, [pagination.total]);

  const bottomContent = useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className="w-[30%] text-small text-default-400">
          {wallets.length > 0 ? `${((pagination.currentPage - 1) * pagination.perPage) + 1}-${Math.min(pagination.currentPage * pagination.perPage, pagination.total)} of ${pagination.total}` : ''}
        </span>
        <Pagination
          isCompact
          showControls
          showShadow
          color="primary"
          page={pagination.currentPage}
          total={Math.ceil(pagination.total / pagination.perPage)}
          onChange={onPageChange}
          radius={themeRadius}
        />
        <div className="hidden sm:flex w-[30%] justify-end gap-2">
          {/* Rows per page selector could go here */}
        </div>
      </div>
    );
  }, [pagination, wallets.length, onPageChange, getThemeRadius]);

  return (
    <Table
      aria-label="Wallets table"
      isHeaderSticky
      bottomContent={bottomContent}
      bottomContentPlacement="outside"
      classNames={{
        wrapper: "shadow-none border border-divider rounded-lg",
        th: "bg-default-100 text-default-600 font-semibold",
        td: "py-3"
      }}
      topContent={topContent}
      topContentPlacement="outside"
    >
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn
            key={column.uid}
            align={column.uid === "actions" ? "center" : "start"}
          >
            {column.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody 
        items={wallets || []}
        loadingContent={<Spinner />}
        loadingState={loading ? "loading" : "idle"}
        emptyContent="No wallets found"
      >
        {(item) => (
          <TableRow key={item.id}>
            {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default WalletsTable;