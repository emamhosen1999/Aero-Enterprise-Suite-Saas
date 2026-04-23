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
  Pagination,
  User
} from "@heroui/react";
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import {
  EyeIcon,
  DocumentDuplicateIcon,
  ArrowTopRightOnSquareIcon,
  EllipsisVerticalIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowsRightLeftIcon
} from "@heroicons/react/24/outline";

const TransactionsTable = ({
  transactions = [],
  loading = false,
  onView = () => {},
  pagination = { currentPage: 1, perPage: 10, total: 0 },
  onPageChange = () => {},
  onRowsPerPageChange = () => {},
}) => {
  // Theme radius helper
  const themeRadius = useThemeRadius();
// Copy to clipboard
  const copyToClipboard = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }, []);

  // Format transaction hash
  const formatHash = useCallback((hash) => {
    if (!hash) return '';
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 6)}`;
  }, []);

  // Format amount
  const formatAmount = useCallback((amount, currency = 'USD') => {
    if (!amount) return '0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(amount);
  }, []);

  // Format date
  const formatDate = useCallback((date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Status color map
  const statusColorMap = {
    pending: "warning",
    confirmed: "success",
    failed: "danger",
    cancelled: "default"
  };

  // Transaction type color map
  const typeColorMap = {
    deposit: "success",
    withdrawal: "warning", 
    transfer: "primary",
    payment: "secondary"
  };

  const typeIconMap = {
    deposit: <ArrowDownIcon className="w-4 h-4" />,
    withdrawal: <ArrowUpIcon className="w-4 h-4" />,
    transfer: <ArrowsRightLeftIcon className="w-4 h-4" />,
    payment: <ArrowTopRightOnSquareIcon className="w-4 h-4" />
  };

  const columns = [
    { name: "Hash", uid: "hash" },
    { name: "Type", uid: "type" },
    { name: "From/To", uid: "fromTo" },
    { name: "Amount", uid: "amount" },
    { name: "Status", uid: "status" },
    { name: "Date", uid: "date" },
    { name: "Actions", uid: "actions" },
  ];

  const renderCell = useCallback((transaction, columnKey) => {
    const cellValue = transaction[columnKey];

    switch (columnKey) {
      case "hash":
        return (
          <div className="flex items-center gap-2">
            <span className="text-small font-mono text-default-600">
              {formatHash(transaction.hash)}
            </span>
            {transaction.hash && (
              <Tooltip content="Copy transaction hash">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={() => copyToClipboard(transaction.hash)}
                >
                  <DocumentDuplicateIcon className="w-4 h-4" />
                </Button>
              </Tooltip>
            )}
          </div>
        );
      case "type":
        return (
          <Chip
            className="capitalize"
            color={typeColorMap[transaction.type] || "default"}
            size="sm"
            variant="flat"
            startContent={typeIconMap[transaction.type] || null}
          >
            {transaction.type || 'Unknown'}
          </Chip>
        );
      case "fromTo":
        return (
          <div className="flex flex-col gap-1">
            {transaction.from_address && (
              <div className="flex items-center gap-1">
                <span className="text-tiny text-default-400">From:</span>
                <span className="text-small font-mono">
                  {formatHash(transaction.from_address)}
                </span>
              </div>
            )}
            {transaction.to_address && (
              <div className="flex items-center gap-1">
                <span className="text-tiny text-default-400">To:</span>
                <span className="text-small font-mono">
                  {formatHash(transaction.to_address)}
                </span>
              </div>
            )}
            {transaction.wallet_name && (
              <div className="flex items-center gap-1">
                <span className="text-tiny text-default-400">Wallet:</span>
                <span className="text-small">{transaction.wallet_name}</span>
              </div>
            )}
          </div>
        );
      case "amount":
        const isNegative = transaction.type === 'withdrawal' || transaction.type === 'payment';
        return (
          <div className="flex flex-col">
            <p className={`text-bold text-small ${isNegative ? 'text-danger' : 'text-success'}`}>
              {isNegative ? '-' : '+'}{formatAmount(transaction.amount)}
            </p>
            {transaction.currency && (
              <p className="text-tiny text-default-400 uppercase">{transaction.currency}</p>
            )}
          </div>
        );
      case "status":
        return (
          <Chip
            className="capitalize"
            color={statusColorMap[transaction.status] || "default"}
            size="sm"
            variant="flat"
          >
            {transaction.status || 'Unknown'}
          </Chip>
        );
      case "date":
        return (
          <div className="flex flex-col">
            <p className="text-small">{formatDate(transaction.created_at)}</p>
            {transaction.confirmed_at && transaction.status === 'confirmed' && (
              <p className="text-tiny text-default-400">
                Confirmed: {formatDate(transaction.confirmed_at)}
              </p>
            )}
          </div>
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
                  startContent={<EyeIcon className="w-4 h-4" />}
                  onPress={() => onView(transaction)}
                >
                  View Details
                </DropdownItem>
                {transaction.blockchain_explorer_url && (
                  <DropdownItem
                    startContent={<ArrowTopRightOnSquareIcon className="w-4 h-4" />}
                    onPress={() => window.open(transaction.blockchain_explorer_url, '_blank')}
                  >
                    View on Explorer
                  </DropdownItem>
                )}
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        return cellValue;
    }
  }, [formatHash, formatAmount, formatDate, copyToClipboard, onView]);

  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">
            Total {pagination.total} transactions
          </span>
        </div>
      </div>
    );
  }, [pagination.total]);

  const bottomContent = useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className="w-[30%] text-small text-default-400">
          {transactions.length > 0 ? `${((pagination.currentPage - 1) * pagination.perPage) + 1}-${Math.min(pagination.currentPage * pagination.perPage, pagination.total)} of ${pagination.total}` : ''}
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
  }, [pagination, transactions.length, onPageChange, getThemeRadius]);

  return (
    <Table
      aria-label="Transactions table"
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
        items={transactions || []}
        loadingContent={<Spinner />}
        loadingState={loading ? "loading" : "idle"}
        emptyContent="No transactions found"
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

export default TransactionsTable;