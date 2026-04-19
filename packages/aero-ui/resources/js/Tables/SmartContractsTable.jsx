import React, { useMemo, useCallback } from "react";
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
  Code
} from "@heroui/react";
import { useThemeRadius } from '@/Hooks/useThemeRadius';
import {
  EyeIcon,
  PlayIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  CodeBracketIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";

const SmartContractsTable = ({
  contracts = [],
  loading = false,
  onView = () => {},
  onInteract = () => {},
  onEdit = () => {},
  onDelete = () => {},
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

  // Format contract address
  const formatAddress = useCallback((address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }, []);

  // Format date
  const formatDate = useCallback((date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  // Contract status colors
  const statusColorMap = {
    active: "success",
    inactive: "default",
    pending: "warning",
    failed: "danger",
    paused: "warning"
  };

  // Contract type colors
  const typeColorMap = {
    erc20: "primary",
    erc721: "secondary",
    erc1155: "warning",
    defi: "success",
    dao: "purple",
    custom: "default"
  };

  // Network colors
  const networkColorMap = {
    ethereum: "primary",
    polygon: "secondary",
    bsc: "warning",
    avalanche: "danger",
    solana: "success"
  };

  const columns = [
    { name: "Contract", uid: "contract" },
    { name: "Address", uid: "address" },
    { name: "Type", uid: "type" },
    { name: "Network", uid: "network" },
    { name: "Status", uid: "status" },
    { name: "Deployed", uid: "deployed" },
    { name: "Functions", uid: "functions" },
    { name: "Actions", uid: "actions" },
  ];

  const renderCell = useCallback((contract, columnKey) => {
    const cellValue = contract[columnKey];

    switch (columnKey) {
      case "contract":
        return (
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              {contract.verified ? (
                <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                  <ShieldCheckIcon className="w-4 h-4 text-success" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center">
                  <CodeBracketIcon className="w-4 h-4 text-warning" />
                </div>
              )}
            </div>
            <div>
              <p className="text-bold text-small">{contract.name}</p>
              <div className="flex items-center gap-2">
                <p className="text-tiny text-default-400">{contract.symbol}</p>
                {contract.verified && (
                  <Chip size="sm" color="success" variant="flat" className="text-tiny px-1">
                    Verified
                  </Chip>
                )}
              </div>
            </div>
          </div>
        );
      case "address":
        return (
          <div className="flex items-center gap-2">
            <Code className="text-small font-mono bg-default-100 px-2 py-1 rounded">
              {formatAddress(contract.address)}
            </Code>
            <Tooltip content="Copy address">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => copyToClipboard(contract.address)}
              >
                <DocumentDuplicateIcon className="w-4 h-4" />
              </Button>
            </Tooltip>
          </div>
        );
      case "type":
        return (
          <Chip
            className="capitalize"
            color={typeColorMap[contract.type?.toLowerCase()] || "default"}
            size="sm"
            variant="flat"
          >
            {contract.type || 'Unknown'}
          </Chip>
        );
      case "network":
        return (
          <Chip
            className="capitalize"
            color={networkColorMap[contract.network?.toLowerCase()] || "default"}
            size="sm"
            variant="flat"
          >
            {contract.network || 'Unknown'}
          </Chip>
        );
      case "status":
        return (
          <Chip
            className="capitalize"
            color={statusColorMap[contract.status] || "default"}
            size="sm"
            variant="flat"
          >
            {contract.status || 'Unknown'}
          </Chip>
        );
      case "deployed":
        return (
          <div className="flex flex-col">
            <p className="text-small">{formatDate(contract.deployedAt)}</p>
            {contract.deployedBy && (
              <p className="text-tiny text-default-400">
                by {formatAddress(contract.deployedBy)}
              </p>
            )}
          </div>
        );
      case "functions":
        const totalFunctions = (contract.readFunctions || 0) + (contract.writeFunctions || 0);
        return (
          <div className="flex flex-col">
            <p className="text-small font-medium">{totalFunctions} total</p>
            <div className="flex gap-2 text-tiny text-default-400">
              {contract.readFunctions > 0 && <span>{contract.readFunctions} read</span>}
              {contract.writeFunctions > 0 && <span>{contract.writeFunctions} write</span>}
            </div>
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
                  onPress={() => onView(contract)}
                >
                  View Details
                </DropdownItem>
                <DropdownItem
                  startContent={<PlayIcon className="w-4 h-4" />}
                  onPress={() => onInteract(contract)}
                  isDisabled={contract.status !== 'active'}
                >
                  Interact
                </DropdownItem>
                <DropdownItem
                  startContent={<DocumentTextIcon className="w-4 h-4" />}
                  onPress={() => window.open(`/contracts/${contract.id}/abi`, '_blank')}
                >
                  View ABI
                </DropdownItem>
                {contract.explorerUrl && (
                  <DropdownItem
                    startContent={<ArrowTopRightOnSquareIcon className="w-4 h-4" />}
                    onPress={() => window.open(contract.explorerUrl, '_blank')}
                  >
                    View on Explorer
                  </DropdownItem>
                )}
                <DropdownItem
                  startContent={<PencilIcon className="w-4 h-4" />}
                  onPress={() => onEdit(contract)}
                >
                  Edit
                </DropdownItem>
                <DropdownItem
                  key="delete"
                  className="text-danger"
                  color="danger"
                  startContent={<TrashIcon className="w-4 h-4" />}
                  onPress={() => onDelete(contract)}
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
  }, [formatAddress, formatDate, copyToClipboard, onView, onInteract, onEdit, onDelete]);

  const topContent = useMemo(() => {
    const activeContracts = contracts.filter(c => c.status === 'active').length;
    const verifiedContracts = contracts.filter(c => c.verified === true).length;
    
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">
            Total {pagination.total} smart contracts
          </span>
          <div className="flex gap-2">
            <Chip size="sm" color="success" variant="flat">
              {activeContracts} Active
            </Chip>
            <Chip size="sm" color="primary" variant="flat">
              {verifiedContracts} Verified
            </Chip>
          </div>
        </div>
      </div>
    );
  }, [pagination.total, contracts]);

  const bottomContent = useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className="w-[30%] text-small text-default-400">
          {contracts.length > 0 ? `${((pagination.currentPage - 1) * pagination.perPage) + 1}-${Math.min(pagination.currentPage * pagination.perPage, pagination.total)} of ${pagination.total}` : ''}
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
  }, [pagination, contracts.length, onPageChange, getThemeRadius]);

  return (
    <Table
      aria-label="Smart contracts table"
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
        items={contracts || []}
        loadingContent={<Spinner />}
        loadingState={loading ? "loading" : "idle"}
        emptyContent="No smart contracts found"
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

export default SmartContractsTable;